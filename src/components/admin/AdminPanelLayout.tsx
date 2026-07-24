import React from 'react';
import PremiumCard from '@/components/ui/PremiumCard';

interface AdminPanelLayoutProps {
  children: React.ReactNode;
  innerClassName?: string;
}

export default function AdminPanelLayout({ children, innerClassName = "flex flex-col w-full h-full bg-white dark:bg-[#111111]" }: AdminPanelLayoutProps) {
  return (
    <div className="flex-1 min-h-0 flex flex-col p-4 md:p-8 bg-gray-50 dark:bg-zinc-950">
      <PremiumCard className="flex-1 min-h-0 p-0 overflow-hidden relative block border-0 md:border md:border-gray-200 dark:md:border-zinc-800 shadow-sm">
        <div className={`absolute inset-0 ${innerClassName}`}>
          {children}
        </div>
      </PremiumCard>
    </div>
  );
}
