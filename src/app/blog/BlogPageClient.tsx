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
import HospitalSitemap from '@/components/HospitalSitemap';
import { REGIONS_DATA } from '@/lib/constants';
import standardData from '../../../functions/api/taas-standard-data.json';

// 포스트 타입 (lib/posts에서 읽어온 데이터 형태)
interface Post {
  slug: string;
  title: string;
  date: string;
  summary: string;
  category: string;
  tags: string[];
  specialtyCategory?: string;
}

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
  const region = searchParams.get('region');
  const sido = searchParams.get('sido');
  const specialty = searchParams.get('specialty');
  const tagFilter = searchParams.get('tag');
  const categoryFilter = searchParams.get('category');

  const [posts, setPosts] = useState<Post[]>([]);
  const [hiraData, setHiraData] = useState<HiraData | null>(null);
  const [loading, setLoading] = useState(!!region);

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

  // HIRA 데이터 로드 (지역 파라미터가 있을 때만)
  useEffect(() => {
    if (!region) return;
    
    // 동기식 상태 업데이트로 인한 렌더링 지연 경고 방지
    const timer = setTimeout(() => {
      setLoading(true);
    }, 0);

    // 1. sido 이름 찾기 (만약 URL 파라미터로 안 넘어왔다면 REGIONS_DATA에서 역추적)
    let finalSido = sido;
    if (!finalSido) {
      const foundSidoObj = REGIONS_DATA.find(r => r.districts.includes(region));
      if (foundSidoObj) {
        finalSido = foundSidoObj.name;
      }
    }

    // 2. TaaS standard-data를 기반으로 법정코드 매핑
    const sidoCode = (standardData.TAAS_SIDO_CODES as Record<string, string>)[finalSido || ''] || '';
    let gugunCode = '';

    if (sidoCode && (standardData.TAAS_GUGUN_CODES as Record<string, Record<string, string>>)[sidoCode]) {
      const codes = (standardData.TAAS_GUGUN_CODES as Record<string, Record<string, string>>)[sidoCode];
      if (codes[region]) {
        gugunCode = codes[region];
      } else {
        const cleanGugun = region.replace(/^(인천|대구|광주|대전|울산|부산|서울)/, '');
        if (cleanGugun.includes('부천')) {
          gugunCode = codes['부천시'] || '';
        } else if (cleanGugun.includes('화성')) {
          gugunCode = codes['화성시'] || '';
        } else {
          for (const [key, code] of Object.entries(codes)) {
            const cleanKey = key.replace('시', '');
            if (cleanGugun === key || cleanGugun === cleanKey || cleanGugun.includes(key) || key.includes(cleanGugun)) {
              gugunCode = code;
              break;
            }
          }
        }
      }
    }

    if (!sidoCode || !gugunCode) {
      clearTimeout(timer);
      setTimeout(() => {
        setHiraData(null);
        setLoading(false);
      }, 0);
      return;
    }

    // 3. 해당 시도-구군에 대응하는 법정코드 JSON 파일 가져옴
    const filePath = `/data/hospitals/${sidoCode}-${gugunCode}.json`;

    fetch(filePath)
      .then(r => {
        if (!r.ok) throw new Error('File not found');
        return r.json();
      })
      .then(data => {
        // 기존 렌더링 로직 및 데이터 필터링 함수와 호환되도록 HiraData 구조로 포장하여 상태값 세팅
        const wrappedData: HiraData = {
          updatedAt: new Date().toISOString(),
          source: 'HIRA',
          regions: {
            [data.sido]: {
              districts: {
                [data.district]: {
                  specialties: data.specialties
                }
              }
            }
          }
        };
        setHiraData(wrappedData);
        setLoading(false);
      })
      .catch(() => {
        setHiraData(null);
        setLoading(false);
      });

    return () => clearTimeout(timer);
  }, [region, sido]);

  // ─── 지역 파라미터 있음: 병원 사이트맵 또는 진료과목 리스트 ───
  if (region) {
    const districtInfo = findDistrictData(hiraData, region, sido);

    // 진료과목에 해당하는 포스트 필터링
    let filteredPosts = posts;
    if (specialty) {
      filteredPosts = posts.filter(p => 
        (p.category && p.category.includes(specialty)) ||
        (p.tags && p.tags.some(tag => tag.includes(specialty))) ||
        (p.specialtyCategory && p.specialtyCategory.includes(specialty))
      );
    }

    return (
      <div className="space-y-8">
        {/* 브레드크럼 */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <nav className="flex items-center gap-1.5 text-xs text-[#5f6368] dark:text-[#9aa0a6]">
            <Link href="/blog" className="hover:text-[var(--google-blue)] transition-colors font-medium flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M3 15h6"></path><path d="M3 19h6"></path><path d="M10 15h8"></path><path d="M10 19h8"></path></svg>
              블로그
            </Link>
            <span>›</span>
            <Link href={`/blog?sido=${encodeURIComponent(districtInfo?.sido || sido || '')}&region=${encodeURIComponent(region)}`} className="hover:text-[var(--google-blue)] transition-colors font-medium flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              {districtInfo?.sido ? `${districtInfo.sido} ` : ''}{region}
            </Link>
            {specialty && (
              <>
                <span>›</span>
                <span className="text-[#202124] dark:text-[#e8eaed] font-bold">
                  {specialty}
                </span>
              </>
            )}
          </nav>
          <Link
            href="/blog"
            className="text-xs font-bold text-[var(--google-blue)] hover:underline flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            목록으로 돌아가기
          </Link>
        </div>

        {loading ? (
          /* 로딩 스피너 */
          <div className="bg-white dark:bg-[#202124] rounded-none sm:rounded-none py-16 px-4 sm:p-16 text-center border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
            <div className="inline-block w-8 h-8 border-4 border-[var(--google-blue)] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">{region} 의료기관 데이터 불러오는 중...</p>
          </div>
        ) : districtInfo ? (
          <div className="flex flex-col gap-8">
            {/* 상단: 병원 리스트 또는 사이트맵 */}
            <div className="w-full">
              {specialty ? (
                <HospitalListView
                  regionName={region}
                  specialtyName={specialty}
                  districtInfo={districtInfo}
                />
              ) : (
                <HospitalSitemap
                  region={districtInfo.district}
                  sido={districtInfo.sido}
                  specialties={districtInfo.specialties}
                />
              )}
            </div>

            {/* 하단: 관련 블로그 포스트 */}
            <div className="w-full">
              <h2 className="text-xl font-bold text-[#202124] dark:text-[#e8eaed] mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-[var(--google-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                {specialty ? `${specialty} 관련 보상 가이드` : '보상 가이드 칼럼'}
              </h2>
              
              {filteredPosts.length > 0 ? (
                <div className="space-y-4">
                  {filteredPosts.map((post) => (
                    <article
                      key={post.slug}
                      className="bg-white dark:bg-[#202124] p-5 sm:p-6 rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:border-[var(--google-blue)] hover:shadow-[0_16px_50px_rgba(26,115,232,0.2)] hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className="flex flex-wrap items-center gap-3 text-xs mb-3">
                        <span className="px-2.5 py-1 rounded-none bg-[#e8f0fe] dark:bg-[#174ea6]/20 text-[var(--google-blue)] font-bold">
                          {post.category}
                        </span>
                        <time className="text-[#5f6368] dark:text-[#9aa0a6] font-medium flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          {post.date}
                        </time>
                      </div>
                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-base sm:text-lg font-bold text-[#202124] dark:text-[#e8eaed] hover:text-[var(--google-blue)] transition-colors line-clamp-2 mb-2"
                      >
                        {post.title}
                      </Link>
                      <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] line-clamp-2 leading-relaxed">
                        {post.summary}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                /* 필터링된 포스트가 없을 경우 상담 유도 UI */
                <div className="bg-white dark:bg-[#202124] rounded-none sm:rounded-none py-8 px-4 sm:p-10 text-center border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
                  <svg className="w-12 h-12 text-[#dadce0] dark:text-[#5f6368] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  <h3 className="text-lg font-bold text-[#202124] dark:text-[#e8eaed] mb-2">
                    해당 진료과목과 관련된 칼럼이 없습니다.
                  </h3>
                  <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] mb-6 leading-relaxed">
                    관련 보상 가이드 칼럼을 정성껏 준비 중입니다.<br />
                    궁금하신 사항은 아래 버튼을 통해 언제든 실시간 상담을 이용해 주세요.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => (window as any).__openClaimworksChat?.()}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white font-bold rounded-none text-sm transition-colors"
                      id="blog-empty-chat-btn-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>
                      실시간 상담
                    </button>
                    <a
                      href="https://forms.gle/E9vj7iqAHeJGhJ549"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--google-blue)] hover:bg-[#1557b0] text-white font-bold rounded-none text-sm transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      구글 상담 신청
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 데이터 없음 */
          <div className="bg-white dark:bg-[#202124] rounded-none sm:rounded-none py-10 px-4 sm:p-10 text-center border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
            <svg className="w-12 h-12 text-[#dadce0] dark:text-[#5f6368] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" /><circle cx="12" cy="10" r="3" /></svg>
            <h2 className="text-lg font-bold text-[#202124] dark:text-[#e8eaed] mb-2">
              {region} 의료기관 정보
            </h2>
            <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] mb-6 leading-relaxed">
              해당 지역의 의료기관 데이터를 수집 중입니다.<br />
              아래 버튼을 통해 실시간 상담을 이용해 주세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://open.kakao.com/o/sWeszp7"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-none text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3c-5.5 0-10 3.5-10 7.8 0 2.7 1.7 5.1 4.2 6.5l-1.1 4.1c-.1.3.2.5.4.4l4.8-3.2c.5.1 1.1.1 1.7.1 5.5 0 10-3.5 10-7.8s-4.5-7.8-10-7.8z"/></svg>
                카톡 실시간 상담
              </a>
              <a
                href="https://forms.gle/E9vj7iqAHeJGhJ549"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--google-blue)] hover:bg-[#1557b0] text-white font-bold rounded-none text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                구글 상담 신청
              </a>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── 지역 파라미터 없음, 시/도 파라미터만 있음: 구/군 선택 사이트맵 ───
  if (sido && !region) {
    const sidoData = REGIONS_DATA.find(r => r.name === sido);
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
            <Link href="/blog" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
              ✍️ 블로그 목록
            </Link>
            <span>›</span>
            <span className="text-slate-800 dark:text-zinc-200 font-bold">
              🗺️ {sido}
            </span>
          </nav>
        </div>

        <div className="bg-white dark:bg-[#202124] rounded-none sm:rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] px-4 py-5 sm:p-6">
          <h1 className="text-lg sm:text-xl font-bold text-[#202124] dark:text-[#e8eaed] mb-1">
            {sido} 구/군 선택
          </h1>
          <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] mb-5 pb-4 border-b border-[var(--google-border)]">
            원하시는 지역을 선택하면 해당 지역의 진료과목별 병원 통계를 보실 수 있습니다.
          </p>

          {sidoData ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {sidoData.districts.map((dist) => (
                <Link
                  key={dist}
                  href={`/blog?sido=${encodeURIComponent(sido)}&region=${encodeURIComponent(dist)}`}
                  className="group relative flex items-center justify-between p-3.5 sm:p-4 rounded-none bg-white dark:bg-[#202124] border border-gray-100 dark:border-white/5 shadow-sm hover:border-[var(--google-blue)] hover:shadow-[0_16px_50px_rgba(26,115,232,0.2)] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--google-blue)]/0 to-[var(--google-blue)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  <div className="flex items-center gap-2.5 sm:gap-3 relative z-10">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[var(--google-surface-variant)] dark:bg-[#303134] border border-transparent flex items-center justify-center text-[#5f6368] dark:text-[#9aa0a6] group-hover:text-[var(--google-blue)] group-hover:bg-[#e8f0fe] dark:group-hover:bg-[#174ea6] transition-colors">
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <span className="font-bold text-sm text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-blue)] transition-colors tracking-tight">
                      {dist}
                    </span>
                  </div>
                  <div className="relative z-10 text-[#dadce0] dark:text-[#5f6368] group-hover:text-[var(--google-blue)] transition-all group-hover:translate-x-0.5 duration-200 text-sm font-bold">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-[#5f6368] dark:text-[#9aa0a6]">
              해당 지역 정보를 찾을 수 없습니다.
            </div>
          )}
        </div>
      </div>
    );
  }

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
                href="https://open.kakao.com/o/sWeszp7"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-none text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3c-5.5 0-10 3.5-10 7.8 0 2.7 1.7 5.1 4.2 6.5l-1.1 4.1c-.1.3.2.5.4.4l4.8-3.2c.5.1 1.1.1 1.7.1 5.5 0 10-3.5 10-7.8s-4.5-7.8-10-7.8z"/></svg>
                카톡 실시간 상담
              </a>
              <a
                href="https://forms.gle/E9vj7iqAHeJGhJ549"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--google-blue)] hover:bg-[#1557b0] text-white font-bold rounded-none text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                구글 상담 신청
              </a>
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
            <article
              key={post.slug}
              className="bg-white dark:bg-[#202124] p-4 sm:p-6 rounded-none sm:rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:border-[var(--google-blue)] hover:shadow-[0_16px_50px_rgba(26,115,232,0.2)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-3 text-xs mb-3">
                  <span className="px-2.5 py-1 font-bold rounded-none bg-[var(--google-surface-variant)] text-[#5f6368] dark:bg-[#303134] dark:text-[#9aa0a6] border border-transparent">
                    {post.category}
                  </span>
                  <time className="text-[#5f6368] dark:text-[#9aa0a6] font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    {post.date}
                  </time>
                </div>
                <div className="relative w-full overflow-hidden mb-2">
                  <h2 className="text-base sm:text-lg font-bold text-[#202124] dark:text-[#e8eaed] hover:text-[var(--google-blue)] transition-colors line-clamp-2 leading-snug">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                </div>
                <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] line-clamp-2 leading-relaxed font-normal">
                  {post.summary}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-[var(--google-border)] flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {(post.tags || []).map((tag) => (
                    <Link
                      key={tag}
                      href={`/blog?tag=${encodeURIComponent(tag)}`}
                      className={`text-xs font-bold px-2 py-0.5 rounded-none border transition-colors ${
                        tagFilter === tag
                          ? 'bg-[var(--google-blue)] text-white border-[var(--google-blue)]'
                          : 'text-[#5f6368] dark:text-[#9aa0a6] bg-[var(--google-surface-variant)] dark:bg-[#303134] border-transparent hover:border-[var(--google-blue)] hover:text-[var(--google-blue)]'
                      }`}
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
                <Link
                  href={`/blog/${post.slug}`}
                  className="shrink-0 text-sm font-bold text-[var(--google-blue)] hover:underline transition-colors flex items-center gap-1"
                >
                  자세히 보기
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
