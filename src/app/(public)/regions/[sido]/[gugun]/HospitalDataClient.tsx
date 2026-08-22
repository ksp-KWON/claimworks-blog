'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import standardData from '../../../../../../functions/api/taas-standard-data.json';


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
        const matchedKeys = Object.keys(gugunCodes)
          .filter(k => cleanGugun.includes(k) || k.includes(cleanGugun))
          .sort((a, b) => b.length - a.length);
          
        if (matchedKeys.length > 0) {
          gugunCode = gugunCodes[matchedKeys[0]];
        } else {
          for (const [key, code] of Object.entries(gugunCodes)) {
            if (key.substring(0,2) === cleanGugun.substring(0,2)) {
              gugunCode = code as string;
              break;
            }
          }
        }
        
        if (!gugunCode) throw new Error('Gugun not found');

        const res = await fetch(`/data/hospitals/${sidoCode}-${gugunCode}.json`);
        if (!res.ok) throw new Error('Fetch failed');
        
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
        // 호환성 처리: specData가 배열인지 객체(count, hospitals)인지 분기
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
    
    // 선택된 진료과목이 있는 경우
    if (selectedSpecialty) {
      const specData = data.specialties[selectedSpecialty];
      if (!specData) return [];
      return Array.isArray(specData) ? specData : (specData.hospitals || []);
    }
    
    // 평탄화 (모든 병원)
    const all = new Map();
    Object.values(data.specialties).forEach((specData: any) => {
      // 배열인 경우와 객체(hospitals)인 경우 모두 지원하여 오류 방지
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
      <div className="py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-[var(--google-blue)] border-t-transparent rounded-none animate-spin mb-4" />
        <p className="text-[#5f6368] font-bold tracking-tight">의료기관 데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-20 text-center bg-white dark:bg-[#202124] rounded-none border border-gray-200 dark:border-gray-800 shadow-[0_12px_40px_rgba(0,0,0,0.15)]">
        <div className="flex items-center justify-center text-gray-400 mb-4">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 22V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16" />
            <line x1="12" y1="10" x2="12" y2="14" />
            <line x1="10" y1="12" x2="14" y2="12" />
            <line x1="3" y1="22" x2="21" y2="22" />
          </svg>
        </div>
        <h2 className="text-xl font-extrabold text-[#202124] dark:text-[#e8eaed] mb-2">데이터 준비중</h2>
        <p className="text-[#5f6368] dark:text-[#9aa0a6] text-sm">해당 지역의 의료기관 데이터가 업데이트되고 있습니다.</p>
        <Link href={`/regions/${encodeURIComponent(sido)}`} className="mt-6 inline-block bg-black text-white px-6 py-2 font-bold text-sm hover:bg-gray-800 transition-colors">
          뒤로가기
        </Link>
      </div>
    );
  }

  // 딥링크 특정 병원 모드
  if (deepLinkedHospitalData) {
    return (
      <div className="bg-white dark:bg-[#202124] rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] transition-all duration-300">
        <div className="bg-gradient-to-r from-[var(--google-blue)] to-[#1557b0] text-white px-6 py-4 flex flex-col gap-2 relative overflow-hidden">
          {/* 강렬한 3D 효과를 위한 오버레이 */}
          <div className="absolute inset-0 bg-black/10 shadow-[inset_0_4px_20px_rgba(0,0,0,0.2)]"></div>
          
          <nav className="relative z-10 flex items-center gap-1.5 text-xs text-white/80 font-bold tracking-wide">
            <Link href="/regions" className="hover:text-white transition-colors">전국</Link>
            <span>›</span>
            <Link href={`/regions/${encodeURIComponent(sido)}`} className="hover:text-white transition-colors">{sido}</Link>
            <span>›</span>
            <button onClick={() => router.push(`/regions/${encodeURIComponent(sido)}/${encodeURIComponent(gugun)}`)} className="hover:text-white transition-colors">{gugun}</button>
          </nav>
          
          <h1 className="relative z-10 text-2xl sm:text-3xl font-extrabold tracking-tight mt-2">
            {deepLinkedHospitalData.name}
          </h1>
        </div>
        
        <div className="p-6 sm:p-10 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-gray-50 dark:bg-[#303134] border border-gray-200 dark:border-gray-700 rounded-none shadow-[4px_4px_0px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
                주소
              </div>
              <div className="text-sm text-[#202124] dark:text-[#e8eaed] font-medium leading-relaxed">{deepLinkedHospitalData.address}</div>
            </div>
            <div className="p-5 bg-gray-50 dark:bg-[#303134] border border-gray-200 dark:border-gray-700 rounded-none shadow-[4px_4px_0px_rgba(0,0,0,0.05)]">
              <div className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.5 2 2 0 0 1 3.6 1.3h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l1.06-.95a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                전화번호
              </div>
              <div className="text-sm text-[#202124] dark:text-[#e8eaed] font-medium">{deepLinkedHospitalData.tel || '정보 없음'}</div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-8 mt-8">
            <div className="bg-amber-50 dark:bg-amber-900/20 p-6 sm:p-8 rounded-none border border-amber-200 dark:border-amber-800 shadow-[0_8px_30px_rgba(251,191,36,0.15)] flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white dark:bg-black rounded-full flex items-center justify-center text-amber-600 shadow-md mb-4 border border-amber-100 dark:border-amber-900">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-[#202124] dark:text-[#e8eaed] mb-2">해당 병원 진단/보상 관련 분쟁이 있으신가요?</h3>
              <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] mb-6 font-medium leading-relaxed max-w-lg">
                수술/입원 후 보험금 지급 거절, 후유장해 진단서 발급 문제 등 전문가의 도움이 필요하다면 실시간 무료 상담을 신청하세요.
              </p>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent('open-chat'));
                }}
                className="w-full sm:w-auto px-8 py-3.5 bg-amber-400 hover:bg-amber-500 text-black font-extrabold text-sm transition-all duration-300 shadow-[0_4px_15px_rgba(251,191,36,0.4)] hover:shadow-[0_6px_25px_rgba(251,191,36,0.6)] hover:-translate-y-1 active:translate-y-0 text-center"
              >
                보상스쿨 실시간 채팅상담
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 일반 리스트 모드
  return (
    <div className="space-y-6">
      {/* 🗺️ 상단 정보성 띠 배너 */}
      <div className="bg-[var(--google-blue)] text-white px-5 py-3 flex items-center justify-between flex-nowrap gap-3 rounded-none shadow-[0_4px_20px_rgba(26,115,232,0.3)]">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <Link href={`/regions/${encodeURIComponent(sido)}`} className="hover:underline flex items-center gap-1 text-sm font-bold opacity-80 hover:opacity-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            {sido}
          </Link>
          <span className="opacity-50">/</span>
          <div className="text-sm font-extrabold tracking-tight">
            {gugun} 병원 네트워크
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#202124] rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] p-6 sm:p-8">
        
        {/* 진료과목 필터 */}
        <div className="mb-8">
          <h3 className="text-sm font-extrabold text-[#202124] dark:text-[#e8eaed] mb-3 flex items-center gap-2 tracking-tight">
            <svg className="w-4 h-4 text-[var(--google-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            진료과목 필터링
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSpecialty(null)}
              className={`px-4 py-2 text-xs font-bold transition-all duration-200 border rounded-none ${
                selectedSpecialty === null 
                  ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-[2px_4px_12px_rgba(0,0,0,0.2)]' 
                  : 'bg-white text-[#5f6368] border-gray-200 hover:border-gray-400 dark:bg-[#303134] dark:border-gray-700 dark:text-gray-300'
              }`}
            >
              전체보기
            </button>
            {specialtiesList.map((spec) => (
              <button
                key={spec.name}
                onClick={() => setSelectedSpecialty(spec.name)}
                className={`px-4 py-2 text-xs font-bold transition-all duration-200 border rounded-none flex items-center gap-1.5 ${
                  selectedSpecialty === spec.name
                    ? 'bg-[var(--google-blue)] text-white border-[var(--google-blue)] shadow-[2px_4px_12px_rgba(26,115,232,0.3)]'
                    : 'bg-white text-[#5f6368] border-gray-200 hover:border-gray-400 dark:bg-[#303134] dark:border-gray-700 dark:text-gray-300'
                }`}
              >
                {spec.name}
                <span className="opacity-60 font-normal text-[10px]">({spec.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* 리스트 출력 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {hospitalsToDisplay.map((hospital: any, idx: number) => (
            <button
              key={`${hospital.name}-${idx}`}
              onClick={() => router.push(`/regions/${encodeURIComponent(sido)}/${encodeURIComponent(gugun)}?hospital=${encodeURIComponent(hospital.name)}`)}
              className="group text-left p-5 bg-white dark:bg-[#202124] border border-gray-200 dark:border-gray-800 rounded-none hover:border-[var(--google-blue)] dark:hover:border-[var(--google-blue)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(26,115,232,0.15)] hover:-translate-y-1 relative overflow-hidden"
            >
              {/* 호버 시 왼쪽 파란색 인디케이터 바 */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--google-blue)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <h4 className="text-base font-extrabold text-[#202124] dark:text-[#e8eaed] mb-1.5 group-hover:text-[var(--google-blue)] transition-colors pr-6 tracking-tight line-clamp-1">
                {hospital.name}
              </h4>
              <div className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mb-1 font-medium line-clamp-1">
                {hospital.address}
              </div>
              <div className="text-xs text-[var(--google-blue)] font-bold">
                {hospital.tel || '전화번호 미제공'}
              </div>
              
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 text-[var(--google-blue)]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </div>
            </button>
          ))}
        </div>
        
        {hospitalsToDisplay.length === 0 && (
          <div className="py-12 text-center text-[#5f6368] font-bold">
            해당 조건의 병원이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
