import Link from "next/link";
import MedicalCalculatorContainer from "@/components/calculator/medical/MedicalCalculatorContainer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: '실손의료비 계산기 | 보상스쿨',
  description: '급여/비급여 병원비, 약제비 본인부담금을 공제한 예상 실손 보상금을 산출해 보세요.',
  alternates: {
    canonical: 'https://claim-works.com/calculator/medical',
  },
};

export default function MedicalCalculatorPage() {
  return (
    <>
      <div className="mb-6">
        <nav className="flex text-sm text-[#5f6368] dark:text-[#9aa0a6]" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-2">
            <li><Link href="/" className="hover:text-[var(--google-blue)] transition-colors">홈</Link></li>
            <li><span className="mx-2">/</span></li>
            <li><Link href="/calculator" className="hover:text-[var(--google-blue)] transition-colors">계산기 홈</Link></li>
            <li><span className="mx-2">/</span></li>
            <li className="text-[#202124] dark:text-[#e8eaed] font-medium" aria-current="page">실손의료비 계산기</li>
          </ol>
        </nav>
      </div>

      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="bg-white dark:bg-[#202124] rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:border-[var(--google-green)] hover:shadow-[0_16px_50px_rgba(52,168,83,0.2)] transition-all duration-300 overflow-hidden">
          
          {/* 띠 배너 */}
          <div className="bg-[var(--google-green)] text-white px-5 py-3 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-lg shrink-0">🏥</span>
              <div className="text-xs sm:text-sm font-extrabold tracking-tight">
                <span className="underline decoration-wavy mr-1.5">[실손 보험 약관 기준]</span>
                급여/비급여 병원비, 약제비 본인부담금을 공제한 실손 보상금을 산출합니다.
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-8">
            <header className="text-center space-y-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202124] dark:text-[#e8eaed] tracking-tight">
                보상스쿨 <span className="bg-gradient-to-r from-[var(--google-green)] to-[#1e8e3e] bg-clip-text text-transparent">실손의료비 보상 계산기</span>
              </h1>
              <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-2xl mx-auto leading-relaxed font-medium">
                1세대부터 4세대까지 세대별 약관이 모두 반영된 전문가용 계산기입니다. 영수증의 급여/비급여 금액을 입력하여 예상 보상금을 확인하세요.
              </p>
            </header>

            <div className="w-full mx-auto">
              <div className="bg-white dark:bg-[#202124] rounded-none p-2 sm:p-6 shadow-sm border border-gray-100 dark:border-white/5">
                <MedicalCalculatorContainer />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
