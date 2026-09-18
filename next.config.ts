import type { NextConfig } from "next";

/**
 * Media strategy for GoDaddy/Cloudflare → Vercel custom domain:
 * - All WP images are mirrored under public/wp-content (same-origin).
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
};

export default nextConfig;
