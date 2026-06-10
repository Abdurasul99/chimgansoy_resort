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
    // Security headers applied site-wide via the catch-all `(.*)`. These follow
    // OWASP "Secure Headers" 2024 recommendations + Vercel's already-set HSTS.
    const SECURITY_HEADERS = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        // Lock down browser features we don't use. Camera/microphone/geolocation
        // are explicitly denied; opens up only what the site actually needs.
        value:
          "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
      },
      { key: "X-DNS-Prefetch-Control", value: "on" },
    ];

    return [
      {
        // Apply security headers to every route. Cache-Control overrides below
        // are layered on top via more-specific source patterns.
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
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
