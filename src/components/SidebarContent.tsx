'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import postsData from '@/lib/posts-data.json';
import { SpecialtyDiseaseCategories, RegionalCategories } from '@/components/SidebarCategories';

/**
 * MobileSidebarToggle
 *
 * 모바일(lg 미만)에서는 접기/펴기 버튼과 함께 사이드바를 표시합니다.
 * 데스크탑(lg 이상)에서는 항상 펼쳐진 상태로 표시됩니다.
 */
export default function SidebarContent() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);

  // 인기 태그 계산 (빈도수 기준 내림차순 정렬)
  const sortedTags = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    const posts = postsData as unknown as { tags?: string[] }[];
    posts.forEach(p => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1]) // 빈도수 높은 순 정렬
      .map(entry => entry[0]);
  }, []);

  const INITIAL_TAG_COUNT = 15;
  const visibleTags = showAllTags ? sortedTags : sortedTags.slice(0, INITIAL_TAG_COUNT);
  const hasMoreTags = sortedTags.length > INITIAL_TAG_COUNT;

  return (
    <>
      {/* 🚗 자동차보험 합의금 계산기 (항상 표시) */}
      <div className="bg-white dark:bg-[#202124] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(26,115,232,0.2)] hover:border-[var(--google-blue)] hover:-translate-y-1 transition-all duration-300 group mb-6 relative overflow-hidden">
        <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] mb-2 flex items-center gap-2 border-l-4 border-[var(--google-blue)] pl-2.5">
          <span className="text-[var(--google-blue)] text-lg leading-none">🚗</span>
          자동차보험 합의금 계산기
        </h3>
        <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mb-4 leading-relaxed">
          약관 지급기준(부상, 장해, 사망) 및 호프만계수를 적용한 정확한 예상 합의금을 확인하세요.
        </p>
        <Link href="/calculator/auto" className="flex items-center justify-center gap-2 w-full bg-[var(--google-blue)] text-white font-bold text-sm py-2.5 rounded-xl hover:bg-[#174ea6] transition-colors shadow-sm">
          자동차보험 계산하기
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </Link>
      </div>

      {/* 🏥 실손의료비 보상 계산기 (항상 표시) */}
      <div className="bg-white dark:bg-[#202124] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(52,168,83,0.2)] hover:border-[var(--google-green)] hover:-translate-y-1 transition-all duration-300 group mb-6 relative overflow-hidden">
        <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] mb-2 flex items-center gap-2 border-l-4 border-[var(--google-green)] pl-2.5">
          <span className="text-[var(--google-green)] text-lg leading-none">🏥</span>
          실손의료비 계산기
        </h3>
        <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mb-4 leading-relaxed">
          급여/비급여 병원비, 약제비 본인부담금을 공제한 예상 실손 보상금을 산출해 보세요.
        </p>
        <Link href="/calculator/medical" className="flex items-center justify-center gap-2 w-full bg-[var(--google-green)] text-white font-bold text-sm py-2.5 rounded-xl hover:bg-[#0d652d] transition-colors shadow-sm">
          실손의료비 계산하기
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </Link>
      </div>

      {/* ⚖️ 배상책임 소송가액 계산기 (항상 표시) */}
      <div className="bg-white dark:bg-[#202124] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(239,108,0,0.2)] hover:border-[#EF6C00] hover:-translate-y-1 transition-all duration-300 group mb-6 relative overflow-hidden">
        <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] mb-2 flex items-center gap-2 border-l-4 border-[#EF6C00] pl-2.5">
          <span className="text-[#EF6C00] text-lg leading-none">⚖️</span>
          배상책임 소송가액 계산기
        </h3>
        <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mb-4 leading-relaxed">
          호프만계수를 적용하여 법원 판례 기준에 따른 예상 손해배상액을 산출합니다.
        </p>
        <Link href="/calculator/liability" className="flex items-center justify-center gap-2 w-full bg-[#EF6C00] text-white font-bold text-sm py-2.5 rounded-xl hover:bg-[#E65100] transition-colors shadow-sm">
          소송가액 계산하기
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </Link>
      </div>

      {/* ── 모바일 전용 카테고리/인기키워드 안내 카드 (lg 이상에서는 숨김) ── */}
      <div className="lg:hidden bg-white dark:bg-[#202124] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(26,115,232,0.2)] hover:border-[var(--google-blue)] hover:-translate-y-1 transition-all duration-300 group mb-6 relative overflow-hidden">
        <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] mb-2 flex items-center gap-2 border-l-4 border-[var(--google-blue)] pl-2.5">
          <span className="text-[var(--google-blue)] text-lg leading-none">📂</span>
          카테고리 · 인기 키워드
        </h3>
        <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mb-4 leading-relaxed font-normal">
          손해사정사가 분석한 진료과목별 분쟁 가이드와 대한민국 지역별 의료기관 리스트, 인기 태그 키워드를 확인하세요.
        </p>
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className={`flex items-center justify-center gap-2 w-full font-bold text-sm py-2.5 rounded-xl transition-all duration-200 shadow-sm cursor-pointer ${
            isOpen 
              ? 'bg-gradient-to-r from-[#e8f0fe] to-[#f1f3f4] dark:from-[#174ea6]/20 dark:to-[#303134] border border-[var(--google-blue)] text-[var(--google-blue)] dark:text-[#8ab4f8]' 
              : 'bg-[var(--google-blue)] text-white hover:bg-[#174ea6]'
          }`}
          aria-expanded={isOpen}
          aria-controls="sidebar-content"
        >
          {isOpen ? (
            <>
              카테고리 메뉴 접기
              <svg className="w-4 h-4 text-[var(--google-blue)] dark:text-[#8ab4f8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
            </>
          ) : (
            <>
              카테고리 메뉴 열기
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </>
          )}
        </button>
      </div>

      {/* ── 사이드바 본문 (모바일: 토글 / 데스크탑: 항상 표시) ── */}
      <div
        id="sidebar-content"
        className={`space-y-6 ${isOpen ? 'block' : 'hidden'} lg:block lg:mt-6 mt-6`}
      >

        {/* 주요 보상 카테고리 */}
        <div className="bg-white dark:bg-[#202124] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] mb-4 flex items-center gap-2 border-l-4 border-yellow-500 pl-2.5">
            <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h7"></path></svg>
            주요 보상 카테고리
          </h3>
          <ul className="space-y-1 text-sm font-medium text-[#202124] dark:text-[#e8eaed]">
            {[
              { name: '교통사고', color: 'text-red-500' },
              { name: '배상책임', color: 'text-green-500' },
              { name: '보상가이드', color: 'text-yellow-600' },
              { name: '실손의료비', color: 'text-blue-500' },
              { name: '보험상식', color: 'text-orange-500' },
              { name: '후유장해 보상', color: 'text-purple-500' },
              { name: '보상정보', color: 'text-teal-500' }
            ].map(cat => (
              <li key={cat.name}>
                <Link
                  href={`/blog?category=${encodeURIComponent(cat.name)}`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[var(--google-surface-variant)] hover:text-[var(--google-blue)] transition-colors text-[#202124] dark:text-[#e8eaed]"
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full bg-current ${cat.color}`}></span>
                    {cat.name}
                  </span>
                  <svg className="w-4 h-4 text-[#5f6368]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* 진료과목별 분쟁 가이드 */}
        <SpecialtyDiseaseCategories />

        {/* 지역별 의료기관 */}
        <RegionalCategories />

        {/* 인기 키워드 태그 */}
        <div className="bg-white dark:bg-[#202124] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] mb-4 flex items-center gap-2 border-l-4 border-[var(--google-red)] pl-2.5">
            <svg className="w-4 h-4 text-[var(--google-red)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            인기 키워드 태그
          </h3>
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            {visibleTags.map((tag: string) => (
              <Link
                key={tag}
                href={`/blog?tag=${encodeURIComponent(tag)}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--google-surface-variant)] dark:bg-[#303134] text-[#5f6368] dark:text-[#c4c7c5] border border-transparent hover:border-[var(--google-blue)] hover:bg-[#e8f0fe] dark:hover:bg-[#174ea6]/20 hover:text-[var(--google-blue)] dark:hover:text-[#8ab4f8] transition-all duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
              >
                <span className="text-[var(--google-red)] opacity-70">#</span>
                {tag}
              </Link>
            ))}
            
            {/* 더보기 / 접기 버튼 */}
            {hasMoreTags && (
              <button
                onClick={() => setShowAllTags(!showAllTags)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#202124] text-[#5f6368] dark:text-[#c4c7c5] border border-gray-200 dark:border-white/5 hover:border-[var(--google-blue)] hover:bg-[#e8f0fe] dark:hover:bg-[#174ea6]/20 hover:text-[var(--google-blue)] dark:hover:text-[#8ab4f8] transition-all duration-200 shadow-sm cursor-pointer"
              >
                {showAllTags ? (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                    접기
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    더보기 (+{sortedTags.length - INITIAL_TAG_COUNT})
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
