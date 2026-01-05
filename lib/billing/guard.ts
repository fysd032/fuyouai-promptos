// src/lib/billing/guard.ts
import "server-only";
import { createClient } from "@/lib/supabase/server";

type GateFail = {
  ok: false;
  status: 401 | 403;
  code: "UNAUTHORIZED" | "SUBSCRIPTION_REQUIRED" | "SUBSCRIPTION_EXPIRED";
};

type GateOk = {
  ok: true;
  userId: string;
};

export async function requireSubscription(_opts?: { scope?: string }): Promise<GateOk | GateFail> {
  const supabase = await createClient();

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData?.user) {
    return { ok: false, status: 401, code: "UNAUTHORIZED" };
  }

  const userId = authData.user.id;

  const { data: sub, error } = await supabase
    .from("subscriptions")
    .select("status, trial_end")
    .eq("user_id", userId)
    .single();

  if (error || !sub) {
    return { ok: false, status: 403, code: "SUBSCRIPTION_REQUIRED" };
  }

  const now = new Date();
  const trialEnd = sub.trial_end ? new Date(sub.trial_end) : null;

  const allowed =
    sub.status === "active" ||
    (sub.status === "trialing" && trialEnd !== null && now < trialEnd);

  if (!allowed) {
    return { ok: false, status: 403, code: "SUBSCRIPTION_EXPIRED" };
  }

  return { ok: true, userId };
}
