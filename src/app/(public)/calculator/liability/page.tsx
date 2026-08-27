import Link from "next/link";
import LiabilityCalculator from "@/components/calculator/LiabilityCalculator";
import PremiumHeaderBanner from "@/components/ui/PremiumHeaderBanner";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: '배상책임 소송가액 계산기 | 보상스쿨',
  description: '법원 손해배상 산정 기준(호프만계수)을 적용한 위자료, 일실수입, 휴업손해 등 예상 소송가액을 계산해 보세요.',
  alternates: {
    canonical: 'https://claim-works.com/calculator/liability',
  },
};

export default function LiabilityCalculatorPage() {
  return (
    <div className="w-full space-y-6">
      {/* 상단 브레드크럼 */}
      <nav className="flex text-xs text-[#5f6368] dark:text-[#9aa0a6]" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1.5">
          <li><Link href="/" className="hover:text-[var(--google-blue)] transition-colors">홈</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href="/calculator" className="hover:text-[var(--google-blue)] transition-colors">계산기 센터</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="text-[#202124] dark:text-[#e8eaed] font-medium" aria-current="page">배상책임 소송가액</li>
        </ol>
      </nav>

      {/* 전역 표준 메인 헤더 배너 */}
      <PremiumHeaderBanner
        theme="red"
        icon="calculator"
        title="배상책임 소송가액 스마트 계산기"
        badges={['법원 판결 산정 기준', { text: '일실수입 정밀 연산', color: 'green' }]}
        description="법원 손해배상 산정 기준(호프만계수)을 적용한 위자료, 일실수입, 개호비 등 예상 소송가액을 계산해 보세요."
      />

      {/* 스마트 단일 컬럼 배상책임 계산기 (풀 와이드) */}
      <LiabilityCalculator hideHeader={true} />
    </div>
  );
}
