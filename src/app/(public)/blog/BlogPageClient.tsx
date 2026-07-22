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
import { KAKAO_OPEN_CHAT_URL } from '@/lib/constants';
import { PostData as Post } from '@/lib/posts';

export default function BlogPageClient() {
  const searchParams = useSearchParams();
  const tagFilter = searchParams.get('tag');
  const categoryFilter = searchParams.get('category');

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

  // 태그 및 카테고리 필터링
  let displayPosts = posts;
  if (tagFilter) {
    displayPosts = displayPosts.filter(p => Array.isArray(p.tags) && p.tags.some(t => t === tagFilter));
  } else if (categoryFilter) {
    const filterText = categoryFilter.toLowerCase();
    // 무분별한 매칭을 일으키는 일반 명사 금지어
    const stopWords = ['보상', '분쟁', '실손', '보험', '수술', '치료', '가이드', '비급여', '진단비', '수술비', '청구', '손해사정'];
    
    // 진료과목별 연관 키워드 매핑
    const SPECIALTY_KEYWORDS: Record<string, string[]> = {
      '정형외과': ['골절', '인대', '척추', '디스크', '십자인대', '파열', '회전근개'],
      '신경외과': ['추간판탈출증', '뇌출혈', '척추관협착증', '뇌경색'],
      '내과': ['심근경색', '협심증', '기왕증'],
      '외과': ['소액암', '수술', '하지정맥류'],
      '산부인과': ['자궁근종', '하이푸', '요실금'],
      '안과': ['백내장', '황반변성', '녹내장'],
      '피부/성형외과': ['레이저', '흉터', '비급여', '미용'],
      '비뇨의학과': ['전립선', '요로결석'],
      '치과': ['치조골', '임플란트', '크라운'],
      '한방의학과': ['첩약', '추나']
    };

    displayPosts = displayPosts.filter(p => {
      // 1. 카테고리 또는 특수분류 완전 일치/포함
      if (p.category && p.category.toLowerCase().includes(filterText)) return true;
      if (p.specialtyCategory && p.specialtyCategory.toLowerCase().includes(filterText)) return true;
      
      // 진료과목에 해당하는 확장 키워드 목록
      const keywords = [filterText, ...(SPECIALTY_KEYWORDS[filterText] || [])];
      
      // 2. 태그 매칭 (가장 중요) - 확장 키워드 포함
      if (p.tags && p.tags.length > 0) {
        const hasMatchingTag = p.tags.some(t => {
          const tag = t.toLowerCase();
          return keywords.some(kw => {
            if (kw.includes(tag) || tag.includes(kw)) {
              if (stopWords.includes(tag)) return false;
              return true;
            }
            return false;
          });
        });
        if (hasMatchingTag) return true;
      }
      
      // 3. 제목이나 요약에 키워드가 포함된 경우
      if (p.title) {
        const titleLower = p.title.toLowerCase();
        if (keywords.some(kw => titleLower.includes(kw))) return true;
      }
      
      // 4. 핵심 질환명이 제목에 포함된 경우 (예: "백내장 (다초점 렌즈 실손)" -> "백내장")
      const firstWord = filterText.split(/[\s(]/)[0];
      if (firstWord && firstWord.length > 1 && !stopWords.includes(firstWord)) {
         if (p.title && p.title.toLowerCase().includes(firstWord)) return true;
      }

      return false;
    });
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

      {/* 카테고리/진단명 필터 활성 표시 */}
      {categoryFilter && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#e8f0fe] dark:bg-[#174ea6]/30 rounded-none border border-[var(--google-blue)]/30">
            <svg className="w-4 h-4 text-[var(--google-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span className="text-sm font-bold text-[var(--google-blue)]">{categoryFilter}</span>
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
        categoryFilter ? (
          /* 필터링된 포스트가 없을 경우 상담 유도 UI */
          <div className="bg-white dark:bg-[#202124] rounded-none p-8 sm:p-10 text-center border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
            <svg className="w-12 h-12 text-[#dadce0] dark:text-[#5f6368] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            <h3 className="text-lg font-bold text-[#202124] dark:text-[#e8eaed] mb-2">
              해당 진료과목과 관련된 칼럼이 없습니다.
            </h3>
            <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] mb-6 leading-relaxed">
              관련 보상 가이드 칼럼을 정성껏 준비 중입니다.<br />
              궁금하신 사항은 아래 버튼을 통해 언제든 실시간 상담을 이용해 주세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={KAKAO_OPEN_CHAT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-none text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3c-5.5 0-10 3.5-10 7.8 0 2.7 1.7 5.1 4.2 6.5l-1.1 4.1c-.1.3.2.5.4.4l4.8-3.2c.5.1 1.1.1 1.7.1 5.5 0 10-3.5 10-7.8s-4.5-7.8-10-7.8z"/></svg>
                카톡 실시간 상담
              </a>
              <Link
                href="/consultation"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--google-blue)] hover:bg-[#1557b0] text-white font-bold rounded-none text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                예약 상담 신청
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 px-4 sm:p-16 bg-white dark:bg-[#202124] rounded-none sm:rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
            <svg className="w-12 h-12 text-[#dadce0] dark:text-[#5f6368] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M3 15h6"></path><path d="M3 19h6"></path><path d="M10 15h8"></path><path d="M10 19h8"></path></svg>
            <p className="text-sm font-bold tracking-wide text-[#5f6368] dark:text-[#9aa0a6]">
              {tagFilter ? `'#${tagFilter}' 태그에 해당하는 게시글이 없습니다.` : '등록된 블로그 포스팅이 존재하지 않습니다.'}
            </p>
          </div>
        )
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
