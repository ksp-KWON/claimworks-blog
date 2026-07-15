import React from 'react';

type GradientColor = 'blue' | 'red' | 'rose' | 'green' | 'teal' | 'purple' | 'indigo' | 'yellow' | 'default';

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
  
  let baseClass = 'font-bold tracking-tight flex items-center gap-2 mb-3';
  
  if (level === 1) baseClass += ' text-xl sm:text-2xl';
  else if (level === 2) baseClass += ' text-lg sm:text-xl';
  else if (level === 3) baseClass += ' text-base sm:text-lg';
  else baseClass += ' text-sm sm:text-base';

  if (showLeftBorder) {
    const borderClasses: Record<string, string> = {
      default: 'border-l-4 border-[var(--google-blue)] pl-2.5 sm:pl-3',
      blue: 'border-l-4 border-[var(--google-blue)] pl-2.5 sm:pl-3',
      red: 'border-l-4 border-red-500 pl-2.5 sm:pl-3',
      rose: 'border-l-4 border-rose-500 pl-2.5 sm:pl-3',
      green: 'border-l-4 border-green-500 pl-2.5 sm:pl-3',
      teal: 'border-l-4 border-teal-500 pl-2.5 sm:pl-3',
      purple: 'border-l-4 border-purple-500 pl-2.5 sm:pl-3',
      indigo: 'border-l-4 border-indigo-500 pl-2.5 sm:pl-3',
      yellow: 'border-l-4 border-yellow-500 pl-2.5 sm:pl-3',
    };
    baseClass += ` ${borderClasses[gradient] || borderClasses.default}`;
  }

  let textClass = 'text-gray-900 dark:text-white';
  
  const gradientClasses: Record<string, string> = {
    blue: 'bg-gradient-to-r from-[#0d47a1] to-[#669df6] dark:from-[#669df6] dark:to-[#aecbfa] bg-clip-text text-transparent',
    red: 'bg-gradient-to-r from-red-700 to-red-400 dark:from-red-400 dark:to-red-200 bg-clip-text text-transparent',
    rose: 'bg-gradient-to-r from-rose-700 to-rose-400 dark:from-rose-400 dark:to-rose-200 bg-clip-text text-transparent',
    green: 'bg-gradient-to-r from-green-700 to-green-400 dark:from-green-400 dark:to-green-200 bg-clip-text text-transparent',
    teal: 'bg-gradient-to-r from-teal-700 to-teal-400 dark:from-teal-400 dark:to-teal-200 bg-clip-text text-transparent',
    purple: 'bg-gradient-to-r from-purple-700 to-purple-400 dark:from-purple-400 dark:to-purple-200 bg-clip-text text-transparent',
    indigo: 'bg-gradient-to-r from-indigo-700 to-indigo-400 dark:from-indigo-400 dark:to-indigo-200 bg-clip-text text-transparent',
    yellow: 'bg-gradient-to-r from-yellow-700 to-yellow-400 dark:from-yellow-400 dark:to-yellow-200 bg-clip-text text-transparent',
  };

  if (gradient !== 'default' && gradientClasses[gradient]) {
    textClass = gradientClasses[gradient];
  }

  return (
    <Tag className={`${baseClass} ${className}`} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span className={textClass}>{children}</span>
    </Tag>
  );
}
