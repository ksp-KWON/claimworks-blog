'use client';

import { useState } from 'react';
export type AdminAppType = 'analytics' | 'post-ai' | 'post-list' | 'post-settings' | 'editor' | 'consult-manage' | 'chat-manage' | 'calendar';
import BottomSheet from '@/components/ui/BottomSheet';

type ModalType = 'none' | 'posts' | 'settings';

interface MobileAdminNavProps {
  activeApp: AdminAppType;
  setActiveApp: (app: AdminAppType) => void;
  onLogout?: () => void;
}

export default function MobileAdminNav({ activeApp, setActiveApp, onLogout }: MobileAdminNavProps) {
  const [openModal, setOpenModal] = useState<ModalType>('none');

  const closeModals = () => {
    setOpenModal('none');
  };

  const handleNavClick = (id: 'analytics' | 'posts' | 'consult' | 'chat' | 'calendar' | 'settings') => {
    if (id === 'analytics') {
      setActiveApp('analytics');
      closeModals();
      return;
    }
    if (id === 'consult') {
      setActiveApp('consult-manage');
      closeModals();
      window.dispatchEvent(new CustomEvent('close-consultation-detail'));
      return;
    }
    if (id === 'chat') {
      setActiveApp('chat-manage');
      closeModals();
      return;
    }
    if (id === 'calendar') {
      setActiveApp('calendar');
      closeModals();
      return;
    }
    if (id === 'settings') {
      setActiveApp('analytics'); // 통합 대시보드의 설정으로 연결
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
      id: 'analytics',
      label: '통계',
      icon: (
        <svg className="w-6 h-6 sm:w-7 sm:h-7 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={activeApp === 'analytics' ? '2.5' : '1.8'} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
      ),
      isActive: activeApp === 'analytics',
    },
    {
      id: 'consult',
      label: '상담',
      icon: (
        <svg className="w-6 h-6 sm:w-7 sm:h-7 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={activeApp === 'consult-manage' ? '2' : '1.5'} strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      isActive: activeApp === 'consult-manage',
    },
    {
      id: 'chat',
      label: '채팅',
      icon: (
        <svg className="w-6 h-6 sm:w-7 sm:h-7 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={activeApp === 'chat-manage' ? '2' : '1.5'} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
      ),
      isActive: activeApp === 'chat-manage',
    },
    {
      id: 'calendar',
      label: '일정',
      icon: (
        <svg className="w-6 h-6 sm:w-7 sm:h-7 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={activeApp === 'calendar' ? '2' : '1.5'} strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      isActive: activeApp === 'calendar',
    },
    {
      id: 'posts',
      label: '원고',
      icon: (
        <svg className="w-6 h-6 sm:w-7 sm:h-7 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={activeApp.startsWith('post') ? '2' : '1.5'} strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
        </svg>
      ),
      isActive: activeApp.startsWith('post') || openModal === 'posts',
    },
  ];

  return (
    <>
      {/* 포스트 팝업 */}
      <BottomSheet isOpen={openModal === 'posts'} onClose={closeModals} showBackdrop={true}>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white px-1 mb-4">포스팅 센터</h3>
        <button onClick={() => { setActiveApp('post-list'); closeModals(); }} className="w-full flex flex-col gap-1 p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700/80 text-left transition-colors mb-3">
          <span className="text-base text-gray-900 dark:text-white font-bold">📄 원고 관리</span>
        </button>
        <button onClick={() => { setActiveApp('post-ai'); closeModals(); }} className="w-full flex flex-col gap-1 p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700/80 text-left transition-colors">
          <span className="text-base text-gray-900 dark:text-white font-bold">🤖 AI 작성 스튜디오</span>
        </button>
      </BottomSheet>

      {/* 모바일 하단 네비게이션 바 */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-[64px] bg-white/95 dark:bg-[#121212]/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-white/10 flex items-center justify-around px-1 z-[100] pb-[env(safe-area-inset-bottom)] shadow-lg">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id as any)}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
              item.isActive
                ? 'text-[var(--google-blue)] dark:text-[#8ab4f8]'
                : 'text-gray-600 dark:text-gray-400 hover:text-[var(--google-blue)] dark:hover:text-[#8ab4f8]'
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
