import React, { useState } from 'react';

interface DailyAutoPanelProps {
  isLoading: boolean;
  onRunAuto: (type: 'all' | 'precedent' | 'trend') => void;
}

export default function DailyAutoPanel({ isLoading, onRunAuto }: DailyAutoPanelProps) {
  const [autoType, setAutoType] = useState<'all' | 'precedent' | 'trend'>('all');

  return (
    <div className="flex-1 flex flex-col bg-gray-50 dark:bg-zinc-950 overflow-hidden relative">
      <div className="h-14 px-4 sm:px-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center shrink-0 shadow-sm z-10 w-full overflow-x-auto">
        <div className="flex items-center gap-3 shrink-0">
          <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            🤖 데일리 자동화 엔진
          </h2>
          <span className="text-[10px] md:text-xs text-gray-400 font-medium hidden sm:inline">구글 트렌드 및 최신 이슈를 기반으로 AI가 스스로 포스팅을 기획하고 자동 발행합니다.</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
        <div className="max-w-4xl mx-auto w-full flex flex-col h-full space-y-6">
        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm rounded-2xl p-8">
          <div className="max-w-3xl mx-auto flex flex-col h-full justify-center">
            
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg ring-4 ring-blue-50 dark:ring-blue-900/20">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">자동 포스팅 모드 선택</h3>
              <p className="text-gray-500">AI가 데이터를 수집하고 분석하여 고품질의 포스팅을 작성합니다.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              {[
                { id: 'all', icon: '🔥', label: '통합 자동화', desc: '법률 판례와 트렌드 이슈를 종합하여 최적의 주제로 자동 발행' },
                { id: 'precedent', icon: '⚖️', label: '전문 법률 칼럼', desc: '판례 및 심결례 기반의 깊이 있는 보상/손해사정 전문 분석' },
                { id: 'trend', icon: '📈', label: '일간 트렌드 분석', desc: '실시간 검색어와 이슈 기반의 정보성 트래픽 유입 목적 포스팅' }
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setAutoType(type.id as any)}
                  className={`flex flex-col p-6 rounded-2xl border text-left transition-all group ${
                    autoType === type.id 
                      ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20 dark:border-blue-600 shadow-md ring-1 ring-blue-500' 
                      : 'bg-white dark:bg-zinc-800/50 border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-sm'
                  }`}
                >
                  <div className="text-3xl mb-4 group-hover:scale-110 transition-transform origin-left">{type.icon}</div>
                  <h4 className={`text-base font-bold mb-2 ${autoType === type.id ? 'text-blue-700 dark:text-blue-400' : 'text-gray-900 dark:text-gray-100'}`}>
                    {type.label}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{type.desc}</p>
                </button>
              ))}
            </div>

            <div className="max-w-md mx-auto w-full">
              <button
                onClick={() => onRunAuto(autoType)}
                disabled={isLoading}
                className="w-full bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold py-4 rounded-xl text-lg shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    작업 실행 중...
                  </>
                ) : (
                  <>
                    🚀 선택한 모드로 발행 시작
                  </>
                )}
              </button>
              <p className="text-center text-xs text-gray-400 mt-4">
                버튼을 누르면 백그라운드 서버에서 AI 파이프라인이 즉시 가동됩니다.
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
