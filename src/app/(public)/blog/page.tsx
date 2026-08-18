import type { Metadata } from 'next';
import { Suspense } from 'react';
import BlogPageClient from './BlogPageClient';

export const metadata: Metadata = {
  title: '보상 칼럼 & 실무 가이드 | 보상스쿨 전문 손해사정 그룹',
  description: '손해사정 실무 판례, 보험금 분쟁 해결 노하우, 의학 및 법률 보상 가이드를 알기 쉽게 전해드리는 보상스쿨 공식 칼럼입니다.',
  alternates: {
    canonical: 'https://claim-works.com/blog',
  },
  openGraph: {
    title: '보상 칼럼 & 실무 가이드 | 보상스쿨 전문 손해사정 그룹',
    description: '손해사정 실무 판례, 보험금 분쟁 해결 노하우, 의학 및 법률 보상 가이드를 알기 쉽게 전해드리는 보상스쿨 공식 칼럼입니다.',
    url: 'https://claim-works.com/blog',
    siteName: '보상스쿨 전문 손해사정 그룹',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: 'https://claim-works.com/logo.png',
        width: 500,
        height: 500,
        alt: '보상스쿨 공식 블로그 칼럼',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: '보상 칼럼 & 실무 가이드 | 보상스쿨 전문 손해사정 그룹',
    description: '손해사정 실무 판례 및 보험금 분쟁 해결 보상스쿨 공식 칼럼',
    images: ['https://claim-works.com/logo.png'],
  },
};

// useSearchParams() 사용 시 Suspense 경계가 필요
// 정적 내보내기(output: 'export') 환경에서의 필수 래퍼
function BlogFallback() {
  return (
    <div className="space-y-8">
      <div className="text-center py-16 bg-[var(--background)] dark:bg-[#202124] rounded-none border border-[var(--google-border)]">
        <div className="inline-block w-8 h-8 border-4 border-[var(--google-blue)] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">페이지 로딩 중...</p>
      </div>
    </div>
  );
}

export default function BlogListPage() {
  return (
    <Suspense fallback={<BlogFallback />}>
      <BlogPageClient />
    </Suspense>
  );
}
