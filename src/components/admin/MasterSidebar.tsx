import React, { useState } from 'react';

export type AdminAppType = 
  | 'post-ai' | 'post-list' | 'post-settings' 
  | 'editor' | 'consult-manage';

interface MasterSidebarProps {
  activeApp: AdminAppType;
  setActiveApp: (app: AdminAppType) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  onLogout?: () => void;
}

export default function MasterSidebar({ activeApp, setActiveApp, isCollapsed, toggleCollapse, onLogout }: MasterSidebarProps) {
  // Accordion states
  const [isPostsExpanded, setIsPostsExpanded] = useState(true);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);

  const isPostActive = activeApp.startsWith('post-') || activeApp === 'editor';

  return (
    <div 
      className={`relative bg-[#344253] text-zinc-300 flex flex-col transition-all duration-300 ease-in-out shrink-0 ${isCollapsed ? 'w-16' : 'w-[240px]'} border-r border-zinc-700/50`}
    >
      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto py-6 custom-scrollbar space-y-2">
        
        {/* Top Header Toggle */}
        <div className="px-3 pb-2 mb-2 border-b border-zinc-600/50">
          <button
            onClick={toggleCollapse}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg transition-colors hover:bg-zinc-800/50 text-zinc-300 hover:text-white group`}
            title={isCollapsed ? "메뉴 펼치기" : "메뉴 접기"}
          >
            {!isCollapsed && <span className="text-base font-bold text-white">관리자페이지</span>}
            <svg 
              className={`w-4 h-4 text-zinc-400 transition-transform duration-300 group-hover:text-white ${isCollapsed ? 'rotate-180' : ''}`} 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* 1. Posts Center */}
        <div className="px-3">
          <button
            onClick={() => {
              if (isCollapsed) toggleCollapse();
              setIsPostsExpanded(!isPostsExpanded);
              if (!isPostActive) setActiveApp('post-ai');
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
              isPostActive && !isPostsExpanded
                ? 'bg-zinc-800 text-white font-bold' 
                : 'hover:bg-zinc-800/50 text-zinc-300 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {!isCollapsed && <span className="text-sm font-bold">포스팅 센터</span>}
            </div>
            {!isCollapsed && (
              <svg className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isPostsExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
          {(!isCollapsed && isPostsExpanded) && (
            <div className="mt-1 ml-4 pl-4 border-l border-zinc-600/50 flex flex-col gap-1 py-1">
              <button
                onClick={() => setActiveApp('post-ai')}
                className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
                  activeApp === 'post-ai' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                AI 스튜디오
              </button>
              <button
                onClick={() => setActiveApp('editor')}
                className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
                  activeApp === 'editor' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                글쓰기 에디터
              </button>
              <button
                onClick={() => setActiveApp('post-list')}
                className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
                  activeApp === 'post-list' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                기존 글 관리
              </button>
            </div>
          )}
        </div>

        {/* 1.5. Consultations */}
        <div className="px-3">
          <button
            onClick={() => setActiveApp('consult-manage')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              activeApp === 'consult-manage' 
                ? 'bg-zinc-800 text-white font-bold' 
                : 'hover:bg-zinc-800/50 text-zinc-300 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {!isCollapsed && <span className="text-sm font-bold">상담 관리</span>}
          </button>
        </div>

        {/* 2. Settings (Accordion) */}
        <div className="px-3">
          <button
            onClick={() => {
              if (isCollapsed) toggleCollapse();
              setIsSettingsExpanded(!isSettingsExpanded);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
              (activeApp === 'post-settings') && !isSettingsExpanded
                ? 'bg-zinc-800 text-white font-bold' 
                : 'hover:bg-zinc-800/50 text-zinc-300 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {!isCollapsed && <span className="text-sm font-bold">환경설정</span>}
            </div>
            {!isCollapsed && (
              <svg className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isSettingsExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
          {(!isCollapsed && isSettingsExpanded) && (
            <div className="mt-1 ml-4 pl-4 border-l border-zinc-600/50 flex flex-col gap-1 py-1">
              <button
                onClick={() => setActiveApp('post-settings')}
                className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
                  activeApp === 'post-settings' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                API 입력
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full flex items-center px-3 py-2 rounded-lg transition-colors text-sm text-zinc-400 hover:text-red-400 hover:bg-zinc-800/50"
                >
                  로그아웃
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
