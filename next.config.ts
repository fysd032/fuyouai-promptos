/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [{ source: "/", destination: "/ui/", permanent: false }];
  },
  async rewrites() {
    return [
      { source: "/ui", destination: "/ui/index.html" },
      { source: "/ui/", destination: "/ui/index.html" },
      { source: "/ui/:path((?!.*\\..*).*)", destination: "/ui/index.html" },
    ];
  },
};

export default nextConfig;
