import React, { useState } from 'react';
import PremiumButton from '@/components/ui/PremiumButton';
import MarkdownEditor from '@/components/admin/MarkdownEditor';
import BottomSheet from '@/components/ui/BottomSheet';
import AdminPanelLayout from '../AdminPanelLayout';
import { copyToNaverClipboard } from '@/lib/naver-formatter';

interface AiWritingStudioProps {
  isLoading: boolean;
  onRunAi: (mode: 'manual-preserve' | 'manual-expand' | 'semi-auto', inputText: string) => void;
  postMeta: any;
  setPostMeta: any;
  onSavePost: (isDraft?: boolean) => void;
  onCreateBlank: () => void;
  autoProgress?: string;
  onRunAutoBatch?: (category: string, autoPublish?: boolean) => Promise<boolean>;
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

  // Naver Copy State
  const [isCopiedNaver, setIsCopiedNaver] = useState(false);

  const handleCopyNaver = async () => {
    if (!postMeta.content || !(postMeta.content || '').trim()) {
      alert('복사할 본문 내용이 없습니다. 먼저 글을 작성하거나 AI 창작을 완료해 주세요.');
      return;
    }
    
    // Auto-detect target blog based on category
    const cat = postMeta.category || selectedCategory || '';
    let target: 'default' | 'traffic' | 'medical' | 'accident' = 'default';
    if (cat.includes('교통')) target = 'traffic';
    else if (cat.includes('질병') || cat.includes('판례')) target = 'medical';
    else if (cat.includes('산재') || cat.includes('배상') || cat.includes('사망')) target = 'accident';

    const success = await copyToNaverClipboard(postMeta.content, {
      title: postMeta.title,
      targetBlog: target
    });

    if (success) {
      setIsCopiedNaver(true);
      setTimeout(() => setIsCopiedNaver(false), 3500);
    } else {
      alert('클립보드 복사에 실패했습니다.');
    }
  };

  const handleRunAi = () => {
    onRunAi(aiMode, postMeta.content || '');
    setIsMobileAiOpen(false); // 실행 후 모바일 서랍 닫기
  };

  const handleRunSingleCategory = async () => {
    if (!onRunAutoBatch) return;
    setIsBatchRunning(true);
    try {
      await onRunAutoBatch(selectedCategory, false);
    } catch {
      // Ignored
    }
    setIsBatchRunning(false);
    setIsMobileAiOpen(false); // 실행 후 모바일 서랍 닫기
  };

  // handleRunBatch is removed as requested

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
                  선택한 카테고리의 글을 GitHub Actions를 통해 백그라운드에서 자동으로 작성하고 발행합니다.
                </p>
              )}
            </div>
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
              variant="primary" 
              className="w-full !py-3 !rounded-xl text-[15px] shadow-[0_4px_15px_rgba(26,115,232,0.2)] border-none"
            >
              선택 카테고리 개별 발행 ({selectedCategory})
            </PremiumButton>
          </div>
        )}

        {/* 2. 네이버 블로그 D.I.A.+ 원클릭 복사 */}
        <div className="pt-2">
          <button
            onClick={handleCopyNaver}
            disabled={!postMeta.content || !(postMeta.content || '').trim()}
            className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-sm ${
              isCopiedNaver 
                ? 'bg-emerald-600 text-white shadow-emerald-200 ring-2 ring-emerald-300' 
                : 'bg-[#03c75a] hover:bg-[#02b351] text-white shadow-green-100 hover:shadow-md'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <span>{isCopiedNaver ? '✅' : '📋'}</span>
            <span>{isCopiedNaver ? '네이버 서식 복사 완료! (Ctrl+V)' : '네이버 스마트에디터 복사 (D.I.A.+)'}</span>
          </button>
        </div>

        {/* 3. 문서 관리 액션 (새문서, 임시저장, 발행) */}
        <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 space-y-2">
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
    <AdminPanelLayout innerClassName="flex flex-col md:flex-row w-full h-full bg-[#f8f9fa] dark:bg-zinc-950 relative w-full min-h-0">
      
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
    </AdminPanelLayout>
  );
}
