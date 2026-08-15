import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination:
          "http://crm-backend.crm.svc.cluster.local/api/:path*",
      },
    ];
  },
};

export default nextConfig;
