'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function LogoDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 라우트 변경 시 드롭다운 닫기
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity whitespace-nowrap overflow-hidden text-left focus:outline-none group"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--google-blue)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
        <span className="font-sans font-bold text-lg sm:text-xl lg:text-2xl text-[#202124] dark:text-white truncate">
          보상스쿨
        </span>
        <svg className={`w-3.5 h-3.5 text-[#5f6368] dark:text-[#9aa0a6] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-[#202124] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 dark:border-white/10 z-[100] py-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Link href="/" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#202124] dark:text-[#e8eaed] hover:bg-gray-50 dark:hover:bg-[#303134] transition-colors">
            <svg className="w-4 h-4 text-[#5f6368]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            홈
          </Link>
          <Link href="/blog" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#202124] dark:text-[#e8eaed] hover:bg-gray-50 dark:hover:bg-[#303134] transition-colors">
            <svg className="w-4 h-4 text-[#5f6368]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M3 15h6"></path><path d="M3 19h6"></path><path d="M10 15h8"></path><path d="M10 19h8"></path></svg>
            블로그 (전체 글)
          </Link>
          <div className="h-px bg-gray-100 dark:bg-white/5 my-1 mx-4"></div>
          <Link href="/about" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#202124] dark:text-[#e8eaed] hover:bg-gray-50 dark:hover:bg-[#303134] transition-colors">
            <svg className="w-4 h-4 text-[#5f6368]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            플랫폼 소개
          </Link>
        </div>
      )}
    </div>
  );
}
