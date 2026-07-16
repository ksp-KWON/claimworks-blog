'use client';

import React, { useState, useEffect } from 'react';
import { AdminAppType } from '@/components/admin/MobileAdminNav';
import MobileAdminNav from '@/components/admin/MobileAdminNav';
import MarkdownEditor from '@/components/admin/MarkdownEditor';
import dynamic from 'next/dynamic';
import ConsultationAdminPanel from '@/components/admin/ConsultationAdminPanel';
const AiWritingStudio = dynamic(() => import('@/components/admin/posts/AiWritingStudio'), { ssr: false });
const PostListPanel = dynamic(() => import('@/components/admin/posts/PostListPanel'), { ssr: false });
const SettingsPanel = dynamic(() => import('@/components/admin/posts/SettingsPanel'), { ssr: false });

import { 
  fetchPostList, 
  loadPost, 
  savePost, 
  deletePost, 
  callGeminiAPI, 
  runAutoPublish 
} from '@/lib/admin-api';

export default function AdminPage() {
  const [activeApp, setActiveApp] = useState<AdminAppType>('consult-manage');
  
  // Editor State
  const [postMeta, setPostMeta] = useState({
    title: '', summary: '', date: '', category: '', tags: '',
    content: '', currentSha: null as string | null, currentFilename: null as string | null
  });

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Common State
  const [postList, setPostList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Keys
  const [geminiKey, setGeminiKey] = useState('');
  const [githubToken, setGithubToken] = useState('');

  useEffect(() => {
    setGeminiKey(localStorage.getItem('GEMINI_API_KEY') || '');
    setGithubToken(localStorage.getItem('GITHUB_TOKEN') || '');
    if (sessionStorage.getItem('admin_auth') === 'true') {
      setIsLoggedIn(true);
    }

    const handleNavigate = (e: any) => {
      if (e.detail && e.detail.app) {
        setActiveApp(e.detail.app);
      }
    };
    window.addEventListener('navigate-admin-app', handleNavigate);
    return () => window.removeEventListener('navigate-admin-app', handleNavigate);
  }, []);

  const handleFetchList = async () => {
    setIsLoading(true);
    const list = await fetchPostList(githubToken);
    if (list) setPostList(list);
    setIsLoading(false);
  };

  useEffect(() => {
    if (githubToken && activeApp === 'post-list' && postList.length === 0) {
      handleFetchList();
    }
  }, [githubToken, activeApp]);

  const saveKeys = () => {
    localStorage.setItem('GEMINI_API_KEY', geminiKey);
    localStorage.setItem('GITHUB_TOKEN', githubToken);
    alert('키가 저장되었습니다.');
    if (activeApp === 'post-settings') setActiveApp('post-ai');
  };



  const handleLoadPost = async (filename: string, sha: string) => {
    setIsLoading(true);
    const postData = await loadPost(githubToken, filename);
    if (postData) {
      setPostMeta({
        title: postData.title,
        summary: postData.summary,
        date: postData.date,
        category: postData.category,
        tags: postData.tags,
        content: postData.content,
        currentSha: sha,
        currentFilename: filename
      });
      // Switch to editor
      setActiveApp('editor');
    }
    setIsLoading(false);
  };

  const handleSavePost = async () => {
    if (!postMeta.title || !postMeta.content) {
      alert('제목과 내용을 입력하세요.');
      return;
    }
    setIsLoading(true);
    const success = await savePost(githubToken, postMeta);
    if (success) {
      alert('포스팅이 성공적으로 저장/수정 되었습니다.');
      handleFetchList();
    }
    setIsLoading(false);
  };

  const handleDeletePost = async (filename: string, sha: string) => {
    if (!window.confirm(`정말 '${filename}' 포스팅을 삭제하시겠습니까?`)) return;
    setIsLoading(true);
    const success = await deletePost(githubToken, filename, sha);
    if (success) {
      alert('삭제 완료');
      if (postMeta.currentFilename === filename) handleCreateBlankPost();
      handleFetchList();
    }
    setIsLoading(false);
  };

  const handleRunAi = async (mode: 'manual-preserve' | 'manual-expand' | 'semi-auto', inputText: string) => {
    if (!geminiKey) { alert('Gemini API 키를 먼저 설정하세요.'); return; }
    setIsLoading(true);
    
    try {
      const generated = await callGeminiAPI(geminiKey, inputText, mode);
      if (generated) {
        // 기존 작성 내용을 유지하면서 내용 추가
        setPostMeta(prev => ({
          ...prev,
          content: prev.content ? prev.content + '\n\n' + generated : generated
        }));
        // Switch to editor inside AI Studio
        setActiveApp('post-ai');
      }
    } catch (e: any) {
      alert(e.message);
    }
    setIsLoading(false);
  };

  const handleRunAuto = async (type: 'all' | 'precedent' | 'trend') => {
    if (!githubToken) { alert('GitHub Token을 먼저 설정하세요.'); return; }
    setIsLoading(true);
    await runAutoPublish(githubToken, type);
    setIsLoading(false);
  };

  const handleCreateBlankPost = () => {
    setPostMeta({
      title: '', summary: '', date: '', category: '', tags: '',
      content: '', currentSha: null, currentFilename: null
    });
    setActiveApp('post-ai');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput) return;

    setIsVerifying(true);
    setAuthError('');
    try {
      const res = await fetch('/api/verify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem('admin_auth', 'true');
        setIsLoggedIn(true);
      } else {
        setAuthError(data.message || '비밀번호가 일치하지 않습니다.');
      }
    } catch (err) {
      setAuthError('서버 오류가 일시적으로 발생했습니다.');
    }
    setIsVerifying(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-gray-50 dark:bg-zinc-950 px-4 font-sans">
        <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-gray-200 dark:border-zinc-800 p-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-inner shadow-white/20 mx-auto mb-4 text-xl">
            C
          </div>
          <h2 className="text-2xl font-black text-center text-gray-900 dark:text-white tracking-tight mb-2">ClaimWorks Admin</h2>
          <p className="text-sm text-center text-gray-500 mb-8">보상스쿨 통합 관리자 시스템입니다.<br/>비밀번호를 입력해주세요.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input 
                type="password" 
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setAuthError('');
                }}
                placeholder="관리자 비밀번호"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 text-sm text-gray-900 dark:text-white outline-none"
                autoFocus
              />
            </div>
            {authError && <p className="text-red-500 text-xs text-center font-bold">{authError}</p>}
            <button 
              type="submit" 
              disabled={isVerifying || !passwordInput}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {isVerifying ? '확인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50 dark:bg-zinc-950 font-sans text-gray-900 dark:text-gray-100 overflow-hidden">
      
      {/* ── 글로벌 상단 네비게이션 (데스크톱 전용) ── */}
      <div className="hidden md:flex h-14 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 items-center justify-between px-5 shrink-0 z-50">
        
        {/* 로고 영역 */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-sm">
            C
          </div>
          <span className="font-black text-gray-900 dark:text-white tracking-tight">ClaimWorks</span>
        </div>

        {/* 메뉴 영역 */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveApp('consult-manage')}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${activeApp === 'consult-manage' ? 'bg-gray-100 dark:bg-zinc-800 text-blue-600' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50'}`}
          >
            상담 관리
          </button>
          
          <div className="w-px h-4 bg-gray-300 dark:bg-zinc-700 mx-2" />
          
          <button 
            onClick={() => setActiveApp('post-ai')}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${activeApp === 'post-ai' ? 'bg-gray-100 dark:bg-zinc-800 text-blue-600' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50'}`}
          >
            AI 스튜디오
          </button>
          <button 
            onClick={() => setActiveApp('post-list')}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${activeApp === 'post-list' ? 'bg-gray-100 dark:bg-zinc-800 text-blue-600' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50'}`}
          >
            기존 글 관리
          </button>
          
          <div className="w-px h-4 bg-gray-300 dark:bg-zinc-700 mx-2" />

          <button 
            onClick={() => setActiveApp('post-settings')}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${activeApp === 'post-settings' ? 'bg-gray-100 dark:bg-zinc-800 text-blue-600' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50'}`}
          >
            API 입력
          </button>
          
          <button 
            onClick={() => {
              sessionStorage.removeItem('admin_auth');
              setIsLoggedIn(false);
            }}
            className="px-3 py-2 rounded-lg text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors ml-2"
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative h-full pb-[64px] md:pb-0">
        
        {/* Dynamic Workspace based on activeApp */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-zinc-950 relative w-full">

          {/* Consultations */}
          {activeApp === 'consult-manage' && (
            <ConsultationAdminPanel isSplitView={true} onNavigateToManage={() => {}} />
          )}

          {/* Posting Center Tools */}
          {activeApp === 'post-ai' && (
            <AiWritingStudio 
              isLoading={isLoading} 
              onRunAi={handleRunAi} 
              onRunAuto={handleRunAuto}
              postMeta={postMeta}
              setPostMeta={setPostMeta}
              onSavePost={handleSavePost}
              onCreateBlank={handleCreateBlankPost}
            />
          )}
          {activeApp === 'post-list' && (
            <PostListPanel 
              isLoading={isLoading} 
              postList={postList} 
              onLoadPost={handleLoadPost} 
              onDeletePost={handleDeletePost} 
              onRefreshList={handleFetchList} 
            />
          )}
          {activeApp === 'post-settings' && (
            <SettingsPanel 
              geminiKey={geminiKey} setGeminiKey={setGeminiKey}
              githubToken={githubToken} setGithubToken={setGithubToken}
              saveKeys={saveKeys}
            />
          )}



        </div>
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
