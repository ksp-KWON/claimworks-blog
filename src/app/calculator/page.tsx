import Link from 'next/link';

export const metadata = {
  title: '보상금 계산기 - 보상스쿨',
  description: '자동차보험 합의금, 실손의료비 보상, 배상책임 소송가액 등 예상 보상금을 산출해보세요.',
};

const CALCULATORS = [
  {
    id: 'auto',
    title: '자동차보험 합의금',
    tag: 'AUTO',
    description: '교통사고 피해자 전용. 부상, 후유장해, 사망에 따른 대인배상 약관 지급기준 및 호프만계수를 엄격하게 적용하여 산출합니다.',
    icon: '🚗',
    href: '/calculator/auto',
    cardBorderHover: 'hover:border-[var(--google-blue)]',
    cardShadowHover: 'hover:shadow-[0_12px_30px_rgba(26,115,232,0.12)]',
    iconBgHover: 'group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20',
    tagBg: 'bg-[var(--google-blue)]',
    textHover: 'group-hover:text-[var(--google-blue)]'
  },
  {
    id: 'medical',
    title: '실손의료비 보상',
    tag: 'MEDICAL',
    description: '가입 시기별 복잡한 약관을 자동 반영합니다. 급여 및 비급여 병원비에서 정확한 본인부담금을 공제한 실손 보험금을 확인하세요.',
    icon: '🏥',
    href: '/calculator/medical',
    cardBorderHover: 'hover:border-[var(--google-green)]',
    cardShadowHover: 'hover:shadow-[0_12px_30px_rgba(52,168,83,0.12)]',
    iconBgHover: 'group-hover:bg-green-50 dark:group-hover:bg-green-900/20',
    tagBg: 'bg-[var(--google-green)]',
    textHover: 'group-hover:text-[var(--google-green)]'
  },
  {
    id: 'liability',
    title: '배상책임 소송가액',
    tag: 'LIABILITY',
    description: '산재 초과손해, 배상책임 사고(시설물, 낙상 등) 시 법원 신체감정 및 위자료 산정 기준을 적용한 소송 예상액을 계산합니다.',
    icon: '⚖️',
    href: '/calculator/liability',
    cardBorderHover: 'hover:border-[var(--google-red)]',
    cardShadowHover: 'hover:shadow-[0_12px_30px_rgba(234,67,53,0.12)]',
    iconBgHover: 'group-hover:bg-red-50 dark:group-hover:bg-red-900/20',
    tagBg: 'bg-[var(--google-red)]',
    textHover: 'group-hover:text-[var(--google-red)]'
  }
];

export default function CalculatorIndex() {
  return (
    <>
      <div className="space-y-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="bg-white dark:bg-[#202124] rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] transition-all duration-300 overflow-hidden">
          
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

            {/* 계산기 리스트 (DRY 통합) */}
            <div className="space-y-4">
              {CALCULATORS.map((calc) => (
                <Link 
                  key={calc.id}
                  href={calc.href} 
                  className={`group flex flex-col sm:flex-row bg-white dark:bg-[#303134] rounded-none border border-gray-200 dark:border-gray-700 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 ${calc.cardShadowHover} ${calc.cardBorderHover}`}
                >
                  <div className={`flex items-center justify-center p-5 sm:w-32 bg-slate-50 dark:bg-black/20 border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-700 transition-colors ${calc.iconBgHover}`}>
                    <span className="text-4xl group-hover:scale-110 transition-transform duration-500 drop-shadow-sm">{calc.icon}</span>
                  </div>
                  <div className="flex-1 p-5 sm:p-6 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-0.5 text-[9px] font-black text-white ${calc.tagBg} tracking-wider`}>
                        {calc.tag}
                      </span>
                      <h2 className={`text-lg sm:text-xl font-black text-[#202124] dark:text-[#e8eaed] transition-colors tracking-tight ${calc.textHover}`}>
                        {calc.title}
                      </h2>
                    </div>
                    <p className="text-[#5f6368] dark:text-[#9aa0a6] text-xs leading-relaxed max-w-xl font-medium">
                      {calc.description}
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center justify-center p-5">
                    <div className={`w-8 h-8 flex items-center justify-center text-gray-300 dark:text-gray-600 group-hover:translate-x-1.5 transition-all duration-300 ${calc.textHover}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="square" strokeLinejoin="miter" d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
