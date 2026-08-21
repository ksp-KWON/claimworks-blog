'use client';

import React from 'react';

interface AdminPanelLayoutProps {
  children: React.ReactNode;
  innerClassName?: string;
  className?: string;
}

export default function AdminPanelLayout({
  children,
  innerClassName = "flex flex-col w-full h-full bg-white dark:bg-zinc-900",
  className = ""
}: AdminPanelLayoutProps) {
  return (
    <div className={`flex-1 min-h-0 flex flex-col max-w-7xl mx-auto w-full ${className}`}>
      <div className="flex-1 min-h-0 flex flex-col bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden transition-all">
        <div className={`w-full h-full flex flex-col min-h-0 ${innerClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
