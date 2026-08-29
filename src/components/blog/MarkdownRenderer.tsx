'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import type { Components } from 'react-markdown';
import PremiumHeading from '../ui/PremiumHeading';
import PremiumCard from '../ui/PremiumCard';
import AppIcon from '../ui/AppIcon';

import { BLOG_TONE_TOKENS, getToneColor as getTokenTone, getKeywordTone, BlogTone } from '@/lib/blog-tokens';

const SCROLL_OFFSET = 140;

const extractTextFromNode = (n: any): string => {
  if (typeof n === 'string') return n;
  if (Array.isArray(n)) return n.map(extractTextFromNode).join('');
  if (n?.props?.children) return extractTextFromNode(n.props.children);
  return '';
};

// 헤딩 톤온톤 컬러 매핑 (헌법 제10조 시맨틱 위계)
const getHeadingTone = (level: number, node?: React.ReactNode): 'red' | 'blue' | 'yellow' | 'green' | 'purple' | 'gray' => {
  const text = node ? extractTextFromNode(node).trim() : '';

  // 특수 섹션 전용 컬러 매핑
  if (/(1분\s*자가진단|자가진단|체크리스트|진단\s*체크)/i.test(text)) return 'green';
  if (/(FAQ|자주\s*묻는\s*질문|자주묻는질문|질문과\s*답변|Q&A)/i.test(text)) return 'purple';
  if (/(핵심\s*요약|핵심요약|3줄\s*요약)/i.test(text)) return 'red';

  // 제목 영역 기본 색상 위계: 빨(H2) - 파(H3) - 노(H4/H5) - 초록(H6: 맞춤솔루션)
  switch (level) {
    case 2: return 'red';
    case 3: return 'blue';
    case 4:
    case 5: return 'yellow';
    case 6: return 'green';
    default: return 'red';
  }
};

const getHeadingBgClass = (tone: string) => {
  switch (tone) {
    case 'red': return 'from-red-100/80 dark:from-red-900/30';
    case 'green': return 'from-green-100/80 dark:from-green-900/30';
    case 'yellow': return 'from-yellow-100/80 dark:from-yellow-900/30';
    case 'purple': return 'from-purple-100/80 dark:from-purple-900/30';
    case 'gray': return 'from-gray-100/80 dark:from-gray-800/30';
    case 'charcoal':
    case 'ink': return 'from-zinc-100/90 via-zinc-50/40 dark:from-zinc-800/40 dark:via-zinc-800/10';
    default: return 'from-blue-100/80 dark:from-blue-900/30';
  }
};

const UnifiedHeadingRenderer = ({ level, children, id }: { level: 1|2|3|4|5|6, children?: React.ReactNode, id?: string }) => {
  const tone = getHeadingTone(level, children);
  const styles: Record<number, string> = {
    2: 'mt-14 mb-6 py-3',
    3: 'mt-10 mb-5 py-2.5',
    4: 'mt-8 mb-4 py-2',
    5: 'mt-6 mb-3 py-1.5',
    6: 'mt-6 mb-3 py-2',
  };

  return (
    <PremiumHeading 
      level={level as any} 
      id={id} 
      showLeftBorder 
      gradient={tone} 
      style={{ scrollMarginTop: `${SCROLL_OFFSET}px` }} 
      className={`${styles[level] || styles[5]} pr-4 rounded-none break-keep bg-gradient-to-r ${getHeadingBgClass(tone)} to-transparent dark:to-transparent`}
    >
      {children}
    </PremiumHeading>
  );
};

// 인용구(Blockquote) 톤 컬러 결정 (blog-tokens 엔진과 100% 통합)
const getToneColor = (node: React.ReactNode): BlogTone => {
  const fullText = extractTextFromNode(node).trim();
  return getTokenTone(fullText);
};

// 표준 마크다운 컴포넌트 맵 (단일 통합 & 공유)
export const sharedComponents: Components & Record<string, any> = {
  h1: ({ children, id }) => (
    <PremiumHeading level={1} id={id} style={{ scrollMarginTop: `${SCROLL_OFFSET}px` }} className="mt-16 mb-8 pb-4 border-b-4 border-[var(--google-blue)] dark:border-[#8ab4f8] break-keep">
      {children}
    </PremiumHeading>
  ),
  h2: (props) => <UnifiedHeadingRenderer level={2} {...props} />,
  h3: (props) => <UnifiedHeadingRenderer level={3} {...props} />,
  h4: (props) => <UnifiedHeadingRenderer level={4} {...props} />,
  h5: (props) => <UnifiedHeadingRenderer level={5} {...props} />,
  h6: (props) => <UnifiedHeadingRenderer level={6} {...props} />,

  p: ({ children }) => <p className="mb-4 leading-[1.85] text-[#202124] dark:text-[#e8eaed] break-keep">{children}</p>,

  // 헌법 제10조 웹 표준 리스트 태그 지원
  ul: ({ children }) => <ul className="list-disc ml-5 sm:ml-6 my-5 space-y-2.5 text-[15.5px] sm:text-[16px] text-gray-800 dark:text-[#e8eaed] marker:text-[#1A73E8] dark:marker:text-[#8ab4f8]">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal ml-5 sm:ml-6 my-5 space-y-2.5 text-[15.5px] sm:text-[16px] text-gray-800 dark:text-[#e8eaed] marker:font-bold marker:text-[#1A73E8] dark:marker:text-[#8ab4f8]">{children}</ol>,
  li: ({ children }) => <li className="pl-1 leading-[1.8] break-keep">{children}</li>,

  // 헌법 제1조 톤온톤 파스텔 키워드 강조 자동 매핑
  strong: ({ children }) => {
    const text = extractTextFromNode(children).trim();
    const tone = getKeywordTone(text);
    const toneClass = BLOG_TONE_TOKENS[tone].tailwind.highlightClass;

    return (
      <strong className={`font-bold px-1.5 py-0.5 mx-0.5 rounded-md ${toneClass}`}>
        {children}
      </strong>
    );
  },

  // 헌법 제4조 인라인 용어 사전 및 손해사정사 실무 조언/팁 박스 (CommonBox 일체화)
  blockquote: ({ children }) => {
    const tone = getToneColor(children);
    const token = BLOG_TONE_TOKENS[tone].tailwind;

    const boxHoverBorders: Record<BlogTone, string> = {
      blue: 'border-blue-200 dark:border-blue-900/50 hover:border-[var(--google-blue)] hover:shadow-[0_12px_40px_rgba(26,115,232,0.18)]',
      red: 'border-red-200 dark:border-red-900/50 hover:border-[var(--google-red)] hover:shadow-[0_12px_40px_rgba(234,67,53,0.18)]',
      green: 'border-green-200 dark:border-green-900/50 hover:border-[var(--google-green)] hover:shadow-[0_12px_40px_rgba(52,168,83,0.18)]',
      yellow: 'border-yellow-300 dark:border-yellow-900/50 hover:border-yellow-500 hover:shadow-[0_12px_40px_rgba(234,179,8,0.18)]',
      purple: 'border-indigo-200 dark:border-indigo-900/50 hover:border-indigo-500 hover:shadow-[0_12px_40px_rgba(99,102,241,0.18)]',
    };

    const headerGradients: Record<BlogTone, string> = {
      blue: 'from-blue-50/90 to-transparent dark:from-blue-900/25 dark:to-transparent border-b border-blue-100 dark:border-blue-900/40',
      red: 'from-red-50/90 to-transparent dark:from-red-900/25 dark:to-transparent border-b border-red-100 dark:border-red-900/40',
      green: 'from-green-50/90 to-transparent dark:from-green-900/25 dark:to-transparent border-b border-green-100 dark:border-green-900/40',
      yellow: 'from-yellow-50/90 to-transparent dark:from-yellow-900/25 dark:to-transparent border-b border-yellow-200 dark:border-yellow-900/40',
      purple: 'from-indigo-50/90 to-transparent dark:from-indigo-900/25 dark:to-transparent border-b border-indigo-100 dark:border-indigo-900/40',
    };

    const titleColors: Record<BlogTone, string> = {
      blue: 'text-[var(--google-blue)] dark:text-blue-400',
      red: 'text-[var(--google-red)] dark:text-red-400',
      green: 'text-[var(--google-green)] dark:text-green-400',
      yellow: 'text-yellow-600 dark:text-yellow-400',
      purple: 'text-indigo-600 dark:text-indigo-400',
    };

    // 자식 요소 중 공백 문자열을 제외한 첫 번째 유효 요소가 헤딩(h1~h6)인지 검사
    const rawChildrenArray = React.Children.toArray(children);
    const validChildren = rawChildrenArray.filter(c => typeof c !== 'string' || c.trim() !== '');
    let headingElement: React.ReactNode = null;
    const bodyElements: React.ReactNode[] = [];

    const isHeading = (node: any): boolean => {
      if (!React.isValidElement(node)) return false;
      const tagName = (node.props as any)?.node?.tagName;
      if (typeof tagName === 'string' && /^h[1-6]$/i.test(tagName)) return true;
      if (typeof node.type === 'string' && /^h[1-6]$/i.test(node.type)) return true;
      return false;
    };

    if (validChildren.length > 0 && isHeading(validChildren[0])) {
      headingElement = validChildren[0];
      for (let i = 1; i < validChildren.length; i++) {
        bodyElements.push(validChildren[i]);
      }
    } else {
      for (let i = 0; i < validChildren.length; i++) {
        bodyElements.push(validChildren[i]);
      }
    }

    // 헤딩이 포함된 실무 팁/실무 조언 박스 -> CommonBox 상단 톤온톤 헤더 스트립으로 렌더링
    if (headingElement && React.isValidElement(headingElement)) {
      const headingChildren = (headingElement.props as any)?.children;

      return (
        <div className={`my-8 bg-white dark:bg-[#202124] shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden group border rounded-none ${boxHoverBorders[tone]}`}>
          {/* 상단 톤온톤 헤더 바 (모던 SVG 라인 심볼 탑재) */}
          <div className={`px-5 sm:px-6 py-3 bg-gradient-to-r ${headerGradients[tone]} relative z-10`}>
            <h3 className={`text-[15.5px] font-extrabold flex items-center gap-2.5 tracking-tight !m-0 !p-0 border-0 bg-transparent ${titleColors[tone]}`}>
              <AppIcon name="shield-alert" size={16} className={titleColors[tone]} />
              <span>{headingChildren}</span>
            </h3>
          </div>
          {/* 본문 영역 */}
          <div className="p-5 sm:p-6 text-[14.5px] sm:text-[15px] font-medium text-gray-700 dark:text-[#e8eaed] leading-[1.75] tracking-tight [&>p]:mb-4 sm:[&>p]:mb-5 [&>p:last-child]:!mb-0 relative z-10 break-keep">
            {bodyElements}
          </div>
        </div>
      );
    }

    // 인라인 용어 사전 / 단순 인용구
    return (
      <div className={`my-8 bg-white dark:bg-[#202124] p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden group border rounded-none ${boxHoverBorders[tone]}`}>
        <div className="relative z-10 text-[14.5px] sm:text-[15px] font-medium text-gray-700 dark:text-[#e8eaed] leading-[1.75] tracking-tight [&>p]:mb-4 sm:[&>p]:mb-5 [&>p:last-child]:!mb-0 break-keep">
          {children}
        </div>
      </div>
    );
  },

  // 헌법 제2조 표준 마크다운 테이블 (W3C 시맨틱 & 순수 마크다운 위계 완벽 반영)
  table: ({ children }: any) => (
    <div className="my-8">
      <PremiumCard hoverEffect={false} className="!p-0 overflow-x-auto shadow-sm rounded-none border border-gray-200/80 dark:border-zinc-800">
        <table className="w-full text-[13.5px] sm:text-[14px] border-collapse min-w-[500px] sm:min-w-full">{children}</table>
      </PremiumCard>
    </div>
  ),
  th: ({ children, style, ...props }: any) => (
    <th
      style={style}
      className="bg-slate-100/90 dark:bg-zinc-800/90 p-3.5 font-extrabold text-[#111827] dark:text-[#f3f4f6] border-b-2 border-slate-300 dark:border-zinc-700 tracking-tight whitespace-nowrap text-center"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, style, ...props }: any) => (
    <td
      style={style}
      className="p-3.5 border-b border-[#f1f3f4] dark:border-[#3c4043] align-middle text-[#202124] dark:text-[#e8eaed] leading-relaxed text-left"
      {...props}
    >
      {children}
    </td>
  ),
  tr: ({ children }: any) => (
    <tr className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition-colors last:[&>td]:border-b-0">{children}</tr>
  ),

  a: ({ href = '', children }) => (
    <a
      href={href}
      className="text-[#1A73E8] dark:text-[#8ab4f8] hover:text-[#1557b0] dark:hover:text-[#aecbfa] font-bold underline underline-offset-4 decoration-[#1A73E8]/35 hover:decoration-[#1A73E8] transition-all duration-150 mx-0.5 inline group"
      target={href.startsWith('http') ? '_blank' : undefined}
      rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      <span className="leading-snug">{children}</span>
      <svg className="w-3.5 h-3.5 inline-block align-baseline ml-1 shrink-0 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
    </a>
  ),

  hr: () => (
    <div className="my-14 flex justify-center">
      <div className="w-full h-px bg-gray-200 dark:bg-white/10" />
    </div>
  ),

  pre: ({ children }) => (
    <pre className="whitespace-pre-wrap break-words bg-gray-50 dark:bg-[#303134] p-4 sm:p-5 rounded-none border border-gray-200 dark:border-white/10 my-6 text-[#202124] dark:text-[#e8eaed] font-sans text-[14.5px] sm:text-[15.5px] leading-relaxed shadow-sm overflow-x-hidden">
      {children}
    </pre>
  ),

  code: ({ children, className }: any) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="px-1.5 py-0.5 mx-0.5 rounded-none bg-gray-100 dark:bg-[#303134] text-[#d93025] dark:text-[#f28b82] text-[0.9em] font-sans font-bold">
          {children}
        </code>
      );
    }
    return <code className="font-sans break-keep">{children}</code>;
  },

  // 커스텀 태그 지원 (샤프 모던 rounded-none 표준)
  calculator: () => null,
  red: ({ children }: { children?: React.ReactNode }) => <strong className="text-[#d93025] dark:text-[#f28b82] bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 mx-0.5 rounded-none font-bold">{children}</strong>,
  orange: ({ children }: { children?: React.ReactNode }) => <strong className="text-[#e37400] dark:text-[#fde293] bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 mx-0.5 rounded-none font-bold">{children}</strong>,
  green: ({ children }: { children?: React.ReactNode }) => <strong className="text-[#137333] dark:text-[#81c995] bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 mx-0.5 rounded-none font-bold">{children}</strong>,
  blue: ({ children }: { children?: React.ReactNode }) => <strong className="text-[#1A73E8] dark:text-[#8ab4f8] bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 mx-0.5 rounded-none font-bold">{children}</strong>,
  purple: ({ children }: { children?: React.ReactNode }) => <strong className="text-[#9333ea] dark:text-[#c084fc] bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 mx-0.5 rounded-none font-bold">{children}</strong>,

  relatedbox: ({ children }: any) => (
    <PremiumCard borderColor="blue" hoverEffect={true} className="my-10 group">
      <div className="relative z-10">
        <div className="border-b border-gray-100 dark:border-white/5 pb-3 mb-4">
          <PremiumHeading level={3} showLeftBorder gradient="blue" className="!mb-0">
            함께 읽으면 도움이 되는 글
          </PremiumHeading>
        </div>
        <ul className="space-y-3">
          {children}
        </ul>
      </div>
    </PremiumCard>
  ),

  calloutlink: ({ ...props }: any) => {
    const href = props.href || '';
    const text = props.text || '';
    return (
      <li className="flex items-start gap-2.5 group">
        <span className="text-[#1A73E8] dark:text-[#8ab4f8] mt-0.5 font-bold shrink-0">
          <svg className="w-4 h-4 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
        </span>
        <a
          href={href}
          className="flex-1 text-[14.5px] font-normal text-gray-700 dark:text-[#bdc1c6] group-hover:text-[#1A73E8] dark:group-hover:text-[#8ab4f8] leading-[1.7] break-keep transition-colors no-underline"
        >
          <span className="group-hover:underline underline-offset-4 decoration-[#1A73E8]/30 transition-all">{text}</span>
        </a>
      </li>
    );
  },
};

interface MarkdownRendererProps {
  content: string;
  inline?: boolean;
}

export default function MarkdownRenderer({ content, inline = false }: MarkdownRendererProps) {
  if (inline) {
    return (
      <ReactMarkdown
        remarkPlugins={[[remarkGfm, { singleTilde: false }], remarkBreaks, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeSlug, rehypeKatex]}
        components={{
          p: ({ children }) => <>{children}</>,
          strong: sharedComponents.strong,
          a: sharedComponents.a,
          code: sharedComponents.code,
        }}
      >
        {content}
      </ReactMarkdown>
    );
  }

  return (
    <ReactMarkdown
      remarkPlugins={[[remarkGfm, { singleTilde: false }], remarkBreaks, remarkMath]}
      rehypePlugins={[rehypeRaw, rehypeSlug, rehypeKatex]}
      components={sharedComponents}
    >
      {content}
    </ReactMarkdown>
  );
}
