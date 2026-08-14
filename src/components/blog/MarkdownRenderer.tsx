'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import type { Components } from 'react-markdown';
import PremiumHeading from '../ui/PremiumHeading';
import PremiumCard from '../ui/PremiumCard';

const SCROLL_OFFSET = 140;

const getToneColor = (node: React.ReactNode): 'red' | 'green' | 'yellow' | 'purple' | 'blue' => {
  const getText = (n: any): string => {
    if (typeof n === 'string') return n;
    if (Array.isArray(n)) return n.map(getText).join('');
    if (n?.props?.children) return getText(n.props.children);
    return '';
  };
  const text = getText(node).trim().substring(0, 15);
  if (/(⚠️|🚨|🛑|❗|❌|⛔)/.test(text)) return 'red';
  if (/(✅|☑️|🌿|🌱|🍀|✔|📖)/.test(text)) return 'green';
  if (/(🔥|⭐|⚡|🌟|✨|🏆|💡)/.test(text)) return 'yellow';
  if (/(🔮|💎|💜|🟣|👨‍⚖️|👨‍💼|👩‍⚖️|👩‍💼)/.test(text)) return 'purple';
  return 'blue';
};

const getHeadingBgClass = (tone: string) => {
  switch (tone) {
    case 'red': return 'from-red-100/80 dark:from-red-900/30';
    case 'green': return 'from-green-100/80 dark:from-green-900/30';
    case 'yellow': return 'from-yellow-100/80 dark:from-yellow-900/30';
    case 'purple': return 'from-purple-100/80 dark:from-purple-900/30';
    case 'gray': return 'from-gray-100/80 dark:from-gray-800/30';
    default: return 'from-blue-100/80 dark:from-blue-900/30';
  }
};

const getHeadingTone = (level: number): 'blue' | 'purple' | 'green' | 'yellow' | 'gray' => {
  switch (level) {
    case 2: return 'blue';
    case 3: return 'purple';
    case 4: return 'green';
    case 5: return 'yellow';
    case 6: return 'gray';
    default: return 'blue';
  }
};

const UnifiedHeadingRenderer = ({ level, children, id }: { level: 1|2|3|4|5|6, children?: React.ReactNode, id?: string }) => {
  const tone = getHeadingTone(level);
  const styles: Record<number, string> = {
    2: 'mt-14 mb-6 py-3',
    3: 'mt-10 mb-5 py-2.5',
    4: 'mt-8 mb-4 py-2',
    5: 'mt-6 mb-3 py-1.5',
    6: 'mt-4 mb-2 py-1'
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

const baseComponents: Components = {
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
  blockquote: ({ children }) => {
    const tone = getToneColor(children);
    const boxHoverBorders: Record<string, string> = {
      blue: 'border-blue-200 dark:border-blue-900/50 hover:border-[var(--google-blue)] hover:shadow-[0_16px_50px_rgba(26,115,232,0.25)]',
      red: 'border-red-200 dark:border-red-900/50 hover:border-[var(--google-red)] hover:shadow-[0_16px_50px_rgba(234,67,53,0.25)]',
      green: 'border-green-200 dark:border-green-900/50 hover:border-[var(--google-green)] hover:shadow-[0_16px_50px_rgba(52,168,83,0.25)]',
      yellow: 'border-yellow-300 dark:border-yellow-900/50 hover:border-yellow-500 hover:shadow-[0_16px_50px_rgba(234,179,8,0.25)]',
      purple: 'border-purple-200 dark:border-purple-900/50 hover:border-purple-500 hover:shadow-[0_16px_50px_rgba(168,85,247,0.25)]',
    };
    const headerStyles: Record<string, string> = {
      blue: '[&_h3]:!bg-gradient-to-r [&_h3]:!from-blue-50/80 [&_h3]:!to-transparent [&_h3]:dark:!from-blue-900/20 [&_h3]:dark:!to-transparent [&_h3_span:last-child]:text-[var(--google-blue)] [&_h3_span:last-child]:dark:text-blue-400 [&_h3]:border-b-blue-100 [&_h3]:dark:border-b-blue-900/30',
      red: '[&_h3]:!bg-gradient-to-r [&_h3]:!from-red-50/80 [&_h3]:!to-transparent [&_h3]:dark:!from-red-900/20 [&_h3]:dark:!to-transparent [&_h3_span:last-child]:text-[var(--google-red)] [&_h3_span:last-child]:dark:text-red-400 [&_h3]:border-b-red-100 [&_h3]:dark:border-b-red-900/30',
      green: '[&_h3]:!bg-gradient-to-r [&_h3]:!from-green-50/80 [&_h3]:!to-transparent [&_h3]:dark:!from-green-900/20 [&_h3]:dark:!to-transparent [&_h3_span:last-child]:text-[var(--google-green)] [&_h3_span:last-child]:dark:text-green-400 [&_h3]:border-b-green-100 [&_h3]:dark:border-b-green-900/30',
      yellow: '[&_h3]:!bg-gradient-to-r [&_h3]:!from-yellow-50/80 [&_h3]:!to-transparent [&_h3]:dark:!from-yellow-900/20 [&_h3]:dark:!to-transparent [&_h3_span:last-child]:text-yellow-600 [&_h3_span:last-child]:dark:text-yellow-400 [&_h3]:border-b-yellow-200 [&_h3]:dark:border-b-yellow-900/30',
      purple: '[&_h3]:!bg-gradient-to-r [&_h3]:!from-purple-50/80 [&_h3]:!to-transparent [&_h3]:dark:!from-purple-900/20 [&_h3]:dark:!to-transparent [&_h3_span:last-child]:text-purple-600 [&_h3_span:last-child]:dark:text-purple-400 [&_h3]:border-b-purple-100 [&_h3]:dark:border-b-purple-900/30',
    };
    return (
      <div className={`my-10 bg-white dark:bg-[#202124] p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden group border ${boxHoverBorders[tone]}`}>
        <div className={`relative z-10 text-[14.5px] sm:text-[15px] font-medium text-gray-700 dark:text-[#e8eaed] leading-[1.7] tracking-tight [&>p]:m-0 break-keep [&_h3]:text-base [&_h3]:border-b [&_h3]:pb-3 [&_h3]:mb-4 [&_h3]:!-mt-5 sm:[&_h3]:!-mt-6 [&_h3]:-mx-5 sm:[&_h3]:-mx-6 [&_h3]:px-5 sm:[&_h3]:px-6 [&_h3]:pt-4 [&_h3]:flex [&_h3]:items-center [&_h3]:!border-l-0 [&_h3_span:last-child]:flex [&_h3_span:last-child]:items-center [&_h3_span:last-child]:gap-1.5 ${headerStyles[tone]}`}>
          {children}
        </div>
      </div>
    );
  },
  table: ({ children }) => (
    <div className="my-8">
      <PremiumCard hoverEffect={false} className="!p-0 overflow-x-auto shadow-sm">
        <table className="w-full text-[14px] border-collapse">{children}</table>
      </PremiumCard>
    </div>
  ),
  th: ({ children }) => (
    <th className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3.5 text-center font-bold text-[#1a73e8] dark:text-[#8ab4f8] border-b border-[#dadce0]">{children}</th>
  ),
  td: ({ children }) => (
    <td className="p-3.5 border-b border-[#f1f3f4] dark:border-[#3c4043] align-middle text-center text-[#202124] dark:text-[#e8eaed]">{children}</td>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-[#f8f9fa] dark:hover:bg-[#303134]/50 transition-colors">{children}</tr>
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
  ul: ({ children }) => <ul className="list-disc ml-5 sm:ml-6 my-5 space-y-2.5 text-[15.5px] sm:text-[16px] text-gray-800 dark:text-[#e8eaed] marker:text-[#1A73E8] dark:marker:text-[#8ab4f8]">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal ml-5 sm:ml-6 my-5 space-y-2.5 text-[15.5px] sm:text-[16px] text-gray-800 dark:text-[#e8eaed] marker:font-bold marker:text-[#1A73E8] dark:marker:text-[#8ab4f8]">{children}</ol>,
  li: ({ children }) => <li className="pl-1 leading-[1.8] break-keep">{children}</li>,
  strong: ({ children }) => {
    const getText = (n: any): string => {
      if (typeof n === 'string') return n;
      if (Array.isArray(n)) return n.map(getText).join('');
      if (n?.props?.children) return getText(n.props.children);
      return '';
    };
    const text = getText(children).trim();
    
    // 키워드 기반 동적 색상 매핑
    let colorClass = 'text-gray-900 dark:text-gray-100'; // 기본 검정/흰색 볼드
    
    if (/(거절|면책|부지급|삭감|주의|경고|위험|금지|불리|과실|기왕증|불가|제한|악용|분쟁|소송|실패|거부)/.test(text)) {
      colorClass = 'text-[#d93025] dark:text-[#f28b82]'; // Red
    } else if (/(지급|보상|합의|성공|가능|해결|유리|승소|안전|권리|인정|전액|확보)/.test(text)) {
      colorClass = 'text-[#137333] dark:text-[#81c995]'; // Green
    } else if (/(핵심|중요|필수|확인|점검|기준|원칙|주의사항|팁|노하우|명심)/.test(text)) {
      colorClass = 'text-[#e37400] dark:text-[#fde293]'; // Orange/Yellow
    } else if (/(전문가|손해사정사|의학|법률|판례|자문|소견)/.test(text)) {
      colorClass = 'text-[#9333ea] dark:text-[#c084fc]'; // Purple
    } else {
      // 일반적인 키워드는 기존처럼 파란색으로 하되 너무 남용되지 않도록 파란색 유지
      colorClass = 'text-[#1A73E8] dark:text-[#8ab4f8]'; // Blue
    }

    return (
      <strong className={`font-bold ${colorClass}`}>{children}</strong>
    );
  },
  hr: () => (
    <div className="my-16 flex justify-center">
      <div className="w-full h-px bg-gray-200 dark:bg-white/10"></div>
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
        <code className="px-1.5 py-0.5 mx-0.5 rounded bg-gray-100 dark:bg-[#303134] text-[#d93025] dark:text-[#f28b82] text-[0.9em] font-sans font-bold">
          {children}
        </code>
      );
    }
    return <code className="font-sans break-keep">{children}</code>;
  },
};

 
export const sharedComponents: any = {
  ...baseComponents,
  calculator: () => null,
  red: ({ children }: { children: React.ReactNode }) => <strong className="text-[#d93025] dark:text-[#f28b82] bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 mx-0.5 rounded-md font-bold">{children}</strong>,
  orange: ({ children }: { children: React.ReactNode }) => <strong className="text-[#e37400] dark:text-[#fde293] bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 mx-0.5 rounded-md font-bold">{children}</strong>,
  green: ({ children }: { children: React.ReactNode }) => <strong className="text-[#137333] dark:text-[#81c995] bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 mx-0.5 rounded-md font-bold">{children}</strong>,
  blue: ({ children }: { children: React.ReactNode }) => <strong className="text-[#1A73E8] dark:text-[#8ab4f8] bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 mx-0.5 rounded-md font-bold">{children}</strong>,
  purple: ({ children }: { children: React.ReactNode }) => <strong className="text-[#9333ea] dark:text-[#c084fc] bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 mx-0.5 rounded-md font-bold">{children}</strong>,
  
  // Alignment
  left: ({ children }: { children: React.ReactNode }) => <div className="text-left w-full">{children}</div>,
  center: ({ children }: { children: React.ReactNode }) => <div className="text-center w-full">{children}</div>,
  right: ({ children }: { children: React.ReactNode }) => <div className="text-right w-full">{children}</div>,
  
  // Background Colors
  'bg-yellow': ({ children }: { children: React.ReactNode }) => <span className="bg-yellow-200/60 dark:bg-yellow-900/40 px-1 py-0.5 rounded">{children}</span>,
  'bg-blue': ({ children }: { children: React.ReactNode }) => <span className="bg-blue-200/60 dark:bg-blue-900/40 px-1 py-0.5 rounded">{children}</span>,
  'bg-red': ({ children }: { children: React.ReactNode }) => <span className="bg-red-200/60 dark:bg-red-900/40 px-1 py-0.5 rounded">{children}</span>,
  'bg-green': ({ children }: { children: React.ReactNode }) => <span className="bg-green-200/60 dark:bg-green-900/40 px-1 py-0.5 rounded">{children}</span>,
  
  relatedbox: ({ children }: any) => (
    <PremiumCard borderColor="blue" hoverEffect={true} className="my-10 group">
      <div className="absolute right-[-10px] bottom-[-20px] opacity-[0.03] dark:opacity-[0.05] text-[120px] select-none pointer-events-none group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300">
        🔗
      </div>
      <div className="relative z-10">
        <div className="border-b border-gray-100 dark:border-white/5 pb-3 mb-4">
          <PremiumHeading level={3} showLeftBorder gradient="blue" icon={<span className="text-[var(--google-blue)] text-lg leading-none">🔗</span>} className="!mb-0">
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
  // 공문서 목차 기호(1., 1) 등)가 일반 리스트(<ol>)로 강제 변환되는 것을 막고 단락(Paragraph)으로 유지하기 위한 전처리.
  // 공문서 도메인에서는 1., 1) 등이 나열형 리스트가 아니라 섹션/위계 구분자이므로 Paragraph로 파싱하는 것이 시맨틱하게 옳습니다.
  const preProcessedContent = content
    .replace(/^([0-9]+)\.\s/gm, '$1\\. ')
    .replace(/^([0-9]+)\)\s/gm, '$1\\) ');

  const rendererComponents: any = {
    ...sharedComponents,
    p: ({ children }: { children: React.ReactNode }) => {
      if (inline) return <>{children}</>;

      const getText = (n: any): string => {
        if (typeof n === 'string') return n;
        if (Array.isArray(n)) return n.map(getText).join('');
        if (n?.props?.children) return getText(n.props.children);
        return '';
      };
      
      const fullText = getText(children);
      const docMarkerMatch = fullText.match(/^([1-9]+\.|[가-하]\.|[1-9]+\)|[가-하]\)|\([1-9]+\)|\([가-하]\)|[①-⑳]|[㉮-㉻])\s/);

      if (docMarkerMatch && React.Children.count(children) > 0) {
        const childrenArray = React.Children.toArray(children);
        const titleElements: React.ReactNode[] = [];
        const bodyElements: React.ReactNode[] = [];
        let isBody = false;

        for (const child of childrenArray) {
          if (isBody) {
            bodyElements.push(child);
            continue;
          }
          if (typeof child === 'string') {
            if (child.includes('\n')) {
              const parts = child.split('\n');
              titleElements.push(parts[0]);
              const rest = parts.slice(1).join('\n').trim();
              if (rest) bodyElements.push(rest);
              isBody = true;
            } else {
              titleElements.push(child);
            }
          } else if ((child as React.ReactElement)?.type === 'br') {
            isBody = true;
          } else {
            titleElements.push(child);
          }
        }

        if (isBody && bodyElements.length > 0) {
          return (
            <div className="my-8 bg-white dark:bg-[#202124] rounded-none shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-[#3c4043] overflow-hidden transition-all duration-300 hover:shadow-[0_16px_50px_rgba(26,115,232,0.25)] hover:border-blue-300 dark:hover:border-blue-800 group">
              <div className="bg-gradient-to-r from-blue-50/80 to-transparent dark:from-blue-900/20 dark:to-transparent px-5 py-3.5 border-b border-blue-100/50 dark:border-blue-900/30">
                <div className="font-bold text-[15.5px] text-[#1A73E8] dark:text-[#8ab4f8] flex items-start gap-1.5 break-keep">
                  {titleElements}
                </div>
              </div>
              <div className="px-5 py-4 text-[15px] leading-[1.8] text-gray-700 dark:text-[#e8eaed] break-keep [&>p]:mb-0">
                {bodyElements}
              </div>
            </div>
          );
        }
      }

      return (
        <p className="mb-5 leading-[1.85] text-[#202124] dark:text-[#e8eaed] break-keep">{children}</p>
      );
    },
  };

  return (
    <ReactMarkdown
      remarkPlugins={[[remarkGfm, { singleTilde: false }], remarkMath]}
      rehypePlugins={[rehypeRaw, rehypeSlug, rehypeKatex]}
      components={rendererComponents}
    >
      {preProcessedContent}
    </ReactMarkdown>
  );
}
