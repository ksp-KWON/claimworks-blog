'use client';

import React from 'react';
import PremiumCard from '@/components/ui/PremiumCard';

interface AdminPanelLayoutProps {
  children: React.ReactNode;
  innerClassName?: string;
  className?: string;
}

export default function AdminPanelLayout({
  children,
  innerClassName = "flex flex-col w-full h-full bg-white dark:bg-[#202124]",
  className = ""
}: AdminPanelLayoutProps) {
  return (
    <div className={`flex-1 min-h-0 flex flex-col max-w-7xl mx-auto w-full ${className}`}>
      <PremiumCard hoverEffect={false} className="flex-1 min-h-0 p-0 overflow-hidden relative block shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] border border-gray-200/80 dark:border-white/10 rounded-none bg-white dark:bg-[#202124]">
        <div className={`w-full h-full flex flex-col min-h-0 ${innerClassName}`}>
          {children}
        </div>
      </PremiumCard>
    </div>
  );
}
