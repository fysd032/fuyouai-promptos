#!/usr/bin/env node
/**
 * i18n-sync.mjs
 * Usage: node scripts/i18n-sync.mjs <lang>
 * Example: node scripts/i18n-sync.mjs ja
 *          node scripts/i18n-sync.mjs de
 *
 * Reads messages/en.i18n.json as the source of truth,
 * generates <lang>.i18n.json (merged) and <lang>.i18n.missing.json (keys needing translation).
 */

import fs from "node:fs";
import path from "node:path";

const lang = process.argv[2];

if (!lang) {
  console.error("Usage: node scripts/i18n-sync.mjs <lang>");
  console.error("Example: node scripts/i18n-sync.mjs ja");
  process.exit(1);
}

const root = process.cwd();
const dir = path.join(root, "messages");

const enPath = path.join(dir, "en.i18n.json");
const langPath = path.join(dir, `${lang}.i18n.json`);
const missingPath = path.join(dir, `${lang}.i18n.missing.json`);

function readJson(p) {
  if (!fs.existsSync(p)) return {};
  try {
    let s = fs.readFileSync(p, "utf8");
    s = s.replace(/^\uFEFF/, ""); // 去 BOM
    return JSON.parse(s);
  } catch (e) {
    console.error(`Error reading JSON from: ${p}`);
    console.error(`  Reason: ${e.message}`);
    return {};
  }
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n", "utf8");
}

// Flatten nested object to dot-notation keys
function flatten(obj, prefix = "", result = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      flatten(value, fullKey, result);
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

// Unflatten dot-notation keys back to nested object
function unflatten(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const parts = key.split(".");
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in current)) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
}

// Read source and target
const en = readJson(enPath);
const target = readJson(langPath);

if (Object.keys(en).length === 0) {
  console.error(`Error: ${enPath} is empty or missing.`);
  process.exit(1);
}

// Flatten for comparison
const enFlat = flatten(en);
const targetFlat = flatten(target);

// Find missing keys
const missingFlat = {};
for (const key of Object.keys(enFlat)) {
  if (!(key in targetFlat)) {
    missingFlat[key] = enFlat[key]; // Use English as placeholder
  }
}

// Merge: English as fallback, target overwrites
const mergedFlat = { ...enFlat, ...targetFlat };

// Write outputs
const missing = unflatten(missingFlat);
const merged = unflatten(mergedFlat);

writeJson(missingPath, missing);
writeJson(langPath, merged);

const missingCount = Object.keys(missingFlat).length;
const totalCount = Object.keys(enFlat).length;

console.log(`\n✅ i18n-sync completed for "${lang}"`);
console.log(`   Total keys: ${totalCount}`);
console.log(`   Missing keys: ${missingCount}`);
console.log(`   Coverage: ${((totalCount - missingCount) / totalCount * 100).toFixed(1)}%`);
console.log(`\n   Written:`);
console.log(`   - ${langPath}`);
console.log(`   - ${missingPath}`);

if (missingCount > 0) {
  console.log(`\n   💡 Tip: Translate keys in ${lang}.i18n.missing.json, then run this script again.`);
}
