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
          <div className="flex gap-1 items-center border-r border-gray-200 dark:border-zinc-700 pr-3 shrink-0">
            {[
              { title: '왼쪽 정렬', tag: 'left', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h10M4 18h16" /></svg> },
              { title: '가운데 정렬', tag: 'center', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M7 12h10M4 18h16" /></svg> },
              { title: '오른쪽 정렬', tag: 'right', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M10 12h10M4 18h16" /></svg> }
            ].map(item => (
              <button key={item.title} title={item.title} onClick={() => wrapTextWithTag(item.tag)} className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors flex items-center justify-center">
                {item.icon}
              </button>
            ))}
          </div>

          {/* Portal Target for MDX Editor Toolbar */}
          <div id="custom-toolbar-portal" className="flex items-center shrink-0"></div>

          <div className="flex gap-1 items-center border-r border-gray-200 dark:border-zinc-700 pr-3 shrink-0">
            {[
              { title: '빨강 글자색', tag: 'red', color: 'bg-red-500' },
              { title: '파랑 글자색', tag: 'blue', color: 'bg-blue-500' },
              { title: '초록 글자색', tag: 'green', color: 'bg-green-500' },
              { title: '보라 글자색', tag: 'purple', color: 'bg-purple-500' }
            ].map(item => (
              <button key={item.title} title={item.title} onClick={() => wrapTextWithTag(item.tag)} className="p-1.5 w-7 h-7 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors flex items-center justify-center">
                <div className={`w-3.5 h-3.5 rounded-full ${item.color} border border-black/10 dark:border-white/10`} />
              </button>
            ))}
          </div>

          <div className="flex gap-1 items-center shrink-0">
            <span className="text-[10px] font-bold text-[#03c75a] mr-2 ml-1">전용 템플릿</span>
            {[
              { title: '용어사전', template: '\n> 💡 **[용어명]** : 설명(입력하세요)\n', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
              { title: '팁 (Tip)', template: '\n> [!TIP]\n> 팁 내용(입력하세요)\n', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> },
              { title: '경고', template: '\n> [!WARNING]\n> 경고 내용(입력하세요)\n', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> },
              { title: '요점박스', template: '\n## [🎯 Key Points]\n- 요점 1\n- 요점 2\n', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
              { title: '자가진단', template: '\n## [✅ (보험/보상) 1분 자가진단 체크리스트]\n- [ ] 조건 1\n- [ ] 조건 2\n', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
              { title: 'FAQ', template: '\n## [💡 자주 묻는 질문 (FAQ) TOP 3]\n### Q1. 질문?\n답변.\n', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
              { title: '車계산기', template: '\n<calculator type="auto"></calculator>\n', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> }
            ].map(item => (
              <button key={item.title} title={item.title} onClick={() => insertMarkdown(item.template)} className="p-1.5 text-[#03c75a] hover:bg-[#03c75a]/10 rounded transition-colors flex items-center justify-center">
                {item.icon}
              </button>
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
