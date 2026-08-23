import React, { useRef } from 'react';
import dynamic from 'next/dynamic';
import type { WysiwygEditorRef } from './WysiwygEditor';


const WysiwygEditor = dynamic(() => import('./WysiwygEditor'), { ssr: false });

interface MarkdownEditorProps {
  title: string;
  setTitle: (val: string) => void;
  content: string;
  setContent: (val: string | ((prev: string) => string)) => void;
}

export default function MarkdownEditor({
  title, setTitle,
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
        
        {/* Document Title */}
        <div className="pt-4 sm:pt-8 md:pt-12 pb-4 sm:pb-6 shrink-0 border-b border-gray-200 dark:border-zinc-800 mb-4">
          <input 
            type="text" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="제목을 입력하세요" 
            className="text-2xl sm:text-3xl md:text-[38px] leading-tight font-medium text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-zinc-700 bg-transparent outline-none w-full tracking-tight"
          />
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
