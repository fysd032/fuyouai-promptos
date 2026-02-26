// app/api/invite/validate/route.ts
// Redeems an invite code using direct table operations (no RPC dependency).
// Works with the original invite_codes + invite_code_usage schema.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { bustEntitlement } from "@/lib/billing/entitlement-cache";
import { redis } from "@/lib/billing/redis";

// 邀请码格式：仅允许 4–20 位大写字母或数字
const CODE_PATTERN = /^[A-Z0-9]{4,20}$/;

// 固定窗口限流（基于 Upstash Redis INCR + EXPIRE）
// 返回 allowed=false 时请求应被拒绝
async function checkInviteRateLimit(
  uid: string,
  ip: string
): Promise<{ allowed: boolean }> {
  const WINDOW = 3600; // 1 小时窗口
  const USER_MAX = 5;  // 每用户每小时最多 5 次尝试
  const IP_MAX = 10;   // 每 IP 每小时最多 10 次尝试

  try {
    const userKey = `rl:invite:user:${uid}`;
    const ipKey   = `rl:invite:ip:${ip}`;

    const [userCount, ipCount] = await Promise.all([
      redis.incr(userKey),
      redis.incr(ipKey),
    ]);

    // 首次计数时设置过期时间
    if (userCount === 1) redis.expire(userKey, WINDOW).catch(() => {});
    if (ipCount === 1)   redis.expire(ipKey,   WINDOW).catch(() => {});

    if (userCount > USER_MAX || ipCount > IP_MAX) {
      return { allowed: false };
    }
    return { allowed: true };
  } catch {
    // Redis 不可用时 fail-open，避免阻断正常用户
    console.warn("[invite/validate] rate-limit redis error, fail-open");
    return { allowed: true };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = (body?.code ?? "").trim().toUpperCase();

    if (!code) {
      return NextResponse.json(
        { ok: false, error: "Invite code is required" },
        { status: 400 }
      );
    }

    // ── 格式校验：拒绝明显无效的输入，减少无效 DB 查询 ──────
    if (!CODE_PATTERN.test(code)) {
      return NextResponse.json(
        { ok: false, error: "Invalid invite code format" },
        { status: 400 }
      );
    }

    // ── Authenticate user ──────────────────────────────────
    const supabase = await createClient();
    let userId: string | null = null;
    let userEmail: string | null = null;

    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (token) {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        userId = data.user.id;
        userEmail = data.user.email ?? null;
      }
    }

    if (!userId) {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        userId = data.user.id;
        userEmail = data.user.email ?? null;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Narrowed to string after guard above
    const uid: string = userId;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getSupabaseAdmin() as any;

    // ── Check if user already redeemed any code ────────────
    const { data: existingUsage } = await db
      .from("invite_code_usage")
      .select("code")
      .eq("user_id", uid)
      .limit(1)
      .maybeSingle();

    if (existingUsage) {
      // Already has beta access — just bust cache and return success
      await bustEntitlement(uid);
      return NextResponse.json({
        ok: true,
        alreadyRedeemed: true,
        channel: null,
        expiresAt: null,
        trialDays: 15,
      });
    }

    // ── 暴力破解防护：限流检查（仅在用户尚未兑换时执行）──────
    const ip =
      req.headers.get("x-real-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";

    const { allowed } = await checkInviteRateLimit(uid, ip);
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    // ── Validate the invite code ───────────────────────────
    const { data: codeRow, error: codeErr } = await db
      .from("invite_codes")
      .select("active, used_count, max_uses, channel")
      .eq("code", code)
      .maybeSingle();

    if (codeErr || !codeRow) {
      return NextResponse.json(
        { ok: false, error: "Invalid invite code" },
        { status: 400 }
      );
    }

    if (!codeRow.active) {
      return NextResponse.json(
        { ok: false, error: "Invite code is disabled" },
        { status: 400 }
      );
    }

    if (codeRow.used_count >= codeRow.max_uses) {
      return NextResponse.json(
        { ok: false, error: "Invite code exhausted" },
        { status: 400 }
      );
    }

    // ── 原子递增 used_count（先占位，防并发超额）─────────────
    // 使用乐观锁：只有 used_count 仍等于读取时的值时才更新。
    // 通过 .select() 检查是否真的更新了一行；
    // 若返回 null 说明并发请求已先一步完成，本次应拒绝。
    const { data: updatedCode } = await db
      .from("invite_codes")
      .update({ used_count: codeRow.used_count + 1 })
      .eq("code", code)
      .eq("used_count", codeRow.used_count)
      .select("used_count")
      .maybeSingle();

    if (!updatedCode) {
      // 竞争失败：其他并发请求已将 used_count 推进，名额已满
      return NextResponse.json(
        { ok: false, error: "Invite code exhausted" },
        { status: 400 }
      );
    }

    // ── Record usage ───────────────────────────────────────
    // Only insert required columns (code + user_id) to avoid issues
    // if optional columns like email don't exist in production schema.
    const { error: insertErr } = await db
      .from("invite_code_usage")
      .insert({ code, user_id: uid });

    if (insertErr && insertErr.code !== "23505") {
      // 23505 = unique_violation (concurrent insert), safe to ignore
      // 其他错误：回滚 used_count，避免计数与实际兑换数不一致
      console.error("[api/invite/validate] insert error, rolling back used_count", insertErr);
      await db
        .from("invite_codes")
        .update({ used_count: codeRow.used_count })
        .eq("code", code)
        .eq("used_count", codeRow.used_count + 1);
      return NextResponse.json(
        { ok: false, error: "Failed to record usage" },
        { status: 500 }
      );
    }

    // ── Bust Redis cache so guard.ts re-checks DB immediately ─
    await bustEntitlement(uid);

    return NextResponse.json({
      ok: true,
      alreadyRedeemed: false,
      channel: codeRow.channel ?? null,
      expiresAt: null,
      trialDays: 15,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("[api/invite/validate]", e);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
