import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 支持 Vercel 部署的独立模式
  output: 'standalone',

  // 优化图片加载
  images: {
    unoptimized: true,
  },

  // 类型检查
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
};

export default nextConfig;
