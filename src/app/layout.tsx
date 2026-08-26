import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TailwindSafelist from "@/components/TailwindSafelist";
import ContentGuard from "@/components/ContentGuard";

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
  title: {
    default: "보상스쿨 전문 손해사정 그룹",
    template: "%s | 보상스쿨"
  },
  description: "건강보험심사평가원의 공개 정보를 기반으로 공인 손해사정사가 분석한 실무 보상 노하우와 무료 상담 가이드를 제공합니다.",
  keywords: ["손해사정", "보험금청구", "실손보험분쟁", "교통사고합의금", "산재보상", "후유장해", "사망보험금"],
  authors: [{ name: "보상스쿨 손해사정사", url: "https://claim-works.com/about" }],
  creator: "보상스쿨 전문 손해사정 그룹",
  publisher: "보상스쿨",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://claim-works.com',
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://claim-works.com',
    siteName: '보상스쿨 전문 손해사정 그룹',
    title: '보상스쿨 전문 손해사정 그룹',
    description: '건강보험심사평가원의 공개 정보를 기반으로 공인 손해사정사가 분석한 실무 보상 노하우와 무료 상담 가이드를 제공합니다.',
    images: [
      {
        url: 'https://claim-works.com/og-image.png',
        width: 1200,
        height: 630,
        alt: '보상스쿨 전문 손해사정 그룹',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '보상스쿨 전문 손해사정 그룹',
    description: '건강보험심사평가원의 공개 정보 기반 손해사정 실무 보상 가이드',
    images: ['https://claim-works.com/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 구글 검색 센터 공식 Organization & WebSite 구조화 데이터
  const globalJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://claim-works.com/#organization",
        "name": "보상스쿨",
        "alternateName": "보상스쿨 전문 손해사정 그룹",
        "url": "https://claim-works.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://claim-works.com/logo.png",
          "width": 550,
          "height": 550
        },
        "description": "교통사고, 질병진단비, 실손보험, 산재·근재, 배상책임 분야 공인 손해사정 전문 그룹",
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer support",
          "url": "https://claim-works.com/consultation"
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://claim-works.com/#website",
        "url": "https://claim-works.com",
        "name": "보상스쿨",
        "publisher": {
          "@id": "https://claim-works.com/#organization"
        },
        "inLanguage": "ko-KR",
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://claim-works.com/search?q={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      }
    ]
  };

  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased overflow-x-hidden`}
    >
      <head>
        <meta name="naver-site-verification" content="2a1537523725cefaf7b77e00215e3ae0140f46a2" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css" integrity="sha384-zh0CIslj+VczCZtlzBcjt5ppRcsAmDnE6yOqO8O/LIPQ7f/604/zYqGz+KNgA7u1" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(globalJsonLd) }}
        />
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
      </head>
      <body className="min-h-full bg-slate-50 text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 transition-colors duration-300 overflow-x-clip">
        <TailwindSafelist />
        <ContentGuard />
        {children}
      </body>
    </html>
  );
}
