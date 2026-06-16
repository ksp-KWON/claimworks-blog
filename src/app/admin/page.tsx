"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BlogPostContent from '@/components/BlogPostContent';

const REPO_OWNER = 'ksp-KWON';
const REPO_NAME = 'claimworks-blog';
const POSTS_PATH = 'src/content/posts';

interface GitHubFile {
  name: string;
  sha: string;
  download_url?: string;
  content?: string;
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  
  // Settings - Lazy initialization to avoid calling setState synchronously in useEffect
  const [geminiKey, setGeminiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('GEMINI_API_KEY') || '';
    }
    return '';
  });
  const [githubToken, setGithubToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('GITHUB_TOKEN') || '';
    }
    return '';
  });
  
  // App State
  const [mode, setMode] = useState<'manual' | 'semi-auto' | 'auto' | 'edit'>('manual');
  const [inputText, setInputText] = useState('');
  const [generatedMarkdown, setGeneratedMarkdown] = useState('');
  const [slug, setSlug] = useState('');
  
  // Edit State
  const [postList, setPostList] = useState<{name: string, sha: string, title: string}[]>([]);
  const [selectedPostSha, setSelectedPostSha] = useState('');
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  
  // 화면 레이아웃 보기 모드 (split: 반반, editor: 작성창만, preview: 미리보기만)
  const [layoutView, setLayoutView] = useState<'split' | 'editor' | 'preview'>('split');
  // 글 수정 탭에서 목록 창 접고 펼치기 상태
  const [showPostList, setShowPostList] = useState(true);

  // 마크다운 최상단의 YAML Frontmatter(설정 영역)를 지워주는 함수
  const cleanFrontmatter = (markdown: string) => {
    if (!markdown) return '';
    return markdown.replace(/^---[\s\S]*?---/, '').trim();
  };

  // Textarea DOM reference for inserting markdown formatting
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 텍스트 영역의 커서 위치에 마크다운 템플릿을 자동으로 삽입해주는 헬퍼 함수
  const insertMarkdown = (template: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setGeneratedMarkdown(prev => prev + '\n' + template);
      return;
    }
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    
    setGeneratedMarkdown(before + template + after);
    
    // 포커스를 돌려주고 커서 위치를 삽입 텍스트 바로 뒤로 이동
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + template.length;
    }, 0);
  };

  // 선택된(드래그) 텍스트를 특정 HTML 색상 태그 등으로 감싸주는 함수
  const wrapTextWithTag = (tagName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    const wrapped = `<${tagName}>${selectedText || '강조텍스트'}</${tagName}>`;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    
    setGeneratedMarkdown(before + wrapped + after);
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start;
      textarea.selectionEnd = start + wrapped.length;
    }, 0);
  };

  // GitHub REST API를 사용하여 원격 파일 삭제 요청 전송
  const deletePost = async (filename: string, sha: string) => {
    if (!githubToken) return alert('GitHub 토큰이 필요합니다.');
    const confirmed = window.confirm(`[⚠️ 영구 삭제 경고]\n정말로 "${filename}" 포스팅 파일을 원격 저장소에서 영구히 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`);
    if (!confirmed) return;
    
    setIsLoading(true);
    setStatusMessage(`🗑️ GitHub에서 "${filename}" 파일을 영구 삭제하고 있습니다...`);
    
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${POSTS_PATH}/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `docs: 관리자 페이지에서 포스팅 삭제 (${filename})`,
          sha: sha,
          branch: 'main'
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message);
      }
      
      setStatusMessage(`✅ "${filename}" 포스팅이 성공적으로 삭제되었습니다! (반영까지 2~3분 소요)`);
      setTimeout(() => setStatusMessage(''), 4000);
      
      // 글 목록 새로고침
      await fetchPostList();
    } catch (error) {
      const err = error as Error;
      setStatusMessage(`삭제 실패: ${err.message}`);
    }
    setIsLoading(false);
  };

  // Removed redundant useEffect to avoid synchronous setState calls

  const triggerAutoPost = async () => {
    if (!githubToken) return alert('GitHub 토큰이 필요합니다.');
    
    setIsLoading(true);
    setStatusMessage('🤖 GitHub에 데일리 자동 발행(Auto Post) 트리거를 요청하고 있습니다...');
    
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/workflows/auto-post.yml/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main'
        })
      });
      
      if (res.status === 204) {
        setStatusMessage('✅ 자동 발행 기동 명령이 성공적으로 전송되었습니다! 아래 [실시간 배포 로그 확인]을 눌러 빌드 상태를 모니터링하세요.');
      } else {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP 에러 상태 코드: ${res.status}`);
      }
    } catch (error) {
      const err = error as Error;
      setStatusMessage(`기동 실패: ${err.message}`);
    }
    setIsLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '9913006') {
      setIsLoggedIn(true);
    } else {
      alert('비밀번호가 일치하지 않습니다.');
    }
  };

  const saveKeys = () => {
    localStorage.setItem('GEMINI_API_KEY', geminiKey);
    localStorage.setItem('GITHUB_TOKEN', githubToken);
    setStatusMessage('🔑 인증 키가 브라우저에 안전하게 저장되었습니다.');
    setTimeout(() => setStatusMessage(''), 3000);
  };

  const fetchPostList = async () => {
    if (!githubToken) return alert('GitHub 토큰이 필요합니다.');
    setIsLoading(true);
    try {
      // 1. GitHub API에서 최신 파일 목록과 SHA 추출
      const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${POSTS_PATH}`, {
        headers: { 'Authorization': `Bearer ${githubToken}` }
      });
      if (!res.ok) throw new Error('목록을 불러오지 못했습니다. 토큰을 확인해주세요.');
      const githubFiles = await res.json() as GitHubFile[];
      const mdFiles = githubFiles.filter((f: GitHubFile) => f.name.endsWith('.md'));

      // 2. 빠르고 직관적인 제목 매핑을 위해 빌드된 posts-data.json 활용
      const titlesMap: Record<string, string> = {};
      try {
        const dataRes = await fetch('/data/posts-data.json');
        if (dataRes.ok) {
          const postsData = await dataRes.json() as { slug: string; title: string }[];
          postsData.forEach((post) => {
            titlesMap[`${post.slug}.md`] = post.title;
          });
        }
      } catch (e) {
        console.warn('제목 매핑 데이터를 불러오지 못했습니다.', e);
      }

      // 3. 데이터 결합 (제목이 없으면 파일명 표시)
      const combined = mdFiles.map((file: GitHubFile) => ({
        name: file.name,
        sha: file.sha,
        title: titlesMap[file.name] || file.name.replace('.md', '')
      }));

      setPostList(combined);
      setStatusMessage('📄 기존 글 목록을 성공적으로 불러왔습니다.');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (error) {
      const err = error as Error;
      setStatusMessage(`오류: ${err.message}`);
    }
    setIsLoading(false);
  };

  const loadPost = async (filename: string, sha: string) => {
    if (!githubToken) return;
    setIsLoading(true);
    setSelectedPostSha(sha);
    setSlug(filename.replace('.md', ''));
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${POSTS_PATH}/${filename}`, {
        headers: { 'Authorization': `Bearer ${githubToken}` }
      });
      const data = await res.json() as { content: string };
      const content = decodeURIComponent(escape(window.atob(data.content)));
      setGeneratedMarkdown(content);
      setIsPreview(true);
      setShowPostList(false); // 기존 글 목록은 자동으로 접어서 작성창 크기를 극대화합니다.
      setStatusMessage(`📝 편집 모드: 수정을 완료한 뒤 우측 발행 버튼을 누르세요.`);
    } catch (error) {
      const err = error as Error;
      setStatusMessage(`오류: ${err.message}`);
    }
    setIsLoading(false);
  };

  const callGeminiAPI = async (prompt: string) => {
    if (!geminiKey) return alert('Gemini API 키가 필요합니다.');
    setIsLoading(true);
    setStatusMessage('✨ AI가 글을 작성하고 있습니다... (10~20초 소요)');
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7 }
        })
      });
      const data = await response.json() as { error?: { message: string }; candidates: { content: { parts: { text: string }[] } }[] };
      if (data.error) throw new Error(data.error.message);
      
      const text = data.candidates[0].content.parts[0].text;
      
      const slugMatch = text.match(/slug:\s*"?([^"\n]+)"?/);
      if (slugMatch) {
        setSlug(slugMatch[1].trim());
      } else {
        setSlug(`post-${Date.now()}`);
      }
      
      setGeneratedMarkdown(text);
      setIsPreview(true);
      setStatusMessage('🎉 작성이 완료되었습니다! 미리보기를 확인하고 발행하세요.');
    } catch (error) {
      const err = error as Error;
      setStatusMessage(`API 오류: ${err.message}`);
    }
    setIsLoading(false);
  };

  const handleGenerate = () => {
    if (!inputText.trim()) return alert('내용을 입력해주세요.');
    
    // 기존 포스트 리스트를 자연스러운 링크 예시로 제공하기 위한 텍스트 추출
    const existingPostsList = postList.length > 0
      ? postList.slice(0, 5).map(p => `- [${p.title}](/blog/${p.name.replace('.md', '')})`).join('\n')
      : "- (없음)";

    const strictRulesPrompt = `
# 엄격 글쓰기 헌법 (Strict Rules)
1. **H1 사용 금지 :** frontmatter 외부 본문에는 절대 H1('# 제목')을 작성하지 말고, 본문 시작은 오직 일반 텍스트 문장으로 바로 시작하세요.
2. **도입부 오프닝 :** 독자의 억울함에 깊이 공감하는 자연스럽고 따뜻한 톤의 2~3문장으로 서두를 시작하고, "이번 포스팅에서는 [주제]에 대해 보험회사 및 법무법인 출신의 분야별 보상 전문가들이 모인 보상스쿨 전문가 그룹의 실무 관점에서 핵심 분쟁 쟁점과 피해자가 꼭 챙겨야 할 정당한 권리를 안내해 드리겠습니다."로 서론을 매끄럽게 마무리하세요.
3. **💡 Key Points (H2) :** 오프닝 문단 바로 아래에 '## 💡 Key Points' 섹션을 만들고 핵심 요점 3가지를 불릿(-)으로 명시하세요.
4. **소제목 박스 스타일 (H2 필수) :** 본문 각 섹션의 대제목은 무조건 H2('##')로 작성하세요. 제목에 대괄호 [ ]를 씌우지 마세요. 본문 섹션 제목은 일반 H2로 작성해야 자동으로 가로폭이 꽉 찬 아름다운 박스형 스타일로 렌더링됩니다. H3는 좁은 타원형 링크 소제목이므로 대제목으로 남발하지 마세요.
5. **콜론 사용 최소화 및 띄어쓰기 규칙 :** 
   - 제목이나 소제목, 본문 텍스트에 콜론(:)을 의식적으로 남발하지 마세요. 특히 "조기 합의 유혹에 넘어가지 마시고 끝까지 치료받으세요"와 같은 자연스러운 연결식 서술형 문장에는 콜론을 절대 사용하지 마세요.
   - 콜론은 오직 '주제 : 핵심 내용' 또는 '항목 : 상세 설명'처럼 명확한 분류나 구분이 필요할 때만 최소한으로 사용해야 합니다.
   - 콜론을 사용할 때는 가독성을 위해 반드시 앞뒤로 한 칸씩 띄어 써야 합니다. (예 : '과실 비율 : 무조건 수용 금지', '구분 : 내용')
6. **강조 색상 다변화 :** 아래의 HTML 컬러 강조 태그를 본문에 다채롭고 적절하게 섞어서 쓰세요:
   - 경고/위험/금지 : <red>절대 합의하지 마세요</red>
   - 주의/참고 : <orange>향후치료비가 핵심입니다</orange>
   - 긍정/해결/안전 : <green>휴업손해 전액 인정 가능합니다</green>
   - 핵심 강조 : <blue>보상스쿨에 문의하세요</blue>
   - 심화 내용 : <purple>후유장해 진단서 발급</purple>
7. **보상금 계산기 위젯 필수 삽입 :** 주제가 맥브라이드 장해평가, 교통사고, 배상책임 등과 관련된 경우 본문 중간 적절한 곳에 '<calculator type="auto" />' 태그를, 실손의료비(실비보험)나 병원비와 관련된 주제라면 '<calculator type="medical" />' 태그를 무조건 본문에 단 한 번 삽입하세요. (다른 HTML/JSX 태그는 일절 금지)
8. **자가진단 리스트 :** 본문 하단 H2 제목으로 '## 🛡️ 내 보험금/보상금 1분 자가진단 체크리스트' 섹션을 만들고 아래에 '- [ ] ☑️ ...' 형태로 질문 3~5개를 체크박스로 구성해 작성하세요.
9. **보상 용어 해설 제공 :** 본문 텍스트 내에는 '맥브라이드', 'AMA', '기왕증', '동요도', '휴업손해', '도시일용노임' 등 고도의 손해사정 용어들을 괄호 설명 없이 자연스럽게 사용하되, 이를 친절하게 해설하기 위해 아래 두 가지 방식 중 하나를(혹은 둘 다) 상황에 맞게 유연하게 활용하세요:
   1) [하단 용어 사전]: 자가진단 체크리스트 아래(FAQ 바로 위)에 반드시 '## 💡 핵심 보상 용어 사전' 섹션을 만들어 본문에 언급된 전문 용어 2~3개의 뜻을 불릿(-)으로 명료하고 친절하게 정리하여 요약 박스 형태로 제공하세요.
   2) [중간 한 줄 브리핑]: 중요한 핵심 용어가 본문 중간에 처음 등장할 때, 본문 문단 사이에 단독 줄로 인용구 블록(blockquote, '>')을 활용하여 '💡 여기서 잠깐! [용어]란 무슨 뜻일까요?' 형태의 한 줄 팁 박스로 눈에 띄게 해설하세요.
10. **자주 묻는 질문 FAQ :** 용어 사전 바로 아래에 H2 제목으로 '## 💡 자주 묻는 질문 (FAQ) TOP 3' 섹션을 만들고 아래에 '### Q1. 질문내용' (H3) 형식으로 3가지 질문 및 대답을 구성하세요.
11. **상담 유도 CTA 배너 :** FAQ 직후 H2 제목으로 '## 📞 교통사고 보상, 전문가의 도움으로 권리를 찾으세요' 형태로 상담 권유 섹션을 만들고 그 아래에 카카오톡 무료 상담 링크 '[👉 카카오톡 1:1 무료 상담하기 (클릭)](https://open.kakao.com/o/sWeszp7)' 단추를 만드세요.
12. **SEO 요약문 분리 :** 글의 가장 마지막 줄에 '[SEO_SUMMARY]: 요약글' 형태로 150자 이내의 검색 노출용 요약문을 반드시 작성해 주세요.
13. **자동 내부 링크 :** 아래의 기존 글 목록 중 연관된 글을 찾아 본문에 자연스럽게 '[글제목](/blog/슬러그)' 링크로 1~2개 엮어 넣으세요.
14. **부연 설명 및 사족 금지 (절대 필수 규칙):** 답변 시 마크다운(YAML frontmatter를 포함한 본문) 내용 이외에 "알겠습니다", "글을 작성했습니다" 등의 인사말, 부연 설명, 메타 코멘트는 단 한 글자도 출력하지 마세요. 오직 발행 가능한 마크다운 파일 내용 자체만 그대로 리턴해 주어야 합니다.
15. **구글 E-E-A-T(경험, 전문성, 권위성, 신뢰성) 극대화 지침:**
    - **경험(Experience)**: 보험회사 보상과 및 법무법인 출신 손해사정사들이 수천 건의 다양한 보험 분쟁을 해결하며 얻은 실전 노하우와 실제 사례 에피소드를 1~2개 문장으로 본문에 자연스럽게 녹여내세요. 단, "> ✍️ 이 글은 보상스쿨 손해사정사가 실제 보상 분쟁 처리 경험을 바탕으로 작성한 전문 콘텐츠입니다." 라는 인용구(blockquote) 문구는 서론이 아닌 글의 맨 마지막(SEO 요약문 바로 위)에 위치하도록 작성하세요.
    - **전문성 및 권위성(Expertise & Authoritative)**: 대법원 판례나 금융감독원 약관 개정 사항 등의 공인 규정을 근거로 설명하고, 실무적으로 즉시 활용 가능한 명확한 대처 가이드를 제시하세요.
    - **신뢰성(Trustworthiness)**: 개인 광고글이 아닌, 보상스쿨 전문가 그룹의 객관적이고 논리정연한 공동 상담 톤을 끝까지 유지하며, AI가 작성한 글에서 흔히 나타나는 기계적인 맺음말('~에 대해 함께 알아보았습니다', '~를 명심하시기 바랍니다')은 글의 신뢰도를 저하시키므로 절대 사용하지 마세요.
${existingPostsList}
`;

    let prompt = "";
    if (mode === 'manual') {
      prompt = `
다음은 유튜브 영상 대본입니다. 이 내용을 절대 변형하거나 왜곡하지 말고, 보험회사 및 법무법인 출신의 베테랑 전문가들로 구성된 '보상스쿨 전문가 그룹'의 실무적이고 공신력 있는 톤앤매너로 다듬어 주세요.
${strictRulesPrompt}

반드시 다음 형식의 YAML Frontmatter를 최상단에 포함해야 합니다:
---
title: "알맞은 제목 생성 (어색한 콜론 사용 금지, 단어 구분이 필요할 때만 콜론 앞뒤 한 칸 공백 적용)"
date: "${new Date().toISOString().split('T')[0]}"
summary: "1~2줄 핵심 요약"
category: "보상가이드"
specialtyCategory: "정형외과"
tags:
  - "태그1"
  - "태그2"
slug: "구글 SEO에 적합한 영문 URL 슬러그 생성. 규칙: [카테고리영문명]-[핵심키워드영어단어2~3개] (예: 교통사고 카테고리이고 합의금 가이드면 'traffic-settlement-guide', 보상가이드 카테고리이고 십자인대 보상이면 'guide-cruciate-ligament-compensation')"
published: true
---

대본 내용:
${inputText}
`;
    } else if (mode === 'semi-auto') {
      prompt = `
다음은 블로그 포스팅 작성을 위한 참고 자료(키워드, 개요, 또는 벤치마킹할 블로그/유튜브 링크)입니다.
만약 링크가 포함되어 있다면, 해당 링크의 콘텐츠나 영상을 분석하여 핵심 주제와 인사이트를 파악하되 원문을 복사하지 마세요. 
보험회사 및 법무법인 출신의 베테랑 전문가들이 모인 '보상스쿨 전문가 그룹'의 실무 관점에서 완전히 새로운 구도와 독창적인 내용으로 벤치마킹하여 깊이 있는 블로그 포스팅을 창작해 주세요.
${strictRulesPrompt}

반드시 다음 형식의 YAML Frontmatter를 최상단에 포함해야 합니다:
---
title: "매력적인 제목 생성 (어색한 콜론 사용 금지, 단어 구분이 필요할 때만 콜론 앞뒤 한 칸 공백 적용)"
date: "${new Date().toISOString().split('T')[0]}"
summary: "1~2줄 핵심 요약"
category: "보상가이드"
specialtyCategory: "정형외과"
tags:
  - "태그1"
  - "태그2"
slug: "구글 SEO에 적합한 영문 URL 슬러그 생성. 규칙: [카테고리영문명]-[핵심키워드영어단어2~3개] (예: 교통사고 카테고리이고 합의금 가이드면 'traffic-settlement-guide', 보상가이드 카테고리이고 십자인대 보상이면 'guide-cruciate-ligament-compensation')"
published: true
---

주제/키워드/참고링크:
${inputText}
`;
    }







    
    callGeminiAPI(prompt);
  };

  const publishToGithub = async () => {
    if (!githubToken) return alert('GitHub 토큰이 필요합니다.');
    if (!slug) return alert('슬러그(파일명)가 없습니다.');
    if (!generatedMarkdown) return alert('발행할 글이 없습니다.');

    setIsLoading(true);
    setStatusMessage('🚀 GitHub에 안전하게 커밋하고 있습니다...');
    
    try {
      const contentBase64 = window.btoa(unescape(encodeURIComponent(generatedMarkdown)));
      const filename = `${slug}.md`;
      const path = `${POSTS_PATH}/${filename}`;
      
      const body: {
        message: string;
        content: string;
        branch: string;
        sha?: string;
      } = {
        message: `docs: 관리자 페이지에서 자동 작성된 포스팅 발행 (${filename})`,
        content: contentBase64,
        branch: 'main'
      };
      
      if (mode === 'edit' && selectedPostSha) {
        body.sha = selectedPostSha;
        body.message = `docs: 관리자 페이지에서 포스팅 수정 (${filename})`;
      }

      const res = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorData = await res.json() as { message: string };
        throw new Error(errorData.message);
      }

      setStatusMessage('✅ 성공적으로 발행되었습니다! 2~3분 뒤 블로그에 반영됩니다.');
      setIsPreview(false);
      setGeneratedMarkdown('');
      setInputText('');
      setSelectedPostSha('');
    } catch (error) {
      const err = error as Error;
      setStatusMessage(`발행 실패: ${err.message}`);
    }
    setIsLoading(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-[#f8f9fa] to-[#e8eaed] dark:from-[#202124] dark:to-[#171717]">
        {/* Straight aligned background blobs */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }} 
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-0 w-full h-[400px] bg-blue-400/20 dark:bg-blue-600/10 blur-3xl"
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }} 
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-0 w-full h-[400px] bg-purple-400/20 dark:bg-purple-600/10 blur-3xl"
        />

        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          onSubmit={handleLogin} 
          className="relative z-10 bg-white/60 dark:bg-[#303134]/60 backdrop-blur-xl p-10 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.05)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/50 dark:border-white/10 w-[400px]"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-2 tracking-tight">보안 관리자 접속</h1>
          <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-8">안전한 글쓰기 환경을 위해 암호를 입력하세요</p>
          
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-5 py-4 rounded-xl border border-white/40 dark:border-white/10 bg-white/50 dark:bg-black/20 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white dark:focus:bg-black/40 transition-all mb-6"
            placeholder="비밀번호 입력"
            autoFocus
          />
          <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98]">
            잠금 해제
          </button>
        </motion.form>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] admin-page-container relative bg-[#f8f9fa] dark:bg-[#1e1e20] p-3 sm:p-4 font-sans overflow-hidden flex flex-col">
      {/* Dynamic Background - Aligned straight to avoid diagonal tilt perception */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden flex flex-col">
        <div className="w-full h-[50vh] bg-blue-100/40 dark:bg-blue-900/10 blur-[100px]" />
        <div className="w-full h-[50vh] bg-purple-100/40 dark:bg-purple-900/10 blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[1500px] w-full mx-auto flex flex-col flex-1 min-h-0 relative z-10 space-y-3"
      >
        
        {/* Header Bar - Slim & Professional */}
        <div className="bg-white/70 dark:bg-[#2a2a2c]/80 backdrop-blur-2xl px-5 py-3 rounded-2xl shadow-sm border border-white/50 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">AI 블로그 관리 센터</h1>
                <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded">v2.1</span>
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">안전한 서버리스 보안 아키텍처</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-white/50 dark:bg-black/20 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-white/5 w-full md:w-auto overflow-x-auto">
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold text-gray-400">Gemini:</span>
              <input 
                type="password" 
                value={geminiKey} 
                onChange={e => setGeminiKey(e.target.value)} 
                className="px-2 py-1 rounded bg-white dark:bg-[#1e1e20] border border-gray-255 dark:border-white/10 w-24 sm:w-32 text-[11px] focus:ring-1 focus:ring-blue-500 outline-none transition-all text-gray-700 dark:text-gray-200"
                placeholder="AIzaSy..."
              />
            </div>
            <div className="h-4 w-[1px] bg-gray-200 dark:bg-white/10 shrink-0 mx-1" />
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold text-gray-400">GitHub:</span>
              <input 
                type="password" 
                value={githubToken} 
                onChange={e => setGithubToken(e.target.value)} 
                className="px-2 py-1 rounded bg-white dark:bg-[#1e1e20] border border-gray-255 dark:border-white/10 w-24 sm:w-32 text-[11px] focus:ring-1 focus:ring-blue-500 outline-none transition-all text-gray-700 dark:text-gray-200"
                placeholder="ghp_..."
              />
            </div>
            <button onClick={saveKeys} className="ml-1 px-3 py-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-lg transition-all text-xs font-bold shadow active:scale-95">
              키 저장
            </button>
          </div>
        </div>

        {/* Status Banner - Compact */}
        <AnimatePresence>
          {statusMessage && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden flex-shrink-0"
            >
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-150 dark:border-blue-800/30 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-xl text-xs font-medium flex items-center justify-between shadow-sm">
                <span className="flex items-center gap-2">
                  {isLoading ? (
                     <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  )}
                  {statusMessage}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Layout Mode Control - Slim */}
        <div className="flex justify-between items-center bg-white/40 dark:bg-black/10 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/5 flex-shrink-0 z-10">
          <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            작업 공간
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mr-1 hidden sm:inline">📺 화면 구성:</span>
            {[
              { id: 'split', label: '🌓 좌우 분할', desc: '작성창과 미리보기를 함께 봅니다 (기본)' },
              { id: 'editor', label: '📝 작성창 크게', desc: '마크다운 에디터만 넓게 봅니다' },
              { id: 'preview', label: '👁️ 미리보기 크게', desc: '발행될 디자인을 실제 크기로 봅니다' }
            ].map(view => (
              <button
                key={view.id}
                onClick={() => setLayoutView(view.id as 'split' | 'editor' | 'preview')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                  layoutView === view.id
                    ? 'bg-blue-600 border-blue-650 text-white shadow-sm'
                    : 'bg-white dark:bg-[#2a2a2c] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-150 dark:hover:bg-[#323235]'
                }`}
                title={view.desc}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Workspace - Adaptive Grid */}
        <div className={`grid gap-4 flex-1 min-h-0 ${
          layoutView === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
        }`}>
          {/* Left Column: Input Panel */}
          <div className={`bg-white/70 dark:bg-[#2a2a2c]/80 backdrop-blur-xl p-5 rounded-2xl shadow-sm border border-white/50 dark:border-white/5 flex flex-col h-full min-h-0 ${
            layoutView === 'preview' ? 'hidden' : ''
          }`}>
            
            {/* Mode Tab Switcher */}
            <div className="flex bg-gray-100/50 dark:bg-black/20 p-1 rounded-xl mb-4 flex-shrink-0">
              {[
                { id: 'manual', label: '수동 (대본 포장)' },
                { id: 'semi-auto', label: '반자동 (링크/개요)' },
                { id: 'auto', label: '자동 (데일리 발행)' },
                { id: 'edit', label: '기존 글 수정' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMode(m.id as 'manual' | 'semi-auto' | 'auto' | 'edit');
                    if (m.id === 'edit') {
                      fetchPostList();
                      setShowPostList(true); // 수정 탭으로 갈 때는 목록을 펼칩니다
                    }
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${mode === m.id ? 'bg-white dark:bg-[#3f3f42] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {mode === 'edit' && showPostList && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className={`mb-3 flex-shrink-0 flex flex-col min-h-0 transition-all duration-300 ${
                  isPreview ? 'max-h-40' : 'flex-1 max-h-none'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">발행된 포스팅 목록 ({postList.length}개)</span>
                  <div className="flex items-center gap-2">
                    <button onClick={fetchPostList} className="text-[10px] font-bold text-blue-600 hover:text-blue-500 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89l-2.775 2.775M21 21v-5h-5.583"></path></svg>
                      새로고침
                    </button>
                    {isPreview && (
                      <button 
                        onClick={() => setShowPostList(false)} 
                        className="text-[10px] font-extrabold text-gray-500 hover:text-gray-750 dark:hover:text-gray-300"
                        title="목록 접기"
                      >
                        [접기 📁]
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-white/10 rounded-xl bg-white/40 dark:bg-black/25 p-2 space-y-1.5 custom-scrollbar min-h-[140px]">
                  {postList.length === 0 ? (
                    <div className="text-center py-8 text-xs text-gray-400">등록된 글이 없거나 GITHUB 토큰이 필요합니다.</div>
                  ) : (
                    postList.map(post => (
                      <div key={post.name} className="flex justify-between items-center p-2 rounded-lg bg-white/80 dark:bg-[#202124]/70 border border-gray-100 dark:border-white/5 shadow-xs transition-all hover:bg-white dark:hover:bg-[#202124]">
                        <div className="flex-1 min-w-0 pr-3 text-left">
                          <div className="text-xs font-bold text-gray-900 dark:text-white truncate">{post.title}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5 truncate">{post.name}</div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => loadPost(post.name, post.sha)}
                            className="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:hover:bg-blue-950/60 dark:text-blue-400 rounded-lg text-[11px] font-bold transition-all"
                          >
                            ✏️ 불러오기
                          </button>
                          <button
                            onClick={() => deletePost(post.name, post.sha)}
                            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 hover:text-red-600 rounded-lg transition-all"
                            title="글 삭제"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {(mode === 'manual' || mode === 'semi-auto') && !isPreview && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col min-h-0">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 w-full p-4 rounded-xl border border-gray-250 dark:border-white/10 bg-white/50 dark:bg-black/20 text-gray-950 dark:text-white placeholder-gray-400 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none transition-all leading-relaxed custom-scrollbar"
                  placeholder={mode === 'manual' 
                    ? "✨ 이곳에 유튜브 대본 등 원문을 붙여넣으세요.\nAI가 원문을 보존하면서 가독성을 극대화한 UI(소제목, 표, Q&A)를 덧씌워 포장합니다." 
                    : "💡 이곳에 타겟 키워드, 뼈대(개요), 또는 참고할 블로그/유튜브 링크를 적어주세요.\nAI가 인사이트를 추출하여 완전히 새로운 전문적인 포스팅을 창작합니다."}
                />
                <button 
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="mt-3 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  AI 자율 작성 가동
                </button>
              </motion.div>
            )}

            {mode === 'auto' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col justify-center items-center p-6 text-center space-y-6">
                <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <svg className="w-10 h-10 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="max-w-md">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">원격 데일리 자동 발행</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    구글 트렌드 및 최신 이슈를 기반으로 <b>AI가 스스로 글을 분석하고 자동 발행</b>하는 파이프라인(GitHub Actions)을 즉시 기동시킵니다.<br />
                    실행 후 배포가 완료되기까지 약 2~3분이 소요됩니다.
                  </p>
                </div>
                <div className="w-full max-w-sm space-y-3 pt-4">
                  <button 
                    onClick={triggerAutoPost}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 text-sm"
                  >
                    🚀 즉시 자동 발행 기동 (Run Workflow)
                  </button>
                  
                  <a 
                    href={`https://github.com/${REPO_OWNER}/${REPO_NAME}/actions`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-white dark:bg-[#303134] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-[#3f3f42] font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-xs"
                  >
                    📊 실시간 배포 로그 확인하기 (GitHub Actions)
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </motion.div>
            )}

            {isPreview && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col min-h-0 relative">
                  {/* 기존 글 목록이 접혀있을 때 펼치기 바 */}
                  {mode === 'edit' && !showPostList && (
                    <div className="mb-2 flex items-center justify-between bg-blue-50/50 dark:bg-blue-900/10 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/20 flex-shrink-0">
                      <span className="text-[10px] font-medium text-blue-800 dark:text-blue-300">
                        📁 수정 중: {slug}.md
                      </span>
                      <button
                        onClick={() => setShowPostList(true)}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-500 hover:underline"
                      >
                        기존 글 목록 열기 📂
                      </button>
                    </div>
                  )}
                  {/* 마크다운 빌더 툴바 영역 */}
                  <div className="flex flex-col gap-2 p-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl mb-2 flex-shrink-0">
                    {/* 1층: 블로그 구성요소 생성 버튼들 */}
                    <div className="flex gap-1 overflow-x-auto pb-1 custom-scrollbar shrink-0">
                      <span className="text-[10px] font-bold text-gray-400 flex items-center shrink-0 pr-1.5 border-r border-gray-200 dark:border-white/10 mr-1.5">🧱 요소 빌더:</span>
                      {[
                        { label: '💡 요점', template: '\n## [💡 Key Points]\n- 여기에 핵심 요점을 입력하세요.\n- 여기에 핵심 요점을 입력하세요.\n- 여기에 핵심 요점을 입력하세요.\n' },
                        { label: '📋 자가진단', template: '\n## [🛡️ 내 보험금/보상금 1분 자가진단 체크리스트]\n- [ ] ☑️ 자가진단 요건 1\n- [ ] ☑️ 자가진단 요건 2\n- [ ] ☑️ 자가진단 요건 3\n' },
                        { label: '📊 표 그리기', template: '\n| 구분 | 상세 내용 | 보상 기준 |\n| :--- | :--- | :--- |\n| 항목1 | 내용1 | 기준1 |\n| 항목2 | 내용2 | 기준2 |\n' },
                        { label: '❓ FAQ TOP3', template: '\n## [💡 자주 묻는 질문 (FAQ) TOP 3]\n### Q1. 질문 제목을 적으세요.\n답변 내용을 여기에 입력하세요.\n\n### Q2. 질문 제목을 적으세요.\n답변 내용을 여기에 입력하세요.\n\n### Q3. 질문 제목을 적으세요.\n답변 내용을 여기에 입력하세요.\n' },
                        { label: '🚗 자동차계산기', template: '\n<calculator type="auto"></calculator>\n' },
                        { label: '🏥 실손계산기', template: '\n<calculator type="medical"></calculator>\n' },
                        { label: '📞 상담 CTA', template: '\n## [📞 보상 문제, 전문가의 도움으로 권리를 찾으세요]\n[👉 카카오톡 1:1 무료 상담하기 (클릭)](https://open.kakao.com/o/sWeszp7)\n' }
                      ].map(item => (
                        <button
                          key={item.label}
                          onClick={() => insertMarkdown(item.template)}
                          type="button"
                          className="px-2 py-1 bg-white hover:bg-gray-100 dark:bg-[#303134] dark:hover:bg-[#3f3f42] border border-gray-200 dark:border-white/5 rounded-lg text-[10px] font-bold text-gray-700 dark:text-gray-200 transition-colors shrink-0 active:scale-95 shadow-xs"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                    
                    {/* 2층: 텍스트 강조 컬러 태그 버튼들 */}
                    <div className="flex gap-1 items-center shrink-0">
                      <span className="text-[10px] font-bold text-gray-400 flex items-center shrink-0 pr-1.5 border-r border-gray-200 dark:border-white/10 mr-1.5">🎨 강조 색상:</span>
                      {[
                        { label: '🔴 빨강', tag: 'red' },
                        { label: '🟠 주황', tag: 'orange' },
                        { label: '🟢 초록', tag: 'green' },
                        { label: '🔵 파랑', tag: 'blue' },
                        { label: '🟣 보라', tag: 'purple' }
                      ].map(color => (
                        <button
                          key={color.tag}
                          onClick={() => wrapTextWithTag(color.tag)}
                          type="button"
                          className="px-2 py-0.5 bg-white hover:bg-gray-100 dark:bg-[#303134] dark:hover:bg-[#3f3f42] border border-gray-255 dark:border-white/5 rounded-md text-[10px] font-bold text-gray-750 dark:text-gray-200 transition-colors active:scale-95"
                        >
                          {color.label}
                        </button>
                      ))}
                      <span className="text-[9px] text-gray-400 font-medium ml-2 shrink-0">(글자 드래그 후 적용)</span>
                    </div>
                  </div>

                  <div className="absolute top-[80px] right-3 px-2 py-0.5 bg-yellow-100/80 text-yellow-800 text-[9px] font-bold rounded z-20 pointer-events-none">마크다운 편집기</div>
                  <textarea
                    ref={textareaRef}
                    value={generatedMarkdown}
                    onChange={(e) => setGeneratedMarkdown(e.target.value)}
                    className="flex-1 w-full p-4 font-mono text-xs leading-relaxed rounded-xl border border-gray-250 dark:border-white/10 bg-gray-50/50 dark:bg-[#1e1e20]/80 text-gray-800 dark:text-gray-300 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all custom-scrollbar"
                  />
               </motion.div>
            )}
          </div>

          {/* Right Column: Preview Panel */}
          <div className={`bg-white/70 dark:bg-[#2a2a2c]/80 backdrop-blur-xl p-5 rounded-2xl shadow-sm border border-white/50 dark:border-white/5 flex flex-col h-full min-h-0 relative overflow-hidden ${
            layoutView === 'editor' ? 'hidden' : ''
          }`}>
            <div className="flex items-center justify-between mb-3 z-10 flex-shrink-0">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                </span>
                실시간 미리보기
              </h2>
              <AnimatePresence>
                {isPreview && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={publishToGithub}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 shadow active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    GitHub 즉시 발행
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar z-10 bg-white/40 dark:bg-black/10 rounded-xl p-4 sm:p-5 border border-white/40 dark:border-white/5 min-h-0">
              {generatedMarkdown ? (
                <div className="prose prose-xs sm:prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                  <BlogPostContent content={cleanFrontmatter(generatedMarkdown)} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                  <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                    <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  </motion.div>
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">마법이 일어날 공간입니다</p>
                  <p className="text-[11px] mt-1 opacity-70">좌측에서 내용을 입력하고 AI 작성을 시작해 보세요.</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer Info - Slim */}
        <div className="flex justify-between items-center px-2 opacity-50 flex-shrink-0">
           <span className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
             <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
             종단간 브라우저 샌드박스 암호화
           </span>
           <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
             v2.1 (Glassmorphism UI)
           </span>
        </div>
      </motion.div>
    </div>
  );
}
