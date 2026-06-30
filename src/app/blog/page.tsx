import type { Metadata } from 'next';
import { Suspense } from 'react';
import BlogPageClient from './BlogPageClient';

export const metadata: Metadata = {
  title: '건강 정보 블로그 | 심평원 의료 통계 기반 전문 건강 가이드',
  description: '심평원 공공데이터를 기반으로 최신 건강 및 질병 정보를 알아보기 쉽게 정리하여 전해드리는 전문 건강 블로그입니다.',
  alternates: {
    canonical: 'https://claim-works.com/blog',
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
