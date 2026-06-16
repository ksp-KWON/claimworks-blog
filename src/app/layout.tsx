import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import SidebarContent from "@/components/SidebarContent";
import ScrollProgressBar from "@/components/ScrollProgressBar";
import FloatingKakaoButton from "@/components/FloatingKakaoButton";
import SearchBar from "@/components/SearchBar";
import SmartStickyLayout from "@/components/SmartStickyLayout";
import MobileBottomNav from "@/components/MobileBottomNav";
import LogoDropdown from "@/components/LogoDropdown";
import MobileSidebarDrawer from "@/components/MobileSidebarDrawer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://claim-works.com"),
  title: "보상스쿨 헬스케어 & 손해사정 보상가이드",
  description: "건강보험심사평가원의 공개 정보를 기반으로 보상스쿨 손해사정사가 분석한 보상 노하우를 제공합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="naver-site-verification" content="2a1537523725cefaf7b77e00215e3ae0140f46a2" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'light';
                if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })()
            `
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "보상스쿨 헬스케어 & 손해사정 보상가이드",
              "url": "https://claim-works.com",
              "description": "건강보험심사평가원의 공개 정보를 기반으로 보상스쿨 손해사정사가 분석한 보상 노하우를 제공합니다.",
              "publisher": {
                "@type": "Organization",
                "name": "보상스쿨",
                "url": "https://claim-works.com",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://claim-works.com/favicon.ico"
                }
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://claim-works.com/search?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 transition-colors duration-300 pb-[calc(env(safe-area-inset-bottom,20px)+54px)] lg:pb-0">
        {/* 카카오 SDK */}
        <Script 
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js" 
          strategy="afterInteractive"
        />
        <Script id="kakao-init" strategy="afterInteractive">
          {`
            window.onload = function() {
              if (window.Kakao && !window.Kakao.isInitialized()) {
                window.Kakao.init('c60e479ca3c78009474b748414de3a1b');
              }
            };
          `}
        </Script>
        <ScrollProgressBar />
        <FloatingKakaoButton />
        
        {/* 1. 애플 iOS Glassmorphism 스타일 App Bar (쿨그레이 반투명) */}
        <header className="sticky top-0 z-50 w-full h-[54px] border-b border-[var(--google-border)] bg-[#f8f9fa]/80 dark:bg-[#202124]/80 backdrop-blur-md text-[#202124] dark:text-[#e8eaed] shadow-sm transition-colors">
          <div className="mx-auto flex h-full w-[92vw] xl:w-[85vw] max-w-7xl items-center justify-between px-2 sm:px-5">

            {/* 로고/제목 영역 (드롭다운) */}
            <div className="flex items-center min-w-0 flex-1 mr-2">
              <LogoDropdown />
            </div>

            {/* 우측 검색 영역 및 액션 메뉴 */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <SearchBar />
              
              {/* 상담신청 아이콘 (상단바) */}
              <a 
                href="https://open.kakao.com/o/sWeszp7" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-1.5 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[#FEE500] transition-colors rounded-full hover:bg-[var(--google-surface-variant)]"
                aria-label="카카오톡 상담신청"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.477 3 2 6.541 2 10.908c0 2.502 1.432 4.745 3.659 6.13-.314 1.157-1.14 4.183-1.182 4.341-.053.197.075.18.156.126.104-.07 3.324-2.222 4.606-3.084.887.24 1.821.366 2.761.366 5.523 0 10-3.541 10-7.908C22 6.541 17.523 3 12 3z"/>
                </svg>
              </a>

              {/* 햄버거 메뉴 서랍 (카테고리) */}
              <MobileSidebarDrawer />

              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* 3. 티스토리 2단 레이아웃 본문 75% : 사이드바 25% 구조 */}
        <SmartStickyLayout
          mainContent={children}
          sidebarContent={<SidebarContent />}
        />

        {/* 4. 구글 표면 색상 푸터 */}
        <footer className="mt-auto w-full bg-[var(--google-surface-variant)] dark:bg-[#303134] text-[#5f6368] dark:text-[#9aa0a6] border-t border-[var(--google-border)]">
          <div className="mx-auto flex flex-col md:flex-row h-auto md:h-[70px] w-[92vw] xl:w-[85vw] max-w-7xl items-center justify-between px-2 sm:px-5 py-5 md:py-0 text-[11px] font-bold gap-3">
            <p className="copyright text-center md:text-left flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              © {new Date().getFullYear()} 보상스쿨 헬스케어 & 손해사정 보상가이드. All rights reserved.
            </p>
            <p className="iagree text-center md:text-right flex items-center gap-2">
              <Link href="/terms" className="hover:text-[var(--google-blue)] cursor-pointer transition-colors">이용약관</Link>
              <span className="w-1 h-1 rounded-full bg-[#dadce0] dark:bg-[#5f6368]"></span>
              <Link href="/privacy" className="hover:text-[var(--google-blue)] cursor-pointer transition-colors">개인정보처리방침</Link>
              <span className="w-1 h-1 rounded-full bg-[#dadce0] dark:bg-[#5f6368]"></span>
              <Link href="/admin" className="hover:text-[var(--google-blue)] cursor-pointer transition-colors text-gray-300 dark:text-zinc-700" title="Admin">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </Link>
            </p>
          </div>
        </footer>

        {/* 5. 모바일 전용 하단 고정 탭바 (lg 미만에서 노출) */}
        <MobileBottomNav />
      </body>
    </html>
  );
}
