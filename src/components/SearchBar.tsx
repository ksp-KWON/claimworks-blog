'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
    }
  };

  return (
    <div className="flex items-center">
      {/* 반응형 검색창 (모바일에서는 작게, 데스크탑에서는 크게) */}
      <form 
        onSubmit={handleSearch} 
        className="flex items-center bg-[#f1f3f4]/80 dark:bg-[#3c4043]/80 rounded-full px-3 py-1.5 w-[130px] sm:w-[220px] md:w-[280px] lg:w-[360px] focus-within:bg-white dark:focus-within:bg-[#303134] focus-within:shadow-md focus-within:w-[160px] sm:focus-within:w-[240px] md:focus-within:w-[300px] lg:focus-within:w-[400px] transition-all duration-300 border border-gray-200/50 dark:border-transparent mr-1 sm:mr-2"
      >
        <button type="submit" className="text-[#5f6368] dark:text-[#9aa0a6] hover:text-[var(--google-blue)] transition-colors pr-1.5" aria-label="검색 버튼">
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
          <button type="button" onClick={() => setQuery('')} className="text-[#5f6368] hover:text-[#202124] dark:hover:text-white pl-1" aria-label="지우기">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        )}
      </form>
    </div>
  );
}
