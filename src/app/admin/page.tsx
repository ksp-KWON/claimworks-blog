'use client';

import React, { useState, useEffect } from 'react';
import { AdminAppType } from '@/components/admin/MobileAdminNav';
import MobileAdminNav from '@/components/admin/MobileAdminNav';
import MarkdownEditor from '@/components/admin/MarkdownEditor';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import PremiumButton from '@/components/ui/PremiumButton';
import ConsultationAdminPanel from '@/components/admin/ConsultationAdminPanel';
const AiWritingStudio = dynamic(() => import('@/components/admin/posts/AiWritingStudio'), { ssr: false });
const PostListPanel = dynamic(() => import('@/components/admin/posts/PostListPanel'), { ssr: false });
const SettingsPanel = dynamic(() => import('@/components/admin/posts/SettingsPanel'), { ssr: false });

import { 
  fetchPostList, 
  loadPost, 
  savePost, 
  deletePost, 
  callGeminiAPI 
} from '@/lib/admin-api';
import { runAutoGenerationWorkflow } from '@/lib/auto-writer';

function parseGeneratedPost(raw: string) {
  // ✅ 근본 해결: CRLF(\r\n)를 LF(\n)로 정규화 — buildMarkdownFrontmatter가 \r\n을 생성하므로
  // 기존 정규식 /---\n...\n---/이 매칭 실패하던 버그를 완전히 수정
  const cleanRaw = raw
    .replace(/\r\n/g, '\n')
    .replace(/^```(?:markdown|md)?\s*\n/i, '')
    .replace(/\n```\s*$/, '')
    .trim();
  const match = cleanRaw.match(/---\n([\s\S]*?)\n---/);
  if (!match) return { title: '', summary: '', date: '', category: '', tags: '', slug: '', specialtyCategory: '', caseNumber: '', content: cleanRaw };
  const yamlStr = match[1];
  const content = cleanRaw.substring(match.index! + match[0].length).trim();
  
  const parse = (key: string) => {
    const line = yamlStr.split('\n').find(l => l.trimStart().startsWith(key + ':'));
    if (!line) return '';
    let val = line.slice(line.indexOf(':') + 1).trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    else if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);

    if (key === 'tags') {
      if (val.startsWith('[')) {
        // Robustly parse array even if missing quotes
        return val.slice(1, -1).split(',').map(t => t.replace(/["']/g, '').trim()).filter(Boolean).join(', ');
      }
      return val;
    }
    
    // 데일리 엔진 수준의 카테고리 강제 교정 (매핑)
    if (key === 'category') {
      const allowed = ['사망·자살 보험금', '질병진단·실손', '교통사고 보상', '배상책임·의료', '근재·산재 사고', '장해평가·면책', '보상가이드', '판례·법률 해석'];
      if (allowed.includes(val)) return val;
      
      if (val.includes('교통')) return '교통사고 보상';
      if (val.includes('사망') || val.includes('자살')) return '사망·자살 보험금';
      if (val.includes('질병') || val.includes('실손')) return '질병진단·실손';
      if (val.includes('배상') || val.includes('의료')) return '배상책임·의료';
      if (val.includes('산재') || val.includes('근재')) return '근재·산재 사고';
      if (val.includes('장해') || val.includes('면책') || val.includes('후유')) return '장해평가·면책';
      if (val.includes('판례') || val.includes('법률')) return '판례·법률 해석';
      return '보상가이드'; // 기본값
    }
    
    return val;
  };
  
  return {
    title: parse('title'), summary: parse('summary'), date: parse('date'),
    category: parse('category'), tags: parse('tags'), slug: parse('slug'),
    specialtyCategory: parse('specialtyCategory'),
    caseNumber: parse('caseNumber'),
    content
  };
}

export default function AdminPage() {
  const [activeApp, setActiveApp] = useState<AdminAppType>('consult-manage');
  
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
  const [autoProgress, setAutoProgress] = useState('');
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
        // 앱 이동 시 검색/정렬 초기화
        setSearchQuery('');
        setSortType('date');
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
        specialtyCategory: postData.specialtyCategory || '',
        caseNumber: postData.caseNumber || '',
        content: postData.content,
        currentSha: sha,
        currentFilename: filename,
        published: postData.published
      });
      // Switch to editor
      setActiveApp('post-ai');
    }
    setIsLoading(false);
  };

  const handleSavePost = async (isDraft: boolean = false) => {
    if (!postMeta.title || !postMeta.content) {
      alert('제목과 내용을 입력하세요.');
      return;
    }
    setIsLoading(true);
    const postDataToSave = {
      ...postMeta,
      published: !isDraft
    };
    const success = await savePost(githubToken, postDataToSave);
    if (success) {
      alert(isDraft ? '임시저장이 완료되었습니다.' : '포스팅이 성공적으로 발행되었습니다.');
      // 저장 성공 후 현재 상태 갱신 (SHA는 fetch 후 다시 로드해야 알지만, published 상태는 업데이트)
      setPostMeta(prev => ({ ...prev, published: !isDraft }));
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
        const parsed = parseGeneratedPost(generated);
        setPostMeta(prev => ({
          ...prev,
          title: parsed.title || prev.title,
          date: parsed.date || prev.date,
          category: parsed.category || prev.category,
          tags: parsed.tags || prev.tags,
          specialtyCategory: parsed.specialtyCategory || prev.specialtyCategory,
          caseNumber: parsed.caseNumber || prev.caseNumber,
          currentFilename: parsed.slug ? `${parsed.slug}.md` : prev.currentFilename,
          content: parsed.content
        }));
        setActiveApp('post-ai');
      }
    } catch (e: any) {
      alert(e.message);
    }
    setIsLoading(false);
  };

  const handleRunAuto = async (type: 'all' | 'precedent' | 'trend') => {
    if (!geminiKey) { alert('Gemini API 키를 먼저 설정하세요.'); return; }
    setIsLoading(true);
    setAutoProgress('자동글쓰기 시작 대기 중...');
    try {
      const generated = await runAutoGenerationWorkflow(type, geminiKey, (msg) => {
        setAutoProgress(msg);
      });
      
      if (generated) {
        const parsed = parseGeneratedPost(generated);
        setPostMeta(prev => ({
          ...prev,
          title: parsed.title || prev.title,
          date: parsed.date || prev.date,
          category: parsed.category || prev.category,
          tags: parsed.tags || prev.tags,
          specialtyCategory: parsed.specialtyCategory || prev.specialtyCategory,
          caseNumber: parsed.caseNumber || prev.caseNumber,
          currentFilename: parsed.slug ? `${parsed.slug}.md` : prev.currentFilename,
          content: parsed.content
        }));
        alert('자동 생성이 완료되었습니다. 에디터에서 내용을 검토 후 [저장 및 발행] 버튼을 눌러주세요.');
        setActiveApp('post-ai');
      }
    } catch (e: any) {
      alert(`자동 생성 실패: ${e.message}`);
    }
    setIsLoading(false);
    setAutoProgress('');
  };

  const handleCreateBlankPost = () => {
    setPostMeta({
      title: '', summary: '', date: '', category: '', tags: '',
      specialtyCategory: '', caseNumber: '',
      content: '', currentSha: null, currentFilename: null, published: false
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
        
        {/* 좌측 로고 영역 */}
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="보상스쿨" width={100} height={24} className="object-contain" />
        </div>

        {/* 중앙 헤더 컨트롤 영역 (상담 관리, 원고 관리 탭에서만 보임) */}
        <div className="flex-1 flex items-center justify-center px-4">
          {(activeApp === 'consult-manage' || activeApp === 'post-list') && (
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
                  className="pl-9 pr-3 py-1.5 w-64 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <select
                value={sortType}
                onChange={(e) => setSortType(e.target.value)}
                className="py-1.5 px-3 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-center appearance-none cursor-pointer"
              >
                <option value="date">최신순</option>
                <option value="alpha">가나다순</option>
              </select>
              <button
                onClick={() => {
                  if (activeApp === 'post-list') handleFetchList();
                  else setRefreshCounter(c => c + 1);
                }}
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-gray-200 dark:border-zinc-700"
                title="새로고침"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* 우측 메뉴 영역 */}
        <div className="flex items-center gap-1 shrink-0">
          <button 
            onClick={() => setActiveApp('consult-manage')}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${activeApp === 'consult-manage' ? 'bg-gray-100 dark:bg-zinc-800 text-[var(--google-blue)] dark:text-[#8ab4f8]' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50'}`}
          >
            상담 관리
          </button>
          
          <div className="w-px h-3 bg-gray-300 dark:bg-zinc-700 mx-1" />
          
          <button 
            onClick={() => setActiveApp('post-list')}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${activeApp === 'post-list' ? 'bg-gray-100 dark:bg-zinc-800 text-[var(--google-blue)] dark:text-[#8ab4f8]' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50'}`}
          >
            원고 관리
          </button>
          
          <div className="w-px h-3 bg-gray-300 dark:bg-zinc-700 mx-1" />

          <button 
            onClick={() => setActiveApp('post-ai')}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${activeApp === 'post-ai' ? 'bg-gray-100 dark:bg-zinc-800 text-[var(--google-blue)] dark:text-[#8ab4f8]' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50'}`}
          >
            작업 관리
          </button>
          
          <div className="w-px h-3 bg-gray-300 dark:bg-zinc-700 mx-1" />

          <button 
            onClick={() => setActiveApp('post-settings')}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${activeApp === 'post-settings' ? 'bg-gray-100 dark:bg-zinc-800 text-[var(--google-blue)] dark:text-[#8ab4f8]' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800/50'}`}
          >
            환경설정
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
      <div className="flex-1 min-h-0 flex flex-col bg-gray-50 dark:bg-zinc-950 pb-[64px] md:pb-0">

          {/* Consultations */}
          {activeApp === 'consult-manage' && (
            <ConsultationAdminPanel isSplitView={true} onNavigateToManage={() => {}} searchQuery={searchQuery} sortType={sortType} refreshCounter={refreshCounter} />
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
              autoProgress={autoProgress}
            />
          )}
          {activeApp === 'post-list' && (
            <PostListPanel 
              isLoading={isLoading} 
              postList={postList} 
              onLoadPost={handleLoadPost} 
              onDeletePost={handleDeletePost} 
              onRefreshList={handleFetchList}
              searchQuery={searchQuery}
              sortType={sortType}
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
