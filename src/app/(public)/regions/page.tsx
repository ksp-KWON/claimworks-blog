import Link from 'next/link';
import type { Metadata } from 'next';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumBadge from '@/components/ui/PremiumBadge';
import PremiumHeaderBanner from '@/components/ui/PremiumHeaderBanner';
import SectionLayout from '@/components/ui/SectionLayout';
import AppIcon from '@/components/ui/AppIcon';
import { REGIONS_DATA } from '@/lib/constants';

export const metadata: Metadata = {
  title: '지역별 의료기관 네트워크 | 보상스쿨 전문 손해사정 그룹',
  description: '전국 17개 시·도, 226개 시·군·구별 보상 전문 의료기관 및 HIRA 건강보험심사평가원 공공데이터 연계 협력 병원 정보를 제공합니다.',
  alternates: {
    canonical: 'https://claim-works.com/regions',
  },
};

// 전국 17개 광역시도별 권역 분류 헬퍼
function getRegionZone(name: string): string {
  if (['서울특별시', '경기도', '인천광역시'].includes(name)) return '수도권';
  if (['대전광역시', '세종특별자치시', '충청북도', '충청남도'].includes(name)) return '충청권';
  if (['광주광역시', '전북특별자치도', '전라남도'].includes(name)) return '호남권';
  if (['부산광역시', '대구광역시', '울산광역시', '경상북도', '경상남도'].includes(name)) return '영남권';
  return '강원·제주';
}

export default function RegionsIndex() {
  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* 1. 상단 브레드크럼 */}
      <nav className="flex text-xs text-[#5f6368] dark:text-[#9aa0a6]" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1.5">
          <li><Link href="/" className="hover:text-[var(--google-blue)] transition-colors">홈</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="text-[#202124] dark:text-[#e8eaed] font-medium" aria-current="page">지역별 의료기관</li>
        </ol>
      </nav>

      {/* 2. 헤더 배너 */}
      <PremiumHeaderBanner
        theme="teal"
        icon="compass"
        title="지역별 의료기관 네트워크"
        badges={['HIRA 공공 빅데이터 연계', { text: '전국 17개 시·도 226개 시·군·구', color: 'gray' }]}
        description="교통사고, 산업재해, 질병 실손, 의료분쟁 등 보상 처리에 필수적인 전국 17개 시·도의 우수 병의원 및 협력 의료기관 정보를 실시간 매핑하여 안내합니다."
      />

      {/* 3. 전국 17개 시도 인터랙티브 카드 그리드 (SectionLayout 패밀리룩) */}
      <SectionLayout
        title="전국 광역 네트워크 허브"
        icon={<AppIcon name="hospital" size={20} />}
        themeColor="teal"
        description="전국 17개 시·도 및 226개 시·군·구 보상 전문 우수 병의원과 공공데이터 연계 협력 네트워크입니다."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {REGIONS_DATA.map((region, idx) => {
            const zone = getRegionZone(region.name);
            return (
              <Link 
                key={region.name} 
                href={`/regions/${encodeURIComponent(region.name)}`} 
                className="group relative flex flex-col justify-between bg-white dark:bg-[#202124] p-4 sm:p-5 border border-teal-200/80 dark:border-teal-900/50 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:border-teal-500 dark:hover:border-teal-500 hover:shadow-[0_12px_36px_rgba(20,184,166,0.14)] dark:hover:shadow-[0_12px_36px_rgba(20,184,166,0.22)] hover:-translate-y-0.5 transition-all duration-300 overflow-hidden outline-none"
              >
                {/* 1. 좌측 틸 포인트 바 */}
                <div className="absolute top-0 left-0 w-1 h-full bg-teal-600 opacity-0 group-hover:opacity-100 transition-opacity z-20"></div>

                {/* 2. 배경 틸 파스텔 그라데이션 */}
                <div className="absolute inset-0 bg-gradient-to-br from-teal-50/80 via-teal-50/20 to-transparent dark:from-teal-950/30 dark:via-teal-950/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0"></div>

                <div className="relative z-10 space-y-3">
                  {/* 상단 아이콘 & 권역 뱃지 */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-10 h-10 flex items-center justify-center bg-teal-50/80 dark:bg-teal-950/50 border border-teal-200/80 dark:border-teal-900/60 text-teal-600 dark:text-teal-400 shadow-xs group-hover:scale-105 transition-transform duration-300">
                      <AppIcon name="compass" size={20} />
                    </div>
                    <PremiumBadge color="teal">{zone}</PremiumBadge>
                  </div>

                  {/* 시도명 및 설명 */}
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-1">
                      {region.name}
                    </h3>
                    <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] font-medium mt-1">
                      {region.districts.length}개 시·군·구 세부 네트워크
                    </p>
                  </div>
                </div>

                {/* 하단 액션 */}
                <div className="relative z-10 mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-wider">
                    NO.{String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="flex items-center gap-1 font-bold text-teal-600 dark:text-teal-400 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                    <span>상세보기</span>
                    <AppIcon name="chevron-right" size={13} className="group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </SectionLayout>

      {/* 4. 하단 교통사고 로컬케어 및 상담 연계 배너 */}
      <PremiumCard 
        borderColor="teal" 
        hoverEffect={true} 
        watermarkIcon="car" 
        className="!p-6 sm:!p-8 !bg-gradient-to-r !from-teal-50/90 !via-emerald-50/40 !to-transparent dark:!from-teal-950/40 dark:!via-emerald-950/20 dark:!to-transparent border-teal-200/90 dark:border-teal-900/50 text-center sm:text-left"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <PremiumBadge color="teal">교통사고 로컬케어 솔루션</PremiumBadge>
              <PremiumBadge color="gray">도로교통공단 TAAS 공공데이터 연계</PremiumBadge>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#202124] dark:text-[#e8eaed]">
              교통사고 다발지역 및 야간·응급 진료 병원이 궁금하신가요?
            </h3>
            <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-xl font-medium">
              내 주변 교통사고 위험 구간과 24시간 응급 진료 가능한 지역 의료기관 정보를 스마트 지도로 확인해 보세요.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Link
              href="/traffic-care"
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-teal-500/20 flex items-center gap-1.5 transition-all"
            >
              <AppIcon name="car" size={15} />
              <span>교통로컬케어 바로가기</span>
            </Link>
            <Link
              href="/consultation"
              className="px-4 py-2.5 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-[#202124] dark:text-[#e8eaed] border border-gray-300 dark:border-zinc-700 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all"
            >
              <AppIcon name="phone" size={14} />
              <span>1:1 상담 예약</span>
            </Link>
          </div>
        </div>
      </PremiumCard>
    </div>
  );
}
