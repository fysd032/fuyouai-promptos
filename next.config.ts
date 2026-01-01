import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "https://fuyouai-promptos.vercel.app/app",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
