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

// 파싱 유틸리티 공통 모듈 (blog/[slug]/page.tsx와 공유)
import {
  extractKeyPoints,
  extractFAQ,
  extractGlossary,
  preprocessBody,
} from '@/lib/blog-utils';

// ─── 스크롤 오프셋: header(64) + sticky banner(52) + 버퍼(20) = 136px ───
const SCROLL_OFFSET = 140;

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
        className="text-[19px] sm:text-[22px] font-bold text-gray-900 dark:text-[#e8eaed] mt-12 mb-6 px-4 py-3 sm:px-6 bg-white dark:bg-[#202124] border border-gray-200 dark:border-white/10 rounded-none shadow-[0_4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] flex items-center gap-3 tracking-tight break-keep"
      >
        <span className="flex-shrink-0 w-1.5 h-7 bg-gradient-to-b from-red-600 to-[#1a73e8] dark:from-red-500 dark:to-blue-500" />
        {children}
      </h2>
    ),
    h3: ({ children, id }) => (
      <h3
        id={id}
        style={{ scrollMarginTop: `${SCROLL_OFFSET}px` }}
        className="w-full flex items-center text-[16px] sm:text-[17px] font-bold text-gray-800 dark:text-[#e8eaed] mt-8 mb-4 px-4 py-3 bg-gray-50/80 dark:bg-white/[0.03] border-l-4 border-l-[#1a73e8] border border-y-gray-200 border-r-gray-200 dark:border-y-white/10 dark:border-r-white/10 rounded-none tracking-tight break-keep shadow-[0_2px_10px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
      >
        {children}
      </h3>
    ),
    blockquote: ({ children }) => (
      <div className="my-8 p-4 sm:p-6 rounded-none bg-white dark:bg-[#202124] border border-gray-200 dark:border-white/10 shadow-[0_6px_25px_rgba(0,0,0,0.08)] dark:shadow-[0_6px_25px_rgba(0,0,0,0.4)] flex items-start gap-3 relative overflow-hidden group">
        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-red-600 to-[#1a73e8] dark:from-red-500 dark:to-blue-500" />
        <div className="text-[15px] text-gray-800 dark:text-[#e8eaed] leading-[1.8] [&>p]:m-0 flex-1">{children}</div>
      </div>
    ),
    table: ({ children }) => (
      <div className="overflow-x-auto my-8 rounded-none border border-gray-200 dark:border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_15px_rgba(0,0,0,0.4)] bg-white dark:bg-[#202124]">
        <table className="w-full text-[14px] border-collapse">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3.5 text-center font-bold text-[#1a73e8] dark:text-[#8ab4f8] border-b border-[#dadce0]">{children}</th>
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
        className="text-[#1A73E8] dark:text-[#8ab4f8] hover:text-[#1557b0] dark:hover:text-[#aecbfa] font-bold underline underline-offset-4 decoration-[#1A73E8]/35 hover:decoration-[#1A73E8] transition-all duration-150 mx-0.5 inline-flex items-center gap-1 group break-all"
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        <svg className="w-3.5 h-3.5 shrink-0 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        <span className="leading-snug">{children}</span>
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
            className={`w-full flex items-center justify-between p-4 rounded-none border transition-all duration-300 text-left cursor-pointer shadow-[0_4px_15px_rgba(0,0,0,0.05)] hover:shadow-[0_12px_30px_rgba(26,115,232,0.15)] ${
              isAuto 
                ? 'bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200 dark:from-blue-900/10 dark:to-indigo-900/10 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 dark:border-blue-800/30 text-[#1a73e8] dark:text-[#8ab4f8]' 
                : 'bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-green-200 dark:from-green-900/10 dark:to-emerald-900/10 dark:hover:from-green-900/20 dark:hover:to-emerald-900/20 dark:border-green-800/30 text-[#34A853] dark:text-[#81c995]'
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
            <div className="mt-4 bg-white dark:bg-[#202124] rounded-none shadow-[0_6px_25px_rgba(0,0,0,0.08)] dark:shadow-[0_6px_25px_rgba(0,0,0,0.4)] border border-gray-200 dark:border-white/10 overflow-visible animate-in slide-in-from-top-3 fade-in duration-200 relative group">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 to-[#1a73e8] dark:from-red-500 dark:to-blue-500" />
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/8 mt-1.5">
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
          className="flex items-center justify-between p-4 my-5 bg-[#e8f0fe]/30 hover:bg-[#e8f0fe]/60 dark:bg-[#1a2540]/15 dark:hover:bg-[#1a2540]/30 border-l-4 border-l-[#1A73E8] rounded-r-xl transition-all duration-200 text-[#1A73E8] dark:text-[#8ab4f8] group no-underline break-keep shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#e8f0fe] dark:bg-[#1A73E8]/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-[#1A73E8] dark:text-[#8ab4f8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 05.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1" /></svg>
            </span>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-extrabold text-[#1A73E8] dark:text-[#8ab4f8] uppercase tracking-wider mb-0.5">관련 추천 글</span>
              <span className="text-[13.5px] sm:text-[14px] font-extrabold text-gray-800 dark:text-[#e8eaed] leading-snug group-hover:text-[#1A73E8] dark:group-hover:text-[#8ab4f8] transition-colors">{text}</span>
            </div>
          </div>
          <svg className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-transform duration-300 group-hover:translate-x-[3px] shrink-0 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
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
