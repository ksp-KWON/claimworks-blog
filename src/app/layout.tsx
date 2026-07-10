import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PublicLayoutWrapper from "@/components/PublicLayoutWrapper";
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
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 transition-colors duration-300 pb-[calc(env(safe-area-inset-bottom,20px)+64px)] lg:pb-0 overflow-x-clip">
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
        
        {/* Client Wrapper to hide layout elements on /admin */}
        <PublicLayoutWrapper sortedTags={sortedTags}>
          {children}
        </PublicLayoutWrapper>
      </body>
    </html>
  );
}
