import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '보상스쿨 무료 상담 신청',
  description: '보험사의 억울한 거절과 삭감 주장, 보상스쿨의 전문 손해사정사가 직접 확인하고 명쾌한 답변과 해결책을 드립니다.',
};

export default function ConsultationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
