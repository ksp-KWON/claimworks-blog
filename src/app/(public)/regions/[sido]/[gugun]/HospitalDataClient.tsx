'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import standardData from '../../../../../../functions/api/taas-standard-data.json';
import AppIcon from '@/components/ui/AppIcon';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumBadge from '@/components/ui/PremiumBadge';

interface HospitalDataClientProps {
  sido: string;
  gugun: string;
}

export default function HospitalDataClient({ sido, gugun }: HospitalDataClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const deepLinkHospital = searchParams.get('hospital');
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHospitalData() {
      try {
        const sidoCode = standardData.TAAS_SIDO_CODES[sido as keyof typeof standardData.TAAS_SIDO_CODES];
        if (!sidoCode) throw new Error('Sido not found');
        
        const gugunCodes = standardData.TAAS_GUGUN_CODES[sidoCode as keyof typeof standardData.TAAS_GUGUN_CODES] as any;
        
        let gugunCode = '';
        const cleanGugun = gugun.replace(/^(인천|대구|광주|대전|울산|부산|서울)\s*/, '');
        
        // 1. 정확 일치 (Exact Match) 최우선 적용
        if (gugunCodes[cleanGugun]) {
          gugunCode = gugunCodes[cleanGugun];
        } else if (gugunCodes[gugun]) {
          gugunCode = gugunCodes[gugun];
        } else {
          // 2. 포함 매칭
          const matchedKeys = Object.keys(gugunCodes)
            .filter(k => cleanGugun.includes(k) || k.includes(cleanGugun))
            .sort((a, b) => b.length - a.length);
            
          if (matchedKeys.length > 0) {
            gugunCode = gugunCodes[matchedKeys[0]];
          } else {
            for (const [key, code] of Object.entries(gugunCodes)) {
              if (key.substring(0, 2) === cleanGugun.substring(0, 2)) {
                gugunCode = code as string;
                break;
              }
            }
          }
        }
        
        if (!gugunCode) throw new Error(`Gugun not found for ${sido} ${gugun}`);

        let res = await fetch(`/data/hospitals/${sidoCode}-${gugunCode}.json`);
        // 제주도 호환 폴백 (50 <-> 49)
        if (!res.ok && sidoCode === '50') {
          res = await fetch(`/data/hospitals/49-${gugunCode}.json`);
        }
        if (!res.ok) throw new Error(`Fetch failed for /data/hospitals/${sidoCode}-${gugunCode}.json`);
        
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchHospitalData();
  }, [sido, gugun]);

  const specialtiesList = useMemo(() => {
    if (!data || !data.specialties) return [];
    return Object.entries(data.specialties)
      .map(([name, specData]: [string, any]) => {
        let count = 0;
        if (Array.isArray(specData)) {
          count = specData.length;
        } else if (specData && typeof specData === 'object') {
          count = specData.count || (specData.hospitals ? specData.hospitals.length : 0);
        }
        return { name, count };
      })
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const hospitalsToDisplay = useMemo(() => {
    if (!data || !data.specialties) return [];
    
    if (selectedSpecialty) {
      const specData = data.specialties[selectedSpecialty];
      if (!specData) return [];
      return Array.isArray(specData) ? specData : (specData.hospitals || []);
    }
    
    // 평탄화 (모든 병원)
    const all = new Map();
    Object.values(data.specialties).forEach((specData: any) => {
      const list = Array.isArray(specData) ? specData : (specData?.hospitals || []);
      if (Array.isArray(list)) {
        list.forEach((h: any) => {
          if (h && h.name && !all.has(h.name)) all.set(h.name, h);
        });
      }
    });
    return Array.from(all.values());
  }, [data, selectedSpecialty]);

  const deepLinkedHospitalData = useMemo(() => {
    if (!deepLinkHospital || !data) return null;
    return hospitalsToDisplay.find((h: any) => h.name === deepLinkHospital);
  }, [deepLinkHospital, hospitalsToDisplay, data]);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="inline-block w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-none animate-spin" />
        <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] font-bold">
          {sido} {gugun} 의료기관 데이터를 불러오는 중...
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full py-12">
        <PremiumCard borderColor="teal" hoverEffect={false} className="!p-8 sm:!p-12 text-center space-y-4">
          <div className="flex items-center justify-center text-teal-600 dark:text-teal-400">
            <AppIcon name="hospital" size={48} />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">데이터 동기화 준비중</h2>
          <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] font-medium max-w-md mx-auto">
            해당 지역의 HIRA 공공 의료기관 데이터가 업데이트되고 있습니다.
          </p>
          <div className="pt-2">
            <Link 
              href={`/regions/${encodeURIComponent(sido)}`} 
              className="inline-block bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 font-bold text-sm transition-colors"
            >
              {sido} 지역 목록으로 돌아가기
            </Link>
          </div>
        </PremiumCard>
      </div>
    );
  }

  // 딥링크 특정 병원 모드
  if (deepLinkedHospitalData) {
    return (
      <div className="w-full space-y-6">
        {/* 상단 브레드크럼 */}
        <nav className="flex text-xs text-[#5f6368] dark:text-[#9aa0a6]" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1.5">
            <li><Link href="/" className="hover:text-teal-600 transition-colors">홈</Link></li>
            <li><span className="mx-1">/</span></li>
            <li><Link href="/regions" className="hover:text-teal-600 transition-colors">지역별 의료기관</Link></li>
            <li><span className="mx-1">/</span></li>
            <li><Link href={`/regions/${encodeURIComponent(sido)}`} className="hover:text-teal-600 transition-colors">{sido}</Link></li>
            <li><span className="mx-1">/</span></li>
            <li><button onClick={() => router.push(`/regions/${encodeURIComponent(sido)}/${encodeURIComponent(gugun)}`)} className="hover:text-teal-600 transition-colors cursor-pointer">{gugun}</button></li>
            <li><span className="mx-1">/</span></li>
            <li className="text-[#202124] dark:text-[#e8eaed] font-medium" aria-current="page">{deepLinkedHospitalData.name}</li>
          </ol>
        </nav>

        {/* 병원 상세 헤더 카드 */}
        <PremiumCard borderColor="teal" hoverEffect={true} watermarkIcon="hospital" className="!p-6 sm:!p-8">
          <div className="relative z-10 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <PremiumBadge color="teal">{sido} {gugun} 의료기관</PremiumBadge>
              <PremiumBadge color="gray">HIRA 연계 기관</PremiumBadge>
            </div>
            <PremiumHeading 
              level={1} 
              gradient="teal" 
              showLeftBorder={false}
              icon={<AppIcon name="hospital" size={24} className="text-teal-600 dark:text-teal-400 shrink-0" />}
              className="!mb-2 !text-2xl sm:!text-3xl"
            >
              {deepLinkedHospitalData.name}
            </PremiumHeading>
          </div>
        </PremiumCard>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PremiumCard borderColor="teal" hoverEffect={true} className="!p-5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-400">
              <AppIcon name="compass" size={14} />
              기관 주소
            </div>
            <div className="text-sm font-bold text-gray-900 dark:text-white leading-relaxed">
              {deepLinkedHospitalData.address}
            </div>
          </PremiumCard>

          <PremiumCard borderColor="teal" hoverEffect={true} className="!p-5 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-400">
              <AppIcon name="phone" size={14} />
              대표 전화번호
            </div>
            <div className="text-sm font-bold text-gray-900 dark:text-white">
              {deepLinkedHospitalData.tel || '전화번호 정보 미제공'}
            </div>
          </PremiumCard>
        </div>

        {/* 보상 상담 액션 배너 */}
        <PremiumCard borderColor="teal" hoverEffect={true} watermarkIcon="shield-check" className="!p-6 sm:!p-8 text-center space-y-4">
          <div className="w-12 h-12 mx-auto flex items-center justify-center text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800">
            <AppIcon name="shield-check" size={24} />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white">
              치료·진단 후 보험금 청구 및 정당한 보상이 고민되시나요?
            </h2>
            <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-lg mx-auto leading-relaxed font-medium">
              병원에서 수술·치료 후 발생하는 실손·진단비 부지급 통보, 후유장해 평가, 교통사고·산재 합의금 분쟁을 공인 손해사정사가 정밀 분석해 드립니다.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button 
              onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('open-chat'));
              }}
              className="w-full sm:w-auto px-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm transition-all shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <AppIcon name="chat" size={16} />
              <span>실시간 채팅 상담</span>
            </button>
            <Link
              href="/consultation"
              className="w-full sm:w-auto px-6 py-3.5 bg-gray-900 hover:bg-black dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white font-extrabold text-sm transition-all shadow-md flex items-center justify-center gap-2 text-center"
            >
              <AppIcon name="phone" size={16} />
              <span>1:1 무료 정밀 상담 접수</span>
            </Link>
          </div>
        </PremiumCard>
      </div>
    );
  }

  // 일반 리스트 모드
  return (
    <div className="w-full space-y-6">
      {/* 상단 브레드크럼 */}
      <nav className="flex text-xs text-[#5f6368] dark:text-[#9aa0a6]" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1.5">
          <li><Link href="/" className="hover:text-teal-600 transition-colors">홈</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href="/regions" className="hover:text-teal-600 transition-colors">지역별 의료기관</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href={`/regions/${encodeURIComponent(sido)}`} className="hover:text-teal-600 transition-colors">{sido}</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="text-[#202124] dark:text-[#e8eaed] font-medium" aria-current="page">{gugun}</li>
        </ol>
      </nav>

      {/* 헤더 배너 (Teal 시그니처) */}
      <PremiumCard borderColor="teal" hoverEffect={true} watermarkIcon="hospital" className="!p-6 sm:!p-8">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <PremiumBadge color="teal">{sido} {gugun}</PremiumBadge>
            <PremiumBadge color="gray">총 {hospitalsToDisplay.length}개 기관 매핑</PremiumBadge>
          </div>
          <PremiumHeading 
            level={1} 
            gradient="teal" 
            showLeftBorder={false}
            icon={<AppIcon name="hospital" size={24} className="text-teal-600 dark:text-teal-400 shrink-0" />}
            className="!mb-2 !text-2xl sm:!text-3xl"
          >
            {sido} {gugun} 의료기관 네트워크
          </PremiumHeading>
          <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] font-medium leading-relaxed break-keep">
            진료과목별 필터를 선택하여 {gugun} 내 우수 병의원 정보와 손해사정 연계 지식을 확인하세요.
          </p>
        </div>
      </PremiumCard>

      {/* 진료과목 필터링 칩 */}
      <PremiumCard borderColor="teal" hoverEffect={false} className="!p-4 sm:!p-5 space-y-3">
        <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-extrabold text-gray-900 dark:text-white">
          <AppIcon name="list" size={15} className="text-teal-600" />
          진료과목 필터링
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedSpecialty(null)}
            className={`px-3 py-1.5 text-xs font-extrabold transition-all border cursor-pointer ${
              selectedSpecialty === null 
                ? 'bg-teal-600 text-white border-teal-600 shadow-xs' 
                : 'bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-700 hover:border-teal-500'
            }`}
          >
            전체보기
          </button>
          {specialtiesList.map((spec) => (
            <button
              key={spec.name}
              onClick={() => setSelectedSpecialty(spec.name)}
              className={`px-3 py-1.5 text-xs font-extrabold transition-all border flex items-center gap-1 cursor-pointer ${
                selectedSpecialty === spec.name
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-white dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-700 hover:border-teal-500'
              }`}
            >
              <span>{spec.name}</span>
              <span className="opacity-75 text-[10.5px]">({spec.count})</span>
            </button>
          ))}
        </div>
      </PremiumCard>

      {/* 병원 리스트 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {hospitalsToDisplay.map((hospital: any, idx: number) => (
          <button
            key={`${hospital.name}-${idx}`}
            onClick={() => router.push(`/regions/${encodeURIComponent(sido)}/${encodeURIComponent(gugun)}?hospital=${encodeURIComponent(hospital.name)}`)}
            className="group text-left outline-none block w-full cursor-pointer"
          >
            <PremiumCard borderColor="teal" hoverEffect={true} className="!p-4 sm:!p-5 h-full relative overflow-hidden">
              <div className="flex flex-col justify-between h-full space-y-2">
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-1">
                    {hospital.name}
                  </h2>
                  <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-1 line-clamp-1 font-medium">
                    {hospital.address}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-zinc-800 text-xs font-bold text-teal-600 dark:text-teal-400">
                  <span>{hospital.tel || '전화번호 미제공'}</span>
                  <AppIcon name="chevron-right" size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </PremiumCard>
          </button>
        ))}
      </div>
      
      {hospitalsToDisplay.length === 0 && (
        <div className="py-12 text-center text-sm text-[#5f6368] font-bold">
          해당 진료과목 조건의 병원이 없습니다.
        </div>
      )}
    </div>
  );
}
