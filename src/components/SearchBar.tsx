'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsExpanded(false);
      setQuery('');
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center" ref={containerRef}>
      {/* 1. 데스크탑 기본 검색창 (sm 이상 항상 노출) */}
      <form 
        onSubmit={handleSearch} 
        className="hidden sm:flex items-center bg-[#f1f3f4]/80 dark:bg-[#3c4043]/80 rounded-full px-3 py-1.5 w-[220px] md:w-[280px] lg:w-[360px] focus-within:bg-white dark:focus-within:bg-[#303134] focus-within:shadow-md focus-within:w-[240px] md:focus-within:w-[300px] lg:focus-within:w-[400px] transition-all duration-300 border border-gray-200/50 dark:border-transparent mr-2"
      >
        <button type="submit" className="text-[#5f6368] dark:text-[#9aa0a6] hover:text-[var(--google-blue)] transition-colors pr-1.5">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </button>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="검색"
          className="w-full bg-transparent outline-none text-xs sm:text-sm text-[#202124] dark:text-[#e8eaed] placeholder-[#5f6368] dark:placeholder-[#9aa0a6]"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} className="text-[#5f6368] hover:text-[#202124] dark:hover:text-white pl-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        )}
      </form>

      {/* 2. 모바일 반응형 아이콘 (sm 미만) */}
      <div className="sm:hidden relative flex items-center">
        {isExpanded ? (
          <form 
            onSubmit={handleSearch} 
            className="absolute right-0 flex items-center bg-white dark:bg-[#303134] rounded-full px-3 py-1.5 w-[200px] shadow-md border border-[var(--google-blue)] transition-all duration-300 origin-right animate-in zoom-in-95"
          >
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="검색"
              className="w-full bg-transparent outline-none text-sm text-[#202124] dark:text-[#e8eaed] placeholder-[#5f6368] dark:placeholder-[#9aa0a6]"
              autoFocus
            />
            <button type="submit" className="text-[var(--google-blue)] pl-1.5">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </button>
          </form>
        ) : (
          <button 
            type="button" 
            onClick={() => {
              setIsExpanded(true);
              setTimeout(() => inputRef.current?.focus(), 50);
            }} 
            className="p-1.5 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[var(--google-blue)] transition-colors rounded-full hover:bg-[var(--google-surface-variant)]"
            aria-label="검색 열기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </button>
        )}
      </div>
    </div>
  );
}
