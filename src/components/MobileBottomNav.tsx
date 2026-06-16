'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type ModalType = 'none' | 'calculator' | 'category' | 'consult';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [openModal, setOpenModal] = useState<ModalType>('none');

  const closeModals = () => setOpenModal('none');

  // 모달 활성화 시 배경 스크롤 방지
  useEffect(() => {
    if (openModal !== 'none') {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none'; // iOS Safari 대응 (배경 터치 무시)
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [openModal]);

  const navItems = [
    {
      id: 'home',
      label: '홈',
      onClick: () => {
        closeModals();
        window.location.href = '/';
      },
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={pathname === '/' ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      ),
      isActive: pathname === '/' && openModal === 'none'
    },
    {
      id: 'calculator',
      label: '계산기',
      onClick: () => setOpenModal(openModal === 'calculator' ? 'none' : 'calculator'),
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={openModal === 'calculator' ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
          <line x1="8" y1="6" x2="16" y2="6"></line>
          <line x1="16" y1="14" x2="16.01" y2="14"></line>
          <line x1="12" y1="14" x2="12.01" y2="14"></line>
          <line x1="8" y1="14" x2="8.01" y2="14"></line>
          <line x1="16" y1="18" x2="16.01" y2="18"></line>
          <line x1="12" y1="18" x2="12.01" y2="18"></line>
          <line x1="8" y1="18" x2="8.01" y2="18"></line>
          <line x1="16" y1="10" x2="16.01" y2="10"></line>
          <line x1="12" y1="10" x2="12.01" y2="10"></line>
          <line x1="8" y1="10" x2="8.01" y2="10"></line>
        </svg>
      ),
      isActive: openModal === 'calculator'
    },
    {
      id: 'blog',
      label: '블로그',
      onClick: () => {
        closeModals();
        window.location.href = '/blog';
      },
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={pathname === '/blog' ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"></path>
          <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
          <path d="M3 15h6"></path>
          <path d="M3 19h6"></path>
          <path d="M10 15h8"></path>
          <path d="M10 19h8"></path>
        </svg>
      ),
      isActive: pathname === '/blog' && openModal === 'none'
    },
    {
      id: 'consult',
      label: '상담신청',
      onClick: () => setOpenModal(openModal === 'consult' ? 'none' : 'consult'),
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={openModal === 'consult' ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
      ),
      isActive: openModal === 'consult'
    }
  ];

  return (
    <>
      {/* 팝업 모달 백그라운드 오버레이 */}
      {openModal !== 'none' && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/40 z-[90] animate-in fade-in duration-200"
          onClick={closeModals}
          onTouchMove={(e) => e.preventDefault()}
        ></div>
      )}

      {/* 1. 계산기 팝업 */}
      <div 
        className={`lg:hidden fixed bottom-[54px] left-0 w-full bg-white dark:bg-[#202124] rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-[95] transition-transform duration-300 transform ${openModal === 'calculator' ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ touchAction: openModal === 'calculator' ? 'auto' : 'none' }}
      >
        <div className="p-5 pb-8 space-y-4 max-h-[70vh] overflow-y-auto overscroll-contain">
          <div className="w-12 h-1.5 bg-gray-200 dark:bg-white/20 rounded-full mx-auto mb-6"></div>
          <h3 className="font-bold text-lg text-[#202124] dark:text-white mb-4">보상 계산기 모음</h3>
          
          <Link href="/calculator/auto" onClick={closeModals} className="group flex items-center bg-white dark:bg-[#202124] rounded-2xl p-4 border border-gray-100 dark:border-white/5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(26,115,232,0.15)] transition-all duration-300 relative overflow-hidden gap-4">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#e8f0fe] to-transparent dark:from-[#8ab4f8]/10 dark:to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
            <div className="w-12 h-12 shrink-0 bg-[#e8f0fe] dark:bg-[#8ab4f8]/20 rounded-xl flex items-center justify-center text-2xl shadow-inner group-hover:rotate-12 transition-transform duration-300">🚗</div>
            <div className="flex flex-col flex-1 min-w-0">
              <h2 className="text-base font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-blue)] transition-colors truncate">자동차보험 합의금</h2>
              <p className="text-[#5f6368] dark:text-[#9aa0a6] text-[12px] leading-snug mt-0.5 line-clamp-1">부상, 장해, 사망 등 약관 지급기준 적용</p>
            </div>
            <div className="text-[var(--google-blue)] shrink-0">
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
            </div>
          </Link>

          <Link href="/calculator/medical" onClick={closeModals} className="group flex items-center bg-white dark:bg-[#202124] rounded-2xl p-4 border border-gray-100 dark:border-white/5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(52,168,83,0.15)] transition-all duration-300 relative overflow-hidden gap-4">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#e6f4ea] to-transparent dark:from-[#1e8e3e]/10 dark:to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
            <div className="w-12 h-12 shrink-0 bg-[#e6f4ea] dark:bg-[#1e8e3e]/20 rounded-xl flex items-center justify-center text-2xl shadow-inner group-hover:rotate-12 transition-transform duration-300">🏥</div>
            <div className="flex flex-col flex-1 min-w-0">
              <h2 className="text-base font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-green)] transition-colors truncate">실손의료비 보상</h2>
              <p className="text-[#5f6368] dark:text-[#9aa0a6] text-[12px] leading-snug mt-0.5 line-clamp-1">가입시기별 급여/비급여 본인부담금 공제</p>
            </div>
            <div className="text-[var(--google-green)] shrink-0">
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
            </div>
          </Link>

          <Link href="/calculator/liability" onClick={closeModals} className="group flex items-center bg-white dark:bg-[#202124] rounded-2xl p-4 border border-gray-100 dark:border-white/5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(234,67,53,0.15)] transition-all duration-300 relative overflow-hidden gap-4">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#fce8e6] to-transparent dark:from-[#d93025]/10 dark:to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
            <div className="w-12 h-12 shrink-0 bg-[#fce8e6] dark:bg-[#d93025]/20 rounded-xl flex items-center justify-center text-2xl shadow-inner group-hover:rotate-12 transition-transform duration-300">⚖️</div>
            <div className="flex flex-col flex-1 min-w-0">
              <h2 className="text-base font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-red)] transition-colors truncate">배상책임 소송가액</h2>
              <p className="text-[#5f6368] dark:text-[#9aa0a6] text-[12px] leading-snug mt-0.5 line-clamp-1">호프만계수 적용 법원 판례 기준 손해액</p>
            </div>
            <div className="text-[var(--google-red)] shrink-0">
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
            </div>
          </Link>
        </div>
      </div>

      {/* 3. 상담신청 팝업 */}
      <div 
        className={`lg:hidden fixed bottom-[54px] left-0 w-full bg-white dark:bg-[#202124] rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-[95] transition-transform duration-300 transform ${openModal === 'consult' ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ touchAction: openModal === 'consult' ? 'auto' : 'none' }}
      >
        <div className="p-5 pb-8 space-y-4 max-h-[70vh] overflow-y-auto overscroll-contain">
          <div className="w-12 h-1.5 bg-gray-200 dark:bg-white/20 rounded-full mx-auto mb-6"></div>
          <h3 className="font-bold text-lg text-[#202124] dark:text-white mb-4">상담 신청하기</h3>
          
          <Link href="/consult/auto" onClick={closeModals} className="group flex items-center bg-white dark:bg-[#202124] rounded-2xl p-4 border border-gray-100 dark:border-white/5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(26,115,232,0.15)] transition-all duration-300 relative overflow-hidden gap-4">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#e8f0fe] to-transparent dark:from-[#8ab4f8]/10 dark:to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
            <div className="w-12 h-12 shrink-0 bg-[#e8f0fe] dark:bg-[#8ab4f8]/20 rounded-xl flex items-center justify-center text-2xl shadow-inner group-hover:rotate-12 transition-transform duration-300">📞</div>
            <div className="flex flex-col flex-1 min-w-0">
              <h2 className="text-base font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-blue)] transition-colors truncate">교통사고/배상책임 무료상담</h2>
              <p className="text-[#5f6368] dark:text-[#9aa0a6] text-[12px] leading-snug mt-0.5 line-clamp-1">전문 손해사정사가 직접 상담해 드립니다.</p>
            </div>
            <div className="text-[var(--google-blue)] shrink-0">
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
            </div>
          </Link>

          <a href="https://open.kakao.com/o/sWeszp7" target="_blank" rel="noopener noreferrer" onClick={closeModals} className="group flex items-center bg-white dark:bg-[#202124] rounded-2xl p-4 border border-gray-100 dark:border-white/5 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(254,229,0,0.2)] transition-all duration-300 relative overflow-hidden gap-4">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#FEE500]/20 to-transparent dark:from-[#FEE500]/10 dark:to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
            <div className="w-12 h-12 shrink-0 bg-[#FEE500] dark:bg-[#FEE500]/20 rounded-xl flex items-center justify-center text-2xl shadow-inner group-hover:rotate-12 transition-transform duration-300">💬</div>
            <div className="flex flex-col flex-1 min-w-0">
              <h2 className="text-base font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-yellow-600 dark:group-hover:text-[#FEE500] transition-colors truncate">카카오톡 실시간 상담</h2>
              <p className="text-[#5f6368] dark:text-[#9aa0a6] text-[12px] leading-snug mt-0.5 line-clamp-1">빠르고 간편하게 카카오톡으로 물어보세요.</p>
            </div>
            <div className="text-[#FEE500] dark:text-[#FEE500] shrink-0">
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
            </div>
          </a>
        </div>
      </div>

      {/* 하단 탭바 (높이 54px로 축소) */}
      <div className="lg:hidden fixed bottom-0 left-0 z-[100] w-full h-[54px] bg-white/80 dark:bg-[#1a1b1e]/80 backdrop-blur-md border-t border-gray-200/50 dark:border-white/10 pb-[env(safe-area-inset-bottom,0px)]">
        <div className="grid h-full w-full grid-cols-4 px-2">
          {navItems.map((item) => (
            <button 
              key={item.id} 
              onClick={item.onClick}
              className="group flex flex-col items-center justify-center h-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors active:scale-95 duration-150 rounded-xl m-0.5"
            >
              <div className={`transition-colors duration-200 ${item.isActive ? 'text-[var(--google-blue)] dark:text-[#8ab4f8] -translate-y-0.5' : 'text-gray-500 dark:text-gray-400'}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] font-bold transition-all duration-200 ${item.isActive ? 'text-[var(--google-blue)] dark:text-[#8ab4f8] opacity-100' : 'text-gray-500 dark:text-gray-400 opacity-80'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
