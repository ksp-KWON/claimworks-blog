import React, { useState } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumButton from '@/components/ui/PremiumButton';
import PremiumBadge from '@/components/ui/PremiumBadge';
import MarkdownEditor from '@/components/admin/MarkdownEditor';
import BottomSheet from '@/components/ui/BottomSheet';

interface AiWritingStudioProps {
  isLoading: boolean;
  onRunAi: (mode: 'manual-preserve' | 'manual-expand' | 'semi-auto', inputText: string) => void;
  onRunAuto: (type: 'all' | 'precedent' | 'trend') => void;
  postMeta: any;
  setPostMeta: any;
  onSavePost: () => void;
  onCreateBlank: () => void;
}

const MANUAL_MODES = [
  {
    id: 'manual-preserve', icon: '💎', label: '초안 다듬기', badge: '보존형', badgeColor: 'blue' as const,
    desc: '원문을 보존하며 포장합니다.', accentClass: 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-700 dark:text-blue-400'
  },
  {
    id: 'manual-expand', icon: '🚀', label: '초안 확장', badge: '창작형', badgeColor: 'purple' as const,
    desc: '전문 지식을 추가해 창작합니다.', accentClass: 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/10',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30', textColor: 'text-purple-700 dark:text-purple-400'
  },
  {
    id: 'semi-auto', icon: '🔗', label: '링크/키워드', badge: '반자동', badgeColor: 'green' as const,
    desc: '키워드로 전체 기획·창작합니다.', accentClass: 'border-green-500 bg-green-50/50 dark:bg-green-900/10',
    iconBg: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-700 dark:text-green-400'
  }
];

const AUTO_TYPES = [
  {
    id: 'all', icon: '🔥', label: '통합 자동화', desc: '판례·트렌드 종합 자동 발행',
    accentClass: 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/10', iconBg: 'from-rose-500 to-orange-500', textColor: 'text-rose-600 dark:text-rose-400'
  },
  {
    id: 'precedent', icon: '⚖️', label: '전문 법률 칼럼', desc: '판례·심결례 기반 보상 분석',
    accentClass: 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10', iconBg: 'from-indigo-500 to-blue-600', textColor: 'text-indigo-600 dark:text-indigo-400'
  },
  {
    id: 'trend', icon: '📈', label: '일간 트렌드', desc: '실시간 이슈 기반 트래픽 포스팅',
    accentClass: 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/10', iconBg: 'from-teal-500 to-emerald-500', textColor: 'text-teal-600 dark:text-teal-400'
  }
];

export default function AiWritingStudio({
  isLoading, onRunAi, onRunAuto,
  postMeta, setPostMeta, onSavePost, onCreateBlank
}: AiWritingStudioProps) {
  
  // AI Controls State
  const [activePanelTab, setActivePanelTab] = useState<'manual' | 'auto'>('manual');
  const [inputText, setInputText] = useState('');
  const [aiMode, setAiMode] = useState<'manual-preserve' | 'manual-expand' | 'semi-auto'>('manual-preserve');
  const [autoType, setAutoType] = useState<'all' | 'precedent' | 'trend'>('all');

  // Mobile Bottom Sheet State
  const [isMobileAiOpen, setIsMobileAiOpen] = useState(false);

  const handleRunAi = () => {
    onRunAi(aiMode, inputText);
    setIsMobileAiOpen(false); // 실행 후 모바일 서랍 닫기
  };

  const handleRunAuto = () => {
    onRunAuto(autoType);
    setIsMobileAiOpen(false); // 실행 후 모바일 서랍 닫기
  };

  // 공통으로 사용될 AI 어시스턴트 컨트롤 패널 (데스크톱/모바일 공용)
  const AiControls = () => (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 어시스턴트 헤더 & 탭 */}
      <div className="shrink-0 p-4 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <span>✨</span> AI 어시스턴트
        </h2>
        <div className="flex gap-1 bg-gray-100 dark:bg-zinc-950 p-1 rounded-lg">
          <button 
            onClick={() => setActivePanelTab('manual')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${activePanelTab === 'manual' ? 'bg-white dark:bg-zinc-800 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            창작 모드
          </button>
          <button 
            onClick={() => setActivePanelTab('auto')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${activePanelTab === 'auto' ? 'bg-white dark:bg-zinc-800 text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            자동 모드
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 pb-20 md:pb-4">
        {activePanelTab === 'manual' ? (
          <>
            <div className="grid grid-cols-1 gap-2">
              {MANUAL_MODES.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setAiMode(mode.id as any)}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${aiMode === mode.id ? mode.accentClass + ' border-2 shadow-sm' : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-gray-300'}`}
                >
                  <div className={`w-8 h-8 rounded-lg ${mode.iconBg} flex items-center justify-center shrink-0`}>
                    {mode.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-sm font-bold ${aiMode === mode.id ? mode.textColor : 'text-gray-700 dark:text-gray-200'}`}>{mode.label}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-snug truncate">{mode.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="space-y-2 mt-4">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                {aiMode === 'semi-auto' ? '키워드 또는 참고 링크' : '원문 데이터 입력'}
              </label>
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className="w-full h-32 md:h-48 p-3 border border-gray-200 dark:border-zinc-700 bg-[#f8f9fa] dark:bg-zinc-950 text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none rounded-xl custom-scrollbar"
                placeholder={aiMode === 'semi-auto' ? '예: 음주운전 구제 방법' : '대본을 붙여넣으세요...'}
              />
            </div>

            <PremiumButton onClick={handleRunAi} disabled={isLoading || !inputText.trim()} variant="primary" className="w-full !py-2.5 mt-2">
              {isLoading ? '창작 중...' : '창작 시작'}
            </PremiumButton>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2">
              {AUTO_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setAutoType(type.id as any)}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${autoType === type.id ? type.accentClass + ' border-2 shadow-sm' : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-gray-300'}`}
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${type.iconBg} flex items-center justify-center shrink-0`}>
                    {type.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-0.5">{type.label}</div>
                    <p className="text-[11px] text-gray-500 leading-snug truncate">{type.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl">
              <p className="text-xs text-gray-500 mb-3 text-center break-keep">선택된 모드로 즉시 파이프라인이 가동됩니다.</p>
              <PremiumButton onClick={handleRunAuto} disabled={isLoading} variant="primary" className="w-full !py-2.5">
                {isLoading ? '실행 중...' : '자동 엔진 가동'}
              </PremiumButton>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#f8f9fa] dark:bg-zinc-950 overflow-hidden relative w-full h-full">
      
      {/* ── 좌측/중앙: 메인 에디터 (항상 노출) ── */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        

        {/* 에디터 캔버스 */}
        <div className="flex-1 overflow-hidden h-full">
          <MarkdownEditor
            title={postMeta.title} setTitle={(t: string) => setPostMeta((prev: any) => ({ ...prev, title: t }))}
            content={postMeta.content} setContent={(c: any) => setPostMeta((prev: any) => ({ ...prev, content: typeof c === 'function' ? c(prev.content) : c }))}
          />
        </div>
      </div>

      {/* ── 우측: AI 어시스턴트 사이드바 (데스크톱 전용) ── */}
      <div className="hidden md:flex w-80 lg:w-[320px] shrink-0 flex-col bg-white dark:bg-zinc-900 overflow-hidden shadow-[-4px_0_15px_rgba(0,0,0,0.03)] z-10">
        <AiControls />
      </div>

      {/* ── 모바일: 하단 플로팅 버튼 ── */}
      <div className="md:hidden fixed bottom-[72px] right-4 z-40">
        <button 
          onClick={() => setIsMobileAiOpen(true)}
          className="w-12 h-12 rounded-full bg-blue-600 text-white shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        >
          <span className="text-xl">✨</span>
        </button>
      </div>

      {/* ── 모바일: AI 서랍 (바텀 시트) ── */}
      <BottomSheet 
        isOpen={isMobileAiOpen} 
        onClose={() => setIsMobileAiOpen(false)} 
        showBackdrop={true} 
        maxHeight="max-h-[85vh]"
        padding="p-0"
        zIndex="z-[100]"
      >
        <div className="h-[75vh] flex flex-col bg-white dark:bg-zinc-900">
          <AiControls />
        </div>
      </BottomSheet>
    </div>
  );
}
