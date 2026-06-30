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

      {/* 2. 메인 페이지 인트로 헤더 */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50/80 via-white to-gray-50/50 dark:from-[var(--google-blue)]/10 dark:via-[#1e1e20] dark:to-[#1e1e20] border border-[var(--google-border)] p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-sm mb-4">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-[var(--google-blue)]"></div>
        <div className="relative z-10 pl-2 sm:pl-3">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2 tracking-tight">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--google-blue)] drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" /><circle cx="12" cy="10" r="3" /></svg>
            분야별 전문 보상 가이드 & 판례 분석
          </h1>
          <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] mt-2.5 break-keep leading-relaxed font-medium">
            사망·후유장해부터 실손·질병 진단까지, 보상스쿨 전문가 그룹이 엄선한 핵심 실무 노하우와 명쾌한 해결책을 제공합니다.
          </p>
        </div>
      </div>

      {/* 3. 본문 영역: 가이드 카드 격자(Grid) 배치 및 실시간 카테고리 필터링 */}
      <HomePostList initialPosts={posts} />

    </div>
  );
}
