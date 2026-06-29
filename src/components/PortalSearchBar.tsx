'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PortalSearchBar({ placeholder = "검색어를 입력하세요" }: { placeholder?: string }) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full flex items-center bg-white dark:bg-[#303134] border-2 border-[var(--portal-blue)] rounded-full overflow-hidden shadow-sm hover:shadow-md transition-shadow focus-within:shadow-md">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent px-6 py-3 sm:py-4 outline-none text-base sm:text-lg text-[#202124] dark:text-[#e8eaed] placeholder-gray-400"
      />
      {query && (
        <button type="button" onClick={() => setQuery('')} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      )}
      <button 
        type="submit" 
        className="px-6 sm:px-8 py-3 sm:py-4 bg-[var(--portal-blue)] text-white font-bold hover:bg-blue-700 transition-colors flex items-center justify-center"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
      </button>
    </form>
  );
}
