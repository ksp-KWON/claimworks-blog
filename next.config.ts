import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  // 정적 사이트로 빌드 (Cloudflare Pages 배포용)
  output: isDev ? undefined : 'export',
  images: {
    // 정적 export 시 이미지 최적화 비활성화 필요
    unoptimized: true,
  },
  // 로컬 개발(next dev) 환경에서만 법제처 API 프록시(Rewrite) 설정 활성화
  ...(isDev ? {
    async rewrites() {
      const lawApiKey = process.env.LAW_API_KEY || 'ksp78';
      return [
        {
          source: '/api/precedent',
          destination: `https://www.law.go.kr/DRF/lawSearch.do?target=prec&type=XML&OC=${lawApiKey}&search=2`,
        },
        {
          source: '/api/precedent-detail',
          destination: `https://www.law.go.kr/DRF/lawService.do?target=prec&type=XML&OC=${lawApiKey}`,
        },
      ];
    }
  } : {}),
};

export default nextConfig;
