import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'euetokzwpljkjpwiypyk.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'euetokzwpljkjpwiypyk.supabase.co',
        port: '',
        pathname: '/storage/v1/object/sign/**',
      },
    ],
    // Optimization settings to reduce transformation costs
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 86400, // 24 hours cache
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
