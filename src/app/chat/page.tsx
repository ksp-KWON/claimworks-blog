import type { Metadata } from "next";
import ChatRedirect from "./ChatRedirect";

export const metadata: Metadata = {
  title: "보상스쿨 채팅 상담 신청",
  description: "보험사의 억울한 거절과 삭감 주장에 맞서, 보상스쿨의 전문 손해사정사가 1:1 비공개 무료 채팅 상담을 실시간으로 진행해 드립니다.",
  alternates: {
    canonical: "https://claim-works.com/chat",
  },
  openGraph: {
    title: "보상스쿨 채팅 상담 신청",
    description: "보험사의 억울한 거절과 삭감 주장에 맞서, 보상스쿨의 전문 손해사정사가 1:1 비공개 무료 채팅 상담을 실시간으로 진행해 드립니다.",
    url: "https://claim-works.com/chat",
    siteName: "보상스쿨 전문 손해사정 그룹",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "https://claim-works.com/logo.png",
        width: 500,
        height: 500,
        alt: "보상스쿨 실시간 채팅 상담",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "보상스쿨 채팅 상담 신청",
    description: "1:1 비공개 무료 채팅 상담을 실시간으로 진행해 드립니다.",
    images: ["https://claim-works.com/logo.png"],
  },
};

export default function ChatPage() {
  return <ChatRedirect />;
}
