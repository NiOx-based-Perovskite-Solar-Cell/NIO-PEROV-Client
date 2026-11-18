import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  output: "standalone",
  // /admin เปลี่ยนชื่อเป็น /dashboard
  async redirects() {
    return [
      { source: "/admin", destination: "/dashboard", permanent: false },
      { source: "/admin/:path*", destination: "/dashboard/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
