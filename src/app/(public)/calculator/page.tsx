import Link from 'next/link';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumBadge from '@/components/ui/PremiumBadge';

export const metadata = {
  title: '교통사고 합의금 · 실손 · 배상책임 통합 계산기 | 보상스쿨',
  description: '복잡한 자동차사고 합의금부터 실손의료비, 배상책임 소송가액까지! 손해사정 실무 알고리즘을 적용한 1분 예상 보상금 계산기입니다.',
  alternates: {
    canonical: 'https://claim-works.com/calculator',
  },
  openGraph: {
    title: '교통사고 합의금 · 실손 · 배상책임 통합 계산기 | 보상스쿨',
    description: '복잡한 자동차사고 합의금부터 실손의료비, 배상책임 소송가액까지! 손해사정 실무 알고리즘을 적용한 1분 예상 보상금 계산기입니다.',
    url: 'https://claim-works.com/calculator',
    siteName: '보상스쿨 전문 손해사정 그룹',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: 'https://claim-works.com/og-image.png',
        width: 1200,
        height: 630,
        alt: '보상스쿨 통합 계산기',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '교통사고 합의금 · 실손 · 배상책임 통합 계산기 | 보상스쿨',
    description: '복잡한 자동차사고 합의금부터 실손의료비, 배상책임 소송가액까지! 손해사정 실무 알고리즘 적용 1분 계산기',
    images: ['https://claim-works.com/og-image.png'],
  },
};

const CALCULATORS = [
  {
    id: 'auto',
    title: '자동차보험 합의금',
    tag: 'AUTO',
    description: '교통사고 피해자 전용. 부상, 후유장해, 사망에 따른 대인배상 약관 지급기준 및 호프만계수를 엄격하게 적용하여 산출합니다.',
    icon: '🚗',
    href: '/calculator/auto',
    color: 'blue'
  },
  {
    id: 'medical',
    title: '실손의료비 보상',
    tag: 'MEDICAL',
    description: '가입 시기별 복잡한 약관을 자동 반영합니다. 급여 및 비급여 병원비에서 정확한 본인부담금을 공제한 실손 보험금을 확인하세요.',
    icon: '🏥',
    href: '/calculator/medical',
    color: 'green'
  },
  {
    id: 'liability',
    title: '배상책임 소송가액',
    tag: 'LIABILITY',
    description: '산재 초과손해, 배상책임 사고(시설물, 낙상 등) 시 법원 신체감정 및 위자료 산정 기준을 적용한 소송 예상액을 계산합니다.',
    icon: '⚖️',
    href: '/calculator/liability',
    color: 'red'
  }
];

export default function CalculatorIndex() {
  return (
    <div className="space-y-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 🧮 스마트 보상금 계산기 상단 띠 배너 */}
      <div className="bg-[var(--google-blue)] text-white px-5 py-3 flex items-center justify-between flex-nowrap gap-3 rounded-t-none">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="text-lg shrink-0">🧮</span>
          <div className="text-xs sm:text-sm font-extrabold tracking-tight truncate">
            <span className="underline decoration-wavy mr-1.5">[통합 계산]</span>
            보상스쿨 빅데이터 알고리즘으로 예상 보상금을 미리 산출해보세요.
          </div>
        </div>
      </div>

      <div className="text-center space-y-4">
        <PremiumHeading level={1} gradient="blue" className="justify-center !text-3xl">
          스마트 보상금 계산기
        </PremiumHeading>
        <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-xl mx-auto leading-relaxed font-medium">
          복잡한 계산식과 수많은 예외 규정을 보상스쿨 빅데이터 알고리즘으로 단순화했습니다. 원하시는 계산기를 선택하여 나에게 맞는 보상금 규모를 미리 파악해 보세요.
        </p>
      </div>

      <div className="space-y-4">
        {CALCULATORS.map((calc) => (
          <Link key={calc.id} href={calc.href} className="group block outline-none">
            <PremiumCard hoverEffect={true} borderColor={calc.color as any} className="p-0 overflow-hidden h-full">
              <div className="flex flex-row items-stretch w-full h-full">
                <div className="flex items-center justify-center p-4 sm:p-5 w-24 sm:w-32 bg-slate-50 dark:bg-black/20 border-r border-gray-100 dark:border-gray-700 transition-colors shrink-0">
                  <span className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform duration-500 drop-shadow-sm">{calc.icon}</span>
                </div>
                <div className="flex-1 p-4 sm:p-6 flex flex-col justify-center min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <PremiumBadge color={calc.color as any}>{calc.tag}</PremiumBadge>
                    <h2 className="text-base sm:text-xl font-black text-[#202124] dark:text-[#e8eaed] transition-colors tracking-tight truncate">
                      {calc.title}
                    </h2>
                  </div>
                  <p className="text-[#5f6368] dark:text-[#9aa0a6] text-[11px] sm:text-xs leading-relaxed max-w-xl font-medium break-keep">
                    {calc.description}
                  </p>
                </div>
              </div>
            </PremiumCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
