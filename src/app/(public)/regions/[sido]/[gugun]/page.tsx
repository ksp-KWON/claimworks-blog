import { REGIONS_DATA } from '@/lib/constants';
import { Suspense } from 'react';
import HospitalDataClient from './HospitalDataClient';

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
  
  return {
    title: `${decodedSido} ${decodedGugun} 의료기관 네트워크 | 보상스쿨`,
    description: `${decodedSido} ${decodedGugun} 지역의 병원 및 의료기관 리스트입니다. 실손, 산재, 교통사고 등 전문 보상 상담을 받아보세요.`,
    alternates: {
      canonical: `https://claim-works.com/regions/${encodeURIComponent(decodedSido)}/${encodeURIComponent(decodedGugun)}`,
    },
  };
}

export default async function GugunPage({ params }: { params: Promise<{ sido: string; gugun: string }> }) {
  const { sido, gugun } = await params;
  const decodedSido = decodeURIComponent(sido);
  const decodedGugun = decodeURIComponent(gugun);

  return (
    <div className="w-full space-y-6">
      <Suspense fallback={
        <div className="py-20 text-center">
          <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[#5f6368] font-bold">의료기관 데이터를 불러오는 중...</p>
        </div>
      }>
        <HospitalDataClient sido={decodedSido} gugun={decodedGugun} />
      </Suspense>
    </div>
  );
}
