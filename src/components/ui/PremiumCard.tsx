import React from 'react';
import AppIcon, { type AppIconName } from './AppIcon';

export type BorderColor = 'red' | 'rose' | 'blue' | 'cyan' | 'green' | 'teal' | 'orange' | 'purple' | 'indigo' | 'yellow' | 'charcoal' | 'ink' | 'default';

export interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  borderColor?: BorderColor;
  hoverEffect?: boolean;
  watermarkEmoji?: string;
  watermarkIcon?: AppIconName;
}

export default function PremiumCard({
  children,
  className = '',
  borderColor = 'default',
  hoverEffect = true,
  watermarkEmoji,
  watermarkIcon,
  ...props
}: PremiumCardProps) {
  // 기본 상태(모바일 포함)에서 시인성을 보장하는 은은한 톤온톤 테두리
  const baseBorders: Record<BorderColor, string> = {
    blue: 'border-blue-200/90 dark:border-blue-900/50',
    cyan: 'border-sky-200/90 dark:border-sky-900/50',
    red: 'border-red-200/90 dark:border-red-900/50',
    rose: 'border-rose-200/90 dark:border-rose-900/50',
    green: 'border-emerald-200/90 dark:border-emerald-900/50',
    teal: 'border-teal-200/90 dark:border-teal-900/50',
    orange: 'border-orange-200/90 dark:border-orange-900/50',
    yellow: 'border-amber-200/90 dark:border-amber-900/50',
    purple: 'border-purple-200/90 dark:border-purple-900/50',
    indigo: 'border-indigo-200/90 dark:border-indigo-900/50',
    charcoal: 'border-gray-200/90 dark:border-zinc-800',
    ink: 'border-gray-200/90 dark:border-zinc-800',
    default: 'border-gray-200/80 dark:border-zinc-800'
  };

  // CommonBox 및 수묵화(Ink Wash)와 일치하는 세련된 톤별 호버 글로우 & 보더
  const hoverBorders: Record<BorderColor, string> = {
    blue: 'hover:border-[var(--google-blue)] hover:shadow-[0_12px_40px_rgba(26,115,232,0.18)] dark:hover:shadow-[0_12px_40px_rgba(26,115,232,0.25)]',
    cyan: 'hover:border-sky-500 hover:shadow-[0_12px_40px_rgba(14,165,233,0.18)] dark:hover:shadow-[0_12px_40px_rgba(14,165,233,0.25)]',
    red: 'hover:border-[var(--google-red)] hover:shadow-[0_12px_40px_rgba(234,67,53,0.18)] dark:hover:shadow-[0_12px_40px_rgba(234,67,53,0.25)]',
    rose: 'hover:border-rose-500 hover:shadow-[0_12px_40px_rgba(244,63,94,0.18)] dark:hover:shadow-[0_12px_40px_rgba(244,63,94,0.25)]',
    green: 'hover:border-[var(--google-green)] hover:shadow-[0_12px_40px_rgba(52,168,83,0.18)] dark:hover:shadow-[0_12px_40px_rgba(52,168,83,0.25)]',
    teal: 'hover:border-teal-500 hover:shadow-[0_12px_40px_rgba(20,184,166,0.18)] dark:hover:shadow-[0_12px_40px_rgba(20,184,166,0.25)]',
    orange: 'hover:border-orange-500 hover:shadow-[0_12px_40px_rgba(249,115,22,0.18)] dark:hover:shadow-[0_12px_40px_rgba(249,115,22,0.25)]',
    yellow: 'hover:border-[var(--google-yellow)] hover:shadow-[0_12px_40px_rgba(249,171,0,0.18)] dark:hover:shadow-[0_12px_40px_rgba(249,171,0,0.25)]',
    purple: 'hover:border-purple-500 hover:shadow-[0_12px_40px_rgba(168,85,247,0.18)] dark:hover:shadow-[0_12px_40px_rgba(168,85,247,0.25)]',
    indigo: 'hover:border-indigo-500 hover:shadow-[0_12px_40px_rgba(99,102,241,0.18)] dark:hover:shadow-[0_12px_40px_rgba(99,102,241,0.25)]',
    charcoal: 'hover:border-zinc-800 dark:hover:border-zinc-300 hover:shadow-[0_14px_44px_rgba(24,24,27,0.12)] dark:hover:shadow-[0_14px_44px_rgba(255,255,255,0.08)]',
    ink: 'hover:border-zinc-800 dark:hover:border-zinc-300 hover:shadow-[0_14px_44px_rgba(24,24,27,0.12)] dark:hover:shadow-[0_14px_44px_rgba(255,255,255,0.08)]',
    default: 'hover:border-zinc-700 dark:hover:border-zinc-400 hover:shadow-[0_12px_40px_rgba(24,24,27,0.08)] dark:hover:shadow-[0_12px_40px_rgba(255,255,255,0.05)]'
  };

  const isInk = borderColor === 'charcoal' || borderColor === 'ink';

  const baseClass = `bg-white dark:bg-[#202124] p-4 sm:p-5 border ${baseBorders[borderColor]} shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-all duration-200 relative overflow-hidden rounded-none flex flex-col min-h-0 group ${
    hoverEffect ? hoverBorders[borderColor] : ''
  }`;

  return (
    <div className={`${baseClass} ${className}`} {...props}>
      {/* 수묵화(Ink Wash) 전용 은은한 먹물 번짐 워시 & 좌측 포인트 획 */}
      {isInk && (
        <>
          <div className="absolute top-0 left-0 w-1 h-full bg-zinc-900 dark:bg-zinc-100 opacity-0 group-hover:opacity-100 transition-opacity z-20" />
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-100/60 via-zinc-50/20 to-transparent dark:from-zinc-800/40 dark:via-zinc-800/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-0" />
        </>
      )}
      {/* 워터마크 SVG 아이콘 (CommonBox 3D 일체화 — 잘림 없는 68px 황금 콤팩트 엠블럼) */}
      {watermarkIcon && (
        <div className="absolute right-3.5 bottom-2.5 opacity-[0.035] dark:opacity-[0.055] select-none pointer-events-none group-hover:scale-105 group-hover:-translate-y-0.5 transition-all duration-300 z-0">
          <AppIcon name={watermarkIcon} size={68} strokeWidth={1.5} />
        </div>
      )}
      {/* 레거시 워터마크 이모지 지원 */}
      {!watermarkIcon && watermarkEmoji && (
        <div className="absolute right-[-8px] bottom-[-14px] opacity-[0.03] dark:opacity-[0.05] text-[90px] select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 z-0">
          {watermarkEmoji}
        </div>
      )}
      <div className="w-full h-full flex flex-col min-h-0 flex-1 relative z-10">
        {children}
      </div>
    </div>
  );
}
