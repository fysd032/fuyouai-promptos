// lib/promptos/core/bootstrap.ts
import { validateCorePromptMap } from "./validate-core";

let bootstrapped = false;

/**
 * 在 /api/core/run 真实链路启用时调用：
 * - 做一次轻量校验（PROMPT_BANK/CORE_ENGINE_NAME 结构是否正常）
 * - 不通过不阻断（只抛 error 的话你线上就直接挂），这里选择：
 *   - 有 error -> 直接 throw，让 API 明确失败（你也可以改成 warn）
 */
export async function bootstrapCore() {
  if (bootstrapped) return;
  bootstrapped = true;

  const result = validateCorePromptMap();

  if (!result.ok) {
    const detail = result.issues
      .map((i) => `[${i.level}] ${i.message}${i.meta ? ` ${JSON.stringify(i.meta)}` : ""}`)
      .join("\n");

    // 这里抛错：能让 /api/core/run 在 “真实链路” 下尽早发现配置问题
    throw new Error(`Core bootstrap validation failed:\n${detail}`);
  }
}
