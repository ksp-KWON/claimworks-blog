'use client';

import { useState, useEffect } from 'react';

export default function MobileBottomNav() {
  const [isVisible, setIsVisible] = useState(false);

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
      className={`lg:hidden fixed bottom-0 left-0 z-[100] w-full h-[54px] bg-[#f8f9fa]/85 dark:bg-[#202124]/85 backdrop-blur-md border-t border-gray-200/50 dark:border-white/10 pb-[env(safe-area-inset-bottom,0px)] transition-transform duration-300 transform ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}
    >
      {/* 사용자가 하단바 컨텐츠를 나중에 추가하기 위해 비워둠 (레이아웃 틀만 유지) */}
      <div className="grid h-full w-full grid-cols-4 px-2">
        <div className="flex items-center justify-center h-full"></div>
        <div className="flex items-center justify-center h-full"></div>
        <div className="flex items-center justify-center h-full"></div>
        <div className="flex items-center justify-center h-full"></div>
      </div>
    </div>
  );
}
