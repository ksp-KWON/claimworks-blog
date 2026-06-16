'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type ModalType = 'none' | 'calculator' | 'category' | 'consult';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [openModal, setOpenModal] = useState<ModalType>('none');

  const closeModals = () => setOpenModal('none');

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
      id: 'category',
      label: '카테고리',
      onClick: () => setOpenModal(openModal === 'category' ? 'none' : 'category'),
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={openModal === 'category' ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"></path>
          <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
          <path d="M3 15h6"></path>
          <path d="M3 19h6"></path>
          <path d="M10 15h8"></path>
          <path d="M10 19h8"></path>
        </svg>
      ),
      isActive: openModal === 'category'
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
        ></div>
      )}

      {/* 1. 계산기 팝업 */}
      <div className={`lg:hidden fixed bottom-[54px] left-0 w-full bg-white dark:bg-[#202124] rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-[95] transition-transform duration-300 transform ${openModal === 'calculator' ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="p-5 pb-8 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="w-12 h-1.5 bg-gray-200 dark:bg-white/20 rounded-full mx-auto mb-6"></div>
          <h3 className="font-bold text-lg text-[#202124] dark:text-white mb-4">보상 계산기 모음</h3>
          
          <Link href="/calculator/auto" onClick={closeModals} className="flex flex-col p-4 rounded-2xl bg-[#f8f9fa] dark:bg-[#303134] hover:bg-[#e8f0fe] transition-colors border border-gray-100 dark:border-white/5 group">
            <span className="text-[var(--google-blue)] text-2xl mb-2">🚗</span>
            <span className="font-bold text-[#202124] dark:text-[#e8eaed] text-base group-hover:text-[var(--google-blue)]">자동차보험 합의금 계산기</span>
            <span className="text-xs text-[#5f6368] mt-1">부상, 장해, 사망 등 예상 합의금 산출</span>
          </Link>

          <Link href="/calculator/medical" onClick={closeModals} className="flex flex-col p-4 rounded-2xl bg-[#f8f9fa] dark:bg-[#303134] hover:bg-[#e6f4ea] transition-colors border border-gray-100 dark:border-white/5 group">
            <span className="text-[var(--google-green)] text-2xl mb-2">🏥</span>
            <span className="font-bold text-[#202124] dark:text-[#e8eaed] text-base group-hover:text-[var(--google-green)]">실손의료비 계산기</span>
            <span className="text-xs text-[#5f6368] mt-1">급여/비급여 본인부담금 공제 예상 산출</span>
          </Link>

          <Link href="/calculator/liability" onClick={closeModals} className="flex flex-col p-4 rounded-2xl bg-[#f8f9fa] dark:bg-[#303134] hover:bg-[#fce8e6] transition-colors border border-gray-100 dark:border-white/5 group">
            <span className="text-[var(--google-red)] text-2xl mb-2">⚖️</span>
            <span className="font-bold text-[#202124] dark:text-[#e8eaed] text-base group-hover:text-[var(--google-red)]">배상책임 소송가액 계산기</span>
            <span className="text-xs text-[#5f6368] mt-1">호프만계수 적용 법원 판례 기준 예상 손해액</span>
          </Link>
        </div>
      </div>

      {/* 2. 카테고리 팝업 */}
      <div className={`lg:hidden fixed bottom-[54px] left-0 w-full bg-white dark:bg-[#202124] rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-[95] transition-transform duration-300 transform ${openModal === 'category' ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="p-5 pb-8 max-h-[70vh] overflow-y-auto">
          <div className="w-12 h-1.5 bg-gray-200 dark:bg-white/20 rounded-full mx-auto mb-6"></div>
          <h3 className="font-bold text-lg text-[#202124] dark:text-white mb-4">주요 보상 카테고리</h3>
          <ul className="space-y-2">
            {[
              { name: '교통사고', emoji: '🚗', color: 'text-red-500' },
              { name: '배상책임', emoji: '⚖️', color: 'text-green-500' },
              { name: '보상가이드', emoji: '📚', color: 'text-yellow-600' },
              { name: '실손의료비', emoji: '🏥', color: 'text-blue-500' },
              { name: '보험상식', emoji: '💡', color: 'text-orange-500' },
              { name: '후유장해 보상', emoji: '🩼', color: 'text-purple-500' },
              { name: '보상정보', emoji: '📰', color: 'text-teal-500' }
            ].map(cat => (
              <li key={cat.name}>
                <Link
                  href={`/blog?category=${encodeURIComponent(cat.name)}`}
                  onClick={closeModals}
                  className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-[#f8f9fa] dark:bg-[#303134] hover:bg-gray-100 dark:hover:bg-[#3c4043] transition-colors border border-gray-100 dark:border-white/5"
                >
                  <span className="flex items-center gap-3 font-bold text-[#202124] dark:text-[#e8eaed]">
                    <span className="text-xl">{cat.emoji}</span>
                    {cat.name}
                  </span>
                  <svg className="w-5 h-5 text-[#5f6368]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 3. 상담신청 팝업 */}
      <div className={`lg:hidden fixed bottom-[54px] left-0 w-full bg-white dark:bg-[#202124] rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-[95] transition-transform duration-300 transform ${openModal === 'consult' ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="p-5 pb-8 space-y-4">
          <div className="w-12 h-1.5 bg-gray-200 dark:bg-white/20 rounded-full mx-auto mb-6"></div>
          <h3 className="font-bold text-lg text-[#202124] dark:text-white mb-4">상담 신청하기</h3>
          
          <a href="https://open.kakao.com/o/sWeszp7" target="_blank" rel="noopener noreferrer" onClick={closeModals} className="flex items-center gap-4 p-4 rounded-2xl bg-[#FEE500] hover:bg-[#F4DC00] transition-colors shadow-sm">
            <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-7 h-7 text-black" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3C6.477 3 2 6.541 2 10.908c0 2.502 1.432 4.745 3.659 6.13-.314 1.157-1.14 4.183-1.182 4.341-.053.197.075.18.156.126.104-.07 3.324-2.222 4.606-3.084.887.24 1.821.366 2.761.366 5.523 0 10-3.541 10-7.908C22 6.541 17.523 3 12 3z"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-black text-base">실시간 채팅상담 (카카오톡)</span>
              <span className="text-black/60 text-xs font-medium">가장 빠르고 간편하게 상담받기</span>
            </div>
          </a>

          <a href="#" onClick={(e) => { e.preventDefault(); alert('예약상담 신청 폼이 준비중입니다.'); closeModals(); }} className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--google-blue)] hover:bg-[#174ea6] transition-colors shadow-sm">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white text-base">예약상담 신청서 바로가기</span>
              <span className="text-white/70 text-xs font-medium">자세한 내용을 미리 작성하여 상담 예약</span>
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
