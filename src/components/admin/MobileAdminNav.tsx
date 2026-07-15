'use client';

import { useState, useEffect } from 'react';
import { AdminAppType } from './MasterSidebar';
type ModalType = 'none' | 'posts' | 'settings';

interface MobileAdminNavProps {
  activeApp: AdminAppType;
  setActiveApp: (app: AdminAppType) => void;
  onLogout?: () => void;
}

export default function MobileAdminNav({ activeApp, setActiveApp, onLogout }: MobileAdminNavProps) {
  const [openModal, setOpenModal] = useState<ModalType>('none');
  const [isViewExpanded, setIsViewExpanded] = useState(false);

  // 모달 활성화 시 배경 스크롤 방지
  useEffect(() => {
    if (openModal !== 'none') {
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
  }, [openModal]);

  useEffect(() => {
    if (openModal === 'none') {
      setIsViewExpanded(false);
    }
  }, [openModal]);

  const closeModals = () => {
    setOpenModal('none');
    setIsViewExpanded(false);
  };

  const handleNavClick = (id: 'posts' | 'settings' | 'consult') => {
    if (id === 'consult') {
      setActiveApp('consult-manage');
      closeModals();
      return;
    }
    if (openModal === id) {
      closeModals();
    } else {
      setOpenModal(id);
    }
  };

  const navItems = [
    {
      id: 'consult',
      label: '상담',
      icon: (
        <svg className="w-7 h-7 sm:w-8 sm:h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={activeApp === 'consult-manage' ? "2" : "1.5"} strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      isActive: activeApp === 'consult-manage'
    },
    {
      id: 'posts',
      label: '포스팅',
      icon: (
        <svg className="w-7 h-7 sm:w-8 sm:h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={(activeApp.startsWith('post') || activeApp === 'editor') ? "2" : "1.5"} strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
      ),
      isActive: activeApp.startsWith('post') || activeApp === 'editor' || openModal === 'posts'
    },
    {
      id: 'settings',
      label: '설정',
      icon: (
        <svg className="w-7 h-7 sm:w-8 sm:h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={openModal === 'settings' ? "2" : "1.5"} strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
      ),
      isActive: openModal === 'settings'
    }
  ];

  return (
    <>
      {/* 팝업 모달 오버레이 (바텀시트 느낌) */}
      {openModal !== 'none' && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden flex items-end justify-center"
          onClick={closeModals}
        >
          <div 
            className="w-full bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 rounded-t-2xl max-h-[85vh] overflow-y-auto pb-24 shadow-2xl animate-slide-up-modal relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 드래그 핸들 (시각적) */}
            <div className="w-full flex justify-center pt-3 pb-2" onClick={closeModals}>
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-zinc-600 rounded-full"></div>
            </div>

            {openModal === 'posts' && (
              <div className="p-4 space-y-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white px-1 mb-4">포스팅 센터</h3>
                <button onClick={() => { setActiveApp('post-ai'); closeModals(); }} className="w-full flex items-center p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700/80 text-left transition-colors">
                  <span className="text-base text-gray-900 dark:text-white font-bold">AI 글쓰기</span>
                </button>
                <button onClick={() => { setActiveApp('editor'); closeModals(); }} className="w-full flex items-center p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700/80 text-left transition-colors">
                  <span className="text-base text-gray-900 dark:text-white font-bold">글쓰기 에디터</span>
                </button>
                <button onClick={() => { setActiveApp('post-list'); closeModals(); }} className="w-full flex items-center p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700/80 text-left transition-colors">
                  <span className="text-base text-gray-900 dark:text-white font-bold">기존 글 관리</span>
                </button>
                <button onClick={() => { setActiveApp('post-daily'); closeModals(); }} className="w-full flex items-center p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700/80 text-left transition-colors">
                  <span className="text-base text-gray-900 dark:text-white font-bold">데일리 자동화</span>
                </button>
              </div>
            )}

            {openModal === 'settings' && (
              <div className="p-4 space-y-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white px-1 mb-4">환경설정</h3>
                <button onClick={() => { setActiveApp('post-settings'); closeModals(); }} className="w-full flex items-center p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700/80 text-left transition-colors">
                  <span className="text-base text-gray-900 dark:text-white font-bold">API 설정</span>
                </button>
                {onLogout && (
                  <button onClick={() => { onLogout(); closeModals(); }} className="w-full flex items-center p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 text-left transition-colors">
                    <span className="text-base text-red-600 dark:text-red-400 font-bold">로그아웃</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 모바일 하단 네비게이션 바 */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-[64px] bg-white/90 dark:bg-[#121212]/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-white/10 flex items-center justify-around px-1 z-[100] pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id as any)}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
              item.isActive
                ? 'text-[var(--google-blue)] dark:text-[#8ab4f8]'
                : 'text-gray-900 dark:text-gray-200 hover:text-[var(--google-blue)] dark:hover:text-[#8ab4f8]'
            }`}
          >
            {item.icon}
            <span className={`text-[10px] font-bold ${item.isActive ? 'opacity-100' : 'opacity-80'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </>
  );
}
