import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/app",
        destination: "/app/index.html",
      },
      {
        source: "/app/:path*",
        destination: "/app/:path*",
      },
    ];
  },
};

export default nextConfig;
