import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/ui/",
        permanent: false,
      },
    ];
  },

  async rewrites() {
    return [
      // 入口：/ui 与 /ui/ 都交给静态入口
      { source: "/ui", destination: "/ui/index.html" },
      { source: "/ui/", destination: "/ui/index.html" },

      // SPA fallback：仅匹配 /ui/** 且不含 "."（排除 .js .css .png 等静态资源）
      { source: "/ui/:path((?!.*\\..*).*)", destination: "/ui/index.html" },
    ];
  },
};

export default nextConfig;
