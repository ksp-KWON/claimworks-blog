import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "금감원 소비자경보센터 - 보상스쿨",
  description: "금융감독원 공식 API와 연동하여 소비자경보, 분쟁조정사례, 금융꿀팁 등 가장 공신력 있는 보상 지침을 실시간으로 제공합니다.",
  alternates: {
    canonical: "https://claim-works.com/fss-news",
  },
  openGraph: {
    title: "금감원 소비자경보센터 - 보상스쿨",
    description: "금융감독원 공식 API와 연동하여 소비자경보, 분쟁조정사례, 금융꿀팁 등 가장 공신력 있는 보상 지침을 실시간으로 제공합니다.",
    url: "https://claim-works.com/fss-news",
    siteName: "보상스쿨 전문 손해사정 그룹",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "https://claim-works.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "보상스쿨 금감원 소비자경보센터",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "금감원 소비자경보센터 - 보상스쿨",
    description: "금융감독원 공식 API 연동 소비자경보 및 분쟁조정사례 실시간 가이드",
    images: ["https://claim-works.com/og-image.png"],
  },
};

export default function FssNewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
