import Link from 'next/link';

export const metadata = {
  title: '보상금 계산기 - 보상스쿨',
  description: '자동차보험 합의금, 실손의료비 보상, 배상책임 소송가액 등 예상 보상금을 산출해보세요.',
};

export default function CalculatorIndex() {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-12 lg:py-20 relative">
      {/* 장식용 배경 요소 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-[var(--google-blue)]/5 via-[var(--google-blue)]/5 to-transparent rounded-full blur-3xl -z-10 pointer-events-none opacity-50 dark:opacity-20" />
      
      <header className="mb-16 text-center animate-in slide-in-from-bottom-8 duration-700 fade-in">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white dark:bg-[#303134] border border-gray-100 dark:border-white/10 shadow-sm mb-6">
          <svg className="w-8 h-8 text-[var(--google-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
            <line x1="8" y1="6" x2="16" y2="6"></line>
            <line x1="8" y1="10" x2="8.01" y2="10"></line>
            <line x1="12" y1="10" x2="12.01" y2="10"></line>
            <line x1="16" y1="10" x2="16.01" y2="10"></line>
            <line x1="8" y1="14" x2="8.01" y2="14"></line>
            <line x1="12" y1="14" x2="12.01" y2="14"></line>
            <line x1="16" y1="14" x2="16.01" y2="14"></line>
            <line x1="8" y1="18" x2="8.01" y2="18"></line>
            <line x1="12" y1="18" x2="12.01" y2="18"></line>
            <line x1="16" y1="18" x2="16.01" y2="18"></line>
          </svg>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#202124] dark:text-[#e8eaed] tracking-tight mb-5">
          스마트 보상금 계산기
        </h1>
        <p className="text-base sm:text-lg text-[#5f6368] dark:text-[#9aa0a6] max-w-2xl mx-auto leading-relaxed">
          약관 및 판례 기준을 적용한 알고리즘으로 정확하고 신뢰할 수 있는 예상 보상금을 확인하세요.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative z-10">
        
        {/* 자동차보험 합의금 계산기 */}
        <Link 
          href="/calculator/auto" 
          className="group flex flex-col bg-white dark:bg-[#202124] rounded-3xl p-8 border border-gray-100 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(26,115,232,0.1)] hover:-translate-y-2 transition-all duration-500 overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#e8f0fe] to-transparent dark:from-[#8ab4f8]/10 dark:to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
          
          <div className="w-16 h-16 bg-[#e8f0fe] dark:bg-[#8ab4f8]/20 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner group-hover:rotate-12 transition-transform duration-500">
            🚗
          </div>
          
          <h2 className="text-2xl font-bold text-[#202124] dark:text-[#e8eaed] mb-3 group-hover:text-[var(--google-blue)] transition-colors">
            자동차보험 합의금
          </h2>
          <p className="text-[#5f6368] dark:text-[#9aa0a6] text-sm leading-relaxed mb-8 flex-1">
            교통사고 피해자 전용. 부상, 후유장해, 사망에 따른 대인배상 약관 지급기준 및 호프만계수를 적용하여 합의금을 산출합니다.
          </p>
          
          <div className="flex items-center text-[var(--google-blue)] font-bold text-sm bg-[#e8f0fe] dark:bg-[#8ab4f8]/10 px-5 py-3 rounded-xl w-fit group-hover:bg-[var(--google-blue)] group-hover:text-white transition-colors">
            계산 시작하기 
            <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </div>
        </Link>

        {/* 실손의료비 보상 계산기 */}
        <Link 
          href="/calculator/medical" 
          className="group flex flex-col bg-white dark:bg-[#202124] rounded-3xl p-8 border border-gray-100 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(52,168,83,0.1)] hover:-translate-y-2 transition-all duration-500 overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#e6f4ea] to-transparent dark:from-[#1e8e3e]/10 dark:to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
          
          <div className="w-16 h-16 bg-[#e6f4ea] dark:bg-[#1e8e3e]/20 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner group-hover:rotate-12 transition-transform duration-500">
            🏥
          </div>
          
          <h2 className="text-2xl font-bold text-[#202124] dark:text-[#e8eaed] mb-3 group-hover:text-[var(--google-green)] transition-colors">
            실손의료비 보상
          </h2>
          <p className="text-[#5f6368] dark:text-[#9aa0a6] text-sm leading-relaxed mb-8 flex-1">
            가입 시기별 약관을 반영하여, 급여 및 비급여 병원비에서 본인부담금을 공제한 예상 실손 보험금을 정확하게 산출합니다.
          </p>
          
          <div className="flex items-center text-[var(--google-green)] font-bold text-sm bg-[#e6f4ea] dark:bg-[#1e8e3e]/10 px-5 py-3 rounded-xl w-fit group-hover:bg-[var(--google-green)] group-hover:text-white transition-colors">
            계산 시작하기 
            <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </div>
        </Link>

        {/* 배상책임 소송가액 계산기 */}
        <Link 
          href="/calculator/liability" 
          className="group flex flex-col bg-white dark:bg-[#202124] rounded-3xl p-8 border border-gray-100 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(234,67,53,0.1)] hover:-translate-y-2 transition-all duration-500 overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#fce8e6] to-transparent dark:from-[#d93025]/10 dark:to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
          
          <div className="w-16 h-16 bg-[#fce8e6] dark:bg-[#d93025]/20 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner group-hover:rotate-12 transition-transform duration-500">
            ⚖️
          </div>
          
          <h2 className="text-2xl font-bold text-[#202124] dark:text-[#e8eaed] mb-3 group-hover:text-[var(--google-red)] transition-colors">
            배상책임 소송가액
          </h2>
          <p className="text-[#5f6368] dark:text-[#9aa0a6] text-sm leading-relaxed mb-8 flex-1">
            법원 판례 기준을 엄격히 적용. 위자료, 일실수입, 향후치료비 등 각종 손해배상액의 객관적인 예상 소송가액을 산출합니다.
          </p>
          
          <div className="flex items-center text-[var(--google-red)] font-bold text-sm bg-[#fce8e6] dark:bg-[#d93025]/10 px-5 py-3 rounded-xl w-fit group-hover:bg-[var(--google-red)] group-hover:text-white transition-colors">
            계산 시작하기 
            <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </div>
        </Link>
        
      </div>
    </div>
  );
}
