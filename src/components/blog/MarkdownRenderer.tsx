'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import type { Components } from 'react-markdown';
import PremiumHeading from '../ui/PremiumHeading';
import PremiumCard from '../ui/PremiumCard';

const SCROLL_OFFSET = 140;

const baseComponents: Components = {
  h1: ({ children, id }) => (
    <PremiumHeading level={1} id={id} style={{ scrollMarginTop: `${SCROLL_OFFSET}px` }} className="mt-16 mb-8 pb-4 border-b-4 border-[var(--google-blue)] dark:border-[#8ab4f8] break-keep">
      {children}
    </PremiumHeading>
  ),
  h2: ({ children, id }) => (
    <PremiumHeading level={2} id={id} showLeftBorder gradient="blue" style={{ scrollMarginTop: `${SCROLL_OFFSET}px` }} className="mt-14 mb-6 py-3 bg-gradient-to-r from-gray-50 to-transparent dark:from-white/5 dark:to-transparent break-keep">
      {children}
    </PremiumHeading>
  ),
  h3: ({ children, id }) => (
    <PremiumHeading level={3} id={id} style={{ scrollMarginTop: `${SCROLL_OFFSET}px` }} className="mt-10 mb-4 break-keep" icon={<span className="text-[var(--google-blue)]">■</span>}>
      {children}
    </PremiumHeading>
  ),
  h4: ({ children, id }) => (
    <PremiumHeading level={4} id={id} style={{ scrollMarginTop: `${SCROLL_OFFSET}px` }} className="mt-8 mb-3 break-keep text-gray-700 dark:text-gray-300" icon={<span className="text-[var(--google-blue)]/70">▸</span>}>
      {children}
    </PremiumHeading>
  ),
  h5: ({ children, id }) => (
    <PremiumHeading level={5} id={id} style={{ scrollMarginTop: `${SCROLL_OFFSET}px` }} className="mt-6 mb-2 break-keep text-gray-500 dark:text-gray-400">
      {children}
    </PremiumHeading>
  ),
  blockquote: ({ children }) => (
    <PremiumCard borderColor="yellow" hoverEffect={false} className="my-7 !p-5 border-l-4 !border-l-[#fbbc04] bg-gradient-to-br from-yellow-50/80 to-orange-50/50 dark:from-[#fbbc04]/10 dark:to-[#ea4335]/5 shadow-sm">
      <div className="text-[15px] font-medium text-gray-800 dark:text-[#e8eaed] leading-[1.7] tracking-tight [&>p]:m-0 break-keep">
        {children}
      </div>
    </PremiumCard>
  ),
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
  pre: ({ children }) => (
    <pre className="whitespace-pre-wrap break-words bg-gray-50 dark:bg-[#303134] p-4 sm:p-5 rounded-md border border-gray-200 dark:border-white/10 my-6 text-[#202124] dark:text-[#e8eaed] font-sans text-[14.5px] sm:text-[15.5px] leading-relaxed shadow-sm overflow-x-hidden">
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
