import React from 'react';

type BorderColor = 'red' | 'rose' | 'blue' | 'green' | 'teal' | 'purple' | 'indigo' | 'yellow' | 'default';

interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  borderColor?: BorderColor;
  hoverEffect?: boolean;
  watermarkEmoji?: string;
}

export default function PremiumCard({
  children,
  className = '',
  borderColor = 'default',
  hoverEffect = true,
  watermarkEmoji,
  ...props
}: PremiumCardProps) {
  // CommonBox와 일치하는 세련된 톤별 호버 글로우 & 보더
  const hoverBorders: Record<BorderColor, string> = {
    blue: 'hover:border-[var(--google-blue)] hover:shadow-[0_12px_40px_rgba(26,115,232,0.18)] dark:hover:shadow-[0_12px_40px_rgba(26,115,232,0.25)]',
    red: 'hover:border-[var(--google-red)] hover:shadow-[0_12px_40px_rgba(234,67,53,0.18)] dark:hover:shadow-[0_12px_40px_rgba(234,67,53,0.25)]',
    green: 'hover:border-[var(--google-green)] hover:shadow-[0_12px_40px_rgba(52,168,83,0.18)] dark:hover:shadow-[0_12px_40px_rgba(52,168,83,0.25)]',
    teal: 'hover:border-teal-500 hover:shadow-[0_12px_40px_rgba(20,184,166,0.18)] dark:hover:shadow-[0_12px_40px_rgba(20,184,166,0.25)]',
    yellow: 'hover:border-yellow-500 hover:shadow-[0_12px_40px_rgba(234,179,8,0.18)] dark:hover:shadow-[0_12px_40px_rgba(234,179,8,0.25)]',
    purple: 'hover:border-purple-500 hover:shadow-[0_12px_40px_rgba(168,85,247,0.18)] dark:hover:shadow-[0_12px_40px_rgba(168,85,247,0.25)]',
    rose: 'hover:border-rose-500 hover:shadow-[0_12px_40px_rgba(244,63,94,0.18)] dark:hover:shadow-[0_12px_40px_rgba(244,63,94,0.25)]',
    indigo: 'hover:border-indigo-500 hover:shadow-[0_12px_40px_rgba(99,102,241,0.18)] dark:hover:shadow-[0_12px_40px_rgba(99,102,241,0.25)]',
    default: 'hover:border-[var(--google-blue)] hover:shadow-[0_12px_40px_rgba(26,115,232,0.18)] dark:hover:shadow-[0_12px_40px_rgba(26,115,232,0.25)]'
  };

  const baseClass = `bg-white dark:bg-[#202124] p-4 sm:p-5 border border-gray-200/80 dark:border-zinc-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] transition-all duration-200 relative overflow-hidden rounded-none flex flex-col min-h-0 group ${
    hoverEffect ? hoverBorders[borderColor] : ''
  }`;

  return (
    <div className={`${baseClass} ${className}`} {...props}>
      {/* 워터마크 이모지 (CommonBox 일체화) */}
      {watermarkEmoji && (
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
