import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { HttpsProxyAgent } from "https-proxy-agent";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  const API_TARGET = env.VITE_API_BASE || "https://fuyouai-promptos.vercel.app";
  const CLASH_PROXY = env.VITE_HTTP_PROXY; // 不给就不走代理

  const agent = CLASH_PROXY ? new HttpsProxyAgent(CLASH_PROXY) : undefined;

  return {
    base: "./",
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        "/api": {
          target: API_TARGET,
          changeOrigin: true,
          secure: true,
          // 如果你在国内需要走 clash 之类代理访问 vercel，就打开这行
          agent,
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
  };
});
