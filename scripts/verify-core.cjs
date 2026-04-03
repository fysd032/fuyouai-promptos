const fs = require("fs");

const p = "lib/promptos/prompt-bank.generated.ts";
const s = fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";

if (!s.includes("core.task_breakdown_engine.basic")) {
  console.error("Missing core prompt key in prompt bank:", p);
  process.exit(1);
}

console.log("verify:core OK");
