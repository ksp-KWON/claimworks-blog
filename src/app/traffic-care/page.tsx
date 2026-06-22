'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import standardData from '../../../functions/api/taas-standard-data.json';

// --- SVG Icons (이모지 대신 사용되는 고품격 전문 아이콘 세트) ---
function IconShield({ className = 'w-4.5 h-4.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconBrain({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-3.88 2.5 2.5 0 0 1 0-3.12A2.5 2.5 0 0 1 9.5 2zM14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-3.88 2.5 2.5 0 0 0 0-3.12A2.5 2.5 0 0 0 14.5 2z" />
    </svg>
  );
}

function IconBriefcase({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function IconHospital({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function IconPhone({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

// IconAlertTriangle: 제거됨 (미사용 컴포넌트 정리)

interface AccidentZone {
  id: string;
  locationName: string;
  occurCount: number;
  casualtyCount: number;
  deathCount: number;
  seriousCount: number;
  slightCount: number;
  latitude: number;
  longitude: number;
  isFallback?: boolean; // true = 샘플 데이터(API 키 미설정), false = 실제 공공 데이터
}

interface Hospital {
  name: string;
  address: string;
  tel: string;
}

interface SpecialtyData {
  count: number;
  diseases: string[];
  hospitals: Hospital[];
}

interface DistrictHospitals {
  sido: string;
  district: string;
  specialties: Record<string, SpecialtyData>;
}

// 1. 전국 시도별 구군 목록 사전 (심평원 파일명 구조와 100% 일치)
const SIDO_GUGUN_MAP: Record<string, string[]> = {
  '서울특별시': ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'],
  '부산광역시': ['강서구', '금정구', '기장군', '남구', '동구', '동래구', '부산진구', '북구', '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구'],
  '대구광역시': ['남구', '달서구', '달성군', '동구', '북구', '서구', '수성구', '중구', '군위군'],
  '인천광역시': ['강화군', '계양구', '남동구', '동구', '미추홀구', '부평구', '서구', '연수구', '옹진구', '중구'],
  '광주광역시': ['광산구', '남구', '동구', '북구', '서구'],
  '대전광역시': ['대덕구', '동구', '서구', '유성구', '중구'],
  '울산광역시': ['남구', '동구', '북구', '울주군', '중구'],
  '세종특별자치시': ['세종특별자치시'],
  '경기도': ['가평군', '고양시덕양구', '고양시일산동구', '고양시일산서구', '과천시', '광명시', '광주시', '구리시', '군포시', '김포시', '남양주시', '동두천시', '부천시', '성남시분당구', '성남시수정구', '성남시중원구', '수원시권선구', '수원시장안구', '수원시영통구', '수원시팔달구', '시흥시', '안산시단원구', '안산시상록구', '안성시', '안양시동안구', '안양시만안구', '양주시', '양평군', '여주시', '연천군', '오산시', '용인시기흥구', '용인시수지구', '용인시처인구', '의왕시', '의정부시', '이천시', '파주시', '평택시', '포천시', '하남시', '화성시'],
  '강원특별자치도': ['강릉시', '고성군', '동해시', '삼척시', '속초시', '양구군', '양양군', '영월군', '원주시', '인제군', '정선군', '철원군', '춘천시', '태백시', '평창군', '홍천군', '화천군', '횡성군'],
  '충청북도': ['괴산군', '단양군', '보은군', '영동군', '옥천군', '음성군', '제천시', '증평군', '진천군', '청주시상당구', '청주시서원구', '청주시청원구', '청주시흥덕구', '충주시'],
  '충청남도': ['계룡시', '공주시', '금산군', '논산시', '당진시', '부여군', '서산시', '서천군', '아산시', '예산군', '천안시동남구', '천안시서북구', '청양군', '태안군', '홍성군'],
  '전북특별자치도': ['고창군', '군산시', '김제시', '남원시', '무주군', '부안군', '순창군', '완주군', '익산시', '임실군', '장수군', '전주시덕진구', '전주시완산구', '정읍시', '진안군'],
  '전라남도': ['강진군', '고흥군', '곡성군', '광양시', '구례군', '나주시', '담양군', '목포시', '무안군', '보성군', '순천시', '신안군', '여수시', '영광군', '영암군', '완도군', '장성군', '장흥군', '진도군', '함평군', '해남군', '화순군'],
  '경상북도': ['경산시', '경주시', '고령군', '구미시', '김천시', '문경시', '봉화군', '상주시', '성주군', '안동시', '영덕군', '영양군', '영주시', '영천시', '예천군', '울릉군', '울진군', '의성군', '청도군', '청송군', '칠곡군', '포항시남구', '포항시북구'],
  '경상남도': ['거제시', '거창군', '고성군', '김해시', '남해군', '밀양시', '사천시', '산청군', '양산시', '의령군', '진주시', '창녕군', '창원시마산합포구', '창원시마산회원구', '창원시성산구', '창원시의창구', '창원시진해구', '통영시', '하동군', '함안군', '함양군', '합천군'],
  '제주특별자치도': ['서귀포시', '제주시']
};

// HOSPITAL_SIDO_PREFIX: 제거됨 (법정코드 기반 파일명으로 대체됨, 미사용 상수 정리)

export default function TrafficCarePage() {
  const [selectedSido, setSelectedSido] = useState('경기도');
  const [selectedGugun, setSelectedGugun] = useState('의정부시');
  const [loadedSido, setLoadedSido] = useState('');
  const [loadedGugun, setLoadedGugun] = useState('');
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState<AccidentZone[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [error, setError] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  
  // 병원 추가 필터
  const [onlyNight, setOnlyNight] = useState(false);
  const [onlyEmergency, setOnlyEmergency] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // 로컬 블로그 포스트 데이터 (칼럼 매핑용)
  const [blogPosts, setBlogPosts] = useState<any[]>([]);

  // 초기 로드 시 블로그 포스트만 가져오기 (지도는 사용자가 직접 지역 선택 후 분석 버튼 누를 때ꭌ 로드)
  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.ok ? res.json() : [])
      .then(data => setBlogPosts(data))
      .catch(err => console.warn('블로그 포스트 연동 로드 실패:', err));
  }, []);

  // 시도 변경 시 구군을 해당 시도의 첫번째 구군으로 리셋
  const handleSidoChange = (sidoVal: string) => {
    setSelectedSido(sidoVal);
    const districts = SIDO_GUGUN_MAP[sidoVal] || [];
    if (districts.length > 0) {
      setSelectedGugun(districts[0]);
    }
  };

  // 실시간 조회 실행
  const handleSearch = () => {
    fetchData(selectedSido, selectedGugun);
  };

  const fetchData = async (sidoName: string, gugunName: string) => {
    setLoading(true);
    setError('');
    setZones([]);
    setHospitals([]);
    setSelectedZoneId(null);
    setIsExpanded(false);

    const delayPromise = new Promise(resolve => setTimeout(resolve, 800));

    try {
      // 1. 도로교통공단 실시간 사고다발지역 데이터 호출
      const taasUrl = `/api/taas-accidents?sido=${encodeURIComponent(sidoName)}&gugun=${encodeURIComponent(gugunName)}`;
      const taasRes = await fetch(taasUrl);
      if (!taasRes.ok) {
        throw new Error(`교통사고 다발지역 실시간 조회 실패 (HTTP ${taasRes.status})`);
      }
      const taasData: AccidentZone[] = await taasRes.json();
      setZones(taasData);
      if (taasData.length > 0) {
        setSelectedZoneId(taasData[0].id);
      }

      // 2. 심평원(HIRA) 구군별 병원 데이터 비동기 로드
      const sidoCode = (standardData.TAAS_SIDO_CODES as Record<string, string>)[sidoName];
      let gugunCode = '';

      if (sidoCode && (standardData.TAAS_GUGUN_CODES as Record<string, Record<string, string>>)[sidoCode]) {
        const codes = (standardData.TAAS_GUGUN_CODES as Record<string, Record<string, string>>)[sidoCode];
        if (codes[gugunName]) {
          gugunCode = codes[gugunName];
        } else {
          const cleanGugun = gugunName.replace(/^(인천|대구|광주|대전|울산|부산|서울)/, '');
          if (cleanGugun.includes('부천')) {
            gugunCode = codes['부천시'] || '';
          } else if (cleanGugun.includes('화성')) {
            gugunCode = codes['화성시'] || '';
          } else {
            for (const [key, code] of Object.entries(codes)) {
              const cleanKey = key.replace('시', '');
              if (cleanGugun === key || cleanGugun === cleanKey || cleanGugun.includes(key) || key.includes(cleanGugun)) {
                gugunCode = code;
                break;
              }
            }
          }
        }
      }

      if (sidoCode && gugunCode) {
        const hiraUrl = `/data/hospitals/${sidoCode}-${gugunCode}.json`;
        const hiraRes = await fetch(hiraUrl);
        if (hiraRes.ok) {
          const hiraData: DistrictHospitals = await hiraRes.json();
          
          // 정형외과, 신경외과, 재활의학과, 마취통증의학과 등 주요 과목의 병원들만 병합
          const targetSpecialties = ['정형외과', '신경외과', '재활의학과', '마취통증의학과', '응급의학과'];
          let mergedHospitals: Hospital[] = [];

          if (hiraData && hiraData.specialties) {
            Object.entries(hiraData.specialties).forEach(([specName, specData]) => {
              if (targetSpecialties.includes(specName) && specData.hospitals) {
                mergedHospitals.push(...specData.hospitals);
              }
            });
          }
          
          // 병원 이름 중복 제거
          const uniqueHospitals = mergedHospitals.filter((item, index, self) =>
            self.findIndex(t => t.name === item.name) === index
          );

          setHospitals(uniqueHospitals);
        }
      }
      
      // 데이터가 완전히 동기화되어 받아와졌을 때만 렌더링 지역 변수를 변경합니다.
      setLoadedSido(sidoName);
      setLoadedGugun(gugunName);
      
      await delayPromise;
    } catch (e: any) {
      await delayPromise;
      console.error(e);
      setError(e.message || '데이터를 가져오는 도중 알 수 없는 통신 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // AI 3줄 요약 자동 생성기
  const getAiSummary = (zone: AccidentZone): string[] => {
    return [
      `해당 구역은 연간 총 ${zone.occurCount}건의 교통사고가 집중된 도로교통공단 지정 다발 위험 도로입니다.`,
      `사고 결과로 인해 사망 ${zone.deathCount}명, 중상 ${zone.seriousCount}명 등 총 ${zone.casualtyCount}명의 중증 사상자가 발생했습니다.`,
      `차량 통행량 대비 보행자 및 교차로 꼬리물기로 인한 골절/추간판탈출 손상 비율이 매우 높게 나타납니다.`
    ];
  };

  // 손해사정사 맞춤형 실무 코멘트
  const getPracticeComment = (zone: AccidentZone): string => {
    const name = zone.locationName;
    if (name.includes('보행자') || name.includes('횡단보도') || name.includes('초등학교') || name.includes('어린이')) {
      return '보행자 및 신호등 인근 접촉사고가 잦은 구역입니다. 보행자 과실 산정 시, 횡단보도와의 거리나 보행 신호 위반 여부에 따라 과실 비율 분쟁이 치열합니다. 특히 하반신 골절이나 무릎 십자인대 파열 등 고액 후유장해가 수반되기 쉬우므로, 보험사 제시금 합의서 서명 전 손해사정사와 반드시 상의하십시오.';
    }
    if (name.includes('이륜차') || name.includes('오토바이') || name.includes('자전거')) {
      return '배달 이륜차 및 자전거 충돌 사고 다발 구역입니다. 이륜차 사고는 헬멧 착용 여부에 따른 과실 상계나 보험 약관상 유상운송 면책(배달 대행 약관 위반) 주장이 주된 쟁점이 됩니다. 면책 통보를 받으셨더라도 구제할 수 있는 실무 방안이 있으니 초기 단계부터 전문가와 논의해야 합니다.';
    }
    return '교차로 내 신호위반 및 진로변경 꼬리물기 사고가 집중되는 위치입니다. 가해자와 피해자 차량 간의 선진입 여부, 방향지시등 점등 타이밍에 따라 과실 비율이 7:3에서 10:0까지 요동칩니다. 보험사 제시 과실을 무조건 수용하지 마시고 대법원 과실 상계 판례 요소를 정확히 대입해야 손해를 막을 수 있습니다.';
  };

  // 지능형 보상 칼럼 매칭
  const getMatchedColumn = (zone: AccidentZone) => {
    if (blogPosts.length === 0) return null;
    const name = zone.locationName;
    
    let keyword = '교통사고';
    if (name.includes('보행자') || name.includes('횡단보도')) {
      keyword = '배상책임';
    } else if (name.includes('이륜차') || name.includes('오토바이')) {
      keyword = '장해';
    } else {
      keyword = '교통사고';
    }

    const matched = blogPosts.find(post => 
      post.title.toLowerCase().includes(keyword) || 
      post.content.toLowerCase().includes(keyword)
    );

    return matched || blogPosts[0] || null;
  };

  // 필터링된 병원 목록 구하기
  const getFilteredHospitals = () => {
    let list = hospitals;
    
    if (onlyNight) {
      list = list.filter(h => 
        h.name.includes('한방') || 
        h.name.includes('한의원') || 
        h.address.includes('한방')
      );
    }

    if (onlyEmergency) {
      list = list.filter(h => 
        h.name.includes('종합') || 
        (h.name.includes('병원') && !h.name.includes('의원') && !h.name.includes('한의'))
      );
    }

    return list;
  };

  // 상담 신청 Kakao 링크 빌더
  const getKakaoLink = (zone: AccidentZone) => {
    const text = `안녕하세요 대표님, 보상스쿨 교통사고 케어센터에서 [${loadedSido} ${loadedGugun} - ${zone.locationName}] 사고 위험 지점 정보를 보고 무료 손해사정 상담을 신청합니다.`;
    return `https://open.kakao.com/o/sWeszp7?text=${encodeURIComponent(text)}`;
  };

  const filteredHospitals = getFilteredHospitals();
  
  // 현재 선택된 구역(Active Zone) 탐색
  const activeZone = zones.find(z => z.id === selectedZoneId) || zones[0] || null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      
      {/* 💡 상단 정보성 띠 배너 (에메랄드 그린 포인트 테마 - 패밀리룩) */}
      <div className="bg-[#137333] text-white px-4 py-3 rounded-2xl flex items-center justify-between flex-wrap gap-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <span className="text-lg shrink-0"><IconShield className="w-5 h-5" /></span>
          <div className="text-xs sm:text-sm font-extrabold tracking-tight">
            <span className="underline decoration-wavy mr-1.5">[실시간 안전망]</span>
            도로교통공단 안전 데이터와 동네 우수 신경/정형외과 병원을 연동해 우리 동네 안전 지도를 분석합니다.
          </div>
        </div>
        <button 
          onClick={() => {
            const el = document.getElementById('search-box-area');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
          className="text-[10px] font-black uppercase tracking-wider bg-white text-[#137333] px-2.5 py-1 rounded-lg border border-white hover:bg-green-50 transition-colors cursor-pointer"
        >
          지역 변경하기
        </button>
      </div>

      {/* 헤더 타이틀 (다른 검색센터와 완벽한 패밀리룩 일치) */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202124] dark:text-[#e8eaed] tracking-tight">
          보상스쿨 <span className="bg-gradient-to-r from-[#137333] to-[#0b6623] bg-clip-text text-transparent">교통사고 로컬 안심케어 센터</span>
        </h1>
        <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-lg mx-auto leading-relaxed font-medium">
          자주 오가는 길모퉁이와 집 근처 사거리는 안전할까요? 사시는 행정구역을 선택하시면 실시간 교통사고 다발지역 통계와 인근 전문 의료기관을 안내해 드립니다.
        </p>
      </div>

      {/* 행정구역 선택 박스 영역 */}
      <div id="search-box-area" className="bg-white dark:bg-[#202124] p-5 sm:p-7 rounded-3xl border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-4">
        <div className="flex gap-3 flex-col sm:flex-row items-stretch">
          <div className="flex-1 grid grid-cols-2 gap-3">
            <div className="flex flex-col justify-center px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/2">
              <label className="block text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">시/도 선택</label>
              <select
                value={selectedSido}
                onChange={(e) => handleSidoChange(e.target.value)}
                className="w-full bg-transparent focus:outline-none dark:text-white text-xs font-bold py-0.5 cursor-pointer"
              >
                {Object.keys(SIDO_GUGUN_MAP).map(sido => (
                  <option key={sido} value={sido} className="dark:bg-[#303134]">{sido}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col justify-center px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/2">
              <label className="block text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">구/군 선택</label>
              <select
                value={selectedGugun}
                onChange={(e) => setSelectedGugun(e.target.value)}
                className="w-full bg-transparent focus:outline-none dark:text-white text-xs font-bold py-0.5 cursor-pointer"
              >
                {(SIDO_GUGUN_MAP[selectedSido] || []).map(gugun => (
                  <option key={gugun} value={gugun} className="dark:bg-[#303134]">{gugun}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-3 sm:py-3.5 rounded-xl bg-[#137333] hover:bg-[#0b6623] text-white font-bold text-sm tracking-wide shadow-md transition-colors cursor-pointer disabled:opacity-50 min-w-[120px] flex items-center justify-center"
          >
            {loading ? '분석 중...' : '실시간 지역 분석'}
          </button>
        </div>
      </div>

      {/* 실시간 로딩바 (에메랄드 그린 테마) */}
      {loading && (
        <div className="bg-white dark:bg-[#202124] rounded-3xl py-16 px-4 text-center border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
          <div className="inline-block w-9 h-9 border-4 border-[#137333] border-t-transparent rounded-full animate-spin" />
          <div className="text-sm font-bold text-[#202124] dark:text-[#e8eaed]">도로교통공단 실시간 교통 데이터 및 지역 의료망 분석 중...</div>
          <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] max-w-xs mx-auto leading-relaxed">
            전국 도로의 위험 위치 좌표와 상해 요인을 융합하고, 인근 신경/정형외과 병원 정보를 실시간으로 매칭하고 있습니다.
          </p>
        </div>
      )}

      {/* 에러 피드백 */}
      {error && !loading && (
        <div className="bg-white dark:bg-[#202124] rounded-3xl py-12 px-5 border border-gray-100 dark:border-white/5 shadow-sm text-center font-bold text-sm text-rose-600 dark:text-rose-400">
          ⚠️ {error}
        </div>
      )}

      {/* 분석 결과 단일 카드 및 상단 구역 드롭다운 선택 */}
      {!loading && zones.length > 0 && activeZone && (
        <div className="space-y-6">
          <h2 className="text-base sm:text-lg font-bold text-[#202124] dark:text-[#e8eaed] border-b border-gray-100 dark:border-white/5 pb-2 flex justify-between items-center">
            <span className="text-[#137333] dark:text-[#81c995] font-extrabold">
              📍 {loadedGugun} 실시간 교통사고 다발 위험 분석 리포트
            </span>
            <span className="text-[10px] text-gray-400 font-medium">
              {zones[0]?.isFallback ? '참고용 샘플' : '실시간 공공 데이터'}
            </span>
          </h2>

          {/* 데이터 출처 안내 배너 — 실제/샘플 여부에 따라 자동 전환 */}
          {zones[0]?.isFallback ? (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-amber-50 dark:bg-amber-950/15 border border-amber-200/50 dark:border-amber-700/30 text-xs text-amber-700 dark:text-amber-400 font-semibold leading-relaxed">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>현재 표시된 사고 다발 위치와 통계는 <strong>API 연동 대기 중인 참고용 샘플 데이터</strong>입니다. 실제 도로교통공단 데이터와 다를 수 있으며, 지도 핀포인트는 해당 구역 중심부 근방에 표시됩니다.</span>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-green-50 dark:bg-green-950/15 border border-green-200/50 dark:border-green-700/30 text-xs text-[#137333] dark:text-[#81c995] font-semibold leading-relaxed">
              <span className="shrink-0 mt-0.5">✅</span>
              <span><strong>도로교통공단(TAAS) 실시간 공식 데이터</strong>를 기반으로 합니다. 지도 핀포인트는 실제 교통사고 다발 지점의 공식 GPS 좌표입니다.</span>
            </div>
          )}

          {/* 단일 카드 완결형 레이아웃 */}
          <article className="bg-white dark:bg-[#202124] rounded-3xl border border-gray-100 dark:border-white/5 shadow-md p-6 sm:p-7 flex flex-col space-y-5">
            
            {/* 위험 구역 선택 드롭다운 박스 (탑3를 드롭다운 형태로 한박스에 통합) */}
            <div className="bg-green-50/10 dark:bg-green-950/5 p-4.5 rounded-2xl border border-green-100/20 dark:border-white/5 space-y-2">
              <label className="block text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                ⚠️ 위험 다발 구역 선택 (교차로별 위험 순위 Top {zones.length})
              </label>
              <div className="relative">
                <select
                  value={selectedZoneId || ''}
                  onChange={(e) => setSelectedZoneId(e.target.value)}
                  className="w-full bg-white dark:bg-[#303134] text-xs sm:text-sm font-extrabold text-gray-800 dark:text-gray-100 px-3.5 py-3 rounded-xl border border-gray-200 dark:border-white/5 focus:outline-none focus:border-[#137333] cursor-pointer appearance-none shadow-sm pr-10"
                >
                  {zones.map((zone, index) => (
                    <option key={zone.id} value={zone.id}>
                      [위험 {index + 1}순위] {zone.locationName} (사고 {zone.occurCount}건 / 사상 {zone.casualtyCount}명)
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* 카드 본문 콘텐츠: 상단 메타 바 */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-white/5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-green-50 dark:bg-green-950/20 text-[#137333] dark:text-[#81c995] text-[10px] font-bold border border-green-100/30">
                  사고 {activeZone.occurCount}건
                </span>
                <span className="px-2.5 py-1 rounded bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold border border-rose-100/30">
                  사상자 {activeZone.casualtyCount}명
                </span>
                {activeZone.deathCount > 0 && (
                  <span className="px-2.5 py-1 rounded bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-[10px] font-bold border border-red-100/30">
                    사망 {activeZone.deathCount}명
                  </span>
                )}
                {activeZone.seriousCount > 0 && (
                  <span className="px-2.5 py-1 rounded bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-100/30">
                    중상 {activeZone.seriousCount}명
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500">
                위경도: N {activeZone.latitude.toFixed(5)}°, E {activeZone.longitude.toFixed(5)}°
              </span>
            </div>

            {/* 구역 명칭 대형 타이틀 */}
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#202124] dark:text-[#e8eaed] leading-snug">
                {activeZone.locationName}
              </h3>
            </div>

            {/* 구글 지도 임베드 시각화 — 위경도 좌표 직접 방식으로 100% 핀포인트 보장 */}
            <div className="w-full h-[320px] rounded-2xl overflow-hidden border border-gray-150 dark:border-white/5 shadow-sm mt-1 bg-gray-50">
              <iframe
                key={`${loadedSido}-${loadedGugun}-${activeZone.id}`}
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://maps.google.com/maps?q=${activeZone.latitude},${activeZone.longitude}&z=16&output=embed`}
                allowFullScreen
                loading="lazy"
              />
            </div>

            {/* 📋 안심 의료기관 정보 아코디언 접이식 리스트 (대표님 피드백 반영 2안) */}
            {hospitals.length > 0 && (
              <div className="space-y-3 mt-2">
                {/* 토글 버튼 바 */}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 hover:bg-gray-100 dark:bg-white/2 dark:hover:bg-white/5 rounded-2xl border border-gray-250 dark:border-white/5 cursor-pointer transition-colors text-xs font-black text-gray-800 dark:text-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[#137333]"><IconHospital className="w-4.5 h-4.5" /></span>
                    <span>{loadedGugun} 추천 전문병원 ({filteredHospitals.length}곳)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 font-bold">
                    <span>{isExpanded ? '접기' : '목록 보기'}</span>
                    <svg
                      className={`w-4 h-4 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth="2.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </button>

                {/* 펼쳐졌을 때의 병원 리스트 */}
                {isExpanded && (
                  <div className="p-4 rounded-3xl border border-gray-100 dark:border-white/5 bg-gray-50/10 dark:bg-white/1 space-y-4">
                    {/* 필터 칩 */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-gray-100 dark:border-white/5">
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">원하시는 진료 조건의 병원만 걸러볼 수 있습니다.</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setOnlyNight(!onlyNight)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold transition-all border cursor-pointer flex items-center gap-1 ${
                            onlyNight 
                              ? 'bg-green-50 dark:bg-green-950/20 text-[#137333] dark:text-[#81c995] border-[#137333]/30' 
                              : 'bg-white dark:bg-[#303134] text-gray-500 border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/5'
                          }`}
                        >
                          <span>🌙</span> 주말진료
                        </button>
                        <button
                          onClick={() => setOnlyEmergency(!onlyEmergency)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold transition-all border cursor-pointer flex items-center gap-1 ${
                            onlyEmergency 
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-[#0b6623] dark:text-[#81c995] border-[#0b6623]/30' 
                              : 'bg-white dark:bg-[#303134] text-gray-500 border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/5'
                          }`}
                        >
                          <span>🏥</span> 대형병원
                        </button>
                      </div>
                    </div>

                    {/* 세로형 병원 목록 그리드 (2열 구조로 PC와 모바일 모두에 시원하게 매칭) */}
                    {filteredHospitals.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[360px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-thumb]:rounded-full">
                        {filteredHospitals.map((h, idx) => {
                          const isWeekend = h.name.includes('한방') || h.name.includes('한의');
                          const isBig = h.name.includes('종합') || (h.name.includes('병원') && !h.name.includes('의원'));
                          
                          return (
                            <div 
                              key={idx}
                              className="p-4 rounded-2xl border border-gray-250 dark:border-white/5 bg-white dark:bg-[#202124] flex flex-col justify-between space-y-3 shadow-sm hover:border-[#137333]/30 dark:hover:border-[#137333]/50 transition-all duration-200"
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-black text-gray-800 dark:text-gray-100 tracking-tight leading-tight">{h.name}</span>
                                  {isWeekend && (
                                    <span className="px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-950/20 text-[#137333] dark:text-[#81c995] text-[8px] font-black border border-green-100/10">
                                      주말진료
                                    </span>
                                  )}
                                  {isBig && (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-[#0b6623] dark:text-[#81c995] text-[8px] font-black border border-emerald-100/10">
                                      대형병원
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed line-clamp-2 min-h-[30px]">{h.address}</p>
                              </div>
                              
                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-white/5 shrink-0">
                                {h.tel ? (
                                  <div className="text-[10px] font-bold text-[#137333] dark:text-[#81c995] flex items-center gap-1">
                                    <IconPhone className="w-3.5 h-3.5" />
                                    <span>{h.tel}</span>
                                  </div>
                                ) : (
                                  <span className="text-[9px] text-gray-400 font-medium">전화번호 정보 없음</span>
                                )}
                                {h.tel && (
                                  <a
                                    href={`tel:${h.tel}`}
                                    className="px-2.5 py-1 text-[9px] font-black text-white bg-[#137333] hover:bg-[#0b6623] rounded-lg transition-colors cursor-pointer"
                                  >
                                    전화 연결
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-xs font-bold text-gray-400 dark:text-gray-500 bg-white dark:bg-[#202124] rounded-2xl border border-dashed border-gray-200 dark:border-white/5">
                        필터 조건에 부합하는 병원 정보가 없습니다.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 🧠 AI 3줄 요약 카드 (에메랄드 그린 패밀리룩) */}
            <div className="bg-green-50/20 dark:bg-green-950/10 p-4 rounded-2xl border border-green-100/30 dark:border-green-900/25 space-y-2.5 mt-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#137333] dark:text-[#81c995]">
                <span className="text-sm"><IconBrain className="w-4 h-4" /></span>
                AI 실시간 사고위험 분석 보고
              </div>
              <ul className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium space-y-1.5 list-disc pl-4">
                {getAiSummary(activeZone).map((line, sumIdx) => (
                  <li key={sumIdx} className="marker:text-[#137333]">{line}</li>
                ))}
              </ul>
            </div>

            {/* 👨‍🏫 손해사정사 실무 코멘트 (황색 전문가 박스 패밀리룩) */}
            <div className="bg-[#fcf8e3]/30 dark:bg-[#fcf8e3]/5 p-4 rounded-2xl border border-[#faebcc]/50 dark:border-[#faebcc]/10 space-y-2 mt-1">
              <div className="flex items-center gap-1.5 text-xs font-black text-[#8a6d3b] dark:text-[#c4a86f]">
                <span className="text-sm"><IconBriefcase className="w-4 h-4" /></span>
                보상스쿨 손해사정사 실무 코멘트
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium pl-1">
                {getPracticeComment(activeZone)}
              </p>
            </div>

            {/* 액션 버튼 영역 (가로 분할 가독성 극대화) */}
            <div className="flex items-center gap-3 pt-3 border-t border-gray-55 dark:border-white/2 flex-wrap sm:flex-nowrap">
              {(() => {
                const matchedCol = getMatchedColumn(activeZone);
                return matchedCol ? (
                  <Link
                    href={`/blog/${matchedCol.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-[#202124] dark:text-[#e8eaed] text-xs font-bold rounded-xl transition-colors cursor-pointer border border-gray-200/40 dark:border-white/5"
                  >
                    📖 사고원인 맞춤 칼럼 읽기 (1건)
                  </Link>
                ) : (
                  <Link
                    href="/blog"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-[#202124] dark:text-[#e8eaed] text-xs font-bold rounded-xl transition-colors cursor-pointer border border-gray-200/40 dark:border-white/5"
                  >
                    📖 보상스쿨 전체 칼럼 읽기
                  </Link>
                );
              })()}
              <a
                href={getKakaoLink(activeZone)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center py-2.5 bg-[#137333] hover:bg-[#0b6623] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                💬 내 과실·보상 무료 상담 (카톡)
              </a>
            </div>
          </article>


        </div>
      )}

      {/* ⚠️ 법률 면책 고지 배너 (패밀리룩 적용) */}
      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-semibold leading-relaxed shadow-sm mt-8">
        <span className="text-base shrink-0 mt-0.5">⚠️</span>
        <span>본 교통사고 로컬 안심케어 서비스는 도로교통공단 및 심평원의 공공 데이터에 기반하여 참고용으로 제공되는 정보로, 법적 판결이나 배상 합의에 직접적인 대행 행위를 하지 않으며, 실제 사고 시에는 전문 손해사정사의 검토를 받으셔야 권리를 온전히 확보할 수 있습니다.</span>
      </div>
    </div>
  );
}
