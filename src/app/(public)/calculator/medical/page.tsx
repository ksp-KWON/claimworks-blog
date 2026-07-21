import Link from "next/link";
import MedicalCalculator from "@/components/calculator/MedicalCalculator";
import type { Metadata } from "next";
import PremiumHeading from "@/components/ui/PremiumHeading";

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
      <div className="mb-6 px-4 sm:px-6 lg:px-8">
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

      <div className="space-y-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center space-y-4">
          <PremiumHeading level={1} gradient="green" className="justify-center !text-3xl">
            실손의료비 보상 계산기
          </PremiumHeading>
          <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-2xl mx-auto leading-relaxed font-medium">
            1세대부터 5세대까지 세대별 약관이 모두 반영된 전문가용 계산기입니다. 영수증의 급여/비급여 금액을 입력하여 예상 보상금을 확인하세요.
          </p>
        </div>

        <div className="w-full mx-auto">
          <MedicalCalculator />
        </div>
      </div>
    </>
  );
}
