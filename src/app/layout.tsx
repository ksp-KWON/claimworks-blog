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
import MobileSidebarDrawer from "@/components/MobileSidebarDrawer";
import { getSortedPostsData } from "@/lib/posts";

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

  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased overflow-x-hidden`}
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
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 transition-colors duration-300 pb-[calc(env(safe-area-inset-bottom,20px)+60px)] lg:pb-0 overflow-x-clip">
        {/* 카카오 SDK — onLoad는 static export 미지원으로 Script id 분리 방식 사용 */}
        <Script 
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js" 
          strategy="afterInteractive"
        />
        <Script id="kakao-init" strategy="afterInteractive">
          {`
            (function() {
              var K = window.Kakao;
              if (K && !K.isInitialized()) { K.init('c60e479ca3c78009474b748414de3a1b'); }
            })();
          `}
        </Script>
        <ScrollProgressBar />
        <FloatingKakaoButton />
        
        {/* 1. 애플 iOS Glassmorphism 스타일 App Bar (조금 더 진한 쿨그레이 반투명) */}
        <header className="sticky top-0 z-50 w-full h-[60px] border-b border-[var(--google-border)] bg-[#e8eaed]/90 dark:bg-[#303134]/90 backdrop-blur-md text-[#202124] dark:text-[#e8eaed] shadow-sm transition-colors">
          <div className="mx-auto flex h-full w-[92vw] xl:w-[85vw] max-w-7xl items-center justify-between px-2 sm:px-5">

            {/* 로고/제목 영역 */}
            <div className="flex items-center min-w-0 flex-1 mr-1 sm:mr-2">
              <div className="font-sans font-bold text-lg sm:text-xl text-[#202124] dark:text-white min-w-0 tracking-tight">
                <Link href="/" className="hover:text-[var(--google-blue)] transition-colors flex items-center gap-1.5 sm:gap-2 whitespace-nowrap overflow-hidden">
                  <svg className="w-5 h-5 text-[var(--google-blue)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                  <span className="hidden sm:inline truncate">보상스쿨 헬스케어 &amp; 손해사정 보상가이드</span>
                  <span className="sm:hidden text-[15px] truncate">보상스쿨&apos;s 보상가이드</span>
                </Link>
              </div>
            </div>

            {/* 우측 메뉴 영역 */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              
              {/* 검색아이콘 (홈아이콘 왼쪽으로 이동) */}
              <SearchBar />
              
              {/* 데스크탑에서만 보이는 네비게이션 (모바일에서는 하단바로 이동) */}
              <nav className="hidden md:flex items-center space-x-1 sm:space-x-2">
                <Link href="/" className="p-2 sm:p-2.5 rounded-full text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#e8eaed] dark:hover:bg-[#3c4043] hover:text-[var(--google-blue)] transition-colors flex items-center justify-center group" aria-label="홈" title="홈">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </Link>
                <Link href="/calculator" className="p-2 sm:p-2.5 rounded-full text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#e8eaed] dark:hover:bg-[#3c4043] hover:text-[var(--google-blue)] transition-colors flex items-center justify-center group" aria-label="계산기" title="계산기">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                    <line x1="8" y1="6" x2="16" y2="6"></line>
                    <line x1="8" y1="10" x2="8.01" y2="10"></line>
                    <line x1="12" y1="10" x2="12.01" y2="10"></line>
                    <line x1="16" y1="10" x2="16.01" y2="10"></line>
                    <line x1="8" y1="14" x2="8.01" y2="14"></line>
                    <line x1="12" y1="14" x2="12.01" y2="14"></line>
                    <line x1="16" y1="14" x2="16.01" y2="14"></line>
                    <line x1="8" y1="18" x2="8.01" y2="18"></line>
                    <line x1="12" y1="18" x2="12.01" y2="18"></line>
                    <line x1="16" y1="18" x2="16.01" y2="18"></line>
                  </svg>
                </Link>
                <Link href="/blog" className="p-2 sm:p-2.5 rounded-full text-[#5f6368] dark:text-[#9aa0a6] hover:bg-[#e8eaed] dark:hover:bg-[#3c4043] hover:text-[var(--google-blue)] transition-colors flex items-center justify-center group" aria-label="블로그" title="블로그">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"></path>
                    <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                    <path d="M3 15h6"></path>
                    <path d="M3 19h6"></path>
                    <path d="M10 15h8"></path>
                    <path d="M10 19h8"></path>
                  </svg>
                </Link>
              </nav>

              <div className="flex items-center gap-0.5 sm:gap-1 pl-1 sm:pl-2 ml-1 sm:ml-2 border-l border-[var(--google-border)]">
                {/* 테마 변경 아이콘 */}
                <ThemeToggle />
                
                {/* 햄버거 메뉴 서랍 (카테고리) - 우측 사이드바가 숨겨지는 lg 미만에서만 노출 */}
                <div className="lg:hidden flex items-center">
                  <MobileSidebarDrawer tags={sortedTags} />
                </div>

                {/* 플랫폼 소개 아이콘 (맨 우측으로 이동) */}
                <Link href="/about" className="p-1.5 sm:p-2 text-[#5f6368] dark:text-[#9aa0a6] hover:text-[var(--google-blue)] hover:bg-[#e8eaed] dark:hover:bg-[#3c4043] rounded-full transition-colors flex items-center justify-center" aria-label="플랫폼 소개" title="플랫폼 소개">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* 3. 티스토리 2단 레이아웃 본문 75% : 사이드바 25% 구조 */}
        <SmartStickyLayout
          mainContent={children}
          sidebarContent={<SidebarContent tags={sortedTags} />}
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
