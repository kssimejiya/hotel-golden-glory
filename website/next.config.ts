import type { NextConfig } from "next";

/**
 * Image pipeline notes:
 * - remotePatterns covers BOTH legacy Firebase Storage hosts (firebasestorage.googleapis.com,
 *   the format our existing uploads produce — see room-actions.ts) AND newer buckets
 *   provisioned on *.firebasestorage.app. Either host gets optimized through /_next/image.
 * - formats prioritises AVIF then WebP so modern browsers get the smallest payload.
 * - deviceSizes match the Tailwind breakpoints we render at (sm/md/lg/xl/2xl). Next
 *   builds one optimized variant per breakpoint and the browser picks the closest.
 * - qualities is REQUIRED in Next 16 to be an explicit allowlist; we keep 50 (blur
 *   thumb / low-DPR fallback) and 75 (the default for everything else).
 * - minimumCacheTTL = 30 days: hotel photos are basically immutable for a season, and
 *   each upload gets a unique Firebase Storage URL (timestamp + uuid) so cache busts
 *   for free when the admin replaces an image.
 */
const nextConfig: NextConfig = {
  // Allow LAN devices (phones, tablets) to load dev assets/HMR when hitting
  // the Mac's IP instead of `localhost`. Patterns are dotted segments, not
  // CIDR — `192.168.*.*` covers a typical home subnet. Without this, Next 16
  // blocks /_next/* requests cross-origin and the client hydrates partially:
  // visible HTML loads but framer-motion content stays at its `initial` state.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "*.local"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "*.firebasestorage.app" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 768, 1024, 1280, 1536],
    qualities: [50, 75],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
