import React, { useState } from 'react';

export type AdminAppType = 
  | 'chat-list' | 'chat-manage' 
  | 'consult-list' | 'consult-manage' 
  | 'post-ai' | 'post-list' | 'post-daily' | 'post-settings' 
  | 'editor';

interface MasterSidebarProps {
  activeApp: AdminAppType;
  setActiveApp: (app: AdminAppType) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export default function MasterSidebar({ activeApp, setActiveApp, isCollapsed, toggleCollapse }: MasterSidebarProps) {
  // Accordion states
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [isConsultExpanded, setIsConsultExpanded] = useState(true);
  const [isPostsExpanded, setIsPostsExpanded] = useState(true);

  const isChatActive = activeApp.startsWith('chat-');
  const isConsultActive = activeApp.startsWith('consult-');
  const isPostActive = activeApp.startsWith('post-');

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
      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        
        {/* 1. Chat Center */}
        <div className="px-2 mb-2">
          <button
            onClick={() => {
              if (isCollapsed) toggleCollapse();
              setIsChatExpanded(!isChatExpanded);
              if (!isChatActive) setActiveApp('chat-list');
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
              isChatActive && !isChatExpanded
                ? 'bg-zinc-800 text-white font-bold' 
                : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {!isCollapsed && <span className="text-sm font-bold">채팅 상담</span>}
            </div>
            {!isCollapsed && (
              <svg className={`w-4 h-4 transition-transform duration-200 ${isChatExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
          {(!isCollapsed && isChatExpanded) && (
            <div className="mt-1 ml-4 pl-4 border-l border-zinc-700 flex flex-col gap-1 py-1">
              <button
                onClick={() => setActiveApp('chat-list')}
                className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
                  activeApp === 'chat-list' ? 'bg-blue-600/20 text-blue-400 font-bold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                채팅 목록
              </button>
              <button
                onClick={() => setActiveApp('chat-manage')}
                className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
                  activeApp === 'chat-manage' ? 'bg-blue-600/20 text-blue-400 font-bold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                항목관리
              </button>
            </div>
          )}
        </div>

        {/* 2. Consultation Center */}
        <div className="px-2 mb-2">
          <button
            onClick={() => {
              if (isCollapsed) toggleCollapse();
              setIsConsultExpanded(!isConsultExpanded);
              if (!isConsultActive) setActiveApp('consult-list');
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
              isConsultActive && !isConsultExpanded
                ? 'bg-zinc-800 text-white font-bold' 
                : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              {!isCollapsed && <span className="text-sm font-bold">예약 상담</span>}
            </div>
            {!isCollapsed && (
              <svg className={`w-4 h-4 transition-transform duration-200 ${isConsultExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
          {(!isCollapsed && isConsultExpanded) && (
            <div className="mt-1 ml-4 pl-4 border-l border-zinc-700 flex flex-col gap-1 py-1">
              <button
                onClick={() => setActiveApp('consult-list')}
                className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
                  activeApp === 'consult-list' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                📋 접수 목록
              </button>
              <button
                onClick={() => setActiveApp('consult-manage')}
                className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
                  activeApp === 'consult-manage' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                ⚙️ 항목 관리
              </button>
            </div>
          )}
        </div>

        <div className="mx-4 my-2 border-t border-zinc-800"></div>

        {/* 3. Posts Center */}
        <div className="px-2 mt-2">
          <button
            onClick={() => {
              if (isCollapsed) toggleCollapse();
              setIsPostsExpanded(!isPostsExpanded);
              if (!isPostActive) setActiveApp('post-ai');
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
              isPostActive && !isPostsExpanded
                ? 'bg-zinc-800 text-white font-bold' 
                : 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {!isCollapsed && <span className="text-sm font-bold">포스팅 센터</span>}
            </div>
            {!isCollapsed && (
              <svg className={`w-4 h-4 transition-transform duration-200 ${isPostsExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
          {(!isCollapsed && isPostsExpanded) && (
            <div className="mt-1 ml-4 pl-4 border-l border-zinc-700 flex flex-col gap-1 py-1">
              <button
                onClick={() => setActiveApp('post-ai')}
                className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
                  activeApp === 'post-ai' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                ✨ AI 글쓰기
              </button>
              <button
                onClick={() => setActiveApp('post-list')}
                className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
                  activeApp === 'post-list' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                📂 기존 글 관리
              </button>
              <button
                onClick={() => setActiveApp('post-daily')}
                className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
                  activeApp === 'post-daily' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                🤖 데일리 자동화
              </button>
              <button
                onClick={() => setActiveApp('post-settings')}
                className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
                  activeApp === 'post-settings' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                ⚙️ API 환경 설정
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Profile */}
      {!isCollapsed && (
        <div className="p-4 border-t border-zinc-800 flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white leading-tight">보상스쿨</span>
            <span className="text-xs text-zinc-500">통합 관리자</span>
          </div>
        </div>
      )}
    </div>
  );
}
