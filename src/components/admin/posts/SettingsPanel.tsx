import React, { useState, useEffect } from 'react';

// Base64 to Uint8Array helper for VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface SettingsPanelProps {
  geminiKey: string;
  setGeminiKey: (val: string) => void;
  githubToken: string;
  setGithubToken: (val: string) => void;
  saveKeys: () => void;
}

export default function SettingsPanel({ geminiKey, setGeminiKey, githubToken, setGithubToken, saveKeys }: SettingsPanelProps) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      }
    }
  };

  const subscribeUser = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('이 브라우저는 푸시 알림을 지원하지 않습니다.');
      return;
    }

    setSubscribing(true);
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      if (!publicVapidKey) {
        throw new Error('VAPID public key is not set in environment variables');
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify(subscription),
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        setIsSubscribed(true);
        alert('푸시 알림이 성공적으로 설정되었습니다!');
      } else {
        alert('푸시 알림 설정 중 서버 오류가 발생했습니다.');
      }
    } catch (error: any) {
      console.error('Failed to subscribe user: ', error);
      alert('푸시 알림 설정에 실패했습니다: ' + error.message);
    }
    setSubscribing(false);
  };

  return (
    <div className="flex-1 flex flex-col p-6 bg-gray-50 dark:bg-zinc-950 overflow-hidden">
      <div className="max-w-4xl mx-auto w-full flex flex-col h-full space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              ⚙️ API 환경 설정
            </h2>
            <p className="text-sm text-gray-500 mt-1">안전한 AI 연동 및 데이터 관리를 위한 자격 증명 설정입니다.</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm rounded-2xl p-8">
          <div className="max-w-2xl mx-auto flex flex-col h-full justify-center">
            
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-gray-200 dark:ring-zinc-700">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">보안 자격 증명</h3>
              <p className="text-gray-500">통합 관리자 시스템에 필요한 외부 서비스 API 키를 설정합니다.</p>
            </div>

            <div className="space-y-6 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 mb-8">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Google Gemini API Key
                </label>
                <input 
                  type="password" 
                  value={geminiKey} 
                  onChange={e => setGeminiKey(e.target.value)} 
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono" 
                  placeholder="AIzaSy..." 
                />
                <p className="text-xs text-gray-500">포스팅 자동 창작 및 원문 확장에 사용되는 구글 AI의 기본 키입니다.</p>
              </div>

              <hr className="border-gray-200 dark:border-zinc-800" />

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  GitHub Personal Token
                </label>
                <input 
                  type="password" 
                  value={githubToken} 
                  onChange={e => setGithubToken(e.target.value)} 
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-mono" 
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

            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-xl p-4 flex gap-3">
              <div className="text-blue-500 mt-0.5">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                <strong>보안 안내:</strong> 입력하신 API 키워 토큰은 외부 서버나 데이터베이스로 절대 전송되지 않으며, 오직 원장님이 현재 사용 중이신 브라우저의 로컬 스토리지에만 암호화되어 보관됩니다.
              </p>
            </div>

            {/* 푸시 알림 설정 */}
            <div className="mt-10 border-t border-gray-200 dark:border-zinc-800 pt-8">
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  🔔 실시간 푸시 알림
                </h3>
                <p className="text-sm text-gray-500 mb-4">현재 기기에서 새로운 상담이나 채팅 메시지를 푸시 알림으로 받습니다.</p>
                <button 
                  onClick={subscribeUser}
                  disabled={isSubscribed || subscribing}
                  className={`w-full font-bold py-3.5 rounded-lg text-sm shadow-sm transition-all flex items-center justify-center gap-2 ${
                    isSubscribed 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-default border border-green-200 dark:border-green-800/50' 
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {isSubscribed ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                      알림 수신 중 (설정 완료)
                    </>
                  ) : subscribing ? (
                    '설정 중...'
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                      이 기기에서 푸시 알림 켜기
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
