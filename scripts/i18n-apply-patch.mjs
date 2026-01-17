import fs from "node:fs";

const baseFile = process.argv[2];   // en-US.json
const patchFile = process.argv[3];  // i18n_patch.json
const outFile = process.argv[4] || "en-US.fixed.json";

if (!baseFile || !patchFile) {
  console.error("Usage: node i18n-apply-patch.mjs <base.json> <patch.json> [out.json]");
  process.exit(1);
}

const base = JSON.parse(fs.readFileSync(baseFile, "utf-8"));
const patch = JSON.parse(fs.readFileSync(patchFile, "utf-8")); // { "a.b.c": "new text", ... }

function setByPath(obj, dotted, value) {
  const parts = dotted.split(".");
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in cur)) return false;
    cur = cur[parts[i]];
  }
  const last = parts[parts.length - 1];
  if (!(last in cur)) return false;
  cur[last] = value;
  return true;
}

let ok = 0, fail = 0;
for (const [k, v] of Object.entries(patch)) {
  if (setByPath(base, k, v)) ok++;
  else fail++;
}

fs.writeFileSync(outFile, JSON.stringify(base, null, 2), "utf-8");
console.log(`Applied patch: ok=${ok}, fail=${fail}. Output: ${outFile}`);
if (fail) process.exit(2);

