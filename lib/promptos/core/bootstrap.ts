import { validateCorePromptMap } from "./validate-core";

let did = false;

export async function bootstrapCore() {
  if (did) return;
  did = true;
  validateCorePromptMap();
}
