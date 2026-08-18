import Link from 'next/link';
import { REGIONS_DATA } from '@/lib/constants';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return REGIONS_DATA.map((region) => ({ sido: region.name }));
}

export async function generateMetadata({ params }: { params: Promise<{ sido: string }> }) {
  const { sido } = await params;
  const decodedSido = decodeURIComponent(sido);
  return {
    title: `${decodedSido} 지역별 의료기관 - 보상스쿨`,
    description: `${decodedSido} 지역의 교통사고, 산재, 의료분쟁 등 보상 전문 협력 병원 정보를 제공합니다.`,
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
    <div className="space-y-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <div className="bg-white dark:bg-[#202124] rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] transition-all duration-300 overflow-hidden">
        
        {/* 🗺️ 상단 정보성 띠 배너 */}
        <div className="bg-[var(--google-green)] text-white px-5 py-3 flex items-center justify-between flex-nowrap gap-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <Link href="/regions" className="hover:underline flex items-center gap-1 text-sm font-bold opacity-80 hover:opacity-100">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              전국 매핑
            </Link>
            <span className="opacity-50">/</span>
            <div className="text-sm font-extrabold tracking-tight">
              {decodedSido}
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10 space-y-12">
          {/* 헤더 타이틀 */}
          <div className="text-center space-y-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202124] dark:text-[#e8eaed] tracking-tight">
              {decodedSido} <span className="bg-gradient-to-r from-green-500 to-green-700 bg-clip-text text-transparent">시/군/구 선택</span>
            </h1>
            <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-lg mx-auto leading-relaxed font-medium">
              {decodedSido} 지역 내 {regionData.districts.length}개의 구/군 네트워크가 준비되어 있습니다.<br/>찾으시는 세부 지역을 선택해 주세요.
            </p>
          </div>

          {/* 구군 그리드 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {regionData.districts.map((gugun) => (
              <Link 
                key={gugun} 
                href={`/regions/${encodeURIComponent(decodedSido)}/${encodeURIComponent(gugun)}`} 
                className="group flex flex-col items-center justify-center p-4 sm:p-6 bg-white dark:bg-[#303134] rounded-none border border-gray-200 dark:border-gray-700 shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-[4px_8px_20px_rgba(52,168,83,0.15)] hover:border-[var(--google-green)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-12 h-12 flex items-center justify-center text-xl text-green-600 bg-green-50 dark:bg-green-900/20 rounded-none mb-3 group-hover:scale-110 group-hover:bg-[var(--google-green)] group-hover:text-white transition-all duration-300">
                  🏥
                </div>
                <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-green)] transition-colors text-center">{gugun}</h3>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
