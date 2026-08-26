import Link from 'next/link';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumBadge from '@/components/ui/PremiumBadge';
import AppIcon, { AppIconName } from '@/components/ui/AppIcon';

export const metadata = {
  title: '보상금·합의금 스마트 계산기 센터 | 보상스쿨 전문 손해사정 그룹',
  description: '자동차보험 합의금, 실손의료비 보상금, 배상책임 소송가액까지! 손해사정 실무 알고리즘을 적용한 1분 예상 보상금 계산기입니다.',
  alternates: {
    canonical: 'https://claim-works.com/calculator',
  },
};

type CalculatorTheme = 'blue' | 'green' | 'red';

interface CalculatorItem {
  id: string;
  step: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  icon: AppIconName;
  href: string;
  color: CalculatorTheme;
  btnText: string;
}

const THEME_MAP: Record<CalculatorTheme, {
  headerGradient: string;
  headerBorder: string;
  badgeBorder: string;
  headerTitleColor: string;
  btnBg: string;
  iconBg: string;
  iconText: string;
  chevronHover: string;
}> = {
  blue: {
    headerGradient: 'from-blue-50 via-indigo-50/60 to-transparent dark:from-blue-950/50 dark:via-indigo-950/30 dark:to-transparent',
    headerBorder: 'border-blue-100 dark:border-blue-900/40',
    badgeBorder: 'text-blue-600 dark:text-blue-400 border-blue-200/80 dark:border-blue-800/80',
    headerTitleColor: 'text-blue-700 dark:text-blue-300',
    btnBg: 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20',
    iconBg: 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-900/50',
    iconText: 'text-blue-600 dark:text-blue-400',
    chevronHover: 'text-blue-600 dark:text-blue-400'
  },
  green: {
    headerGradient: 'from-emerald-50 via-teal-50/60 to-transparent dark:from-emerald-950/50 dark:via-teal-950/30 dark:to-transparent',
    headerBorder: 'border-emerald-100 dark:border-emerald-900/40',
    badgeBorder: 'text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/80',
    headerTitleColor: 'text-emerald-700 dark:text-emerald-300',
    btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20',
    iconBg: 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/50',
    iconText: 'text-emerald-600 dark:text-emerald-400',
    chevronHover: 'text-emerald-600 dark:text-emerald-400'
  },
  red: {
    headerGradient: 'from-rose-50 via-red-50/60 to-transparent dark:from-rose-950/50 dark:via-red-950/30 dark:to-transparent',
    headerBorder: 'border-rose-100 dark:border-rose-900/40',
    badgeBorder: 'text-rose-600 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/80',
    headerTitleColor: 'text-rose-700 dark:text-rose-300',
    btnBg: 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20',
    iconBg: 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-900/50',
    iconText: 'text-rose-600 dark:text-rose-400',
    chevronHover: 'text-rose-600 dark:text-rose-400'
  }
};

const CALCULATORS: CalculatorItem[] = [
  {
    id: 'auto',
    step: 'CALCULATOR 01',
    title: '자동차보험 합의금 계산기',
    subtitle: '교통사고 피해자 전용 (대인배상 약관 기준)',
    description: '부상 급수별 위자료, 입원 일수에 따른 휴업손해(85%), 통원 기타손해배상금, 후유장해 노동력 상실수익액 및 과실상계를 실시간 연산합니다.',
    features: ['1~14급 상해급수 자동 매핑', '도시일용임금 자동 적용', '대법원 호프만 계수 반영'],
    icon: 'car',
    href: '/calculator/auto',
    color: 'blue',
    btnText: '합의금 계산하기'
  },
  {
    id: 'medical',
    step: 'CALCULATOR 02',
    title: '실손의료비 보상 계산기',
    subtitle: '1세대 구실손부터 5세대 실손까지 전 세대 지원',
    description: '가입 시기별 세대 약관(1~5세대)을 자동 반영하여 입원 100% 보장부터 외래 통원 공제, 3대 비급여 특약(도수치료·비급여주사·MRI) 예상 지급액을 산출합니다.',
    features: ['1~5세대 세대별 공제율', '병원 규모별 차등 공제', '3대 비급여 특약 정밀 분리'],
    icon: 'hospital',
    href: '/calculator/medical',
    color: 'green',
    btnText: '실손의료비 계산하기'
  },
  {
    id: 'liability',
    step: 'CALCULATOR 03',
    title: '배상책임 소송가액 계산기',
    subtitle: '법원 손해배상 판례 기준 (호프만 법리 적용)',
    description: '일상생활배상책임, 건물·시설물 사고, 산재 초과손해 발생 시 법원 기준 위자료, 정년(65세)까지의 일실수입, 평생 개호비(간병비) 및 과실상계를 산출합니다.',
    features: ['대법원 위자료 산정식', '호프만 복리할인 수치 연산', '시중노임단가 및 개호비'],
    icon: 'scale',
    href: '/calculator/liability',
    color: 'red',
    btnText: '배상책임 손해액 계산하기'
  }
];

export default function CalculatorIndex() {
  return (
    <div className="w-full space-y-6">
      {/* 상단 브레드크럼 */}
      <nav className="flex text-xs text-[#5f6368] dark:text-[#9aa0a6]" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1.5">
          <li><Link href="/" className="hover:text-[var(--google-blue)] transition-colors">홈</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="text-[#202124] dark:text-[#e8eaed] font-medium" aria-current="page">스마트 보상금 계산기</li>
        </ol>
      </nav>

      {/* 1. 상단 메인 헤더 배너 */}
      <PremiumCard 
        borderColor="blue" 
        hoverEffect={false} 
        watermarkIcon="calculator" 
        className="!p-6 sm:!p-8 !bg-gradient-to-r !from-blue-50/90 !via-indigo-50/70 !to-blue-50/40 dark:!from-blue-950/50 dark:!via-indigo-950/40 dark:!to-blue-950/20 border-blue-200 dark:border-blue-900/60"
      >
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <PremiumBadge color="blue">국가공인 손해사정 실무 연산</PremiumBadge>
            <PremiumBadge color="gray">대법원 판례·약관 100% 반영</PremiumBadge>
          </div>
          <PremiumHeading 
            level={1} 
            gradient="blue" 
            showLeftBorder={false}
            icon={<AppIcon name="calculator" size={24} className="text-blue-600 dark:text-blue-400 shrink-0" />}
            className="!mb-2.5 !text-2xl sm:!text-3xl"
          >
            스마트 보상금·합의금 계산기 센터
          </PremiumHeading>
          <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] font-medium leading-relaxed break-keep">
            복잡한 보험 약관과 판례 산정식을 손해사정 실무 알고리즘으로 체계화했습니다.<br className="hidden sm:inline" />
            해당하는 사고 유형의 계산기를 선택하시면, <strong>예상 보상금과 세부 산출 명세서</strong>를 1분 만에 실시간으로 확인하실 수 있습니다.
          </p>
        </div>
      </PremiumCard>

      {/* 2. 3대 계산기 인터랙티브 액션 카드 */}
      <div className="space-y-4 pt-1">
        {CALCULATORS.map((calc) => {
          const theme = THEME_MAP[calc.color];
          return (
            <Link key={calc.id} href={calc.href} className="group block outline-none">
              <PremiumCard 
                borderColor={calc.color} 
                hoverEffect={true} 
                className="!p-5 sm:!p-6 space-y-4 overflow-hidden transition-all duration-200 group-hover:scale-[1.004]"
              >
                {/* 상단 풀블리드 테마 헤더 바 (시그니처 컬러 제목 + 깔끔한 Chevron) */}
                <div className={`-mx-5 -mt-5 sm:-mx-6 sm:-mt-6 px-5 py-3 sm:px-6 sm:py-3.5 mb-4 bg-gradient-to-r ${theme.headerGradient} border-b ${theme.headerBorder} flex items-center justify-between`}>
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[10px] font-mono font-bold bg-white dark:bg-zinc-800 px-2 py-0.5 border ${theme.badgeBorder}`}>
                      {calc.step}
                    </span>
                    <h2 className={`text-xs sm:text-[13.5px] font-extrabold ${theme.headerTitleColor}`}>
                      {calc.title}
                    </h2>
                  </div>
                  <div className={`flex items-center ${theme.chevronHover}`}>
                    <AppIcon name="chevron-right" size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 본문 콘텐츠 & 액션 영역 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div className="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
                    {/* 테마 아이콘 (완벽한 정사각형 프리미엄 W3C SVG 심볼 박스) */}
                    <div className={`w-20 h-20 sm:w-24 sm:h-24 aspect-square flex items-center justify-center border ${theme.iconBg} ${theme.iconText} shrink-0 transition-transform duration-200 group-hover:scale-105 shadow-xs`}>
                      <AppIcon name={calc.icon} size={34} className="sm:!w-10 sm:!h-10" />
                    </div>

                    {/* 텍스트 설명 */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div>
                        <p className="text-xs sm:text-[13.5px] font-extrabold text-gray-900 dark:text-white">
                          {calc.subtitle}
                        </p>
                      </div>

                      <p className="text-xs sm:text-[13px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed break-keep font-medium">
                        {calc.description}
                      </p>

                      {/* 핵심 기능 태그 칩 */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {calc.features.map((feat, idx) => (
                          <span 
                            key={idx} 
                            className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-800/80 text-[10.5px] sm:text-[11px] font-bold text-gray-600 dark:text-zinc-400 border border-gray-200/60 dark:border-zinc-700/60"
                          >
                            · {feat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 우측 액션 버튼 (각 테마별 시그니처 컬러 적용) */}
                  <div className="shrink-0 pt-2 sm:pt-0 sm:pl-4 border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-zinc-800 flex sm:flex-col items-center justify-end">
                    <div className={`w-full sm:w-auto px-4 py-2.5 ${theme.btnBg} font-extrabold text-xs sm:text-[12.5px] text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer`}>
                      <span>{calc.btnText}</span>
                      <AppIcon name="chevron-right" size={13} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </PremiumCard>
            </Link>
          );
        })}
      </div>

      {/* 3. 하단 안심 안내 배너 */}
      <div className="bg-amber-50 dark:bg-amber-950/30 p-4 sm:p-5 border border-amber-200/80 dark:border-amber-900/40 text-xs sm:text-[13px] leading-relaxed text-amber-900 dark:text-amber-300 flex items-start gap-3">
        <AppIcon name="shield-check" size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold mb-0.5">보상스쿨 계산기 이용 안내</p>
          <p className="opacity-90">모든 계산기는 <strong>별도의 회원가입이나 개인정보 입력 없이 100% 무료</strong>로 이용하실 수 있습니다. 산출된 결과는 PDF로 다운로드하거나 링크로 공유할 수 있으며, 정밀 검토가 필요한 경우 손해사정사 1:1 상담을 연결해 드립니다.</p>
        </div>
      </div>
    </div>
  );
}
