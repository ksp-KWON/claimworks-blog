'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { KAKAO_OPEN_CHAT_URL, GOOGLE_FORM_URL } from '@/lib/constants';
import BottomSheet from '@/components/ui/BottomSheet';
import MenuCard from '@/components/ui/MenuCard';
import type { MenuCardProps } from '@/components/ui/MenuCard';

type ModalType = 'none' | 'home' | 'partner' | 'calculator' | 'hospital' | 'consult';

// Menu data definition
const PARTNER_ITEMS: MenuCardProps[] = [
  {
    href: '/precedent-search',
    icon: '⚖️',
    title: '판례검색',
    themeColor: 'blue',
    description: '과거 보상 판례 검색 서비스'
  },
  {
    href: '/fss-news',
    icon: '🏛️',
    title: '금감원센터',
    themeColor: 'blue',
    description: '금융감독원 분쟁 조정 사례'
  },
  {
    href: '/traffic-care',
    icon: '🚗',
    title: '교통사고 처리 지원 센터',
    themeColor: 'blue',
    description: '사고 접수 및 합의 지원'
  }
];

const CALCULATOR_ITEMS: MenuCardProps[] = [
  {
    href: '/calculator/auto',
    icon: '🚗',
    title: '자동차보험 합의금',
    themeColor: 'blue',
    description: '부상, 장해, 사망 약관 적용'
  },
  {
    href: '/calculator/medical',
    icon: '🏥',
    title: '실손의료비 보상',
    themeColor: 'green',
    description: '본인부담금 공제 산출'
  },
  {
    href: '/calculator/liability',
    icon: '🧑‍⚖️',
    title: '배상책임 소송가액',
    themeColor: 'red',
    description: '법원 판례 기준 손해액'
  }
];

const HOSPITAL_ITEMS: MenuCardProps[] = [
  {
    href: '/regions',
    icon: '🗺️',
    title: '지역별 정리',
    themeColor: 'blue',
    description: '전국 주요 의료기관 안내'
  }
];

const CONSULT_ITEMS: MenuCardProps[] = [
  {
    onClick: () => { window.open(KAKAO_OPEN_CHAT_URL, '_blank', 'noopener,noreferrer'); },
    icon: '💬',
    title: '카카오톡 채팅 상담',
    themeColor: 'blue',
    description: '보상스쿨 1:1 실시간 상담'
  },
  {
    href: '/consultation',
    icon: '📞',
    title: '예약 상담',
    themeColor: 'green',
    description: '원하는 시간에 맞춰 전화 상담'
  }
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [openModal, setOpenModal] = useState<ModalType>('none');
  const [hasScrolled, setHasScrolled] = useState(false);

  const closeModals = () => setOpenModal('none');

  const handleMenuClick = (onClick?: () => void) => {
    closeModals();
    if (onClick) onClick();
  };

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
      label: '병원',
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
      label: '상담',
      onClick: () => setOpenModal(openModal === 'consult' ? 'none' : 'consult'),
      icon: (
        <svg className="w-7 h-7 sm:w-8 sm:h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={openModal === 'consult' ? "2" : "1.5"} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
      ),
      isActive: openModal === 'consult'
    }
  ];

  useEffect(() => {
    closeModals();
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <BottomSheet isOpen={openModal === 'home'} onClose={closeModals}>
        <h3 className="font-bold text-lg text-[#202124] dark:text-white mb-4">보상스쿨 채널</h3>
        <div className="space-y-4">
          <MenuCard 
            href="/blog" 
            onClick={closeModals}
            icon="📝" 
            title="블로그" 
            themeColor="blue" 
            description="보상 전문가의 지식과 사례" 
          />
          <MenuCard 
            href="https://www.youtube.com/@bosangschool" 
            onClick={closeModals}
            icon="▶️" 
            title="유튜브" 
            themeColor="red" 
            description="생생한 보상스쿨 영상 채널" 
          />
        </div>
      </BottomSheet>

      <BottomSheet isOpen={openModal === 'partner'} onClose={closeModals}>
        <h3 className="font-bold text-lg text-[#202124] dark:text-white mb-4">제휴센터</h3>
        <div className="space-y-4">
          {PARTNER_ITEMS.map((item, idx) => (
            <MenuCard key={idx} {...item} onClick={() => handleMenuClick(item.onClick)} />
          ))}
        </div>
      </BottomSheet>

      <BottomSheet isOpen={openModal === 'calculator'} onClose={closeModals}>
        <h3 className="font-bold text-lg text-[#202124] dark:text-white mb-4">보상 계산기 모음</h3>
        <div className="space-y-4">
          {CALCULATOR_ITEMS.map((item, idx) => (
            <MenuCard key={idx} {...item} onClick={() => handleMenuClick(item.onClick)} />
          ))}
        </div>
      </BottomSheet>

      <BottomSheet isOpen={openModal === 'hospital'} onClose={closeModals}>
        <h3 className="font-bold text-lg text-[#202124] dark:text-white mb-4">의료기관 찾기</h3>
        <div className="space-y-4">
          {HOSPITAL_ITEMS.map((item, idx) => (
            <MenuCard key={idx} {...item} onClick={() => handleMenuClick(item.onClick)} />
          ))}
        </div>
      </BottomSheet>

      <BottomSheet isOpen={openModal === 'consult'} onClose={closeModals}>
        <h3 className="font-bold text-lg text-[#202124] dark:text-white mb-4">상담 센터</h3>
        <div className="space-y-4">
          {CONSULT_ITEMS.map((item, idx) => (
            <MenuCard key={idx} {...item} onClick={() => handleMenuClick(item.onClick)} />
          ))}
        </div>
      </BottomSheet>
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
