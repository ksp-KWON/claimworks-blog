'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileBottomNav() {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      // 스크롤이 최상단(50px 이내)이면 숨기고, 그 이상 내려가면 나타남
      if (window.scrollY > 50) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // 초기 렌더링 시 스크롤 위치 체크
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      className={`lg:hidden fixed bottom-0 left-0 z-[100] w-full h-[48px] bg-[#f8f9fa]/80 dark:bg-[#202124]/80 backdrop-blur-md border-t border-gray-200/50 dark:border-white/10 pb-[env(safe-area-inset-bottom,0px)] transition-transform duration-300 transform ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
    >
      <div className="grid h-full w-full grid-cols-4 px-2">
        {/* 홈 버튼 하나만 살려두고 나머지는 추후 컨텐츠를 위해 비워둠 */}
        <Link 
          href="/"
          className="group flex flex-col items-center justify-center h-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors active:scale-95 duration-150 rounded-xl m-0.5"
        >
          <div className={`transition-colors duration-200 ${pathname === '/' ? 'text-[var(--google-blue)] dark:text-[#8ab4f8] -translate-y-0.5' : 'text-gray-500 dark:text-gray-400'}`}>
            <svg className="w-5 h-5 sm:w-6 sm:h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={pathname === '/' ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <span className={`text-[10px] font-bold transition-all duration-200 ${pathname === '/' ? 'text-[var(--google-blue)] dark:text-[#8ab4f8] opacity-100' : 'text-gray-500 dark:text-gray-400 opacity-80'}`}>
            홈
          </span>
        </Link>
        <div className="flex items-center justify-center h-full"></div>
        <div className="flex items-center justify-center h-full"></div>
        <div className="flex items-center justify-center h-full"></div>
      </div>
    </div>
  );
}
