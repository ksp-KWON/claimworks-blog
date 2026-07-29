import React from 'react';

type BoxTone = 'blue' | 'red' | 'green' | 'yellow' | 'purple';

interface CommonBoxProps {
  tone: BoxTone;
  emoji: string;
  title: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  topElement?: React.ReactNode;
}

export default function CommonBox({ tone, emoji, title, children, headerRight, topElement }: CommonBoxProps) {
  const boxHoverBorders: Record<BoxTone, string> = {
    blue: 'border-blue-200 dark:border-blue-900/50 hover:border-[var(--google-blue)] hover:shadow-[0_16px_50px_rgba(26,115,232,0.25)]',
    red: 'border-red-200 dark:border-red-900/50 hover:border-[var(--google-red)] hover:shadow-[0_16px_50px_rgba(234,67,53,0.25)]',
    green: 'border-green-200 dark:border-green-900/50 hover:border-[var(--google-green)] hover:shadow-[0_16px_50px_rgba(52,168,83,0.25)]',
    yellow: 'border-yellow-300 dark:border-yellow-900/50 hover:border-yellow-500 hover:shadow-[0_16px_50px_rgba(234,179,8,0.25)]',
    purple: 'border-purple-200 dark:border-purple-900/50 hover:border-purple-500 hover:shadow-[0_16px_50px_rgba(168,85,247,0.25)]',
  };

  const headerGradients: Record<BoxTone, string> = {
    blue: 'bg-gradient-to-r from-blue-50/80 to-transparent dark:from-blue-900/20 dark:to-transparent border-b border-blue-100 dark:border-blue-900/30',
    red: 'bg-gradient-to-r from-red-50/80 to-transparent dark:from-red-900/20 dark:to-transparent border-b border-red-100 dark:border-red-900/30',
    green: 'bg-gradient-to-r from-green-50/80 to-transparent dark:from-green-900/20 dark:to-transparent border-b border-green-100 dark:border-green-900/30',
    yellow: 'bg-gradient-to-r from-yellow-50/80 to-transparent dark:from-yellow-900/20 dark:to-transparent border-b border-yellow-200 dark:border-yellow-900/30',
    purple: 'bg-gradient-to-r from-purple-50/80 to-transparent dark:from-purple-900/20 dark:to-transparent border-b border-purple-100 dark:border-purple-900/30',
  };

  const textStyles: Record<BoxTone, string> = {
    blue: 'text-[var(--google-blue)] dark:text-blue-400 border-l-[var(--google-blue)]',
    red: 'text-[var(--google-red)] dark:text-red-400 border-l-[var(--google-red)]',
    green: 'text-[var(--google-green)] dark:text-green-400 border-l-[var(--google-green)]',
    yellow: 'text-yellow-600 dark:text-yellow-400 border-l-yellow-500',
    purple: 'text-purple-600 dark:text-purple-400 border-l-purple-500',
  };

  return (
    <div className={`my-10 bg-white dark:bg-[#202124] p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden group border ${boxHoverBorders[tone]}`}>
      {topElement}
      {/* Watermark Emoji */}
      <div className="absolute right-[-10px] bottom-[-20px] opacity-[0.03] dark:opacity-[0.05] text-[120px] select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
        {emoji}
      </div>

      <div className="relative z-10">
        {/* Full-width gradient header */}
        <div className={`-mt-5 sm:-mt-6 -mx-5 sm:-mx-6 px-5 sm:px-6 py-4 mb-4 flex items-center justify-between gap-3 flex-wrap ${headerGradients[tone]}`}>
          <h3 className={`text-base font-bold flex items-center gap-1.5 border-l-4 pl-3 ${textStyles[tone]}`}>
            <span className="text-lg leading-none">{emoji}</span>
            <span>{title}</span>
          </h3>
          {headerRight && <div>{headerRight}</div>}
        </div>

        {/* Content Area */}
        <div className="text-[14.5px] sm:text-[15px] font-medium text-gray-700 dark:text-[#e8eaed] leading-[1.7] tracking-tight break-keep">
          {children}
        </div>
      </div>
    </div>
  );
}
