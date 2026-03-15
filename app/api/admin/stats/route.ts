// app/api/admin/stats/route.ts
// Admin-only stats endpoint. Requires ADMIN_EMAILS env var.
import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
  );
}

async function getAuthedEmail(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const supabase = await createClient();
  if (token) {
    const { data } = await supabase.auth.getUser(token);
    return data.user?.email?.toLowerCase() ?? null;
  }
  const { data } = await supabase.auth.getUser();
  return data.user?.email?.toLowerCase() ?? null;
}

export async function GET(req: Request) {
  const email = await getAuthedEmail(req);
  if (!email || !getAdminEmails().has(email)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = getSupabaseAdmin() as any;

    // Run queries in parallel
    const [
      usersResult,
      conversationsResult,
      messagesResult,
      recentRunsResult,
      moduleRankResult,
      errorRunsResult,
    ] = await Promise.all([
      // Total users
      admin.from("subscriptions").select("user_id", { count: "exact", head: true }),

      // Total conversations
      admin.from("conversations").select("id", { count: "exact", head: true }),

      // Total messages
      admin.from("messages").select("id", { count: "exact", head: true }),

      // Recent 20 module_runs
      admin
        .from("module_runs")
        .select("id, user_id, target_module, target_engine, status, latency_ms, token_usage_input, token_usage_output, error_message, created_at")
        .order("created_at", { ascending: false })
        .limit(20),

      // Module call ranking
      admin
        .from("module_runs")
        .select("target_module, status")
        .order("created_at", { ascending: false })
        .limit(2000),

      // Error runs (last 20)
      admin
        .from("module_runs")
        .select("id, user_id, target_module, target_engine, error_message, created_at")
        .eq("status", "error")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    // Compute module ranking from raw rows
    const rankMap: Record<string, { total: number; success: number; error: number }> = {};
    for (const row of moduleRankResult.data ?? []) {
      const key = row.target_module ?? "unknown";
      if (!rankMap[key]) rankMap[key] = { total: 0, success: 0, error: 0 };
      rankMap[key].total++;
      if (row.status === "error") rankMap[key].error++;
      else rankMap[key].success++;
    }
    const moduleRanking = Object.entries(rankMap)
      .map(([module, counts]) => ({ module, ...counts }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      ok: true,
      stats: {
        totalUsers: usersResult.count ?? 0,
        totalConversations: conversationsResult.count ?? 0,
        totalMessages: messagesResult.count ?? 0,
        recentRuns: recentRunsResult.data ?? [],
        moduleRanking,
        errorRuns: errorRunsResult.data ?? [],
      },
    });
  } catch (e: any) {
    console.error("[api/admin/stats]", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "Server error" }, { status: 500 });
  }
}
