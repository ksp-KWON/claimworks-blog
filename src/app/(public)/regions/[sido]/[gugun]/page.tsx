import { REGIONS_DATA } from '@/lib/constants';
import { Suspense } from 'react';
import HospitalDataClient from './HospitalDataClient';
import { getRegionContent } from '@/lib/region-content';
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
  const content = getRegionContent(decodedSido, decodedGugun);
  
  return {
    title: `${decodedSido} ${decodedGugun} 손해사정 실무 및 의료기관 네트워크 | 보상스쿨`,
    description: `${decodedSido} ${decodedGugun} (${content.archetypeName}) 관할 법원·검찰청 및 ${content.hospitalStat.totalCount}개 의료기관 연계 손해사정 실무 가이드입니다.`,
    alternates: {
      canonical: `https://claim-works.com/regions/${encodeURIComponent(decodedSido)}/${encodeURIComponent(decodedGugun)}`,
    },
  };
}

export default async function GugunPage({ params }: { params: Promise<{ sido: string; gugun: string }> }) {
  const { sido, gugun } = await params;
  const decodedSido = decodeURIComponent(sido);
  const decodedGugun = decodeURIComponent(gugun);

  const content = getRegionContent(decodedSido, decodedGugun);
  const { jurisdiction, hospitalStat } = content;

  return (
    <div className="w-full space-y-8 pb-12">
      {/* 1. 상단 타이틀 & 뱃지 헤더 (W3C H1) */}
      <header className="space-y-3 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <PremiumBadge color="gray">
            {decodedSido} · {decodedGugun}
          </PremiumBadge>
          <PremiumBadge color="teal">
            {content.archetypeName}
          </PremiumBadge>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-zinc-50">
          {decodedSido} {decodedGugun} 손해사정 실무 가이드 & 의료기관 네트워크
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-zinc-400">
          관내 {hospitalStat.totalCount}개 의료기관 인프라 분석과 {jurisdiction.court} 관할 사법 절차를 결합한 전문 손해사정 핵심 가이드입니다.
        </p>
      </header>

      {/* 2. 핵심 요약 박스 (W3C 라인 SVG + 샤프 모던 룩) */}
      <section className="border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 p-5 rounded-none space-y-3">
        <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-bold text-base">
          <AppIcon name="lightbulb" size={20} className="text-blue-600 dark:text-blue-400" />
          <h2>핵심 실무 요약</h2>
        </div>
        <ul className="space-y-2 text-sm leading-relaxed text-gray-800 dark:text-zinc-200">
          {content.summaryBox.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* 3. 지역 특화 심층 가이드 (H2 + 3대 표준 문단) */}
      <article className="border border-gray-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 rounded-none space-y-4">
        <div className="border-b border-gray-200/80 dark:border-zinc-800 pb-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50">
            {content.mainGuideTitle}
          </h2>
        </div>
        <div className="space-y-4 text-sm sm:text-base leading-relaxed text-gray-700 dark:text-zinc-300">
          {content.guideParagraphs.map((paragraph, idx) => (
            <p key={idx} className="mb-4">
              {paragraph}
            </p>
          ))}
        </div>

        {/* 전문가 팁 콜아웃 */}
        <div className="mt-4 border-l-4 border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 p-4 rounded-none space-y-1">
          <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200 font-bold text-sm">
            <AppIcon name="shield-check" size={18} className="text-teal-600 dark:text-teal-400" />
            <h3>{content.specialtyAdviceTitle}</h3>
          </div>
          <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed">
            {content.specialtyAdviceContent}
          </p>
        </div>
      </article>

      {/* 4. 관할 사법기관 & 소송/조정 절차 카드 */}
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
          {content.courtActionGuide}
        </p>
      </section>

      {/* 5. 인터랙티브 의료기관 상세 검색 (클라이언트 하위 컴포넌트) */}
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
