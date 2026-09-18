import type { NextConfig } from "next";

/**
 * Media strategy for GoDaddy/Cloudflare → Vercel custom domain:
 * - WP images live under public/assets/wp-content (same-origin).
 * - Legacy /wp-content/* URLs rewrite to /assets/wp-content/* so markup stays compatible.
 * - Do NOT rewrite /wp-content to https://renacon.in — once DNS points here,
 *   that rewrite becomes a self-loop and breaks images.
 */
const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    // Allow transitional absolute URLs if any markup still points at the old host.
    remotePatterns: [
      { protocol: "https", hostname: "renacon.in", pathname: "/wp-content/**" },
      { protocol: "https", hostname: "www.renacon.in", pathname: "/wp-content/**" },
    ],
  },
  async redirects() {
    return [
      { source: "/projects", destination: "/projects-2/", permanent: false },
      {
        source: "/:year(\\d{4})/:month(\\d{2})/:slug",
        destination: "/news/:slug/",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/wp-content/:path*",
        destination: "/assets/wp-content/:path*",
      },
      {
        source: "/wp-includes/:path*",
        destination: "/assets/wp-includes/:path*",
      },
    ];
  },
};

export default nextConfig;
