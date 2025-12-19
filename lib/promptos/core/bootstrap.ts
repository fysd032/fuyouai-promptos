// lib/promptos/core/bootstrap.ts
import { validateCorePromptMap } from "./validate-core";

let did = false;

/**
 * 在 dev 环境只跑一次，防止热更新重复报错
 */
export function bootstrapCore() {
  if (did) return;
  did = true;
  validateCorePromptMap();
}
