import Link from "next/link";
import LiabilityCalculator from "@/components/calculator/liability/LiabilityCalculator";
import type { Metadata } from "next";
import PremiumHeading from "@/components/ui/PremiumHeading";

export const metadata: Metadata = {
  title: '배상책임 소송가액 계산기 | 보상스쿨',
  description: '법원 손해배상 산정 기준(호프만계수)을 적용한 위자료, 일실수입, 휴업손해 등 예상 소송가액을 계산해 보세요.',
  alternates: {
    canonical: 'https://claim-works.com/calculator/liability',
  },
};

export default function LiabilityCalculatorPage() {
  return (
    <>
      <div className="mb-6 px-4 sm:px-6 lg:px-8">
        <nav className="flex text-sm text-[#5f6368] dark:text-[#9aa0a6]" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-2">
            <li><Link href="/" className="hover:text-[var(--google-blue)] transition-colors">홈</Link></li>
            <li><span className="mx-2">/</span></li>
            <li><Link href="/calculator" className="hover:text-[var(--google-blue)] transition-colors">계산기 홈</Link></li>
            <li><span className="mx-2">/</span></li>
            <li className="text-[#202124] dark:text-[#e8eaed] font-medium" aria-current="page">배상책임 소송가액 계산기</li>
          </ol>
        </nav>
      </div>

      <div className="space-y-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center space-y-4">
          <PremiumHeading level={1} gradient="red" className="justify-center !text-3xl">
            배상책임 소송가액 계산기
          </PremiumHeading>
          <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-2xl mx-auto leading-relaxed font-medium">
            법원 판례 기준에 따라 위자료, 일실수입, 휴업손해, 적극적 손해를 정확하게 산출합니다. 호프만 계수 및 과실상계 로직이 자동 적용됩니다.
          </p>
        </div>

        <div className="w-full mx-auto">
          <LiabilityCalculator />
        </div>
      </div>
    </>
  );
}
