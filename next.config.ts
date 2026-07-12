import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
});

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['sharp'],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
      },
      {
        protocol: 'https',
        hostname: 'public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 's.alicdn.com',
      },
      {
        protocol: 'https',
        hostname: 'ae01.alicdn.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {},
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

export default withSerwist(nextConfig);
