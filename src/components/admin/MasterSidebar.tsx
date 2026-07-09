import React, { useState } from 'react';
import { useCalendarLabels } from './useCalendarLabels';
import { motion, AnimatePresence } from 'framer-motion';

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
  // Accordion states
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true);
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [isConsultExpanded, setIsConsultExpanded] = useState(true);
  const [isPostsExpanded, setIsPostsExpanded] = useState(true);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);

  // Labels hook
  const { labels, toggleLabelActive, addLabel, deleteLabel, updateLabel, reorderLabels } = useCalendarLabels();

  // Label Edit State
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editLabelName, setEditLabelName] = useState('');
  const [editLabelColor, setEditLabelColor] = useState('');

  const startEditLabel = (e: React.MouseEvent, label: any) => {
    e.stopPropagation();
    setEditingLabelId(label.id);
    setEditLabelName(label.name);
    setEditLabelColor(label.color);
  };

  const saveEditLabel = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingLabelId && editLabelName.trim()) {
      updateLabel(editingLabelId, editLabelName.trim(), editLabelColor);
      setEditingLabelId(null);
    }
  };

  const moveLabel = (e: React.MouseEvent, index: number, direction: 'up' | 'down') => {
    e.stopPropagation();
    if (direction === 'up' && index > 0) {
      const newLabels = [...labels];
      [newLabels[index - 1], newLabels[index]] = [newLabels[index], newLabels[index - 1]];
      reorderLabels(newLabels);
    } else if (direction === 'down' && index < labels.length - 1) {
      const newLabels = [...labels];
      [newLabels[index + 1], newLabels[index]] = [newLabels[index], newLabels[index + 1]];
      reorderLabels(newLabels);
    }
  };

  const isChatActive = activeApp.startsWith('chat-');
  const isConsultActive = activeApp.startsWith('consult-');
  const isPostActive = activeApp.startsWith('post-') || activeApp === 'editor';

  const handleAddLabel = () => {
    const name = window.prompt('새 라벨 이름을 입력하세요:');
    if (!name || !name.trim()) return;
    const colors = ['#4285f4', '#fbbc04', '#ea4335', '#34a853', '#8e24aa', '#f06292', '#00acc1'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    addLabel(name.trim(), randomColor);
  };

  const handleDeleteLabel = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('이 라벨을 삭제하시겠습니까? (기존 일정의 라벨은 유지되지만 필터링은 불가능해집니다)')) {
      deleteLabel(id);
    }
  };

  return (
    <div 
      className={`relative bg-white dark:bg-[#202124] rounded-none shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] p-4 flex flex-col transition-all duration-300 ease-in-out shrink-0 ${isCollapsed ? 'w-20' : 'w-[280px]'}`}
    >
      {/* Menu Items */}
      <div className="flex-1 flex flex-col gap-2">
        
        {/* Top Header Toggle */}
        <div className="bg-transparent rounded-none overflow-hidden shrink-0">
          <button
            onClick={toggleCollapse}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-4 py-3.5 rounded-xl transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white group`}
            title={isCollapsed ? "메뉴 펼치기" : "메뉴 접기"}
          >
            {!isCollapsed && <span className="text-base font-extrabold text-gray-900 dark:text-white">관리자페이지</span>}
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform duration-300 group-hover:text-gray-600 dark:group-hover:text-white ${isCollapsed ? 'rotate-180' : ''}`} 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* 0. Calendar (상담일정) */}
        <div className="bg-transparent rounded-none overflow-hidden shrink-0">
          <button
            onClick={() => {
              if (isCollapsed) toggleCollapse();
              setIsCalendarExpanded(!isCalendarExpanded);
              if (activeApp !== 'calendar') setActiveApp('calendar');
            }}
            className={`w-full flex items-center justify-between px-4 py-4 transition-colors ${
              activeApp === 'calendar' || (!isCollapsed && isCalendarExpanded)
                ? 'bg-blue-50/30 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 font-extrabold' 
                : 'hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-bold'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-5 rounded-full bg-blue-500 shrink-0"></div>
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {!isCollapsed && <span className="text-[15px]">상담일정</span>}
            </div>
            {!isCollapsed && (
              <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isCalendarExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
          
          <AnimatePresence initial={false}>
            {(!isCollapsed && isCalendarExpanded) && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-3 py-3 border-t border-gray-100 dark:border-zinc-800 flex flex-col gap-1.5">
                  {labels.map((label, index) => (
                    <div key={label.id} className="flex items-center justify-between px-3 py-2 text-sm group rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                      {editingLabelId === label.id ? (
                        <div className="flex items-center gap-2 flex-1 w-full mr-2">
                          <input 
                            type="color" 
                            value={editLabelColor}
                            onChange={(e) => setEditLabelColor(e.target.value)}
                            className="w-5 h-5 rounded cursor-pointer shrink-0 border-0 p-0"
                          />
                          <input 
                            type="text"
                            value={editLabelName}
                            onChange={(e) => setEditLabelName(e.target.value)}
                            className="flex-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white px-2 py-1 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 w-full min-w-0"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditLabel(e as any);
                              if (e.key === 'Escape') setEditingLabelId(null);
                            }}
                          />
                          <button onClick={saveEditLabel} className="text-green-500 hover:text-green-600 text-xs shrink-0">✓</button>
                          <button onClick={() => setEditingLabelId(null)} className="text-gray-400 hover:text-gray-600 text-xs shrink-0">✕</button>
                        </div>
                      ) : (
                        <>
                          <label className="flex items-center gap-2 cursor-pointer flex-1 truncate text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white font-medium">
                            <input 
                              type="checkbox"
                              checked={label.active}
                              onChange={() => toggleLabelActive(label.id)}
                              className="w-4 h-4 rounded-sm bg-transparent border-2 appearance-none cursor-pointer flex items-center justify-center after:content-[''] after:w-2.5 after:h-2.5 after:rounded-sm after:scale-0 checked:after:scale-100 after:transition-transform shrink-0"
                              style={{ 
                                borderColor: label.color, 
                                ...(label.active ? { backgroundColor: label.color } : {}) 
                              } as any}
                            />
                            <span className="truncate">{label.name}</span>
                          </label>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            {index > 0 && (
                              <button onClick={(e) => moveLabel(e, index, 'up')} className="text-gray-400 hover:text-gray-700" title="위로">↑</button>
                            )}
                            {index < labels.length - 1 && (
                              <button onClick={(e) => moveLabel(e, index, 'down')} className="text-gray-400 hover:text-gray-700" title="아래로">↓</button>
                            )}
                            <button onClick={(e) => startEditLabel(e, label)} className="text-gray-400 hover:text-blue-500 ml-1" title="수정">✎</button>
                            <button onClick={(e) => handleDeleteLabel(e, label.id)} className="text-gray-400 hover:text-red-500" title="삭제">×</button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  <button 
                    onClick={handleAddLabel}
                    className="flex items-center gap-2 px-3 py-2 mt-1 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors group"
                  >
                    <div className="w-5 h-5 rounded-full border border-dashed border-gray-400 dark:border-zinc-500 flex items-center justify-center group-hover:border-gray-900 dark:group-hover:border-white transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <span className="text-sm font-medium">새 라벨 추가</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 1. Chat Center */}
        <div className="bg-transparent rounded-none overflow-hidden shrink-0">
          <button
            onClick={() => {
              if (isCollapsed) toggleCollapse();
              setIsChatExpanded(!isChatExpanded);
              if (!isChatActive) setActiveApp('chat-list');
            }}
            className={`w-full flex items-center justify-between px-4 py-4 transition-colors ${
              isChatActive || (!isCollapsed && isChatExpanded)
                ? 'bg-indigo-50/30 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-300 font-extrabold' 
                : 'hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-bold'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-5 rounded-full bg-indigo-500 shrink-0"></div>
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {!isCollapsed && <span className="text-[15px]">채팅 상담</span>}
            </div>
            {!isCollapsed && (
              <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isChatExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>

          <AnimatePresence initial={false}>
            {(!isCollapsed && isChatExpanded) && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-3 py-3 border-t border-gray-100 dark:border-zinc-800 flex flex-col gap-1">
                  <button
                    onClick={() => setActiveApp('chat-list')}
                    className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors text-sm ${
                      activeApp === 'chat-list' ? 'bg-indigo-50 dark:bg-zinc-800 text-indigo-700 dark:text-indigo-400 font-bold' : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    채팅 목록
                  </button>
                  <button
                    onClick={() => setActiveApp('chat-manage')}
                    className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors text-sm ${
                      activeApp === 'chat-manage' ? 'bg-indigo-50 dark:bg-zinc-800 text-indigo-700 dark:text-indigo-400 font-bold' : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    항목관리
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 2. Consultation Center */}
        <div className="bg-transparent rounded-none overflow-hidden shrink-0">
          <button
            onClick={() => {
              if (isCollapsed) toggleCollapse();
              setIsConsultExpanded(!isConsultExpanded);
              if (!isConsultActive) setActiveApp('consult-list');
            }}
            className={`w-full flex items-center justify-between px-4 py-4 transition-colors ${
              isConsultActive || (!isCollapsed && isConsultExpanded)
                ? 'bg-emerald-50/30 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-300 font-extrabold' 
                : 'hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-bold'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-5 rounded-full bg-emerald-500 shrink-0"></div>
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              {!isCollapsed && <span className="text-[15px]">예약 상담</span>}
            </div>
            {!isCollapsed && (
              <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isConsultExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
          
          <AnimatePresence initial={false}>
            {(!isCollapsed && isConsultExpanded) && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-3 py-3 border-t border-gray-100 dark:border-zinc-800 flex flex-col gap-1">
                  <button
                    onClick={() => setActiveApp('consult-list')}
                    className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors text-sm ${
                      activeApp === 'consult-list' ? 'bg-emerald-50 dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 font-bold' : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    접수 목록
                  </button>
                  <button
                    onClick={() => setActiveApp('consult-manage')}
                    className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors text-sm ${
                      activeApp === 'consult-manage' ? 'bg-emerald-50 dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 font-bold' : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    항목 관리
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. Posts Center */}
        <div className="bg-transparent rounded-none overflow-hidden shrink-0">
          <button
            onClick={() => {
              if (isCollapsed) toggleCollapse();
              setIsPostsExpanded(!isPostsExpanded);
              if (!isPostActive) setActiveApp('post-ai');
            }}
            className={`w-full flex items-center justify-between px-4 py-4 transition-colors ${
              isPostActive || (!isCollapsed && isPostsExpanded)
                ? 'bg-purple-50/30 dark:bg-purple-900/10 text-purple-700 dark:text-purple-300 font-extrabold' 
                : 'hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-bold'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-5 rounded-full bg-purple-500 shrink-0"></div>
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {!isCollapsed && <span className="text-[15px]">포스팅 센터</span>}
            </div>
            {!isCollapsed && (
              <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isPostsExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
          
          <AnimatePresence initial={false}>
            {(!isCollapsed && isPostsExpanded) && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-3 py-3 border-t border-gray-100 dark:border-zinc-800 flex flex-col gap-1">
                  <button
                    onClick={() => setActiveApp('post-ai')}
                    className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors text-sm ${
                      activeApp === 'post-ai' ? 'bg-purple-50 dark:bg-zinc-800 text-purple-700 dark:text-purple-400 font-bold' : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    AI 글쓰기
                  </button>
                  <button
                    onClick={() => setActiveApp('editor')}
                    className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors text-sm ${
                      activeApp === 'editor' ? 'bg-purple-50 dark:bg-zinc-800 text-purple-700 dark:text-purple-400 font-bold' : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    글쓰기 에디터
                  </button>
                  <button
                    onClick={() => setActiveApp('post-list')}
                    className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors text-sm ${
                      activeApp === 'post-list' ? 'bg-purple-50 dark:bg-zinc-800 text-purple-700 dark:text-purple-400 font-bold' : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    기존 글 관리
                  </button>
                  <button
                    onClick={() => setActiveApp('post-daily')}
                    className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors text-sm ${
                      activeApp === 'post-daily' ? 'bg-purple-50 dark:bg-zinc-800 text-purple-700 dark:text-purple-400 font-bold' : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    데일리 자동화
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 4. Settings (Accordion) */}
        <div className="bg-transparent rounded-none overflow-hidden shrink-0">
          <button
            onClick={() => {
              if (isCollapsed) toggleCollapse();
              setIsSettingsExpanded(!isSettingsExpanded);
            }}
            className={`w-full flex items-center justify-between px-4 py-4 transition-colors ${
              (activeApp === 'post-settings') || (!isCollapsed && isSettingsExpanded)
                ? 'bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 font-extrabold' 
                : 'hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-bold'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-5 rounded-full bg-gray-500 shrink-0"></div>
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {!isCollapsed && <span className="text-[15px]">환경설정</span>}
            </div>
            {!isCollapsed && (
              <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isSettingsExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
          
          <AnimatePresence initial={false}>
            {(!isCollapsed && isSettingsExpanded) && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-3 py-3 border-t border-gray-100 dark:border-zinc-800 flex flex-col gap-1">
                  <button
                    onClick={() => setActiveApp('post-settings')}
                    className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors text-sm ${
                      activeApp === 'post-settings' ? 'bg-gray-200 dark:bg-zinc-800 text-gray-800 dark:text-gray-200 font-bold' : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    API 입력
                  </button>
                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center px-3 py-2.5 rounded-lg transition-colors text-sm text-gray-500 dark:text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      로그아웃
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
