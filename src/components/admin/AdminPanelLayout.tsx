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
  innerClassName = "",
  className = ""
}: AdminPanelLayoutProps) {
  return (
    <div className={`h-full flex-1 min-h-0 flex flex-col max-w-7xl mx-auto w-full overflow-hidden ${innerClassName} ${className}`}>
      {children}
    </div>
  );
}
