'use client';

/**
 * SidebarTagMore.tsx
 * 인기 태그 클라우드의 "더보기 / 접기" 클라이언트 컴포넌트
 * - 서버에서 렌더링된 첫 15개 태그 이후의 숨겨진 태그 목록을 토글
 */

import { useState } from 'react';
import Link from 'next/link';
import AppIcon from '@/components/ui/AppIcon';

interface Props {
  tags: string[];
}

export default function SidebarTagMore({ tags }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-2">
      {isOpen && (
        <div className="flex flex-wrap gap-2 text-xs font-bold mb-3 mt-3 animate-in slide-in-from-top-2 fade-in duration-200">
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`/blog?tag=${encodeURIComponent(tag)}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--google-surface-variant)] dark:bg-[#303134] text-[#5f6368] dark:text-[#c4c7c5] border border-transparent hover:border-[var(--google-blue)] hover:bg-[#e8f0fe] dark:hover:bg-[#174ea6]/20 hover:text-[var(--google-blue)] dark:hover:text-[#8ab4f8] transition-all duration-200 text-xs font-bold shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
            >
              <span className="text-[var(--google-red)] opacity-70">#</span>
              {tag}
            </Link>
          ))}
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-sm font-bold text-[#202124] dark:text-[#e8eaed] flex items-center justify-between transition-colors p-2.5 rounded-none bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 cursor-pointer ${!isOpen ? 'mt-3' : ''}`}
      >
        <div className="flex items-center gap-2">
          <AppIcon name="list" size={16} className="text-[var(--google-red)]" />
          {isOpen ? '인기 태그 접기' : `인기 태그 더보기 (+${tags.length})`}
        </div>
        <AppIcon name="chevron-down" size={16} className={`text-[#5f6368] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} strokeWidth={2.5} />
      </button>
    </div>
  );
}
