import Link from 'next/link';
import type { Metadata } from 'next';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumCard from '@/components/ui/PremiumCard';
import { CATEGORY_ICONS, IconBooks, IconStethoscope } from '@/components/ui/CategoryIcons';

export const metadata: Metadata = {
  title: '분야별 전문 보상가이드 - 보상스쿨',
  description: '사망/자살 보험금, 질병진단, 실손, 교통사고, 배상책임 등 보상스쿨 전문가 그룹의 핵심 실무 노하우를 제공합니다.',
  alternates: {
    canonical: 'https://claim-works.com/categories',
  },
};

import { COLUMN_CATEGORIES, SPECIALTIES } from '@/lib/constants/categories';

export default function CategoriesIndex() {
  return (
    <div className="space-y-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* 전문 보상가이드 상단 띠 배너 */}
      <div className="bg-[var(--google-yellow)] text-white px-5 py-3 flex items-center justify-between flex-nowrap gap-3 rounded-t-none">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="shrink-0 flex items-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          <div className="text-xs sm:text-sm font-extrabold tracking-tight truncate">
            <span className="underline decoration-wavy mr-1.5">[핵심 실무]</span>
            보상스쿨 손해사정사의 분야별 전문 칼럼과 분쟁 가이드를 확인하세요.
          </div>
        </div>
      </div>

      {/* 헤더 영역 */}
      <div className="text-center space-y-4">
        <PremiumHeading level={1} gradient="yellow" className="justify-center !text-3xl">
          분야별 전문 보상 가이드
        </PremiumHeading>
        <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-xl mx-auto leading-relaxed font-medium">
          보상스쿨 손해사정사의 풍부한 실무 경험이 담긴 전문 칼럼과, 진료과목별로 자주 발생하는 의료분쟁 해결책을 상세히 제공합니다.
        </p>
      </div>

      {/* 분야별 보상 칼럼 섹션 */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b-2 border-gray-100 dark:border-white/5">
          <span className="text-[var(--google-yellow)] flex items-center"><IconBooks /></span>
          <h2 className="text-lg font-bold text-[#202124] dark:text-[#e8eaed]">분야별 보상 칼럼</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {COLUMN_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.slug];
            return (
              <Link key={cat.slug} href={`/categories/${cat.slug}`} className="group outline-none block">
                <PremiumCard hoverEffect={true} borderColor="yellow" className="p-4 h-full">
                  <div className="flex flex-row items-center w-full h-full">
                    <div className={`w-12 h-12 flex items-center justify-center text-white ${cat.color} rounded-sm shadow-inner shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                      {Icon ? <Icon /> : null}
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-yellow)] transition-colors mb-1 truncate">
                        {cat.name}
                      </h3>
                      <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] leading-snug break-keep">
                        {cat.desc}
                      </p>
                    </div>
                  </div>
                </PremiumCard>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 진료과목별 분쟁 가이드 섹션 */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b-2 border-gray-100 dark:border-white/5">
          <span className="text-[var(--google-blue)] flex items-center"><IconStethoscope /></span>
          <h2 className="text-lg font-bold text-[#202124] dark:text-[#e8eaed]">진료과목별 분쟁 가이드</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SPECIALTIES.map((spec) => {
            const Icon = CATEGORY_ICONS[spec.slug];
            return (
              <Link key={spec.slug} href={`/categories/${spec.slug}`} className="group outline-none block">
                <PremiumCard hoverEffect={true} borderColor="blue" className="p-4 h-full">
                  <div className="flex flex-row items-center w-full h-full">
                    <div className={`w-12 h-12 flex items-center justify-center text-white ${spec.color} rounded-sm shadow-inner shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                      {Icon ? <Icon /> : null}
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-blue)] transition-colors mb-1 truncate">
                        {spec.name}
                      </h3>
                      <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] leading-snug break-keep">
                        {spec.desc}
                      </p>
                    </div>
                  </div>
                </PremiumCard>
              </Link>
            );
          })}
        </div>
      </section>

    </div>
  );
}
