import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // ID photos are uploaded through a server action.
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
