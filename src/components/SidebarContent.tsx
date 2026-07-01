'use client';

/**
 * SidebarContent.tsx
 * 사이드바 컴포넌트 (Client Component)
 *
 * [리팩토링] 태그 목록을 외부(layout.tsx)에서 props로 받아 렌더링
 * - 이전: fetch('/api/posts') → 정적 배포에서 API 없어 태그 빈칸 버그
 * - 현재: layout.tsx 서버에서 미리 계산된 tags를 props로 주입
 *         클라이언트에서 추가 네트워크 요청 없이 즉시 렌더링
 */

import Link from 'next/link';
import { RegionalCategories } from '@/components/SidebarCategories';
import SidebarTagMore from './SidebarTagMore';

interface SidebarContentProps {
  tags?: string[];
}

const INITIAL_TAG_COUNT = 4;

export default function SidebarContent({ tags = [] }: SidebarContentProps) {
  const visibleTags = tags.slice(0, INITIAL_TAG_COUNT);
  const hiddenTags  = tags.slice(INITIAL_TAG_COUNT);

  return (
    <div className="space-y-6">
      {/* ⚖️ AI 판례검색센터 바로가기 배너 */}
      <Link href="/precedent-search" className="block group">
        <div className="bg-white dark:bg-[#202124] p-5 rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:shadow-[0_16px_50px_rgba(26,115,232,0.25)] hover:border-[var(--google-blue)] transition-all duration-300 relative overflow-hidden">
          <div className="absolute right-[-10px] bottom-[-20px] opacity-[0.03] dark:opacity-[0.05] text-[90px] select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">⚖️</div>
          <div className="relative z-10 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2 border-l-4 border-[var(--google-blue)] pl-2.5">
                <span className="text-[var(--google-blue)] text-lg leading-none">⚖️</span>
                AI 판례검색센터
              </h3>
              <span className="bg-[#e8f0fe] dark:bg-[#174ea6]/20 text-[var(--google-blue)] dark:text-[#8ab4f8] text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-[#d2e3fc]/30 dark:border-[#174ea6]/30">실시간 연동</span>
            </div>
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">사고 경위나 보상 문제를 일상어로 검색하면, 법제처 공공데이터에서 나에게 가장 유리한 핵심 대법원 판례를 찾아드립니다.</p>
            <div className="mt-3 w-full text-[13px] font-bold text-[#202124] dark:text-[#e8eaed] flex items-center justify-between transition-colors p-2.5 rounded-none bg-gray-50 dark:bg-white/5 group-hover:bg-[#e8f0fe] dark:group-hover:bg-[#174ea6]/20 group-hover:text-[var(--google-blue)] dark:group-hover:text-[#8ab4f8]">
              <div className="flex items-center gap-2">
                AI 판례 검색 시작하기
              </div>
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
          </div>
        </div>
      </Link>

      {/* 🏛️ 금감원 소비자보호센터 바로가기 배너 */}
      <Link href="/fss-news" className="block group">
        <div className="bg-white dark:bg-[#202124] p-5 rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:shadow-[0_16px_50px_rgba(239,68,68,0.25)] hover:border-red-500 transition-all duration-300 relative overflow-hidden">
          <div className="absolute right-[-10px] bottom-[-20px] opacity-[0.03] dark:opacity-[0.05] text-[90px] select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">🏛️</div>
          <div className="relative z-10 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2 border-l-4 border-red-500 pl-2.5">
                <span className="text-red-500 text-lg leading-none">🏛️</span>
                금감원 소비자보호센터
              </h3>
              <span className="bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-red-100/30 dark:border-red-950/30">실시간 연동</span>
            </div>
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">금감원 소비자경보, 분쟁조정사례, 금융꿀팁, 약관 보도자료를 실시간 분석하여 권리를 지켜드립니다.</p>
            <div className="mt-3 w-full text-[13px] font-bold text-[#202124] dark:text-[#e8eaed] flex items-center justify-between transition-colors p-2.5 rounded-none bg-gray-50 dark:bg-white/5 group-hover:bg-red-50 dark:group-hover:bg-red-950/20 group-hover:text-red-500 dark:group-hover:text-red-400">
              <div className="flex items-center gap-2">
                소비자보호 데이터 조회하기
              </div>
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
          </div>
        </div>
      </Link>

      {/* 🚗 교통사고 로컬 안심케어 센터 */}
      <Link href="/traffic-care" className="block group">
        <div className="bg-white dark:bg-[#202124] p-5 rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:shadow-[0_16px_50px_rgba(19,115,51,0.25)] hover:border-[#137333] transition-all duration-300 relative overflow-hidden">
          <div className="absolute right-[-10px] bottom-[-20px] opacity-[0.03] dark:opacity-[0.05] text-[90px] select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">🚗</div>
          <div className="relative z-10 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2 border-l-4 border-[#137333] pl-2.5">
                <span className="text-[#137333] text-lg leading-none">🚗</span>
                교통사고 로컬 안심케어
              </h3>
              <span className="bg-green-50 dark:bg-green-950/20 text-[#137333] dark:text-[#81c995] text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-green-100/30 dark:border-green-950/30">실시간 연동</span>
            </div>
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">도로교통공단 안전 통계와 우수 신경/정형외과 병원 및 사고 맞춤형 손해사정 지식을 안내해 드립니다.</p>
            <div className="mt-3 w-full text-[13px] font-bold text-[#202124] dark:text-[#e8eaed] flex items-center justify-between transition-colors p-2.5 rounded-none bg-gray-50 dark:bg-white/5 group-hover:bg-green-50 dark:group-hover:bg-green-950/20 group-hover:text-[#137333] dark:group-hover:text-[#81c995]">
              <div className="flex items-center gap-2">
                내 지역 교통사고 케어 가기
              </div>
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
          </div>
        </div>
      </Link>

      {/* 🧮 보상금·합의금 계산기 */}
      <Link href="/calculator" className="block group">
        <div className="bg-white dark:bg-[#202124] p-5 rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:shadow-[0_16px_50px_rgba(26,115,232,0.25)] hover:border-[var(--google-blue)] transition-all duration-300 relative overflow-hidden">
          <div className="absolute right-[-10px] bottom-[-20px] opacity-[0.03] dark:opacity-[0.05] text-[90px] select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">🧮</div>
          <div className="relative z-10 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2 border-l-4 border-[var(--google-blue)] pl-2.5">
                <span className="text-[var(--google-blue)] text-lg leading-none">🧮</span>
                보상금·합의금 계산기
              </h3>
              <span className="bg-[#e8f0fe] dark:bg-[#174ea6]/20 text-[var(--google-blue)] dark:text-[#8ab4f8] text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-[#d2e3fc]/30 dark:border-[#174ea6]/30">통합 계산</span>
            </div>
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">약관 지급기준 및 법원 판례 기준을 적용한 예상 합의금과 소송가액을 한 번에 확인하세요.</p>
            <div className="mt-3 w-full text-[13px] font-bold text-[#202124] dark:text-[#e8eaed] flex items-center justify-between transition-colors p-2.5 rounded-none bg-gray-50 dark:bg-white/5 group-hover:bg-[#e8f0fe] dark:group-hover:bg-[#174ea6]/20 group-hover:text-[var(--google-blue)] dark:group-hover:text-[#8ab4f8]">
              <div className="flex items-center gap-2">
                계산기 시작하기
              </div>
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
          </div>
        </div>
      </Link>

      {/* 지역별 의료기관 (계산기 바로 아래로 이동) */}
      <RegionalCategories />

      {/* 📂 분야별 전문 보상 가이드 */}
      <Link href="/categories" className="block group">
        <div className="bg-white dark:bg-[#202124] p-5 rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:shadow-[0_16px_50px_rgba(251,188,4,0.3)] hover:border-[var(--google-yellow)] transition-all duration-300 relative overflow-hidden">
          <div className="absolute right-[-10px] bottom-[-20px] opacity-[0.03] dark:opacity-[0.05] text-[90px] select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">📂</div>
          <div className="relative z-10 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2 border-l-4 border-[var(--google-yellow)] pl-2.5">
                <span className="text-[var(--google-yellow)] text-lg leading-none">📂</span>
                분야별 전문 보상 가이드
              </h3>
              <span className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-500 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-yellow-100/30 dark:border-yellow-900/30">핵심 실무</span>
            </div>
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">보상스쿨 손해사정사의 핵심 전문 칼럼들과 진료과목별 주요 의료분쟁 가이드를 통합 제공합니다.</p>
            <div className="mt-3 w-full text-[13px] font-bold text-[#202124] dark:text-[#e8eaed] flex items-center justify-between transition-colors p-2.5 rounded-none bg-gray-50 dark:bg-white/5 group-hover:bg-yellow-50 dark:group-hover:bg-yellow-900/20 group-hover:text-yellow-600 dark:group-hover:text-yellow-500">
              <div className="flex items-center gap-2">
                전체 가이드 보기
              </div>
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
          </div>
        </div>
      </Link>

      {/* 인기 키워드 태그 (layout.tsx 서버에서 전달된 정적 데이터) */}
      {tags.length > 0 && (
        <div className="bg-white dark:bg-[#202124] p-5 rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
          <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] mb-4 flex items-center gap-2 border-l-4 border-[var(--google-red)] pl-2.5">
            <svg className="w-4 h-4 text-[var(--google-red)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
              <line x1="7" y1="7" x2="7.01" y2="7" />
            </svg>
            인기 키워드 태그
          </h3>
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            {visibleTags.map((tag) => (
              <Link
                key={tag}
                href={`/blog?tag=${encodeURIComponent(tag)}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--google-surface-variant)] dark:bg-[#303134] text-[#5f6368] dark:text-[#c4c7c5] border border-transparent hover:border-[var(--google-blue)] hover:bg-[#e8f0fe] dark:hover:bg-[#174ea6]/20 hover:text-[var(--google-blue)] dark:hover:text-[#8ab4f8] transition-all duration-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
              >
                <span className="text-[var(--google-red)] opacity-70">#</span>
                {tag}
              </Link>
            ))}
          </div>
          {hiddenTags.length > 0 && <SidebarTagMore tags={hiddenTags} />}
        </div>
      )}
    </div>
  );
}
