import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "교통사고 로컬 안심케어 - 보상스쿨",
  description: "도로교통공단 안전 통계를 기반으로 내 지역구의 교통사고 발생 현황을 확인하고, 맞춤형 보상 케어 가이드를 확인하세요.",
  alternates: {
    canonical: "https://claim-works.com/traffic-care",
  },
  openGraph: {
    title: "교통사고 로컬 안심케어 - 보상스쿨",
    description: "도로교통공단 안전 통계를 기반으로 내 지역구의 교통사고 발생 현황을 확인하고, 맞춤형 보상 케어 가이드를 확인하세요.",
    url: "https://claim-works.com/traffic-care",
    siteName: "보상스쿨 전문 손해사정 그룹",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "https://claim-works.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "보상스쿨 교통사고 로컬 안심케어",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "교통사고 로컬 안심케어 - 보상스쿨",
    description: "도로교통공단 안전 통계 기반 지역별 교통사고 맞춤형 보상 케어 가이드",
    images: ["https://claim-works.com/og-image.png"],
  },
};

export default function TrafficCareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
