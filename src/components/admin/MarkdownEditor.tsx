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

  const insertMarkdown = (template: string) => {
    editorRef.current?.insertText('\n' + template);
  };

  const wrapTextWithTag = (tagName: string) => {
    const wrapped = `<${tagName}>텍스트</${tagName}>`;
    editorRef.current?.insertText(wrapped);
  };

  const wrapWithMarkdown = (prefix: string, suffix: string = '') => {
    const wrapped = `${prefix}텍스트${suffix}`;
    editorRef.current?.insertText(wrapped);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#f9f9f9] dark:bg-zinc-950 overflow-y-auto">
      
      {/* Markdown Toolbar (Sticky Top) */}
      <div className="sticky top-0 z-20 flex flex-col gap-2 p-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-wrap gap-4 items-center justify-center max-w-5xl mx-auto w-full">
          <div className="flex gap-1 items-center border-r border-gray-200 dark:border-zinc-700 pr-4 shrink-0">
            <span className="text-[10px] font-bold text-gray-400 mr-1">정렬</span>
            {[
              { label: '⬅️ 좌', tag: 'left' },
              { label: '↔️ 중', tag: 'center' },
              { label: '➡️ 우', tag: 'right' }
            ].map(item => (
              <button key={item.label} onClick={() => wrapTextWithTag(item.tag)} className="px-2 py-1 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-[11px] font-bold transition-colors">{item.label}</button>
            ))}
          </div>

          <div className="flex gap-1 items-center border-r border-gray-200 dark:border-zinc-700 pr-4 shrink-0">
            <span className="text-[10px] font-bold text-gray-400 mr-1">서식</span>
            {[
              { label: '굵게(B)', prefix: '**', suffix: '**' },
              { label: '기울임(I)', prefix: '*', suffix: '*' },
              { label: '취소선', prefix: '~~', suffix: '~~' },
              { label: '인용구(”")', prefix: '\n> ', suffix: '' },
            ].map(item => (
              <button key={item.label} onClick={() => wrapWithMarkdown(item.prefix, item.suffix)} className="px-2 py-1 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-[11px] font-bold transition-colors">{item.label}</button>
            ))}
          </div>

          <div className="flex gap-1 items-center border-r border-gray-200 dark:border-zinc-700 pr-4 shrink-0">
            <span className="text-[10px] font-bold text-gray-400 mr-1">글자색</span>
            {[
              { label: '빨강', tag: 'red' },
              { label: '파랑', tag: 'blue' },
              { label: '초록', tag: 'green' },
              { label: '보라', tag: 'purple' }
            ].map(item => (
              <button key={item.label} onClick={() => wrapTextWithTag(item.tag)} className="px-2 py-1 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-[11px] font-bold transition-colors">{item.label}</button>
            ))}
          </div>

          <div className="flex gap-1 items-center shrink-0">
            <span className="text-[10px] font-bold text-[#03c75a] mr-1">보상스쿨 전용 박스</span>
            {[
              { label: '📖 용어사전', template: '\n> 💡 **[용어명]** : 설명(입력하세요)\n' },
              { label: '💡 팁', template: '\n> [!TIP]\n> 팁 내용(입력하세요)\n' },
              { label: '⚠️ 경고', template: '\n> [!WARNING]\n> 경고 내용(입력하세요)\n' },
              { label: '📌 요점박스', template: '\n## [🎯 Key Points]\n- 요점 1\n- 요점 2\n' },
              { label: '☑️ 자가진단', template: '\n## [✅ (보험/보상) 1분 자가진단 체크리스트]\n- [ ] 조건 1\n- [ ] 조건 2\n' },
              { label: '💬 FAQ', template: '\n## [💡 자주 묻는 질문 (FAQ) TOP 3]\n### Q1. 질문?\n답변.\n' },
              { label: '🚘 車계산기', template: '\n<calculator type="auto"></calculator>\n' }
            ].map(item => (
              <button key={item.label} onClick={() => insertMarkdown(item.template)} className="px-2.5 py-1.5 bg-[#eaf9f1] hover:bg-[#d5f3e3] dark:bg-[#03c75a]/10 text-[#03c75a] border border-[#03c75a]/30 rounded text-[11px] font-bold transition-colors shadow-sm">{item.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor Canvas (A4 Paper Style) */}
      <div className="flex-1 py-10 px-4 md:px-0 pb-32">
        <div className="max-w-[850px] mx-auto bg-white dark:bg-zinc-900 min-h-[1000px] shadow-sm border border-gray-100 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col">
          
          {/* Document Title Input */}
          <div className="px-10 pt-16 pb-4">
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="제목" 
              className="text-[40px] leading-tight font-light text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-zinc-700 bg-transparent outline-none w-full"
            />
          </div>

          {/* WysiwygEditor Wrapper */}
          <div className="flex-1 px-6 pb-16">
            <WysiwygEditor
              ref={editorRef}
              initialValue={content}
              onChange={(md) => setContent(md)}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
