import React, { useState } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumButton from '@/components/ui/PremiumButton';
import PremiumBadge from '@/components/ui/PremiumBadge';
import MarkdownEditor from '@/components/admin/MarkdownEditor';

interface AiWritingStudioProps {
  isLoading: boolean;
  onRunAi: (mode: 'manual-preserve' | 'manual-expand' | 'semi-auto', inputText: string) => void;
  onRunAuto: (type: 'all' | 'precedent' | 'trend') => void;
  activeTab: 'manual' | 'auto' | 'editor';
  setActiveTab: (tab: 'manual' | 'auto' | 'editor') => void;
  postMeta: any;
  setPostMeta: any;
  onSavePost: () => void;
  onCreateBlank: () => void;
}

const MANUAL_MODES = [
  {
    id: 'manual-preserve',
    icon: '💎',
    label: '초안 다듬기',
    badge: '보존형',
    badgeColor: 'blue' as const,
    desc: '원문을 100% 보존하며 소제목·불릿 포인트 형태로 포장합니다.',
    accentClass: 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-700 dark:text-blue-400',
  },
  {
    id: 'manual-expand',
    icon: '🚀',
    label: '초안 확장',
    badge: '창작형',
    badgeColor: 'purple' as const,
    desc: '뼈대만 입력하면 AI가 전문 지식을 추가해 깊이 있는 칼럼으로 창작합니다.',
    accentClass: 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/10',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-700 dark:text-purple-400',
  },
  {
    id: 'semi-auto',
    icon: '🔗',
    label: '링크 / 키워드',
    badge: '반자동',
    badgeColor: 'green' as const,
    desc: '키워드나 링크만 제공하면 AI가 처음부터 끝까지 기획·창작합니다.',
    accentClass: 'border-green-500 bg-green-50/50 dark:bg-green-900/10',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-400',
  },
];

const AUTO_TYPES = [
  {
    id: 'all',
    icon: '🔥',
    label: '통합 자동화',
    desc: '판례·트렌드 이슈를 종합하여 최적 주제로 자동 발행',
    accentClass: 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/10',
    iconBg: 'from-rose-500 to-orange-500',
    textColor: 'text-rose-600 dark:text-rose-400',
  },
  {
    id: 'precedent',
    icon: '⚖️',
    label: '전문 법률 칼럼',
    desc: '판례·심결례 기반의 보상·손해사정 전문 분석 포스팅',
    accentClass: 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10',
    iconBg: 'from-indigo-500 to-blue-600',
    textColor: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    id: 'trend',
    icon: '📈',
    label: '일간 트렌드',
    desc: '실시간 이슈 기반의 트래픽 유입 목적 포스팅',
    accentClass: 'border-teal-500 bg-teal-50/50 dark:bg-teal-900/10',
    iconBg: 'from-teal-500 to-emerald-500',
    textColor: 'text-teal-600 dark:text-teal-400',
  },
];

export default function AiWritingStudio({
  isLoading, onRunAi, onRunAuto,
  activeTab, setActiveTab,
  postMeta, setPostMeta, onSavePost, onCreateBlank
}: AiWritingStudioProps) {
  const [inputText, setInputText] = useState('');
  const [aiMode, setAiMode] = useState<'manual-preserve' | 'manual-expand' | 'semi-auto'>('manual-preserve');
  const [autoType, setAutoType] = useState<'all' | 'precedent' | 'trend'>('all');

  const selectedAutoType = AUTO_TYPES.find(t => t.id === autoType)!;

  const tabs = [
    { id: 'manual', label: '✨ 창작모드' },
    { id: 'auto',   label: '⚡ 자동모드' },
    { id: 'editor', label: '📝 에디터' },
  ] as const;

  return (
    <div className="flex-1 flex flex-col bg-[#f8f9fa] dark:bg-zinc-950 overflow-hidden relative">

      {/* ── 통합 헤더 (타이틀 + 탭 한 줄) ── */}
      <div className="shrink-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 shadow-sm z-10">
        <div className="flex items-center h-14 px-5 gap-4 overflow-x-auto">

          {/* 아이콘 + 타이틀 */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="text-base font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">AI 크리에이터 스튜디오</span>
          </div>

          {/* 구분선 */}
          <div className="h-6 w-px bg-gray-200 dark:bg-zinc-700 shrink-0" />

          {/* 탭 */}
          <div className="flex gap-1 shrink-0">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 에디터 액션 버튼 (에디터 탭에서만 활성화) */}
          {activeTab === 'editor' && (
            <div className="ml-auto flex items-center gap-2 pl-4 shrink-0">
              <PremiumButton onClick={onCreateBlank} variant="secondary" className="!py-1.5 !px-3 !text-xs">
                새 문서
              </PremiumButton>
              <PremiumButton onClick={onSavePost} disabled={isLoading} className="!py-1.5 !px-4 !text-xs">
                {isLoading ? '저장 중...' : '저장 및 발행'}
              </PremiumButton>
            </div>
          )}
        </div>
      </div>

      {/* ── 에디터 탭 ── */}
      {activeTab === 'editor' ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* 에디터 작업영역 — h-full로 꽉 채움, 스크롤은 MarkdownEditor 내부에서 처리 */}
          <div className="flex-1 overflow-hidden h-full">
            <MarkdownEditor
              title={postMeta.title} setTitle={(t: string) => setPostMeta((prev: any) => ({ ...prev, title: t }))}
              content={postMeta.content} setContent={(c: any) => setPostMeta((prev: any) => ({ ...prev, content: typeof c === 'function' ? c(prev.content) : c }))}
            />
          </div>
        </div>

      /* ── 창작모드 / 자동모드 ── */
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
          <div className="max-w-4xl mx-auto w-full space-y-4">

            {/* ─ 창작모드 ─ */}
            {activeTab === 'manual' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {MANUAL_MODES.map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setAiMode(mode.id as any)}
                      className={`
                        flex flex-col p-5 rounded-none border-2 text-left transition-all group
                        ${aiMode === mode.id
                          ? mode.accentClass + ' shadow-sm'
                          : 'border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-gray-200 hover:shadow-sm'
                        }
                      `}
                    >
                      <div className={`w-10 h-10 rounded-xl ${mode.iconBg} flex items-center justify-center text-xl mb-3 group-hover:scale-105 transition-transform`}>
                        {mode.icon}
                      </div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-sm font-bold ${aiMode === mode.id ? mode.textColor : 'text-gray-800 dark:text-gray-100'}`}>
                          {mode.label}
                        </span>
                        <PremiumBadge color={mode.badgeColor} className="!text-[10px] !px-1.5 !py-0.5">{mode.badge}</PremiumBadge>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{mode.desc}</p>
                    </button>
                  ))}
                </div>

                {/* 입력창 — 각진 사각형, PremiumCard 3D 입체 스타일 */}
                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] p-5">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">
                    <PremiumBadge color="blue">Input</PremiumBadge>
                    {aiMode === 'semi-auto' ? '키워드 또는 참고 링크' : '유튜브 대본 / 원문'}
                  </label>
                  <textarea
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    className="w-full min-h-[220px] p-4 border border-gray-200 dark:border-zinc-700 bg-[#f8f9fa] dark:bg-zinc-950 text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none custom-scrollbar"
                    placeholder={
                      aiMode === 'semi-auto'
                        ? '참고할 링크 주소나 핵심 키워드를 적어주세요...\n\n예시:\n- 음주운전 면허취소 구제 방법\n- https://news.naver.com/...'
                        : '가공할 원문 대본이나 텍스트를 이곳에 붙여넣으세요...'
                    }
                  />
                  <div className="flex justify-end gap-2 mt-3">
                    <PremiumButton onClick={onCreateBlank} variant="secondary" className="!py-2">
                      빈 에디터
                    </PremiumButton>
                    <PremiumButton
                      onClick={() => onRunAi(aiMode, inputText)}
                      disabled={isLoading || !inputText.trim()}
                      variant="primary"
                      className="!py-2 !px-6"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          작성 중...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          창작 시작
                        </span>
                      )}
                    </PremiumButton>
                  </div>
                </div>
              </>
            )}

            {/* ─ 자동모드 ─ */}
            {activeTab === 'auto' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {AUTO_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setAutoType(type.id as any)}
                      className={`
                        flex flex-col p-5 rounded-none border-2 text-left transition-all group
                        ${autoType === type.id
                          ? type.accentClass + ' shadow-sm'
                          : 'border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-gray-200 hover:shadow-sm'
                        }
                      `}
                    >
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${type.iconBg} flex items-center justify-center text-xl mb-3 shadow-sm group-hover:scale-105 transition-transform`}>
                        {type.icon}
                      </div>
                      <span className={`text-sm font-bold mb-1.5 ${autoType === type.id ? type.textColor : 'text-gray-800 dark:text-gray-100'}`}>
                        {type.label}
                      </span>
                      <p className="text-xs text-gray-500 leading-relaxed">{type.desc}</p>
                    </button>
                  ))}
                </div>

                {/* 실행 패널 — 각진 사각형, 3D 입체 스타일 */}
                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-0.5">
                        선택: <span className={selectedAutoType.textColor}>{selectedAutoType.label}</span>
                      </p>
                      <p className="text-xs text-gray-400">{selectedAutoType.desc}</p>
                    </div>
                    <PremiumButton
                      onClick={() => onRunAuto(autoType)}
                      disabled={isLoading}
                      variant="primary"
                      className="!py-3 !px-8 shrink-0"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          실행 중...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          엔진 가동
                        </span>
                      )}
                    </PremiumButton>
                  </div>
                  <p className="mt-3 text-[11px] text-gray-400 border-t border-gray-100 dark:border-zinc-800 pt-3">
                    ⚠ 버튼을 누르면 백그라운드 파이프라인이 즉시 가동됩니다.
                  </p>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
