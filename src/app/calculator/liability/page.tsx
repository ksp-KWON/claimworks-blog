import Link from "next/link";
import LiabilityCalculator from "@/components/calculator/liability/LiabilityCalculator";
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
    <>
      <div className="mb-6">
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

      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="bg-white dark:bg-[#202124] rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:border-[var(--google-red)] hover:shadow-[0_16px_50px_rgba(234,67,53,0.2)] transition-all duration-300 overflow-hidden">
          
          {/* 띠 배너 */}
          <div className="bg-[var(--google-red)] text-white px-5 py-3 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-lg shrink-0">⚖️</span>
              <div className="text-xs sm:text-sm font-extrabold tracking-tight">
                <span className="underline decoration-wavy mr-1.5">[법원 판례 기준]</span>
                위자료, 일실수입, 휴업손해 등 각종 손해배상액을 산출합니다.
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-8">
            <header className="text-center space-y-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202124] dark:text-[#e8eaed] tracking-tight">
                보상스쿨 <span className="bg-gradient-to-r from-[var(--google-red)] to-[#d93025] bg-clip-text text-transparent">배상책임 소송가액 계산기</span>
              </h1>
              <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-2xl mx-auto leading-relaxed font-medium">
                법원 판례 기준에 따라 위자료, 일실수입, 휴업손해, 적극적 손해를 정확하게 산출합니다. 호프만 계수 및 과실상계 로직이 자동 적용됩니다.
              </p>
            </header>

            <div className="w-full mx-auto">
              <div className="bg-white dark:bg-[#202124] rounded-none p-2 sm:p-6 shadow-sm border border-gray-100 dark:border-white/5">
                <LiabilityCalculator />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
