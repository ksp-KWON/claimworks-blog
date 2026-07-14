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
    if (gradient === 'default' || gradient === 'blue') {
      baseClass += ' border-l-4 border-[var(--google-blue)] pl-2.5 sm:pl-3';
    } else {
      baseClass += ` border-l-4 border-${gradient}-500 pl-2.5 sm:pl-3`;
    }
  }

  let textClass = 'text-gray-900 dark:text-white';
  if (gradient === 'blue') {
    textClass = 'bg-gradient-to-r from-[#0d47a1] to-[#669df6] dark:from-[#669df6] dark:to-[#aecbfa] bg-clip-text text-transparent';
  } else if (gradient !== 'default') {
    // Generate standard tailwind gradients for other colors
    textClass = `bg-gradient-to-r from-${gradient}-700 to-${gradient}-400 dark:from-${gradient}-400 dark:to-${gradient}-200 bg-clip-text text-transparent`;
  }

  return (
    <Tag className={`${baseClass} ${className}`} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span className={textClass}>{children}</span>
    </Tag>
  );
}
