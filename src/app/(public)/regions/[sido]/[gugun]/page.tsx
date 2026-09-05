import { REGIONS_DATA } from '@/lib/constants';
import { Suspense } from 'react';
import HospitalDataClient from './HospitalDataClient';
import { getJurisdiction, JurisdictionInfo } from '@/lib/jurisdiction-data';
import AppIcon from '@/components/ui/AppIcon';
import PremiumBadge from '@/components/ui/PremiumBadge';

export async function generateStaticParams() {
  const params: { sido: string; gugun: string }[] = [];
  
  for (const region of REGIONS_DATA) {
    for (const district of region.districts) {
      params.push({ 
        sido: region.name, 
        gugun: district 
      });
    }
  }
  
  return params;
}

export async function generateMetadata({ params }: { params: Promise<{ sido: string; gugun: string }> }) {
  const { sido, gugun } = await params;
  const decodedSido = decodeURIComponent(sido);
  const decodedGugun = decodeURIComponent(gugun);
  const jurisdiction = getJurisdiction(decodedSido, decodedGugun);
  const courtName = jurisdiction ? jurisdiction.court : `${decodedSido} 관할 법원`;
  
  return {
    title: `${decodedSido} ${decodedGugun} 의료기관 및 관할 법원·검찰청 안내 | 보상스쿨`,
    description: `${decodedSido} ${decodedGugun} 관내 의료기관 현황 및 ${courtName} 사법 관할 구역 안내 정보입니다.`,
    alternates: {
      canonical: `https://claim-works.com/regions/${encodeURIComponent(decodedSido)}/${encodeURIComponent(decodedGugun)}`,
    },
  };
}

export default async function GugunPage({ params }: { params: Promise<{ sido: string; gugun: string }> }) {
  const { sido, gugun } = await params;
  const decodedSido = decodeURIComponent(sido);
  const decodedGugun = decodeURIComponent(gugun);

  const jurisdiction: JurisdictionInfo = getJurisdiction(decodedSido, decodedGugun) || {
    court: `${decodedSido} 관할 지방법원`,
    prosecution: `${decodedSido} 관할 지방검찰청`,
    highCourt: '관할 고등법원',
    courtType: '본원',
  };

  return (
    <div className="w-full space-y-8 pb-12">
      {/* 1. 상단 타이틀 & 뱃지 헤더 */}
      <header className="space-y-3 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <PremiumBadge color="gray">
            {decodedSido} · {decodedGugun}
          </PremiumBadge>
          <PremiumBadge color="teal">
            사법 및 의료기관 네트워크
          </PremiumBadge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-zinc-50">
          {decodedSido} {decodedGugun} 의료기관 및 관할 사법기관 안내
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-zinc-400">
          {decodedSido} {decodedGugun} 관내 의료기관 인프라 현황과 {jurisdiction.court} 관할 사법 구역 안내 정보입니다.
        </p>
      </header>

      {/* 2. 관할 사법기관 & 소송/조정 관할 안내 카드 */}
      <section className="border border-gray-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 rounded-none space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-200/80 dark:border-zinc-800 pb-3">
          <AppIcon name="scale" size={20} className="text-gray-700 dark:text-zinc-300" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-zinc-50">
            {decodedGugun} 관할 사법기관 및 분쟁 관할
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="border border-gray-100 dark:border-zinc-800/80 bg-gray-50/70 dark:bg-zinc-800/40 p-3.5 rounded-none">
            <span className="text-xs text-gray-500 dark:text-zinc-400 block font-medium">관할 지방법원</span>
            <strong className="text-sm text-gray-900 dark:text-zinc-100 font-semibold">{jurisdiction.court}</strong>
            <span className="text-xs text-blue-600 dark:text-blue-400 block mt-0.5">({jurisdiction.courtType})</span>
          </div>
          <div className="border border-gray-100 dark:border-zinc-800/80 bg-gray-50/70 dark:bg-zinc-800/40 p-3.5 rounded-none">
            <span className="text-xs text-gray-500 dark:text-zinc-400 block font-medium">관할 지방검찰청</span>
            <strong className="text-sm text-gray-900 dark:text-zinc-100 font-semibold">{jurisdiction.prosecution}</strong>
            <span className="text-xs text-gray-500 dark:text-zinc-400 block mt-0.5">형사사건 수사</span>
          </div>
          <div className="border border-gray-100 dark:border-zinc-800/80 bg-gray-50/70 dark:bg-zinc-800/40 p-3.5 rounded-none">
            <span className="text-xs text-gray-500 dark:text-zinc-400 block font-medium">상소심 (항소법원)</span>
            <strong className="text-sm text-gray-900 dark:text-zinc-100 font-semibold">{jurisdiction.highCourt}</strong>
            <span className="text-xs text-gray-500 dark:text-zinc-400 block mt-0.5">2심 재판부</span>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed pt-1">
          {decodedGugun} 관내의 민사 분쟁 및 손해배상 소송은 {jurisdiction.court}에서 관할하며, 형사 수사 및 검찰 사무는 {jurisdiction.prosecution}에서 담당합니다. 1심 판결에 대한 상소 사건은 {jurisdiction.highCourt}에서 총괄 심리합니다.
        </p>
      </section>

      {/* 3. 인터랙티브 의료기관 상세 검색 (클라이언트 컴포넌트) */}
      <section className="space-y-4">
        <Suspense fallback={
          <div className="py-12 text-center border border-gray-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-gray-600 dark:text-zinc-400 font-medium text-sm">상세 의료기관 네트워크 로딩 중...</p>
          </div>
        }>
          <HospitalDataClient sido={decodedSido} gugun={decodedGugun} />
        </Suspense>
      </section>
    </div>
  );
}
