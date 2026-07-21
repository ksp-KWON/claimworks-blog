import Link from "next/link";
import AutoCalculatorContainer from "@/components/calculator/auto/AutoCalculatorContainer";
import type { Metadata } from "next";
import PremiumHeading from "@/components/ui/PremiumHeading";

export const metadata: Metadata = {
  title: '자동차보험 합의금 계산기 | 보상스쿨',
  description: '약관 지급기준(부상, 장해, 사망) 및 호프만계수를 적용한 정확한 예상 합의금을 확인하세요.',
  alternates: {
    canonical: 'https://claim-works.com/calculator/auto',
  },
};

export default function AutoCalculatorPage() {
  return (
    <>
      <div className="mb-6 px-4 sm:px-6 lg:px-8">
        <nav className="flex text-sm text-[#5f6368] dark:text-[#9aa0a6]" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-2">
            <li><Link href="/" className="hover:text-[var(--google-blue)] transition-colors">홈</Link></li>
            <li><span className="mx-2">/</span></li>
            <li><Link href="/calculator" className="hover:text-[var(--google-blue)] transition-colors">계산기 홈</Link></li>
            <li><span className="mx-2">/</span></li>
            <li className="text-[#202124] dark:text-[#e8eaed] font-medium" aria-current="page">자동차보험 합의금 계산기</li>
          </ol>
        </nav>
      </div>

      <div className="space-y-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* 🧮 스마트 보상금 계산기 상단 띠 배너 */}
        <div className="bg-[var(--google-blue)] text-white px-5 py-3 flex items-center justify-between flex-wrap gap-3 rounded-t-none">
          <div className="flex items-center gap-2.5">
            <span className="text-lg shrink-0">🧮</span>
            <div className="text-xs sm:text-sm font-extrabold tracking-tight">
              <span className="underline decoration-wavy mr-1.5">[통합 계산]</span>
              보상스쿨 빅데이터 알고리즘으로 예상 보상금을 미리 산출해보세요.
            </div>
          </div>
        </div>

        <div className="text-center space-y-4">
          <PremiumHeading level={1} gradient="blue" className="justify-center !text-3xl">
            자동차보험 합의금 계산기
          </PremiumHeading>
          <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-2xl mx-auto leading-relaxed font-medium">
            대인배상 약관 기준에 따라 부상, 후유장해, 사망 피해에 대한 예상 합의금을 정확하게 산출합니다. 향후치료비 및 직불영수증 상계 로직이 포함되어 있습니다.
          </p>
        </div>

        <div className="w-full mx-auto">
          <AutoCalculatorContainer />
        </div>
      </div>
    </>
  );
}
