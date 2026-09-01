import React from 'react';
import Link from 'next/link';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumHeading from '@/components/ui/PremiumHeading';
import AppIcon, { type AppIconName } from '@/components/ui/AppIcon';
import { HEADER_BOX_GRADIENTS, type UIThemeColor } from '@/lib/blog-tokens';

export type SectionThemeColor = UIThemeColor;

interface SectionLayoutProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  themeColor?: SectionThemeColor;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  viewAllLink?: {
    href: string;
    text?: string;
    isExternal?: boolean;
  };
  children: React.ReactNode;
  watermarkIcon?: AppIconName;
}

const hoverColorMap: Record<SectionThemeColor, string> = {
  blue: 'hover:text-blue-600 dark:hover:text-blue-400',
  rose: 'hover:text-rose-600 dark:hover:text-rose-400',
  cyan: 'hover:text-sky-600 dark:hover:text-sky-400',
  sky: 'hover:text-sky-600 dark:hover:text-sky-400',
  red: 'hover:text-red-600 dark:hover:text-red-400',
  green: 'hover:text-emerald-600 dark:hover:text-emerald-400',
  orange: 'hover:text-orange-600 dark:hover:text-orange-400',
  teal: 'hover:text-teal-600 dark:hover:text-teal-400',
  indigo: 'hover:text-indigo-600 dark:hover:text-indigo-400',
  purple: 'hover:text-purple-600 dark:hover:text-purple-400',
  yellow: 'hover:text-amber-600 dark:hover:text-amber-400',
  amber: 'hover:text-amber-600 dark:hover:text-amber-400',
  charcoal: 'hover:text-zinc-900 dark:hover:text-zinc-100',
  ink: 'hover:text-zinc-900 dark:hover:text-zinc-100',
  default: 'hover:text-blue-600 dark:hover:text-blue-400'
};

/**
 * 전역 공통 통합 섹션 컴포넌트
 * 타이틀 박스(PremiumCard)와 하단 컨텐츠 그리드를 일관된 간격(mb-6)으로 연결합니다.
 */
export default function SectionLayout({
  title,
  description,
  icon,
  themeColor = 'default',
  headingLevel = 2,
  viewAllLink,
  children,
  watermarkIcon,
  className = '',
  ...props
}: SectionLayoutProps) {
  const gradientClass = HEADER_BOX_GRADIENTS[themeColor] || HEADER_BOX_GRADIENTS.default;
  const linkHoverClass = hoverColorMap[themeColor] || hoverColorMap.default;

  return (
    <section className={`relative group/section ${className}`} {...props}>
      {/* 타이틀 박스 영역 (시그니처 파스텔 톤온톤 그라데이션) */}
      <PremiumCard 
        borderColor={themeColor as any} 
        hoverEffect={true} 
        watermarkIcon={watermarkIcon}
        className={`mb-6 !p-5 sm:!p-6 group/headerbox ${gradientClass}`}
      >
        <div className={`flex items-center justify-between gap-3 ${description ? 'mb-2.5' : ''} relative z-10 group/header`}>
          <PremiumHeading 
            level={headingLevel} 
            gradient={themeColor as any} 
            icon={icon} 
            className="!mb-0 !text-xl sm:!text-2xl" 
            showLeftBorder={false}
          >
            {title}
          </PremiumHeading>
          
          {/* 전체보기 링크 (슬림 샤프 텍스트 링크) */}
          {viewAllLink && (
            viewAllLink.isExternal ? (
              <a 
                href={viewAllLink.href} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`flex items-center gap-1 text-[11px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 ${linkHoverClass} transition-colors group/link shrink-0`}
              >
                {viewAllLink.text || '전체보기'}
                <AppIcon name="chevron-right" size={13} className="group-hover/link:translate-x-0.5 transition-transform" strokeWidth={2.5} />
              </a>
            ) : (
              <Link 
                href={viewAllLink.href}
                className={`flex items-center gap-1 text-[11px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 ${linkHoverClass} transition-colors group/link`}
              >
                {viewAllLink.text || '전체보기'}
                <AppIcon name="chevron-right" size={13} className="group-hover/link:translate-x-0.5 transition-transform" strokeWidth={2.5} />
              </Link>
            )
          )}
        </div>
        
        {/* 부가 설명 (description) */}
        {description && (
          <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] break-keep leading-relaxed font-medium relative z-10">
            {description}
          </p>
        )}
      </PremiumCard>

      {/* 하단 컨텐츠 영역 (children) */}
      <div className="relative z-10">
        {children}
      </div>
    </section>
  );
}
