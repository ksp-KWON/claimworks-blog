import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "검색 결과 - 보상스쿨",
  description: "입력하신 키워드와 관련된 보상스쿨 전문가 그룹의 칼럼 및 분석 자료를 확인하세요.",
  alternates: {
    canonical: "https://claim-works.com/search",
  },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
