import React, { useState } from 'react';

interface DailyAutoPanelProps {
  isLoading: boolean;
  onRunAuto: (type: 'all' | 'precedent' | 'trend') => void;
}

export default function DailyAutoPanel({ isLoading, onRunAuto }: DailyAutoPanelProps) {
  const [autoType, setAutoType] = useState<'all' | 'precedent' | 'trend'>('all');

  return (
    <div className="flex-1 flex flex-col p-6 bg-gray-50 dark:bg-zinc-950 overflow-hidden">
      <div className="max-w-4xl mx-auto w-full flex flex-col h-full space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              🤖 데일리 자동화 엔진
            </h2>
            <p className="text-sm text-gray-500 mt-1">구글 트렌드 및 최신 이슈를 기반으로 AI가 스스로 포스팅을 기획하고 자동 발행합니다.</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm rounded-2xl p-8 flex items-center justify-center">
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
