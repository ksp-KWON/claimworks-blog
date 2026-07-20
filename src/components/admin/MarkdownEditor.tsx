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
    <div className="flex flex-col min-w-0 bg-white dark:bg-zinc-950">
      {/* Editor Toolbar Portal Target */}
      <div 
        id="custom-toolbar-portal" 
        className="sticky top-0 z-20 flex flex-wrap gap-1 p-2 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 shadow-sm items-center text-gray-700 dark:text-gray-300 min-h-[48px] w-full"
      ></div>

      {/* Editor Canvas */}
      <div className="w-full max-w-4xl mx-auto px-5 md:px-8">
        
        {/* Document Title */}
        <div className="pt-12 md:pt-16 pb-6 shrink-0 border-b border-gray-200 dark:border-zinc-800 mb-4">
          <input 
            type="text" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="제목" 
            className="text-[40px] leading-tight font-light text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-zinc-700 bg-transparent outline-none w-full"
          />
        </div>

        {/* MDX Editor */}
        <div className="pb-16">
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
