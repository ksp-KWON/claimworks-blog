'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import SidebarContent from './SidebarContent';
import { usePathname } from 'next/navigation';

export default function MobileSidebarDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // 페이지 이동 시 서랍 닫기
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // 서랍이 열려있을 때 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none'; // iOS Safari 대응
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* 햄버거 메뉴 버튼 */}
      <button 
        onClick={() => setIsOpen(true)}
        className="p-1.5 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[var(--google-blue)] transition-colors rounded-full hover:bg-[var(--google-surface-variant)]"
        aria-label="메뉴 열기"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {/* 포탈을 사용하여 루트 body에 렌더링 (모바일 서랍) */}
      {mounted && createPortal(
        <>
          {/* 배경 오버레이 */}
          {isOpen && (
            <div 
              className="lg:hidden fixed inset-0 bg-black/50 z-[100] animate-in fade-in duration-200"
              onClick={() => setIsOpen(false)}
              onTouchMove={(e) => e.preventDefault()}
            ></div>
          )}

          {/* 우측 서랍(Drawer) 컨텐츠 */}
          <div 
            className={`lg:hidden fixed top-0 right-0 h-[100dvh] w-[80%] max-w-[320px] bg-white dark:bg-[#202124] shadow-2xl z-[105] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/10 shrink-0">
              <span className="font-bold text-lg text-[#202124] dark:text-white">메뉴</span>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-[#5f6368] dark:text-[#9aa0a6] hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            {/* SidebarContent를 감싸서 서랍 내부에 렌더링 */}
            <div className="overflow-y-auto flex-1 p-4 overscroll-contain">
              <SidebarContent />
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
