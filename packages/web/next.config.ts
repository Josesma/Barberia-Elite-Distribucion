import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  devIndicators: false, // Hides the static indicator and build activity
  allowedDevOrigins: ['localhost'],
};

export default nextConfig;
