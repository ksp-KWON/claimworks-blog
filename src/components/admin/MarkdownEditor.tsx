import React, { useRef } from 'react';

interface MarkdownEditorProps {
  title: string;
  setTitle: (val: string) => void;
  summary: string;
  setSummary: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  tagsInput: string;
  setTagsInput: (val: string) => void;
  content: string;
  setContent: (val: string | ((prev: string) => string)) => void;
}

export default function MarkdownEditor({
  title, setTitle,
  summary, setSummary,
  category, setCategory,
  tagsInput, setTagsInput,
  content, setContent
}: MarkdownEditorProps) {
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (template: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent(prev => prev + '\n' + template);
      return;
    }
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    
    setContent(before + template + after);
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + template.length;
    }, 0);
  };

  const wrapTextWithTag = (tagName: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    const wrapped = `<${tagName}>${selectedText || '강조텍스트'}</${tagName}>`;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    
    setContent(before + wrapped + after);
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start;
      textarea.selectionEnd = start + wrapped.length;
    }, 0);
  };

  const wrapWithMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    const wrapped = `${prefix}${selectedText || '텍스트'}${suffix}`;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    
    setContent(before + wrapped + after);
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + prefix.length;
      textarea.selectionEnd = start + prefix.length + (selectedText.length || 3);
    }, 0);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800">
      
      {/* 1. Metadata Form Area */}
      <div className="flex flex-col gap-3 p-4 border-b border-gray-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900">
        <input 
          type="text" 
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="제목을 입력하세요" 
          className="text-2xl font-black text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-zinc-700 bg-transparent outline-none w-full"
        />
        <textarea 
          value={summary}
          onChange={e => setSummary(e.target.value)}
          placeholder="요약을 입력하세요" 
          rows={2}
          className="text-sm font-medium text-gray-600 dark:text-zinc-300 placeholder-gray-400 bg-transparent outline-none w-full resize-none custom-scrollbar"
        />
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400">카테고리</span>
            <select 
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="text-xs border border-gray-200 dark:border-zinc-700 rounded px-2 py-1 bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 outline-none"
            >
              <option value="교통사고">교통사고</option>
              <option value="산재사고">산재사고</option>
              <option value="근재사고">근재사고</option>
              <option value="보험보상">보험보상</option>
              <option value="판례법률석">판례법률석</option>
              <option value="기타">기타</option>
            </select>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[10px] font-bold text-gray-400">태그</span>
            <input 
              type="text" 
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="쉼표(,)로 구분 (예: 십자인대,후유장해)" 
              className="flex-1 text-xs border border-gray-200 dark:border-zinc-700 rounded px-2 py-1 bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Markdown Toolbar */}
      <div className="flex flex-col gap-2 p-2 bg-gray-50 dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 shrink-0">
        {/* Row 1 */}
        <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-1 items-center">
          <div className="flex gap-1 items-center border-r border-gray-200 dark:border-zinc-700 pr-4 shrink-0">
            <span className="text-[10px] font-bold text-gray-400 mr-1">정렬</span>
            {[
              { label: '⬅️ 좌', tag: 'left' },
              { label: '↔️ 중', tag: 'center' },
              { label: '➡️ 우', tag: 'right' }
            ].map(item => (
              <button key={item.label} onClick={() => wrapTextWithTag(item.tag)} className="px-2 py-1 bg-white hover:bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-[11px] font-bold transition-colors shadow-sm">{item.label}</button>
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
              <button key={item.label} onClick={() => wrapWithMarkdown(item.prefix, item.suffix)} className="px-2 py-1 bg-white hover:bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-[11px] font-bold transition-colors shadow-sm">{item.label}</button>
            ))}
          </div>

          <div className="flex gap-1 items-center shrink-0">
            <span className="text-[10px] font-bold text-gray-400 mr-1">배경색</span>
            {[
              { label: '🖍️ 노랑', tag: 'bg-yellow' },
              { label: '🖍️ 파랑', tag: 'bg-blue' },
              { label: '🖍️ 빨강', tag: 'bg-red' },
              { label: '🖍️ 초록', tag: 'bg-green' }
            ].map(item => (
              <button key={item.label} onClick={() => wrapTextWithTag(item.tag)} className="px-2 py-1 bg-white hover:bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-[11px] font-bold transition-colors shadow-sm">{item.label}</button>
            ))}
          </div>
          
          <div className="flex gap-1 items-center border-l border-gray-200 dark:border-zinc-700 pl-4 ml-1 shrink-0">
            <span className="text-[10px] font-bold text-gray-400 mr-1">글자색</span>
            {[
              { label: '빨강', tag: 'red' },
              { label: '파랑', tag: 'blue' },
              { label: '초록', tag: 'green' },
              { label: '주황', tag: 'orange' },
              { label: '보라', tag: 'purple' }
            ].map(item => (
              <button key={item.label} onClick={() => wrapTextWithTag(item.tag)} className="px-2 py-1 bg-white hover:bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-[11px] font-bold transition-colors shadow-sm">{item.label}</button>
            ))}
          </div>
        </div>
        
        {/* Row 2 */}
        <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-1 items-center">
          <div className="flex gap-1 items-center border-r border-gray-200 dark:border-zinc-700 pr-4 shrink-0">
            <span className="text-[10px] font-bold text-gray-400 mr-1">구조</span>
            {[
              { label: 'H2', prefix: '\n## ', suffix: '' },
              { label: 'H3', prefix: '\n### ', suffix: '' },
              { label: '링크', prefix: '[', suffix: '](https://)' },
              { label: '사진', prefix: '![이미지설명](', suffix: ')' },
              { label: '가로선', prefix: '\n---\n', suffix: '' }
            ].map(item => (
              <button key={item.label} onClick={() => wrapWithMarkdown(item.prefix, item.suffix)} className="px-2 py-1 bg-white hover:bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-[11px] font-bold transition-colors shadow-sm">{item.label}</button>
            ))}
          </div>

          <div className="flex gap-1 items-center shrink-0">
            <span className="text-[10px] font-bold text-blue-500 mr-1">보상스쿨 박스</span>
            {[
              { label: '📖 용어사전', template: '\n> 💡 **[용어명]** : 설명(입력하세요)\n' },
              { label: '💡 팁', template: '\n> [!TIP]\n> 팁 내용(입력하세요)\n' },
              { label: '⚠️ 경고', template: '\n> [!WARNING]\n> 경고 내용(입력하세요)\n' },
              { label: '📌 요점박스', template: '\n## [🎯 Key Points]\n- 요점 1\n- 요점 2\n' },
              { label: '☑️ 자가진단', template: '\n## [✅ (보험/보상) 1분 자가진단 체크리스트]\n- [ ] 조건 1\n- [ ] 조건 2\n' },
              { label: '💬 FAQ', template: '\n## [💡 자주 묻는 질문 (FAQ) TOP 3]\n### Q1. 질문?\n답변.\n' },
              { label: '📊 표', template: '\n| 항목 | 내용 |\n| :--- | :--- |\n| 1 | A |\n' },
              { label: '🚘 車계산기', template: '\n<calculator type="auto"></calculator>\n' }
            ].map(item => (
              <button key={item.label} onClick={() => insertMarkdown(item.template)} className="px-2 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded text-[11px] font-bold transition-colors shadow-sm">{item.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Textarea Editor */}
      <div className="flex-1 min-h-0 bg-gray-50 dark:bg-zinc-950 p-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full p-4 font-mono text-[14px] leading-[1.8] rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-black/50 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow custom-scrollbar shadow-inner"
          placeholder="이곳에 본문을 작성하세요..."
        />
      </div>
    </div>
  );
}
