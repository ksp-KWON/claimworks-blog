'use client';

import React from 'react';

interface AdminCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export default function AdminCard({
  children,
  className = '',
  noPadding = false,
  ...props
}: AdminCardProps) {
  return (
    <div
      className={`bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow ${noPadding ? '' : 'p-4 sm:p-5'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
