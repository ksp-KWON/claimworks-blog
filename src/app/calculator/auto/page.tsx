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

      <article className="w-full bg-white dark:bg-[#202124] rounded-none sm:rounded-none px-3 py-6 sm:p-10 lg:p-12 border-y sm:border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] relative">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-none bg-[#e8f0fe] dark:bg-[#8ab4f8]/20 text-[var(--google-blue)] dark:text-[#8ab4f8] mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#202124] dark:text-[#e8eaed] tracking-tight mb-4">
            자동차보험 합의금 계산기
          </h1>
          <p className="text-[#5f6368] dark:text-[#9aa0a6] max-w-2xl mx-auto leading-relaxed">
            대인배상 약관 기준에 따라 <strong>부상, 후유장해, 사망</strong> 피해에 대한 예상 합의금을 정확하게 산출합니다. 향후치료비 및 직불영수증 상계 로직이 포함되어 있습니다.
          </p>
        </header>

        <div className="w-full mx-auto">
          {/* 스크롤바와 기기 프레임을 제거하고, 전체 화면에 넓고 세련되게 펼쳐지는 카드 형태로 변경 */}
          <div className="bg-white dark:bg-[#202124] rounded-none sm:rounded-none p-2 sm:p-6 shadow-sm border border-gray-100 dark:border-white/5">
            <AutoCalculatorContainer />
          </div>
        </div>

      </article>
    </>
  );
}
