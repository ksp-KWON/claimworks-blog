import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "빅데이터 판례검색센터 - 보상스쿨",
  description: "어려운 보상 판례, 일상어로 쉽게 검색하세요. 법제처 공공데이터를 기반으로 나에게 가장 유리한 대법원 핵심 판례를 빅데이터로 찾아드립니다.",
  alternates: {
    canonical: "https://claim-works.com/precedent-search",
  },
  openGraph: {
    title: "빅데이터 판례검색센터 - 보상스쿨",
    description: "어려운 보상 판례, 일상어로 쉽게 검색하세요. 법제처 공공데이터를 기반으로 나에게 가장 유리한 대법원 핵심 판례를 빅데이터로 찾아드립니다.",
    url: "https://claim-works.com/precedent-search",
    siteName: "보상스쿨 전문 손해사정 그룹",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "https://claim-works.com/opengraph-image",
        width: 1200,
        height: 630,
        alt: "보상스쿨 빅데이터 판례검색센터",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "빅데이터 판례검색센터 - 보상스쿨",
    description: "어려운 보상 판례, 일상어로 쉽게 검색하세요. 대법원 핵심 판례 빅데이터 검색 서비스",
    images: ["https://claim-works.com/opengraph-image"],
  },
};

export default function PrecedentSearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
