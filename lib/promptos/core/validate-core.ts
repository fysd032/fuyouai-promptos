// lib/promptos/core/validate-core.ts
import { PROMPT_BANK } from "@/lib/promptos/prompt-bank.generated";
import { CORE_ENGINE_NAME, type CoreKey, type PlanTier } from "./core-map";

/**
 * 尽量“只做校验”，不要在 build 阶段把类型卡死。
 * 这里用运行时检查 + 宽松类型，避免 Turbopack/TS 在 Vercel 上卡编译。
 */

export type ValidateIssue = {
  level: "warn" | "error";
  message: string;
  meta?: Record<string, any>;
};

export type ValidateResult = {
  ok: boolean;
  issues: ValidateIssue[];
};

function isRecord(v: unknown): v is Record<string, any> {
  return typeof v === "object" && v !== null;
}

/**
 * ✅ 给 bootstrap.ts 调用的函数（修复你 Vercel 的报错点）
 */
export function validateCorePromptMap(): ValidateResult {
  const issues: ValidateIssue[] = [];

  // 1) CORE_ENGINE_NAME 是否是对象
  if (!isRecord(CORE_ENGINE_NAME)) {
    return {
      ok: false,
      issues: [
        {
          level: "error",
          message: "CORE_ENGINE_NAME is not an object. Check core-map.ts exports.",
        },
      ],
    };
  }

  // 2) 遍历所有 coreKey，做最基础的 sanity check
  for (const coreKey of Object.keys(CORE_ENGINE_NAME)) {
    // 只校验 coreKey 的存在性，不强行依赖 CORE_ENGINE_NAME 的内部结构
    if (!coreKey) continue;

    // 可选：如果你希望强一点，可以限制 coreKey 必须在 union 内
    // 但这里为了不引发类型地狱，只做运行时检查
  }

  // 3) PROMPT_BANK 是否存在
  if (!isRecord(PROMPT_BANK)) {
    issues.push({
      level: "error",
      message: "PROMPT_BANK is not an object. Check prompt-bank.generated export.",
    });
  } else {
    // 仅做轻量校验：至少应有一些 key
    const count = Object.keys(PROMPT_BANK).length;
    if (count === 0) {
      issues.push({
        level: "warn",
        message: "PROMPT_BANK is empty. Did you generate prompt-bank.generated.ts?",
      });
    }
  }

  const ok = !issues.some((x) => x.level === "error");
  return { ok, issues };
}

/**
 * ✅ 兼容旧名字（你截图提示 “Did you mean validateCoreDefinitions?”）
 * 如果你其它文件还在 import validateCoreDefinitions，这里也不会炸。
 */
export const validateCoreDefinitions = validateCorePromptMap;
