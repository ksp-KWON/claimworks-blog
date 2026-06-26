'use client';

/**
 * SidebarTagMore.tsx
 * 인기 태그 클라우드의 "더보기 / 접기" 클라이언트 컴포넌트
 * - 서버에서 렌더링된 첫 15개 태그 이후의 숨겨진 태그 목록을 토글
 */

import { useState } from 'react';
import Link from 'next/link';

interface Props {
  tags: string[];
}

export default function SidebarTagMore({ tags }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && tags.map((tag) => (
        <Link
          key={tag}
          href={`/blog?tag=${encodeURIComponent(tag)}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--google-surface-variant)] dark:bg-[#303134] text-[#5f6368] dark:text-[#c4c7c5] border border-transparent hover:border-[var(--google-blue)] hover:bg-[#e8f0fe] dark:hover:bg-[#174ea6]/20 hover:text-[var(--google-blue)] dark:hover:text-[#8ab4f8] transition-all duration-200 text-xs font-bold shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
        >
          <span className="text-[var(--google-red)] opacity-70">#</span>
          {tag}
        </Link>
      ))}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#202124] text-[#5f6368] dark:text-[#c4c7c5] border border-gray-200 dark:border-white/5 hover:border-[var(--google-blue)] hover:bg-[#e8f0fe] dark:hover:bg-[#174ea6]/20 hover:text-[var(--google-blue)] dark:hover:text-[#8ab4f8] transition-all duration-200 text-xs font-bold shadow-sm cursor-pointer"
      >
        {isOpen ? (
          <>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
            접기
          </>
        ) : (
          <>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            더보기 (+{tags.length})
          </>
        )}
      </button>
    </>
  );
}
