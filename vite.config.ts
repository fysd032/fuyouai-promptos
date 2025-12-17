import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "https://fuyouai-promptos.vercel.app",
        changeOrigin: true,
        secure: true,
        // secure: false 也可以，HTTPS 问题时再调
      },
    },
  },
});
