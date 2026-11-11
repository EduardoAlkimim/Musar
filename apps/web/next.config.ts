import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@escola/domain"],
  experimental: { optimizePackageImports: ["@phosphor-icons/react"] },
};

export default config;
