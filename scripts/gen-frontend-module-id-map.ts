import fs from "node:fs";
import path from "node:path";
import { moduleOrder } from "../lib/promptos/moduleOrder";

type MappingItem = { frontModuleId: string };

const mappingPath = path.join(process.cwd(),   "module_mapping.v2.json");
const outPath = path.join(process.cwd(), "lib/promptos/frontendModuleIdMap.ts");

// ---- load mapping and validate frontModuleId existence ----
const mapping: MappingItem[] = JSON.parse(fs.readFileSync(mappingPath, "utf-8"));
const mappingSet = new Set(mapping.map(x => x.frontModuleId));

const missing = moduleOrder.filter(x => !mappingSet.has(x.frontModuleId));
if (missing.length) {
  throw new Error(
    `moduleOrder contains unknown frontModuleId(s): ${missing
      .map(x => `${x.m}:${x.frontModuleId}`)
      .join(", ")}`
  );
}

// ---- validate duplicates / gaps ----
const mSet = new Set<string>();
const dupM: string[] = [];
for (const x of moduleOrder) {
  if (mSet.has(x.m)) dupM.push(x.m);
  mSet.add(x.m);
}
if (dupM.length) throw new Error(`Duplicate m keys in moduleOrder: ${dupM.join(", ")}`);

// optional: ensure m1..m31 exist
for (let i = 1; i <= 31; i++) {
  const key = `m${i}`;
  if (!mSet.has(key)) throw new Error(`Missing ${key} in moduleOrder`);
}

// ---- generate deprecated map ----
const entries = moduleOrder
  .map(x => `  ${x.m}: "${x.frontModuleId}", // ${x.labelCN}${x.labelEN ? ` (${x.labelEN})` : ""}`)
  .join("\n");

const content = `/* eslint-disable */
// ⚠️ DEPRECATED: compatibility layer for legacy m1..m31 module ids.
// ✅ AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Source of truth: lib/prompts/moduleOrder.ts + lib/prompts/module_mapping.v2.json
// Regenerate: pnpm gen:mmap (or npm run gen:mmap)

export const frontendModuleIdMap: Record<string, string> = {
${entries}
};
`;

fs.writeFileSync(outPath, content, "utf-8");
console.log("✅ generated:", outPath);

