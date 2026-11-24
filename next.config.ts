import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["@prisma/client", ".prisma/client-animora"],
  outputFileTracingIncludes: {
    "/**": ["./node_modules/.prisma/client-animora/**/*"],
  },
};

export default nextConfig;
