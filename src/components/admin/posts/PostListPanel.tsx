import React, { useMemo } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumBadge from '@/components/ui/PremiumBadge';
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

  return (
    <AdminPanelLayout innerClassName="flex flex-col w-full h-full bg-white dark:bg-[#111111]">
      <div className="flex-1 min-h-0 flex flex-col w-full">
        {/* ⚠️ GitHub Token 미설정 안내 배너 */}
        {!hasToken && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 rounded-xl p-3 mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shrink-0 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
              <span className="text-base">🔐</span>
              <span>
                <strong>GitHub Token(PAT)</strong>이 등록되지 않아 <strong>읽기 전용 모드</strong>로 목록을 표시합니다. 원고의 실시간 로드·수정·삭제를 위해 토큰을 등록해주세요.
              </span>
            </div>
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors shadow-sm"
              >
                API 설정에서 토큰 등록 ⚙️
              </button>
            )}
          </div>
        )}

        {sortedAndFilteredList.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-10">
            <svg className="w-16 h-16 mb-4 text-gray-200 dark:text-zinc-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <p className="font-bold text-gray-500">{isLoading ? '게시물을 불러오는 중입니다...' : '조건에 맞는 게시물이 없습니다.'}</p>
          </div>
        ) : (
          <>
            {/* 모바일 뷰 (카드형) */}
            <div className="md:hidden flex-1 min-h-0 overflow-y-auto space-y-3 custom-scrollbar">
                {sortedAndFilteredList.map((post) => (
                  <PremiumCard key={post.sha} borderColor="blue" hoverEffect={true} className="!p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-snug truncate flex-1 min-w-0">
                          {post.title}
                        </div>
                        {post.published === false && (
                          <PremiumBadge color="gray" className="text-[10px] px-1.5 py-0.5 whitespace-nowrap bg-gray-200 text-gray-600 dark:bg-zinc-700 dark:text-gray-300 flex-shrink-0 rounded-none">
                            임시저장
                          </PremiumBadge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <PremiumBadge color="gray" className="font-mono text-xs rounded-none">
                          {post.date || post.name.replace('.md', '')}
                        </PremiumBadge>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onLoadPost(post.name, post.sha)}
                            disabled={isLoading}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-none border border-blue-200 dark:border-blue-800/50 transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            수정
                          </button>
                          <button
                            onClick={() => onDeletePost(post.name, post.sha)}
                            disabled={isLoading}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-none border border-red-200 dark:border-red-800/50 transition-colors flex items-center gap-1 shadow-sm"
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
            <div className="hidden md:flex flex-1 min-h-0 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
                  <AdminTableHeader columns={tableColumns} />
                  <tbody className="bg-white dark:bg-[#202124] divide-y divide-gray-100 dark:divide-zinc-800/60">
                    {sortedAndFilteredList.map((post) => (
                      <tr key={post.sha} className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all duration-200 group border-l-2 border-transparent hover:border-[var(--google-blue)]">
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400 font-mono font-medium">
                            {post.date || post.name.replace('.md', '')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-left max-w-0 w-full">
                          <div className="flex items-center gap-2 overflow-hidden w-full">
                            <div className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-[var(--google-blue)] dark:group-hover:text-[#8ab4f8] transition-colors truncate flex-1 min-w-0">
                              {post.title}
                            </div>
                            {post.published === false && (
                              <PremiumBadge color="gray" className="text-[10px] px-1.5 py-0.5 whitespace-nowrap bg-gray-200 text-gray-600 dark:bg-zinc-700 dark:text-gray-300 flex-shrink-0 rounded-none">
                                임시저장
                              </PremiumBadge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {/* 데스크탑에서는 항상 관리 버튼을 연하게 노출하고 hover시 뚜렷하게 */}
                          <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onLoadPost(post.name, post.sha)}
                              disabled={isLoading}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-none border border-blue-200 dark:border-blue-800/50 transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              수정
                            </button>
                            <button
                              onClick={() => onDeletePost(post.name, post.sha)}
                              disabled={isLoading}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-none border border-red-200 dark:border-red-800/50 transition-colors flex items-center gap-1 shadow-sm"
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
              </div>
            </div>
          </>
        )}
      </div>
    </AdminPanelLayout>
  );
}
