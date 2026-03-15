/**
 * lib/db/conversations.ts
 * Server-only helpers for conversations / messages / module_runs.
 * All writes use the admin client (bypasses RLS) — caller must
 * ensure userId is verified via auth before calling.
 */
import "server-only";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/** Create a new conversation and return its id. */
export async function createConversation(
  userId: string,
  opts: { title?: string; source?: string; currentModule?: string }
): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdmin() as any;
  const title = opts.title
    ? opts.title.slice(0, 120)
    : null;

  const { data, error } = await admin
    .from("conversations")
    .insert({
      user_id: userId,
      title,
      source: opts.source ?? "core",
      current_module: opts.currentModule ?? null,
      status: "active",
    })
    .select("id")
    .single();

  if (error) throw new Error(`[db] createConversation: ${error.message}`);
  return data.id as string;
}

/** Append user + assistant message pair to a conversation. */
export async function appendMessages(params: {
  conversationId: string;
  userId: string;
  userContent: string;
  assistantContent: string;
  moduleName?: string;
  engineName?: string;
}): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdmin() as any;

  const { error } = await admin.from("messages").insert([
    {
      conversation_id: params.conversationId,
      user_id: params.userId,
      role: "user",
      content: params.userContent,
      module_name: params.moduleName ?? null,
    },
    {
      conversation_id: params.conversationId,
      user_id: params.userId,
      role: "assistant",
      content: params.assistantContent,
      engine_name: params.engineName ?? null,
      module_name: params.moduleName ?? null,
    },
  ]);

  if (error) throw new Error(`[db] appendMessages: ${error.message}`);

  // Touch updated_at on the parent conversation
  await admin
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", params.conversationId);
}

/** Write a module_run record and return its id. */
export async function createModuleRun(params: {
  userId: string;
  conversationId: string | null;
  inputText: string;
  targetEngine: string;
  targetModule: string;
  finalOutput: string;
  latencyMs: number;
  status?: string;
  errorMessage?: string;
  tokenUsageInput?: number;
  tokenUsageOutput?: number;
}): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdmin() as any;

  const { data, error } = await admin
    .from("module_runs")
    .insert({
      user_id: params.userId,
      conversation_id: params.conversationId,
      input_text: params.inputText,
      target_engine: params.targetEngine,
      target_module: params.targetModule,
      final_output: params.finalOutput,
      latency_ms: params.latencyMs,
      status: params.status ?? "success",
      error_message: params.errorMessage ?? null,
      token_usage_input: params.tokenUsageInput ?? null,
      token_usage_output: params.tokenUsageOutput ?? null,
    })
    .select("id")
    .single();

  if (error) throw new Error(`[db] createModuleRun: ${error.message}`);
  return data.id as string;
}

/**
 * Record a failed run (no conversation created, no messages written).
 * Only writes a module_run row with status='error'.
 */
export async function recordFailedRun(params: {
  userId: string;
  conversationId: string | null;
  userInput: string;
  coreKey: string;
  engineType: string;
  errorMessage: string;
  latencyMs: number;
}): Promise<void> {
  try {
    await createModuleRun({
      userId: params.userId,
      conversationId: params.conversationId,
      inputText: params.userInput,
      targetEngine: params.engineType,
      targetModule: params.coreKey,
      finalOutput: "",
      latencyMs: params.latencyMs,
      status: "error",
      errorMessage: params.errorMessage,
    });
  } catch (e) {
    console.error("[db] recordFailedRun:", e);
  }
}

/**
 * Record a full core run:
 *  - Creates or reuses a conversation
 *  - Writes user + assistant messages
 *  - Writes module_run
 * Returns the conversation_id for the client to pass on next calls.
 */
export async function recordCoreRun(params: {
  userId: string;
  conversationId: string | null; // null = start new conversation
  userInput: string;
  coreKey: string;
  engineType: string;
  output: string;
  latencyMs: number;
  tokenUsageInput?: number;
  tokenUsageOutput?: number;
}): Promise<{ conversationId: string; runId: string }> {
  const title = params.userInput.slice(0, 80).replace(/\s+/g, " ").trim();
  const conversationId =
    params.conversationId ??
    (await createConversation(params.userId, {
      title,
      source: "core",
      currentModule: params.coreKey,
    }));

  await appendMessages({
    conversationId,
    userId: params.userId,
    userContent: params.userInput,
    assistantContent: params.output,
    moduleName: params.coreKey,
    engineName: params.engineType,
  });

  const runId = await createModuleRun({
    userId: params.userId,
    conversationId,
    inputText: params.userInput,
    targetEngine: params.engineType,
    targetModule: params.coreKey,
    finalOutput: params.output,
    latencyMs: params.latencyMs,
    tokenUsageInput: params.tokenUsageInput,
    tokenUsageOutput: params.tokenUsageOutput,
  });

  return { conversationId, runId };
}
