import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/": ["./data/**/*"],
    "/api/corse": ["./data/**/*"],
  },
};

export default nextConfig;
