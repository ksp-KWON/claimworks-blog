import React from 'react';

interface SettingsPanelProps {
  geminiKey: string;
  setGeminiKey: (val: string) => void;
  githubToken: string;
  setGithubToken: (val: string) => void;
  saveKeys: () => void;
}

export default function SettingsPanel({ geminiKey, setGeminiKey, githubToken, setGithubToken, saveKeys }: SettingsPanelProps) {
  return (
    <div className="flex-1 flex flex-col p-6 bg-gray-50 dark:bg-zinc-950 overflow-y-auto custom-scrollbar items-center justify-center">
      <div className="max-w-md w-full">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">API 환경 설정</h2>
          <p className="text-sm text-gray-500 mt-2">안전한 AI 연동 및 데이터 관리를 위한 자격 증명 설정입니다.</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm rounded-2xl p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Google Gemini API Key
              </label>
              <input 
                type="password" 
                value={geminiKey} 
                onChange={e => setGeminiKey(e.target.value)} 
                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono" 
                placeholder="AIzaSy..." 
              />
              <p className="text-xs text-gray-500">포스팅 자동 창작 및 원문 확장에 사용되는 구글 AI의 키본 키입니다.</p>
            </div>

            <hr className="border-gray-100 dark:border-zinc-800" />

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                GitHub Personal Token
              </label>
              <input 
                type="password" 
                value={githubToken} 
                onChange={e => setGithubToken(e.target.value)} 
                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-950 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono" 
                placeholder="ghp_..." 
              />
              <p className="text-xs text-gray-500">블로그 데이터(MD 파일)를 읽고 쓰고 삭제하기 위한 저장소 접근 권한입니다.</p>
            </div>
          </div>

          <button 
            onClick={saveKeys} 
            className="w-full bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold py-3.5 rounded-lg text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            안전하게 저장하기
          </button>
        </div>

        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl p-4 flex gap-3">
          <div className="text-blue-500 mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
            <strong>보안 안내:</strong> 입력하신 API 키워 토큰은 외부 서버나 데이터베이스로 절대 전송되지 않으며, 오직 원장님이 현재 사용 중이신 브라우저의 로컬 스토리지에만 암호화되어 보관됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
