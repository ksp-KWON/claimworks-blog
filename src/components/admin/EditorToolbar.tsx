import React, { useState, useEffect } from 'react';

interface EditorToolbarProps {
  insertMarkdown: (template: string) => void;
  wrapTextWithTag: (tag: string) => void;
  wrapWithMarkdown: (prefix: string, suffix?: string) => void;
}

const COLORS = [
  '#000000', '#424242', '#636363', '#9C9C9C', '#C6C6C6', '#E7E7E7', '#F1F1F1', '#FFFFFF',
  '#FF0000', '#FF9C00', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#9C00FF', '#FF00FF',
  '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3', '#D0E0E3', '#CFE2F3', '#D9D2E9', '#EAD1DC',
  '#EA9999', '#F9CB9C', '#FFE599', '#B6D7A8', '#A2C4C9', '#9FC5E8', '#B4A7D6', '#D5A6BD',
  '#E06666', '#F6B26B', '#FFD966', '#93C47D', '#76A5AF', '#6FA8DC', '#8E7CC3', '#C27BA0',
  '#CC0000', '#E69138', '#F1C232', '#6AA84F', '#45818E', '#3D85C6', '#674EA7', '#A64D79',
  '#990000', '#B45F06', '#BF9000', '#38761D', '#134F5C', '#0B5394', '#351C75', '#741B47',
  '#660000', '#783F04', '#7F6000', '#274E13', '#0C343D', '#073763', '#20124D', '#4C1130'
];

export default function EditorToolbar({
  insertMarkdown,
  wrapTextWithTag,
  wrapWithMarkdown
}: EditorToolbarProps) {
  const [isModeOpen, setIsModeOpen] = useState(false);
  const [isBlockTypeOpen, setIsBlockTypeOpen] = useState(false);
  const [isTextColorOpen, setIsTextColorOpen] = useState(false);
  const [isBgColorOpen, setIsBgColorOpen] = useState(false);
  const [isAlignOpen, setIsAlignOpen] = useState(false);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown="block"]')) setIsBlockTypeOpen(false);
      if (!target.closest('[data-dropdown="textColor"]')) setIsTextColorOpen(false);
      if (!target.closest('[data-dropdown="bgColor"]')) setIsBgColorOpen(false);
      if (!target.closest('[data-dropdown="align"]')) setIsAlignOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleColorSelect = (color: string, isBg: boolean) => {
    const styleStr = isBg ? `background-color: ${color}` : `color: ${color}`;
    // Insert HTML span for color
    insertMarkdown(`<span style="${styleStr}">텍스트</span>`);
  };

  return (
    <div 
      className="sticky top-0 z-20 flex flex-wrap gap-1 p-2 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 shadow-sm items-center text-gray-700 dark:text-gray-300"
      onMouseDown={e => {
        // Prevent losing focus in the editor, unless they are clicking inside an input (if any)
        if ((e.target as HTMLElement).tagName !== 'INPUT') {
          e.preventDefault();
        }
      }}
    >
      
      <div id="custom-toolbar-portal" className="pr-2 mr-2 border-r border-gray-200 dark:border-zinc-700"></div>

      {/* Undo/Redo */}
      <div className="flex gap-1 pr-2 border-r border-gray-200 dark:border-zinc-700">
        <button onClick={() => document.execCommand('undo')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded" title="실행 취소">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
        </button>
        <button onClick={() => document.execCommand('redo')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded" title="다시 실행">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
        </button>
      </div>

      {/* Block Type (Heading) */}
      <div className="relative pr-2 border-r border-gray-200 dark:border-zinc-700" data-dropdown="block">
        <button 
          onClick={() => setIsBlockTypeOpen(!isBlockTypeOpen)}
          className="flex items-center gap-1 p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded text-sm min-w-[80px]"
        >
          단락 형식
          <svg className="w-3 h-3 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
        </button>
        {isBlockTypeOpen && (
          <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-lg rounded py-1 z-50">
            <button onClick={() => { wrapWithMarkdown('# ', ''); setIsBlockTypeOpen(false); }} className="w-full text-left px-4 py-2 text-xl font-bold hover:bg-gray-100 dark:hover:bg-zinc-700">주 제목</button>
            <button onClick={() => { wrapWithMarkdown('## ', ''); setIsBlockTypeOpen(false); }} className="w-full text-left px-4 py-2 text-lg font-bold hover:bg-gray-100 dark:hover:bg-zinc-700">제목</button>
            <button onClick={() => { wrapWithMarkdown('### ', ''); setIsBlockTypeOpen(false); }} className="w-full text-left px-4 py-2 text-md font-bold hover:bg-gray-100 dark:hover:bg-zinc-700">부제목</button>
            <button onClick={() => { wrapWithMarkdown('#### ', ''); setIsBlockTypeOpen(false); }} className="w-full text-left px-4 py-2 text-sm font-bold hover:bg-gray-100 dark:hover:bg-zinc-700">소제목</button>
          </div>
        )}
      </div>

      {/* Formatting (B, I, U, Strike) */}
      <div className="flex gap-1 pr-2 border-r border-gray-200 dark:border-zinc-700">
        <button onClick={() => wrapWithMarkdown('**', '**')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded font-serif font-bold w-7 h-7 flex justify-center items-center" title="굵게">B</button>
        <button onClick={() => wrapWithMarkdown('*', '*')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded font-serif italic w-7 h-7 flex justify-center items-center" title="기울임">I</button>
        <button onClick={() => wrapTextWithTag('u')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded font-serif underline w-7 h-7 flex justify-center items-center" title="밑줄">U</button>
        <button onClick={() => wrapWithMarkdown('~~', '~~')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded font-serif line-through w-7 h-7 flex justify-center items-center" title="취소선">S</button>
      </div>

      {/* Colors (Text, Bg) */}
      <div className="flex gap-1 pr-2 border-r border-gray-200 dark:border-zinc-700 relative">
        <div data-dropdown="textColor">
          <button onClick={() => { setIsTextColorOpen(!isTextColorOpen); setIsBgColorOpen(false); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded flex flex-col items-center justify-center w-7 h-7" title="글자 색상">
            <span className="font-serif font-bold text-xs leading-none">A</span>
            <div className="w-3 h-1 bg-red-500 mt-0.5"></div>
          </button>
          {isTextColorOpen && (
            <div className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-xl rounded p-2 z-50">
              <div className="text-xs font-bold mb-2">글자 색상</div>
              <div className="grid grid-cols-8 gap-1">
                {COLORS.map(c => (
                  <button key={c} onClick={() => { handleColorSelect(c, false); setIsTextColorOpen(false); }} className="w-5 h-5 rounded-sm border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform" style={{ backgroundColor: c }} title={c} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div data-dropdown="bgColor">
          <button onClick={() => { setIsBgColorOpen(!isBgColorOpen); setIsTextColorOpen(false); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded flex flex-col items-center justify-center w-7 h-7" title="배경 색상">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            <div className="w-3 h-1 bg-yellow-400 mt-0.5"></div>
          </button>
          {isBgColorOpen && (
            <div className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-xl rounded p-2 z-50">
              <div className="text-xs font-bold mb-2">배경 색상</div>
              <div className="grid grid-cols-8 gap-1">
                {COLORS.map(c => (
                  <button key={c} onClick={() => { handleColorSelect(c, true); setIsBgColorOpen(false); }} className="w-5 h-5 rounded-sm border border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform" style={{ backgroundColor: c }} title={c} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Insertions (Link, Image, Video, Emoji) */}
      <div className="flex gap-1 pr-2 border-r border-gray-200 dark:border-zinc-700">
        <button onClick={() => wrapWithMarkdown('[텍스트](', ')')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded" title="링크 삽입">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
        </button>
        <button onClick={() => insertMarkdown('\n![이미지 대체 텍스트](이미지주소)\n')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded" title="이미지 삽입">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </button>
        <button onClick={() => insertMarkdown('\n<video src="동영상주소" controls width="100%"></video>\n')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded" title="동영상 삽입">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        </button>
        <button onClick={() => insertMarkdown('😊')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded" title="특수문자 삽입">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </button>
      </div>

      {/* Align Dropdown */}
      <div className="relative pr-2 border-r border-gray-200 dark:border-zinc-700" data-dropdown="align">
        <button onClick={() => setIsAlignOpen(!isAlignOpen)} className="flex items-center gap-1 p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded" title="정렬">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h10M4 18h16" /></svg>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
        </button>
        {isAlignOpen && (
          <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-lg rounded py-1 z-50">
            <button onClick={() => { wrapTextWithTag('left'); setIsAlignOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h10M4 18h16" /></svg> 왼쪽 맞춤
            </button>
            <button onClick={() => { wrapTextWithTag('center'); setIsAlignOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M7 12h10M4 18h16" /></svg> 가운데 맞춤
            </button>
            <button onClick={() => { wrapTextWithTag('right'); setIsAlignOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M10 12h10M4 18h16" /></svg> 오른쪽 맞춤
            </button>
            <button onClick={() => { wrapTextWithTag('justify'); setIsAlignOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-zinc-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg> 양쪽 맞춤
            </button>
          </div>
        )}
      </div>

      {/* Indent / Outdent */}
      <div className="flex gap-1 pr-2 border-r border-gray-200 dark:border-zinc-700">
        <button onClick={() => wrapWithMarkdown('\n> ', '')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded" title="내어쓰기 (인용구)">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <button onClick={() => insertMarkdown('&nbsp;&nbsp;&nbsp;&nbsp;')} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded" title="들여쓰기">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>
      </div>

      {/* Custom Templates */}
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
  );
}
