'use client';

/**
 * BlogPageClient
 *
 * 정적 내보내기(output: 'export') 환경에서 URL 파라미터(?region=)를 처리하기 위해
 * 클라이언트 컴포넌트로 구현합니다.
 *
 * - ?region=강남구 → HIRA 병원 사이트맵 표시
 * - 파라미터 없음  → 기본 블로그 포스트 목록 표시
 */

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import PostCard from '@/components/ui/PostCard';

import { PostData as Post } from '@/lib/posts';

export default function BlogPageClient() {
  const searchParams = useSearchParams();
  const tagFilter = searchParams.get('tag');

  const [posts, setPosts] = useState<Post[]>([]);

  // 포스트 목록 로드 (API를 통해)
  useEffect(() => {
    fetch(`/api/posts?t=${new Date().getTime()}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        // 날짜와 시간까지 포함된 isoDate로 정밀하게 최신순 정렬 (없으면 date)
        list.sort((a: Post, b: Post) => {
          const timeA = a.isoDate || a.date;
          const timeB = b.isoDate || b.date;
          return timeA < timeB ? 1 : timeA > timeB ? -1 : 0;
        });
        setPosts(list);
      })
      .catch(() => setPosts([]));
  }, []);

  // 태그 필터링
  let displayPosts = posts;
  if (tagFilter) {
    displayPosts = displayPosts.filter(p => Array.isArray(p.tags) && p.tags.some(t => t === tagFilter));
  }

  // ─── 기본 블로그 목록 ───
  return (
    <div className="space-y-6">
      {/* 블로그 페이지 헤더 (SEO H1) */}
      <div className="border-b border-[var(--google-border)] pb-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2">
          <svg className="w-6 h-6 text-[var(--google-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          보상 실무 가이드 & 칼럼 목록
        </h1>
        <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] mt-1.5">
          교통사고, 후유장해, 실손보험 청구 등 손해사정 실무 가이드를 모아서 제공합니다.
        </p>
      </div>

      {/* 태그 필터 활성 표시 */}
      {tagFilter && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#e8f0fe] dark:bg-[#174ea6]/30 rounded-none border border-[var(--google-blue)]/30">
            <svg className="w-4 h-4 text-[var(--google-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            <span className="text-sm font-bold text-[var(--google-blue)]">#{tagFilter}</span>
            <span className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">{displayPosts.length}개 게시글</span>
          </div>
          <Link
            href="/blog"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#5f6368] dark:text-[#9aa0a6] bg-[var(--google-surface-variant)] dark:bg-[#303134] rounded-none hover:text-[var(--google-blue)] hover:border-[var(--google-blue)] border border-transparent transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            필터 해제
          </Link>
        </div>
      )}

      {displayPosts.length === 0 ? (
        <div className="text-center py-16 px-4 sm:p-16 bg-white dark:bg-[#202124] rounded-none sm:rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
          <svg className="w-12 h-12 text-[#dadce0] dark:text-[#5f6368] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M3 15h6"></path><path d="M3 19h6"></path><path d="M10 15h8"></path><path d="M10 19h8"></path></svg>
          <p className="text-sm font-bold tracking-wide text-[#5f6368] dark:text-[#9aa0a6]">
            {tagFilter ? `'#${tagFilter}' 태그에 해당하는 게시글이 없습니다.` : '등록된 블로그 포스팅이 존재하지 않습니다.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayPosts.map((post) => (
            <PostCard key={post.slug} post={post as any} variant="list" />
          ))}
        </div>
      )}
    </div>
  );
}
