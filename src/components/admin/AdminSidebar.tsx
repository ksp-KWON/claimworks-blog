import React, { useState, useMemo } from 'react';

interface AdminSidebarProps {
  isLoading: boolean;
  postList: any[];
  onLoadPost: (filename: string, sha: string) => void;
  onDeletePost: (filename: string, sha: string) => void;
  onRefreshList: () => void;
  onRunAi: (mode: 'manual' | 'semi-auto', inputText: string) => void;
  onRunAuto: (type: 'all' | 'precedent' | 'trend') => void;
  geminiKey: string;
  setGeminiKey: (val: string) => void;
  githubToken: string;
  setGithubToken: (val: string) => void;
  saveKeys: () => void;
  width?: number;
}

export default function AdminSidebar({
  isLoading,
  postList,
  onLoadPost,
  onDeletePost,
  onRefreshList,
  onRunAi,
  onRunAuto,
  geminiKey,
  setGeminiKey,
  githubToken,
  setGithubToken,
  saveKeys,
  width = 320
}: AdminSidebarProps) {
  const [tab, setTab] = useState<'posts' | 'ai' | 'auto' | 'settings'>('ai');
  const [inputText, setInputText] = useState('');
  const [aiMode, setAiMode] = useState<'manual' | 'semi-auto'>('manual');
  const [autoType, setAutoType] = useState<'all' | 'precedent' | 'trend'>('all');
  const [sortType, setSortType] = useState<'date' | 'alpha'>('date');

  const sortedPostList = useMemo(() => {
    return [...postList].sort((a, b) => {
      if (sortType === 'date') {
        const dateA = a.date || a.name;
        const dateB = b.date || b.name;
        return dateB.localeCompare(dateA);
      } else {
        return a.title.localeCompare(b.title);
      }
    });
  }, [postList, sortType]);

  return (
    <div 
      className="flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 shrink-0"
      style={{ width: `${width}px` }}
    >
      
      {/* Sidebar Tabs */}
      <div className="flex bg-gray-100 dark:bg-zinc-950 p-1 m-3 rounded-md flex-shrink-0">
        {[
          { id: 'ai', label: '✨ AI' },
          { id: 'posts', label: '📂 기존 글' },
          { id: 'auto', label: '🤖 데일리' },
          { id: 'settings', label: '⚙️ 설정' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id as any);
              if (t.id === 'posts' && postList.length === 0) {
                onRefreshList();
              }
            }}
            className={`flex-1 py-1.5 px-2 rounded-md text-xs font-bold transition-all ${
              tab === t.id 
                ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 custom-scrollbar">
        
        {/* AI Tools Tab */}
        {tab === 'ai' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-gray-500">작업 모드</span>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => setAiMode('manual')}
                  className={`py-1.5 text-xs font-bold rounded-md border ${
                    aiMode === 'manual' 
                      ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300'
                      : 'bg-white border-gray-200 text-gray-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-300'
                  }`}
                >
                  초안 다듬기 (대본)
                </button>
                <button
                  onClick={() => setAiMode('semi-auto')}
                  className={`py-1.5 text-xs font-bold rounded-md border ${
                    aiMode === 'semi-auto' 
                      ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300'
                      : 'bg-white border-gray-200 text-gray-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-300'
                  }`}
                >
                  링크 요약
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 flex-1">
              <span className="text-[11px] font-bold text-gray-500">
                {aiMode === 'manual' ? '유튜브 대본 등 원문 입력' : '키워드 또는 참고 링크 입력'}
              </span>
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className="w-full h-64 p-3 rounded-md border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 text-xs resize-none focus:ring-1 focus:ring-blue-500 outline-none custom-scrollbar"
                placeholder={aiMode === 'manual' ? "원문을 붙여넣으세요..." : "참고할 링크나 뼈대를 적어주세요..."}
              />
              <button
                onClick={() => onRunAi(aiMode, inputText)}
                disabled={isLoading || !inputText.trim()}
                className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-md text-xs shadow-sm disabled:opacity-50 transition-colors"
              >
                ✨ AI 글쓰기 가동
              </button>
              <p className="text-[9.5px] text-gray-400 mt-1 text-center">
                실행 시 중앙 에디터의 내용이 덮어씌워집니다.
              </p>
            </div>
          </div>
        )}

        {/* Post List Tab */}
        {tab === 'posts' && (
          <div className="flex flex-col gap-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-gray-500">발행된 포스팅</span>
                <select
                  value={sortType}
                  onChange={(e) => setSortType(e.target.value as 'date' | 'alpha')}
                  className="text-[10px] bg-transparent border-none text-gray-500 focus:ring-0 cursor-pointer outline-none font-bold p-0"
                >
                  <option value="date">날짜순</option>
                  <option value="alpha">가나다순</option>
                </select>
              </div>
              <button onClick={onRefreshList} disabled={isLoading} className="text-[10px] text-blue-500 hover:underline">
                새로고침
              </button>
            </div>
            
            {sortedPostList.length === 0 ? (
              <div className="text-center py-10 text-xs text-gray-400">
                게시물이 없거나 로딩 중입니다.
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {sortedPostList.map((post) => (
                  <div key={post.sha} className="flex flex-col bg-gray-50 dark:bg-zinc-950 p-2.5 rounded-md border border-gray-100 dark:border-zinc-800 hover:border-blue-300 transition-colors group">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate mb-1" title={post.title}>
                      {post.title}
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-gray-400 font-mono">
                        {post.date || post.name.replace('.md', '')}
                      </span>
                      <div className="flex gap-1 opacity-100 md:opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onLoadPost(post.name, post.sha)}
                          disabled={isLoading}
                          title="불러오기"
                          className="p-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button
                          onClick={() => onDeletePost(post.name, post.sha)}
                          disabled={isLoading}
                          title="삭제"
                          className="p-1.5 bg-white dark:bg-zinc-800 border border-red-100 dark:border-red-900/30 rounded text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Auto Daily Tab */}
        {tab === 'auto' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200 text-center py-4">
            <div className="mx-auto w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h3 className="text-sm font-bold text-gray-800 dark:text-white">원격 자동 발행</h3>
            <p className="text-[10px] text-gray-500 px-2 leading-relaxed">
              구글 트렌드 및 최신 이슈를 기반으로 AI가 스스로 글을 분석하고 자동 발행하는 파이프라인을 기동시킵니다.
            </p>
            
            <div className="flex flex-col gap-1 mt-2 text-left bg-gray-50 dark:bg-zinc-950 p-2 rounded-md">
              <span className="text-[10px] font-bold text-gray-500 mb-1">발행 종류</span>
              {[
                { id: 'all', label: '🔥 전체 (둘 다)' },
                { id: 'precedent', label: '⚖️ 법률칼럼' },
                { id: 'trend', label: '📈 트렌드' }
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setAutoType(type.id as any)}
                  className={`text-xs py-1.5 px-2 rounded border text-left font-bold ${
                    autoType === type.id 
                      ? 'bg-blue-600 text-white border-blue-700' 
                      : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300 border-gray-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => onRunAuto(autoType)}
              disabled={isLoading}
              className="mt-2 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-md text-xs shadow-sm disabled:opacity-50 transition-all"
            >
              🚀 깃허브 액션 즉시 기동
            </button>
          </div>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            <div className="flex flex-col gap-3 bg-gray-50 dark:bg-zinc-950 p-4 rounded-md border border-gray-200 dark:border-zinc-800">
              <h3 className="text-xs font-bold text-gray-800 dark:text-white border-b border-gray-200 dark:border-zinc-800 pb-2 mb-1">
                ⚙️ API 연동 설정
              </h3>
              
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-gray-500">Gemini API Key</span>
                <input 
                  type="password" 
                  value={geminiKey} 
                  onChange={e => setGeminiKey(e.target.value)} 
                  className="px-2.5 py-2 rounded-md bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-xs outline-none focus:border-blue-500 transition-colors" 
                  placeholder="AIzaSy..." 
                />
              </div>

              <div className="flex flex-col gap-1.5 mt-1">
                <span className="text-[10px] font-bold text-gray-500">GitHub Personal Token</span>
                <input 
                  type="password" 
                  value={githubToken} 
                  onChange={e => setGithubToken(e.target.value)} 
                  className="px-2.5 py-2 rounded-md bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-xs outline-none focus:border-blue-500 transition-colors" 
                  placeholder="ghp_..." 
                />
              </div>

              <button 
                onClick={saveKeys} 
                className="mt-3 w-full bg-gray-800 hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-gray-900 font-bold py-2.5 rounded-md text-xs shadow-sm transition-colors"
              >
                💾 저장하기
              </button>
            </div>
            <p className="text-[9px] text-gray-400 text-center px-2 leading-relaxed">
              API 키는 서버에 전송되지 않으며, 현재 사용 중인 브라우저(Local Storage)에만 안전하게 저장됩니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
