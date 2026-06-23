import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@uar/shared"],
  // Turbopack is the default in Next.js 16; empty config silences the
  // "webpack config present but no turbopack config" warning.
  turbopack: {},
};

export default nextConfig;
