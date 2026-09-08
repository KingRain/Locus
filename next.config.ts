import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ws"],
  agentRules: false,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
