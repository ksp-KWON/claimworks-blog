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

      <article className="w-full bg-white dark:bg-[#202124] rounded-none sm:rounded-3xl px-3 py-6 sm:p-10 lg:p-12 border-y sm:border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] relative">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#f3e8ff] dark:bg-[#7C4DFF]/20 text-[#7C4DFF] dark:text-[#ce93d8] mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path></svg>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#202124] dark:text-[#e8eaed] tracking-tight mb-4">
            배상책임 소송가액 계산기
          </h1>
          <p className="text-[#5f6368] dark:text-[#9aa0a6] max-w-2xl mx-auto leading-relaxed">
            법원 판례 기준에 따라 <strong>위자료, 일실수입, 휴업손해, 적극적 손해</strong>를 정확하게 산출합니다. 호프만 계수 및 과실상계 로직이 자동 적용됩니다.
          </p>
        </header>

        <div className="w-full mx-auto">
          <div className="bg-white dark:bg-[#202124] rounded-2xl sm:rounded-3xl p-2 sm:p-6 shadow-sm border border-gray-100 dark:border-white/5">
            <LiabilityCalculator />
          </div>
        </div>

      </article>
    </>
  );
}
