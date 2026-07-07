import React, { useState } from 'react';

interface DailyAutoPanelProps {
  isLoading: boolean;
  onRunAuto: (type: 'all' | 'precedent' | 'trend') => void;
}

export default function DailyAutoPanel({ isLoading, onRunAuto }: DailyAutoPanelProps) {
  const [autoType, setAutoType] = useState<'all' | 'precedent' | 'trend'>('all');

  return (
    <div className="flex-1 flex flex-col p-6 bg-gray-50 dark:bg-zinc-950 overflow-y-auto custom-scrollbar items-center justify-center">
      <div className="max-w-2xl w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden text-center">
        
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 py-12 px-6 flex flex-col items-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center mb-4 shadow-lg ring-4 ring-white/10">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">데일리 자동화 엔진</h2>
          <p className="text-blue-100 text-sm max-w-md">
            구글 트렌드 및 최신 이슈를 기반으로 AI가 스스로 주제를 기획하고, 리서치하고, 완벽한 포스팅을 작성하여 블로그에 자동 발행합니다.
          </p>
        </div>

        <div className="p-8">
          <div className="flex flex-col gap-4 text-left max-w-sm mx-auto">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">발행 프로세스 선택</label>
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'all', label: '🔥 전체 통합 발행 (법률 + 트렌드)', desc: '가장 추천하는 모드입니다.' },
                { id: 'precedent', label: '⚖️ 전문 법률 칼럼만 발행', desc: '판례 및 심결례 기반 전문 분석' },
                { id: 'trend', label: '📈 일간 트렌드 분석만 발행', desc: '실시간 검색어 기반 정보성 글' }
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setAutoType(type.id as any)}
                  className={`flex flex-col p-4 rounded-xl border text-left transition-all ${
                    autoType === type.id 
                      ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/30 dark:border-blue-700 ring-1 ring-blue-500' 
                      : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 hover:border-blue-300'
                  }`}
                >
                  <span className={`text-sm font-bold ${autoType === type.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
                    {type.label}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">{type.desc}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => onRunAuto(autoType)}
              disabled={isLoading}
              className="mt-6 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl text-lg shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  작업 실행 중...
                </>
              ) : (
                <>
                  🚀 자동화 엔진 기동
                </>
              )}
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">
              버튼을 누르면 GitHub Actions를 통해 백그라운드 서버에서 AI 파이프라인이 실행됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
