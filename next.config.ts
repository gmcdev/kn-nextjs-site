import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/site',
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['192.168.1.93'],
};

export default nextConfig;
