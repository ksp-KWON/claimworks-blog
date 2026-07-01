'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import type { Components } from 'react-markdown';

const SCROLL_OFFSET = 140;

const baseComponents: Components = {
  h1: ({ children, id }) => (
    <h1
      id={id}
      style={{ scrollMarginTop: `${SCROLL_OFFSET}px` }}
      className="text-[24px] sm:text-[28px] font-black text-[#202124] dark:text-[#e8eaed] mt-16 mb-8 pb-4 border-b-4 border-[#1a73e8] dark:border-[#8ab4f8] tracking-tight break-keep"
    >
      {children}
    </h1>
  ),
  h2: ({ children, id }) => (
    <h2
      id={id}
      style={{ scrollMarginTop: `${SCROLL_OFFSET}px` }}
      className="group flex items-center text-[20px] sm:text-[22px] font-black text-[#202124] dark:text-[#e8eaed] mt-14 mb-6 px-4 sm:px-5 py-3.5 bg-gradient-to-r from-gray-50 to-transparent dark:from-white/5 dark:to-transparent border-l-[6px] border-[#1a73e8] dark:border-[#8ab4f8] tracking-tight break-keep"
    >
      {children}
    </h2>
  ),
  h3: ({ children, id }) => (
    <h3
      id={id}
      style={{ scrollMarginTop: `${SCROLL_OFFSET}px` }}
      className="flex items-center gap-2 text-[17px] sm:text-[18px] font-bold text-[#3c4043] dark:text-[#e8eaed] mt-10 mb-4 px-1 tracking-tight break-keep"
    >
      <span className="text-[#1a73e8] dark:text-[#8ab4f8]">■</span>
      {children}
    </h3>
  ),
  blockquote: ({ children }) => (
    <div className="my-7 px-5 py-4 bg-gradient-to-br from-yellow-50/80 to-orange-50/50 dark:from-[#fbbc04]/10 dark:to-[#ea4335]/5 border border-yellow-200/50 dark:border-white/5 border-l-4 border-l-[#fbbc04] dark:border-l-[#fbbc04] text-[15px] font-medium text-gray-800 dark:text-[#e8eaed] leading-[1.7] tracking-tight [&>p]:m-0 break-keep shadow-sm">
      {children}
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
    <td className="p-3.5 border-b border-[#f1f3f4] dark:border-[#3c4043] align-middle text-center text-[#202124] dark:text-[#e8eaed]">{children}</td>
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
export const sharedComponents: any = {
  ...baseComponents,
  calculator: () => null,
  red: ({ children }: { children: React.ReactNode }) => <strong className="text-[#d93025] dark:text-[#f28b82] font-bold">{children}</strong>,
  orange: ({ children }: { children: React.ReactNode }) => <strong className="text-[#f29900] dark:text-[#fde293] font-bold">{children}</strong>,
  green: ({ children }: { children: React.ReactNode }) => <strong className="text-[#34A853] dark:text-[#81c995] font-bold">{children}</strong>,
  blue: ({ children }: { children: React.ReactNode }) => <strong className="text-[#1A73E8] dark:text-[#8ab4f8] font-bold">{children}</strong>,
  purple: ({ children }: { children: React.ReactNode }) => <strong className="text-[#9333ea] dark:text-[#c084fc] font-bold">{children}</strong>,
  
  // Alignment
  left: ({ children }: { children: React.ReactNode }) => <div className="text-left w-full">{children}</div>,
  center: ({ children }: { children: React.ReactNode }) => <div className="text-center w-full">{children}</div>,
  right: ({ children }: { children: React.ReactNode }) => <div className="text-right w-full">{children}</div>,
  
  // Background Colors
  'bg-yellow': ({ children }: { children: React.ReactNode }) => <span className="bg-yellow-200/60 dark:bg-yellow-900/40 px-1 py-0.5 rounded">{children}</span>,
  'bg-blue': ({ children }: { children: React.ReactNode }) => <span className="bg-blue-200/60 dark:bg-blue-900/40 px-1 py-0.5 rounded">{children}</span>,
  'bg-red': ({ children }: { children: React.ReactNode }) => <span className="bg-red-200/60 dark:bg-red-900/40 px-1 py-0.5 rounded">{children}</span>,
  'bg-green': ({ children }: { children: React.ReactNode }) => <span className="bg-green-200/60 dark:bg-green-900/40 px-1 py-0.5 rounded">{children}</span>,
  
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
          <span className="flex-shrink-0 w-8 h-8 rounded-none border border-[#1A73E8]/30 dark:border-[#8ab4f8]/30 bg-white dark:bg-[#1a2540] flex items-center justify-center shadow-sm">
            <svg className="w-4 h-4 text-[#1A73E8] dark:text-[#8ab4f8] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </span>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-extrabold text-[#1A73E8] dark:text-[#8ab4f8] uppercase tracking-wider mb-0.5">관련 추천 글</span>
            <span className="text-[13.5px] sm:text-[14px] font-extrabold text-gray-800 dark:text-[#e8eaed] leading-snug group-hover:text-[#1A73E8] dark:group-hover:text-[#8ab4f8] transition-colors">{text}</span>
          </div>
        </div>
      </a>
    );
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

interface MarkdownRendererProps {
  content: string;
  inline?: boolean;
}

export default function MarkdownRenderer({ content, inline = false }: MarkdownRendererProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rendererComponents: any = {
    ...sharedComponents,
    p: ({ children }: { children: React.ReactNode }) => (
      inline ? (
        <>{children}</>
      ) : (
        <p className="mb-5 leading-[1.85] text-[#202124] dark:text-[#e8eaed]">{children}</p>
      )
    ),
  };

  return (
    <ReactMarkdown
      remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
      rehypePlugins={[rehypeRaw, rehypeSlug]}
      components={rendererComponents}
    >
      {content}
    </ReactMarkdown>
  );
}
