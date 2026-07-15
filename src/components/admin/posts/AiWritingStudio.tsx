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

export default function AiWritingStudio({ 
  isLoading, onRunAi, onRunAuto, 
  activeTab, setActiveTab,
  postMeta, setPostMeta, onSavePost, onCreateBlank
}: AiWritingStudioProps) {
  const [inputText, setInputText] = useState('');
  const [aiMode, setAiMode] = useState<'manual-preserve' | 'manual-expand' | 'semi-auto'>('manual-preserve');
  const [autoType, setAutoType] = useState<'all' | 'precedent' | 'trend'>('all');

  return (
    <div className="flex-1 flex flex-col bg-[#f8f9fa] dark:bg-zinc-950 overflow-hidden relative">
      <div className="h-14 px-4 sm:px-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center shrink-0 shadow-sm z-10 w-full overflow-x-auto">
        <div className="flex items-center gap-3 shrink-0 mr-4">
          <PremiumHeading level={2} className="!text-lg !mb-0 flex items-center gap-2">
            ✨ AI 크리에이터 스튜디오
          </PremiumHeading>
          <span className="text-[10px] md:text-xs text-gray-400 font-medium hidden lg:inline">원문을 기반으로 창작하거나 백그라운드 엔진을 통해 포스팅을 자동 발행합니다.</span>
        </div>
        
        <div className="flex bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg shrink-0 h-10">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 rounded-md font-bold text-sm transition-all ${
              activeTab === 'manual' 
                ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            창작모드
          </button>
          <button
            onClick={() => setActiveTab('auto')}
            className={`px-4 rounded-md font-bold text-sm transition-all ${
              activeTab === 'auto' 
                ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            자동모드
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-4 rounded-md font-bold text-sm transition-all ${
              activeTab === 'editor' 
                ? 'bg-white dark:bg-zinc-700 text-green-600 dark:text-green-400 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            에디터
          </button>
        </div>
      </div>

      {activeTab === 'editor' ? (
        <div className="flex flex-col flex-1 h-full relative">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 shrink-0">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm">포스팅 에디터</h3>
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
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto w-full flex flex-col h-full space-y-6">
            <PremiumCard className="p-6 md:p-8 border-t-4 border-t-blue-500 min-h-[500px]">
              {activeTab === 'manual' ? (
                <div className="flex flex-col h-full animate-in fade-in duration-300">
                <div className="mb-6">
                  <PremiumHeading level={3} className="!text-xl mb-2">창작 모드 선택</PremiumHeading>
                  <p className="text-gray-500 text-sm">입력하신 데이터를 기반으로 AI가 어떤 스타일로 포스팅을 작성할지 선택하세요.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {[
                    { id: 'manual-preserve', icon: '💎', label: '초안 다듬기 (보존형)', desc: '원문 내용을 100% 보존하며 가독성 높은 블로그 형태로 소제목과 불릿 포인트를 활용해 예쁘게 포장합니다.', color: 'blue' },
                    { id: 'manual-expand', icon: '🚀', label: '초안 확장형 (창작)', desc: '대본이나 뼈대만 입력하면, AI가 관련된 전문 지식을 대거 추가하여 아주 방대하고 깊이 있는 전문 칼럼으로 창작합니다.', color: 'indigo' },
                    { id: 'semi-auto', icon: '🔗', label: '링크/키워드 (창작)', desc: '단순 키워드나 뉴스 링크만 제공하면, 데일리 글쓰기용 방대한 전문 칼럼을 AI가 처음부터 끝까지 자동 기획 및 창작합니다.', color: 'green' }
                  ].map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setAiMode(mode.id as any)}
                      className={`flex flex-col p-5 rounded-xl border-2 text-left transition-all group ${
                        aiMode === mode.id 
                          ? `border-${mode.color}-500 bg-${mode.color}-50 dark:bg-${mode.color}-900/10 shadow-md` 
                          : 'border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-gray-300 dark:hover:border-zinc-600 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl group-hover:scale-110 transition-transform origin-left">{mode.icon}</span>
                        <span className={`text-base font-bold ${aiMode === mode.id ? `text-${mode.color}-700 dark:text-${mode.color}-400` : 'text-gray-800 dark:text-gray-200'}`}>
                          {mode.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed font-medium">
                        {mode.desc}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-3 flex-1 bg-gray-50 dark:bg-zinc-950/50 p-6 rounded-xl border border-gray-100 dark:border-zinc-800">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <PremiumBadge color="blue">Input</PremiumBadge>
                    {aiMode === 'semi-auto' ? '키워드 또는 참고 링크' : '유튜브 대본 등 원문'}
                  </label>
                  <textarea
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    className="w-full flex-1 min-h-[250px] p-5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm resize-none focus:ring-2 focus:ring-blue-500 outline-none custom-scrollbar shadow-inner"
                    placeholder={
                      aiMode === 'semi-auto' 
                        ? "참고할 링크 주소나 핵심 키워드를 적어주세요...\n\n예시:\n- 음주운전 면허취소 구제 방법\n- https://news.naver.com/..." 
                        : "가공할 원문 대본이나 텍스트를 이곳에 붙여넣으세요..."
                    }
                  />
                  <div className="flex justify-end mt-4 gap-3">
                    <PremiumButton
                      onClick={onCreateBlank}
                      variant="secondary"
                      className="!py-2.5"
                      title="아무 내용 없이 빈 에디터로 바로 이동합니다"
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        빈 에디터 열기
                      </span>
                    </PremiumButton>
                    <PremiumButton
                      onClick={() => onRunAi(aiMode, inputText)}
                      disabled={isLoading || !inputText.trim()}
                      variant="primary"
                      className="!py-2.5 !px-8"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          작성 중...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          창작 시작
                        </span>
                      )}
                    </PremiumButton>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full items-center justify-center animate-in fade-in duration-300 py-10">
                <div className="text-center mb-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-500/20 ring-4 ring-indigo-50 dark:ring-indigo-900/20">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <PremiumHeading level={3} className="!text-2xl mb-2">백그라운드 완전 자동화 엔진</PremiumHeading>
                  <p className="text-gray-500 font-medium">데이터 수집부터 포스팅 작성, 저장까지 AI가 백그라운드에서 완전히 스스로 진행합니다.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12 w-full max-w-3xl mx-auto">
                  {[
                    { id: 'all', icon: '🔥', label: '통합 자동화', desc: '법률 판례와 트렌드 이슈를 종합하여 최적의 주제로 자동 발행' },
                    { id: 'precedent', icon: '⚖️', label: '전문 법률 칼럼', desc: '판례 및 심결례 기반의 깊이 있는 보상/손해사정 전문 분석' },
                    { id: 'trend', icon: '📈', label: '일간 트렌드 분석', desc: '실시간 검색어와 이슈 기반의 정보성 트래픽 유입 목적 포스팅' }
                  ].map(type => (
                    <button
                      key={type.id}
                      onClick={() => setAutoType(type.id as any)}
                      className={`flex flex-col p-6 rounded-2xl border-2 text-center items-center transition-all group ${
                        autoType === type.id 
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10 shadow-md scale-105' 
                          : 'border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-gray-300 dark:hover:border-zinc-600 hover:shadow-sm'
                      }`}
                    >
                      <div className="text-4xl mb-4 group-hover:-translate-y-1 transition-transform">{type.icon}</div>
                      <h4 className={`text-base font-bold mb-2 ${autoType === type.id ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-900 dark:text-gray-100'}`}>
                        {type.label}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                        {type.desc}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="max-w-md mx-auto w-full">
                  <PremiumButton
                    onClick={() => onRunAuto(autoType)}
                    disabled={isLoading}
                    variant="primary"
                    className="w-full !py-4 !text-lg !rounded-xl !bg-indigo-600 hover:!bg-indigo-700 shadow-xl shadow-indigo-600/20"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        작업 실행 중...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        🚀 선택한 모드로 엔진 가동
                      </span>
                    )}
                  </PremiumButton>
                  <p className="text-center text-xs font-bold text-gray-400 mt-4 bg-gray-50 dark:bg-zinc-900 p-2 rounded-lg border border-gray-100 dark:border-zinc-800">
                    버튼을 누르면 백그라운드 서버에서 파이프라인이 즉시 가동됩니다.
                  </p>
                </div>
              </div>
            )}
            </PremiumCard>
          </div>
        </div>
      )}
    </div>
  );
}
