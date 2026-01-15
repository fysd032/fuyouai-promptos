import fs from "node:fs";

const file = process.argv[2] || "en-US.json";
const json = JSON.parse(fs.readFileSync(file, "utf-8"));

const hasCJK = (s) => /[\u4E00-\u9FFF]/.test(s);

function walk(obj, path = "", hits = []) {
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      walk(v, path ? `${path}.${k}` : k, hits);
    }
  } else if (typeof obj === "string") {
    if (hasCJK(obj)) hits.push({ key: path, value: obj });
  }
  return hits;
}

const hits = walk(json);

if (hits.length) {
  console.error(`❌ i18n-lint failed: found CJK text in ${file}`);
  for (const h of hits.slice(0, 50)) console.error(`- ${h.key}: ${h.value}`);
  process.exit(1);
}

console.log(`✅ i18n-lint passed: no CJK text in ${file}`);
