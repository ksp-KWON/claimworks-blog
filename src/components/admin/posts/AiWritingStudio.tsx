import React, { useState } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumButton from '@/components/ui/PremiumButton';
import PremiumHeading from '@/components/ui/PremiumHeading';
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
    desc: '원문 내용을 100% 보존하며 가독성 높은 블로그 형태로 소제목과 불릿 포인트를 활용해 예쁘게 포장합니다.',
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
    desc: '대본이나 뼈대만 입력하면 AI가 전문 지식을 대거 추가하여 방대하고 깊이 있는 전문 칼럼으로 창작합니다.',
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
    desc: '키워드나 뉴스 링크만 제공하면 데일리 글쓰기용 전문 칼럼을 AI가 처음부터 끝까지 기획 및 창작합니다.',
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
    desc: '법률 판례와 트렌드 이슈를 종합하여 최적의 주제로 자동 발행',
    accentClass: 'border-rose-500 bg-rose-50/50 dark:bg-rose-900/10',
    iconBg: 'from-rose-500 to-orange-500',
    textColor: 'text-rose-600 dark:text-rose-400',
  },
  {
    id: 'precedent',
    icon: '⚖️',
    label: '전문 법률 칼럼',
    desc: '판례 및 심결례 기반의 보상·손해사정 전문 분석 포스팅',
    accentClass: 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10',
    iconBg: 'from-indigo-500 to-blue-600',
    textColor: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    id: 'trend',
    icon: '📈',
    label: '일간 트렌드',
    desc: '실시간 검색어와 이슈 기반의 정보성 트래픽 유입 목적 포스팅',
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

  const selectedManualMode = MANUAL_MODES.find(m => m.id === aiMode)!;
  const selectedAutoType = AUTO_TYPES.find(t => t.id === autoType)!;

  const tabs = [
    { id: 'manual', label: '✨ 창작모드', color: 'blue' },
    { id: 'auto',   label: '⚡ 자동모드', color: 'indigo' },
    { id: 'editor', label: '📝 에디터',   color: 'green' },
  ] as const;

  return (
    <div className="flex-1 flex flex-col bg-[#f8f9fa] dark:bg-zinc-950 overflow-hidden relative">

      {/* ── 헤더 ── */}
      <div className="shrink-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 shadow-sm z-10">

        {/* 타이틀 행 */}
        <div className="px-5 pt-4 pb-3 flex items-center gap-3">
          {/* 아이콘 */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>

          <div className="min-w-0">
            <PremiumHeading level={2} className="!text-base !mb-0 !leading-tight">
              AI 크리에이터 스튜디오
            </PremiumHeading>
            <p className="text-[11px] text-gray-400 font-medium hidden sm:block truncate">
              원문 기반 창작 · 백그라운드 자동 발행 · 포스팅 에디터
            </p>
          </div>
        </div>

        {/* 탭 행 */}
        <div className="flex border-t border-gray-100 dark:border-zinc-800 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative flex-1 min-w-[90px] py-3 text-sm font-bold transition-all whitespace-nowrap
                ${activeTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                }
              `}
            >
              {tab.label}
              {/* 활성 인디케이터 바 */}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── 에디터 탭 ── */}
      {activeTab === 'editor' ? (
        <div className="flex flex-col flex-1 h-full relative">
          <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 shrink-0">
            <div className="flex items-center gap-2">
              <PremiumBadge color="green">에디터</PremiumBadge>
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200">포스팅 에디터</span>
            </div>
            <div className="flex gap-2">
              <PremiumButton onClick={onCreateBlank} variant="secondary" className="!py-1.5 !px-3 !text-xs">
                새 문서
              </PremiumButton>
              <PremiumButton onClick={onSavePost} disabled={isLoading} className="!py-1.5 !px-4 !text-xs">
                {isLoading ? '저장 중...' : '저장 및 발행'}
              </PremiumButton>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <MarkdownEditor
              title={postMeta.title} setTitle={(t: string) => setPostMeta((prev: any) => ({ ...prev, title: t }))}
              content={postMeta.content} setContent={(c: any) => setPostMeta((prev: any) => ({ ...prev, content: typeof c === 'function' ? c(prev.content) : c }))}
            />
          </div>
        </div>

      /* ── 창작모드 / 자동모드 탭 ── */
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6">
          <div className="max-w-4xl mx-auto w-full space-y-5">

            {/* ─ 창작모드 ─ */}
            {activeTab === 'manual' && (
              <>
                {/* 섹션 제목 */}
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full" />
                  <PremiumHeading level={3} className="!text-base !mb-0">창작 방식 선택</PremiumHeading>
                  <PremiumBadge color="blue">Manual</PremiumBadge>
                </div>

                {/* 모드 카드 3종 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {MANUAL_MODES.map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setAiMode(mode.id as any)}
                      className={`
                        relative flex flex-col p-5 rounded-2xl border-2 text-left transition-all group
                        ${aiMode === mode.id
                          ? mode.accentClass + ' shadow-md'
                          : 'border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-gray-200 hover:shadow-sm'
                        }
                      `}
                    >
                      {/* 선택 인디케이터 */}
                      {aiMode === mode.id && (
                        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-current animate-pulse" style={{ color: 'inherit' }} />
                      )}
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

                {/* 입력창 */}
                <PremiumCard className="p-5 border-l-4 border-l-blue-500">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">
                    <PremiumBadge color="blue">Input</PremiumBadge>
                    {aiMode === 'semi-auto' ? '키워드 또는 참고 링크' : '유튜브 대본 / 원문'}
                  </label>
                  <textarea
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    className="w-full min-h-[220px] p-4 rounded-xl border border-gray-200 dark:border-zinc-700 bg-[#f8f9fa] dark:bg-zinc-950 text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none custom-scrollbar"
                    placeholder={
                      aiMode === 'semi-auto'
                        ? '참고할 링크 주소나 핵심 키워드를 적어주세요...\n\n예시:\n- 음주운전 면허취소 구제 방법\n- https://news.naver.com/...'
                        : '가공할 원문 대본이나 텍스트를 이곳에 붙여넣으세요...'
                    }
                  />
                  <div className="flex justify-end gap-2 mt-3">
                    <PremiumButton
                      onClick={onCreateBlank}
                      variant="secondary"
                      className="!py-2"
                      title="빈 에디터로 이동"
                    >
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        빈 에디터
                      </span>
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
                </PremiumCard>
              </>
            )}

            {/* ─ 자동모드 ─ */}
            {activeTab === 'auto' && (
              <>
                {/* 섹션 제목 */}
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
                  <PremiumHeading level={3} className="!text-base !mb-0">백그라운드 자동화 엔진</PremiumHeading>
                  <PremiumBadge color="purple">Auto</PremiumBadge>
                </div>

                {/* 설명 배너 */}
                <PremiumCard className="p-4 border-l-4 border-l-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/10">
                  <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300 flex items-start gap-2">
                    <span className="text-lg shrink-0 mt-0.5">⚡</span>
                    데이터 수집부터 포스팅 작성, 저장까지 AI가 백그라운드에서 완전히 스스로 진행합니다. 아래에서 엔진 유형을 선택하고 가동하세요.
                  </p>
                </PremiumCard>

                {/* 타입 카드 3종 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {AUTO_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setAutoType(type.id as any)}
                      className={`
                        flex flex-col p-5 rounded-2xl border-2 text-left transition-all group
                        ${autoType === type.id
                          ? type.accentClass + ' shadow-md'
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

                {/* 실행 버튼 */}
                <PremiumCard className="p-5 border-l-4 border-l-indigo-500">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-0.5">선택된 엔진: <span className={selectedAutoType.textColor}>{selectedAutoType.label}</span></p>
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
                          작업 실행 중...
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
                  <p className="mt-3 text-[11px] text-gray-400 font-medium border-t border-gray-100 dark:border-zinc-800 pt-3">
                    ⚠ 버튼을 누르면 백그라운드 서버에서 파이프라인이 즉시 가동됩니다.
                  </p>
                </PremiumCard>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
