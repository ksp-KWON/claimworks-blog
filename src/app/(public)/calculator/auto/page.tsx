import Link from "next/link";
import AutoCalculator from "@/components/calculator/AutoCalculator";
import PremiumHeaderBanner from "@/components/ui/PremiumHeaderBanner";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: '자동차보험 합의금 계산기 | 보상스쿨',
  description: '약관 지급기준(부상, 장해, 사망) 및 호프만계수를 적용한 정확한 예상 합의금을 확인하세요.',
  alternates: {
    canonical: 'https://claim-works.com/calculator/auto',
  },
};

export default function AutoCalculatorPage() {
  return (
    <div className="w-full space-y-6">
      {/* 상단 브레드크럼 */}
      <nav className="flex text-xs text-[#5f6368] dark:text-[#9aa0a6]" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1.5">
          <li><Link href="/" className="hover:text-[var(--google-blue)] transition-colors">홈</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href="/calculator" className="hover:text-[var(--google-blue)] transition-colors">계산기 센터</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="text-[#202124] dark:text-[#e8eaed] font-medium" aria-current="page">자동차보험 합의금</li>
        </ol>
      </nav>

      {/* 전역 표준 메인 헤더 배너 */}
      <PremiumHeaderBanner
        theme="blue"
        icon="calculator"
        title="자동차보험 합의금 스마트 계산기"
        badges={['대법원 호프만 계수 연동', { text: '2024 최신 약관 기준', color: 'green' }]}
        description="대인배상 약관 기준(부상·장해·사망) 및 과실상계를 적용하여 예상 합의금을 1분 만에 정밀 산출합니다."
      />

      {/* 스마트 단일 컬럼 자동차 계산기 (풀 와이드) */}
      <AutoCalculator hideHeader={true} />
    </div>
  );
}
