'use client';

import React from 'react';

export const adminHeaderClasses = "bg-white dark:bg-zinc-900 border-b border-gray-200/80 dark:border-zinc-800 shrink-0";

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
            className={`px-4 md:px-6 h-[54px] align-middle text-${col.align || 'center'} text-xs md:text-sm font-bold text-gray-700 dark:text-zinc-200 tracking-tight ${col.width || ''} ${col.className || ''}`}
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
    <div className={`h-[56px] px-4 md:px-6 flex justify-between items-center z-10 ${adminHeaderClasses} ${className}`}>
      <div className="text-sm md:text-base font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
        {title}
      </div>
      {finalAction && <div className="flex items-center gap-2.5">{finalAction}</div>}
    </div>
  );
}
