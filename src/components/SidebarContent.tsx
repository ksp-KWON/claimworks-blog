'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SpecialtyDiseaseCategories, RegionalCategories } from '@/components/SidebarCategories';

export default function SidebarContent() {
  const pathname = usePathname();
  const [showAllTags, setShowAllTags] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isColOpen, setIsColOpen] = useState(false);
  const [sortedTags, setSortedTags] = useState<string[]>([]);

  // 인기 태그 계산 (API를 통해 런타임에 가져옴)
  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.ok ? res.json() : [])
      .then(posts => {
        const tagCounts: Record<string, number> = {};
        posts.forEach((p: any) => {
          if (Array.isArray(p.tags)) {
            p.tags.forEach((tag: string) => {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
          }
        });
        const sorted = Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1]) // 빈도수 높은 순 정렬
          .map(entry => entry[0]);
        setSortedTags(sorted);
      })
      .catch(() => setSortedTags([]));
  }, []);

  const INITIAL_TAG_COUNT = 15;
  const visibleTags = showAllTags ? sortedTags : sortedTags.slice(0, INITIAL_TAG_COUNT);
  const hasMoreTags = sortedTags.length > INITIAL_TAG_COUNT;

  return (
    <div className="space-y-6">
      {/* ⚖️ AI 판례검색센터 바로가기 배너 (패밀리룩 반영) */}
      <Link href="/precedent-search" className="block group">
        <div className="bg-white dark:bg-[#202124] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(26,115,232,0.15)] hover:border-[var(--google-blue)] transition-all duration-300 relative overflow-hidden">
          {/* 장식용 배경 이모지 */}
          <div className="absolute right-[-10px] bottom-[-20px] opacity-[0.03] dark:opacity-[0.05] text-[90px] select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
            ⚖️
          </div>
          <div className="relative z-10 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2 border-l-4 border-[var(--google-blue)] pl-2.5">
                <span className="text-[var(--google-blue)] text-lg leading-none">⚖️</span>
                AI 판례검색센터
              </h3>
              <span className="bg-[#e8f0fe] dark:bg-[#174ea6]/20 text-[var(--google-blue)] dark:text-[#8ab4f8] text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-[#d2e3fc]/30 dark:border-[#174ea6]/30">
                실시간 연동
              </span>
            </div>
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">
              사고 경위나 보상 문제를 일상어로 검색하면, 법제처 공공데이터에서 나에게 가장 유리한 핵심 대법원 판례를 찾아드립니다.
            </p>
            <div className="pt-1 flex items-center gap-1 text-xs font-bold text-[var(--google-blue)] dark:text-[#8ab4f8] group-hover:underline">
              AI 판례 검색 시작하기
              <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
          </div>
        </div>
      </Link>

      {/* 🏛️ 금감원 소비자보호센터 바로가기 배너 */}
      <Link href="/fss-news" className="block group">
        <div className="bg-white dark:bg-[#202124] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(239,68,68,0.15)] hover:border-red-500 transition-all duration-300 relative overflow-hidden">
          {/* 장식용 배경 이모지 */}
          <div className="absolute right-[-10px] bottom-[-20px] opacity-[0.03] dark:opacity-[0.05] text-[90px] select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
            🏛️
          </div>
          <div className="relative z-10 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2 border-l-4 border-red-500 pl-2.5">
                <span className="text-red-500 text-lg leading-none">🏛️</span>
                금감원 소비자보호센터
              </h3>
              <span className="bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-red-100/30 dark:border-red-950/30">
                실시간 연동
              </span>
            </div>
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">
              금감원 소비자경보, 분쟁조정사례, 금융꿀팁, 약관 보도자료를 실시간 분석하여 권리를 지켜드립니다.
            </p>
            <div className="pt-1 flex items-center gap-1 text-xs font-bold text-red-500 dark:text-red-400 group-hover:underline">
              소비자보호 데이터 조회하기
              <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
          </div>
        </div>
      </Link>

      {/* 🚗 교통사고 로컬 안심케어 센터 바로가기 배너 (패밀리룩 반영, 에메랄드 그린 테마로 분리) */}
      <Link href="/traffic-care" className="block group">
        <div className="bg-white dark:bg-[#202124] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(19,115,51,0.15)] hover:border-[#137333] transition-all duration-300 relative overflow-hidden">
          {/* 장식용 배경 이모지 */}
          <div className="absolute right-[-10px] bottom-[-20px] opacity-[0.03] dark:opacity-[0.05] text-[90px] select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
            🚗
          </div>
          <div className="relative z-10 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2 border-l-4 border-[#137333] pl-2.5">
                <span className="text-[#137333] text-lg leading-none">🚗</span>
                교통사고 로컬 안심케어
              </h3>
              <span className="bg-green-50 dark:bg-green-950/20 text-[#137333] dark:text-[#81c995] text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-green-100/30 dark:border-green-950/30">
                실시간 연동
              </span>
            </div>
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">
              도로교통공단 안전 통계와 우수 신경/정형외과 병원 및 사고 맞춤형 손해사정 지식을 안내해 드립니다.
            </p>
            <div className="pt-1 flex items-center gap-1 text-xs font-bold text-[#137333] dark:text-[#81c995] group-hover:underline">
              내 지역 교통사고 케어 가기
              <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
          </div>
        </div>
      </Link>

      {/* 🧮 보상금·합의금 계산기 (통합 아코디언) */}
      <div className="bg-white dark:bg-[#202124] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(26,115,232,0.2)] hover:border-[var(--google-blue)] transition-all duration-300 group relative overflow-hidden">
        <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] mb-2 flex items-center gap-2 border-l-4 border-[var(--google-blue)] pl-2.5">
          <span className="text-[var(--google-blue)] text-lg leading-none">🧮</span>
          보상금·합의금 계산기
        </h3>
        <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mb-4 leading-relaxed">
          약관 지급기준 및 법원 판례 기준을 적용한 예상 합의금과 소송가액을 확인하세요.
        </p>
        
        <button 
          onClick={() => setIsCalcOpen(!isCalcOpen)}
          className="w-full text-sm font-bold text-[#202124] dark:text-[#e8eaed] flex items-center justify-between transition-colors group p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[var(--google-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="15" y2="17"></line></svg>
            계산기 선택하기
          </div>
          <svg className={`w-4 h-4 text-[#5f6368] transition-transform duration-300 ${isCalcOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        
        {isCalcOpen && (
          <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 fade-in duration-200">
            {/* 🚗 자동차보험 */}
            <Link href="/calculator/auto" className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-white/5 hover:border-[var(--google-blue)] hover:bg-[#e8f0fe]/50 dark:hover:bg-[#174ea6]/10 transition-all group/item">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🚗</span>
                <div className="text-left">
                  <div className="text-xs font-bold text-[#202124] dark:text-[#e8eaed] group-hover/item:text-[var(--google-blue)]">자동차보험 합의금 계산기</div>
                  <div className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6] leading-tight mt-0.5">호프만계수 및 약관 지급기준 적용</div>
                </div>
              </div>
              <svg className="w-4 h-4 text-[#5f6368] group-hover/item:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </Link>
            
            {/* 🏥 실손의료비 */}
            <Link href="/calculator/medical" className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-white/5 hover:border-[var(--google-green)] hover:bg-[#e6f4ea]/50 dark:hover:bg-[#0d652d]/10 transition-all group/item">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">🏥</span>
                <div className="text-left">
                  <div className="text-xs font-bold text-[#202124] dark:text-[#e8eaed] group-hover/item:text-[var(--google-green)]">실손의료비 계산기</div>
                  <div className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6] leading-tight mt-0.5">본인부담금 공제 후 예상 보상금</div>
                </div>
              </div>
              <svg className="w-4 h-4 text-[#5f6368] group-hover/item:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </Link>
            
            {/* ⚖️ 배상책임 */}
            <Link href="/calculator/liability" className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-white/5 hover:border-[var(--google-red)] hover:bg-[#fce8e6]/50 dark:hover:bg-[#d93025]/10 transition-all group/item">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">⚖️</span>
                <div className="text-left">
                  <div className="text-xs font-bold text-[#202124] dark:text-[#e8eaed] group-hover/item:text-[var(--google-red)]">배상책임 소송가액 계산기</div>
                  <div className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6] leading-tight mt-0.5">법원 판례 기준 예상 손해배상액 산출</div>
                </div>
              </div>
              <svg className="w-4 h-4 text-[#5f6368] group-hover/item:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </Link>
          </div>
        )}
      </div>

      {/* 📂 분야별 보상 칼럼 (통합 아코디언 & 2열 그리드) */}
      <div className="bg-white dark:bg-[#202124] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(251,188,4,0.2)] hover:border-[var(--google-yellow)] transition-all duration-300 group relative overflow-hidden">
        <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] mb-2 flex items-center gap-2 border-l-4 border-[var(--google-yellow)] pl-2.5">
          <span className="text-[var(--google-yellow)] text-lg leading-none">📂</span>
          분야별 보상 칼럼
        </h3>
        <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mb-4 leading-relaxed">
          보상스쿨 손해사정사의 핵심 전문 칼럼들을 주제별로 분류하여 제공합니다.
        </p>
        
        <button 
          onClick={() => setIsColOpen(!isColOpen)}
          className="w-full text-sm font-bold text-[#202124] dark:text-[#e8eaed] flex items-center justify-between transition-colors group p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[var(--google-yellow)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h7"></path></svg>
            칼럼 카테고리 보기
          </div>
          <svg className={`w-4 h-4 text-[#5f6368] transition-transform duration-300 ${isColOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        
        {isColOpen && (
          <div className="grid grid-cols-2 gap-2 mt-4 animate-in slide-in-from-top-2 fade-in duration-200">
            {[
              { name: '판례·법률 해석', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
              { name: '사망·자살 보험금', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
              { name: '질병진단·실손', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { name: '교통사고 보상', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
              { name: '배상책임·의료', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
              { name: '근재·산재 사고', color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20' },
              { name: '장해평가·면책', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
              { name: '보상가이드', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' }
            ].map(cat => (
              <Link
                key={cat.name}
                href={`/blog?category=${encodeURIComponent(cat.name)}`}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 dark:bg-[#303134] border border-gray-100 dark:border-white/5 hover:border-[var(--google-blue)] hover:bg-[#e8f0fe] dark:hover:bg-[#174ea6]/20 transition-all group/item"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-1.5 ${cat.bg} ${cat.color} group-hover/item:scale-105 transition-transform`}>
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                </div>
                <span className="text-[11px] font-bold text-[#202124] dark:text-[#e8eaed] text-center group-hover/item:text-[var(--google-blue)] transition-colors break-keep leading-tight">{cat.name}</span>
              </Link>
            ))}
          </div>
        )}
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
