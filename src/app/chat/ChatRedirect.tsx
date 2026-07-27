"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatRedirect() {
  const router = useRouter();

  useEffect(() => {
    // 렌더링 즉시 메인 페이지의 채팅 오픈 쿼리로 리다이렉트 (클라이언트단)
    router.replace('/?chat=open');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-[#1a1b1e]">
      <div className="flex flex-col items-center gap-4">
        {/* 스피너 */}
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 dark:text-gray-400 font-medium font-jua tracking-wide text-lg">
          보상스쿨 실시간 채팅 연결 중...
        </p>
      </div>
    </div>
  );
}
