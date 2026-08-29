import React from 'react';

type GradientColor = 'blue' | 'cyan' | 'red' | 'rose' | 'green' | 'teal' | 'orange' | 'purple' | 'indigo' | 'yellow' | 'gray' | 'charcoal' | 'ink' | 'default';

interface PremiumHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  gradient?: GradientColor;
  icon?: React.ReactNode;
  showLeftBorder?: boolean;
}

export default function PremiumHeading({
  children,
  className = '',
  level = 2,
  gradient = 'default',
  icon,
  showLeftBorder = false,
  ...props
}: PremiumHeadingProps) {
  const Tag = `h${level}` as React.ElementType;
  
  let baseClass = 'tracking-tight flex items-center flex-nowrap gap-2 mb-3';
  
  if (level === 1) baseClass += ' text-xl sm:text-2xl font-extrabold';
  else if (level === 2) baseClass += ' text-lg sm:text-xl font-extrabold';
  else if (level === 3) baseClass += ' text-base sm:text-lg font-bold';
  else if (level === 4) baseClass += ' text-sm sm:text-base font-bold';
  else if (level === 5) baseClass += ' text-xs sm:text-sm font-semibold';
  else if (level === 6) baseClass += ' text-[14px] sm:text-[15px] font-semibold';
  else baseClass += ' text-sm sm:text-base font-bold';

  if (showLeftBorder) {
    if (gradient === 'charcoal' || gradient === 'ink') {
      const inkBorderClasses: Record<number, string> = {
        1: 'border-l-4 border-zinc-900 dark:border-zinc-100 pl-2.5 sm:pl-3',
        2: 'border-l-4 border-zinc-900 dark:border-zinc-100 pl-2.5 sm:pl-3',
        3: 'border-l-[2.5px] border-zinc-600 dark:border-zinc-400 pl-2 sm:pl-2.5',
        4: 'border-l-2 border-zinc-400 dark:border-zinc-500 pl-2',
        5: 'border-l border-zinc-300 dark:border-zinc-600 pl-1.5',
        6: 'border-l border-zinc-300 dark:border-zinc-600 pl-1.5',
      };
      baseClass += ` ${inkBorderClasses[level] || inkBorderClasses[2]}`;
    } else {
      const borderClasses: Record<string, string> = {
        default: 'border-l-4 border-[var(--google-blue)] pl-2.5 sm:pl-3',
        blue: 'border-l-4 border-[var(--google-blue)] pl-2.5 sm:pl-3',
        cyan: 'border-l-4 border-sky-500 pl-2.5 sm:pl-3',
        red: 'border-l-4 border-red-500 pl-2.5 sm:pl-3',
        rose: 'border-l-4 border-rose-500 pl-2.5 sm:pl-3',
        green: 'border-l-4 border-green-500 pl-2.5 sm:pl-3',
        teal: 'border-l-4 border-teal-500 pl-2.5 sm:pl-3',
        orange: 'border-l-4 border-orange-500 pl-2.5 sm:pl-3',
        purple: 'border-l-4 border-purple-500 pl-2.5 sm:pl-3',
        indigo: 'border-l-4 border-indigo-500 pl-2.5 sm:pl-3',
        yellow: 'border-l-4 border-[var(--google-yellow)] pl-2.5 sm:pl-3',
        gray: 'border-l-4 border-gray-400 pl-2.5 sm:pl-3',
      };
      baseClass += ` ${borderClasses[gradient] || borderClasses.default}`;
    }
  }

  let textClass = 'text-gray-900 dark:text-white';
  
  const gradientClasses: Record<string, string> = {
    blue: 'bg-gradient-to-r from-[#0d47a1] to-[#669df6] dark:from-[#669df6] dark:to-[#aecbfa] bg-clip-text text-transparent',
    cyan: 'bg-gradient-to-r from-sky-700 to-sky-400 dark:from-sky-400 dark:to-sky-200 bg-clip-text text-transparent',
    red: 'bg-gradient-to-r from-red-700 to-red-400 dark:from-red-400 dark:to-red-200 bg-clip-text text-transparent',
    rose: 'bg-gradient-to-r from-rose-700 to-rose-400 dark:from-rose-400 dark:to-rose-200 bg-clip-text text-transparent',
    green: 'bg-gradient-to-r from-green-700 to-green-400 dark:from-green-400 dark:to-green-200 bg-clip-text text-transparent',
    teal: 'bg-gradient-to-r from-teal-700 to-teal-400 dark:from-teal-400 dark:to-teal-200 bg-clip-text text-transparent',
    orange: 'bg-gradient-to-r from-orange-700 to-orange-400 dark:from-orange-400 dark:to-orange-200 bg-clip-text text-transparent',
    purple: 'bg-gradient-to-r from-purple-700 to-purple-400 dark:from-purple-400 dark:to-purple-200 bg-clip-text text-transparent',
    indigo: 'bg-gradient-to-r from-indigo-700 to-indigo-400 dark:from-indigo-400 dark:to-indigo-200 bg-clip-text text-transparent',
    yellow: 'bg-gradient-to-r from-yellow-700 to-yellow-400 dark:from-yellow-400 dark:to-yellow-200 bg-clip-text text-transparent',
    gray: 'bg-gradient-to-r from-gray-700 to-gray-400 dark:from-gray-400 dark:to-gray-200 bg-clip-text text-transparent',
    charcoal: 'bg-gradient-to-r from-zinc-950 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent',
    ink: 'bg-gradient-to-r from-zinc-950 via-zinc-800 to-zinc-600 dark:from-white dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent',
  };

  if (gradient !== 'default' && gradientClasses[gradient]) {
    textClass = gradientClasses[gradient];
  }

  return (
    <Tag className={`${baseClass} ${className}`} {...props}>
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      <span className={`min-w-0 ${textClass}`}>{children}</span>
    </Tag>
  );
}
