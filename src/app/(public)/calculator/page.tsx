import Link from 'next/link';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumBadge from '@/components/ui/PremiumBadge';
import AppIcon from '@/components/ui/AppIcon';

export const metadata = {
  title: '보상금·합의금 스마트 계산기 | 보상스쿨 전문 손해사정 그룹',
  description: '자동차보험 합의금, 실손의료비 보상금, 배상책임 소송가액까지! 손해사정 실무 알고리즘을 적용한 1분 예상 보상금 계산기입니다.',
  alternates: {
    canonical: 'https://claim-works.com/calculator',
  },
};

const CALCULATORS = [
  {
    id: 'auto',
    title: '자동차보험 합의금 계산기',
    tag: 'AUTO',
    description: '교통사고 피해자 전용. 부상, 후유장해, 사망에 따른 대인배상 약관 지급기준 및 대법원 호프만계수를 엄격하게 적용하여 산출합니다.',
    icon: 'car' as const,
    href: '/calculator/auto',
    color: 'blue' as const,
    badgeText: '약관·호프만계수 적용'
  },
  {
    id: 'medical',
    title: '실손의료비 보상 계산기',
    tag: 'MEDICAL',
    description: '1세대부터 5세대까지 세대별 약관을 자동 반영합니다. 급여/비급여 병원비에서 정확한 본인부담금을 공제한 예상 실손금을 확인하세요.',
    icon: 'hospital' as const,
    href: '/calculator/medical',
    color: 'green' as const,
    badgeText: '1~5세대 전 세대 완벽 지원'
  },
  {
    id: 'liability',
    title: '배상책임 소송가액 계산기',
    tag: 'LIABILITY',
    description: '일상생활배상책임, 시설물 사고, 산재 초과손해 시 법원 판례 기준의 위자료, 일실수입, 개호비를 적용한 예상 손해배상액을 산출합니다.',
    icon: 'scale' as const,
    href: '/calculator/liability',
    color: 'red' as const,
    badgeText: '법원 판례 기준 산정'
  }
];

export default function CalculatorIndex() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* 상단 브레드크럼 */}
      <nav className="flex text-xs text-[#5f6368] dark:text-[#9aa0a6]" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1.5">
          <li><Link href="/" className="hover:text-[var(--google-blue)] transition-colors">홈</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="text-[#202124] dark:text-[#e8eaed] font-medium" aria-current="page">보상금 계산기</li>
        </ol>
      </nav>

      {/* 헤더 배너 */}
      <PremiumCard borderColor="blue" hoverEffect={false} watermarkIcon="calculator" className="!p-6 sm:!p-8">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <PremiumBadge color="blue">빅데이터 실무 알고리즘</PremiumBadge>
            <PremiumBadge color="gray">1분 자가진단</PremiumBadge>
          </div>
          <PremiumHeading 
            level={1} 
            gradient="blue" 
            showLeftBorder={false}
            icon={<AppIcon name="calculator" size={24} className="text-blue-600 dark:text-blue-400 shrink-0" />}
            className="!mb-2 !text-xl sm:!text-2xl"
          >
            스마트 보상금·합의금 계산기
          </PremiumHeading>
          <p className="text-xs sm:text-[13.5px] text-[#5f6368] dark:text-[#9aa0a6] font-medium leading-relaxed break-keep">
            복잡한 보험 약관과 수많은 예외 규정을 손해사정 실무 알고리즘으로 단순화했습니다. 원하시는 계산기를 선택하여 예상 보상금을 미리 산출해 보세요.
          </p>
        </div>
      </PremiumCard>

      {/* 3대 계산기 선택 카드 목록 */}
      <div className="space-y-3.5 pt-2">
        {CALCULATORS.map((calc) => (
          <Link key={calc.id} href={calc.href} className="group block outline-none">
            <PremiumCard hoverEffect={true} borderColor={calc.color} className="!p-5 sm:!p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className={`p-3 rounded-none bg-${calc.color}-50 dark:bg-${calc.color}-950/40 text-${calc.color}-600 dark:text-${calc.color}-400 shrink-0 mt-0.5`}>
                    <AppIcon name={calc.icon} size={24} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {calc.title}
                      </h2>
                    </div>
                    <p className="text-xs sm:text-[13px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed break-keep font-medium">
                      {calc.description}
                    </p>
                    <div className="pt-1">
                      <PremiumBadge color={calc.color}>{calc.badgeText}</PremiumBadge>
                    </div>
                  </div>
                </div>
                <div className="hidden sm:flex items-center text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all shrink-0 self-center">
                  <AppIcon name="chevron-right" size={20} />
                </div>
              </div>
            </PremiumCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
