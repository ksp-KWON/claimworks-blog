'use client';

/**
 * ContentGuard.tsx
 * 보상스쿨 지식재산권 보호 및 불법 스크랩 방지 국제 표준 전역 가드 컴포넌트
 * 
 * [원칙: 표준, 범용, 콤팩트, 통합, 공유, 공통]
 * - W3C DOM Event Delegation 패턴 기반 단일 리스너 운영 (초경량 무결점 런타임)
 * - Googlebot / Yeti 등 검색엔진 크롤러(HTML 파싱)의 색인 및 SEO에 0.0001%의 간섭도 없음
 * - 관리자 페이지(/admin) 및 폼 입력 필드(input, textarea) 완벽 자동 예외 처리
 * - 불법 복제/우클릭 시도 시 품격 있는 저작권 보호 토스트 안내
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import AppIcon from '@/components/ui/AppIcon';

export default function ContentGuard() {
  const pathname = usePathname();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 품격 있는 저작권 알림 토스트 표시 (디바운스 처리)
  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  }, []);

  useEffect(() => {
    // 1. 관리자 페이지(/admin)에서는 모든 보안 가드를 자동 해제하여 자유로운 업무 보장
    if (pathname && pathname.startsWith('/admin')) {
      return;
    }

    // 폼 입력 필드인지 검사 (검색창, 입력폼 등에서는 정상 작동 보장)
    const isInteractiveElement = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof HTMLElement)) return false;
      const tag = target.tagName.toLowerCase();
      return (
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        target.isContentEditable ||
        Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
      );
    };

    // 2. 우클릭 컨텍스트 메뉴 차단
    const handleContextMenu = (e: MouseEvent) => {
      if (isInteractiveElement(e.target)) return;
      e.preventDefault();
      showToast('보상스쿨의 전문 칼럼은 저작권법의 보호를 받습니다. 무단 복제 및 전재를 금합니다.');
    };

    // 3. 복사 이벤트 가로채기
    const handleCopy = (e: ClipboardEvent) => {
      if (isInteractiveElement(e.target)) return;
      e.preventDefault();
      showToast('보상스쿨의 전문 칼럼은 저작권법의 보호를 받습니다. 무단 복제를 금합니다.');
    };

    // 4. 불법 복제 단축키 차단 (Ctrl+C, Ctrl+A, Ctrl+U, Ctrl+S)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInteractiveElement(e.target)) return;

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (!isCtrlOrCmd) return;

      const key = e.key.toLowerCase();

      // Ctrl + C (복사), Ctrl + A (전체선택), Ctrl + U (소스보기), Ctrl + S (저장)
      if (key === 'c' || key === 'a' || key === 'u' || key === 's') {
        e.preventDefault();
        showToast('보상스쿨의 전문 칼럼은 저작권법의 보호를 받습니다. 무단 복제를 금합니다.');
      }
    };

    // W3C 표준 이벤트 캡처링 등록
    document.addEventListener('contextmenu', handleContextMenu, { capture: true });
    document.addEventListener('copy', handleCopy, { capture: true });
    document.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      document.removeEventListener('copy', handleCopy, { capture: true });
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [pathname, showToast]);

  if (!toastMessage) return null;

  return (
    <aside aria-label="저작권 안내" className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] animate-bounce-short pointer-events-none px-4 w-full max-w-md">
      <div className="bg-zinc-900/95 dark:bg-black/95 backdrop-blur-md text-white px-4 py-3 rounded-none border border-indigo-500/40 shadow-[0_12px_40px_rgba(0,0,0,0.5)] flex items-center gap-3">
        <div className="w-8 h-8 rounded-none bg-indigo-900/50 border border-indigo-500/50 flex items-center justify-center shrink-0 text-indigo-400">
          <AppIcon name="shield-alert" size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-[13px] font-bold text-gray-100 leading-snug break-keep">
            {toastMessage}
          </p>
          <span className="text-[11px] text-indigo-300/90 font-medium block mt-0.5">
            보상스쿨 지식재산권 보호 시스템 작동 중
          </span>
        </div>
      </div>
    </aside>
  );
}
