import Link from "next/link";
import MedicalCalculator from "@/components/calculator/MedicalCalculator";
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
    <div className="w-full space-y-5">
      {/* 상단 브레드크럼 */}
      <nav className="flex text-xs text-[#5f6368] dark:text-[#9aa0a6]" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1.5">
          <li><Link href="/" className="hover:text-[var(--google-blue)] transition-colors">홈</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href="/calculator" className="hover:text-[var(--google-blue)] transition-colors">계산기 홈</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="text-[#202124] dark:text-[#e8eaed] font-medium" aria-current="page">실손의료비 보상</li>
        </ol>
      </nav>

      {/* 스마트 단일 컬럼 실손 계산기 (풀 와이드) */}
      <MedicalCalculator />
    </div>
  );
}
