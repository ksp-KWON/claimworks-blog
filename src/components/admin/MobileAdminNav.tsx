'use client';

import { useState, useEffect } from 'react';
import { AdminAppType } from './MasterSidebar';
import { useCalendarLabels } from './useCalendarLabels';
import { useUnreadChatCount } from './useUnreadChatCount';

type ModalType = 'none' | 'calendar' | 'posts' | 'settings';

interface MobileAdminNavProps {
  activeApp: AdminAppType;
  setActiveApp: (app: AdminAppType) => void;
  onLogout?: () => void;
}

export default function MobileAdminNav({ activeApp, setActiveApp, onLogout }: MobileAdminNavProps) {
  const [openModal, setOpenModal] = useState<ModalType>('none');
  const [isViewExpanded, setIsViewExpanded] = useState(false);
  const unreadChatCount = useUnreadChatCount();
  const { labels, toggleLabelActive } = useCalendarLabels();

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

  const closeModals = () => {
    setOpenModal('none');
    setIsViewExpanded(false);
  };

  const handleNavClick = (id: 'calendar' | 'chat' | 'consult' | 'posts' | 'settings') => {
    if (id === 'chat') {
      setActiveApp('chat-list');
      closeModals();
    } else if (id === 'consult') {
      setActiveApp('consult-manage');
      closeModals();
    } else {
      if (openModal === id) {
        closeModals();
      } else {
        setOpenModal(id);
      }
    }
  };

  const navItems = [
    {
      id: 'calendar',
      label: '상담일정',
      icon: (
        <svg className="w-6 h-6 sm:w-7 sm:h-7 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={activeApp === 'calendar' ? "2" : "1.5"} strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
      ),
      isActive: activeApp === 'calendar'
    },
    {
      id: 'chat',
      label: '채팅상담',
      icon: (
        <div className="relative mb-1">
          <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={activeApp.startsWith('chat') ? "2" : "1.5"} strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
          </svg>
          {unreadChatCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {unreadChatCount > 99 ? '99+' : unreadChatCount}
            </span>
          )}
        </div>
      ),
      isActive: activeApp.startsWith('chat')
    },
    {
      id: 'consult',
      label: '예약상담',
      icon: (
        <svg className="w-7 h-7 sm:w-8 sm:h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={activeApp === 'calendar' ? "2" : "1.5"} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
        </svg>
      ),
      isActive: activeApp.startsWith('consult')
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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden flex items-end justify-center"
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

            {openModal === 'calendar' && (
              <div className="p-4 space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white px-1">상담 일정</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => { 
                    setActiveApp('calendar'); 
                    closeModals();
                    setTimeout(() => window.dispatchEvent(new Event('open-new-event')), 100);
                  }} className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    <span className="text-sm text-blue-700 dark:text-blue-300 font-bold">새 일정 추가</span>
                  </button>
                  
                  <div className="relative">
                    <button onClick={() => setIsViewExpanded(!isViewExpanded)} className="w-full h-full flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-700/80 transition-colors">
                      <svg className="w-6 h-6 text-gray-600 dark:text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-700 dark:text-gray-300 font-bold">뷰 변경</span>
                        <svg className={`w-4 h-4 text-gray-500 transition-transform ${isViewExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </button>
                    {isViewExpanded && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-lg z-50 overflow-hidden flex flex-col">
                        {[
                          { id: 'day', label: '일' },
                          { id: 'week', label: '주' },
                          { id: 'month', label: '월' },
                          { id: 'year', label: '연도' },
                          { id: 'agenda', label: '일정' }
                        ].map(view => (
                          <button
                            key={view.id}
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('change-view-mode', { detail: { viewMode: view.id } }));
                              setIsViewExpanded(false);
                              closeModals();
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700 font-medium border-b border-gray-100 dark:border-zinc-700/50 last:border-0"
                          >
                            {view.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 px-1">내 캘린더 (라벨)</h4>
                  <div className="bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-2 space-y-1">
                    {labels.map((label) => (
                      <label key={label.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-zinc-700/50 rounded-lg cursor-pointer transition-colors">
                        <input 
                          type="checkbox"
                          checked={label.active}
                          onChange={() => toggleLabelActive(label.id)}
                          className="w-4 h-4 rounded-sm bg-transparent border-2 appearance-none cursor-pointer flex items-center justify-center after:content-[''] after:w-2.5 after:h-2.5 after:rounded-sm after:scale-0 checked:after:scale-100 after:transition-transform shrink-0"
                          style={{ 
                            borderColor: label.color, 
                            ...(label.active ? { '--tw-bg-opacity': 1, backgroundColor: label.color } : {}) 
                          } as any}
                        />
                        <span className="text-sm text-gray-800 dark:text-gray-200 font-medium flex-1 truncate">{label.name}</span>
                      </label>
                    ))}
                    
                    <button onClick={() => { 
                      setActiveApp('calendar'); 
                      closeModals();
                      setTimeout(() => window.dispatchEvent(new Event('open-label-manager')), 100);
                    }} className="w-full flex items-center justify-center gap-2 mt-2 px-3 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                      <span className="text-lg">🏷️</span>
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-bold">라벨 추가 / 관리</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

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
