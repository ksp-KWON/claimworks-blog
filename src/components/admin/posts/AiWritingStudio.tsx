import React, { useState } from 'react';
import PremiumButton from '@/components/ui/PremiumButton';
import MarkdownEditor from '@/components/admin/MarkdownEditor';
import BottomSheet from '@/components/ui/BottomSheet';

interface AiWritingStudioProps {
  isLoading: boolean;
  onRunAi: (mode: 'manual-preserve' | 'manual-expand' | 'semi-auto', inputText: string) => void;
  postMeta: any;
  setPostMeta: any;
  onSavePost: (isDraft?: boolean) => void;
  onCreateBlank: () => void;
  autoProgress?: string;
  onRunAutoBatch?: (category: string) => Promise<boolean>;
}

const CATEGORIES = [
  '판례·법률 해석',
  '사망·자살 보험금',
  '질병진단·실손',
  '교통사고 보상',
  '배상책임·의료',
  '근재·산재 사고',
  '장해평가·면책',
  '보상가이드'
];

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

const CATEGORY_UI: Record<string, { icon: string; bg: string }> = {
  '판례·법률 해석': { icon: '⚖️', bg: 'border-indigo-200 bg-indigo-50/30 text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-900/20 dark:text-indigo-400' },
  '사망·자살 보험금': { icon: '🕊️', bg: 'border-slate-200 bg-slate-50/30 text-slate-700 dark:border-slate-800 dark:bg-slate-900/20 dark:text-slate-400' },
  '질병진단·실손': { icon: '🏥', bg: 'border-emerald-200 bg-emerald-50/30 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-400' },
  '교통사고 보상': { icon: '🚗', bg: 'border-blue-200 bg-blue-50/30 text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-400' },
  '배상책임·의료': { icon: '🧑‍⚖️', bg: 'border-orange-200 bg-orange-50/30 text-orange-700 dark:border-orange-900/50 dark:bg-orange-900/20 dark:text-orange-400' },
  '근재·산재 사고': { icon: '👷', bg: 'border-amber-200 bg-amber-50/30 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-400' },
  '장해평가·면책': { icon: '📉', bg: 'border-purple-200 bg-purple-50/30 text-purple-700 dark:border-purple-900/50 dark:bg-purple-900/20 dark:text-purple-400' },
  '보상가이드': { icon: '🧭', bg: 'border-teal-200 bg-teal-50/30 text-teal-700 dark:border-teal-900/50 dark:bg-teal-900/20 dark:text-teal-400' }
};

export default function AiWritingStudio({
  isLoading, onRunAi,
  postMeta, setPostMeta, onSavePost, onCreateBlank,
  autoProgress,
  onRunAutoBatch
}: AiWritingStudioProps) {
  
  const [activePanelTab, setActivePanelTab] = useState<'manual' | 'auto'>('manual');
  const [aiMode, setAiMode] = useState<'manual-preserve' | 'manual-expand' | 'semi-auto'>('manual-preserve');
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES[0]);

  // Mobile Bottom Sheet State
  const [isMobileAiOpen, setIsMobileAiOpen] = useState(false);

  // Batch Auto State
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchStatus, setBatchStatus] = useState<Record<string, 'pending' | 'running' | 'success' | 'failed'>>({});

  const handleRunAi = () => {
    onRunAi(aiMode, postMeta.content || '');
    setIsMobileAiOpen(false); // 실행 후 모바일 서랍 닫기
  };

  const handleRunSingleCategory = async () => {
    if (!onRunAutoBatch) return;
    setIsBatchRunning(true);
    setBatchStatus({ [selectedCategory]: 'running' });
    try {
      const res = await onRunAutoBatch(selectedCategory);
      setBatchStatus({ [selectedCategory]: res ? 'success' : 'failed' });
    } catch (e) {
      setBatchStatus({ [selectedCategory]: 'failed' });
    }
    setIsBatchRunning(false);
    setIsMobileAiOpen(false); // 실행 후 모바일 서랍 닫기
  };

  const handleRunBatch = async () => {
    if (!window.confirm('8개 카테고리에 대해 자동으로 기사를 생성하고 즉시 발행합니다. 계속하시겠습니까?')) return;
    setIsBatchRunning(true);
    
    // 초기화
    const initStatus: Record<string, any> = {};
    CATEGORIES.forEach(c => initStatus[c] = 'pending');
    setBatchStatus(initStatus);

    for (const category of CATEGORIES) {
      setBatchStatus(prev => ({ ...prev, [category]: 'running' }));
      try {
        // Here we trigger the parent's generic logic. But since we need to save and loop, 
        // it's easier to expose a new prop to the parent or trigger an event.
        // For simplicity, we will emit a CustomEvent or pass a callback.
        // Actually, we can just call `onRunAutoBatch` if we add it to props.
        if (onRunAutoBatch) {
          const res = await onRunAutoBatch(category);
          if (res) {
            setBatchStatus(prev => ({ ...prev, [category]: 'success' }));
          } else {
            setBatchStatus(prev => ({ ...prev, [category]: 'failed' }));
          }
        } else {
          setBatchStatus(prev => ({ ...prev, [category]: 'failed' }));
        }
      } catch (e) {
        setBatchStatus(prev => ({ ...prev, [category]: 'failed' }));
      }
    }
    
    setIsBatchRunning(false);
  };

  // 공통으로 사용될 AI 어시스턴트 컨트롤 패널 (데스크톱/모바일 공용)
  const renderAiControls = () => (
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

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 pb-2 md:pb-2">
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
            
            <div className="space-y-2 mt-4 p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl">
              <p className="text-xs text-blue-700 dark:text-blue-400 font-medium leading-relaxed">
                💡 <b>작성 가이드</b><br/>
                중앙의 에디터 창에 원문 데이터나 대본을 입력한 뒤, 하단의 창작 시작 버튼을 누르면 AI가 새로운 글을 완성해줍니다.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => {
                const ui = CATEGORY_UI[cat] || { icon: '📄', bg: 'border-gray-200 bg-gray-50' };
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left ${
                      isSelected 
                        ? 'border-blue-500 shadow-sm bg-blue-50/30 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 border ${ui.bg}`}>
                      {ui.icon}
                    </div>
                    <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      {cat}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl">
              {autoProgress ? (
                <div className="text-sm font-bold text-blue-600 dark:text-blue-400 text-center animate-pulse">
                  {autoProgress}
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center break-keep">
                  Vercel 타임아웃 걱정 없는 프론트엔드 오케스트레이션 방식으로 에디터에 결과를 렌더링합니다.
                </p>
              )}
            </div>

            {/* Batch Status Dashboard */}
            {isBatchRunning && (
              <div className="mt-4 p-4 border border-blue-200 dark:border-blue-900 bg-white dark:bg-zinc-900 rounded-xl shadow-sm">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white mb-2">일괄 생성 대시보드</h3>
                <div className="space-y-1.5">
                  {CATEGORIES.map(cat => (
                    <div key={cat} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-300">{cat}</span>
                      <span>
                        {batchStatus[cat] === 'pending' && <span className="text-gray-400">⏳ 대기</span>}
                        {batchStatus[cat] === 'running' && <span className="text-blue-500 animate-pulse">🔄 진행중</span>}
                        {batchStatus[cat] === 'success' && <span className="text-green-500">✅ 완료</span>}
                        {batchStatus[cat] === 'failed' && <span className="text-red-500">❌ 스킵</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── 하단 공통 액션 영역 (Sticky) ── */}
      <div className="shrink-0 p-4 border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 relative z-20 space-y-4 shadow-[0_-4px_15px_rgba(0,0,0,0.02)]">
        
        {activePanelTab === 'manual' ? (
          <PremiumButton 
            onClick={handleRunAi} 
            disabled={isLoading || !(postMeta.content || '').trim()} 
            variant="primary" 
            className="w-full !py-3 !rounded-xl text-[15px] shadow-[0_4px_15px_rgba(26,115,232,0.2)] border-none"
          >
            {isLoading ? '창작 중...' : '창작 시작'}
          </PremiumButton>
        ) : (
          <div className="space-y-2">
            <PremiumButton 
              onClick={handleRunSingleCategory} 
              disabled={isLoading || isBatchRunning} 
              variant="secondary" 
              className="w-full !py-2.5 !rounded-xl text-sm border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200"
            >
              선택 카테고리 개별 발행 ({selectedCategory})
            </PremiumButton>
            <PremiumButton 
              onClick={handleRunBatch} 
              disabled={isLoading || isBatchRunning} 
              variant="primary" 
              className="w-full !py-3 !rounded-xl text-[15px] shadow-[0_4px_15px_rgba(225,29,72,0.2)] !bg-rose-600 hover:!bg-rose-700 border-none"
            >
              {isBatchRunning ? '일괄 자동 가동 중...' : '🔥 8개 카테고리 일괄 발행'}
            </PremiumButton>
          </div>
        )}

        {/* 2. 문서 관리 액션 (새문서, 임시저장, 발행) */}
        <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 space-y-2">
          <div className="flex gap-2">
            <PremiumButton onClick={onCreateBlank} variant="secondary" className="flex-1 !py-2.5 !text-xs !rounded-xl border-gray-200 dark:border-zinc-700">
              새 문서
            </PremiumButton>
            <PremiumButton onClick={() => onSavePost(true)} disabled={isLoading} variant="secondary" className="flex-1 !py-2.5 !text-xs !rounded-xl border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-gray-300">
              임시 저장
            </PremiumButton>
          </div>
          <PremiumButton onClick={() => onSavePost(false)} disabled={isLoading} variant="primary" className="w-full !py-2.5 !rounded-xl shadow-md !bg-gray-800 hover:!bg-gray-900 dark:!bg-white dark:text-gray-900 border-none">
            {isLoading ? '처리 중...' : '발행하기'}
          </PremiumButton>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#f8f9fa] dark:bg-zinc-950 relative w-full min-h-0">
      
      {/* ── 좌측/중앙: 메인 에디터 (항상 노출) ── */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-y-auto">
        
        {/* 에디터 캔버스 */}
        <div className="flex-1">
          <MarkdownEditor
            title={postMeta.title} setTitle={(t: string) => setPostMeta((prev: any) => ({ ...prev, title: t }))}
            content={postMeta.content} setContent={(c: any) => setPostMeta((prev: any) => ({ ...prev, content: typeof c === 'function' ? c(prev.content) : c }))}
          />
        </div>
      </div>

      {/* ── 우측: AI 어시스턴트 사이드바 (데스크톱 전용) ── */}
      <div className="hidden md:flex w-80 lg:w-[320px] shrink-0 flex-col bg-white dark:bg-zinc-900 overflow-hidden shadow-[-4px_0_15px_rgba(0,0,0,0.03)] z-10">
        {renderAiControls()}
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
          {renderAiControls()}
        </div>
      </BottomSheet>
    </div>
  );
}
