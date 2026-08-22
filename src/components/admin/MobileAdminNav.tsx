'use client';

import { useState } from 'react';
import AppIcon from '@/components/ui/AppIcon';
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
      icon: <AppIcon name="chart" size={24} className="mb-1" strokeWidth={activeApp === 'analytics' ? 2.5 : 1.8} />,
      isActive: activeApp === 'analytics',
    },
    {
      id: 'consult',
      label: '상담',
      icon: <AppIcon name="phone" size={24} className="mb-1" strokeWidth={activeApp === 'consult-manage' ? 2.5 : 1.8} />,
      isActive: activeApp === 'consult-manage',
    },
    {
      id: 'chat',
      label: '채팅',
      icon: <AppIcon name="chat" size={24} className="mb-1" strokeWidth={activeApp === 'chat-manage' ? 2.5 : 1.8} />,
      isActive: activeApp === 'chat-manage',
    },
    {
      id: 'calendar',
      label: '일정',
      icon: <AppIcon name="calendar" size={24} className="mb-1" strokeWidth={activeApp === 'calendar' ? 2.5 : 1.8} />,
      isActive: activeApp === 'calendar',
    },
    {
      id: 'posts',
      label: '원고',
      icon: <AppIcon name="file-text" size={24} className="mb-1" strokeWidth={activeApp.startsWith('post') ? 2.5 : 1.8} />,
      isActive: activeApp.startsWith('post') || openModal === 'posts',
    },
  ];

  return (
    <>
      {/* 포스트 팝업 */}
      <BottomSheet isOpen={openModal === 'posts'} onClose={closeModals} showBackdrop={true}>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white px-1 mb-4">포스팅 센터</h3>
        <button onClick={() => { setActiveApp('post-list'); closeModals(); }} className="w-full flex items-center gap-2.5 p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700/80 text-left transition-colors mb-3">
          <AppIcon name="file-text" size={18} className="text-blue-600 dark:text-blue-400" />
          <span className="text-base text-gray-900 dark:text-white font-bold">원고 관리</span>
        </button>
        <button onClick={() => { setActiveApp('post-ai'); closeModals(); }} className="w-full flex items-center gap-2.5 p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700/80 text-left transition-colors">
          <AppIcon name="brain" size={18} className="text-purple-600 dark:text-purple-400" />
          <span className="text-base text-gray-900 dark:text-white font-bold">AI 작성 스튜디오</span>
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
