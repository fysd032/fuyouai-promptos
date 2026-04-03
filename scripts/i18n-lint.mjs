#!/usr/bin/env node
/**
 * i18n-lint.mjs
 * Usage: node scripts/i18n-lint.mjs <lang> [<lang2> ...]
 * Example: node scripts/i18n-lint.mjs ja
 *          node scripts/i18n-lint.mjs ja de
 *
 * Checks if specified language(s) cover all keys from en.i18n.json.
 * Exits with code 1 if any keys are missing (CI-friendly).
 */

import fs from "node:fs";
import path from "node:path";

const langs = process.argv.slice(2);

if (langs.length === 0) {
  console.error("Usage: node scripts/i18n-lint.mjs <lang> [<lang2> ...]");
  console.error("Example: node scripts/i18n-lint.mjs ja de");
  process.exit(1);
}

const root = process.cwd();
const dir = path.join(root, "messages");
const enPath = path.join(dir, "en.i18n.json");

function readJson(p) {
  if (!fs.existsSync(p)) return null;
  try {
    let s = fs.readFileSync(p, "utf8");
    s = s.replace(/^\uFEFF/, ""); // 去 BOM
    return JSON.parse(s);
  } catch (e) {
    console.error(`Error reading JSON from: ${p}`);
    console.error(`  Reason: ${e.message}`);
    return null;
  }
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

// Read English source
const en = readJson(enPath);
if (!en) {
  console.error(`❌ Error: Cannot read ${enPath}`);
  process.exit(1);
}

const enFlat = flatten(en);
const enKeys = Object.keys(enFlat);

let hasErrors = false;

console.log(`\n📋 i18n-lint: Checking ${langs.length} language(s) against en.i18n.json`);
console.log(`   English keys: ${enKeys.length}\n`);

for (const lang of langs) {
  const langPath = path.join(dir, `${lang}.i18n.json`);
  const langData = readJson(langPath);

  if (!langData) {
    console.error(`❌ ${lang}: File not found or invalid: ${langPath}`);
    hasErrors = true;
    continue;
  }

  const langFlat = flatten(langData);
  const missingKeys = enKeys.filter((k) => !(k in langFlat));

  if (missingKeys.length > 0) {
    console.error(`❌ ${lang}: Missing ${missingKeys.length} key(s)`);
    for (const key of missingKeys.slice(0, 10)) {
      console.error(`   - ${key}`);
    }
    if (missingKeys.length > 10) {
      console.error(`   ... and ${missingKeys.length - 10} more`);
    }
    hasErrors = true;
  } else {
    const coverage = ((Object.keys(langFlat).length / enKeys.length) * 100).toFixed(1);
    console.log(`✅ ${lang}: All ${enKeys.length} keys covered (${coverage}%)`);
  }
}

console.log("");

if (hasErrors) {
  console.error("❌ i18n-lint failed: Some languages have missing keys.");
  console.error("   Run: node scripts/i18n-sync.mjs <lang> to generate missing keys file.");
  process.exit(1);
}

console.log("✅ i18n-lint passed: All languages fully cover en.i18n.json");
process.exit(0);
