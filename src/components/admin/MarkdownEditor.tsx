import React, { useRef } from 'react';
import dynamic from 'next/dynamic';
import type { WysiwygEditorRef } from './WysiwygEditor';
import EditorToolbar from './EditorToolbar';

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

  const insertMarkdown = (template: string) => {
    editorRef.current?.insertText(template);
  };

  const wrapTextWithTag = (tagName: string, attributes: string = '') => {
    insertMarkdown(`<${tagName}${attributes}>텍스트</${tagName}>`);
  };

  const wrapWithMarkdown = (prefix: string, suffix: string = '') => {
    insertMarkdown(`${prefix}텍스트${suffix}`);
  };

  return (
    <div className="h-full flex flex-col min-w-0 bg-white dark:bg-zinc-950 overflow-hidden">
      
      {/* Editor Toolbar */}
      <EditorToolbar 
        insertMarkdown={insertMarkdown}
        wrapTextWithTag={wrapTextWithTag}
        wrapWithMarkdown={wrapWithMarkdown}
      />

      {/* Edge-to-edge white background for standard editor look */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-zinc-900">
        
        {/* Scrollable inner content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center">
          
          <div className="w-full max-w-4xl flex flex-col flex-1 px-5 md:px-8">
            
            {/* Document Title Input (Naver Style with divider) */}
            <div className="pt-12 md:pt-16 pb-6 shrink-0 border-b border-gray-200 dark:border-zinc-800 mb-4">
              <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="제목" 
                className="text-[40px] leading-tight font-light text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-zinc-700 bg-transparent outline-none w-full"
              />
            </div>

            {/* Editor Canvas (MDX Editor) */}
            <div className="pb-16 flex flex-col">
              <WysiwygEditor
                ref={editorRef}
                initialValue={content}
                onChange={(md) => setContent(md)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
