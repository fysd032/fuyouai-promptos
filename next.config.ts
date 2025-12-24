import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/app/:path*",
        destination: "https://fuyouai-promptos.vercel.app/:path*",
      },
    ];
  },
};

export default nextConfig;
