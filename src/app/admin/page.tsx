"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdminSidebar from '@/components/admin/AdminSidebar';
import MarkdownEditor from '@/components/admin/MarkdownEditor';
import BlogPostContent from '@/components/BlogPostContent';
import { 
  STRICT_RULES, 
  getRandomAngle,
  getBlogRole, 
  getBlogLengthRulesManual, 
  getBlogLengthRulesSemiAuto, 
  getBlogFrontmatter, 
  getBlogSkeleton,
  calculateModelCapacity,
  cleanAnalysisBlock
} from '@/lib/prompt-rules';

const REPO_OWNER = 'ksp-KWON';
const REPO_NAME = 'claimworks-blog';
const POSTS_PATH = 'src/content/posts';

// YAML 파싱 유틸리티 (단순 버전)
function parseYamlFrontmatter(markdown: string) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { content: markdown, data: {} as any };
  
  const yamlContent = match[1];
  const restContent = markdown.replace(/^---\n[\s\S]*?\n---/, '').trim();
  
  const data: any = {};
  const lines = yamlContent.split('\n');
  lines.forEach(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (key === 'tags' && value.startsWith('[')) {
        try { data[key] = JSON.parse(value); } catch { data[key] = []; }
      } else {
        data[key] = value;
      }
    }
  });
  return { content: restContent, data };
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  
  const [geminiKey, setGeminiKey] = useState('');
  const [githubToken, setGithubToken] = useState('');

  useEffect(() => {
    setGeminiKey(localStorage.getItem('GEMINI_API_KEY') || '');
    setGithubToken(localStorage.getItem('GITHUB_TOKEN') || '');
  }, []);
  
  // Editor State
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState('판례법률석');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [tagsInput, setTagsInput] = useState('');
  const [content, setContent] = useState('');
  const [slug, setSlug] = useState('');
  const [selectedPostSha, setSelectedPostSha] = useState('');
  
  // GitHub Post List
  const [postList, setPostList] = useState<{name: string, sha: string, title: string}[]>([]);
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [showPreview, setShowPreview] = useState(true);

  // 컴파일된 전체 마크다운 문자열 (미리보기 및 발행용)
  const compiledTags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];
  const compiledMarkdown = `---
title: "${title.replace(/"/g, '\\"')}"
summary: "${summary.replace(/"/g, '\\"')}"
category: "${category}"
date: "${date}"
tags: ${JSON.stringify(compiledTags)}
---

${content}
`;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '9913006') setIsLoggedIn(true);
    else alert('비밀번호가 일치하지 않습니다.');
  };

  const saveKeys = () => {
    localStorage.setItem('GEMINI_API_KEY', geminiKey);
    localStorage.setItem('GITHUB_TOKEN', githubToken);
    setStatusMessage('🔑 키가 안전하게 저장되었습니다.');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const showStatus = (msg: string, autoHide = 0) => {
    setStatusMessage(msg);
    if (autoHide > 0) setTimeout(() => setStatusMessage(''), autoHide);
  };

  const fetchPostList = async () => {
    if (!githubToken) return alert('GitHub 토큰이 필요합니다.');
    setIsLoading(true);
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${POSTS_PATH}`, {
        headers: { 'Authorization': `Bearer ${githubToken}` }
      });
      if (!res.ok) throw new Error('목록을 불러오지 못했습니다.');
      const githubFiles = await res.json();
      const mdFiles = githubFiles.filter((f: any) => f.name.endsWith('.md'));

      const titlesMap: Record<string, string> = {};
      try {
        const dataRes = await fetch('/api/posts');
        if (dataRes.ok) {
          const postsData = await dataRes.json();
          postsData.forEach((post: any) => {
            titlesMap[`${post.slug}.md`] = post.title;
          });
        }
      } catch {}

      const combined = mdFiles.map((file: any) => ({
        name: file.name,
        sha: file.sha,
        title: titlesMap[file.name] || file.name.replace('.md', '')
      }));

      setPostList(combined);
      showStatus('📄 기존 글 목록 로드 완료', 3000);
    } catch (error: any) {
      showStatus(`오류: ${error.message}`);
    }
    setIsLoading(false);
  };

  const loadPost = async (filename: string, sha: string) => {
    if (!githubToken) return;
    setIsLoading(true);
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${POSTS_PATH}/${filename}`, {
        headers: { 'Authorization': `Bearer ${githubToken}` }
      });
      const data = await res.json();
      const rawMarkdown = decodeURIComponent(escape(window.atob(data.content)));
      
      const { content: rawContent, data: meta } = parseYamlFrontmatter(rawMarkdown);
      
      setSelectedPostSha(sha);
      setSlug(filename.replace('.md', ''));
      setTitle(meta.title || '');
      setSummary(meta.summary || '');
      setCategory(meta.category || '기타');
      setDate(meta.date || new Date().toISOString().split('T')[0]);
      setTagsInput(Array.isArray(meta.tags) ? meta.tags.join(', ') : '');
      setContent(rawContent);
      
      showStatus(`📝 "${meta.title || filename}" 수정 모드`, 3000);
    } catch (error: any) {
      showStatus(`오류: ${error.message}`);
    }
    setIsLoading(false);
  };

  const deletePost = async (filename: string, sha: string) => {
    if (!githubToken) return alert('GitHub 토큰이 필요합니다.');
    if (!window.confirm(`[⚠️ 영구 삭제] 정말로 "${filename}" 파일을 삭제하시겠습니까?`)) return;
    
    setIsLoading(true);
    showStatus(`🗑️ 삭제 중...`);
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${POSTS_PATH}/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `docs: 포스팅 삭제 (${filename})`,
          sha: sha,
          branch: 'main'
        })
      });
      if (!res.ok) throw new Error(await res.text());
      showStatus(`✅ 삭제 성공!`, 4000);
      await fetchPostList();
    } catch (error: any) {
      showStatus(`삭제 실패: ${error.message}`);
    }
    setIsLoading(false);
  };

  const runAutoPublish = async (type: string) => {
    if (!githubToken) return alert('GitHub 토큰이 필요합니다.');
    setIsLoading(true);
    showStatus('🤖 원격 자동 발행 기동 중...');
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/auto-post.yml/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref: 'main', inputs: { post_type: type } })
      });
      if (res.status === 204) showStatus('✅ 자동 발행 기동 명령 전송 완료!');
      else throw new Error(`HTTP ${res.status}`);
    } catch (error: any) {
      showStatus(`기동 실패: ${error.message}`);
    }
    setIsLoading(false);
  };

  const publishToGithub = async () => {
    if (!githubToken) return alert('GitHub 토큰이 필요합니다.');
    const finalSlug = slug || `post-${Date.now()}`;
    
    setIsLoading(true);
    showStatus('🚀 GitHub에 발행하는 중...');
    try {
      const contentBase64 = window.btoa(unescape(encodeURIComponent(compiledMarkdown)));
      const filename = `${finalSlug}.md`;
      const path = `${POSTS_PATH}/${filename}`;
      
      const body: any = {
        message: selectedPostSha ? `docs: 포스팅 수정 (${filename})` : `docs: 새 포스팅 발행 (${filename})`,
        content: contentBase64,
        branch: 'main'
      };
      if (selectedPostSha) body.sha = selectedPostSha;

      const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(await res.text());

      showStatus('✅ 성공적으로 발행되었습니다!', 4000);
      setSelectedPostSha('');
    } catch (error: any) {
      showStatus(`발행 실패: ${error.message}`);
    }
    setIsLoading(false);
  };

  const callGeminiAPI = async (mode: 'manual' | 'semi-auto', aiInput: string) => {
    if (!geminiKey) return alert('Gemini API 키가 필요합니다.');
    setIsLoading(true);
    
    const existingPostsList = postList.length > 0
      ? postList.slice(0, 5).map(p => `- [${p.title}](/blog/${p.name.replace('.md', '')})`).join('\n')
      : "- (없음)";
    const strictRulesPrompt = `${STRICT_RULES}\n\n# 기존 글 슬러그 목록:\n${existingPostsList}`;
    const calcTag = '<calculator type="auto" />';
    const currentDate = new Date().toISOString().split('T')[0];
    const angle = getRandomAngle();

    const prompt = mode === 'manual' ? `
${getBlogRole()}
# Objective
제시된 유튜브 대본(원문)을 바탕으로 상세하고 방대한 분량의 초고품질 전문 칼럼을 작성하십시오.
${getBlogLengthRulesManual()}
# ⚖️ STRICT WRITING RULES
${strictRulesPrompt}
${getBlogFrontmatter('알맞은 제목 생성', currentDate)}
제시된 원문:
${aiInput}
${getBlogSkeleton(angle, calcTag, existingPostsList)}
` : `
${getBlogRole()}
# Objective
제시된 주제/참고내용을 바탕으로 깊이 있는 전문 칼럼을 새롭게 창작하십시오.
${getBlogLengthRulesSemiAuto()}
# ⚖️ STRICT WRITING RULES
${strictRulesPrompt}
${getBlogFrontmatter('매력적인 제목 생성', currentDate)}
제시된 참고자료:
${aiInput}
${getBlogSkeleton(angle, calcTag, existingPostsList)}
`;

    const models = ['gemini-pro-latest', 'gemini-flash-latest'];
    let success = false;
    let lastError = '';

    for (const model of models) {
      const maxTokens = 32768;
      const modelCapacityText = calculateModelCapacity(maxTokens);
      const finalizedPrompt = prompt.replace(/\{\{TARGET_MODEL_CAPACITY\}\}/g, modelCapacityText);

      try {
        showStatus(`✨ AI 작동 중... (${model})`);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: finalizedPrompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: maxTokens }
          })
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        
        let text = data.candidates[0].content.parts[0].text;
        text = cleanAnalysisBlock(text);
        
        // Parse the generated frontmatter and insert it into the GUI!
        const { content: rawContent, data: meta } = parseYamlFrontmatter(text);
        
        const slugMatch = text.match(/slug:\s*"?([^"\n]+)"?/);
        setSlug(slugMatch ? slugMatch[1].trim() : `post-${Date.now()}`);
        
        setTitle(meta.title || '');
        setSummary(meta.summary || '');
        if (meta.category) setCategory(meta.category);
        if (meta.date) setDate(meta.date);
        setTagsInput(Array.isArray(meta.tags) ? meta.tags.join(', ') : '');
        setContent(rawContent);

        showStatus('🎉 AI 작성이 완료되었습니다!', 4000);
        success = true;
        break;
      } catch (error: any) {
        lastError = error.message;
      }
    }
    
    if (!success) showStatus(`API 오류: ${lastError}`);
    setIsLoading(false);
  };

  const createBlankPost = () => {
    setSelectedPostSha('');
    setSlug(`post-${Date.now()}`);
    setTitle('');
    setSummary('');
    setTagsInput('');
    setContent('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
        <form onSubmit={handleLogin} className="bg-white dark:bg-zinc-800 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 w-[400px]">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center"><svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div>
          </div>
          <h1 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">관리자 접속</h1>
          <p className="text-sm text-center text-gray-500 dark:text-zinc-400 mb-8">암호를 입력하세요</p>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-md border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 mb-6" placeholder="비밀번호 입력" autoFocus />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-md transition-colors">잠금 해제</button>
        </form>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] admin-page-container bg-white dark:bg-zinc-950 font-sans flex flex-col overflow-hidden">
      
      {/* 1. Header Bar */}
      <header className="h-14 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between px-4 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-[15px] font-black text-gray-900 dark:text-white tracking-tight">대시보드</h1>
            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">v4.0 Unified</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-zinc-950 px-2 py-1.5 rounded border border-gray-200 dark:border-zinc-800">
            <span className="text-[10px] font-bold text-gray-400">Gemini:</span>
            <input type="password" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} className="px-1.5 py-0.5 rounded bg-white dark:bg-[#1e1e20] border border-gray-200 dark:border-white/10 w-24 text-[10px] outline-none" placeholder="AIzaSy..." />
            <div className="h-3 w-[1px] bg-gray-200 dark:bg-white/10 mx-1" />
            <span className="text-[10px] font-bold text-gray-400">GitHub:</span>
            <input type="password" value={githubToken} onChange={e => setGithubToken(e.target.value)} className="px-1.5 py-0.5 rounded bg-white dark:bg-[#1e1e20] border border-gray-200 dark:border-white/10 w-24 text-[10px] outline-none" placeholder="ghp_..." />
            <button onClick={saveKeys} className="ml-1 px-2 py-0.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded text-[10px] font-bold shadow-sm">저장</button>
          </div>
          
          <button onClick={() => setShowPreview(!showPreview)} className="px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-200 rounded text-xs font-bold transition-colors">
            {showPreview ? '미리보기 닫기' : '미리보기 열기'}
          </button>
          
          <button onClick={createBlankPost} className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded text-xs font-bold transition-colors shadow-sm flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            새 문서
          </button>

          <button onClick={publishToGithub} disabled={isLoading} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            GitHub 바로 발행
          </button>
        </div>
      </header>

      {/* 2. Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        <AdminSidebar 
          githubToken={githubToken}
          isLoading={isLoading}
          postList={postList}
          onLoadPost={loadPost}
          onDeletePost={deletePost}
          onRefreshList={fetchPostList}
          onRunAi={callGeminiAPI}
          onRunAuto={runAutoPublish}
        />
        
        <MarkdownEditor 
          title={title} setTitle={setTitle}
          summary={summary} setSummary={setSummary}
          category={category} setCategory={setCategory}
          tagsInput={tagsInput} setTagsInput={setTagsInput}
          content={content} setContent={setContent}
        />

        {showPreview && (
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-black/20 p-6 border-l border-gray-200 dark:border-zinc-800">
            {title || content ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <BlogPostContent content={content} />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <p className="text-sm font-semibold">마법이 일어날 공간입니다</p>
                <p className="text-[11px] mt-1 opacity-70">에디터에 내용을 작성하면 실시간으로 렌더링됩니다.</p>
              </div>
            )}
          </div>
        )}

        {/* Global Loading / Status Overlay */}
        <AnimatePresence>
          {statusMessage && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
            >
              <div className="bg-gray-900/90 dark:bg-white/90 backdrop-blur-sm border border-gray-700 dark:border-white/20 text-white dark:text-gray-900 px-5 py-2.5 rounded-full text-xs font-bold flex items-center shadow-lg">
                {isLoading && <svg className="animate-spin h-3.5 w-3.5 mr-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                {statusMessage}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
