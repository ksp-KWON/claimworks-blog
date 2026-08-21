import React, { useState } from 'react';
import PremiumButton from '@/components/ui/PremiumButton';
import PremiumCard from '@/components/ui/PremiumCard';
import MarkdownEditor from '@/components/admin/MarkdownEditor';
import BottomSheet from '@/components/ui/BottomSheet';
import AdminPanelLayout from '../AdminPanelLayout';
import { copyToNaverClipboard } from '@/lib/naver-formatter';

interface AiWritingStudioProps {
  isLoading: boolean;
  onRunAi: (mode: 'manual-preserve' | 'manual-expand' | 'manual-naver' | 'naver-expand' | 'semi-auto' | 'semi-auto-naver', inputText: string) => void;
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

const NAVER_MODES = [
  {
    id: 'manual-naver', label: '네이버 D.I.A.+ 각색', badge: '원고 각색',
    desc: '원문을 친근한 대화체와 스토리텔링으로 각색합니다.',
    activeClass: 'border-l-[3px] border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 shadow-sm'
  },
  {
    id: 'naver-expand', label: '네이버 블로그 확장', badge: '신규 창작',
    desc: '핵심 키워드로 풍부한 네이버 블로그 원고를 창작합니다.',
    activeClass: 'border-l-[3px] border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 shadow-sm'
  },
  {
    id: 'semi-auto-naver', label: '링크/키워드 기획', badge: '반자동',
    desc: '키워드·링크로 네이버 D.I.A.+ 공감 스토리 원고를 창작합니다.',
    activeClass: 'border-l-[3px] border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 shadow-sm'
  }
];

const GOOGLE_MODES = [
  {
    id: 'manual-preserve', label: '초안 다듬기', badge: '보존형',
    desc: '원문을 보존하며 정밀한 E-E-A-T 칼럼으로 다듬습니다.',
    activeClass: 'border-l-[3px] border-blue-600 bg-blue-50/70 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 shadow-sm'
  },
  {
    id: 'manual-expand', label: '초안 확장', badge: '심층 창작',
    desc: '전문 판례와 의학 법리를 추가해 심층 창작합니다.',
    activeClass: 'border-l-[3px] border-purple-600 bg-purple-50/70 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 shadow-sm'
  },
  {
    id: 'semi-auto', label: '링크/키워드 기획', badge: '반자동',
    desc: '키워드로 전체 기획 및 구조화된 칼럼을 창작합니다.',
    activeClass: 'border-l-[3px] border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 shadow-sm'
  }
];

export default function AiWritingStudio({
  isLoading, onRunAi,
  postMeta, setPostMeta, onSavePost, onCreateBlank,
  autoProgress,
  onRunAutoBatch
}: AiWritingStudioProps) {
  
  const [activePanelTab, setActivePanelTab] = useState<'manual' | 'auto'>('manual');
  const [platform, setPlatform] = useState<'naver' | 'google'>('naver');
  const [aiMode, setAiMode] = useState<'manual-preserve' | 'manual-expand' | 'manual-naver' | 'naver-expand' | 'semi-auto' | 'semi-auto-naver'>('manual-naver');
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
    setIsMobileAiOpen(false);
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
    setIsMobileAiOpen(false);
  };

  // 공통 AI 어시스턴트 컨트롤 패널 (노아이콘 + 콤팩트 직각 3D 시스템)
  const renderAiControls = () => (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-[#202124]">
      {/* 1. 패널 헤더 & 모드 탭 (직각 3D) */}
      <div className="shrink-0 p-3 border-b border-gray-200/80 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
            AI WRITING STUDIO
          </span>
          <span className="text-[10px] font-mono font-bold text-gray-400">
            {platform === 'naver' ? 'NAVER D.I.A.+' : 'GOOGLE E-E-A-T'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1 bg-gray-200/70 dark:bg-zinc-950 p-0.5 rounded-none border border-gray-200 dark:border-zinc-800">
          <button 
            onClick={() => setActivePanelTab('manual')}
            className={`py-1 text-xs font-bold transition-all rounded-none text-center ${
              activePanelTab === 'manual' 
                ? 'bg-white dark:bg-zinc-800 text-[var(--google-blue)] dark:text-[#8ab4f8] shadow-sm font-extrabold' 
                : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900'
            }`}
          >
            창작 모드
          </button>
          <button 
            onClick={() => setActivePanelTab('auto')}
            className={`py-1 text-xs font-bold transition-all rounded-none text-center ${
              activePanelTab === 'auto' 
                ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-sm font-extrabold' 
                : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900'
            }`}
          >
            자동 모드
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {activePanelTab === 'manual' ? (
          <>
            {/* 2. 플랫폼 선택 토글 (직각 엣지) */}
            <div className="grid grid-cols-2 gap-1 bg-gray-100 dark:bg-zinc-950 p-0.5 rounded-none border border-gray-200 dark:border-zinc-800">
              <button
                onClick={() => {
                  setPlatform('naver');
                  setAiMode('manual-naver');
                }}
                className={`py-1.5 px-2 text-xs font-bold transition-all rounded-none text-center ${
                  platform === 'naver'
                    ? 'bg-emerald-600 text-white shadow-sm font-extrabold'
                    : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200'
                }`}
              >
                네이버 D.I.A.+
              </button>
              <button
                onClick={() => {
                  setPlatform('google');
                  setAiMode('manual-preserve');
                }}
                className={`py-1.5 px-2 text-xs font-bold transition-all rounded-none text-center ${
                  platform === 'google'
                    ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                    : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200'
                }`}
              >
                구글 E-E-A-T
              </button>
            </div>

            {/* 3. 모드 선택 카드 목록 (아이콘 배제, 콤팩트 좌측 액센트 바) */}
            <div className="space-y-1.5">
              {(platform === 'naver' ? NAVER_MODES : GOOGLE_MODES).map(mode => {
                const isSelected = aiMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setAiMode(mode.id as any)}
                    className={`w-full p-2.5 text-left transition-all duration-200 rounded-none border ${
                      isSelected
                        ? mode.activeClass
                        : 'border-gray-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:bg-gray-50 dark:hover:bg-zinc-800/50 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-extrabold text-gray-900 dark:text-gray-100">
                        {mode.label}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-none border ${
                        isSelected
                          ? platform === 'naver'
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                          : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-zinc-700'
                      }`}>
                        {mode.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-snug">
                      {mode.desc}
                    </p>
                  </button>
                );
              })}
            </div>
            
            {/* 4. 플랫폼별 가이드 팁 (콤팩트 직각 박스) */}
            <div className={`p-2.5 border rounded-none text-xs leading-relaxed ${
              platform === 'naver'
                ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300'
                : 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/40 text-blue-900 dark:text-blue-300'
            }`}>
              <div className="font-extrabold mb-0.5 text-[11.5px]">
                {platform === 'naver' ? '네이버 스마트에디터 최적화' : '구글 W3C 웹 표준 최적화'}
              </div>
              <p className="text-[10.5px] opacity-90">
                {platform === 'naver'
                  ? '원문 입력 후 [네이버 각색 시작] 클릭 ➔ 완료 후 아래 [네이버 서식 복사]로 블로그에 붙여넣기(Ctrl+V)하세요.'
                  : '대법원 판례, 법리 대조표, W3C 시맨틱 마크다운 구조로 최고 권위의 웹사이트 칼럼을 생성합니다.'}
              </p>
            </div>
          </>
        ) : (
          <>
            {/* 자동 모드 8개 카테고리 그리드 (완벽한 균형의 직각 3D 타일) */}
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`py-3 px-3 text-left transition-all duration-200 rounded-none border text-xs font-extrabold flex items-center justify-between shadow-sm ${
                      isSelected 
                        ? 'border-l-[3.5px] border-blue-600 bg-blue-50/90 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800 shadow-blue-500/10' 
                        : 'border-gray-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:border-gray-300 hover:-translate-y-0.5'
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0 ml-1.5" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-3.5 bg-gray-50/80 dark:bg-zinc-950 border border-gray-200/80 dark:border-zinc-800 rounded-none shadow-sm">
              {autoProgress ? (
                <div className="text-xs font-extrabold text-blue-600 dark:text-blue-400 text-center animate-pulse">
                  {autoProgress}
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-zinc-400 text-center leading-relaxed">
                  선택한 카테고리의 원고를 백그라운드 파이프라인에서 자동으로 기획·작성하여 즉시 발행합니다.
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── 3. 하단 공통 액션 영역 (하단 여백 없이 시원하고 꽉 찬 3D 액션 바) ── */}
      <div className="shrink-0 p-3.5 border-t border-gray-200/80 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-900/70 space-y-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        {activePanelTab === 'manual' ? (
          <PremiumButton 
            onClick={handleRunAi} 
            disabled={isLoading || !(postMeta.content || '').trim()} 
            variant="primary" 
            className={`w-full !py-3 rounded-none text-sm font-extrabold border-none shadow-[0_6px_20px_rgba(0,0,0,0.1)] active:scale-[0.99] ${
              platform === 'naver'
                ? '!bg-emerald-600 hover:!bg-emerald-700 shadow-emerald-500/20'
                : '!bg-blue-600 hover:!bg-blue-700 shadow-blue-500/20'
            }`}
          >
            {isLoading ? 'AI 각색/창작 진행 중...' : platform === 'naver' ? '네이버 AI 각색 시작' : '구글 E-E-A-T 창작 시작'}
          </PremiumButton>
        ) : (
          <PremiumButton 
            onClick={handleRunSingleCategory} 
            disabled={isLoading || isBatchRunning} 
            variant="primary" 
            className="w-full !py-3 rounded-none text-sm font-extrabold !bg-blue-600 hover:!bg-blue-700 border-none shadow-[0_6px_20px_rgba(37,99,235,0.25)] active:scale-[0.99]"
          >
            카테고리 자동 발행 ({selectedCategory})
          </PremiumButton>
        )}

        {/* 네이버 블로그 스마트에디터 복사 버튼 (시원한 직각 엣지) */}
        <button
          onClick={handleCopyNaver}
          disabled={!postMeta.content || !(postMeta.content || '').trim()}
          className={`w-full py-2.5 px-3 rounded-none flex items-center justify-center gap-1.5 text-xs font-extrabold transition-all border shadow-sm ${
            isCopiedNaver 
              ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-300' 
              : 'bg-[#03c75a] hover:bg-[#02b351] text-white border-[#02b351] shadow-green-500/20'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <span>{isCopiedNaver ? '네이버 서식 복사 완료 (Ctrl+V)' : '네이버 스마트에디터 서식 복사'}</span>
        </button>

        {/* 문서 관리 액션 (새문서, 임시저장, 공식발행) */}
        <div className="pt-2 border-t border-gray-200/80 dark:border-zinc-800 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <PremiumButton onClick={onCreateBlank} variant="secondary" className="!py-2.5 !text-xs rounded-none border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold hover:bg-gray-50 shadow-sm">
              새 문서
            </PremiumButton>
            <PremiumButton onClick={() => onSavePost(true)} disabled={isLoading} variant="secondary" className="!py-2.5 !text-xs rounded-none border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-bold text-gray-700 dark:text-zinc-300 hover:bg-gray-50 shadow-sm">
              임시 저장
            </PremiumButton>
          </div>
          <PremiumButton onClick={() => onSavePost(false)} disabled={isLoading} variant="primary" className="w-full !py-2.5 rounded-none text-xs font-extrabold !bg-gray-900 hover:!bg-black dark:!bg-white dark:!text-gray-900 border-none shadow-md">
            {isLoading ? '발행 처리 중...' : '웹사이트 공식 발행하기'}
          </PremiumButton>
        </div>
      </div>
    </div>
  );

  return (
    <AdminPanelLayout innerClassName="flex-col md:flex-row gap-2.5 relative min-w-0">
      {/* ── 🏝️ 1. 좌측/중앙 메인 에디터 카드 아일랜드 (3D 직각 레이아웃) ── */}
      <PremiumCard borderColor="blue" hoverEffect={true} className="flex-1 flex flex-col min-w-0 !p-0 h-full overflow-hidden bg-white dark:bg-[#202124]">
        <div className="flex-1 min-h-0 flex flex-col overflow-y-auto custom-scrollbar">
          <MarkdownEditor
            title={postMeta.title || ''}
            setTitle={(val) => setPostMeta((prev: any) => ({ ...prev, title: val }))}
            content={postMeta.content || ''}
            setContent={(val) => setPostMeta((prev: any) => ({ ...prev, content: typeof val === 'function' ? val(prev.content) : val }))}
          />
        </div>
      </PremiumCard>

      {/* ── 🏝️ 2. 우측 AI 어시스턴트 사이드바 카드 아일랜드 (데스크톱, 콤팩트 직각 3D) ── */}
      <PremiumCard borderColor="blue" hoverEffect={true} className="hidden md:flex w-80 lg:w-[340px] shrink-0 h-full !p-0 flex-col overflow-hidden bg-white dark:bg-[#202124]">
        {renderAiControls()}
      </PremiumCard>

      {/* ── 모바일 하단 플로팅 버튼 및 바텀시트 ── */}
      <div className="md:hidden fixed bottom-6 right-4 z-40">
        <button
          onClick={() => setIsMobileAiOpen(true)}
          className="bg-[var(--google-blue)] hover:bg-blue-700 text-white rounded-none p-3.5 shadow-xl flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
        >
          <span>AI 어시스턴트</span>
        </button>
      </div>

      <BottomSheet
        isOpen={isMobileAiOpen}
        onClose={() => setIsMobileAiOpen(false)}
      >
        <div className="h-[75vh]">
          {renderAiControls()}
        </div>
      </BottomSheet>
    </AdminPanelLayout>
  );
}
