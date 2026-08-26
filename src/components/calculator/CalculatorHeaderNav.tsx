'use client';

import React from 'react';
import Link from 'next/link';
import AppIcon from '@/components/ui/AppIcon';

export type CalculatorTab = 'auto' | 'medical' | 'liability' | 'index';

interface CalculatorHeaderNavProps {
  currentTab: CalculatorTab;
}

const TABS = [
  {
    id: 'auto' as const,
    label: '자동차보험 합의금',
    shortLabel: '자동차보험',
    href: '/calculator/auto',
    icon: 'car' as const,
    color: 'blue'
  },
  {
    id: 'medical' as const,
    label: '실손의료비 보상',
    shortLabel: '실손의료비',
    href: '/calculator/medical',
    icon: 'hospital' as const,
    color: 'green'
  },
  {
    id: 'liability' as const,
    label: '배상책임 소송가액',
    shortLabel: '배상책임',
    href: '/calculator/liability',
    icon: 'scale' as const,
    color: 'red'
  }
];

export default function CalculatorHeaderNav({ currentTab }: CalculatorHeaderNavProps) {
  return (
    <div className="space-y-3 mb-8">
      {/* 스마트 보상금 계산기 상단 공통 띠 배너 */}
      <div className="bg-[var(--google-blue)] text-white px-4 sm:px-5 py-3 flex items-center justify-between flex-nowrap gap-3 rounded-none shadow-sm">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="shrink-0 flex items-center">
            <AppIcon name="calculator" size={18} />
          </span>
          <div className="text-xs sm:text-sm font-extrabold tracking-tight truncate">
            <span className="underline decoration-wavy mr-1.5">[통합 계산]</span>
            보상스쿨 실무 알고리즘으로 예상 보상금을 미리 산출해 보세요.
          </div>
        </div>
      </div>

      {/* 3대 계산기 원클릭 스위처 탭 바 */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 bg-gray-100 dark:bg-zinc-950 p-1 sm:p-1.5 rounded-none border border-gray-200/90 dark:border-zinc-800 shadow-sm">
        {TABS.map(tab => {
          const isActive = currentTab === tab.id;
          
          let activeStyles = 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white border-gray-300 dark:border-zinc-700 shadow-sm';
          if (isActive) {
            if (tab.color === 'blue') {
              activeStyles = 'bg-blue-600 text-white border-blue-600 shadow-md font-extrabold';
            } else if (tab.color === 'green') {
              activeStyles = 'bg-emerald-600 text-white border-emerald-600 shadow-md font-extrabold';
            } else if (tab.color === 'red') {
              activeStyles = 'bg-rose-600 text-white border-rose-600 shadow-md font-extrabold';
            }
          }

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-bold transition-all rounded-none border text-center ${
                isActive 
                  ? activeStyles 
                  : 'text-gray-600 dark:text-zinc-400 border-transparent hover:bg-white/80 dark:hover:bg-zinc-900/80 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <AppIcon name={tab.icon} size={16} className="shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
