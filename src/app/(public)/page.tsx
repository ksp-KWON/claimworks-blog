import { getSortedPostsData } from "@/lib/posts";
import YouTubeBriefing from "@/components/YouTubeBriefing";
import HomePostList from "@/components/HomePostList";
import type { Metadata } from "next";
import PremiumHeading from "@/components/ui/PremiumHeading";

export const metadata: Metadata = {
  title: "지역별 병원추천 & 보상 실무 가이드 | 보상스쿨",
  description: "건강보험심사평가원 공개 데이터를 기반으로 분석한 지역별 우수 병원 추천 및 손해사정 보상 실무 가이드를 제공합니다.",
  alternates: {
    canonical: "https://claim-works.com",
  },
};

export default function Home() {
  // 전체 최신 보상 가이드 블로그 목록 로드
  const posts = getSortedPostsData();

  return (
    <div className="space-y-12 sm:space-y-16 sm:px-0">
      
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

        {/* 3. 본문 영역: 가이드 카드 격자(Grid) 배치 및 실시간 카테고리 필터링 */}
        <HomePostList initialPosts={posts} />
      </section>

    </div>
  );
}
