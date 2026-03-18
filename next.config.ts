import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow all hosts and patterns for local dev images if they are uploaded via proxy
  // or served by external fake images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
