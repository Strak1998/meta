import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Production-stable configuration — Turbopack removed */
  reactStrictMode: true,
  poweredByHeader: false,

  /* Custom headers applied to every response */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
