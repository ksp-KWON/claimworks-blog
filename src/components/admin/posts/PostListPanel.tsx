import React, { useState, useMemo } from 'react';

interface PostListPanelProps {
  isLoading: boolean;
  postList: any[];
  onLoadPost: (filename: string, sha: string) => void;
  onDeletePost: (filename: string, sha: string) => void;
  onRefreshList: () => void;
}

export default function PostListPanel({ isLoading, postList, onLoadPost, onDeletePost, onRefreshList }: PostListPanelProps) {
  const [sortType, setSortType] = useState<'date' | 'alpha'>('date');
  const [searchQuery, setSearchQuery] = useState('');

  const sortedAndFilteredList = useMemo(() => {
    return [...postList]
      .filter(post => post.title.toLowerCase().includes(searchQuery.toLowerCase()) || post.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (sortType === 'date') {
          const dateA = a.date || a.name;
          const dateB = b.date || b.name;
          return dateB.localeCompare(dateA);
        } else {
          return a.title.localeCompare(b.title);
        }
      });
  }, [postList, sortType, searchQuery]);

  return (
    <div className="flex-1 flex flex-col p-6 bg-gray-50 dark:bg-zinc-950 overflow-hidden">
      <div className="max-w-6xl mx-auto w-full flex flex-col h-full space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              📂 기존 글 관리
            </h2>
            <p className="text-sm text-gray-500 mt-1">블로그에 발행된 포스팅을 관리하고 수정합니다.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="제목으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm bg-gray-50 dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500 outline-none w-[200px] transition-all"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value as 'date' | 'alpha')}
              className="px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="date">최신 등록순</option>
              <option value="alpha">가나다순</option>
            </select>

            <button 
              onClick={onRefreshList} 
              disabled={isLoading} 
              className="p-2 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              title="새로고침"
            >
              <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm">
          {sortedAndFilteredList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <svg className="w-16 h-16 mb-4 text-gray-200 dark:text-zinc-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p>{isLoading ? '게시물을 불러오는 중입니다...' : '조건에 맞는 게시물이 없습니다.'}</p>
            </div>
          ) : (
            <>
              {/* 모바일 뷰 (카드형) */}
              <div className="block md:hidden divide-y divide-gray-100 dark:divide-zinc-800/50">
                {sortedAndFilteredList.map((post) => (
                  <div key={post.sha} className="p-4 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors flex flex-col gap-3">
                    <div className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-snug">
                      {post.title}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {post.date || post.name.replace('.md', '')}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onLoadPost(post.name, post.sha)}
                          disabled={isLoading}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 text-blue-600 dark:text-blue-400 text-xs font-bold rounded border border-blue-200 dark:border-blue-800/50 transition-colors flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          수정
                        </button>
                        <button
                          onClick={() => onDeletePost(post.name, post.sha)}
                          disabled={isLoading}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold rounded border border-red-200 dark:border-red-800/50 transition-colors flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 데스크탑 뷰 (테이블형) */}
              <table className="hidden md:table min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
                <thead className="bg-gray-50 dark:bg-zinc-950 sticky top-0 z-10">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">포스팅 제목</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-40">발행일 / 파일명</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-40">관리</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-100 dark:divide-zinc-800/50">
                  {sortedAndFilteredList.map((post) => (
                    <tr key={post.sha} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {post.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                          {post.date || post.name.replace('.md', '')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {/* 데스크탑에서는 hover시에만 관리 버튼 노출 */}
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onLoadPost(post.name, post.sha)}
                            disabled={isLoading}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 text-blue-600 dark:text-blue-400 text-xs font-bold rounded border border-blue-200 dark:border-blue-800/50 transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            수정
                          </button>
                          <button
                            onClick={() => onDeletePost(post.name, post.sha)}
                            disabled={isLoading}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold rounded border border-red-200 dark:border-red-800/50 transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
