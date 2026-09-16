import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/projects", destination: "/projects-2", permanent: false },
      { source: "/:year(\\d{4})/:month(\\d{2})/:slug", destination: "/news/:slug", permanent: false },
    ];
  },
};

export default nextConfig;
