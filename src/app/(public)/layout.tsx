import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ThemeToggle from '@/components/ThemeToggle';
import SearchBar from '@/components/SearchBar';
import MobileBottomNav from '@/components/MobileBottomNav';
import ChatWidget from '@/components/ChatWidget';
import ScrollProgressBar from '@/components/ScrollProgressBar';
import SmartStickyLayout from '@/components/SmartStickyLayout';
import SidebarContent from '@/components/SidebarContent';
import { getSortedPostsData } from '@/lib/posts';

/**
 * 방문자용 공개 레이아웃. (서버 컴포넌트)
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  // 서버에서 태그 목록 계산 → SidebarContent에 정적 주입 (클라이언트 API 호출 불필요)
  const posts = getSortedPostsData(false);
  const tagCounts: Record<string, number> = {};
  for (const post of posts) {
    for (const tag of post.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": "보상스쿨",
    "description": "건강보험심사평가원 공개 정보를 기반으로 보상스쿨 손해사정사가 분석한 보상 노하우를 제공합니다.",
    "url": "https://claim-works.com",
    "logo": "https://claim-works.com/logo.png",
    "image": "https://claim-works.com/logo.png",
    "areaServed": "KR",
    "availableLanguage": "Korean",
    "founder": "보상스쿨 손해사정사"
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ScrollProgressBar />

      {/* 헤더 */}
      <header className="sticky top-0 z-50 w-full h-[64px] border-b border-gray-200/70 dark:border-white/10 bg-white/85 dark:bg-[#121212]/85 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] transition-colors">
        <div className="mx-auto flex h-full w-[92vw] xl:w-[85vw] max-w-7xl items-center justify-between px-2 sm:px-5">

          {/* 로고/제목 영역 */}
          <div className="flex items-center min-w-0 flex-1 mr-1 sm:mr-2">
            <div className="font-sans font-extrabold text-lg sm:text-xl min-w-0 tracking-tight">
              <Link href="/" className="group flex items-center gap-2 sm:gap-2.5 whitespace-nowrap overflow-hidden">
                <div className="relative flex items-center justify-center h-10 sm:h-11 shrink-0 bg-white dark:bg-[#202124] rounded-none border border-gray-200 dark:border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_15px_rgba(0,0,0,0.7)] group-hover:shadow-[0_8px_25px_rgba(0,0,0,0.2)] dark:group-hover:shadow-[0_8px_25px_rgba(0,0,0,0.9)] group-hover:border-gray-400 dark:group-hover:border-gray-500 group-hover:scale-105 transition-all duration-300 p-2 sm:p-2.5 z-10">
                  <Image src="/logo.png" alt="보상스쿨 TV" width={100} height={100} className="h-full w-auto object-contain drop-shadow-sm transition-all duration-300" priority />
                </div>
                <span className="hidden sm:inline font-extrabold text-[#3c4043] dark:text-[#e8eaed] group-hover:opacity-80 transition-opacity truncate tracking-tight">
                  보상스쿨 헬스케어 &amp; 손해사정 보상가이드
                </span>
                <span className="sm:hidden font-extrabold text-[15px] text-[#3c4043] dark:text-[#e8eaed] truncate tracking-tight">
                  보상스쿨&apos;s 보상가이드
                </span>
                <span className="hidden lg:inline-flex items-center px-1.5 py-0.5 ml-1 rounded-sm bg-gray-100 dark:bg-gray-800 text-[9px] font-black text-gray-500 dark:text-gray-400 tracking-widest uppercase border border-gray-200 dark:border-gray-700">
                  Integrated Hub
                </span>
              </Link>
            </div>
          </div>

          {/* 우측 메뉴 */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <SearchBar />
            <nav className="hidden md:flex items-center space-x-1 sm:space-x-1.5">
              <Link href="/" className="p-2 sm:p-2.5 rounded-none border border-transparent hover:border-[#1a73e8]/30 dark:hover:border-[#8ab4f8]/30 text-[#3c4043] dark:text-[#e8eaed] hover:bg-gradient-to-br hover:from-red-50/50 hover:to-blue-50/50 dark:hover:from-red-900/20 dark:hover:to-blue-900/20 hover:text-[#1a73e8] dark:hover:text-[#8ab4f8] hover:shadow-sm transition-all duration-200 flex items-center justify-center group" aria-label="홈" title="홈">
                <svg className="w-5 h-5 sm:w-[22px] sm:h-[22px] group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </Link>
              <Link href="/blog" className="p-2 sm:p-2.5 rounded-none border border-transparent hover:border-[#1a73e8]/30 dark:hover:border-[#8ab4f8]/30 text-[#3c4043] dark:text-[#e8eaed] hover:bg-gradient-to-br hover:from-red-50/50 hover:to-blue-50/50 dark:hover:from-red-900/20 dark:hover:to-blue-900/20 hover:text-[#1a73e8] dark:hover:text-[#8ab4f8] hover:shadow-sm transition-all duration-200 flex items-center justify-center group" aria-label="블로그" title="블로그">
                <svg className="w-5 h-5 sm:w-[22px] sm:h-[22px] group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
                  <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"></path>
                  <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                  <path d="M3 15h6"></path>
                  <path d="M3 19h6"></path>
                  <path d="M10 15h8"></path>
                  <path d="M10 19h8"></path>
                </svg>
              </Link>
            </nav>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* 본문 + 사이드바 */}
      <SmartStickyLayout
        mainContent={children}
        sidebarContent={<SidebarContent tags={sortedTags} />}
      />

      {/* 푸터 */}
      <footer className="mt-auto w-full bg-[var(--google-surface-variant)] dark:bg-[#303134] text-[#5f6368] dark:text-[#9aa0a6] border-t border-[var(--google-border)] pb-[calc(64px+env(safe-area-inset-bottom))] lg:pb-0">
        <div className="mx-auto flex flex-col md:flex-row h-auto md:h-[70px] w-[92vw] xl:w-[85vw] max-w-7xl items-center justify-between px-2 sm:px-5 py-5 md:py-0 text-[11px] font-bold gap-3">
          <p className="copyright text-center md:text-left flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            © {new Date().getFullYear()} 보상스쿨 헬스케어 &amp; 손해사정 보상가이드. All rights reserved.
          </p>
          <p className="iagree text-center md:text-right flex items-center gap-2">
            <Link href="/about" className="hover:text-[var(--google-blue)] cursor-pointer transition-colors">플랫폼 소개</Link>
            <span className="w-1 h-1 rounded-full bg-[#dadce0] dark:bg-[#5f6368]"></span>
            <Link href="/terms" className="hover:text-[var(--google-blue)] cursor-pointer transition-colors">이용약관</Link>
            <span className="w-1 h-1 rounded-full bg-[#dadce0] dark:bg-[#5f6368]"></span>
            <Link href="/privacy" className="hover:text-[var(--google-blue)] cursor-pointer transition-colors">개인정보처리방침</Link>
            <span className="w-1 h-1 rounded-full bg-[#dadce0] dark:bg-[#5f6368]"></span>
            <a href="/admin" className="hover:text-[var(--google-blue)] cursor-pointer transition-colors text-gray-300 dark:text-zinc-700" title="Admin">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            </a>
          </p>
        </div>
      </footer>

      {/* 모바일 방문자 하단 탭바 */}
      <MobileBottomNav />

      {/* 채팅 위젯 */}
      <ChatWidget />
    </>
  );
}
