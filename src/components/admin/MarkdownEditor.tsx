import React, { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { WysiwygEditorRef } from './WysiwygEditor';
import EditorToolbar from './EditorToolbar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

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
  const [editorMode, setEditorMode] = useState<'wysiwyg' | 'markdown' | 'html'>('wysiwyg');
  const markdownTextareaRef = useRef<HTMLTextAreaElement>(null);

  const getSelectedText = () => {
    let selectedText = '텍스트';
    if (editorMode === 'markdown' && markdownTextareaRef.current) {
      const textarea = markdownTextareaRef.current;
      selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd) || '텍스트';
    } else if (editorMode === 'wysiwyg') {
      const sel = window.getSelection();
      if (sel && sel.toString().trim() !== '') {
        selectedText = sel.toString();
      }
    }
    return selectedText;
  };

  const insertMarkdown = (template: string) => {
    if (editorMode === 'wysiwyg') {
      editorRef.current?.insertText(template);
    } else if (editorMode === 'markdown' && markdownTextareaRef.current) {
      const textarea = markdownTextareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      setContent(before + template + after);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + template.length;
        textarea.focus();
      }, 0);
    }
  };

  const wrapTextWithTag = (tagName: string, attributes: string = '') => {
    const selected = getSelectedText();
    const wrapped = `<${tagName}${attributes}>${selected}</${tagName}>`;
    insertMarkdown(wrapped);
  };

  const wrapWithMarkdown = (prefix: string, suffix: string = '') => {
    const selected = getSelectedText();
    const wrapped = `${prefix}${selected}${suffix}`;
    insertMarkdown(wrapped);
  };

  return (
    <div className="h-full flex flex-col min-w-0 bg-[#f9f9f9] dark:bg-zinc-950 overflow-hidden">
      
      {/* Editor Toolbar */}
      <EditorToolbar 
        editorMode={editorMode}
        setEditorMode={setEditorMode}
        insertMarkdown={insertMarkdown}
        wrapTextWithTag={wrapTextWithTag}
        wrapWithMarkdown={wrapWithMarkdown}
      />

      {/* Canvas wrapper with % padding to fill available space nicely */}
      <div className="flex-1 p-[2%] md:p-[3%] bg-gray-100 dark:bg-zinc-950 flex flex-col overflow-hidden">
        <div className="flex-1 w-full bg-white dark:bg-zinc-900 shadow-[0_4px_24px_rgba(0,0,0,0.10)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.5)] border border-gray-200 dark:border-zinc-700 flex flex-col overflow-hidden">
          
          {/* Scrollable inner content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
            {/* Document Title Input */}
            <div className="px-6 md:px-10 pt-10 md:pt-16 pb-4 shrink-0">
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="제목" 
              className="text-[40px] leading-tight font-light text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-zinc-700 bg-transparent outline-none w-full"
            />
          </div>

            {/* Editor Canvas Depending on Mode */}
            <div className="flex-1 px-6 md:px-10 pb-8 flex flex-col min-h-0">
            {editorMode === 'wysiwyg' && (
              <WysiwygEditor
                ref={editorRef}
                initialValue={content}
                onChange={(md) => setContent(md)}
              />
            )}
            
            {editorMode === 'markdown' && (
                <textarea
                  ref={markdownTextareaRef}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full h-full min-h-[300px] flex-1 p-4 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 font-mono text-sm outline-none resize-none rounded-lg border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 custom-scrollbar"
                  placeholder="마크다운 소스를 입력하세요..."
                />
            )}

            {editorMode === 'html' && (
              <div className="w-full h-full min-h-[300px] flex-1 p-4 md:p-8 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-y-auto custom-scrollbar prose prose-sm max-w-none dark:prose-invert">
                <div className="mb-4 text-xs font-bold text-gray-400">읽기 전용 HTML 미리보기 (실제 포스팅 화면)</div>
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                  {content}
                </ReactMarkdown>
              </div>
            )}
            </div>
          </div>
      </div>
    </div>
  );
}
