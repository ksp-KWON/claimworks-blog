import React, { ReactNode, useEffect } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** 백드롭(어두운 배경)을 보여줄지 여부 (기본값: false) */
  showBackdrop?: boolean;
  /** 데스크탑에서는 무시되는 모바일 전용 모달 (기본값: true) */
  mobileOnly?: boolean;
  /** 바닥에서의 기본 위치 간격 (예: 하단 네비바 높이) */
  bottomOffset?: string;
  /** z-index 값 */
  zIndex?: string;
  /** 최대 높이 제한 */
  maxHeight?: string;
  /** 내부 여백 */
  padding?: string;
}

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  showBackdrop = false,
  mobileOnly = true,
  bottomOffset = 'bottom-[64px]',
  zIndex = 'z-[95]',
  maxHeight = 'max-h-[70vh]',
  padding = 'p-5 pb-8'
}: BottomSheetProps) {
  
  // 모달 활성화 시 배경 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none'; // iOS Safari 대응
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [isOpen]);

  const displayClass = mobileOnly ? 'md:hidden flex' : 'flex';

  return (
    <>
      {/* Backdrop */}
      {showBackdrop && (
        <div 
          className={`${displayClass} fixed inset-0 bg-black/50 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          style={{ zIndex: parseInt(zIndex.replace(/[^0-9]/g, '')) - 1 || 40 }}
          onClick={onClose}
        />
      )}

      {/* Bottom Sheet */}
      <div 
        className={`${displayClass} fixed ${bottomOffset} left-0 w-full bg-white dark:bg-[#202124] rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] ${zIndex} transition-transform duration-300 transform ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ touchAction: isOpen ? 'auto' : 'none' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`w-full flex flex-col ${padding} space-y-4 ${maxHeight} overflow-y-auto overscroll-contain`}>
          {/* Drag Handle Indicator */}
          <div 
            className="w-12 h-1.5 bg-gray-200 dark:bg-white/20 rounded-full mx-auto mb-6 shrink-0 cursor-pointer" 
            onClick={onClose}
          />
          {children}
        </div>
      </div>
    </>
  );
}
