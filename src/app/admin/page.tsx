'use client';

import React, { useState, useEffect } from 'react';
import MasterSidebar, { AdminAppType } from '@/components/admin/MasterSidebar';
import MarkdownEditor from '@/components/admin/MarkdownEditor';
import dynamic from 'next/dynamic';

const ChatAdminPanel = dynamic(() => import('@/components/admin/ChatAdminPanel'), { ssr: false });
const ConsultationAdminPanel = dynamic(() => import('@/components/admin/ConsultationAdminPanel'), { ssr: false });

const AiWritingPanel = dynamic(() => import('@/components/admin/posts/AiWritingPanel'), { ssr: false });
const PostListPanel = dynamic(() => import('@/components/admin/posts/PostListPanel'), { ssr: false });
const DailyAutoPanel = dynamic(() => import('@/components/admin/posts/DailyAutoPanel'), { ssr: false });
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
  const [activeApp, setActiveApp] = useState<AdminAppType>('chat-live');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Editor State
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [currentSha, setCurrentSha] = useState<string | null>(null);
  const [currentFilename, setCurrentFilename] = useState<string | null>(null);

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
  }, []);

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

  const handleFetchList = async () => {
    setIsLoading(true);
    const list = await fetchPostList(githubToken);
    if (list) setPostList(list);
    setIsLoading(false);
  };

  const handleLoadPost = async (filename: string, sha: string) => {
    setIsLoading(true);
    const postData = await loadPost(githubToken, filename);
    if (postData) {
      setTitle(postData.title);
      setSummary(postData.summary);
      setDate(postData.date);
      setCategory(postData.category);
      setTags(postData.tags);
      setContent(postData.content);
      setCurrentSha(sha);
      setCurrentFilename(filename);
      // Switch to editor
      setActiveApp('editor');
    }
    setIsLoading(false);
  };

  const handleSavePost = async () => {
    if (!title || !content) {
      alert('제목과 내용을 입력하세요.');
      return;
    }
    setIsLoading(true);
    const success = await savePost(githubToken, {
      title, summary, date, category, tags, content, currentFilename, currentSha
    });
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
      if (currentFilename === filename) handleCreateBlankPost();
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
        if (content) {
          setContent(content + '\n\n' + generated);
        } else {
          setContent(generated);
        }
        // Switch to editor
        setActiveApp('editor');
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
    setTitle(''); setSummary(''); setDate(''); setCategory(''); setTags('');
    setContent(''); setCurrentSha(null); setCurrentFilename(null);
    setActiveApp('editor');
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-zinc-950 px-4 font-sans">
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
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="관리자 비밀번호"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 text-sm text-gray-900 dark:text-white"
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
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-zinc-950 font-sans text-gray-900 dark:text-gray-100 overflow-hidden">
      
      {/* 1. Top Header */}
      <header className="h-14 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between px-6 shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black shadow-inner shadow-white/20">
            C
          </div>
          <h1 className="text-lg font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            ClaimWorks <span className="text-gray-300 dark:text-zinc-600 font-light">|</span> 통합 관리자
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleCreateBlankPost}
            className="px-4 py-1.5 rounded-full text-sm font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            새 문서 작성
          </button>
          
          <button 
            onClick={handleSavePost}
            disabled={isLoading || activeApp !== 'editor'}
            className={`px-5 py-1.5 rounded-full text-sm font-bold shadow-sm flex items-center gap-1.5 transition-all
              ${activeApp === 'editor' 
                ? 'bg-gray-900 text-white hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-500'}`}
          >
            {isLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
            )}
            저장 및 발행
          </button>
        </div>
      </header>

      {/* 2. Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Master Sidebar */}
        <MasterSidebar 
          activeApp={activeApp} 
          setActiveApp={setActiveApp} 
          isCollapsed={isSidebarCollapsed} 
          toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />

        {/* Dynamic Workspace based on activeApp */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-zinc-950 relative">
          
          {/* Chat */}
          {activeApp === 'chat-live' && <ChatAdminPanel />}
          
          {/* Consultations */}
          {activeApp === 'consult-list' && (
            <ConsultationAdminPanel isSplitView={false} onNavigateToManage={() => setActiveApp('consult-manage')} />
          )}
          {activeApp === 'consult-manage' && (
            <ConsultationAdminPanel isSplitView={true} onNavigateToManage={() => setActiveApp('consult-manage')} />
          )}

          {/* Posting Center Tools */}
          {activeApp === 'post-ai' && (
            <AiWritingPanel isLoading={isLoading} onRunAi={handleRunAi} />
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
          {activeApp === 'post-daily' && (
            <DailyAutoPanel isLoading={isLoading} onRunAuto={handleRunAuto} />
          )}
          {activeApp === 'post-settings' && (
            <SettingsPanel 
              geminiKey={geminiKey} setGeminiKey={setGeminiKey}
              githubToken={githubToken} setGithubToken={setGithubToken}
              saveKeys={saveKeys}
            />
          )}

          {/* Markdown Editor (Only visible when activeApp is 'editor') */}
          {activeApp === 'editor' && (
            <div className="flex-1 flex overflow-hidden animate-in fade-in duration-300 zoom-in-95">
              <MarkdownEditor 
                title={title} setTitle={setTitle}
                content={content} setContent={setContent}
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
