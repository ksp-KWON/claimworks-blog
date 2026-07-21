import Link from 'next/link';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumBadge from '@/components/ui/PremiumBadge';

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
            <PremiumCard hoverEffect={true} borderColor={calc.color as any} className="flex flex-col sm:flex-row p-0 overflow-hidden">
              <div className="flex items-center justify-center p-5 sm:w-32 bg-slate-50 dark:bg-black/20 border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-700 transition-colors">
                <span className="text-4xl group-hover:scale-110 transition-transform duration-500 drop-shadow-sm">{calc.icon}</span>
              </div>
              <div className="flex-1 p-5 sm:p-6 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                  <PremiumBadge color={calc.color as any}>{calc.tag}</PremiumBadge>
                  <h2 className="text-lg sm:text-xl font-black text-[#202124] dark:text-[#e8eaed] transition-colors tracking-tight">
                    {calc.title}
                  </h2>
                </div>
                <p className="text-[#5f6368] dark:text-[#9aa0a6] text-xs leading-relaxed max-w-xl font-medium">
                  {calc.description}
                </p>
              </div>
            </PremiumCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
