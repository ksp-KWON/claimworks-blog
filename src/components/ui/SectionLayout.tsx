import React from 'react';
import Link from 'next/link';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumHeading from '@/components/ui/PremiumHeading';
import AppIcon from '@/components/ui/AppIcon';

export type SectionThemeColor = 'red' | 'rose' | 'blue' | 'green' | 'teal' | 'purple' | 'indigo' | 'yellow' | 'default';

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
}

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
  className = '',
  ...props
}: SectionLayoutProps) {
  return (
    <section className={`relative group/section ${className}`} {...props}>
      {/* 타이틀 박스 영역 */}
      <PremiumCard borderColor={themeColor} hoverEffect className="mb-6 !p-5 sm:!p-6 group/headerbox">
        <div className={`flex items-end justify-between ${description ? 'mb-3' : ''} relative z-10 group/header`}>
          <PremiumHeading 
            level={headingLevel} 
            gradient={themeColor} 
            icon={icon} 
            className="!mb-0 !text-xl sm:!text-2xl" 
            showLeftBorder={false}
          >
            {title}
          </PremiumHeading>
          
          {/* 전체보기 링크 */}
          {viewAllLink && (
            viewAllLink.isExternal ? (
              <a 
                href={viewAllLink.href} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`flex items-center gap-1 text-[11px] sm:text-xs font-bold text-gray-500 hover:text-${themeColor === 'default' ? 'blue' : themeColor}-500 transition-colors group/link`}
              >
                {viewAllLink.text || '전체보기'}
                <AppIcon name="chevron-right" size={14} className="group-hover/link:translate-x-0.5 transition-transform" strokeWidth={2.5} />
              </a>
            ) : (
              <Link 
                href={viewAllLink.href}
                className={`flex items-center gap-1 text-[11px] sm:text-xs font-bold text-gray-500 hover:text-${themeColor === 'default' ? 'blue' : themeColor}-500 transition-colors group/link`}
              >
                {viewAllLink.text || '전체보기'}
                <AppIcon name="chevron-right" size={14} className="group-hover/link:translate-x-0.5 transition-transform" strokeWidth={2.5} />
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
