import React from 'react';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumButton from '@/components/ui/PremiumButton';

interface SettingsPanelProps {
  geminiKey: string;
  setGeminiKey: (val: string) => void;
  githubToken: string;
  setGithubToken: (val: string) => void;
  saveKeys: () => void;
}

export default function SettingsPanel({ geminiKey, setGeminiKey, githubToken, setGithubToken, saveKeys }: SettingsPanelProps) {
  return (
    <div className="flex-1 flex flex-col bg-[#f8f9fa] dark:bg-zinc-950 overflow-hidden relative">
      <div className="h-14 px-4 sm:px-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center shrink-0 shadow-sm z-10 w-full overflow-x-auto">
        <div className="flex items-center gap-3 shrink-0">
          <PremiumHeading level={2} className="!text-lg !mb-0 flex items-center gap-2">
            ⚙️ 환경 설정
          </PremiumHeading>
          <span className="text-[10px] md:text-xs text-gray-400 font-medium hidden sm:inline">안전한 AI 연동 및 블로그 데이터 관리를 위한 자격 증명 설정입니다.</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-10">
        <div className="max-w-3xl mx-auto w-full flex flex-col h-full space-y-6">
          <PremiumCard className="p-8 md:p-10 border-t-4 border-t-gray-800 dark:border-t-white shadow-xl">
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-5 ring-1 ring-gray-200 dark:ring-zinc-700 shadow-sm">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <PremiumHeading level={3} className="!text-2xl mb-2">보안 자격 증명</PremiumHeading>
              <p className="text-gray-500 font-medium">통합 관리자 시스템 구동에 필요한 외부 API 키를 입력해주세요.</p>
            </div>

            <div className="space-y-8 bg-gray-50/50 dark:bg-zinc-950/50 border border-gray-100 dark:border-zinc-800 rounded-2xl p-8 mb-10 shadow-inner">
              <div className="flex flex-col gap-3">
                <label className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></span>
                  Google Gemini API Key
                </label>
                <input 
                  type="password" 
                  value={geminiKey} 
                  onChange={e => setGeminiKey(e.target.value)} 
                  className="w-full px-5 py-3.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all font-mono shadow-sm" 
                  placeholder="AIzaSy..." 
                />
                <p className="text-xs text-gray-500 ml-1 font-medium">포스팅 자동 창작 및 원문 확장에 사용되는 구글 AI의 기본 키입니다.</p>
              </div>

              <div className="h-px w-full bg-gray-200 dark:bg-zinc-800"></div>

              <div className="flex flex-col gap-3">
                <label className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-800 dark:bg-white shadow-sm shadow-gray-500/50"></span>
                  GitHub Personal Token
                </label>
                <input 
                  type="password" 
                  value={githubToken} 
                  onChange={e => setGithubToken(e.target.value)} 
                  className="w-full px-5 py-3.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:border-gray-500 focus:ring-4 focus:ring-gray-500/20 transition-all font-mono shadow-sm" 
                  placeholder="ghp_..." 
                />
                <p className="text-xs text-gray-500 ml-1 font-medium">블로그 데이터를 읽고 쓰고 삭제하기 위한 저장소(Repository) 접근 권한입니다.</p>
              </div>
            </div>

            <PremiumButton 
              onClick={saveKeys} 
              variant="primary"
              className="w-full !py-4 !text-base !rounded-xl bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 shadow-xl"
            >
              <span className="flex items-center justify-center gap-2 font-bold">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                안전하게 기기에 저장하기
              </span>
            </PremiumButton>

            <div className="mt-8 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-5 flex gap-4">
              <div className="text-blue-500 shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed font-medium">
                <strong className="block mb-1 text-sm">보안 안내</strong>
                입력하신 API 키워 토큰은 외부 서버나 데이터베이스로 절대 전송되지 않으며, 오직 원장님이 현재 사용 중이신 브라우저의 로컬 스토리지에만 안전하게 보관됩니다.
              </p>
            </div>
          </PremiumCard>
        </div>
      </div>
    </div>
  );
}
