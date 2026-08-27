import Link from 'next/link';
import type { Metadata } from 'next';
import { REGIONS_DATA } from '@/lib/constants';
import { notFound } from 'next/navigation';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumBadge from '@/components/ui/PremiumBadge';
import AppIcon from '@/components/ui/AppIcon';

export async function generateStaticParams() {
  return REGIONS_DATA.map((region) => ({ sido: region.name }));
}

export async function generateMetadata({ params }: { params: Promise<{ sido: string }> }): Promise<Metadata> {
  const { sido } = await params;
  const decodedSido = decodeURIComponent(sido);
  return {
    title: `${decodedSido} 지역별 의료기관 네트워크 | 보상스쿨 전문 손해사정 그룹`,
    description: `${decodedSido} 지역의 교통사고, 산재, 실손, 의료분쟁 전문 협력 병원 정보를 제공합니다.`,
    alternates: {
      canonical: `https://claim-works.com/regions/${encodeURIComponent(decodedSido)}`,
    },
  };
}

export default async function SidoPage({ params }: { params: Promise<{ sido: string }> }) {
  const { sido } = await params;
  const decodedSido = decodeURIComponent(sido);
  const regionData = REGIONS_DATA.find(r => r.name === decodedSido);

  if (!regionData) {
    notFound();
  }

  return (
    <div className="w-full space-y-8 sm:space-y-10">
      {/* 1. 상단 브레드크럼 */}
      <nav className="flex text-xs text-[#5f6368] dark:text-[#9aa0a6]" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1.5">
          <li><Link href="/" className="hover:text-[var(--google-blue)] transition-colors">홈</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href="/regions" className="hover:text-[var(--google-blue)] transition-colors">지역별 의료기관</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="text-[#202124] dark:text-[#e8eaed] font-medium" aria-current="page">{decodedSido}</li>
        </ol>
      </nav>

      {/* 2. 헤더 배너 (Teal 시그니처 PremiumCard) */}
      <PremiumCard 
        borderColor="teal" 
        hoverEffect={false} 
        watermarkIcon="compass" 
        className="!p-5 sm:!p-7 !bg-gradient-to-r !from-teal-50/90 !via-emerald-50/50 !to-transparent dark:!from-teal-950/40 dark:!via-emerald-950/20 dark:!to-transparent border-teal-200/90 dark:border-teal-900/50"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <PremiumBadge color="teal">{decodedSido} 광역 네트워크</PremiumBadge>
              <PremiumBadge color="gray">총 {regionData.districts.length}개 시·군·구 매핑</PremiumBadge>
            </div>
            <Link 
              href="/regions" 
              className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-gray-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors shrink-0"
            >
              <span>전국 시·도 보기</span>
              <AppIcon name="chevron-right" size={14} />
            </Link>
          </div>

          <PremiumHeading 
            level={1} 
            gradient="teal" 
            showLeftBorder={false} 
            icon={<AppIcon name="compass" size={24} className="text-teal-600 dark:text-teal-400 shrink-0" />}
            className="!mb-2 !text-xl sm:!text-2xl"
          >
            {decodedSido} 의료기관 네트워크
          </PremiumHeading>

          <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] font-medium leading-relaxed break-keep">
            {decodedSido} 내 세부 시·군·구를 선택하시면 진료과목별 우수 병원 정보와 손해사정 맞춤형 상담을 확인하실 수 있습니다.
          </p>
        </div>
      </PremiumCard>

      {/* 3. 시·군·구 그리드 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-gray-200/80 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <AppIcon name="hospital" size={20} className="text-teal-600 dark:text-teal-400" />
            <h2 className="text-lg sm:text-xl font-bold text-[#202124] dark:text-[#e8eaed]">
              {decodedSido} 세부 시·군·구
            </h2>
          </div>
          <span className="text-xs text-[#5f6368] dark:text-[#9aa0a6] font-medium">{regionData.districts.length}개 구역</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
          {regionData.districts.map((gugun) => (
            <Link 
              key={gugun} 
              href={`/regions/${encodeURIComponent(decodedSido)}/${encodeURIComponent(gugun)}`} 
              className="group relative flex flex-col justify-between bg-white dark:bg-[#202124] p-4 sm:p-5 border border-teal-200/80 dark:border-teal-900/50 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:border-teal-500 dark:hover:border-teal-500 hover:shadow-[0_12px_36px_rgba(20,184,166,0.14)] dark:hover:shadow-[0_12px_36px_rgba(20,184,166,0.22)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden outline-none"
            >
              {/* 1. 좌측 틸 포인트 바 */}
              <div className="absolute top-0 left-0 w-1 h-full bg-teal-600 opacity-0 group-hover:opacity-100 transition-opacity z-20"></div>

              {/* 2. 배경 틸 파스텔 그라데이션 */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50/80 via-teal-50/20 to-transparent dark:from-teal-950/30 dark:via-teal-950/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0"></div>

              <div className="relative z-10 space-y-3">
                <div className="w-10 h-10 flex items-center justify-center bg-teal-50/80 dark:bg-teal-950/50 border border-teal-200/80 dark:border-teal-900/60 text-teal-600 dark:text-teal-400 shadow-xs group-hover:scale-105 transition-transform duration-300">
                  <AppIcon name="hospital" size={20} />
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-[#202124] dark:text-[#e8eaed] group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {gugun}
                  </h3>
                  <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] font-medium mt-0.5">
                    HIRA 연계 병의원
                  </p>
                </div>
              </div>

              <div className="relative z-10 mt-3 pt-2.5 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-end text-[11px] font-bold text-teal-600 dark:text-teal-400 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                <span>상세보기</span>
                <AppIcon name="chevron-right" size={13} className="group-hover:translate-x-0.5 transition-transform ml-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
