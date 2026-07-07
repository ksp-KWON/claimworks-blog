import React, { useState } from 'react';

interface AiWritingPanelProps {
  isLoading: boolean;
  onRunAi: (mode: 'manual-preserve' | 'manual-expand' | 'semi-auto', inputText: string) => void;
}

export default function AiWritingPanel({ isLoading, onRunAi }: AiWritingPanelProps) {
  const [inputText, setInputText] = useState('');
  const [aiMode, setAiMode] = useState<'manual-preserve' | 'manual-expand' | 'semi-auto'>('manual-preserve');

  return (
    <div className="flex-1 flex flex-col p-6 bg-gray-50 dark:bg-zinc-950 overflow-y-auto custom-scrollbar">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            ✨ AI 글쓰기
          </h2>
          <p className="text-sm text-gray-500 mt-1">원문을 입력하고 원하는 스타일의 블로그 포스팅으로 변환하세요.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setAiMode('manual-preserve')}
            className={`flex flex-col p-4 rounded-xl border text-left transition-all ${
              aiMode === 'manual-preserve' 
                ? 'bg-blue-50 border-blue-400 dark:bg-blue-900/30 dark:border-blue-700 shadow-sm ring-1 ring-blue-400'
                : 'bg-white border-gray-200 hover:border-blue-300 dark:bg-zinc-900 dark:border-zinc-800'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">💎</span>
              <span className={`text-sm font-bold ${aiMode === 'manual-preserve' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-200'}`}>초안 다듬기 (보존형)</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              원문 내용을 100% 보존합니다. 내용을 부풀리지 않고, 가독성 높은 블로그 형태로 소제목과 불릿 포인트를 활용해 예쁘게 포장합니다.
            </p>
          </button>

          <button
            onClick={() => setAiMode('manual-expand')}
            className={`flex flex-col p-4 rounded-xl border text-left transition-all ${
              aiMode === 'manual-expand' 
                ? 'bg-indigo-50 border-indigo-400 dark:bg-indigo-900/30 dark:border-indigo-700 shadow-sm ring-1 ring-indigo-400'
                : 'bg-white border-gray-200 hover:border-indigo-300 dark:bg-zinc-900 dark:border-zinc-800'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🚀</span>
              <span className={`text-sm font-bold ${aiMode === 'manual-expand' ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-200'}`}>초안 확장형 (창작)</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              대본이나 뼈대만 입력하면, AI가 관련된 전문 지식을 대거 추가하여 아주 방대하고 깊이 있는 전문 칼럼으로 새롭게 창작합니다.
            </p>
          </button>

          <button
            onClick={() => setAiMode('semi-auto')}
            className={`flex flex-col p-4 rounded-xl border text-left transition-all ${
              aiMode === 'semi-auto' 
                ? 'bg-[#03c75a]/10 border-[#03c75a] dark:bg-[#03c75a]/20 dark:border-[#03c75a]/50 shadow-sm ring-1 ring-[#03c75a]'
                : 'bg-white border-gray-200 hover:border-[#03c75a]/50 dark:bg-zinc-900 dark:border-zinc-800'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🔗</span>
              <span className={`text-sm font-bold ${aiMode === 'semi-auto' ? 'text-[#02b351] dark:text-[#03c75a]' : 'text-gray-800 dark:text-gray-200'}`}>링크/키워드 (창작)</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              단순 키워드나 뉴스 링크만 제공하면, 데일리 글쓰기용 방대한 전문 칼럼을 AI가 처음부터 끝까지 자동 기획 및 창작합니다.
            </p>
          </button>
        </div>

        <div className="flex flex-col gap-3 bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
            {aiMode === 'semi-auto' ? '키워드 또는 참고 링크 입력' : '유튜브 대본 등 원문 입력'}
          </label>
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            className="w-full min-h-[300px] p-4 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none custom-scrollbar"
            placeholder={
              aiMode === 'semi-auto' 
                ? "참고할 링크 주소나 핵심 키워드를 적어주세요...\n\n예시:\n- 음주운전 면허취소 구제 방법\n- https://news.naver.com/main/read.naver?mode=LSD&mid=sec&sid1=102&oid=001&aid=0000000000" 
                : "가공할 원문 대본이나 텍스트를 이곳에 붙여넣으세요..."
            }
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={() => onRunAi(aiMode, inputText)}
              disabled={isLoading || !inputText.trim()}
              className={`px-8 py-3 rounded-lg text-white font-bold shadow-sm disabled:opacity-50 transition-colors flex items-center gap-2 ${
                aiMode === 'manual-preserve' ? 'bg-blue-600 hover:bg-blue-700' :
                aiMode === 'manual-expand' ? 'bg-indigo-600 hover:bg-indigo-700' :
                'bg-[#03c75a] hover:bg-[#02b351]'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  작성 중...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  작성 시작
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
