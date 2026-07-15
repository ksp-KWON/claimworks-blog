import React, { useState, useMemo } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumBadge from '@/components/ui/PremiumBadge';
import PremiumButton from '@/components/ui/PremiumButton';

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
    <div className="flex-1 flex flex-col bg-[#f8f9fa] dark:bg-zinc-950 overflow-hidden relative">
      <div className="shrink-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 shadow-sm z-10">
        <div className="flex items-center h-14 px-5 gap-4 overflow-x-auto">

          {/* 아이콘 + 타이틀 */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-500 to-slate-600 flex items-center justify-center shadow-sm shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-base font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">기존 글 관리</span>
          </div>

          {/* 구분선 */}
          <div className="h-6 w-px bg-gray-200 dark:bg-zinc-700 shrink-0" />

          {/* 검색 + 정렬 + 새로고침 */}
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <div className="relative">
              <input
                type="text"
                placeholder="제목으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm bg-gray-50 dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-[150px] md:w-[200px] transition-all font-medium"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value as 'date' | 'alpha')}
              className="px-3 py-1.5 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            >
              <option value="date">최신순</option>
              <option value="alpha">가나다순</option>
            </select>
            <PremiumButton onClick={onRefreshList} disabled={isLoading} variant="secondary" className="!p-2" title="새로고침">
              <svg className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-500' : 'text-gray-600 dark:text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </PremiumButton>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar p-4 md:p-8 w-full">
        <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
          {sortedAndFilteredList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-10">
              <svg className="w-16 h-16 mb-4 text-gray-200 dark:text-zinc-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p className="font-bold text-gray-500">{isLoading ? '게시물을 불러오는 중입니다...' : '조건에 맞는 게시물이 없습니다.'}</p>
            </div>
          ) : (
            <>
              {/* 모바일 뷰 (카드형) */}
              <div className="block md:hidden space-y-3">
                {sortedAndFilteredList.map((post) => (
                  <PremiumCard key={post.sha} className="p-4 hover:border-blue-300 transition-colors">
                    <div className="flex flex-col gap-3">
                      <div className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-snug">
                        {post.title}
                      </div>
                      <div className="flex items-center justify-between">
                        <PremiumBadge color="gray" className="font-mono text-xs">
                          {post.date || post.name.replace('.md', '')}
                        </PremiumBadge>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onLoadPost(post.name, post.sha)}
                            disabled={isLoading}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg border border-blue-200 dark:border-blue-800/50 transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            수정
                          </button>
                          <button
                            onClick={() => onDeletePost(post.name, post.sha)}
                            disabled={isLoading}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg border border-red-200 dark:border-red-800/50 transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  </PremiumCard>
                ))}
              </div>

              {/* 데스크탑 뷰 (테이블형) */}
              <PremiumCard hoverEffect={true} className="hidden md:block p-0 sm:p-0 border-0">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-zinc-800">
                  <thead className="bg-slate-100 dark:bg-zinc-800">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-center text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-40">발행일</th>
                      <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">포스팅 제목</th>
                      <th scope="col" className="px-6 py-4 text-center text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-40">관리</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-50 dark:divide-zinc-800/50">
                    {sortedAndFilteredList.map((post) => (
                      <tr key={post.sha} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400 font-mono font-medium">
                            {post.date || post.name.replace('.md', '')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-left">
                          <div className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors w-full truncate">
                            {post.title}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {/* 데스크탑에서는 항상 관리 버튼을 연하게 노출하고 hover시 뚜렷하게 */}
                          <div className="flex items-center justify-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onLoadPost(post.name, post.sha)}
                              disabled={isLoading}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded border border-blue-200 dark:border-blue-800/50 transition-colors flex items-center gap-1"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              수정
                            </button>
                            <button
                              onClick={() => onDeletePost(post.name, post.sha)}
                              disabled={isLoading}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded border border-red-200 dark:border-red-800/50 transition-colors flex items-center gap-1"
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
              </PremiumCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
