import { getSortedPostsData } from "@/lib/posts";
import YouTubeBriefing from "@/components/YouTubeBriefing";
import HomePostList from "@/components/HomePostList";
import type { Metadata } from "next";
import Link from "next/link";
import PremiumCard from "@/components/ui/PremiumCard";
import PremiumHeading from "@/components/ui/PremiumHeading";
import PremiumBadge from "@/components/ui/PremiumBadge";
import AppIcon from "@/components/ui/AppIcon";

export const metadata: Metadata = {
  title: "보상스쿨 | 정도와 승소율의 전문 손해사정 그룹",
  description: "단순 보험금부터 까다로운 면책 분쟁까지, 유능한 손해사정 전문가 그룹 보상스쿨이 정당한 권리를 되찾아 드립니다. 수년간 축적된 방대한 실무 경험과 수많은 성공 사례로 검증된 압도적인 보상 노하우를 지금 무료 1:1 상담으로 확인해 보세요.",
  alternates: {
    canonical: "https://claim-works.com",
  },
  openGraph: {
    title: "보상스쿨 | 정도와 승소율의 전문 손해사정 그룹",
    description: "단순 보험금부터 까다로운 면책 분쟁까지, 유능한 손해사정 전문가 그룹 보상스쿨이 정당한 권리를 되찾아 드립니다. 수년간 축적된 방대한 실무 경험과 수많은 성공 사례로 검증된 압도적인 보상 노하우를 지금 무료 1:1 상담으로 확인해 보세요.",
    url: "https://claim-works.com",
    siteName: "보상스쿨 전문 손해사정 그룹",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "https://claim-works.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "보상스쿨 전문 손해사정 그룹",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "보상스쿨 | 정도와 승소율의 전문 손해사정 그룹",
    description: "수년간 축적된 방대한 실무 경험과 수많은 성공 사례로 검증된 압도적인 보상 노하우를 지금 무료 1:1 상담으로 확인해 보세요.",
    images: ["https://claim-works.com/og-image.png"],
  },
};

// ── 구글 지식그래프(Knowledge Graph) & AI Overview 인용 대응 스키마 ──────
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "보상스쿨",
  "url": "https://claim-works.com",
  "logo": {
    "@type": "ImageObject",
    "url": "https://claim-works.com/favicon.ico",
    "width": 48,
    "height": 48
  },
  "description": "대한민국 손해사정 전문 정보 플랫폼. 사망·후유장해, 실손·질병 진단, 교통사고 보상, 근재·산재 등 분야별 전문가 실무 가이드를 제공합니다.",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "availableLanguage": "Korean"
  },
  "inLanguage": "ko-KR"
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "보상스쿨",
  "url": "https://claim-works.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://claim-works.com/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
};

export default function Home() {
  // 전체 최신 보상 가이드 블로그 목록 로드
  const posts = getSortedPostsData();

  return (
    <div className="space-y-12 sm:space-y-16 sm:px-0">
      {/* Organization & WebSite 구조화 데이터 (구글 지식그래프 & AI Overview 대응) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      {/* 유튜브 전문가 브리핑 섹션 (미디어 센터) */}
      <YouTubeBriefing />

      {/* 보상스쿨 매거진 글로벌 타이틀 (미디어 센터와 대칭 통일된 입체감 있는 블루 파스텔 PremiumCard) */}
      <section className="space-y-6">
        <PremiumCard 
          borderColor="blue" 
          hoverEffect={false} 
          watermarkIcon="book" 
          className="!p-5 sm:!p-7 !bg-gradient-to-r !from-blue-50/90 !via-indigo-50/50 !to-transparent dark:!from-blue-950/40 dark:!via-indigo-950/20 dark:!to-transparent border-blue-200/90 dark:border-blue-900/50"
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <PremiumBadge color="blue">대한민국 최고 손해사정 실무 칼럼</PremiumBadge>
                <PremiumBadge color="gray">8대 전문 분야 300+ 심층 분석</PremiumBadge>
              </div>
              {/* 전체보기 링크 */}
              <Link 
                href="/blog" 
                className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group/link shrink-0"
              >
                전체보기
                <AppIcon name="chevron-right" size={14} className="group-hover/link:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <PremiumHeading 
              level={1} 
              gradient="blue" 
              showLeftBorder={false} 
              icon={<AppIcon name="book" size={24} className="text-blue-600 dark:text-blue-400 shrink-0" />}
              className="!mb-2 !text-xl sm:!text-2xl"
            >
              보상스쿨 매거진
            </PremiumHeading>

            <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] break-keep leading-relaxed font-medium">
              사망·후유장해부터 실손·질병 진단까지, 보상스쿨 전문가 그룹의 분야별 보상 가이드와 최신 판례 분석을 전달합니다.
            </p>
          </div>
        </PremiumCard>

        {/* 본문 영역: 가이드 카드 격자(Grid) 배치 및 실시간 카테고리 필터링 */}
        <HomePostList initialPosts={posts} />
      </section>

    </div>
  );
}
