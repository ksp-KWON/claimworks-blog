'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

type ModalType = 'none' | 'home' | 'partner' | 'calculator' | 'hospital' | 'consult';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [openModal, setOpenModal] = useState<ModalType>('none');
  const [hasScrolled, setHasScrolled] = useState(false);

  const closeModals = () => setOpenModal('none');

  // 모달 활성화 시 배경 스크롤 방지
  useEffect(() => {
    if (openModal !== 'none') {
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
  }, [openModal]);

  const navItems = [
    {
      id: 'home',
      label: '홈',
      onClick: () => setOpenModal(openModal === 'home' ? 'none' : 'home'),
      icon: (
        <svg className="w-7 h-7 sm:w-8 sm:h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={openModal === 'home' ? "2" : "1.5"} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      ),
      isActive: openModal === 'home'
    },
    {
      id: 'partner',
      label: '제휴센터',
      onClick: () => setOpenModal(openModal === 'partner' ? 'none' : 'partner'),
      icon: (
        <svg className="w-7 h-7 sm:w-8 sm:h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={openModal === 'partner' ? "2" : "1.5"} strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
      ),
      isActive: openModal === 'partner'
    },
    {
      id: 'calculator',
      label: '계산기',
      onClick: () => setOpenModal(openModal === 'calculator' ? 'none' : 'calculator'),
      icon: (
        <svg className="w-7 h-7 sm:w-8 sm:h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={openModal === 'calculator' ? "2" : "1.5"} strokeLinecap="round" strokeLinejoin="round">
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
      id: 'hospital',
      label: '의료기관',
      onClick: () => setOpenModal(openModal === 'hospital' ? 'none' : 'hospital'),
      icon: (
        <svg className="w-7 h-7 sm:w-8 sm:h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={openModal === 'hospital' ? "2" : "1.5"} strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 22V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"></path>
          <line x1="12" y1="10" x2="12" y2="14"></line>
          <line x1="10" y1="12" x2="14" y2="12"></line>
          <line x1="3" y1="22" x2="21" y2="22"></line>
        </svg>
      ),
      isActive: openModal === 'hospital'
    },
    {
      id: 'consult',
      label: '상담신청',
      onClick: () => setOpenModal(openModal === 'consult' ? 'none' : 'consult'),
      icon: (
        <svg className="w-7 h-7 sm:w-8 sm:h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={openModal === 'consult' ? "2" : "1.5"} strokeLinecap="round" strokeLinejoin="round">
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

      {/* 1. 홈 팝업 */}
      <div 
        className={`lg:hidden fixed bottom-[64px] left-0 w-full bg-white dark:bg-[#202124] rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-[95] transition-transform duration-300 transform ${openModal === 'home' ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ touchAction: openModal === 'home' ? 'auto' : 'none' }}
      >
        <div className="p-5 pb-8 space-y-4 max-h-[70vh] overflow-y-auto overscroll-contain">
          <div className="w-12 h-1.5 bg-gray-200 dark:bg-white/20 rounded-full mx-auto mb-6"></div>
          <h3 className="font-bold text-lg text-[#202124] dark:text-white mb-4">전체 메뉴</h3>
          
          <Link href="/" onClick={closeModals} className="group flex items-center bg-gray-50 dark:bg-[#2d2e30] rounded-2xl p-4 border border-gray-100 dark:border-white/5 hover:border-[var(--google-blue)] hover:shadow-[0_8px_30px_rgba(26,115,232,0.15)] transition-all duration-300 gap-4">
            <div className="w-12 h-12 shrink-0 bg-gray-100 dark:bg-[#3a3b3d] rounded-xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-[var(--google-blue)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            </div>
            <div className="flex flex-col flex-1">
              <h2 className="text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-blue)] transition-colors">홈</h2>
              <p className="text-[12px] text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">보상스쿨 메인 화면으로 이동합니다</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-[var(--google-blue)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
          </Link>

          <Link href="/blog" onClick={closeModals} className="group flex items-center bg-gray-50 dark:bg-[#2d2e30] rounded-2xl p-4 border border-gray-100 dark:border-white/5 hover:border-[var(--google-blue)] hover:shadow-[0_8px_30px_rgba(26,115,232,0.15)] transition-all duration-300 gap-4">
            <div className="w-12 h-12 shrink-0 bg-gray-100 dark:bg-[#3a3b3d] rounded-xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-[var(--google-blue)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <div className="flex flex-col flex-1">
              <h2 className="text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-blue)] transition-colors">블로그</h2>
              <p className="text-[12px] text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">보상 전문가의 지식과 사례</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-[var(--google-blue)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
          </Link>

          <Link href="https://www.youtube.com/@bosangschool" target="_blank" onClick={closeModals} className="group flex items-center bg-gray-50 dark:bg-[#2d2e30] rounded-2xl p-4 border border-gray-100 dark:border-white/5 hover:border-[var(--google-red)] hover:shadow-[0_8px_30px_rgba(234,67,53,0.15)] transition-all duration-300 gap-4">
            <div className="w-12 h-12 shrink-0 bg-gray-100 dark:bg-[#3a3b3d] rounded-xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-[var(--google-red)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
            </div>
            <div className="flex flex-col flex-1">
              <h2 className="text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-red)] transition-colors">유튜브</h2>
              <p className="text-[12px] text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">생생한 보상스쿨 영상 채널</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-[var(--google-red)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
          </Link>
        </div>
      </div>

      {/* 2. 제휴센터 팝업 */}
      <div 
        className={`lg:hidden fixed bottom-[64px] left-0 w-full bg-white dark:bg-[#202124] rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-[95] transition-transform duration-300 transform ${openModal === 'partner' ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ touchAction: openModal === 'partner' ? 'auto' : 'none' }}
      >
        <div className="p-5 pb-8 space-y-4 max-h-[70vh] overflow-y-auto overscroll-contain">
          <div className="w-12 h-1.5 bg-gray-200 dark:bg-white/20 rounded-full mx-auto mb-6"></div>
          <h3 className="font-bold text-lg text-[#202124] dark:text-white mb-4">제휴센터</h3>
          
          <Link href="/precedent-search" onClick={closeModals} className="group flex items-center bg-gray-50 dark:bg-[#2d2e30] rounded-2xl p-4 border border-gray-100 dark:border-white/5 hover:border-[var(--google-blue)] hover:shadow-[0_8px_30px_rgba(26,115,232,0.15)] transition-all duration-300 gap-4">
            <div className="w-12 h-12 shrink-0 bg-gray-100 dark:bg-[#3a3b3d] rounded-xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-[var(--google-blue)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <div className="flex flex-col flex-1">
              <h2 className="text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-blue)] transition-colors">AI판례센터</h2>
              <p className="text-[12px] text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">과거 보상 판례 검색 서비스</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-[var(--google-blue)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
          </Link>

          <Link href="/fss-news" onClick={closeModals} className="group flex items-center bg-gray-50 dark:bg-[#2d2e30] rounded-2xl p-4 border border-gray-100 dark:border-white/5 hover:border-[var(--google-blue)] hover:shadow-[0_8px_30px_rgba(26,115,232,0.15)] transition-all duration-300 gap-4">
            <div className="w-12 h-12 shrink-0 bg-gray-100 dark:bg-[#3a3b3d] rounded-xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-[var(--google-blue)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            <div className="flex flex-col flex-1">
              <h2 className="text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-blue)] transition-colors">금감원센터</h2>
              <p className="text-[12px] text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">금융감독원 분쟁 조정 사례</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-[var(--google-blue)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
          </Link>

          <Link href="/traffic-care" onClick={closeModals} className="group flex items-center bg-gray-50 dark:bg-[#2d2e30] rounded-2xl p-4 border border-gray-100 dark:border-white/5 hover:border-[var(--google-blue)] hover:shadow-[0_8px_30px_rgba(26,115,232,0.15)] transition-all duration-300 gap-4">
            <div className="w-12 h-12 shrink-0 bg-gray-100 dark:bg-[#3a3b3d] rounded-xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-[var(--google-blue)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            </div>
            <div className="flex flex-col flex-1">
              <h2 className="text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-blue)] transition-colors">로컬안심케어</h2>
              <p className="text-[12px] text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">지역별 안심 보상 케어 서비스</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-[var(--google-blue)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
          </Link>
        </div>
      </div>

      {/* 3. 계산기 팝업 */}
      <div 
        className={`lg:hidden fixed bottom-[64px] left-0 w-full bg-white dark:bg-[#202124] rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-[95] transition-transform duration-300 transform ${openModal === 'calculator' ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ touchAction: openModal === 'calculator' ? 'auto' : 'none' }}
      >
        <div className="p-5 pb-8 space-y-4 max-h-[70vh] overflow-y-auto overscroll-contain">
          <div className="w-12 h-1.5 bg-gray-200 dark:bg-white/20 rounded-full mx-auto mb-6"></div>
          <h3 className="font-bold text-lg text-[#202124] dark:text-white mb-4">보상 계산기 모음</h3>
          
          <Link href="/calculator/auto" onClick={closeModals} className="group flex items-center bg-gray-50 dark:bg-[#2d2e30] rounded-2xl p-4 border border-gray-100 dark:border-white/5 hover:border-[var(--google-blue)] hover:shadow-[0_8px_30px_rgba(26,115,232,0.15)] transition-all duration-300 gap-4">
            <div className="w-12 h-12 shrink-0 bg-gray-100 dark:bg-[#3a3b3d] rounded-xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-[var(--google-blue)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16.01" y2="14"></line><line x1="12" y1="14" x2="12.01" y2="14"></line><line x1="8" y1="14" x2="8.01" y2="14"></line></svg>
            </div>
            <div className="flex flex-col flex-1">
              <h2 className="text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-blue)] transition-colors">자동차보험 합의금</h2>
              <p className="text-[#5f6368] dark:text-[#9aa0a6] text-[12px] mt-0.5">부상, 장해, 사망 약관 적용</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-[var(--google-blue)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
          </Link>

          <Link href="/calculator/medical" onClick={closeModals} className="group flex items-center bg-gray-50 dark:bg-[#2d2e30] rounded-2xl p-4 border border-gray-100 dark:border-white/5 hover:border-[var(--google-green)] hover:shadow-[0_8px_30px_rgba(52,168,83,0.15)] transition-all duration-300 gap-4">
            <div className="w-12 h-12 shrink-0 bg-gray-100 dark:bg-[#3a3b3d] rounded-xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-[var(--google-green)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
            </div>
            <div className="flex flex-col flex-1">
              <h2 className="text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-green)] transition-colors">실손의료비 보상</h2>
              <p className="text-[#5f6368] dark:text-[#9aa0a6] text-[12px] mt-0.5">본인부담금 공제 산출</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-[var(--google-green)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
          </Link>

          <Link href="/calculator/liability" onClick={closeModals} className="group flex items-center bg-gray-50 dark:bg-[#2d2e30] rounded-2xl p-4 border border-gray-100 dark:border-white/5 hover:border-[var(--google-red)] hover:shadow-[0_8px_30px_rgba(234,67,53,0.15)] transition-all duration-300 gap-4">
            <div className="w-12 h-12 shrink-0 bg-gray-100 dark:bg-[#3a3b3d] rounded-xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-[var(--google-red)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
            </div>
            <div className="flex flex-col flex-1">
              <h2 className="text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-red)] transition-colors">배상책임 소송가액</h2>
              <p className="text-[#5f6368] dark:text-[#9aa0a6] text-[12px] mt-0.5">법원 판례 기준 손해액</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-[var(--google-red)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
          </Link>
        </div>
      </div>

      {/* 4. 의료기관 팝업 */}
      <div 
        className={`lg:hidden fixed bottom-[64px] left-0 w-full bg-white dark:bg-[#202124] rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-[95] transition-transform duration-300 transform ${openModal === 'hospital' ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ touchAction: openModal === 'hospital' ? 'auto' : 'none' }}
      >
        <div className="p-5 pb-8 space-y-4 max-h-[70vh] overflow-y-auto overscroll-contain">
          <div className="w-12 h-1.5 bg-gray-200 dark:bg-white/20 rounded-full mx-auto mb-6"></div>
          <h3 className="font-bold text-lg text-[#202124] dark:text-white mb-4">의료기관 찾기</h3>
          
          <Link href="/regions" onClick={closeModals} className="group flex items-center bg-gray-50 dark:bg-[#2d2e30] rounded-2xl p-4 border border-gray-100 dark:border-white/5 hover:border-[var(--google-blue)] hover:shadow-[0_8px_30px_rgba(26,115,232,0.15)] transition-all duration-300 gap-4">
            <div className="w-12 h-12 shrink-0 bg-gray-100 dark:bg-[#3a3b3d] rounded-xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-[var(--google-blue)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 22V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"></path><line x1="12" y1="10" x2="12" y2="14"></line><line x1="10" y1="12" x2="14" y2="12"></line><line x1="3" y1="22" x2="21" y2="22"></line></svg>
            </div>
            <div className="flex flex-col flex-1">
              <h2 className="text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-blue)] transition-colors">지역별 정리</h2>
              <p className="text-[#5f6368] dark:text-[#9aa0a6] text-[12px] mt-0.5">전국 주요 의료기관 안내</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-[var(--google-blue)] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
          </Link>
        </div>
      </div>

      {/* 5. 상담신청 팝업 */}
      <div 
        className={`lg:hidden fixed bottom-[64px] left-0 w-full bg-white dark:bg-[#202124] rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-[95] transition-transform duration-300 transform ${openModal === 'consult' ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ touchAction: openModal === 'consult' ? 'auto' : 'none' }}
      >
        <div className="p-5 pb-8 space-y-4 max-h-[70vh] overflow-y-auto overscroll-contain">
          <div className="w-12 h-1.5 bg-gray-200 dark:bg-white/20 rounded-full mx-auto mb-6"></div>
          <h3 className="font-bold text-lg text-[#202124] dark:text-white mb-4">상담 센터</h3>
          
          <button onClick={() => { closeModals(); (window as any).__openClaimworksChat?.(); }} className="group flex items-center bg-gray-50 dark:bg-[#2d2e30] rounded-2xl p-4 border border-gray-100 dark:border-white/5 hover:border-[#1a73e8] hover:shadow-[0_8px_30px_rgba(26,115,232,0.15)] transition-all duration-300 gap-4 w-full text-left" id="mobile-nav-chat-btn">
            <div className="w-12 h-12 shrink-0 bg-gray-100 dark:bg-[#3a3b3d] rounded-xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-[#1a73e8] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            </div>
            <div className="flex flex-col flex-1">
              <h2 className="text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[#1a73e8] transition-colors">채팅 상담</h2>
              <p className="text-[12px] text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">보상스쿨 1:1 실시간 상담</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-[#1a73e8] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
          </button>

          <Link href="/consultation" onClick={closeModals} className="group flex items-center bg-gray-50 dark:bg-[#2d2e30] rounded-2xl p-4 border border-gray-100 dark:border-white/5 hover:border-[#34A853] hover:shadow-[0_8px_30px_rgba(52,168,83,0.15)] transition-all duration-300 gap-4">
            <div className="w-12 h-12 shrink-0 bg-gray-100 dark:bg-[#3a3b3d] rounded-xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-300 group-hover:text-[#34A853] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
            <div className="flex flex-col flex-1">
              <h2 className="text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[#34A853] transition-colors">예약 상담</h2>
              <p className="text-[12px] text-[#5f6368] dark:text-[#9aa0a6] mt-0.5">원하는 시간에 맞춰 전화 상담</p>
            </div>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-[#34A853] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
          </Link>
        </div>
      </div>

      {/* 5개의 탭 버튼 바 */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full h-[64px] bg-white/90 dark:bg-[#121212]/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-white/10 flex items-center justify-around px-1 z-[100] pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={item.onClick}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
              item.isActive
                ? 'text-[var(--google-blue)] dark:text-[#8ab4f8]'
                : 'text-gray-900 dark:text-gray-200 hover:text-[var(--google-blue)] dark:hover:text-[#8ab4f8]'
            }`}
          >
            {item.icon}
            <span className={`text-[10px] font-bold ${item.isActive ? 'opacity-100' : 'opacity-80'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </>
  );
}
