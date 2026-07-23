import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for GitHub Pages (same custom domain as the old Flutter site).
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
