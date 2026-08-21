import React from 'react';

type BoxTone = 'blue' | 'red' | 'green' | 'yellow' | 'purple';

interface CommonBoxProps {
  tone: BoxTone;
  title: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  topElement?: React.ReactNode;
  emoji?: string; // 하위 호환성 유지용 (렌더링은 배제)
}

export default function CommonBox({ tone, title, children, headerRight, topElement }: CommonBoxProps) {
  const boxHoverBorders: Record<BoxTone, string> = {
    blue: 'border-blue-200 dark:border-blue-900/50 hover:border-[var(--google-blue)] hover:shadow-[0_12px_40px_rgba(26,115,232,0.18)]',
    red: 'border-red-200 dark:border-red-900/50 hover:border-[var(--google-red)] hover:shadow-[0_12px_40px_rgba(234,67,53,0.18)]',
    green: 'border-green-200 dark:border-green-900/50 hover:border-[var(--google-green)] hover:shadow-[0_12px_40px_rgba(52,168,83,0.18)]',
    yellow: 'border-yellow-300 dark:border-yellow-900/50 hover:border-yellow-500 hover:shadow-[0_12px_40px_rgba(234,179,8,0.18)]',
    purple: 'border-purple-200 dark:border-purple-900/50 hover:border-purple-500 hover:shadow-[0_12px_40px_rgba(168,85,247,0.18)]',
  };

  const headerGradients: Record<BoxTone, string> = {
    blue: 'bg-gradient-to-r from-blue-50/90 to-transparent dark:from-blue-900/25 dark:to-transparent border-b border-blue-100 dark:border-blue-900/40',
    red: 'bg-gradient-to-r from-red-50/90 to-transparent dark:from-red-900/25 dark:to-transparent border-b border-red-100 dark:border-red-900/40',
    green: 'bg-gradient-to-r from-green-50/90 to-transparent dark:from-green-900/25 dark:to-transparent border-b border-green-100 dark:border-green-900/40',
    yellow: 'bg-gradient-to-r from-yellow-50/90 to-transparent dark:from-yellow-900/25 dark:to-transparent border-b border-yellow-200 dark:border-yellow-900/40',
    purple: 'bg-gradient-to-r from-purple-50/90 to-transparent dark:from-purple-900/25 dark:to-transparent border-b border-purple-100 dark:border-purple-900/40',
  };

  const titleStyles: Record<BoxTone, string> = {
    blue: 'text-[var(--google-blue)] dark:text-blue-400 border-l-4 border-[var(--google-blue)]',
    red: 'text-[var(--google-red)] dark:text-red-400 border-l-4 border-[var(--google-red)]',
    green: 'text-[var(--google-green)] dark:text-green-400 border-l-4 border-[var(--google-green)]',
    yellow: 'text-yellow-600 dark:text-yellow-400 border-l-4 border-yellow-500',
    purple: 'text-purple-600 dark:text-purple-400 border-l-4 border-purple-500',
  };

  return (
    <div className={`my-10 bg-white dark:bg-[#202124] p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden group border ${boxHoverBorders[tone]}`}>
      {topElement}

      <div className="relative z-10">
        {/* Full-width clean header strip (No-Emoji Pure Typography) */}
        <div className={`-mt-5 sm:-mt-6 -mx-5 sm:-mx-6 px-5 sm:px-6 py-3.5 mb-4 flex items-center justify-between gap-3 flex-wrap ${headerGradients[tone]}`}>
          <h3 className={`text-[15.5px] font-extrabold pl-2.5 flex items-center tracking-tight ${titleStyles[tone]}`}>
            <span>{title}</span>
          </h3>
          {headerRight && <div>{headerRight}</div>}
        </div>

        {/* Content Area */}
        <div className="text-[14.5px] sm:text-[15px] font-medium text-gray-700 dark:text-[#e8eaed] leading-[1.75] tracking-tight break-keep">
          {children}
        </div>
      </div>
    </div>
  );
}
