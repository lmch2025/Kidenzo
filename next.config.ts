import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "http://localhost:81",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://c-6a281424-1445a456-4c58a1a94ae6:81",
    "http://c-6a281424-1445a456-4c58a1a94ae6:3000",
    "http://21.0.18.1:3000",
    "http://21.0.18.1:81",
    // Preview panel origins (sandbox)
    ".space-z.ai",
  ],
  async headers() {
    return [
      {
        source: "/_next/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "*" },
        ],
      },
    ];
  },
};

export default nextConfig;
