import { getSortedPostsData } from "@/lib/posts";
import YouTubeBriefing from "@/components/YouTubeBriefing";
import HomePostList from "@/components/HomePostList";
import type { Metadata } from "next";
import PremiumHeaderBanner from "@/components/ui/PremiumHeaderBanner";

export const metadata: Metadata = {
  title: "보상스쿨 | 정도와 신뢰의 손해사정 실무 전문 그룹",
  description: "단순 보험금부터 까다로운 면책 분쟁까지, 유능한 손해사정 전문가 그룹 보상스쿨이 정당한 권리를 되찾아 드립니다. 수년간 축적된 방대한 실무 경험과 수많은 성공 사례로 검증된 압도적인 보상 노하우를 지금 무료 1:1 상담으로 확인해 보세요.",
  alternates: {
    canonical: "https://claim-works.com",
  },
  openGraph: {
    title: "보상스쿨 | 정도와 신뢰의 손해사정 실무 전문 그룹",
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
    title: "보상스쿨 | 정도와 신뢰의 손해사정 실무 전문 그룹",
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
    <div className="space-y-8 sm:space-y-12 sm:px-0">
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

      {/* 미디어 센터 ↔ 매거진 섹션 분리 프리미엄 디바이더 */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200/90 dark:via-zinc-800 to-transparent" role="separator" />

      {/* 보상스쿨 매거진 글로벌 타이틀 */}
      <section className="space-y-6">
        <PremiumHeaderBanner
          theme="blue"
          icon="book"
          title="보상스쿨 매거진"
          badges={['손해사정 실무 전문 칼럼', { text: '8대 전문 분야 300+ 심층 분석', color: 'gray' }]}
          description="사망·후유장해부터 실손·질병 진단까지, 보상스쿨 전문가 그룹의 분야별 보상 가이드와 최신 판례 분석을 전달합니다."
          rightLink={{ href: '/blog', text: '전체보기' }}
        />

        {/* 본문 영역: 가이드 카드 격자(Grid) 배치 및 실시간 카테고리 필터링 */}
        <HomePostList initialPosts={posts} />
      </section>

    </div>
  );
}
