import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // GitHub Pages configuration
  output: 'export',
  basePath: '/StellarChoice',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  
  // Remove headers() as it's not compatible with static export
};

export default nextConfig;
