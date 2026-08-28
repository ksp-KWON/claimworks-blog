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
import MenuCard from '@/components/ui/MenuCard';
import AppIcon, { type AppIconName } from '@/components/ui/AppIcon';
import type { MenuThemeColor } from '@/components/ui/MenuCard';

interface SidebarContentProps {
  tags?: string[];
}

interface SidebarItem {
  href: string;
  icon: React.ReactNode;
  title: string;
  themeColor: MenuThemeColor;
  badgeText: string;
  description: string;
  buttonText: string;
  watermarkIcon: AppIconName;
}

// ── 사이드바 6대 메뉴 — W3C 표준 AppIcon 라인 심볼 & 은은한 워터마크 탑재 ──
const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    href: '/precedent-search',
    icon: <AppIcon name="search" size={20} />,
    title: '빅데이터 판례검색센터',
    themeColor: 'blue',
    badgeText: '실시간 연동',
    description: '일상어로 검색하여 나에게 가장 유리한 대법원 핵심 판례를 찾아보세요.',
    buttonText: '빅데이터 판례 검색 시작하기',
    watermarkIcon: 'search'
  },
  {
    href: '/fss-news',
    icon: <AppIcon name="shield-check" size={20} />,
    title: '금감원 소비자보호센터',
    themeColor: 'red',
    badgeText: '실시간 연동',
    description: '금감원 소비자경보, 분쟁조정사례, 금융꿀팁, 약관 보도자료를 실시간 분석하여 권리를 지켜드립니다.',
    buttonText: '소비자보호 데이터 조회하기',
    watermarkIcon: 'shield-check'
  },
  {
    href: '/traffic-care',
    icon: <AppIcon name="car" size={20} />,
    title: '교통사고 로컬 케어',
    themeColor: 'green',
    badgeText: '지역 안내',
    description: '도로교통공단 안전 통계와 우수 신경/정형외과 병원 및 사고 맞춤형 손해사정 지식을 안내해 드립니다.',
    buttonText: '내 지역 교통사고 케어 가기',
    watermarkIcon: 'car'
  },
  {
    href: '/calculator',
    icon: <AppIcon name="calculator" size={20} />,
    title: '보상금·합의금 계산기',
    themeColor: 'purple',
    badgeText: '통합 계산',
    description: '약관 지급기준 및 법원 판례 기준을 적용한 예상 합의금과 소송가액을 한 번에 확인하세요.',
    buttonText: '계산기 시작하기',
    watermarkIcon: 'calculator'
  },
  {
    href: '/regions',
    icon: <AppIcon name="compass" size={20} />,
    title: '지역별 의료기관',
    themeColor: 'teal',
    badgeText: '전국 매핑',
    description: '전국 17개 시/도, 226개 시/군/구별 보상 전문 의료기관 및 협력 병원 정보를 제공합니다.',
    buttonText: '지역별 기관 찾기',
    watermarkIcon: 'compass'
  },
  {
    href: '/categories',
    icon: <AppIcon name="folder" size={20} />,
    title: '분야별 전문 보상 가이드',
    themeColor: 'yellow',
    badgeText: '핵심 실무',
    description: '보상스쿨 손해사정사의 핵심 전문 칼럼들과 진료과목별 주요 의료분쟁 가이드를 통합 제공합니다.',
    buttonText: '전체 가이드 보기',
    watermarkIcon: 'folder'
  }
];

const INITIAL_TAG_COUNT = 4;

export default function SidebarContent({ tags = [] }: SidebarContentProps) {
  const visibleTags = tags.slice(0, INITIAL_TAG_COUNT);
  const hiddenTags  = tags.slice(INITIAL_TAG_COUNT);

  return (
    <div className="space-y-6">
      {SIDEBAR_ITEMS.map((item, index) => (
        <MenuCard key={index} {...item} />
      ))}

      {/* 인기 키워드 태그 (layout.tsx 서버에서 전달된 정적 데이터) */}
      {tags.length > 0 && (
        <PremiumCard borderColor="red" hoverEffect={true} watermarkIcon="pin" className="!p-4 sm:!p-5">
          <div className="flex items-center justify-between min-w-0 gap-2 mb-3.5">
            <div className="flex items-center gap-2 min-w-0 flex-1 pr-2 rounded-none bg-gradient-to-r from-red-100/80 to-transparent dark:from-red-900/30 dark:to-transparent">
              <span className="text-red-500 shrink-0 flex items-center justify-center">
                <AppIcon name="pin" size={18} />
              </span>
              <h3 className="text-sm font-extrabold text-[#202124] dark:text-white truncate">
                인기 키워드 태그
              </h3>
            </div>
            <span className="bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400 border-red-100/30 dark:border-red-950/30 shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded-none border">
              실시간 태그
            </span>
          </div>
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
