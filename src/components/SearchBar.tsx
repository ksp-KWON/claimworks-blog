'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import AppIcon from '@/components/ui/AppIcon';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setQuery('');
    }
  };

  return (
    <div className="flex items-center">
      <button 
        onClick={() => setIsOpen(true)} 
        className="p-2 sm:p-2.5 rounded-none border border-transparent hover:border-[#1a73e8]/30 dark:hover:border-[#8ab4f8]/30 text-[#3c4043] dark:text-[#e8eaed] hover:bg-gradient-to-br hover:from-red-50/50 hover:to-blue-50/50 dark:hover:from-red-900/20 dark:hover:to-blue-900/20 hover:text-[#1a73e8] dark:hover:text-[#8ab4f8] hover:shadow-sm transition-all duration-200 flex items-center justify-center group"
        aria-label="검색 열기"
        title="검색"
      >
        <AppIcon name="search" size={20} className="group-hover:-translate-y-0.5 transition-transform" />
      </button>

      {/* Full Screen Search Modal */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[200] bg-white/95 dark:bg-[#202124]/95 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-3xl mx-auto w-full h-full flex flex-col mt-0 sm:mt-[10vh]">
            <div className="flex items-center p-3 sm:p-6 border-b border-gray-100 dark:border-white/10 sm:border-none shadow-sm sm:shadow-none bg-white dark:bg-[#202124] sm:bg-transparent">
              <button 
                onClick={() => setIsOpen(false)} 
                className="p-2 text-[#5f6368] dark:text-[#9aa0a6] hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors mr-2"
              >
                <AppIcon name="chevron-left" size={24} />
              </button>
              <form onSubmit={handleSearch} className="flex-1 relative flex items-center">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="무엇을 찾으시나요?"
                  className="w-full bg-[#f1f3f4] dark:bg-[#303134] rounded-full px-5 py-3 sm:py-4 outline-none text-base sm:text-lg text-[#202124] dark:text-[#e8eaed] placeholder-[#5f6368] dark:placeholder-[#9aa0a6] shadow-inner"
                  autoFocus
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')} className="absolute right-4 text-[#5f6368] hover:text-[#202124] dark:hover:text-white transition-colors">
                    <AppIcon name="close" size={20} />
                  </button>
                )}
                {/* 모바일 키보드에서 '검색' 버튼 처리를 위한 숨김 서브밋 버튼 추가 */}
                <button type="submit" className="hidden">검색</button>
              </form>
              <button 
                onClick={handleSearch} 
                className="ml-3 px-4 py-2 bg-[var(--google-blue)] text-white font-bold rounded-full hover:bg-[#174ea6] transition-colors whitespace-nowrap shadow-md hidden sm:block"
              >
                검색
              </button>
            </div>
            
            <div className="p-6 sm:px-12 flex-1">
              <p className="text-sm font-bold text-[#5f6368] dark:text-[#9aa0a6] mb-4 flex items-center gap-2">
                <AppIcon name="trending-up" size={16} />
                인기 검색 키워드
              </p>
              <div className="flex flex-wrap gap-2.5 sm:gap-3">
                {['후유장해', '교통사고합의금', '십자인대파열', '디스크', '실손의료비', '배상책임', '위자료'].map(keyword => (
                  <button 
                    key={keyword}
                    onClick={() => {
                      setQuery(keyword);
                      router.push(`/search?q=${encodeURIComponent(keyword)}`);
                      setIsOpen(false);
                    }}
                    className="px-4 py-2 sm:px-5 sm:py-2.5 bg-white dark:bg-[#303134] text-[#202124] dark:text-[#e8eaed] border border-gray-200 dark:border-transparent rounded-full text-sm sm:text-base font-medium hover:border-[var(--google-blue)] hover:text-[var(--google-blue)] hover:shadow-md transition-all duration-200"
                  >
                    #{keyword}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
