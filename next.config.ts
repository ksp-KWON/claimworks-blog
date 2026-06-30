import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  // 정적 사이트로 빌드 (Cloudflare Pages 배포용)
  // 로컬 개발(isDev)에서는 일반 서버 모드 사용 → Next.js API Routes 활성화
  output: isDev ? undefined : 'export',
  images: {
    // 정적 export 시 이미지 최적화 비활성화 필요
    unoptimized: true,
  },
  // 개발 전용 라우트 파일(.dev.ts)은 프로덕션 빌드에서 완전히 제외
  // 로컬 개발 시에는 .dev.ts 확장자도 페이지로 인식하도록 포함
  pageExtensions: isDev
    ? ['tsx', 'ts', 'jsx', 'js', 'dev.ts', 'dev.tsx']
    : ['tsx', 'ts', 'jsx', 'js'],
  async rewrites() {
    if (!isDev) return [];
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8788/api/:path*',
      },
    ];
  },
};

export default nextConfig;
