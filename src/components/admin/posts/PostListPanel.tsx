import React, { useMemo } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumBadge from '@/components/ui/PremiumBadge';
import AppIcon from '@/components/ui/AppIcon';
import AdminPanelLayout from '../AdminPanelLayout';
import { AdminTableHeader } from '../AdminHeader';

interface PostListPanelProps {
  isLoading: boolean;
  postList: any[];
  onLoadPost: (filename: string, sha: string) => void;
  onDeletePost: (filename: string, sha: string) => void;
  searchQuery: string;
  sortType: string;
  hasToken?: boolean;
  onOpenSettings?: () => void;
}

export default function PostListPanel({
  isLoading,
  postList,
  onLoadPost,
  onDeletePost,
  searchQuery,
  sortType,
  hasToken = true,
  onOpenSettings
}: PostListPanelProps) {

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

  const tableColumns = [
    { label: '발행일', width: 'w-40' },
    { label: '포스팅 제목', align: 'left' as const },
    { label: '관리', width: 'w-40' }
  ];

  const totalCount = sortedAndFilteredList.length;
  const draftCount = sortedAndFilteredList.filter(p => p.published === false).length;
  const publishedCount = totalCount - draftCount;

  return (
    <AdminPanelLayout innerClassName="space-y-2.5">
      {/* 1. 상단 원고 현황 및 GitHub 토큰 상태 카드 아일랜드 (CommonBox 스타일) */}
      <PremiumCard borderColor="blue" hoverEffect={true} watermarkIcon="book" className="!p-3 shrink-0 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <AppIcon name="book" size={16} className="text-[var(--google-blue)] dark:text-[#8ab4f8]" />
          <span className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white">
            발행 원고 데이터베이스
          </span>
          <span className="text-[10px] text-gray-400 font-mono hidden sm:inline-block">
            GitHub .md 동기화
          </span>
        </div>

        {/* 상태별 카운트 배지 및 토큰 상태 */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-none border border-gray-200/80 dark:border-zinc-700">
            <span className="text-gray-500 dark:text-zinc-400 font-medium text-[11px]">총 원고</span>
            <span className="font-mono font-extrabold text-gray-900 dark:text-white">{totalCount}</span>
          </div>

          <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-none border border-emerald-200 dark:border-emerald-800">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">발행됨</span>
            <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">{publishedCount}</span>
          </div>

          {draftCount > 0 && (
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-none border border-gray-200 dark:border-zinc-700">
              <span className="text-gray-600 dark:text-gray-400 font-bold text-[11px]">임시저장</span>
              <span className="font-mono font-extrabold text-gray-700 dark:text-gray-300">{draftCount}</span>
            </div>
          )}

          {!hasToken && onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="px-2.5 py-0.5 bg-amber-500 hover:bg-amber-600 text-white rounded-none text-[11px] font-bold transition-colors shadow-sm flex items-center gap-1"
              title="GitHub Personal Access Token 등록"
            >
              <AppIcon name="lock" size={11} /> 읽기 전용 (토큰 등록)
            </button>
          )}
        </div>
      </PremiumCard>

      {/* 🏝️ 2. 메인 원고 목록 테이블 카드 아일랜드 */}
      <PremiumCard borderColor="blue" hoverEffect={false} className="flex-1 min-h-0 !p-0 flex flex-col overflow-hidden">
        {sortedAndFilteredList.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 p-10">
            <svg className="w-12 h-12 mb-3 text-gray-300 dark:text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <p className="font-bold text-xs text-gray-500 dark:text-zinc-400">{isLoading ? '게시물을 불러오는 중입니다...' : '조건에 맞는 게시물이 없습니다.'}</p>
          </div>
        ) : (
          <>
            {/* 모바일 뷰 (카드형) */}
            <div className="md:hidden flex-1 min-h-0 overflow-y-auto space-y-2.5 p-3 custom-scrollbar bg-gray-50 dark:bg-zinc-950">
                {sortedAndFilteredList.map((post) => (
                  <PremiumCard key={post.sha} borderColor="blue" hoverEffect={true} className="!p-3.5 rounded-none">
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-gray-100 leading-snug truncate flex-1 min-w-0">
                          {post.title}
                        </div>
                        {post.published === false && (
                          <PremiumBadge color="gray" className="text-[10px] px-1.5 py-0.2 whitespace-nowrap bg-gray-200 text-gray-600 dark:bg-zinc-700 dark:text-gray-300 flex-shrink-0 rounded-none font-bold">
                            임시저장
                          </PremiumBadge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-none border border-gray-200/80 dark:border-zinc-700">
                          {post.date || post.name.replace('.md', '')}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onLoadPost(post.name, post.sha)}
                            disabled={isLoading}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-none border border-blue-200 dark:border-blue-800/50 transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            수정
                          </button>
                          <button
                            onClick={() => onDeletePost(post.name, post.sha)}
                            disabled={isLoading}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-none border border-red-200 dark:border-red-800/50 transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  </PremiumCard>
                ))}
              </div>

            {/* 데스크탑 뷰 (테이블형) */}
            <div className="hidden md:flex flex-1 min-h-0 flex-col overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto custom-scrollbar">
                <table className="min-w-full divide-y divide-gray-200/80 dark:divide-zinc-800">
                  <AdminTableHeader columns={tableColumns} />
                  <tbody className="bg-white dark:bg-[#202124] divide-y divide-gray-100 dark:divide-zinc-800/60">
                    {sortedAndFilteredList.map((post) => (
                      <tr key={post.sha} className="hover:bg-blue-50/60 dark:hover:bg-blue-950/30 transition-all duration-200 group border-l-2 border-transparent hover:border-[var(--google-blue)]">
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className="text-xs text-gray-500 dark:text-zinc-400 font-mono font-medium">
                            {post.date || post.name.replace('.md', '')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-left max-w-0 w-full">
                          <div className="flex items-center gap-2 overflow-hidden w-full">
                            <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-[var(--google-blue)] dark:group-hover:text-[#8ab4f8] transition-colors truncate flex-1 min-w-0">
                              {post.title}
                            </div>
                            {post.published === false && (
                              <PremiumBadge color="gray" className="text-[10px] px-1.5 py-0.2 whitespace-nowrap bg-gray-200 text-gray-600 dark:bg-zinc-700 dark:text-gray-300 flex-shrink-0 rounded-none font-bold">
                                임시저장
                              </PremiumBadge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onLoadPost(post.name, post.sha)}
                              disabled={isLoading}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-none border border-blue-200 dark:border-blue-800/50 transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              수정
                            </button>
                            <button
                              onClick={() => onDeletePost(post.name, post.sha)}
                              disabled={isLoading}
                              className="px-2.5 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-none border border-red-200 dark:border-red-800/50 transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </PremiumCard>
    </AdminPanelLayout>
  );
}
