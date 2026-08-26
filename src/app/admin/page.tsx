'use client';

import React, { useState, useEffect } from 'react';
import { AdminAppType } from '@/components/admin/MobileAdminNav';
import MobileAdminNav from '@/components/admin/MobileAdminNav';
import MarkdownEditor from '@/components/admin/MarkdownEditor';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import ConsultationAdminPanel from '@/components/admin/ConsultationAdminPanel';
import ChatAdminPanel from '@/components/admin/ChatAdminPanel';
import CalendarAdminPanel from '@/components/admin/CalendarAdminPanel';
import ThemeToggle from '@/components/ThemeToggle';

const AnalyticsDashboardPanel = dynamic(() => import('@/components/admin/AnalyticsDashboardPanel'), { ssr: false });
const AiWritingStudio = dynamic(() => import('@/components/admin/posts/AiWritingStudio'), { ssr: false });
const PostListPanel = dynamic(() => import('@/components/admin/posts/PostListPanel'), { ssr: false });

import { 
  fetchPostList, 
  loadPost, 
  savePost, 
  deletePost, 
  callGeminiAPI 
} from '@/lib/admin-api';
import { runAutoGenerationWorkflow, runManualGenerationWorkflow } from '@/lib/auto-writer';
import { parseMarkdown } from '@/lib/markdown-utils';

function normalizeCategory(val: string) {
  if (!val) return '보상가이드';
  const allowed = ['사망·자살 보험금', '질병진단·실손', '교통사고 보상', '배상책임·의료', '근재·산재 사고', '장해평가·면책', '보상가이드', '판례·분쟁조정', '판례·법률 해석'];
  if (allowed.includes(val)) return val;
  
  if (val.includes('교통')) return '교통사고 보상';
  if (val.includes('사망') || val.includes('자살')) return '사망·자살 보험금';
  if (val.includes('질병') || val.includes('실손')) return '질병진단·실손';
  if (val.includes('배상') || val.includes('의료')) return '배상책임·의료';
  if (val.includes('산재') || val.includes('근재')) return '근재·산재 사고';
  if (val.includes('장해') || val.includes('면책') || val.includes('후유')) return '장해평가·면책';
  if (val.includes('판례') || val.includes('법률') || val.includes('분쟁')) return '판례·분쟁조정';
  return '보상가이드';
}

export default function AdminPage() {
  const [activeApp, setActiveApp] = useState<AdminAppType>('analytics');
  
  // Shared Header Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState('date');
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Editor State
  const [postMeta, setPostMeta] = useState({
    title: '', summary: '', date: '', category: '', tags: '',
    specialtyCategory: '', caseNumber: '',
    content: '', currentSha: null as string | null, currentFilename: null as string | null,
    published: false
  });

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Posting Center Data State
  const [postList, setPostList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoProgress, setAutoProgress] = useState<string>('');

  // Settings State
  const [geminiKey, setGeminiKey] = useState('');
  const [githubToken, setGithubToken] = useState('');

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsLoggedIn(true);
    }
    const savedGemini = localStorage.getItem('gemini_api_key') || '';
    const savedGithub = localStorage.getItem('github_token') || '';
    setGeminiKey(savedGemini);
    setGithubToken(savedGithub);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === '9913006' || passwordInput === '1234' || passwordInput === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', 'true');
      setIsLoggedIn(true);
      setAuthError('');
    } else {
      setAuthError('비밀번호가 올바르지 않습니다.');
    }
  };

  useEffect(() => {
    if (activeApp === 'post-list') {
      const token = githubToken || localStorage.getItem('github_token') || '';
      setIsLoading(true);
      if (token) {
        fetchPostList(token)
          .then(list => setPostList(list))
          .catch(err => {
            console.warn('GitHub API fetch failed, falling back to local posts:', err);
            return fetch('/api/posts?admin=true')
              .then(res => res.json())
              .then(posts => {
                if (Array.isArray(posts)) {
                  setPostList(posts.map(p => ({
                    name: `${p.slug}.md`,
                    sha: p.slug,
                    title: p.title,
                    date: p.date,
                    published: p.published !== false
                  })));
                }
              });
          })
          .finally(() => setIsLoading(false));
      } else {
        // Fallback: 토큰 미등록 시에도 정적 포스트 목록을 읽기 전용으로 로드
        fetch('/api/posts?admin=true')
          .then(res => res.json())
          .then(posts => {
            if (Array.isArray(posts)) {
              setPostList(posts.map(p => ({
                name: `${p.slug}.md`,
                sha: p.slug,
                title: p.title,
                date: p.date,
                published: p.published !== false
              })));
            }
          })
          .catch(err => console.warn('Fetch local posts failed:', err))
          .finally(() => setIsLoading(false));
      }
    }
  }, [activeApp, githubToken]);

  const handleFetchList = async () => {
    if (!githubToken) {
      alert('시스템 설정에서 GitHub Personal Token을 먼저 설정해주세요.');
      setActiveApp('analytics');
      return;
    }
    setIsLoading(true);
    try {
      const list = await fetchPostList(githubToken);
      setPostList(list);
    } catch (e: any) {
      alert(`목록 조회 실패: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadPost = async (filename: string, sha: string) => {
    if (!githubToken) {
      alert('시스템 설정에서 GitHub Personal Token을 먼저 설정해주세요.');
      setActiveApp('analytics');
      return;
    }
    setIsLoading(true);
    try {
      const data = await loadPost(githubToken, filename);
      
      const rawDate = data.date;
      let safeDateStr = new Date().toISOString().split('T')[0];
      if (rawDate) {
        if (typeof rawDate === 'string') safeDateStr = rawDate.split('T')[0];
      }

      setPostMeta({
        title: data.title || '',
        summary: data.summary || '',
        date: safeDateStr,
        category: normalizeCategory(data.category),
        specialtyCategory: data.specialtyCategory || '',
        caseNumber: data.caseNumber || '',
        tags: data.tags || '',
        content: data.content || '',
        currentSha: sha,
        currentFilename: filename,
        published: data.published !== false
      });
      setActiveApp('post-ai');
    } catch (e: any) {
      alert(`글 로드 실패: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBlankPost = () => {
    setPostMeta({
      title: '', summary: '', date: new Date().toISOString().split('T')[0],
      category: '보상가이드', specialtyCategory: '', caseNumber: '',
      tags: '', content: '', currentSha: null, currentFilename: null,
      published: true
    });
  };

  const handleSavePost = async () => {
    if (!postMeta.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (!githubToken) {
      alert('시스템 설정에서 GitHub Personal Token을 먼저 설정해주세요.');
      setActiveApp('analytics');
      return;
    }

    setIsLoading(true);
    try {
      await savePost(githubToken, {
        ...postMeta,
        category: normalizeCategory(postMeta.category)
      });
      alert('저장되었습니다.');
    } catch (e: any) {
      alert(`저장 실패: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (filename: string, sha: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    if (!githubToken) {
      alert('시스템 설정에서 GitHub Personal Token을 먼저 설정해주세요.');
      setActiveApp('analytics');
      return;
    }

    setIsLoading(true);
    try {
      await deletePost(githubToken, filename, sha);
      alert('삭제되었습니다.');
      await handleFetchList();
    } catch (e: any) {
      alert(`삭제 실패: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunAi = async (mode: any, inputText: string) => {
    if (!geminiKey) {
      alert('시스템 설정에서 Google Gemini API Key를 먼저 설정해주세요.');
      setActiveApp('analytics');
      return;
    }
    setIsLoading(true);
    setAutoProgress('AI가 헌법 뼈대에 맞추어 글을 작성 중입니다...');
    try {
      const finalMarkdown = await runManualGenerationWorkflow(
        mode,
        inputText,
        geminiKey,
        (msg: string) => setAutoProgress(msg)
      );

      // Frontmatter와 본문 완벽 분리
      const { data: meta, content: pureContent } = parseMarkdown(finalMarkdown);

      setPostMeta(prev => ({
        ...prev,
        title: meta.title || prev.title,
        summary: meta.summary || prev.summary,
        category: normalizeCategory(meta.category || prev.category),
        specialtyCategory: meta.specialtyCategory || prev.specialtyCategory,
        caseNumber: meta.caseNumber || prev.caseNumber,
        tags: Array.isArray(meta.tags) ? meta.tags.join(', ') : (meta.tags || prev.tags),
        content: pureContent
      }));
    } catch (e: any) {
      alert(`AI 생성 실패: ${e.message}`);
    } finally {
      setIsLoading(false);
      setAutoProgress('');
    }
  };

  const handleRunAutoBatch = async (category: string, autoPublish?: boolean): Promise<boolean> => {
    if (!geminiKey || !githubToken) {
      alert('시스템 설정에서 Google Gemini API Key와 GitHub Personal Token을 먼저 설정해주세요.');
      setActiveApp('analytics');
      return false;
    }
    setIsLoading(true);
    setAutoProgress('자동 글쓰기 파이프라인 시작...');

    const mode: 'trend' | 'precedent' = (category === '판례·분쟁조정' || category === '판례·법률 해석') ? 'precedent' : 'trend';

    try {
      await runAutoGenerationWorkflow(
        mode,
        geminiKey,
        (msg: string) => setAutoProgress(msg),
        category
      );
      alert('원고 작성이 완료되었습니다.');
      return true;
    } catch (e: any) {
      alert(`원고 작성 실패: ${e.message}`);
      return false;
    } finally {
      setIsLoading(false);
      setAutoProgress('');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col justify-center items-center p-4 relative">
        {/* 로그인 화면 테마 토글 버튼 */}
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        <div className="max-w-md w-full bg-white dark:bg-[#202124] rounded-none shadow-[0_0_50px_rgba(0,0,0,0.12),0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_0_60px_rgba(0,0,0,0.75)] p-8 border border-gray-200/80 dark:border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--google-blue)] via-indigo-500 to-purple-500" />
          <div className="text-center mb-8">
            <Image src="/logo.png" alt="보상스쿨" width={180} height={45} className="mx-auto h-10 w-auto dark:brightness-110 mb-4" priority />
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">보상스쿨 통합 관리자</h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">접속을 위해 관리자 비밀번호를 입력해주세요.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="비밀번호 입력"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-[var(--google-blue)] transition-all text-center font-mono"
                autoFocus
              />
              {authError && <p className="text-red-500 text-xs mt-2 text-center font-bold">{authError}</p>}
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[var(--google-blue)] hover:bg-[#1557b0] text-white font-bold rounded-none text-sm transition-all shadow-[0_8px_20px_rgba(26,115,232,0.3)] active:scale-[0.99]"
            >
              로그인
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-white dark:bg-zinc-950 font-sans">
      {/* Universal Top Header Bar (작업영역과 100% 일치하는 max-w-7xl 레이아웃) */}
      <div className="h-[60px] bg-white dark:bg-zinc-900 border-b border-gray-200/80 dark:border-zinc-800 px-2.5 sm:px-3.5 z-20 shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.4)]">
        <div className="max-w-7xl mx-auto w-full h-full flex items-center justify-between gap-3">
          {/* 좌측 로고 & 브랜드 타이틀 + 관리자페이지 뱃지 (방문자 페이지와 일체화) */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="relative flex items-center justify-center shrink-0 h-[38px] sm:h-[44px]">
              <Image src="/logo.png" alt="보상스쿨 로고" width={180} height={44} className="h-full w-auto object-contain transition-all" priority />
            </div>
            <span className="hidden sm:inline font-black text-sm sm:text-base text-transparent bg-clip-text bg-gradient-to-r from-black to-gray-500 dark:from-white dark:to-gray-400 truncate tracking-[-0.075em]">
              보상스쿨 전문 손해사정 그룹
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-none bg-blue-50 dark:bg-blue-900/30 text-[10.5px] font-extrabold text-[var(--google-blue)] dark:text-[#8ab4f8] tracking-wider border border-blue-200 dark:border-blue-800 shadow-sm shrink-0">
              관리자페이지
            </span>
          </div>

          {/* 중앙 검색창 (상담/채팅/일정/원고 관리 공통 표시) */}
          <div className="flex-1 flex items-center justify-center px-2 min-w-0">
            {(activeApp === 'consult-manage' || activeApp === 'post-list' || activeApp === 'chat-manage' || activeApp === 'calendar') && (
              <div className="flex items-center gap-1.5 w-full max-w-xs sm:max-w-sm">
                <div className="relative flex-1">
                  <svg className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder={
                      activeApp === 'calendar' ? '고객명/전화/진단명 검색...' :
                      activeApp === 'chat-manage' ? '고객 닉네임/메시지 검색...' :
                      activeApp === 'consult-manage' ? '고객명/내용/문의 검색...' :
                      '제목/내용 검색...'
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-2.5 py-1.5 w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-none text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm font-sans"
                  />
                </div>
                <button
                  onClick={() => {
                    if (activeApp === 'post-list') handleFetchList();
                    else setRefreshCounter(c => c + 1);
                  }}
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-800 rounded-none transition-colors border border-gray-200 dark:border-zinc-700 shadow-sm shrink-0"
                  title="새로고침"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* 우측 메인 네비게이션 메뉴 (하단 작업영역 우측 라인과 일치) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="hidden md:flex items-center gap-1 shrink-0 bg-gray-100/80 dark:bg-zinc-950 p-1 rounded-none border border-gray-200/80 dark:border-zinc-800 shadow-sm">
              <button 
                onClick={() => setActiveApp('analytics')}
                className={`px-3 py-1 text-xs font-bold transition-all rounded-none border ${activeApp === 'analytics' || activeApp === 'post-settings' ? 'bg-white dark:bg-zinc-900 text-[var(--google-blue)] dark:text-[#8ab4f8] border-blue-300/80 dark:border-blue-700 shadow-sm font-extrabold' : 'text-gray-600 dark:text-zinc-400 border-transparent hover:bg-white/60 dark:hover:bg-zinc-900/60 hover:text-gray-900'}`}
              >
                통계 관리
              </button>
              
              <button 
                onClick={() => setActiveApp('consult-manage')}
                className={`px-3 py-1 text-xs font-bold transition-all rounded-none border ${activeApp === 'consult-manage' ? 'bg-white dark:bg-zinc-900 text-[var(--google-blue)] dark:text-[#8ab4f8] border-blue-300/80 dark:border-blue-700 shadow-sm font-extrabold' : 'text-gray-600 dark:text-zinc-400 border-transparent hover:bg-white/60 dark:hover:bg-zinc-900/60 hover:text-gray-900'}`}
              >
                상담 관리
              </button>
              
              <button 
                onClick={() => setActiveApp('chat-manage')}
                className={`px-3 py-1 text-xs font-bold transition-all rounded-none border ${activeApp === 'chat-manage' ? 'bg-white dark:bg-zinc-900 text-[var(--google-blue)] dark:text-[#8ab4f8] border-blue-300/80 dark:border-blue-700 shadow-sm font-extrabold' : 'text-gray-600 dark:text-zinc-400 border-transparent hover:bg-white/60 dark:hover:bg-zinc-900/60 hover:text-gray-900'}`}
              >
                채팅 관리
              </button>
              
              <button 
                onClick={() => setActiveApp('calendar')}
                className={`px-3 py-1 text-xs font-bold transition-all rounded-none border ${activeApp === 'calendar' ? 'bg-white dark:bg-zinc-900 text-[var(--google-blue)] dark:text-[#8ab4f8] border-blue-300/80 dark:border-blue-700 shadow-sm font-extrabold' : 'text-gray-600 dark:text-zinc-400 border-transparent hover:bg-white/60 dark:hover:bg-zinc-900/60 hover:text-gray-900'}`}
              >
                일정 관리
              </button>
              
              <button 
                onClick={() => setActiveApp('post-list')}
                className={`px-3 py-1 text-xs font-bold transition-all rounded-none border ${activeApp === 'post-list' ? 'bg-white dark:bg-zinc-900 text-[var(--google-blue)] dark:text-[#8ab4f8] border-blue-300/80 dark:border-blue-700 shadow-sm font-extrabold' : 'text-gray-600 dark:text-zinc-400 border-transparent hover:bg-white/60 dark:hover:bg-zinc-900/60 hover:text-gray-900'}`}
              >
                원고 관리
              </button>
     
              <button 
                onClick={() => setActiveApp('post-ai')}
                className={`px-3 py-1 text-xs font-bold transition-all rounded-none border ${activeApp === 'post-ai' ? 'bg-white dark:bg-zinc-900 text-[var(--google-blue)] dark:text-[#8ab4f8] border-blue-300/80 dark:border-blue-700 shadow-sm font-extrabold' : 'text-gray-600 dark:text-zinc-400 border-transparent hover:bg-white/60 dark:hover:bg-zinc-900/60 hover:text-gray-900'}`}
              >
                작업 관리
              </button>
              
              <div className="w-px h-3.5 bg-gray-300 dark:bg-zinc-700 mx-0.5" />

              <button 
                onClick={() => {
                  sessionStorage.removeItem('admin_auth');
                  setIsLoggedIn(false);
                }}
                className="px-2.5 py-1 rounded-none text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-900/50"
              >
                로그아웃
              </button>
            </div>

            {/* 다크/라이트 테마 토글 공통 버튼 (모바일/PC 공통) */}
            <div className="flex items-center shrink-0 border border-gray-200/80 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-950 shadow-sm">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 min-h-0 flex flex-col bg-gray-50 dark:bg-zinc-950 p-2.5 sm:p-3.5 overflow-hidden pb-[74px] md:pb-3.5">
        {/* 실시간 통계 & 시스템 설정 통합 대시보드 */}
        {(activeApp === 'analytics' || activeApp === 'post-settings') && (
          <AnalyticsDashboardPanel />
        )}

        {/* Consultations */}
        {activeApp === 'consult-manage' && (
          <ConsultationAdminPanel isSplitView={true} onNavigateToManage={() => {}} searchQuery={searchQuery} sortType={sortType} refreshCounter={refreshCounter} />
        )}

        {/* Chat Panel */}
        {activeApp === 'chat-manage' && (
          <ChatAdminPanel searchQuery={searchQuery} sortType={sortType} refreshCounter={refreshCounter} />
        )}

        {/* Calendar Panel */}
        {activeApp === 'calendar' && (
          <CalendarAdminPanel searchQuery={searchQuery} sortType={sortType} refreshCounter={refreshCounter} />
        )}

        {/* Posting Center Tools */}
        {activeApp === 'post-ai' && (
          <AiWritingStudio 
            isLoading={isLoading} 
            onRunAi={handleRunAi}
            postMeta={postMeta}
            setPostMeta={setPostMeta}
            onSavePost={handleSavePost}
            onCreateBlank={handleCreateBlankPost}
            autoProgress={autoProgress}
            onRunAutoBatch={handleRunAutoBatch}
          />
        )}
        {activeApp === 'post-list' && (
          <PostListPanel 
            isLoading={isLoading} 
            postList={postList} 
            onLoadPost={handleLoadPost} 
            onDeletePost={handleDeletePost} 
            searchQuery={searchQuery}
            sortType={sortType}
            hasToken={Boolean(githubToken || (typeof window !== 'undefined' && localStorage.getItem('github_token')))}
            onOpenSettings={() => setActiveApp('analytics')}
          />
        )}
      </div>
      
      {/* Mobile Admin Nav (Mobile Only) */}
      <MobileAdminNav 
        activeApp={activeApp} 
        setActiveApp={setActiveApp} 
        onLogout={() => {
          sessionStorage.removeItem('admin_auth');
          setIsLoggedIn(false);
        }}
      />
    </div>
  );
}
