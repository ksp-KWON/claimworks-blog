import { getSortedPostsData } from "@/lib/posts";
import YouTubeBriefing from "@/components/YouTubeBriefing";
import HomePostList from "@/components/HomePostList";
import type { Metadata } from "next";
import PremiumHeading from "@/components/ui/PremiumHeading";

export const metadata: Metadata = {
  title: "보상스쿨 | 압도적 승인율의 전문 손해사정 그룹",
  description: "숨은 보험금부터 까다로운 면책 분쟁까지, 유능한 손해사정 전문가 그룹 보상스쿨이 당신의 정당한 권리를 되찾아 드립니다. 오랜 업력과 방대한 보상 실무 경험에서 검증된 압도적인 성공 노하우와 무료 1:1 상담을 지금 바로 경험해보세요.",
  alternates: {
    canonical: "https://claim-works.com",
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

      {/* 유튜브 전문가 브리핑 섹션 (소개글 위쪽 배치) */}
      <YouTubeBriefing />

      {/* 분야별 보상 가이드 글로벌 타이틀 (박스 형태 제거하여 중복 방지) */}
      <section className="space-y-6 sm:space-y-8">
        <div className="px-1 sm:px-2">
          <PremiumHeading level={1} gradient="blue" showLeftBorder={true} className="!mb-3 !text-xl sm:!text-2xl">
            분야별 전문 보상 가이드 & 판례 분석
          </PremiumHeading>
          <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] break-keep leading-relaxed font-medium">
            사망·후유장해부터 실손·질병 진단까지, 보상스쿨 전문가 그룹이 엄선한 핵심 실무 노하우와 명쾌한 해결책을 제공합니다.
          </p>
        </div>

        {/* 본문 영역: 가이드 카드 격자(Grid) 배치 및 실시간 카테고리 필터링 */}
        <HomePostList initialPosts={posts} />
      </section>

    </div>
  );
}
