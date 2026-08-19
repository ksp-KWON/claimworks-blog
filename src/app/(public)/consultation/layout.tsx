import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '보상스쿨 무료 상담 신청',
  description: '보험사의 억울한 거절과 삭감 주장, 보상스쿨의 전문 손해사정사가 직접 확인하고 명쾌한 답변과 해결책을 드립니다.',
  alternates: {
    canonical: 'https://claim-works.com/consultation',
  },
  openGraph: {
    title: '보상스쿨 무료 상담 신청',
    description: '보험사의 억울한 거절과 삭감 주장, 보상스쿨의 전문 손해사정사가 직접 확인하고 명쾌한 답변과 해결책을 드립니다.',
    url: 'https://claim-works.com/consultation',
    siteName: '보상스쿨 전문 손해사정 그룹',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: 'https://claim-works.com/opengraph-image',
        width: 1200,
        height: 630,
        alt: '보상스쿨 무료 상담 신청',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '보상스쿨 무료 상담 신청',
    description: '보험사의 억울한 거절과 삭감 주장, 전문 손해사정사가 직접 명쾌한 해결책을 드립니다.',
    images: ['https://claim-works.com/opengraph-image'],
  },
};

export default function ConsultationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
