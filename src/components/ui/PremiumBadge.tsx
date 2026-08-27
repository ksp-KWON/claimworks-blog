import React from 'react';

export type BadgeColor = 'red' | 'rose' | 'blue' | 'green' | 'teal' | 'purple' | 'indigo' | 'yellow' | 'gray';

export interface PremiumBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
}

export default function PremiumBadge({
  children,
  className = '',
  color = 'gray',
  ...props
}: PremiumBadgeProps) {
  let colorClass = '';

  switch (color) {
    case 'red':
      colorClass = 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400';
      break;
    case 'rose':
      colorClass = 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400';
      break;
    case 'blue':
      colorClass = 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
      break;
    case 'green':
      colorClass = 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400';
      break;
    case 'teal':
      colorClass = 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400';
      break;
    case 'purple':
      colorClass = 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
      break;
    case 'indigo':
      colorClass = 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400';
      break;
    case 'yellow':
      colorClass = 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      break;
    default:
      colorClass = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }

  return (
    <span 
      className={`inline-flex items-center px-2 py-0.5 text-[11px] sm:text-xs font-bold rounded-none shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-black/5 dark:border-white/10 ${colorClass} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
