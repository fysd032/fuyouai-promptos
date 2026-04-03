// app/api/conversations/[id]/route.ts
// GET    /api/conversations/:id  — fetch messages of one conversation
// DELETE /api/conversations/:id  — delete conversation + cascade messages + runs
import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

async function getUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const supabase = await createClient();
  if (token) {
    const { data } = await supabase.auth.getUser(token);
    return data.user?.id ?? null;
  }
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = getSupabaseAdmin() as any;

    // Verify ownership
    const { data: conv, error: convErr } = await admin
      .from("conversations")
      .select("id, title, source, current_module, status, created_at, updated_at")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (convErr || !conv) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const { data: messages, error: msgErr } = await admin
      .from("messages")
      .select("id, role, content, engine_name, module_name, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (msgErr) throw msgErr;

    return NextResponse.json({ ok: true, conversation: conv, messages: messages ?? [] });
  } catch (e: any) {
    console.error("[api/conversations/:id] GET error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = getSupabaseAdmin() as any;

    // Verify ownership before delete
    const { data: conv } = await admin
      .from("conversations")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (!conv) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    // Cascade: messages + module_runs nullify conversation_id (via FK ON DELETE SET NULL / CASCADE)
    const { error } = await admin
      .from("conversations")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[api/conversations/:id] DELETE error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "Server error" }, { status: 500 });
  }
}
