import Link from 'next/link';
import type { Metadata } from 'next';
import { REGIONS_DATA } from '@/lib/constants';
import { notFound } from 'next/navigation';
import PremiumHeaderBanner from '@/components/ui/PremiumHeaderBanner';
import SectionLayout from '@/components/ui/SectionLayout';
import AppIcon from '@/components/ui/AppIcon';
import RegionGridCard from '@/components/ui/RegionGridCard';
import { getHospitalCount } from '@/lib/constants/hospital-stats';

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
    <div className="w-full space-y-6 sm:space-y-8">
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

      {/* 2. 헤더 배너 */}
      <PremiumHeaderBanner
        theme="teal"
        icon="compass"
        title={`${decodedSido} 의료기관 네트워크`}
        badges={[`${decodedSido} 광역 네트워크`, { text: `총 ${regionData.districts.length}개 시·군·구 매핑`, color: 'gray' }]}
        description={`${decodedSido} 내 세부 시·군·구를 선택하시면 10대 핵심 진료과목별 우수 병원 정보와 손해사정 맞춤형 상담을 확인하실 수 있습니다.`}
        rightLink={{ href: '/regions', text: '전국 시·도 보기' }}
      />

      {/* 3. 시·군·구 그리드 (모바일 2열 통일 & 실시간 병의원 수 데이터 연동) */}
      <SectionLayout
        title={`${decodedSido} 세부 시·군·구 네트워크`}
        icon={<AppIcon name="hospital" size={20} />}
        themeColor="teal"
        description={`${decodedSido} 내 총 ${regionData.districts.length}개 시·군·구별 세부 의료기관 및 손해사정 지식입니다.`}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4">
          {regionData.districts.map((gugun) => {
            const hospitalCount = getHospitalCount(decodedSido, gugun);
            const countLabel = hospitalCount > 0 
              ? `${hospitalCount.toLocaleString()}개 병의원`
              : 'HIRA 협력 네트워크';

            return (
              <RegionGridCard
                key={gugun}
                href={`/regions/${encodeURIComponent(decodedSido)}/${encodeURIComponent(gugun)}`}
                title={gugun}
                countLabel={countLabel}
                icon="hospital"
              />
            );
          })}
        </div>
      </SectionLayout>
    </div>
  );
}
