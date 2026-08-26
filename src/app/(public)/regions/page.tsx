import Link from 'next/link';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumBadge from '@/components/ui/PremiumBadge';
import AppIcon from '@/components/ui/AppIcon';
import { REGIONS_DATA } from '@/lib/constants';

export const metadata = {
  title: '지역별 의료기관 네트워크 | 보상스쿨',
  description: '전국 17개 시/도, 226개 시/군/구별 보상 전문 의료기관 및 HIRA 건강보험심사평가원 연계 병원 정보를 제공합니다.',
  alternates: {
    canonical: 'https://claim-works.com/regions',
  },
};

export default function RegionsIndex() {
  return (
    <div className="w-full space-y-6">
      {/* 상단 브레드크럼 */}
      <nav className="flex text-xs text-[#5f6368] dark:text-[#9aa0a6]" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1.5">
          <li><Link href="/" className="hover:text-[var(--google-blue)] transition-colors">홈</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="text-[#202124] dark:text-[#e8eaed] font-medium" aria-current="page">지역별 의료기관</li>
        </ol>
      </nav>

      {/* 헤더 배너 (Teal 시그니처) */}
      <PremiumCard borderColor="teal" hoverEffect={true} watermarkIcon="compass" className="!p-6 sm:!p-8">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <PremiumBadge color="teal">HIRA 공공 빅데이터 연계</PremiumBadge>
            <PremiumBadge color="gray">전국 17개 시·도 226개 시·군·구</PremiumBadge>
          </div>
          <PremiumHeading 
            level={1} 
            gradient="teal" 
            showLeftBorder={false}
            icon={<AppIcon name="compass" size={24} className="text-teal-600 dark:text-teal-400 shrink-0" />}
            className="!mb-2 !text-2xl sm:!text-3xl"
          >
            지역별 의료기관 네트워크
          </PremiumHeading>
          <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] font-medium leading-relaxed break-keep">
            교통사고, 산업재해, 의료분쟁 등 전문 보상 처리에 필요한 전국 17개 시/도의 우수 병의원 및 협력 의료기관 정보를 실시간 매핑하여 안내합니다.
          </p>
        </div>
      </PremiumCard>

      {/* 전국 17개 시도 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 pt-2">
        {REGIONS_DATA.map((region) => (
          <Link 
            key={region.name} 
            href={`/regions/${encodeURIComponent(region.name)}`} 
            className="group outline-none block"
          >
            <PremiumCard hoverEffect={true} borderColor="teal" className="!p-5 h-full text-center">
              <div className="flex flex-col items-center justify-center w-full h-full">
                <div className="w-12 h-12 flex items-center justify-center text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/60 mb-3 shadow-xs group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300">
                  <AppIcon name="compass" size={20} />
                </div>
                <h2 className="text-sm sm:text-base font-extrabold text-[#202124] dark:text-[#e8eaed] group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors mb-1">
                  {region.name}
                </h2>
                <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] font-medium">
                  {region.districts.length}개 시·군·구
                </p>
              </div>
            </PremiumCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
