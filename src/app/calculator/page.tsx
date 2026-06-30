import Link from 'next/link';

export const metadata = {
  title: '보상금 계산기 - 보상스쿨',
  description: '자동차보험 합의금, 실손의료비 보상, 배상책임 소송가액 등 예상 보상금을 산출해보세요.',
};

export default function CalculatorIndex() {
  return (
    <>
      <div className="space-y-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="bg-white dark:bg-[#202124] rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:border-[var(--google-blue)] hover:shadow-[0_16px_50px_rgba(26,115,232,0.2)] transition-all duration-300 overflow-hidden">
          
          {/* 🧮 상단 정보성 띠 배너 (패밀리룩) */}
          <div className="bg-[var(--google-blue)] text-white px-5 py-3 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-lg shrink-0">🧮</span>
              <div className="text-xs sm:text-sm font-extrabold tracking-tight">
                <span className="underline decoration-wavy mr-1.5">[스마트 통합 계산]</span>
                약관 지급기준 및 법원 판례 알고리즘을 적용한 정확한 예상 보상금을 확인하세요.
              </div>
            </div>
            <div className="text-[10px] font-black uppercase tracking-wider bg-white text-[var(--google-blue)] px-2.5 py-1 rounded-none border border-white opacity-90">
              최신 약관 반영
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-10">
            {/* 헤더 타이틀 */}
            <div className="text-center space-y-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202124] dark:text-[#e8eaed] tracking-tight">
                보상스쿨 <span className="bg-gradient-to-r from-[var(--google-blue)] to-[#174ea6] bg-clip-text text-transparent">스마트 보상금 계산기</span>
              </h1>
              <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-lg mx-auto leading-relaxed font-medium">
                복잡한 계산식과 수많은 예외 규정을 AI 기반 알고리즘으로 단순화했습니다. 원하시는 계산기를 선택하여 나에게 맞는 보상금 규모를 미리 파악해 보세요.
              </p>
            </div>

            {/* 계산기 리스트 (세로 배열의 콤팩트한 리스트 뷰) */}
            <div className="space-y-4">
              {/* 자동차보험 합의금 계산기 */}
              <Link 
                href="/calculator/auto" 
                className="group flex flex-col sm:flex-row bg-white dark:bg-[#303134] rounded-none border border-gray-200 dark:border-gray-700 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_30px_rgba(26,115,232,0.12)] hover:border-[var(--google-blue)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center justify-center p-5 sm:w-32 bg-slate-50 dark:bg-black/20 border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-700 transition-colors group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20">
                  <span className="text-4xl group-hover:scale-110 transition-transform duration-500 drop-shadow-sm">🚗</span>
                </div>
                <div className="flex-1 p-5 sm:p-6 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-0.5 text-[9px] font-black text-white bg-[var(--google-blue)] tracking-wider">AUTO</span>
                    <h2 className="text-lg sm:text-xl font-black text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-blue)] transition-colors tracking-tight">
                      자동차보험 합의금
                    </h2>
                  </div>
                  <p className="text-[#5f6368] dark:text-[#9aa0a6] text-xs leading-relaxed max-w-xl font-medium">
                    교통사고 피해자 전용. 부상, 후유장해, 사망에 따른 대인배상 약관 지급기준 및 호프만계수를 엄격하게 적용하여 산출합니다.
                  </p>
                </div>
                <div className="hidden sm:flex items-center justify-center p-5">
                  <div className="w-8 h-8 flex items-center justify-center text-gray-300 dark:text-gray-600 group-hover:text-[var(--google-blue)] group-hover:translate-x-1.5 transition-all duration-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="square" strokeLinejoin="miter" d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </div>
                </div>
              </Link>

              {/* 실손의료비 보상 계산기 */}
              <Link 
                href="/calculator/medical" 
                className="group flex flex-col sm:flex-row bg-white dark:bg-[#303134] rounded-none border border-gray-200 dark:border-gray-700 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_30px_rgba(52,168,83,0.12)] hover:border-[var(--google-green)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center justify-center p-5 sm:w-32 bg-slate-50 dark:bg-black/20 border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-700 transition-colors group-hover:bg-green-50 dark:group-hover:bg-green-900/20">
                  <span className="text-4xl group-hover:scale-110 transition-transform duration-500 drop-shadow-sm">🏥</span>
                </div>
                <div className="flex-1 p-5 sm:p-6 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-0.5 text-[9px] font-black text-white bg-[var(--google-green)] tracking-wider">MEDICAL</span>
                    <h2 className="text-lg sm:text-xl font-black text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-green)] transition-colors tracking-tight">
                      실손의료비 보상
                    </h2>
                  </div>
                  <p className="text-[#5f6368] dark:text-[#9aa0a6] text-xs leading-relaxed max-w-xl font-medium">
                    가입 시기별 복잡한 약관을 자동 반영합니다. 급여 및 비급여 병원비에서 정확한 본인부담금을 공제한 실손 보험금을 확인하세요.
                  </p>
                </div>
                <div className="hidden sm:flex items-center justify-center p-5">
                  <div className="w-8 h-8 flex items-center justify-center text-gray-300 dark:text-gray-600 group-hover:text-[var(--google-green)] group-hover:translate-x-1.5 transition-all duration-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="square" strokeLinejoin="miter" d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </div>
                </div>
              </Link>

              {/* 배상책임 소송가액 계산기 */}
              <Link 
                href="/calculator/liability" 
                className="group flex flex-col sm:flex-row bg-white dark:bg-[#303134] rounded-none border border-gray-200 dark:border-gray-700 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_30px_rgba(234,67,53,0.12)] hover:border-[var(--google-red)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-center justify-center p-5 sm:w-32 bg-slate-50 dark:bg-black/20 border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-700 transition-colors group-hover:bg-red-50 dark:group-hover:bg-red-900/20">
                  <span className="text-4xl group-hover:scale-110 transition-transform duration-500 drop-shadow-sm">⚖️</span>
                </div>
                <div className="flex-1 p-5 sm:p-6 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-0.5 text-[9px] font-black text-white bg-[var(--google-red)] tracking-wider">LIABILITY</span>
                    <h2 className="text-lg sm:text-xl font-black text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-red)] transition-colors tracking-tight">
                      배상책임 소송가액
                    </h2>
                  </div>
                  <p className="text-[#5f6368] dark:text-[#9aa0a6] text-xs leading-relaxed max-w-xl font-medium">
                    산재 초과손해, 배상책임 사고(시설물, 낙상 등) 시 법원 신체감정 및 위자료 산정 기준을 적용한 소송 예상액을 계산합니다.
                  </p>
                </div>
                <div className="hidden sm:flex items-center justify-center p-5">
                  <div className="w-8 h-8 flex items-center justify-center text-gray-300 dark:text-gray-600 group-hover:text-[var(--google-red)] group-hover:translate-x-1.5 transition-all duration-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="square" strokeLinejoin="miter" d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </div>
                </div>
              </Link>
              
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
