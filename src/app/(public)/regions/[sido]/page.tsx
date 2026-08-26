import Link from 'next/link';
import { REGIONS_DATA } from '@/lib/constants';
import { notFound } from 'next/navigation';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumBadge from '@/components/ui/PremiumBadge';
import AppIcon from '@/components/ui/AppIcon';

export async function generateStaticParams() {
  return REGIONS_DATA.map((region) => ({ sido: region.name }));
}

export async function generateMetadata({ params }: { params: Promise<{ sido: string }> }) {
  const { sido } = await params;
  const decodedSido = decodeURIComponent(sido);
  return {
    title: `${decodedSido} 지역별 의료기관 네트워크 | 보상스쿨`,
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
    <div className="w-full space-y-6">
      {/* 상단 브레드크럼 */}
      <nav className="flex text-xs text-[#5f6368] dark:text-[#9aa0a6]" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1.5">
          <li><Link href="/" className="hover:text-[var(--google-blue)] transition-colors">홈</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href="/regions" className="hover:text-[var(--google-blue)] transition-colors">지역별 의료기관</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="text-[#202124] dark:text-[#e8eaed] font-medium" aria-current="page">{decodedSido}</li>
        </ol>
      </nav>

      {/* 헤더 배너 (Teal 시그니처) */}
      <PremiumCard borderColor="teal" hoverEffect={true} watermarkIcon="compass" className="!p-6 sm:!p-8">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <PremiumBadge color="teal">{decodedSido} 광역 네트워크</PremiumBadge>
            <PremiumBadge color="gray">{regionData.districts.length}개 시·군·구 매핑</PremiumBadge>
          </div>
          <PremiumHeading 
            level={1} 
            gradient="teal" 
            showLeftBorder={false}
            icon={<AppIcon name="compass" size={24} className="text-teal-600 dark:text-teal-400 shrink-0" />}
            className="!mb-2 !text-2xl sm:!text-3xl"
          >
            {decodedSido} 의료기관 네트워크
          </PremiumHeading>
          <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] font-medium leading-relaxed break-keep">
            {decodedSido} 내 세부 시·군·구를 선택하시면 진료과목별 우수 병원 정보와 손해사정 맞춤형 상담을 확인하실 수 있습니다.
          </p>
        </div>
      </PremiumCard>

      {/* 시군구 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 pt-2">
        {regionData.districts.map((gugun) => (
          <Link 
            key={gugun} 
            href={`/regions/${encodeURIComponent(decodedSido)}/${encodeURIComponent(gugun)}`} 
            className="group outline-none block"
          >
            <PremiumCard hoverEffect={true} borderColor="teal" className="!p-5 h-full text-center">
              <div className="flex flex-col items-center justify-center w-full h-full">
                <div className="w-12 h-12 flex items-center justify-center text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/60 mb-3 shadow-xs group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300">
                  <AppIcon name="hospital" size={20} />
                </div>
                <h2 className="text-sm sm:text-base font-extrabold text-[#202124] dark:text-[#e8eaed] group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  {gugun}
                </h2>
              </div>
            </PremiumCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
