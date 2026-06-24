'use client';

/**
 * BlogPostContent.tsx
 * 블로그 포스팅 본문 렌더링 클라이언트 컴포넌트
 * - Key Points 박스 (최상단, Google Blue 톤)
 * - 클린 TOC (DOM에서 직접 읽어 ID 100% 일치 보장)
 * - 본문에서 중복 섹션(목차/요약/체크리스트/FAQ/CTA) 자동 제거
 * - 자가진단 인터랙티브 체크리스트
 * - FAQ 아코디언
 * - CTA 배너 (헤더 배너 스타일 + 그림자)
 * - 저자 바이오 카드 (E-E-A-T 신호)
 *
 * [FIX v6.1] extractFAQ — Q1Q1 이중표기 버그 수정
 *   AI가 ### **Q1** : 질문 처럼 볼드(**)·이탤릭(*)·이모지를
 *   Q번호 앞뒤에 섞어 출력할 때 기존 정규식이 제거에 실패해
 *   화면에 "Q1Q1 : 질문" 형태로 이중 표기되던 문제를 해결.
 *   수정 위치: extractFAQ 함수 내 currentQ 정규식 1줄.
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import { useEffect, useState } from 'react';
import type { Components } from 'react-markdown';
import AutoCalculatorContainer from './calculator/auto/AutoCalculatorContainer';
import MedicalCalculator from './calculator/MedicalCalculator';

// 분리된 서브 컴포넌트 임포트
import KeyPointsBox from './blog/KeyPointsBox';
import FAQBox from './blog/FAQBox';
import GlossaryBox from './blog/GlossaryBox';
import CTABanner from './blog/CTABanner';
import ChecklistBox from './blog/ChecklistBox';
import AuthorBioCard from './blog/AuthorBioCard';
import TableOfContents from './blog/TableOfContents';

// ─── 스크롤 오프셋: header(64) + sticky banner(52) + 버퍼(20) = 136px ───
const SCROLL_OFFSET = 140;

// ─── 본문에서 식별할 섹션 패턴 ───
const KEY_POINT_PATTERNS = /(?:핵심\s*요약|key\s*point)/i;
const CHECKLIST_PATTERNS = /(?:자가진단|체크리스트|1분\s*체크|체크)/i;
const GLOSSARY_PATTERNS = /(?:용어\s*사전|보상\s*용어)/i;
const FAQ_PATTERNS = /(?:faq|자주\s*묻는)/i;
const CTA_PATTERNS = /(?:카카오톡|call\s*to\s*action|상담\s*신청)/i;

// ─── 핵심 요약 추출 ───
function extractKeyPoints(content: string): string[] {
  const lines = content.split('\n');
  const points: string[] = [];
  let inSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^##\s+/.test(trimmed) && KEY_POINT_PATTERNS.test(trimmed)) {
      inSection = true;
      continue;
    }
    if (inSection) {
      if (/^#{1,2}\s/.test(trimmed)) break; // Stop at next H1/H2
      if (/\[SEO_SUMMARY\]/.test(trimmed)) break;
      
      if (/^---/.test(trimmed)) continue;
      
      if (/^[-*]\s+/.test(trimmed) || /^[🛡️💡✅☑️⭐]/.test(trimmed)) {
        const text = trimmed.replace(/^[-*]\s*/, '').replace(/^[🛡️💡✅☑️⭐]+\s*/, '').trim();
        if (text) points.push(text);
      }
    }
  }
  return points.slice(0, 3);
}

// ─── FAQ 추출 ───
function extractFAQ(content: string): { q: string; a: string }[] {
  const lines = content.split('\n');
  const faqs: { q: string; a: string }[] = [];
  let inSection = false;
  let currentQ = '';
  let currentA = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^##\s+/.test(trimmed) && FAQ_PATTERNS.test(trimmed)) {
      inSection = true;
      continue;
    }
    if (inSection) {
      if (/^#{1,2}\s/.test(trimmed)) break; // Stop at H1 or H2
      if (/\[SEO_SUMMARY\]/.test(trimmed)) break;

      if (/^#+\s*/.test(trimmed)) {
        if (currentQ) faqs.push({ q: currentQ, a: currentA.trim() });
        // [FIX] Q번호 앞에 **·*·이모지·공백이 어떤 조합으로 와도 제거
        //       Q번호 뒤에 남는 **·* 마커도 함께 제거
        currentQ = trimmed
          .replace(/^(?:#+\s*)+/, '')
          .replace(/^[*_💬✅☑️🛡️⭐\s]*Q\d+[*_]*\s*[:.-]?\s*/i, '')
          .trim();
        currentA = '';
      } else if (currentQ) {
        if (trimmed === '---') continue;
        currentA += line + '\n';
      }
    }
  }
  if (currentQ) faqs.push({ q: currentQ, a: currentA.trim() });
  return faqs;
}

// ─── 용어 사전 추출 ───
function extractGlossary(content: string): { term: string; definition: string }[] {
  const lines = content.split('\n');
  const glossary: { term: string; definition: string }[] = [];
  let inSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^##\s+/.test(trimmed) && GLOSSARY_PATTERNS.test(trimmed)) {
      inSection = true;
      continue;
    }
    if (inSection) {
      if (/^#{1,2}\s/.test(trimmed)) break; // Stop at next H1/H2
      if (/\[SEO_SUMMARY\]/.test(trimmed)) break;

      if (/^[-*]\s+/.test(trimmed)) {
        const text = trimmed.replace(/^[-*]\s*/, '').trim();
        // "**용어**: 설명", "**용어** : 설명", "**용어 :** 설명" 등 다양한 패턴 매칭
        const match = text.replace(/\*\*/g, '').match(/^([^:]+):\s*(.*)/);
        if (match) {
          glossary.push({ term: match[1].trim(), definition: match[2].trim() });
        }
      }
    }
  }
  return glossary;
}

// ─── 본문 전처리 ───
function preprocessBody(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let skipType: 'NONE' | 'KEY_POINTS' | 'CHECKLIST' | 'GLOSSARY' | 'FAQ' | 'CTA' = 'NONE';
  let clBuffer: string[] = [];

  const singleLinkRegex = /^\s*\[([^\]]+)\]\(([^)]+)\)\s*$/;

  const flushChecklist = () => {
    if (clBuffer.length > 0) {
      result.push(`<inlinechecklist data="${encodeURIComponent(clBuffer.join('||'))}"></inlinechecklist>`);
      clBuffer = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // 단독 줄 마크다운 링크 감지 -> 커스텀 추천 칼럼 카드로 치환
    const singleLinkMatch = trimmed.match(singleLinkRegex);
    if (singleLinkMatch) {
      const text = singleLinkMatch[1].trim();
      const href = singleLinkMatch[2].trim();
      result.push(`<calloutlink href="${href}" text="${text}"></calloutlink>`);
      continue;
    }

    if (/^##\s+/.test(trimmed)) {
      const prevSkipType = skipType;
      let newSkipType: 'NONE' | 'KEY_POINTS' | 'CHECKLIST' | 'GLOSSARY' | 'FAQ' | 'CTA' = skipType;
      let matched = false;

      if (KEY_POINT_PATTERNS.test(trimmed)) { newSkipType = 'KEY_POINTS'; matched = true; }
      else if (CHECKLIST_PATTERNS.test(trimmed)) { newSkipType = 'CHECKLIST'; clBuffer = []; matched = true; }
      else if (GLOSSARY_PATTERNS.test(trimmed)) { newSkipType = 'GLOSSARY'; matched = true; }
      else if (FAQ_PATTERNS.test(trimmed)) { newSkipType = 'FAQ'; matched = true; }
      else if (CTA_PATTERNS.test(trimmed)) { newSkipType = 'CTA'; matched = true; }

      if (matched) {
        if (prevSkipType === 'CHECKLIST') {
          flushChecklist();
        }
        skipType = newSkipType;
        continue;
      }
    }

    if (skipType === 'KEY_POINTS') {
      if (trimmed !== '' && !/^[-*]/.test(trimmed) && !/^#/.test(trimmed)) skipType = 'NONE';
      else if (/^#/.test(trimmed)) skipType = 'NONE';
    } else if (skipType === 'CHECKLIST') {
      if (/^#{1,6}\s/.test(trimmed)) {
        flushChecklist();
        skipType = 'NONE';
      } else if (/^[-*]\s+/.test(trimmed) || /^[\u2611\u2705\uFE0F[\]]/.test(trimmed)) {
        const text = trimmed
          .replace(/^[-*]\s*/, '')
          .replace(/^\[[ x]\]\s*/i, '')
          .replace(/^[\u2611\u2705\uFE0F]+\s*/gu, '')
          .trim();
        if (text) clBuffer.push(text);
        continue;
      } else {
        // 설명 문구나 빈 줄 등은 무시하고, 다음 H2/H1 소제목을 만날 때까지 CHECKLIST 모드를 계속 유지합니다.
        continue;
      }
    } else if (skipType === 'GLOSSARY') {
      if (/^#{1,2}\s/.test(trimmed)) skipType = 'NONE';
    } else if (skipType === 'FAQ') {
      if (/^#{1,2}\s/.test(trimmed)) skipType = 'NONE';
    } else if (skipType === 'CTA') {
      if (/^#{1,2}\s/.test(trimmed)) skipType = 'NONE';
    }

    if (skipType === 'NONE') {
      result.push(line);
    }
  }

  flushChecklist();

  const processed = result
    .join('\n')
    .replace(/\[BLOCKS?-\d+[^\]]*\]/gi, '') // ◀ AI용 블록 지시어 마커 제거
    .replace(/<calculator\s+type="([^"]+)"\s*\/>/g, '<calculator type="$1"></calculator>')
    .replace(/\[SEO_SUMMARY\]\s*:\s*.*/gi, '')
    .replace(/\[[^\]]*(?:카카오|상담)[^\]]*\]\([^)]*\)/g, '')
    .trim();

  return processed.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
}

interface TOCItem { id: string; text: string; }
interface BlogPostContentProps { content: string; }

export default function BlogPostContent({ content }: BlogPostContentProps) {
  const [toc, setToc] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState('');
  const [calcOpen, setCalcOpen] = useState(false);

  const keyPoints    = extractKeyPoints(content);
  const glossaryItems = extractGlossary(content);
  const faqItems     = extractFAQ(content);
  const bodyContent  = preprocessBody(content);

  useEffect(() => {
    const timer = setTimeout(() => {
      const headings = document.querySelectorAll<HTMLHeadingElement>('[data-blog-body] h2[id]');
      const items = Array.from(headings).map(h => ({
        id: h.id,
        text: (h.textContent || '')
          .trim()
          .replace(/^\d+\.\s*/, '')
          .replace(/\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu, '')
          .trim(),
      }));
      setToc(items);
    }, 150);
    return () => clearTimeout(timer);
  }, [bodyContent]);

  useEffect(() => {
    const onScroll = () => {
      const headings = document.querySelectorAll('[data-blog-body] h2[id]');
      let current = '';
      headings.forEach(h => {
        if (h.getBoundingClientRect().top < SCROLL_OFFSET + 10) current = h.id;
      });
      setActiveId(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleTOCClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET,
        behavior: 'smooth',
      });
    }
  };

  const components: Components = {
    h2: ({ children, id }) => (
      <h2
        id={id}
        style={{ scrollMarginTop: `${SCROLL_OFFSET}px` }}
        className="text-[19px] sm:text-[22px] font-bold text-gray-900 dark:text-[#e8eaed] mt-12 mb-6 px-4 py-3 sm:px-6 bg-white dark:bg-[#202124] border border-gray-200 dark:border-white/10 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex items-center gap-3 tracking-tight break-keep"
      >
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[#fce8e6] dark:bg-[#d93025]/20 flex items-center justify-center shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-[#d93025]" />
        </span>
        {children}
      </h2>
    ),
    h3: ({ children, id }) => (
      <h3
        id={id}
        style={{ scrollMarginTop: `${SCROLL_OFFSET}px` }}
        className="w-full flex items-center text-[16px] sm:text-[17px] font-bold text-gray-800 dark:text-[#e8eaed] mt-8 mb-4 px-4 py-3 bg-gray-50/80 dark:bg-white/[0.03] border-l-4 border-l-[#d93025] border border-y-gray-200 border-r-gray-200 dark:border-y-white/10 dark:border-r-white/10 rounded-r-xl tracking-tight break-keep shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
      >
        {children}
      </h3>
    ),
    blockquote: ({ children }) => (
      <div className="my-8 p-4 sm:p-6 rounded-2xl bg-white dark:bg-[#202124] border border-gray-200 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex items-start gap-3 relative overflow-hidden">
        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#34A853]" />
        <div className="text-[15px] text-gray-800 dark:text-[#e8eaed] leading-[1.8] [&>p]:m-0 flex-1">{children}</div>
      </div>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto my-8 rounded-xl border border-[#e0e0e0] dark:border-[#5f6368] shadow-sm">
        <table className="w-full text-[14px] border-collapse">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="bg-[#E8F0FE] dark:bg-[#1A73E8]/20 p-3.5 text-left font-bold text-[#1A73E8] dark:text-[#8ab4f8] border-b border-[#dadce0]">{children}</th>
    ),
    td: ({ children }) => (
      <td className="p-3.5 border-b border-[#f1f3f4] dark:border-[#3c4043] align-top text-[#202124] dark:text-[#e8eaed]">{children}</td>
    ),
    tr: ({ children }) => (
      <tr className="hover:bg-[#f8f9fa] dark:hover:bg-[#303134]/50 transition-colors">{children}</tr>
    ),
    a: ({ href = '', children }) => (
      <a
        href={href}
        className="inline-flex items-center gap-0.5 text-[#1A73E8] dark:text-[#8ab4f8] font-bold border-b border-b-[#1A73E8]/30 hover:border-b-[#1A73E8] dark:border-b-[#8ab4f8]/30 dark:hover:border-b-[#8ab4f8] no-underline transition-colors mx-0.5 align-middle"
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
        {href.startsWith('http') && (
          <svg className="w-3.5 h-3.5 opacity-60 inline-block align-middle shrink-0 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7V17" /></svg>
        )}
      </a>
    ),
    p: ({ children }) => (
      <p className="mb-5 leading-[1.85] text-[#202124] dark:text-[#e8eaed]">{children}</p>
    ),
    li: ({ children }) => <li className="my-1.5 leading-[1.8]">{children}</li>,
    strong: ({ children }) => (
      <strong className="font-bold text-[#1A73E8] dark:text-[#8ab4f8]">{children}</strong>
    ),
    hr: () => (
      <div className="my-16 flex items-center justify-center gap-4">
        <div className="w-24 h-px bg-gradient-to-r from-transparent to-gray-300 dark:to-gray-600" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#d93025]" />
        <div className="w-24 h-px bg-gradient-to-l from-transparent to-gray-300 dark:to-gray-600" />
      </div>
    ),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalComponents: any = {
    ...components,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    calculator: ({ ...props }: any) => {
      const isAuto = props.type === 'auto';
      const isMedical = props.type === 'medical';
      if (!isAuto && !isMedical) return null;
      return (
        <div className="my-8 relative w-full mx-auto">
          <button
            onClick={() => setCalcOpen(!calcOpen)}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 text-left cursor-pointer shadow-xs hover:shadow-sm ${
              isAuto 
                ? 'bg-blue-50/50 hover:bg-blue-50 border-blue-100 dark:bg-blue-950/10 dark:hover:bg-blue-950/20 dark:border-blue-900/30 text-[var(--google-blue)] dark:text-[#8ab4f8]' 
                : 'bg-green-50/50 hover:bg-green-50 border-green-100 dark:bg-green-950/10 dark:hover:bg-green-950/20 dark:border-green-900/30 text-[#34A853] dark:text-[#81c995]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl shrink-0">{isAuto ? '🚗' : '🏥'}</span>
              <div>
                <div className="text-sm sm:text-base font-extrabold tracking-tight">
                  {isAuto ? '자동차보험 예상 합의금 계산기 열기' : '실손의료비 예상 보상금 계산기 열기'}
                </div>
                <div className="text-[10.5px] text-gray-500 dark:text-gray-400 font-bold mt-0.5 leading-tight">
                  나의 사고 상황 및 치료 조건으로 예상 수령액을 1분 만에 시뮬레이션해 봅니다.
                </div>
              </div>
            </div>
            <div className="shrink-0 pl-2">
              <span className="px-3 py-1.5 bg-white dark:bg-zinc-800 text-[11px] font-extrabold rounded-lg border border-inherit shadow-2xs hover:scale-102 transition-transform">
                {calcOpen ? '접기 📂' : '펼치기 📁'}
              </span>
            </div>
          </button>
          
          {calcOpen && (
            <div className="mt-4 bg-white dark:bg-[#202124] rounded-3xl shadow-[0_16px_48px_rgba(0,0,0,0.06)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.4)] border border-gray-150 dark:border-white/8 overflow-visible animate-in slide-in-from-top-3 fade-in duration-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/8">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1A73E8] animate-pulse shadow-[0_0_6px_#1A73E8]" />
                  <span className="text-[11px] font-extrabold text-[#1A73E8] dark:text-[#8ab4f8] tracking-[0.15em] uppercase">
                    {isAuto ? 'AUTO INSURANCE SIMULATOR' : 'MEDICAL BILL ESTIMATOR'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d93025]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f29900]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#34A853]" />
                  <span className="ml-2 text-[11px] font-bold text-gray-400 dark:text-gray-500">보상스쿨 안심 계산기</span>
                </div>
              </div>
              <div className="p-5 sm:p-8">
                {isAuto ? <AutoCalculatorContainer /> : <MedicalCalculator />}
              </div>
            </div>
          )}
        </div>
      );
    },
    red: ({ children }: { children: React.ReactNode }) => <strong className="text-[#d93025] dark:text-[#f28b82] font-bold">{children}</strong>,
    orange: ({ children }: { children: React.ReactNode }) => <strong className="text-[#f29900] dark:text-[#fde293] font-bold">{children}</strong>,
    green: ({ children }: { children: React.ReactNode }) => <strong className="text-[#34A853] dark:text-[#81c995] font-bold">{children}</strong>,
    blue: ({ children }: { children: React.ReactNode }) => <strong className="text-[#1A73E8] dark:text-[#8ab4f8] font-bold">{children}</strong>,
    purple: ({ children }: { children: React.ReactNode }) => <strong className="text-[#9333ea] dark:text-[#c084fc] font-bold">{children}</strong>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    calloutlink: ({ ...props }: any) => {
      const href = props.href || '';
      const text = props.text || '';
      return (
        <a
          href={href}
          className="flex items-center justify-between p-4.5 my-6 bg-gray-50/60 dark:bg-white/[0.02] border border-gray-150 dark:border-white/5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_30px_rgba(26,115,232,0.08)] hover:border-[#1A73E8]/30 dark:hover:border-[#8ab4f8]/30 transition-all duration-300 hover:-translate-y-[2px] text-[#1A73E8] dark:text-[#8ab4f8] group no-underline break-keep"
        >
          <div className="flex items-center gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#e8f0fe] dark:bg-[#1A73E8]/20 flex items-center justify-center shadow-2xs">
              <svg className="w-4 h-4 text-[#1A73E8] dark:text-[#8ab4f8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 05.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1" /></svg>
            </span>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-extrabold text-[#1A73E8] dark:text-[#8ab4f8] uppercase tracking-wider mb-0.5">추천 칼럼</span>
              <span className="text-[14px] sm:text-[14.5px] font-extrabold text-gray-800 dark:text-[#e8eaed] leading-snug group-hover:text-[#1A73E8] dark:group-hover:text-[#8ab4f8] transition-colors">{text}</span>
            </div>
          </div>
          <svg className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-transform duration-300 group-hover:translate-x-[4px] group-hover:-translate-y-[4px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7V17" /></svg>
        </a>
      );
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inlinechecklist: ({ ...props }: any) => {
      const encoded = (props['data'] as string) || '';
      const items = decodeURIComponent(encoded).split('||').filter(Boolean);
      if (items.length === 0) return null;
      return <ChecklistBox items={items} />;
    },
    hr1: () => (
      <div className="my-16 flex items-center justify-center gap-4">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
      </div>
    ),
    hr2: () => (
      <div className="my-16 flex justify-center">
        <div className="w-24 h-px bg-gray-300 dark:bg-gray-600"></div>
      </div>
    ),
    hr3: () => (
      <div className="my-16 flex items-center justify-center gap-4">
        <div className="w-24 h-px bg-gradient-to-r from-transparent to-gray-300 dark:to-gray-600" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#d93025]" />
        <div className="w-24 h-px bg-gradient-to-l from-transparent to-gray-300 dark:to-gray-600" />
      </div>
    ),
  };

  return (
    <div>
      {/* 1. Key Points (최상단) */}
      {keyPoints.length > 0 && <KeyPointsBox points={keyPoints} />}

      {/* 2. 목차 */}
      {toc.length > 0 && (
        <TableOfContents toc={toc} activeId={activeId} onItemClick={handleTOCClick} />
      )}

      {/* 3. 본문 */}
      <div data-blog-body>
        <ReactMarkdown
          remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
          rehypePlugins={[rehypeRaw, rehypeSlug]}
          components={finalComponents}
        >
          {bodyContent}
        </ReactMarkdown>
        {/* 4. 용어 사전 (본문 끝나는 부분에 위치) */}
        {glossaryItems.length > 0 && <GlossaryBox items={glossaryItems} />}
      </div>

      {/* 5. FAQ */}
      {faqItems.length > 0 && <FAQBox items={faqItems} />}

      {/* 6. 저자 바이오 카드 (E-E-A-T 신호) */}
      <AuthorBioCard />

      {/* 7. CTA 배너 */}
      <CTABanner />
    </div>
  );
}
