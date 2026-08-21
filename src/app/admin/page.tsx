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
  const allowed = ['사망·자살 보험금', '질병진단·실손', '교통사고 보상', '배상책임·의료', '근재·산재 사고', '장해평가·면책', '보상가이드', '판례·법률 해석'];
  if (allowed.includes(val)) return val;
  
  if (val.includes('교통')) return '교통사고 보상';
  if (val.includes('사망') || val.includes('자살')) return '사망·자살 보험금';
  if (val.includes('질병') || val.includes('실손')) return '질병진단·실손';
  if (val.includes('배상') || val.includes('의료')) return '배상책임·의료';
  if (val.includes('산재') || val.includes('근재')) return '근재·산재 사고';
  if (val.includes('장해') || val.includes('면책') || val.includes('후유')) return '장해평가·면책';
  if (val.includes('판례') || val.includes('법률')) return '판례·법률 해석';
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
    if (passwordInput === '1234' || passwordInput === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', 'true');
      setIsLoggedIn(true);
      setAuthError('');
    } else {
      setAuthError('비밀번호가 올바르지 않습니다.');
    }
  };

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
    try {
      const resultText = await callGeminiAPI(geminiKey, inputText, mode);
      setPostMeta(prev => ({
        ...prev,
        content: resultText
      }));
    } catch (e: any) {
      alert(`AI 생성 실패: ${e.message}`);
    } finally {
      setIsLoading(false);
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

    const mode: 'trend' | 'precedent' = category === '판례·법률 해석' ? 'precedent' : 'trend';

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
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-zinc-800">
          <div className="text-center mb-8">
            <Image src="/logo.png" alt="보상스쿨" width={180} height={45} className="mx-auto h-10 w-auto dark:brightness-110 mb-4" priority />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">보상스쿨 통합 관리자</h2>
            <p className="text-xs text-gray-500 mt-1">접속을 위해 관리자 비밀번호를 입력해주세요.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="비밀번호 입력"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center"
                autoFocus
              />
              {authError && <p className="text-red-500 text-xs mt-2 text-center">{authError}</p>}
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-[var(--google-blue)] hover:bg-[#1557b0] text-white font-bold rounded-xl text-sm transition-all shadow-md active:scale-[0.98]"
            >
              로그인
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 font-sans">
      {/* Universal Top Header Bar */}
      <div className="h-[64px] bg-[#f8f9fa] dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-4 md:px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="보상스쿨" width={120} height={30} className="h-6 w-auto dark:brightness-110" priority />
          <span className="hidden sm:inline-block text-xs font-extrabold text-[var(--google-blue)] dark:text-[#8ab4f8] bg-blue-50 dark:bg-blue-900/20 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
            통합 관리자
          </span>
        </div>

        {/* 중앙 검색창 (상담/채팅/원고 관리 시만 표시) */}
        <div className="flex-1 flex items-center justify-center px-4">
          {(activeApp === 'consult-manage' || activeApp === 'post-list' || activeApp === 'chat-manage') && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="제목/내용 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 w-48 sm:w-64 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => {
                  if (activeApp === 'post-list') handleFetchList();
                  else setRefreshCounter(c => c + 1);
                }}
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-gray-200 dark:border-zinc-700"
                title="새로고침"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* 우측 메인 네비게이션 메뉴 (콤팩트 통합) */}
        <div className="hidden md:flex items-center gap-1 shrink-0">
          <button 
            onClick={() => setActiveApp('analytics')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${activeApp === 'analytics' || activeApp === 'post-settings' ? 'bg-blue-50 dark:bg-blue-900/30 text-[var(--google-blue)] dark:text-[#8ab4f8] shadow-sm' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
          >
            <span>📊</span>
            <span>실시간 통계</span>
          </button>
          
          <div className="w-px h-3.5 bg-gray-300 dark:bg-zinc-700 mx-1" />
          
          <button 
            onClick={() => setActiveApp('consult-manage')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeApp === 'consult-manage' ? 'bg-gray-100 dark:bg-zinc-800 text-[var(--google-blue)] dark:text-[#8ab4f8]' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
          >
            상담 관리
          </button>
          
          <div className="w-px h-3.5 bg-gray-300 dark:bg-zinc-700 mx-1" />
          
          <button 
            onClick={() => setActiveApp('chat-manage')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeApp === 'chat-manage' ? 'bg-gray-100 dark:bg-zinc-800 text-[var(--google-blue)] dark:text-[#8ab4f8]' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
          >
            채팅 관리
          </button>
          
          <div className="w-px h-3.5 bg-gray-300 dark:bg-zinc-700 mx-1" />
          
          <button 
            onClick={() => setActiveApp('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeApp === 'calendar' ? 'bg-gray-100 dark:bg-zinc-800 text-[var(--google-blue)] dark:text-[#8ab4f8]' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
          >
            일정 관리
          </button>
          
          <div className="w-px h-3.5 bg-gray-300 dark:bg-zinc-700 mx-1" />
          
          <button 
            onClick={() => setActiveApp('post-list')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeApp === 'post-list' ? 'bg-gray-100 dark:bg-zinc-800 text-[var(--google-blue)] dark:text-[#8ab4f8]' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
          >
            원고 관리
          </button>
          
          <div className="w-px h-3.5 bg-gray-300 dark:bg-zinc-700 mx-1" />

          <button 
            onClick={() => setActiveApp('post-ai')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeApp === 'post-ai' ? 'bg-gray-100 dark:bg-zinc-800 text-[var(--google-blue)] dark:text-[#8ab4f8]' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'}`}
          >
            작업 관리
          </button>
          
          <button 
            onClick={() => {
              sessionStorage.removeItem('admin_auth');
              setIsLoggedIn(false);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-2 border border-red-200 dark:border-red-900/30"
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 min-h-0 flex flex-col bg-gray-50 dark:bg-zinc-950 p-4 md:p-6 overflow-y-auto pb-[74px] md:pb-6">
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
