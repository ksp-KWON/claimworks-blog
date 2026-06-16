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

      <article className="w-full max-w-xl mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[#202124] dark:text-[#e8eaed] mb-2">보상금 계산기</h1>
          <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6]">원하시는 계산기를 선택해 주세요.</p>
        </header>

        <div className="space-y-4">
          {/* 🚗 자동차보험 합의금 계산기 */}
          <div className="bg-white dark:bg-[#202124] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(26,115,232,0.2)] hover:border-[var(--google-blue)] transition-all duration-300 group relative overflow-hidden">
            <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] mb-2 flex items-center gap-2 border-l-4 border-[var(--google-blue)] pl-2.5">
              <span className="text-[var(--google-blue)] text-lg leading-none">🚗</span>
              자동차보험 합의금 계산기
            </h3>
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mb-4 leading-relaxed">
              약관 지급기준 및 호프만계수를 적용한 정확한 예상 합의금을 확인하세요.
            </p>
            <Link href="/calculator/auto" className="flex items-center justify-center gap-2 w-full bg-[var(--google-blue)] text-white font-bold text-sm py-2.5 rounded-xl hover:bg-[#174ea6] transition-colors shadow-sm">
              자동차보험 계산하기
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </Link>
          </div>

          {/* 🏥 실손의료비 보상 계산기 */}
          <div className="bg-white dark:bg-[#202124] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(52,168,83,0.2)] hover:border-[var(--google-green)] transition-all duration-300 group relative overflow-hidden">
            <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] mb-2 flex items-center gap-2 border-l-4 border-[var(--google-green)] pl-2.5">
              <span className="text-[var(--google-green)] text-lg leading-none">🏥</span>
              실손의료비 계산기
            </h3>
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mb-4 leading-relaxed">
              급여/비급여 병원비, 본인부담금을 공제한 예상 실손 보상금을 산출해 보세요.
            </p>
            <Link href="/calculator/medical" className="flex items-center justify-center gap-2 w-full bg-[var(--google-green)] text-white font-bold text-sm py-2.5 rounded-xl hover:bg-[#0d652d] transition-colors shadow-sm">
              실손의료비 계산하기
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </Link>
          </div>

          {/* ⚖️ 배상책임 소송가액 계산기 */}
          <div className="bg-white dark:bg-[#202124] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(234,67,53,0.2)] hover:border-[var(--google-red)] transition-all duration-300 group relative overflow-hidden">
            <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] mb-2 flex items-center gap-2 border-l-4 border-[var(--google-red)] pl-2.5">
              <span className="text-[var(--google-red)] text-lg leading-none">⚖️</span>
              배상책임 소송가액 계산기
            </h3>
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mb-4 leading-relaxed">
              호프만계수를 적용하여 법원 판례 기준에 따른 예상 손해배상액을 산출합니다.
            </p>
            <Link href="/calculator/liability" className="flex items-center justify-center gap-2 w-full bg-[var(--google-red)] text-white font-bold text-sm py-2.5 rounded-xl hover:bg-[#d93025] transition-colors shadow-sm">
              소송가액 계산하기
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
