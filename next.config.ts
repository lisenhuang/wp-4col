import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wordpress.org",
        pathname: "/news/wp-content/**",
      },
      {
        protocol: "https",
        hostname: "wordpress.org",
        pathname: "/news/files/**",
      },
      {
        protocol: "https",
        hostname: "*.wp.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "s.w.org",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
