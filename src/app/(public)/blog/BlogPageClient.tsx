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
import { KAKAO_OPEN_CHAT_URL, GOOGLE_FORM_URL } from '@/lib/constants';
import { PostData as Post } from '@/lib/posts';

// HIRA 데이터 타입
interface SpecialtyData {
  count: number;
  diseases: string[];
  hospitals: { name: string; address: string; tel: string }[];
}

interface HiraData {
  updatedAt: string;
  source: string;
  regions: Record<string, {
    districts: Record<string, {
      specialties: Record<string, SpecialtyData>
    }>
  }>;
}

interface DistrictInfo {
  sido: string;
  district: string;
  specialties: Record<string, SpecialtyData>;
}

// 시/도 이름 매핑 (URL 파라미터 긴 이름 -> HIRA 짧은 이름)
const SIDO_MAP: Record<string, string> = {
  '서울특별시': '서울', '부산광역시': '부산', '인천광역시': '인천',
  '대구광역시': '대구', '광주광역시': '광주', '대전광역시': '대전',
  '울산광역시': '울산', '세종특별자치시': '세종', '경기도': '경기',
  '강원특별자치도': '강원', '충청북도': '충북', '충청남도': '충남',
  '전북특별자치도': '전북', '전라북도': '전북', '전라남도': '전남',
  '경상북도': '경북', '경상남도': '경남', '제주특별자치도': '제주'
};

// 지역명에 해당하는 시도 + 데이터 검색 (sidoQuery가 있으면 해당 시도만 검색)
function findDistrictData(hiraData: HiraData | null, regionQuery: string, sidoQuery?: string | null): DistrictInfo | null {
  if (!hiraData?.regions) return null;
  
  const mappedSidoQuery = sidoQuery ? (SIDO_MAP[sidoQuery] || sidoQuery) : null;

  for (const [sidoName, sidoData] of Object.entries(hiraData.regions)) {
    // sidoQuery가 제공된 경우 매핑된 이름과 일치하는지 확인
    if (mappedSidoQuery && mappedSidoQuery !== sidoName && !mappedSidoQuery.startsWith(sidoName) && !sidoName.startsWith(mappedSidoQuery)) continue;
    
    for (const [districtName, districtData] of Object.entries(sidoData.districts)) {
      if (
        districtName === regionQuery ||
        districtName.includes(regionQuery) || regionQuery.includes(districtName)
      ) {
        return {
          sido: sidoName,
          district: districtName,
          specialties: districtData.specialties,
        };
      }
    }
  }
  return null;
}

// ─── 병원 전체 목록 컴포넌트 (Hook 에러 방지를 위해 별도 컴포넌트로 분리) ───
function HospitalListView({
  regionName,
  specialtyName,
  districtInfo
}: {
  regionName: string;
  specialtyName: string;
  districtInfo: DistrictInfo | null;
}) {
  const specialtyData = districtInfo?.specialties?.[specialtyName];
  
  // 단순 페이징 (클라이언트 로컬)
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  if (!specialtyData) return null;

  const totalPages = Math.ceil(specialtyData.hospitals.length / ITEMS_PER_PAGE);
  const currentHospitals = specialtyData.hospitals.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="bg-white dark:bg-[#202124] rounded-none sm:rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] px-3.5 py-5 sm:p-8 lg:p-10">
      <div className="flex items-center justify-between mb-6 border-b border-[var(--google-border)] pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2">
            <svg className="w-6 h-6 text-[var(--google-red)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            {regionName} <span className="text-[var(--google-blue)] dark:text-[#8ab4f8]">{specialtyName}</span> 전체보기
          </h1>
          <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] mt-2 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-[var(--google-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            총 <strong className="text-[#202124] dark:text-[#e8eaed] mx-0.5">{specialtyData.hospitals.length}</strong>곳의 검증된 의료기관 리스트입니다.
          </p>
        </div>
        <Link href={`/blog?sido=${encodeURIComponent(districtInfo?.sido || '')}&region=${encodeURIComponent(regionName)}`} className="flex items-center gap-1.5 text-xs font-bold text-[#5f6368] hover:text-[var(--google-blue)] px-3 py-2 bg-[var(--google-surface-variant)] dark:bg-[#303134] rounded-none transition-colors border border-transparent hover:border-[var(--google-blue)]/30">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          목록으로
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {currentHospitals.map((hosp: { name: string; address: string; tel: string }, i: number) => (
          <div key={i} className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 rounded-none bg-white dark:bg-[#202124] border border-gray-100 dark:border-white/5 shadow-sm hover:border-[var(--google-blue)] hover:shadow-[0_16px_50px_rgba(26,115,232,0.2)] hover:-translate-y-0.5 transition-all duration-200">
            <div className="w-10 h-10 shrink-0 bg-[#e8f0fe] dark:bg-[#174ea6]/20 text-[var(--google-blue)] dark:text-[#8ab4f8] rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-base font-bold text-[#202124] dark:text-[#e8eaed] mb-1.5">{hosp.name}</div>
              {hosp.address && (
                <div className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mb-2.5 flex items-start gap-1.5">
                  <svg className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#5f6368]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  <span className="truncate leading-relaxed">{hosp.address}</span>
                </div>
              )}
              {hosp.tel && (
                <a href={`tel:${hosp.tel}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[var(--google-blue)] dark:text-[#8ab4f8] bg-[#e8f0fe] dark:bg-[#174ea6]/30 rounded-none hover:bg-[#d2e3fc] dark:hover:bg-[#174ea6]/50 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                  {hosp.tel}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 페이징 컨트롤 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-6 mt-10 pt-6 border-t border-[var(--google-border)]">
          <button
            onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={page === 1}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-white dark:bg-[#202124] text-[var(--google-blue)] dark:text-[#8ab4f8] border border-[var(--google-border)] rounded-full hover:bg-[var(--google-surface-variant)] disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            이전
          </button>
          <div className="text-sm font-bold text-[#5f6368] dark:text-[#9aa0a6] bg-[var(--google-surface-variant)] dark:bg-[#303134] px-4 py-1.5 rounded-full">
            <span className="text-[#202124] dark:text-[#e8eaed]">{page}</span> / {totalPages}
          </div>
          <button
            onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={page === totalPages}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-white dark:bg-[#202124] text-[var(--google-blue)] dark:text-[#8ab4f8] border border-[var(--google-border)] rounded-full hover:bg-[var(--google-surface-variant)] disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
          >
            다음
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default function BlogPageClient() {
  const searchParams = useSearchParams();
  const tagFilter = searchParams.get('tag');
  const categoryFilter = searchParams.get('category');

  const [posts, setPosts] = useState<Post[]>([]);

  // 포스트 목록 로드 (API를 통해)
  useEffect(() => {
    fetch('/api/posts')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        // 날짜 최신순 정렬
        list.sort((a: Post, b: Post) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
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

    displayPosts = displayPosts.filter(p => {
      // 1. 카테고리 또는 특수분류 완전 일치/포함
      if (p.category && p.category.toLowerCase().includes(filterText)) return true;
      if (p.specialtyCategory && p.specialtyCategory.toLowerCase().includes(filterText)) return true;
      
      // 2. 태그 매칭 (가장 중요)
      if (p.tags && p.tags.length > 0) {
        const hasMatchingTag = p.tags.some(t => {
          const tag = t.toLowerCase();
          // 태그가 필터어에 포함되거나 필터어가 태그에 포함될 때
          if (filterText.includes(tag) || tag.includes(filterText)) {
            // 단, 태그가 의미 없는 일반명사면 매칭에서 제외
            if (stopWords.includes(tag)) return false;
            return true;
          }
          return false;
        });
        if (hasMatchingTag) return true;
      }
      
      // 3. 제목이나 요약에 전체 필터어가 그대로 포함된 경우
      if (p.title && p.title.toLowerCase().includes(filterText)) return true;
      
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
