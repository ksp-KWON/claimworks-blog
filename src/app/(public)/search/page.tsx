'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, Suspense } from 'react';
import PostCard from '@/components/ui/PostCard';
import PremiumHeaderBanner from '@/components/ui/PremiumHeaderBanner';
import PremiumCard from '@/components/ui/PremiumCard';
import AppIcon from '@/components/ui/AppIcon';

// 포스트 데이터 타입
type Post = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  content: string;
  category?: string;
  tags?: string[];
};

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const [results, setResults] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!q) return;

    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/posts');
        if (res.ok) {
          const allPosts: Post[] = await res.json();
          const filtered = allPosts.filter(post => {
            const query = q.toLowerCase();
            return (
              post.title?.toLowerCase().includes(query) || 
              post.summary?.toLowerCase().includes(query) ||
              post.content?.toLowerCase().includes(query) ||
              post.category?.toLowerCase().includes(query) ||
              post.tags?.some(tag => tag.toLowerCase().includes(query))
            );
          });
          setResults(filtered);
        }
      } catch (error) {
        console.error('Failed to fetch posts for search', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [q]);

  const displayResults = q ? results : [];
  const displayLoading = q ? isLoading : false;

  return (
    <div className="w-full space-y-6">
      {/* 1. 상단 브레드크럼 */}
      <nav className="flex text-xs text-[#5f6368] dark:text-[#9aa0a6]" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1.5">
          <li><Link href="/" className="hover:text-[var(--google-blue)] transition-colors">홈</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="text-[#202124] dark:text-[#e8eaed] font-medium" aria-current="page">통합 검색</li>
        </ol>
      </nav>

      {/* 2. 전역 표준 메인 헤더 배너 */}
      <PremiumHeaderBanner
        theme="blue"
        icon="search"
        title={q ? `"${q}" 통합 검색 결과` : '보상 실무 및 판례 통합 검색'}
        badges={['손해사정 실무 DB', { text: displayLoading ? '검색 중...' : `총 ${displayResults.length}건 검색됨`, color: 'gray' }]}
        description={q ? `입력하신 키워드 "${q}"와 일치하는 판례 분석, 보상 가이드 및 의학 분쟁 칼럼 검색 결과입니다.` : '교통사고, 후유장해, 질병 진단비, 판례 등 궁금하신 보상 키워드를 검색해 보세요.'}
      />

      {/* 3. 검색 결과 목록 */}
      {!displayLoading && (
        <div className="space-y-4">
          {displayResults.length > 0 ? (
            displayResults.map((post) => (
              <PostCard key={post.slug} post={post as any} variant="list" />
            ))
          ) : (
            <PremiumCard borderColor="default" hoverEffect={false} className="!p-10 sm:!p-16 text-center">
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 flex items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
                  <AppIcon name="search" size={24} />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#202124] dark:text-[#e8eaed]">
                  {q ? `"${q}"에 대한 일치하는 칼럼을 찾을 수 없습니다.` : '검색어를 입력해 주세요.'}
                </h3>
                <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-md leading-relaxed font-medium">
                  다른 키워드로 검색하시거나, 분야별 전문 보상가이드에서 관련 칼럼을 확인해 보세요.
                </p>
                <div className="pt-2">
                  <Link
                    href="/categories"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span>분야별 보상가이드 둘러보기</span>
                    <AppIcon name="chevron-right" size={13} />
                  </Link>
                </div>
              </div>
            </PremiumCard>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-gray-500">검색 엔진 로딩 중...</div>}>
      <SearchResults />
    </Suspense>
  );
}
