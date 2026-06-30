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

      <article className="w-full bg-white dark:bg-[#202124] rounded-none sm:rounded-none px-3 py-6 sm:p-10 lg:p-12 border-y sm:border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] relative">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-none bg-[#e6f4ea] dark:bg-[#1e8e3e]/20 text-[var(--google-green)] dark:text-[#81c995] mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#202124] dark:text-[#e8eaed] tracking-tight mb-4">
            실손의료비 보상 계산기
          </h1>
          <p className="text-[#5f6368] dark:text-[#9aa0a6] max-w-2xl mx-auto leading-relaxed">
            1세대부터 4세대까지 세대별 약관이 모두 반영된 전문가용 계산기입니다. 
            영수증의 급여/비급여 금액을 입력하여 예상 보상금을 확인하세요.
          </p>
        </header>

        <div className="w-full mx-auto">
          {/* 스크롤바와 기기 프레임을 제거하고, 전체 화면에 넓고 세련되게 펼쳐지는 카드 형태로 변경 */}
          <div className="bg-white dark:bg-[#202124] rounded-none sm:rounded-none p-2 sm:p-6 shadow-sm border border-gray-100 dark:border-white/5">
            <MedicalCalculatorContainer />
          </div>
        </div>
      </article>
    </>
  );
}
