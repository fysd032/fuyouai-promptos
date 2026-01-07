import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // ✅ 主页进来就去 /app（同域名）
      {
        source: "/",
        destination: "/app/",
        permanent: false,
      },
    ];
  },

  async rewrites() {
    return [
      // ✅ 把 /app 下的访问交给 public/app/index.html（Vite build 输出）
      { source: "/app", destination: "/app/index.html" },
      { source: "/app/", destination: "/app/index.html" },
      { source: "/app/:path*", destination: "/app/index.html" },
    ];
  },
};

export default nextConfig;
