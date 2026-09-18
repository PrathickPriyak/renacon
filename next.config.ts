import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
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
      // Fallback only: mirrored files in public/wp-content are served first.
      // Missing paths still proxy to renacon.in so old/rare media does not 404.
      {
        source: "/wp-content/:path*",
        destination: "https://renacon.in/wp-content/:path*",
      },
      {
        source: "/wp-includes/:path*",
        destination: "https://renacon.in/wp-includes/:path*",
      },
    ];
  },
};

export default nextConfig;
