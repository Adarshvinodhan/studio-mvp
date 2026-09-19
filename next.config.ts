import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "puppeteer",
    "puppeteer-core",
    "@sparticuz/chromium-min",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
