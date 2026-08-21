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
  innerClassName = "flex-1 min-h-0 flex flex-col w-full overflow-hidden",
  className = ""
}: AdminPanelLayoutProps) {
  return (
    <div className={`h-full flex-1 min-h-0 flex flex-col max-w-7xl mx-auto w-full space-y-2.5 overflow-hidden ${className}`}>
      <div className={`w-full h-full flex flex-col min-h-0 ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
}
