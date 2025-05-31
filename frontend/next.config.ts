import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Allow browser extensions to inject scripts and inline styles
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' chrome-extension:; style-src 'self' 'unsafe-inline'; connect-src 'self' *;"
          }
        ],
      },
    ];
  },
};

export default nextConfig;
