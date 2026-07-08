import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "교통사고 로컬 안심케어 - 보상스쿨",
  description: "도로교통공단 안전 통계를 기반으로 내 지역구의 교통사고 발생 현황을 확인하고, 맞춤형 보상 케어 가이드를 확인하세요.",
  alternates: {
    canonical: "https://claim-works.com/traffic-care",
  },
};

export default function TrafficCareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
