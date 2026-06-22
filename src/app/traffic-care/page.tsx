'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// --- SVG Icons (이모지 대신 사용되는 고품격 전문 아이콘 세트) ---
function IconShield({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconMapPin({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconBrain({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-3.88 2.5 2.5 0 0 1 0-3.12A2.5 2.5 0 0 1 9.5 2zM14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-3.88 2.5 2.5 0 0 0 0-3.12A2.5 2.5 0 0 0 14.5 2z" />
    </svg>
  );
}

function IconBriefcase({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function IconHospital({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function IconPhone({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function IconAlertTriangle({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconSearch({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconNavigation({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}

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

// 1-1. 심평원 파일명 구조(서울, 경기 등)와 한글 시도 명칭을 매핑하는 사전
const HOSPITAL_SIDO_PREFIX: Record<string, string> = {
  '서울특별시': '서울',
  '부산광역시': '부산',
  '대구광역시': '대구',
  '인천광역시': '인천',
  '광주광역시': '광주',
  '대전광역시': '대전',
  '울산광역시': '울산',
  '세종특별자치시': '세종특별자치시',
  '경기도': '경기',
  '강원특별자치도': '강원',
  '충청북도': '충북',
  '충청남도': '충남',
  '전북특별자치도': '전북',
  '전라남도': '전남',
  '경상북도': '경북',
  '경상남도': '경남',
  '제주특별자치도': '제주'
};

export default function TrafficCarePage() {
  const [selectedSido, setSelectedSido] = useState('경기도');
  const [selectedGugun, setSelectedGugun] = useState('의정부시');
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState<AccidentZone[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [error, setError] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  
  // 병원 추가 필터
  const [onlyNight, setOnlyNight] = useState(false);
  const [onlyEmergency, setOnlyEmergency] = useState(false);

  // 로컬 블로그 포스트 데이터 (칼럼 매핑용)
  const [blogPosts, setBlogPosts] = useState<any[]>([]);

  // 초기 로드 시 블로그 포스트 가져오기 및 최초 경기도 의정부시 로드
  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.ok ? res.json() : [])
      .then(data => setBlogPosts(data))
      .catch(err => console.warn('블로그 포스트 연동 로드 실패:', err));

    fetchData('경기도', '의정부시');
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
      const sidoPrefix = HOSPITAL_SIDO_PREFIX[sidoName] || sidoName;
      const hiraUrl = `/data/hospitals/${encodeURIComponent(sidoPrefix)}-${encodeURIComponent(gugunName)}.json`;
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
    const text = `안녕하세요 대표님, 보상스쿨 교통사고 케어센터에서 [${selectedSido} ${selectedGugun} - ${zone.locationName}] 사고 위험 지점 정보를 보고 무료 손해사정 상담을 신청합니다.`;
    return `https://open.kakao.com/o/sWeszp7?text=${encodeURIComponent(text)}`;
  };

  const activeZone = zones.find(z => z.id === selectedZoneId);
  const filteredHospitals = getFilteredHospitals();

  return (
    <div className="space-y-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      
      {/* 💡 상단 정보성 띠 배너 - Glassmorphism & Premium Emerald Gradient */}
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 text-white px-6 py-4.5 rounded-[24px] flex items-center justify-between flex-wrap gap-4 shadow-[0_10px_30px_rgba(16,185,129,0.15)] border border-emerald-500/20"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl shrink-0 backdrop-blur-md">
            <IconShield className="w-5 h-5 text-emerald-100" />
          </div>
          <div className="text-xs sm:text-sm font-semibold tracking-tight leading-relaxed max-w-2xl">
            <span className="bg-white/20 text-white font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded mr-2">공식 데이터 연동</span>
            도로교통공단 다발지 통계와 보상스쿨 손해사정 전문 지식을 융합하여 우리 동네 위험 도로와 맞춤형 보상 가이드를 실시간 매핑합니다.
          </div>
        </div>
        <button 
          onClick={() => {
            const el = document.getElementById('region-selector-area');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
          className="text-xs font-bold bg-white text-emerald-700 px-4 py-2 rounded-xl hover:bg-emerald-50 active:scale-95 transition-all shadow-sm cursor-pointer whitespace-nowrap"
        >
          지역 변경하기
        </button>
      </motion.div>

      {/* 헤더 및 히어로 셀렉터 카드 */}
      <motion.div 
        id="region-selector-area" 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative overflow-hidden bg-gradient-to-br from-emerald-500/5 via-white to-teal-500/5 dark:from-emerald-950/10 dark:via-[#202124] dark:to-[#202124] p-8 sm:p-12 rounded-[32px] border border-emerald-500/10 dark:border-white/5 shadow-[0_20px_50px_rgba(16,185,129,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -z-10" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-teal-500/5 rounded-full blur-3xl -z-10" />

        <div className="max-w-2xl mx-auto text-center space-y-4 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold tracking-wide uppercase border border-emerald-100/50 dark:border-emerald-900/30">
            <IconMapPin className="w-3.5 h-3.5" />
            교통사고 로컬 안심케어 서비스
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#202124] dark:text-[#e8eaed] tracking-tight leading-tight">
            우리 동네 <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">사고 위험 진단 및 안전망</span>
          </h1>
          <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed max-w-xl mx-auto">
            매일 걷는 횡단보도와 교차로는 과연 안전할까요? 사시는 곳의 행정구역을 선택하시면 실시간 교통사고 다발지역 분석과 인근 전문 병원을 매핑해 드립니다.
          </p>
        </div>

        {/* 2단계 실시간 지역 필터 검색창 */}
        <div className="max-w-lg mx-auto bg-white dark:bg-[#303134] p-2.5 rounded-2xl sm:rounded-full border border-gray-150 dark:border-white/5 shadow-md flex flex-col sm:flex-row gap-2 items-stretch">
          <div className="flex-1 grid grid-cols-2 gap-2 pl-2">
            <div className="flex flex-col justify-center py-1">
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5 ml-1">시/도</label>
              <select
                value={selectedSido}
                onChange={(e) => handleSidoChange(e.target.value)}
                className="w-full bg-transparent focus:outline-none dark:text-white text-sm font-semibold py-0.5 cursor-pointer appearance-none"
              >
                {Object.keys(SIDO_GUGUN_MAP).map(sido => (
                  <option key={sido} value={sido} className="dark:bg-[#303134]">{sido}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col justify-center border-l border-gray-100 dark:border-white/5 pl-3 py-1">
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5 ml-1">시/군/구</label>
              <select
                value={selectedGugun}
                onChange={(e) => setSelectedGugun(e.target.value)}
                className="w-full bg-transparent focus:outline-none dark:text-white text-sm font-semibold py-0.5 cursor-pointer appearance-none"
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
            className="px-6 py-3.5 sm:py-2.5 rounded-xl sm:rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm tracking-wide shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <IconSearch className="w-4 h-4" />
            {loading ? '분석 중...' : '실시간 지역 분석'}
          </button>
        </div>
      </motion.div>

      {/* 로딩 표시기 */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-[#202124] rounded-3xl py-20 px-6 text-center border border-emerald-500/10 dark:border-white/5 shadow-[0_10px_35px_rgba(0,0,0,0.02)] space-y-4"
          >
            <div className="relative inline-flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              <div className="absolute w-6 h-6 bg-emerald-600/10 rounded-full" />
            </div>
            <div className="text-base font-bold text-[#202124] dark:text-[#e8eaed]">
              도로교통공단 실시간 교통망 및 인근 전문의료 정보 매핑 중...
            </div>
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] max-w-sm mx-auto leading-relaxed">
              전국 도로의 교통 위험 구역 좌표를 확보하고, 상해 보상이 용이한 뼈·신경 특화 추천 병원을 실시간 필터링하고 있습니다.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 에러 피드백 */}
      {error && !loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-rose-500/5 border border-rose-500/10 text-rose-600 dark:text-rose-400 rounded-3xl py-12 px-6 text-center font-bold text-sm shadow-inner flex flex-col items-center gap-2"
        >
          <IconAlertTriangle className="w-8 h-8 text-rose-500" />
          <span>오류가 발생했습니다: {error}</span>
        </motion.div>
      )}

      {/* 메인 콘텐츠 그리드 레이아웃 */}
      {!loading && zones.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* [좌측 영역]: 사고 위험 지역 리스트 + 주변 우수 추천 병원 목록 (5칸 배정) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* 1. 사고 다발 구역 리스트 */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white dark:bg-[#202124] p-6 rounded-[24px] border border-gray-150 dark:border-white/5 shadow-[0_10px_35px_rgba(0,0,0,0.03)] space-y-4"
            >
              <h2 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest pb-3 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                <span className="flex items-center gap-1.5">
                  <IconMapPin className="w-4 h-4 text-emerald-600" />
                  {selectedGugun} 위험 도로 Top {zones.length}
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-0.5 rounded font-black border border-emerald-100/30">
                  실시간 연동
                </span>
              </h2>
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {zones.map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => setSelectedZoneId(zone.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-3 hover:translate-x-0.5 ${
                      selectedZoneId === zone.id
                        ? 'bg-emerald-500/5 border-emerald-500 dark:bg-emerald-500/10 dark:border-emerald-400 shadow-[0_4px_15px_rgba(16,185,129,0.08)]'
                        : 'bg-white border-gray-100 dark:bg-[#202124] dark:border-white/5 hover:bg-emerald-500/2 dark:hover:bg-emerald-500/5 hover:border-emerald-500/20'
                    }`}
                  >
                    <span className="text-xs sm:text-sm font-bold text-[#202124] dark:text-[#e8eaed] line-clamp-2 leading-snug">
                      {zone.locationName}
                    </span>
                    <div className="flex gap-2 items-center flex-wrap">
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-100/30 dark:border-emerald-900/30">
                        사고 {zone.occurCount}건
                      </span>
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-100/30 dark:border-rose-900/30">
                        사상자 {zone.casualtyCount}명
                      </span>
                      {zone.deathCount > 0 && (
                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded border border-red-100/30 dark:border-red-900/30">
                          사망 {zone.deathCount}명
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* 2. 우리 동네 추천 병원 리스트 */}
            {hospitals.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="bg-white dark:bg-[#202124] p-6 rounded-[24px] border border-gray-150 dark:border-white/5 shadow-[0_10px_35px_rgba(0,0,0,0.03)] space-y-4"
              >
                <div className="flex flex-col gap-3 pb-3 border-b border-gray-100 dark:border-white/5">
                  <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <IconHospital className="w-4 h-4 text-emerald-600" />
                    {selectedGugun} 뼈·신경 특화 추천 의료기관
                  </h3>
                  
                  {/* 필터 체크박스 */}
                  <div className="flex gap-4 text-[11px] font-bold text-gray-500">
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={onlyNight}
                        onChange={(e) => setOnlyNight(e.target.checked)}
                        className="rounded border-gray-300 dark:border-white/10 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      주말진료 병원만
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={onlyEmergency}
                        onChange={(e) => setOnlyEmergency(e.target.checked)}
                        className="rounded border-gray-300 dark:border-white/10 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      종합 대형병원만
                    </label>
                  </div>
                </div>

                {/* 병원 카드 나열 */}
                <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {filteredHospitals.length > 0 ? (
                    filteredHospitals.map((h, idx) => {
                      const isWeekend = h.name.includes('한방') || h.name.includes('한의');
                      const isBig = h.name.includes('종합') || (h.name.includes('병원') && !h.name.includes('의원'));
                      
                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/20 dark:bg-white/2 hover:border-emerald-500/20 hover:bg-emerald-500/2 dark:hover:bg-emerald-500/5 transition-all flex flex-col justify-between space-y-2.5"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-gray-800 dark:text-gray-100">{h.name}</span>
                              {isWeekend && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold border border-emerald-500/10">
                                  주말진료
                                </span>
                              )}
                              {isBig && (
                                <span className="px-1.5 py-0.5 rounded bg-teal-500/5 text-teal-600 dark:text-teal-400 text-[9px] font-bold border border-teal-500/10">
                                  대형병원
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{h.address}</p>
                          </div>
                          {h.tel && (
                            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <IconPhone className="w-3 h-3" />
                              <span>{h.tel}</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center text-xs font-bold text-gray-400 dark:text-gray-500">
                      필터 조건에 부합하는 병원 정보가 없습니다.
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* [우측 영역]: 상세 분석 및 스코어보드 대시보드 + 지도 + AI요약 + 손사코멘트 (7칸 배정) */}
          <div className="lg:col-span-7 space-y-6">
            {activeZone && (
              <motion.div 
                key={activeZone.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="bg-white dark:bg-[#202124] p-6 sm:p-8 rounded-[24px] border border-gray-150 dark:border-white/5 shadow-[0_10px_35px_rgba(0,0,0,0.03)] space-y-6"
              >
                
                {/* 1. 위험 지점 헤더 정보 */}
                <div className="pb-4 border-b border-gray-100 dark:border-white/5">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-rose-500/5 text-rose-600 dark:text-rose-400 text-[10px] font-extrabold border border-rose-500/10">
                    <IconAlertTriangle className="w-3 h-3" />
                    교통안전 종합 위험 지대
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#202124] dark:text-[#e8eaed] mt-2.5 leading-snug">
                    {activeZone.locationName}
                  </h3>
                </div>

                {/* 2. 대시보드형 통계 스코어보드 (시각화 개선) */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 rounded-2xl p-4 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">사고 발생 강도</span>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400">{activeZone.occurCount}</span>
                      <span className="text-[10px] font-bold text-gray-500">건</span>
                    </div>
                  </div>
                  <div className="bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/10 rounded-2xl p-4 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">총 사상자 규모</span>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-400">{activeZone.casualtyCount}</span>
                      <span className="text-[10px] font-bold text-gray-500">명</span>
                    </div>
                  </div>
                  <div className="bg-gray-500/5 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">사망/중상 비율</span>
                    <div className="mt-2">
                      <div className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        사망 <span className="text-red-500 font-extrabold">{activeZone.deathCount}</span> / 중상 <span className="text-amber-500 font-extrabold">{activeZone.seriousCount}</span>
                      </div>
                      {/* 미니 가로바 그래프 */}
                      <div className="w-full bg-gray-200 dark:bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden flex">
                        <div 
                          className="bg-red-500 h-full" 
                          style={{ width: `${activeZone.casualtyCount ? (activeZone.deathCount / activeZone.casualtyCount) * 100 : 0}%` }}
                        />
                        <div 
                          className="bg-amber-500 h-full" 
                          style={{ width: `${activeZone.casualtyCount ? (activeZone.seriousCount / activeZone.casualtyCount) * 100 : 0}%` }}
                        />
                        <div 
                          className="bg-emerald-500 h-full" 
                          style={{ width: `${activeZone.casualtyCount ? ((activeZone.casualtyCount - activeZone.deathCount - activeZone.seriousCount) / activeZone.casualtyCount) * 100 : 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. 구글 지도 임베드 시각화 (높이 및 세련도 개선) */}
                <div className="w-full rounded-[24px] overflow-hidden border border-gray-150 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] relative bg-gray-100">
                  {/* 플로팅 GPS 위젯 */}
                  <div className="absolute top-3 left-3 bg-white/90 dark:bg-[#202124]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-gray-100 dark:border-white/5 text-[10px] font-bold text-gray-500 flex items-center gap-1.5 shadow-sm z-10 select-none">
                    <IconNavigation className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    <span>N {activeZone.latitude.toFixed(4)}°, E {activeZone.longitude.toFixed(4)}°</span>
                  </div>
                  
                  <iframe
                    width="100%"
                    height="340"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://maps.google.com/maps?q=${activeZone.latitude},${activeZone.longitude}&z=16&output=embed`}
                    allowFullScreen
                    loading="lazy"
                  />
                </div>

                {/* 4. AI 3줄 요약 카드 */}
                <div className="bg-emerald-500/3 dark:bg-emerald-500/5 p-6 rounded-[22px] border border-emerald-500/10 space-y-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <div className="p-1 bg-emerald-500/10 rounded-lg">
                      <IconBrain className="w-4 h-4" />
                    </div>
                    <span>인공지능(AI) 실시간 사고위험 분석 보고</span>
                  </div>
                  <ul className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-semibold space-y-2 list-disc pl-4">
                    {getAiSummary(activeZone).map((line, idx) => (
                      <li key={idx} className="marker:text-emerald-600">{line}</li>
                    ))}
                  </ul>
                </div>

                {/* 5. 손해사정사 코멘트 카드 (골드 엠버 톤) */}
                <div className="bg-amber-500/3 dark:bg-amber-500/5 p-6 rounded-[22px] border border-amber-500/10 space-y-3.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                    <div className="p-1 bg-amber-500/10 rounded-lg">
                      <IconBriefcase className="w-4 h-4" />
                    </div>
                    <span>보상스쿨 실무 손해사정 전략 족보</span>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-semibold pl-1">
                    {getPracticeComment(activeZone)}
                  </p>
                </div>

                {/* 6. 액션 버튼 영역 */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-white/5 flex-col sm:flex-row">
                  {(() => {
                    const matchedCol = getMatchedColumn(activeZone);
                    if (matchedCol) {
                      return (
                        <Link
                          href={`/blog/${matchedCol.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:flex-1 text-center py-3.5 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-2xl border border-gray-100 dark:border-white/5 transition-all cursor-pointer shadow-sm"
                        >
                          📖 사고유형 분석 칼럼 읽기 (1건)
                        </Link>
                      );
                    } else {
                      return (
                        <Link
                          href="/blog"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:flex-1 text-center py-3.5 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-2xl border border-gray-100 dark:border-white/5 transition-all cursor-pointer shadow-sm"
                        >
                          📖 보상스쿨 전체 보상지식
                        </Link>
                      );
                    }
                  })()}
                  <a
                    href={getKakaoLink(activeZone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:flex-1 text-center py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    💬 내 과실·보상 무료 상담 (카톡)
                  </a>
                </div>

              </motion.div>
            )}
          </div>

        </div>
      )}

      {/* ⚠️ 법률 면책 고지 배너 */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-amber-500/5 border border-amber-500/10 text-amber-700 dark:text-amber-400 p-5 rounded-2xl flex items-start gap-3.5 text-xs font-semibold leading-relaxed shadow-sm"
      >
        <div className="p-1 bg-amber-500/10 rounded-lg shrink-0 mt-0.5">
          <IconAlertTriangle className="w-4 h-4" />
        </div>
        <span>
          본 교통사고 로컬 안심케어 서비스는 도로교통공단 및 심평원의 공공 데이터에 기반하여 보상 참고용으로 제공되는 정보입니다. 실제 사고 상황에서의 과실 비율 산정 및 배상액 계산은 개인의 구체적인 사고 경위와 기왕증(과거 질병)에 따라 달라질 수 있으므로, 반드시 합의서 조율 전에 전문 손해사정인의 검토를 받으셔야 합니다.
        </span>
      </motion.div>
    </div>
  );
}
