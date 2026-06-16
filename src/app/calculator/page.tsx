import Link from "next/link";

export const metadata = {
  title: '스마트 보상금 계산기 | 보상스쿨',
  description: '자동차보험 합의금 및 실손의료비 보상금을 계산해 보세요.',
  alternates: {
    canonical: 'https://claim-works.com/calculator',
  },
};

export default function CalculatorIndexPage() {
  // 사용자가 이전 주소(/calculator)로 접속했을 때 자동차보험 계산기로 자동 리다이렉트 처리하려면
  // 아래 주석을 해제하세요. 여기서는 두 계산기를 선택할 수 있는 랜딩 페이지를 제공합니다.
  // redirect('/calculator/auto');

  return (
    <>
      <div className="mb-6">
        <nav className="flex text-sm text-[#5f6368] dark:text-[#9aa0a6]" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-2">
            <li><Link href="/" className="hover:text-[var(--google-blue)] transition-colors">홈</Link></li>
            <li><span className="mx-2">/</span></li>
            <li className="text-[#202124] dark:text-[#e8eaed] font-medium" aria-current="page">보상금 계산기</li>
          </ol>
        </nav>
      </div>

      <article className="w-full bg-white dark:bg-[#202124] rounded-none sm:rounded-3xl px-3 py-6 sm:p-10 lg:p-12 border-y sm:border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] relative">
        <header className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#f8f9fa] dark:bg-[#303134] border border-[var(--google-border)] text-gray-700 dark:text-gray-300 mb-6 shadow-sm">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#202124] dark:text-[#e8eaed] tracking-tight mb-4">
            어떤 보상금을 계산하시겠습니까?
          </h1>
          <p className="text-[#5f6368] dark:text-[#9aa0a6] max-w-2xl mx-auto leading-relaxed">
            더욱 정확하고 전문적인 계산을 위해 자동차보험, 실손의료비, 배상책임 소송가액 계산기가 <strong>독립된 시스템으로 완벽히 분리</strong>되었습니다. 원하시는 계산기를 선택해 주세요.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {/* 배상책임 링크 */}
          <Link href="/calculator/liability" className="group flex flex-col items-center justify-center p-6 sm:p-8 bg-white dark:bg-[#202124] border-2 border-[var(--google-border)] rounded-3xl hover:border-[#7C4DFF] hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#f3e8ff] dark:bg-[#7C4DFF]/20 rounded-full flex items-center justify-center text-3xl sm:text-4xl mb-4 sm:mb-6 shadow-sm group-hover:scale-110 transition-transform">
              ⚖️
            </div>
            <h2 className="text-2xl font-bold text-[#202124] dark:text-[#e8eaed] mb-2 group-hover:text-[#7C4DFF] transition-colors">배상책임 소송가액</h2>
            <p className="text-center text-[#5f6368] dark:text-[#9aa0a6] text-sm leading-relaxed">
              법원 판례 기준에 따른<br/>위자료, 일실수입 등<br/>예상 소송가액 산출
            </p>
            <div className="mt-6 flex items-center gap-2 text-[#7C4DFF] font-bold text-sm bg-[#f3e8ff] dark:bg-[#7C4DFF]/10 px-4 py-2 rounded-full">
              계산하러 가기 <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </div>
          </Link>

          {/* 자동차보험 링크 */}
          <Link href="/calculator/auto" className="group flex flex-col items-center justify-center p-6 sm:p-8 bg-white dark:bg-[#202124] border-2 border-[var(--google-border)] rounded-3xl hover:border-[var(--google-blue)] hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#e8f0fe] dark:bg-[#8ab4f8]/20 rounded-full flex items-center justify-center text-3xl sm:text-4xl mb-4 sm:mb-6 shadow-sm group-hover:scale-110 transition-transform">
              🚗
            </div>
            <h2 className="text-2xl font-bold text-[#202124] dark:text-[#e8eaed] mb-2 group-hover:text-[var(--google-blue)] transition-colors">자동차보험 합의금</h2>
            <p className="text-center text-[#5f6368] dark:text-[#9aa0a6] text-sm leading-relaxed">
              교통사고 피해자 전용.<br/>부상, 후유장해, 사망에 따른<br/>대인배상 약관 기준 합의금 산출
            </p>
            <div className="mt-6 flex items-center gap-2 text-[var(--google-blue)] font-bold text-sm bg-[#e8f0fe] dark:bg-[#8ab4f8]/10 px-4 py-2 rounded-full">
              계산하러 가기 <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </div>
          </Link>

          {/* 실손의료비 링크 */}
          <Link href="/calculator/medical" className="group flex flex-col items-center justify-center p-6 sm:p-8 bg-white dark:bg-[#202124] border-2 border-[var(--google-border)] rounded-3xl hover:border-[var(--google-green)] hover:shadow-lg transition-all duration-300">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#e6f4ea] dark:bg-[#1e8e3e]/20 rounded-full flex items-center justify-center text-3xl sm:text-4xl mb-4 sm:mb-6 shadow-sm group-hover:scale-110 transition-transform">
              🏥
            </div>
            <h2 className="text-2xl font-bold text-[#202124] dark:text-[#e8eaed] mb-2 group-hover:text-[var(--google-green)] transition-colors">실손의료비 보상</h2>
            <p className="text-center text-[#5f6368] dark:text-[#9aa0a6] text-sm leading-relaxed">
              병원비, 약제비 영수증 기준.<br/>급여/비급여 본인부담금을 공제한<br/>예상 보험금 산출
            </p>
            <div className="mt-6 flex items-center gap-2 text-[var(--google-green)] font-bold text-sm bg-[#e6f4ea] dark:bg-[#1e8e3e]/10 px-4 py-2 rounded-full">
              계산하러 가기 <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </div>
          </Link>
        </div>
      </article>
    </>
  );
}
