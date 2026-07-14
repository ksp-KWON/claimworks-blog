import type { Metadata } from 'next';
import AdminAuth from './AdminAuth';

export const metadata: Metadata = {
  title: '관리자 페이지 | 보상스쿨',
  robots: { index: false, follow: false },
};

/**
 * 관리자 전용 레이아웃.
 * 이 파일이 존재함으로써 Next.js App Router는 /admin 진입 시
 * (public)/layout.tsx 를 완전히 언마운트하고 이 레이아웃으로 교체합니다.
 * 따라서 방문자용 MobileBottomNav, Header, Footer가 절대 노출되지 않습니다.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminAuth>{children}</AdminAuth>;
}
