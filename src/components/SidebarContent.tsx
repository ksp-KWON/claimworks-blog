'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import postsData from '@/lib/posts-data.json';
import { SpecialtyDiseaseCategories, RegionalCategories } from '@/components/SidebarCategories';

export default function SidebarContent() {
  const [showAllTags, setShowAllTags] = useState(false);
  const [isMajorCategoryOpen, setIsMajorCategoryOpen] = useState(false);

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
    <div className="space-y-6">
      {/* 🚗 자동차보험 합의금 계산기 */}
      <div className="bg-white dark:bg-[#202124] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(26,115,232,0.2)] hover:border-[var(--google-blue)] transition-all duration-300 group relative overflow-hidden">
        <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] mb-2 flex items-center gap-2 border-l-4 border-[var(--google-blue)] pl-2.5">
          <span className="text-[var(--google-blue)] text-lg leading-none">🚗</span>
          자동차보험 합의금 계산기
        </h3>
        <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mb-4 leading-relaxed">
          약관 지급기준 및 호프만계수를 적용한 정확한 예상 합의금을 확인하세요.
        </p>
        <Link href="/calculator/auto" className="flex items-center justify-center gap-2 w-full bg-[var(--google-blue)] text-white font-bold text-sm py-2.5 rounded-xl hover:bg-[#174ea6] transition-colors shadow-sm">
          자동차보험 계산하기
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </Link>
      </div>

      {/* 🏥 실손의료비 보상 계산기 */}
      <div className="bg-white dark:bg-[#202124] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(52,168,83,0.2)] hover:border-[var(--google-green)] transition-all duration-300 group relative overflow-hidden">
        <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] mb-2 flex items-center gap-2 border-l-4 border-[var(--google-green)] pl-2.5">
          <span className="text-[var(--google-green)] text-lg leading-none">🏥</span>
          실손의료비 계산기
        </h3>
        <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mb-4 leading-relaxed">
          급여/비급여 병원비, 본인부담금을 공제한 예상 실손 보상금을 산출해 보세요.
        </p>
        <Link href="/calculator/medical" className="flex items-center justify-center gap-2 w-full bg-[var(--google-green)] text-white font-bold text-sm py-2.5 rounded-xl hover:bg-[#0d652d] transition-colors shadow-sm">
          실손의료비 계산하기
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </Link>
      </div>

      {/* ⚖️ 배상책임 소송가액 계산기 */}
      <div className="bg-white dark:bg-[#202124] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(234,67,53,0.2)] hover:border-[var(--google-red)] transition-all duration-300 group relative overflow-hidden">
        <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] mb-2 flex items-center gap-2 border-l-4 border-[var(--google-red)] pl-2.5">
          <span className="text-[var(--google-red)] text-lg leading-none">⚖️</span>
          배상책임 소송가액 계산기
        </h3>
        <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mb-4 leading-relaxed">
          호프만계수를 적용하여 법원 판례 기준에 따른 예상 손해배상액을 산출합니다.
        </p>
        <Link href="/calculator/liability" className="flex items-center justify-center gap-2 w-full bg-[var(--google-red)] text-white font-bold text-sm py-2.5 rounded-xl hover:bg-[#d93025] transition-colors shadow-sm">
          소송가액 계산하기
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </Link>
      </div>

      {/* 주요 보상 카테고리 (세로 리스트 형태 원복) */}
      <div className="bg-white dark:bg-[#202124] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(251,188,4,0.2)] hover:border-[var(--google-yellow)] transition-all duration-300 group relative overflow-hidden">
        <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] mb-2 flex items-center gap-2 border-l-4 border-[var(--google-yellow)] pl-2.5">
          <span className="text-[var(--google-yellow)] text-lg leading-none">📂</span>
          주요 보상 카테고리
        </h3>
        <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mb-4 leading-relaxed">
          보상스쿨의 다양한 보상 정보와 분쟁 해결 가이드를 주제별로 모아두었습니다.
        </p>
        
        <button 
          onClick={() => setIsMajorCategoryOpen(!isMajorCategoryOpen)}
          className="w-full text-sm font-bold text-[#202124] dark:text-[#e8eaed] flex items-center justify-between transition-colors group p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h7"></path></svg>
            카테고리 펼치기
          </div>
          <svg className={`w-4 h-4 text-[#5f6368] transition-transform duration-300 ${isMajorCategoryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        
        <div className={`overflow-hidden transition-all duration-300 ${isMajorCategoryOpen ? 'max-h-[500px] mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
          <ul className="space-y-1 text-sm font-medium text-[#202124] dark:text-[#e8eaed]">
          {[
            { name: '교통사고', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
            { name: '배상책임', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
            { name: '보상가이드', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
            { name: '실손의료비', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { name: '보험상식', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
            { name: '후유장해 보상', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            { name: '보상정보', color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20' }
          ].map(cat => (
            <li key={cat.name}>
              <Link
                href={`/blog?category=${encodeURIComponent(cat.name)}`}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-[var(--google-surface-variant)] dark:hover:bg-white/5 transition-colors group"
              >
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${cat.bg} ${cat.color}`}></span>
                  <span className="group-hover:text-[var(--google-blue)] transition-colors">{cat.name}</span>
                </span>
                <svg className="w-4 h-4 text-[#5f6368] opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </Link>
            </li>
          ))}
          </ul>
        </div>
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
  );
}
