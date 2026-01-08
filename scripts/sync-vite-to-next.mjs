// E:\fuyouai-projects\scripts\sync-vite-to-next.mjs
import fs from "fs";
import path from "path";

const root = process.cwd(); // Next 项目根目录（fuyouai-projects）

// ✅ 更稳：默认认为前端仓库和 fuyouai-projects 同级
// 你的目录如果不同，可以把 FRONTEND_DIR 改成实际路径，或设置环境变量 FRONTEND_DIR
const frontendDir =
  process.env.FRONTEND_DIR?.trim() ||
  path.resolve(root, "..", "fuyouai-frontend");

const viteDist = path.join(frontendDir, "dist");

// ✅ 改名：public/ui
const targetDir = path.join(root, "public", "ui");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function emptyDir(p) {
  if (!fs.existsSync(p)) return;
  for (const entry of fs.readdirSync(p)) {
    const full = path.join(p, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      emptyDir(full);
      fs.rmdirSync(full);
    } else {
      fs.unlinkSync(full);
    }
  }
}

function copyDir(src, dest) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src)) {
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    const stat = fs.statSync(s);
    if (stat.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

// ✅ 强校验：防止 “dist 是好的，但 public/ui/index.html 被替换/改坏” 导致白屏
function assertIndexHtmlOk(indexHtmlPath) {
  if (!fs.existsSync(indexHtmlPath)) {
    throw new Error(`[sync-vite] missing file: ${indexHtmlPath}`);
  }

  const html = fs.readFileSync(indexHtmlPath, "utf8");

  // 需要有 root
  const hasRoot =
    html.includes('id="root"') || html.includes("id='root'");

  // 需要有入口 module script，且 src 指向 assets/（Vite build 的典型输出）
  const hasModuleScript = /<script[^>]+type=["']module["'][^>]*src=["'][^"']*assets\/[^"']+["']/.test(
    html
  );

  if (!hasRoot || !hasModuleScript) {
    const hint = [
      "[sync-vite] index.html 校验失败（会导致 200 白屏）：",
      `- file: ${indexHtmlPath}`,
      `- hasRoot: ${hasRoot}`,
      `- hasModuleScript(assets/*): ${hasModuleScript}`,
      "",
      "说明 public/ui/index.html 不是 Vite dist 原样产物，或者入口脚本被改坏/丢失。",
      "请确保你同步的是 fuyouai-frontend/dist 的原始输出。",
    ].join("\n");
    throw new Error(hint);
  }
}

if (!fs.existsSync(viteDist)) {
  console.error(`[sync-vite] dist not found: ${viteDist}`);
  console.error(
    `[sync-vite] 请先在前端仓库执行 build 生成 dist：\n  cd ${frontendDir}\n  npm run build`
  );
  process.exit(1);
}

console.log(`[sync-vite] frontendDir: ${frontendDir}`);
console.log(`[sync-vite] copy from  : ${viteDist}`);
console.log(`[sync-vite] copy to    : ${targetDir}`);

ensureDir(targetDir);
emptyDir(targetDir);
copyDir(viteDist, targetDir);

// ✅ 同步后立刻校验，失败就直接退出（杜绝再白屏）
try {
  assertIndexHtmlOk(path.join(targetDir, "index.html"));
} catch (e) {
  console.error(String(e?.message || e));
  process.exit(1);
}

console.log("[sync-vite] done ✅");
