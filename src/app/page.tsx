import { getSortedPostsData } from "@/lib/posts";
import YouTubeBriefing from "@/components/YouTubeBriefing";
import HomePostList from "@/components/HomePostList";
import type { Metadata } from "next";

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
    <div className="space-y-8 sm:px-0">
      
      {/* 유튜브 전문가 브리핑 섹션 (소개글 위쪽 배치) */}
      <YouTubeBriefing />

      {/* 2. 메인 페이지 인트로 헤더 (라벨지 스타일) */}
      <div className="flex flex-col items-start gap-2.5 sm:gap-3 mb-8 px-1 sm:px-0">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[var(--google-blue)] dark:text-blue-400 font-bold text-xs sm:text-sm border border-blue-100 dark:border-blue-800/50 shadow-sm">
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" /><circle cx="12" cy="10" r="3" /></svg>
          보상스쿨 핵심 가이드
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202124] dark:text-[#e8eaed] tracking-tight">
          분야별 전문 보상 가이드 & 판례 분석
        </h1>
        <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] break-keep leading-relaxed font-medium">
          사망·후유장해부터 실손·질병 진단까지, 보상스쿨 전문가 그룹이 엄선한 핵심 실무 노하우와 명쾌한 해결책을 제공합니다.
        </p>
      </div>

      {/* 3. 본문 영역: 가이드 카드 격자(Grid) 배치 및 실시간 카테고리 필터링 */}
      <HomePostList initialPosts={posts} />

    </div>
  );
}
