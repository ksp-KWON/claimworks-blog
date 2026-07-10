'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Suspense } from 'react';

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
              post.title.toLowerCase().includes(query) || 
              post.summary.toLowerCase().includes(query) ||
              post.content.toLowerCase().includes(query) ||
              (post.category && post.category.toLowerCase().includes(query)) ||
              (post.tags && post.tags.some(tag => tag.toLowerCase().includes(query)))
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

  // q가 없을 때는 상태에 상관없이 빈 배열 및 로딩 해제 처리 (렌더링 계산 위임으로 린트 에러 해결)
  const displayResults = q ? results : [];
  const displayLoading = q ? isLoading : false;

  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--google-border)] pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-[#202124] dark:text-[#e8eaed]">
          {q ? (
            <><span className="text-[var(--google-blue)]">&quot;{q}&quot;</span> 검색 결과</>
          ) : (
            <>검색어를 입력해주세요</>
          )}
        </h1>
        <p className="text-[#5f6368] dark:text-[#9aa0a6] mt-2">
          {displayLoading ? '검색 중...' : `총 ${displayResults.length}건의 문서가 검색되었습니다.`}
        </p>
      </div>

      {!displayLoading && (
        <div className="space-y-4 px-3 sm:px-0">
          {displayResults.length > 0 ? (
            displayResults.map((post) => (
              <article
                key={post.slug}
                className="bg-white dark:bg-[#202124] rounded-none border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow p-5 sm:p-6"
              >
                <Link href={`/blog/${post.slug}`} className="block group">
                  <h3 className="text-xl sm:text-2xl font-bold text-[#202124] dark:text-[#e8eaed] mb-2 group-hover:text-[var(--google-blue)] transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm sm:text-base text-[#5f6368] dark:text-[#9aa0a6] line-clamp-2 leading-relaxed">
                    {post.summary}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-none">
                      {post.date}
                    </span>
                  </div>
                </Link>
              </article>
            ))
          ) : (
            <div className="text-center py-16 bg-white dark:bg-[#202124] rounded-none sm:rounded-none border-y sm:border border-gray-100 dark:border-white/5 shadow-sm">
              <svg className="w-12 h-12 text-[#dadce0] dark:text-[#5f6368] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <p className="text-sm font-bold tracking-wide text-[#5f6368] dark:text-[#9aa0a6]">
                일치하는 검색 결과가 없습니다.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading search...</div>}>
      <SearchResults />
    </Suspense>
  );
}
