// E:\fuyouai-projects\scripts\sync-vite-to-next.mjs
import fs from "fs";
import path from "path";

const root = process.cwd(); // 这里是 Next 项目根目录（也就是 fuyouai-projects）
const viteDist = path.join(root, "fuyouai-frontend", "dist");
const targetDir = path.join(root, "public", "app");

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

if (!fs.existsSync(viteDist)) {
  console.error(`[sync-vite] dist not found: ${viteDist}`);
  console.error(`[sync-vite] 请先在 fuyouai-frontend 执行 build 生成 dist`);
  process.exit(1);
}

console.log(`[sync-vite] copy from: ${viteDist}`);
console.log(`[sync-vite] copy to  : ${targetDir}`);

ensureDir(targetDir);
emptyDir(targetDir);
copyDir(viteDist, targetDir);

console.log("[sync-vite] done ✅");
