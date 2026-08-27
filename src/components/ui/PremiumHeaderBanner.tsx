import React from 'react';
import Link from 'next/link';
import PremiumCard, { type BorderColor } from './PremiumCard';
import PremiumHeading from './PremiumHeading';
import PremiumBadge, { type BadgeColor } from './PremiumBadge';
import AppIcon, { type AppIconName } from './AppIcon';

export type HeaderBannerTheme = 'blue' | 'red' | 'green' | 'purple' | 'teal' | 'indigo' | 'amber' | 'rose' | 'sky' | 'default';

export interface HeaderBadgeItem {
  text: string;
  color?: BadgeColor;
}

export interface PremiumHeaderBannerProps {
  /** 테마 컬러 (기본값: 'blue') */
  theme?: HeaderBannerTheme;
  /** W3C 표준 SVG 심볼 이름 */
  icon: AppIconName;
  /** 메인 타이틀 */
  title: React.ReactNode;
  /** 상단 뱃지 목록 (문자열 또는 {text, color} 객체) */
  badges?: Array<string | HeaderBadgeItem>;
  /** 하단 서술형 설명문 */
  description?: React.ReactNode;
  /** 우측 상단 바로가기 링크 (선택사항) */
  rightLink?: {
    href: string;
    text: string;
    isExternal?: boolean;
  };
  /** HTML Heading Level (기본값: 1) */
  level?: 1 | 2;
  /** 추가 클래스 */
  className?: string;
}

interface ThemeConfig {
  cardBorder: BorderColor;
  bgGradient: string;
  iconColor: string;
  defaultBadgeColor: BadgeColor;
}

const THEME_CONFIGS: Record<HeaderBannerTheme, ThemeConfig> = {
  blue: {
    cardBorder: 'blue',
    bgGradient: '!bg-gradient-to-r !from-blue-50/90 !via-indigo-50/50 !to-transparent dark:!from-blue-950/40 dark:!via-indigo-950/20 dark:!to-transparent border-blue-200/90 dark:border-blue-900/50',
    iconColor: 'text-blue-600 dark:text-blue-400',
    defaultBadgeColor: 'blue'
  },
  indigo: {
    cardBorder: 'indigo',
    bgGradient: '!bg-gradient-to-r !from-indigo-50/90 !via-blue-50/50 !to-transparent dark:!from-indigo-950/40 dark:!via-blue-950/20 dark:!to-transparent border-indigo-200/90 dark:border-indigo-900/50',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    defaultBadgeColor: 'indigo'
  },
  red: {
    cardBorder: 'red',
    bgGradient: '!bg-gradient-to-r !from-red-50/90 !via-rose-50/50 !to-transparent dark:!from-red-950/40 dark:!via-rose-950/20 dark:!to-transparent border-red-200/90 dark:border-red-900/50',
    iconColor: 'text-red-600 dark:text-red-400',
    defaultBadgeColor: 'red'
  },
  rose: {
    cardBorder: 'rose',
    bgGradient: '!bg-gradient-to-r !from-rose-50/90 !via-pink-50/50 !to-transparent dark:!from-rose-950/40 dark:!via-pink-950/20 dark:!to-transparent border-rose-200/90 dark:border-rose-900/50',
    iconColor: 'text-rose-600 dark:text-rose-400',
    defaultBadgeColor: 'rose'
  },
  green: {
    cardBorder: 'green',
    bgGradient: '!bg-gradient-to-r !from-emerald-50/90 !via-teal-50/50 !to-transparent dark:!from-emerald-950/40 dark:!via-teal-950/20 dark:!to-transparent border-emerald-200/90 dark:border-emerald-900/50',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    defaultBadgeColor: 'green'
  },
  teal: {
    cardBorder: 'teal',
    bgGradient: '!bg-gradient-to-r !from-teal-50/90 !via-emerald-50/50 !to-transparent dark:!from-teal-950/40 dark:!via-emerald-950/20 dark:!to-transparent border-teal-200/90 dark:border-teal-900/50',
    iconColor: 'text-teal-600 dark:text-teal-400',
    defaultBadgeColor: 'teal'
  },
  purple: {
    cardBorder: 'purple',
    bgGradient: '!bg-gradient-to-r !from-purple-50/90 !via-indigo-50/50 !to-transparent dark:!from-purple-950/40 dark:!via-indigo-950/20 dark:!to-transparent border-purple-200/90 dark:border-purple-900/50',
    iconColor: 'text-purple-600 dark:text-purple-400',
    defaultBadgeColor: 'purple'
  },
  amber: {
    cardBorder: 'yellow',
    bgGradient: '!bg-gradient-to-r !from-amber-50/90 !via-yellow-50/50 !to-transparent dark:!from-amber-950/40 dark:!via-yellow-950/20 dark:!to-transparent border-amber-200/90 dark:border-amber-900/50',
    iconColor: 'text-amber-600 dark:text-amber-400',
    defaultBadgeColor: 'yellow'
  },
  sky: {
    cardBorder: 'blue',
    bgGradient: '!bg-gradient-to-r !from-sky-50/90 !via-blue-50/50 !to-transparent dark:!from-sky-950/40 dark:!via-blue-950/20 dark:!to-transparent border-sky-200/90 dark:border-sky-900/50',
    iconColor: 'text-sky-600 dark:text-sky-400',
    defaultBadgeColor: 'blue'
  },
  default: {
    cardBorder: 'blue',
    bgGradient: '!bg-gradient-to-r !from-blue-50/90 !via-indigo-50/50 !to-transparent dark:!from-blue-950/40 dark:!via-indigo-950/20 dark:!to-transparent border-blue-200/90 dark:border-blue-900/50',
    iconColor: 'text-blue-600 dark:text-blue-400',
    defaultBadgeColor: 'blue'
  }
};

/**
 * PremiumHeaderBanner
 * 보상스쿨 6대 전문 센터 및 매거진/도메인 전역 표준 공통 헤더 배너 컴포넌트
 * - 단일 표준 황금 폰트 규격: `!text-xl sm:!text-2xl`
 * - 단일 표준 황금 패딩 규격: `!p-5 sm:!p-7`
 * - 9대 톤온톤 테마 그라데이션 및 W3C SVG 라인 심볼 자동 동기화
 */
export default function PremiumHeaderBanner({
  theme = 'blue',
  icon,
  title,
  badges = [],
  description,
  rightLink,
  level = 1,
  className = ''
}: PremiumHeaderBannerProps) {
  const config = THEME_CONFIGS[theme] || THEME_CONFIGS.default;

  return (
    <PremiumCard
      borderColor={config.cardBorder}
      hoverEffect={false}
      watermarkIcon={icon}
      className={`!p-5 sm:!p-7 ${config.bgGradient} ${className}`}
    >
      <div className="relative z-10">
        {/* 상단 뱃지 및 우측 액션 링크 영역 */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          {badges.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {badges.map((badge, idx) => {
                const text = typeof badge === 'string' ? badge : badge.text;
                const color = typeof badge === 'string' 
                  ? (idx === 0 ? config.defaultBadgeColor : 'gray') 
                  : (badge.color || config.defaultBadgeColor);

                return (
                  <PremiumBadge key={idx} color={color}>
                    {text}
                  </PremiumBadge>
                );
              })}
            </div>
          ) : <div />}

          {/* 우측 바로가기 링크 (선택사항) */}
          {rightLink && (
            <Link
              href={rightLink.href}
              className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group/link shrink-0"
              {...(rightLink.isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {rightLink.text}
              <AppIcon name="chevron-right" size={14} className="group-hover/link:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>

        {/* 메인 타이틀 (표준 황금 규격: !text-xl sm:!text-2xl) */}
        <PremiumHeading
          level={level}
          gradient={theme as any}
          showLeftBorder={false}
          icon={<AppIcon name={icon} size={24} className={`${config.iconColor} shrink-0`} />}
          className="!mb-2 !text-xl sm:!text-2xl"
        >
          {title}
        </PremiumHeading>

        {/* 하단 설명문 */}
        {description && (
          <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] break-keep leading-relaxed font-medium">
            {description}
          </p>
        )}
      </div>
    </PremiumCard>
  );
}
