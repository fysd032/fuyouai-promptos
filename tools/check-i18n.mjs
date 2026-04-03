
import fs from "node:fs";

const zh = JSON.parse(fs.readFileSync("public/locales/zh-CN.json", "utf8"));
const en = JSON.parse(fs.readFileSync("public/locales/en-US.json", "utf8"));

function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

const zhFlat = flatten(zh);
const enFlat = flatten(en);

const missing = [];
for (const k of Object.keys(zhFlat)) {
  if (!(k in enFlat)) missing.push(k);
}

const empty = [];
for (const [k, v] of Object.entries(enFlat)) {
  if (typeof v === "string" && v.trim() === "") empty.push(k);
}

console.log("Missing keys:", missing.length);
if (missing.length) console.log(missing.slice(0, 30));

console.log("Empty strings:", empty.length);
if (empty.length) console.log(empty.slice(0, 30));

process.exit(missing.length ? 1 : 0);