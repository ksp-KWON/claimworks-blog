import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  // 정적 사이트로 빌드 (Cloudflare Pages 배포용)
  output: isDev ? undefined : 'export',
  images: {
    // 정적 export 시 이미지 최적화 비활성화 필요
    unoptimized: true,
  },
};

export default nextConfig;
