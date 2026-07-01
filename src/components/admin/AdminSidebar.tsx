import React, { useState } from 'react';

interface AdminSidebarProps {
  githubToken: string;
  isLoading: boolean;
  postList: any[];
  onLoadPost: (filename: string, sha: string) => void;
  onDeletePost: (filename: string, sha: string) => void;
  onRefreshList: () => void;
  onRunAi: (mode: 'manual' | 'semi-auto', inputText: string) => void;
  onRunAuto: (type: 'all' | 'precedent' | 'trend') => void;
}

export default function AdminSidebar({
  githubToken,
  isLoading,
  postList,
  onLoadPost,
  onDeletePost,
  onRefreshList,
  onRunAi,
  onRunAuto
}: AdminSidebarProps) {
  const [tab, setTab] = useState<'posts' | 'ai' | 'auto'>('ai');
  const [inputText, setInputText] = useState('');
  const [aiMode, setAiMode] = useState<'manual' | 'semi-auto'>('manual');
  const [autoType, setAutoType] = useState<'all' | 'precedent' | 'trend'>('all');

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 shrink-0 w-80">
      
      {/* Sidebar Tabs */}
      <div className="flex bg-gray-100 dark:bg-zinc-950 p-1 m-3 rounded-md flex-shrink-0">
        {[
          { id: 'ai', label: '✨ AI' },
          { id: 'posts', label: '📂 기존 글' },
          { id: 'auto', label: '🤖 데일리' }
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
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-500">발행된 포스팅</span>
              <button onClick={onRefreshList} disabled={isLoading} className="text-[10px] text-blue-500 hover:underline">
                새로고침
              </button>
            </div>
            
            {postList.length === 0 ? (
              <div className="text-center py-10 text-xs text-gray-400">
                게시물이 없거나 로딩 중입니다.
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {postList.map((post) => (
                  <div key={post.sha} className="flex flex-col bg-gray-50 dark:bg-zinc-950 p-2.5 rounded-md border border-gray-100 dark:border-zinc-800 hover:border-blue-300 transition-colors group">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate mb-1">
                      {post.title}
                    </span>
                    <span className="text-[9px] text-gray-400 mb-2 font-mono">
                      {post.name}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onLoadPost(post.name, post.sha)}
                        disabled={isLoading}
                        className="flex-1 py-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-[10px] font-bold text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        불러오기
                      </button>
                      <button
                        onClick={() => onDeletePost(post.name, post.sha)}
                        disabled={isLoading}
                        className="p-1 px-2 bg-white dark:bg-zinc-800 border border-red-100 dark:border-red-900/30 rounded text-[10px] font-bold text-red-500 hover:bg-red-50 transition-colors"
                      >
                        삭제
                      </button>
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
      </div>
    </div>
  );
}
