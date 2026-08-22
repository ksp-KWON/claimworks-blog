'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppIcon from '@/components/ui/AppIcon';

const ACCORDION_ITEMS = [
  {
    id: 'auto',
    href: '/calculator/auto',
    title: '자동차보험 합의금 계산기',
    description: '대인배상, 후유장해, 향후치료비 산출',
    bgHover: 'bg-blue-50 dark:bg-blue-900/20',
    textGroupHover: 'group-hover/item:text-[#1a73e8]',
    textStatic: 'text-[#1a73e8] dark:text-[#8ab4f8]',
    badge: '자동차'
  },
  {
    id: 'medical',
    href: '/calculator/medical',
    title: '실손의료비 보상 계산기',
    description: '급여/비급여 본인부담금 공제 후 실손액',
    bgHover: 'bg-green-50 dark:bg-green-900/20',
    textGroupHover: 'group-hover/item:text-[#34A853]',
    textStatic: 'text-[#34A853] dark:text-[#81c995]',
    badge: '실손'
  },
  {
    id: 'liability',
    href: '/calculator/liability',
    title: '배상책임 소송가액 계산기',
    description: '산재 초과손해, 배상책임 위자료 산정',
    bgHover: 'bg-red-50 dark:bg-red-900/20',
    textGroupHover: 'group-hover/item:text-[#ea4335]',
    textStatic: 'text-[#ea4335] dark:text-[#f28b82]',
    badge: '배상'
  }
];

export default function GlobalCalculatorAccordion() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="my-12 relative w-full mx-auto max-w-4xl">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 sm:p-5 rounded-none border transition-all duration-300 text-left shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_25px_rgba(26,115,232,0.12)] bg-gradient-to-br from-blue-50/80 to-indigo-50/80 hover:from-blue-100 hover:to-indigo-100 border-blue-200 dark:from-blue-900/10 dark:to-indigo-900/10 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 dark:border-blue-800/30 text-[#1a73e8] dark:text-[#8ab4f8]"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-none bg-blue-100 dark:bg-blue-900/40 text-[var(--google-blue)] dark:text-[#8ab4f8] flex items-center justify-center shrink-0">
            <AppIcon name="calculator" size={20} />
          </div>
          <div>
            <div className="text-base sm:text-lg font-extrabold tracking-tight">
              보상스쿨 통합 예상 보상금 계산기
            </div>
            <div className="text-xs sm:text-[13px] text-gray-600 dark:text-gray-400 font-medium mt-0.5 leading-tight">
              내 상황에 맞는 정확한 보상금을 시뮬레이션해 보세요 (자동차 / 실손 / 배상책임)
            </div>
          </div>
        </div>
        <div className="shrink-0 pl-2">
          <span className="px-3 py-1.5 bg-white dark:bg-zinc-800 text-[12px] font-bold rounded-none border border-inherit shadow-2xs hover:scale-102 transition-transform">
            {isOpen ? '닫기' : '계산기 열기'}
          </span>
        </div>
      </button>
      
      {isOpen && (
        <div className="bg-white dark:bg-[#202124] rounded-none shadow-[0_6px_25px_rgba(0,0,0,0.08)] dark:shadow-[0_6px_25px_rgba(0,0,0,0.4)] border border-t-0 border-blue-200 dark:border-blue-800/30 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200 relative group">
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {ACCORDION_ITEMS.map((item) => (
              <Link 
                key={item.id}
                href={item.href} 
                className="flex items-center p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-[#303134] transition-colors group/item"
              >
                <div className={`px-2.5 py-1 text-xs font-black rounded-none ${item.bgHover} ${item.textStatic} transition-transform`}>
                  {item.badge}
                </div>
                <div className="ml-4 flex-1">
                  <div className={`text-[15px] font-extrabold text-gray-900 dark:text-white ${item.textGroupHover}`}>
                    {item.title}
                  </div>
                  <div className="text-[12.5px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                    {item.description}
                  </div>
                </div>
                <div className={`text-gray-400 ${item.textGroupHover} group-hover/item:translate-x-1 transition-all`}>
                  <AppIcon name="chevron-right" size={16} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
