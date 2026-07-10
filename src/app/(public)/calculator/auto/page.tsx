import Link from "next/link";
import AutoCalculatorContainer from "@/components/calculator/auto/AutoCalculatorContainer";
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
    <>
      <div className="mb-6">
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

      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="bg-white dark:bg-[#202124] rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:border-[var(--google-blue)] hover:shadow-[0_16px_50px_rgba(26,115,232,0.2)] transition-all duration-300 overflow-hidden">
          
          {/* 띠 배너 */}
          <div className="bg-[var(--google-blue)] text-white px-5 py-3 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-lg shrink-0">🚗</span>
              <div className="text-xs sm:text-sm font-extrabold tracking-tight">
                <span className="underline decoration-wavy mr-1.5">[대인배상 약관 기준]</span>
                부상, 후유장해, 사망 피해에 대한 객관적인 합의금을 산출합니다.
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-8">
            <header className="text-center space-y-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202124] dark:text-[#e8eaed] tracking-tight">
                보상스쿨 <span className="bg-gradient-to-r from-[var(--google-blue)] to-[#174ea6] bg-clip-text text-transparent">자동차보험 합의금 계산기</span>
              </h1>
              <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-2xl mx-auto leading-relaxed font-medium">
                대인배상 약관 기준에 따라 부상, 후유장해, 사망 피해에 대한 예상 합의금을 정확하게 산출합니다. 향후치료비 및 직불영수증 상계 로직이 포함되어 있습니다.
              </p>
            </header>

            <div className="w-full mx-auto">
              {/* 스크롤바와 기기 프레임을 제거하고, 전체 화면에 넓고 세련되게 펼쳐지는 카드 형태로 변경 */}
              <div className="bg-white dark:bg-[#202124] rounded-none p-2 sm:p-6 shadow-sm border border-gray-100 dark:border-white/5">
                <AutoCalculatorContainer />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
