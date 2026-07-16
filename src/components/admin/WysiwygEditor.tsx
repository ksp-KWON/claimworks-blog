import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { sharedComponents } from '@/components/blog/MarkdownRenderer';
import rehypeRaw from 'rehype-raw';

// Dynamically import MDEditor to prevent SSR issues in Next.js
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false, loading: () => <div className="p-8 text-center text-gray-500">에디터 로딩 중...</div> }
);

interface WysiwygEditorProps {
  initialValue: string;
  onChange: (markdown: string) => void;
}

export interface WysiwygEditorRef {
  insertText: (text: string) => void;
  setMarkdown: (markdown: string) => void;
  getMarkdown: () => string;
}

const WysiwygEditor = forwardRef<WysiwygEditorRef, WysiwygEditorProps>(({ initialValue, onChange }, ref) => {
  const [value, setValue] = useState(initialValue || '');

  useImperativeHandle(ref, () => ({
    insertText: (text: string) => {
      setValue(prev => prev + '\n' + text);
      onChange(value + '\n' + text);
    },
    setMarkdown: (markdown: string) => {
      setValue(markdown);
      onChange(markdown);
    },
    getMarkdown: () => {
      return value;
    }
  }));

  useEffect(() => {
    if (initialValue !== value) {
      setValue(initialValue || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue]);

  const handleChange = (val?: string) => {
    const md = val || '';
    setValue(md);
    onChange(md);
  };

  return (
    <div className="w-full h-full min-h-[600px] bg-white dark:bg-zinc-950 uiw-editor-container" data-color-mode="light">
      <MDEditor
        value={value}
        onChange={handleChange}
        height="100%"
        minHeight={600}
        visibleDragbar={false}
        previewOptions={{
          rehypePlugins: [rehypeRaw],
          components: sharedComponents
        }}
        className="!border-0 !shadow-none"
      />
      <style>{`
        .uiw-editor-container .w-md-editor {
          background-color: transparent !important;
          box-shadow: none !important;
        }
        .uiw-editor-container .w-md-editor-toolbar {
          border-bottom: 1px solid #e5e7eb;
          background-color: transparent !important;
          padding: 8px !important;
        }
        .uiw-editor-container .w-md-editor-content {
          background-color: transparent !important;
        }
        @media (prefers-color-scheme: dark) {
          .uiw-editor-container {
            data-color-mode: "dark";
          }
          .uiw-editor-container .w-md-editor-toolbar {
            border-bottom: 1px solid #27272a;
          }
        }
      `}</style>
    </div>
  );
});

WysiwygEditor.displayName = 'WysiwygEditor';

export default WysiwygEditor;
