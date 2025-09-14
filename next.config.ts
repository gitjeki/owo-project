import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nextlogistik.com',
        port: '',
        pathname: '/wms/assets/upd/**',
      },
    ],
  },
};

export default nextConfig;
