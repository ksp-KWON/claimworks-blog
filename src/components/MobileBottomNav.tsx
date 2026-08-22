'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import BottomSheet from '@/components/ui/BottomSheet';
import MenuCard from '@/components/ui/MenuCard';
import AppIcon from '@/components/ui/AppIcon';
import type { MenuCardProps } from '@/components/ui/MenuCard';

type ModalType = 'none' | 'home' | 'partner' | 'calculator' | 'hospital' | 'consult';

// Menu data definition — W3C 표준 AppIcon 연동
const PARTNER_ITEMS: MenuCardProps[] = [
  { href: '/precedent-search', icon: <AppIcon name="search" size={20} />, title: '빅데이터 판례검색', themeColor: 'blue', description: '과거 보상 판례 검색 서비스' },
  { href: '/fss-news', icon: <AppIcon name="shield-check" size={20} />, title: '금감원 소비자보호', themeColor: 'red', description: '금융감독원 분쟁 조정 사례' },
  { href: '/traffic-care', icon: <AppIcon name="car" size={20} />, title: '교통사고 로컬 케어', themeColor: 'green', description: '사고 접수 및 합의 지원' }
];

const CALCULATOR_ITEMS: MenuCardProps[] = [
  { href: '/calculator/auto', icon: <AppIcon name="car" size={20} />, title: '자동차보험 합의금', themeColor: 'blue', description: '부상, 장해, 사망 약관 적용' },
  { href: '/calculator/medical', icon: <AppIcon name="hospital" size={20} />, title: '실손의료비 보상', themeColor: 'green', description: '본인부담금 공제 산출' },
  { href: '/calculator/liability', icon: <AppIcon name="scale" size={20} />, title: '배상책임 소송가액', themeColor: 'red', description: '법원 판례 기준 손해액' }
];

const HOSPITAL_ITEMS: MenuCardProps[] = [
  { href: '/regions', icon: <AppIcon name="compass" size={20} />, title: '지역별 의료기관', themeColor: 'green', description: '전국 주요 의료기관 안내' }
];

const CONSULT_ITEMS: MenuCardProps[] = [
  { onClick: () => { document.getElementById('chat-floating-btn')?.click(); }, icon: <AppIcon name="chat" size={20} />, title: '실시간 채팅 상담', themeColor: 'blue', description: '보상스쿨 1:1 실시간 상담' },
  { href: '/consultation', icon: <AppIcon name="phone" size={20} />, title: '전화 상담 예약', themeColor: 'green', description: '원하는 시간에 맞춰 전화 상담' }
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [openModal, setOpenModal] = useState<ModalType>('none');

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
      icon: <AppIcon name="home" size={24} className="mb-0.5" strokeWidth={openModal === 'home' ? 2.5 : 1.8} />,
      isActive: openModal === 'home'
    },
    {
      id: 'partner',
      label: '제휴센터',
      onClick: () => setOpenModal(openModal === 'partner' ? 'none' : 'partner'),
      icon: <AppIcon name="shield-check" size={24} className="mb-0.5" strokeWidth={openModal === 'partner' ? 2.5 : 1.8} />,
      isActive: openModal === 'partner'
    },
    {
      id: 'calculator',
      label: '계산기',
      onClick: () => setOpenModal(openModal === 'calculator' ? 'none' : 'calculator'),
      icon: <AppIcon name="calculator" size={24} className="mb-0.5" strokeWidth={openModal === 'calculator' ? 2.5 : 1.8} />,
      isActive: openModal === 'calculator'
    },
    {
      id: 'hospital',
      label: '병원',
      onClick: () => setOpenModal(openModal === 'hospital' ? 'none' : 'hospital'),
      icon: <AppIcon name="hospital" size={24} className="mb-0.5" strokeWidth={openModal === 'hospital' ? 2.5 : 1.8} />,
      isActive: openModal === 'hospital'
    },
    {
      id: 'consult',
      label: '상담',
      onClick: () => setOpenModal(openModal === 'consult' ? 'none' : 'consult'),
      icon: <AppIcon name="chat" size={24} className="mb-0.5" strokeWidth={openModal === 'consult' ? 2.5 : 1.8} />,
      isActive: openModal === 'consult'
    }
  ];

  useEffect(() => {
    closeModals();
  }, [pathname]);

  return (
    <>
      <BottomSheet isOpen={openModal === 'home'} onClose={closeModals}>
        <h3 className="font-bold text-lg text-[#202124] dark:text-white mb-4">보상스쿨 채널</h3>
        <div className="space-y-4">
          <MenuCard href="/blog" onClick={closeModals} icon={<AppIcon name="book" size={20} />} title="블로그" themeColor="blue" description="보상 전문가의 지식과 사례" />
          <MenuCard href="https://www.youtube.com/@bosangschool" onClick={closeModals} icon={<AppIcon name="youtube" size={20} />} title="유튜브" themeColor="red" description="생생한 보상스쿨 영상 채널" />
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
