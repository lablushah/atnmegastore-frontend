import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  compress: true,
  allowedDevOrigins: ["atnmegastore.shop", "www.atnmegastore.shop"],
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', '@tiptap/react'],
  },
  // Proxy /storage/* to the backend so Next.js Image optimizer treats them as
  // local paths (bypasses the SSRF / private-IP block added in Next.js 15+).
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000';
    return [
      {
        source: "/storage/:path*",
        destination: `${backendUrl}/storage/:path*`,
      },
    ];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 128, 256, 384],
    localPatterns: [
      { pathname: "/storage/**" },
    ],
    remotePatterns: [
      { protocol: "https", hostname: "**", pathname: "/**" },
    ],
  },
};

export default withNextIntl(nextConfig);
