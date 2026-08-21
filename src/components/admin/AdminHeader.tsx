'use client';

import React from 'react';
import PremiumHeading from '@/components/ui/PremiumHeading';

export const adminHeaderClasses = "bg-gradient-to-r from-blue-50/50 via-white to-transparent dark:from-blue-950/30 dark:via-[#202124] dark:to-[#202124] border-b border-gray-200/80 dark:border-zinc-800 shrink-0";

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
    <thead className={`sticky top-0 z-10 ${adminHeaderClasses} shadow-sm`}>
      <tr>
        {columns.map((col, idx) => (
          <th
            key={idx}
            scope="col"
            className={`px-4 md:px-6 h-[48px] align-middle text-${col.align || 'center'} text-xs md:text-sm font-extrabold text-gray-800 dark:text-zinc-100 tracking-tight ${col.width || ''} ${col.className || ''}`}
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
}

export function AdminHeaderBar({ title, rightContent, action, className = '' }: AdminHeaderBarProps) {
  const finalAction = action || rightContent;
  return (
    <div className={`h-[52px] px-4 md:px-5 flex justify-between items-center z-10 ${adminHeaderClasses} ${className}`}>
      <div className="flex items-center gap-2">
        {typeof title === 'string' ? (
          <PremiumHeading level={3} showLeftBorder={true} gradient="blue" className="!mb-0 !text-xs sm:!text-sm font-extrabold">
            {title}
          </PremiumHeading>
        ) : (
          title
        )}
      </div>
      {finalAction && <div className="flex items-center gap-2">{finalAction}</div>}
    </div>
  );
}
