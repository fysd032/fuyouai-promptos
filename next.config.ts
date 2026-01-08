/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // 把所有 /ui 访问都导回首页（地址栏也会变成 /）
      { source: "/ui", destination: "/", permanent: true },
      { source: "/ui/:path*", destination: "/", permanent: true },
    ];
  },

  // 不再需要 SPA rewrites（否则还会去找 /ui/index.html）
  async rewrites() {
    return [];
  },
};

export default nextConfig;
