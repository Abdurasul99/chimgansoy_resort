import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable HTTP response compression at the Node layer (nginx also gzips, but
  // this catches cases where the upstream isn't proxied through nginx).
  compress: true,

  // Trim observable surface area: drop "X-Powered-By: Next.js" header (saves
  // ~30 bytes per response + closes a fingerprinting vector).
  poweredByHeader: false,

  images: {
    // Modern formats — browsers that don't support AVIF fall back to WebP, then JPEG.
    // Cuts hero/room photo bytes by 30-50% vs the source JPEGs.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  // Long-lived browser cache for hashed static assets — they're content-addressed
  // so safe to cache for a year. Public images get a week; HTML pages stay
  // revalidate-on-request (default Next.js behavior). Nginx still has the final
  // say in front of us, this is the default fallback.
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
      {
        source: "/icon.svg",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400" }],
      },
    ];
  },
};

export default nextConfig;
