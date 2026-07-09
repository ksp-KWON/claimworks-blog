import React, { useState } from 'react';

export type AdminAppType = 
  | 'calendar'
  | 'chat-list' | 'chat-manage' 
  | 'consult-list' | 'consult-manage' 
  | 'post-ai' | 'post-list' | 'post-daily' | 'post-settings' 
  | 'editor';

interface MasterSidebarProps {
  activeApp: AdminAppType;
  setActiveApp: (app: AdminAppType) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  onLogout?: () => void;
}

export default function MasterSidebar({ activeApp, setActiveApp, isCollapsed, toggleCollapse, onLogout }: MasterSidebarProps) {
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);

  return (
    <div 
      className={`bg-zinc-900 text-zinc-300 flex flex-col transition-all duration-300 ease-in-out shrink-0 ${isCollapsed ? 'w-16' : 'w-[240px]'} border-r border-zinc-800`}
    >
      {/* Toggle Button */}
      <div className="h-14 flex items-center justify-end px-4 border-b border-zinc-800 shrink-0">
        <button 
          onClick={toggleCollapse}
          className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
          title={isCollapsed ? "메뉴 펼치기" : "메뉴 접기"}
        >
          <svg 
            className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar space-y-6">
        
        {/* 0. Calendar */}
        <div className="px-3">
          <button
            onClick={() => setActiveApp('calendar')}
            className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors ${
              activeApp === 'calendar' 
                ? 'bg-zinc-800 text-white font-bold' 
                : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {!isCollapsed && <span className="text-sm font-bold">대시보드(일정)</span>}
            </div>
          </button>
        </div>

        {/* 1. Chat Center */}
        <div className="px-3">
          {!isCollapsed && (
            <div className="px-3 mb-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
              채팅 상담
            </div>
          )}
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setActiveApp('chat-list')}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center text-lg' : 'px-3 py-2 text-sm'} rounded-lg transition-colors ${
                activeApp === 'chat-list' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
              title="채팅 목록"
            >
              {isCollapsed ? '💬' : '채팅 목록'}
            </button>
            <button
              onClick={() => setActiveApp('chat-manage')}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center text-lg' : 'px-3 py-2 text-sm'} rounded-lg transition-colors ${
                activeApp === 'chat-manage' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
              title="항목관리"
            >
              {isCollapsed ? '⚙️' : '항목관리'}
            </button>
          </div>
        </div>

        {/* 2. Consultation Center */}
        <div className="px-3">
          {!isCollapsed && (
            <div className="px-3 mb-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
              예약 상담
            </div>
          )}
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setActiveApp('consult-list')}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center text-lg' : 'px-3 py-2 text-sm'} rounded-lg transition-colors ${
                activeApp === 'consult-list' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
              title="접수 목록"
            >
              {isCollapsed ? '📋' : '접수 목록'}
            </button>
            <button
              onClick={() => setActiveApp('consult-manage')}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center text-lg' : 'px-3 py-2 text-sm'} rounded-lg transition-colors ${
                activeApp === 'consult-manage' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
              title="항목 관리"
            >
              {isCollapsed ? '🛠️' : '항목 관리'}
            </button>
          </div>
        </div>

        {/* 3. Posts Center */}
        <div className="px-3">
          {!isCollapsed && (
            <div className="px-3 mb-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">
              포스팅 센터
            </div>
          )}
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setActiveApp('post-ai')}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center text-lg' : 'px-3 py-2 text-sm'} rounded-lg transition-colors ${
                activeApp === 'post-ai' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
              title="AI 글쓰기"
            >
              {isCollapsed ? '✨' : 'AI 글쓰기'}
            </button>
            <button
              onClick={() => setActiveApp('editor')}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center text-lg' : 'px-3 py-2 text-sm'} rounded-lg transition-colors ${
                activeApp === 'editor' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
              title="글쓰기 에디터"
            >
              {isCollapsed ? '✍️' : '글쓰기 에디터'}
            </button>
            <button
              onClick={() => setActiveApp('post-list')}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center text-lg' : 'px-3 py-2 text-sm'} rounded-lg transition-colors ${
                activeApp === 'post-list' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
              title="기존 글 관리"
            >
              {isCollapsed ? '📂' : '기존 글 관리'}
            </button>
            <button
              onClick={() => setActiveApp('post-daily')}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center text-lg' : 'px-3 py-2 text-sm'} rounded-lg transition-colors ${
                activeApp === 'post-daily' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
              title="데일리 자동화"
            >
              {isCollapsed ? '🤖' : '데일리 자동화'}
            </button>
          </div>
        </div>

        {/* 4. Settings (Accordion) */}
        <div className="px-3">
          <button
            onClick={() => {
              if (isCollapsed) toggleCollapse();
              setIsSettingsExpanded(!isSettingsExpanded);
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
              (activeApp === 'post-settings') && !isSettingsExpanded
                ? 'bg-zinc-800 text-white font-bold' 
                : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
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
              <svg className={`w-4 h-4 transition-transform duration-200 ${isSettingsExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
          {(!isCollapsed && isSettingsExpanded) && (
            <div className="mt-1 ml-4 pl-4 border-l border-zinc-700 flex flex-col gap-1 py-1">
              <button
                onClick={() => setActiveApp('post-settings')}
                className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
                  activeApp === 'post-settings' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
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
