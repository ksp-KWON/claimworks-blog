'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: '홈',
      href: '/',
      icon: (
        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={pathname === '/' ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      )
    },
    {
      label: '계산기',
      href: '/calculator',
      icon: (
        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={pathname?.startsWith('/calculator') ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
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
      )
    },
    {
      label: '카테고리',
      href: '/blog',
      icon: (
        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={pathname === '/blog' ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"></path>
          <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
          <path d="M3 15h6"></path>
          <path d="M3 19h6"></path>
          <path d="M10 15h8"></path>
          <path d="M10 19h8"></path>
        </svg>
      )
    },
    {
      label: '상담신청',
      href: 'https://open.kakao.com/o/sWeszp7',
      isExternal: true,
      icon: (
        <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
      )
    }
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 z-50 w-full h-[65px] bg-white/80 dark:bg-[#1a1b1e]/80 backdrop-blur-md border-t border-gray-200/50 dark:border-white/10 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="grid h-full w-full grid-cols-4 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/calculator' && pathname?.startsWith('/calculator'));
          
          const content = (
            <div className="flex flex-col items-center justify-center w-full h-full pt-1.5 pb-1">
              <div className={`transition-colors duration-200 ${isActive ? 'text-[var(--google-blue)] dark:text-[#8ab4f8]' : 'text-gray-500 dark:text-gray-400'}`}>
                {item.icon}
              </div>
              <span className={`text-[10px] font-bold mt-0.5 transition-colors duration-200 ${isActive ? 'text-[var(--google-blue)] dark:text-[#8ab4f8]' : 'text-gray-500 dark:text-gray-400'}`}>
                {item.label}
              </span>
            </div>
          );

          if (item.isExternal) {
            return (
              <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center justify-center h-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors active:scale-95 duration-150 rounded-xl m-1">
                {content}
              </a>
            );
          }

          return (
            <Link key={item.label} href={item.href} className="group flex flex-col items-center justify-center h-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors active:scale-95 duration-150 rounded-xl m-1">
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
