import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI 판례검색센터 - 보상스쿨",
  description: "어려운 보상 판례, 일상어로 쉽게 검색하세요. 법제처 공공데이터를 기반으로 나에게 가장 유리한 대법원 핵심 판례를 AI가 찾아드립니다.",
};

export default function PrecedentSearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
