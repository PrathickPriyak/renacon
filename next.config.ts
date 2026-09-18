import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "img-src 'self' https: data: blob:",
      "font-src 'self' https: data:",
      "style-src 'self' 'unsafe-inline' https:",
      "script-src 'self' 'unsafe-inline' https://dimensions.involve.me https://www.googletagmanager.com https://www.google-analytics.com",
      "connect-src 'self' https:",
      "frame-src 'self' https://dimensions.involve.me https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "renacon.in", pathname: "/wp-content/**" },
      { protocol: "https", hostname: "www.renacon.in", pathname: "/wp-content/**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
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
      // Proxy WordPress media when pages use root-relative /wp-content paths
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
