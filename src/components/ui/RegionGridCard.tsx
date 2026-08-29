import React from 'react';
import Link from 'next/link';
import AppIcon, { AppIconName } from '@/components/ui/AppIcon';

interface RegionGridCardProps {
  href: string;
  title: string;
  countLabel: string;
  icon?: AppIconName;
  badge?: string;
  indexNumber?: string;
}

export default function RegionGridCard({
  href,
  title,
  countLabel,
  icon = 'hospital',
  badge,
  indexNumber,
}: RegionGridCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between bg-white dark:bg-[#202124] p-3.5 sm:p-5 border border-teal-200/80 dark:border-teal-900/50 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:border-teal-500 dark:hover:border-teal-500 hover:shadow-[0_12px_40px_rgba(20,184,166,0.18)] dark:hover:shadow-[0_12px_40px_rgba(20,184,166,0.25)] active:scale-[0.98] transition-all duration-200 overflow-hidden outline-none"
    >
      {/* 1. 좌측 틸 포인트 바 */}
      <div className="absolute top-0 left-0 w-1 h-full bg-teal-600 opacity-0 group-hover:opacity-100 transition-opacity z-20" />

      {/* 2. 배경 은은한 틸 파스텔 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50/80 via-teal-50/20 to-transparent dark:from-teal-950/30 dark:via-teal-950/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-0" />

      {/* 3. 상단 아이콘 및 우측 뱃지 */}
      <div className="relative z-10 flex items-center justify-between mb-2 sm:mb-3">
        <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-teal-50/80 dark:bg-teal-950/50 border border-teal-200/80 dark:border-teal-900/60 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform duration-200">
          <AppIcon name={icon} size={18} />
        </div>

        {badge && (
          <span className="inline-flex items-center px-1.5 py-0.5 text-[10.5px] font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800">
            {badge}
          </span>
        )}
      </div>

      {/* 4. 중앙 지역명 및 핵심 실데이터 칩 */}
      <div className="relative z-10 text-center py-1 sm:py-2">
        <h3 className="text-sm sm:text-base font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors truncate">
          {title}
        </h3>
        <p className="text-[11px] sm:text-xs text-[#5f6368] dark:text-[#9aa0a6] font-medium mt-1 truncate">
          {countLabel}
        </p>
      </div>

      {/* 5. 하단 인덱스 번호 또는 미니멀 액센트 (모바일에서는 생략하거나 콤팩트 배치) */}
      {indexNumber && (
        <div className="relative z-10 pt-2 border-t border-gray-100 dark:border-zinc-800/80 flex items-center justify-between text-[10px] text-gray-400 dark:text-zinc-500 font-mono">
          <span>{indexNumber}</span>
          <span className="text-teal-600 dark:text-teal-400 font-bold group-hover:translate-x-0.5 transition-transform">
            →
          </span>
        </div>
      )}
    </Link>
  );
}
