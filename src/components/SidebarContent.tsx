'use client';

/**
 * SidebarContent.tsx
 * 사이드바 컴포넌트 (Client Component)
 *
 * [리팩토링] 태그 목록을 외부(layout.tsx)에서 props로 받아 렌더링
 * - 중복 코드를 제거하고 사이드바 아이템을 배열(배치)로 통합 관리 (최신 컴포넌트화)
 */

import Link from 'next/link';
import SidebarTagMore from './SidebarTagMore';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumHeading from '@/components/ui/PremiumHeading';

interface SidebarContentProps {
  tags?: string[];
}

const INITIAL_TAG_COUNT = 4;

type ThemeColor = 'blue' | 'red' | 'green' | 'yellow' | 'purple';

interface SidebarItem {
  href: string;
  icon: string;
  title: string;
  themeColor: ThemeColor;
  badgeText: string;
  description: string;
  buttonText: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    href: '/precedent-search',
    icon: '⚖️',
    title: '빅데이터 판례검색센터',
    themeColor: 'blue',
    badgeText: '실시간 연동',
    description: '사고 경위나 보상 문제를 일상어로 검색하면, 법제처 공공데이터에서 나에게 가장 유리한 핵심 대법원 판례를 찾아드립니다.',
    buttonText: '빅데이터 판례 검색 시작하기'
  },
  {
    href: '/fss-news',
    icon: '🏛️',
    title: '금감원 소비자보호센터',
    themeColor: 'red',
    badgeText: '실시간 연동',
    description: '금감원 소비자경보, 분쟁조정사례, 금융꿀팁, 약관 보도자료를 실시간 분석하여 권리를 지켜드립니다.',
    buttonText: '소비자보호 데이터 조회하기'
  },
  {
    href: '/traffic-care',
    icon: '🚗',
    title: '교통사고 로컬 케어',
    themeColor: 'green',
    badgeText: '지역 안내',
    description: '도로교통공단 안전 통계와 우수 신경/정형외과 병원 및 사고 맞춤형 손해사정 지식을 안내해 드립니다.',
    buttonText: '내 지역 교통사고 케어 가기'
  },
  {
    href: '/calculator',
    icon: '🧮',
    title: '보상금·합의금 계산기',
    themeColor: 'purple',
    badgeText: '통합 계산',
    description: '약관 지급기준 및 법원 판례 기준을 적용한 예상 합의금과 소송가액을 한 번에 확인하세요.',
    buttonText: '계산기 시작하기'
  },
  {
    href: '/regions',
    icon: '🗺️',
    title: '지역별 의료기관',
    themeColor: 'green',
    badgeText: '전국 매핑',
    description: '전국 17개 시/도, 226개 시/군/구별 보상 전문 의료기관 및 협력 병원 정보를 제공합니다.',
    buttonText: '지역별 기관 찾기'
  },
  {
    href: '/categories',
    icon: '📂',
    title: '분야별 전문 보상 가이드',
    themeColor: 'yellow',
    badgeText: '핵심 실무',
    description: '보상스쿨 손해사정사의 핵심 전문 칼럼들과 진료과목별 주요 의료분쟁 가이드를 통합 제공합니다.',
    buttonText: '전체 가이드 보기'
  }
];

const THEME_STYLES: Record<ThemeColor, { textIcon: string; badgeBg: string; buttonHoverBg: string; buttonHoverText: string }> = {
  blue: {
    textIcon: 'text-[var(--google-blue)]',
    badgeBg: 'bg-[#e8f0fe] dark:bg-[#174ea6]/20 text-[var(--google-blue)] dark:text-[#8ab4f8] border-[#d2e3fc]/30 dark:border-[#174ea6]/30',
    buttonHoverBg: 'group-hover:bg-[#e8f0fe] dark:group-hover:bg-[#174ea6]/20',
    buttonHoverText: 'group-hover:text-[var(--google-blue)] dark:group-hover:text-[#8ab4f8]'
  },
  red: {
    textIcon: 'text-red-500',
    badgeBg: 'bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 border-red-100/30 dark:border-red-950/30',
    buttonHoverBg: 'group-hover:bg-red-50 dark:group-hover:bg-red-950/20',
    buttonHoverText: 'group-hover:text-red-500 dark:group-hover:text-red-400'
  },
  green: {
    textIcon: 'text-[#137333]', // or text-[var(--google-green)]
    badgeBg: 'bg-green-50 dark:bg-green-950/20 text-[#137333] dark:text-[#81c995] border-green-100/30 dark:border-green-950/30',
    buttonHoverBg: 'group-hover:bg-green-50 dark:group-hover:bg-green-950/20',
    buttonHoverText: 'group-hover:text-[#137333] dark:group-hover:text-[#81c995]'
  },
  yellow: {
    textIcon: 'text-[var(--google-yellow)]',
    badgeBg: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-500 border-yellow-100/30 dark:border-yellow-900/30',
    buttonHoverBg: 'group-hover:bg-yellow-50 dark:group-hover:bg-yellow-900/20',
    buttonHoverText: 'group-hover:text-yellow-600 dark:group-hover:text-yellow-500'
  },
  purple: {
    textIcon: 'text-purple-500',
    badgeBg: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100/30 dark:border-purple-900/30',
    buttonHoverBg: 'group-hover:bg-purple-50 dark:group-hover:bg-purple-900/20',
    buttonHoverText: 'group-hover:text-purple-600 dark:group-hover:text-purple-400'
  }
};

export default function SidebarContent({ tags = [] }: SidebarContentProps) {
  const visibleTags = tags.slice(0, INITIAL_TAG_COUNT);
  const hiddenTags  = tags.slice(INITIAL_TAG_COUNT);

  const bgGradients: Record<string, string> = {
    blue: 'bg-gradient-to-r from-blue-100/80 to-transparent dark:from-blue-900/30 dark:to-transparent',
    red: 'bg-gradient-to-r from-red-100/80 to-transparent dark:from-red-900/30 dark:to-transparent',
    green: 'bg-gradient-to-r from-green-100/80 to-transparent dark:from-green-900/30 dark:to-transparent',
    yellow: 'bg-gradient-to-r from-yellow-100/80 to-transparent dark:from-yellow-900/30 dark:to-transparent',
    purple: 'bg-gradient-to-r from-purple-100/80 to-transparent dark:from-purple-900/30 dark:to-transparent',
  };

  return (
    <div className="space-y-6">
      {SIDEBAR_ITEMS.map((item, index) => {
        const theme = THEME_STYLES[item.themeColor];
        return (
          <Link key={index} href={item.href} className="block group">
            <PremiumCard borderColor={item.themeColor} hoverEffect className="!p-5 relative overflow-hidden">
              <div className="absolute right-[-10px] bottom-[-20px] opacity-[0.03] dark:opacity-[0.05] text-[90px] select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                {item.icon}
              </div>
              <div className="relative z-10 space-y-2">
                <div className="flex items-center justify-between">
                  <PremiumHeading level={3} gradient={item.themeColor} showLeftBorder={true} className={`!mb-0 !text-sm pr-2 rounded-r-xl ${bgGradients[item.themeColor]}`}>
                    <span className={`${theme.textIcon} text-lg leading-none mr-2`}>{item.icon}</span>
                    {item.title}
                  </PremiumHeading>
                  <span className={`${theme.badgeBg} text-[10px] font-extrabold px-2 py-0.5 rounded-md border`}>
                    {item.badgeText}
                  </span>
                </div>
                <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">
                  {item.description}
                </p>
                <div className={`mt-3 w-full text-[13px] font-bold text-[#202124] dark:text-[#e8eaed] flex items-center justify-between transition-colors p-2.5 rounded-none bg-gray-50 dark:bg-white/5 ${theme.buttonHoverBg} ${theme.buttonHoverText}`}>
                  <div className="flex items-center gap-2">
                    {item.buttonText}
                  </div>
                  <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              </div>
            </PremiumCard>
          </Link>
        );
      })}

      {/* 인기 키워드 태그 (layout.tsx 서버에서 전달된 정적 데이터) */}
      {tags.length > 0 && (
        <PremiumCard borderColor="red" hoverEffect={true} className="!p-5">
          <PremiumHeading 
            level={3} 
            gradient="red" 
            showLeftBorder={true} 
            className={`!mb-4 !text-sm pr-2 rounded-r-xl ${bgGradients['red']}`}
            icon={
              <svg className="w-4 h-4 text-[var(--google-red)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            }
          >
            인기 키워드 태그
          </PremiumHeading>
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
        </PremiumCard>
      )}
    </div>
  );
}
