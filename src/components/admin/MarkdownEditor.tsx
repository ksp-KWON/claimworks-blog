import React, { useRef } from 'react';
import dynamic from 'next/dynamic';
import type { WysiwygEditorRef } from './WysiwygEditor';


const WysiwygEditor = dynamic(() => import('./WysiwygEditor'), { ssr: false });

interface MarkdownEditorProps {
  title: string;
  setTitle: (val: string) => void;
  slug?: string;
  setSlug?: (val: string) => void;
  content: string;
  setContent: (val: string | ((prev: string) => string)) => void;
}

export default function MarkdownEditor({
  title, setTitle,
  slug = '', setSlug,
  content, setContent
}: MarkdownEditorProps) {
  
  const editorRef = useRef<WysiwygEditorRef>(null);

  return (
    <div className="flex flex-col min-w-0 w-full bg-white dark:bg-zinc-950">
      {/* Editor Toolbar Portal Target (2줄 반응형 및 모바일 최적화) */}
      <div 
        id="custom-toolbar-portal" 
        className="sticky top-0 z-20 flex flex-col sm:flex-row p-1.5 sm:p-2 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 shadow-sm text-gray-700 dark:text-gray-300 min-h-[44px] w-full min-w-0"
      ></div>

      {/* Editor Canvas */}
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 md:px-8">
        
        {/* Document Title & SEO Slug */}
        <div className="pt-4 sm:pt-8 md:pt-12 pb-4 sm:pb-6 shrink-0 border-b border-gray-200 dark:border-zinc-800 mb-4 space-y-2">
          <input 
            type="text" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="제목을 입력하세요" 
            className="text-2xl sm:text-3xl md:text-[38px] leading-tight font-medium text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-zinc-700 bg-transparent outline-none w-full tracking-tight"
          />

          {/* 영문 시맨틱 URL(슬러그) 입력 바 */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400 bg-gray-50/80 dark:bg-zinc-900/60 p-2 border border-gray-200/80 dark:border-zinc-800 rounded-none font-mono">
            <span className="shrink-0 text-gray-400 dark:text-zinc-500 font-bold select-none">URL: https://claim-works.com/blog/</span>
            <input
              type="text"
              value={slug}
              onChange={e => setSlug?.(e.target.value)}
              placeholder="영문-슬러그-입력 (예: traffic-accident-settlement-guide)"
              className="flex-1 bg-transparent border-none outline-none text-blue-600 dark:text-blue-400 font-semibold placeholder-gray-400 dark:placeholder-zinc-600 text-xs min-w-0"
            />
          </div>
        </div>

        {/* MDX Editor */}
        <div className="pb-16 min-w-0">
          <WysiwygEditor
            ref={editorRef}
            initialValue={content}
            onChange={(md) => setContent(md)}
          />
        </div>
      </div>
    </div>
  );
}
