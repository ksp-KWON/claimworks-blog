'use client';

import React from 'react';
import PremiumHeading from '@/components/ui/PremiumHeading';

export const adminHeaderClasses = "bg-gradient-to-r from-blue-50/80 to-transparent dark:from-blue-900/20 dark:to-transparent border-b border-blue-100/80 dark:border-blue-900/30 shrink-0";

interface AdminTableHeaderProps {
  columns: {
    label: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
    className?: string;
  }[];
}

export function AdminTableHeader({ columns }: AdminTableHeaderProps) {
  return (
    <thead className={`sticky top-0 z-10 ${adminHeaderClasses}`}>
      <tr>
        {columns.map((col, idx) => (
          <th
            key={idx}
            scope="col"
            className={`px-4 md:px-6 h-[46px] align-middle text-${col.align || 'center'} text-xs font-extrabold text-[var(--google-blue)] dark:text-[#8ab4f8] tracking-tight ${col.width || ''} ${col.className || ''}`}
          >
            {col.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

interface AdminHeaderBarProps {
  title: string | React.ReactNode;
  rightContent?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  tone?: 'blue' | 'red' | 'green' | 'yellow' | 'purple';
  emoji?: string;
  icon?: React.ReactNode;
}

export function AdminHeaderBar({ 
  title, 
  rightContent, 
  action, 
  className = '',
  tone = 'blue',
  emoji,
  icon
}: AdminHeaderBarProps) {
  const finalAction = action || rightContent;
  
  const toneGradients = {
    blue: 'from-blue-50/80 to-transparent dark:from-blue-900/20 dark:to-transparent border-blue-100/80 dark:border-blue-900/30',
    red: 'from-red-50/80 to-transparent dark:from-red-900/20 dark:to-transparent border-red-100/80 dark:border-red-900/30',
    green: 'from-green-50/80 to-transparent dark:from-green-900/20 dark:to-transparent border-green-100/80 dark:border-green-900/30',
    yellow: 'from-yellow-50/80 to-transparent dark:from-yellow-900/20 dark:to-transparent border-yellow-200/80 dark:border-yellow-900/30',
    purple: 'from-purple-50/80 to-transparent dark:from-purple-900/20 dark:to-transparent border-purple-100/80 dark:border-purple-900/30',
  };

  const titleColors = {
    blue: 'text-[var(--google-blue)] dark:text-[#8ab4f8]',
    red: 'text-[var(--google-red)] dark:text-[#f28b82]',
    green: 'text-[var(--google-green)] dark:text-[#81c995]',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    purple: 'text-purple-600 dark:text-purple-400',
  };

  return (
    <div className={`h-[48px] px-4 sm:px-5 flex justify-between items-center z-10 bg-gradient-to-r ${toneGradients[tone]} border-b shrink-0 ${className}`}>
      <div className="flex items-center gap-2 min-w-0">
        {icon && <span className="shrink-0 flex items-center">{icon}</span>}
        {!icon && emoji && <span className="text-base leading-none shrink-0">{emoji}</span>}
        {typeof title === 'string' ? (
          <span className={`font-extrabold text-xs sm:text-sm tracking-tight truncate ${titleColors[tone]}`}>
            {title}
          </span>
        ) : (
          title
        )}
      </div>
      {finalAction && <div className="flex items-center gap-2 shrink-0">{finalAction}</div>}
    </div>
  );
}
