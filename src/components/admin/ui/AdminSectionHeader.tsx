'use client';

import React from 'react';

interface AdminSectionHeaderProps {
  icon?: React.ReactNode;
  title: string;
  badgeText?: string;
  badgeColor?: 'blue' | 'green' | 'amber' | 'purple' | 'red';
  description?: string;
  children?: React.ReactNode;
}

export default function AdminSectionHeader({
  icon,
  title,
  badgeText,
  badgeColor = 'blue',
  description,
  children
}: AdminSectionHeaderProps) {
  const badgeStyles: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-[var(--google-blue)] dark:text-[#8ab4f8] border-blue-200 dark:border-blue-800/50',
    green: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
    amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/50',
    red: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50',
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 mb-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-[var(--google-blue)] dark:text-[#8ab4f8] flex items-center justify-center text-xl shrink-0 shadow-inner">
            {icon}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tracking-tight">
              {title}
            </h2>
            {badgeText && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeStyles[badgeColor]}`}>
                {badgeText}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>

      {children && (
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}
