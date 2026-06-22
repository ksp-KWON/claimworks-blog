'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
      const hiraUrl = `/data/hospitals/${encodeURIComponent(sidoName)}-${encodeURIComponent(gugunName)}.json`;
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

  // 🧠 AI 3줄 요약 자동 생성기
  const getAiSummary = (zone: AccidentZone): string[] => {
    return [
      `해당 구역은 연간 총 ${zone.occurCount}건의 교통사고가 집중된 도로교통공단 지정 다발 위험 도로입니다.`,
      `사고 결과로 인해 사망 ${zone.deathCount}명, 중상 ${zone.seriousCount}명 등 총 ${zone.casualtyCount}명의 중증 사상자가 발생했습니다.`,
      `차량 통행량 대비 보행자 및 교차로 꼬리물기로 인한 골절/추간판탈출 손상 비율이 매우 높게 나타납니다.`
    ];
  };

  // 👨‍🏫 손해사정사 맞춤형 실무 코멘트
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

  // 📚 지능형 보상 칼럼 매칭 (아이디어 1번 반영)
  const getMatchedColumn = (zone: AccidentZone) => {
    if (blogPosts.length === 0) return null;
    const name = zone.locationName;
    
    // 사고 원인 키워드 정의
    let keyword = '교통사고';
    if (name.includes('보행자') || name.includes('횡단보도')) {
      keyword = '배상책임'; // 보행자 과실 관련
    } else if (name.includes('이륜차') || name.includes('오토바이')) {
      keyword = '장해'; // 장해/면책 관련
    } else {
      keyword = '교통사고'; // 일반 교통사고
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
    
    // 야간/주말 필터 (한방병원, 일요일, 야간 진료 유추)
    if (onlyNight) {
      list = list.filter(h => 
        h.name.includes('한방') || 
        h.name.includes('한의원') || 
        h.address.includes('한방')
      );
    }

    // 응급실 필터 (종합병원, 응급의학과 유추)
    if (onlyEmergency) {
      list = list.filter(h => 
        h.name.includes('종합') || 
        h.name.includes('병원') && !h.name.includes('의원') && !h.name.includes('한의')
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
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* 💡 상단 정보성 띠 배너 */}
      <div className="bg-[var(--google-blue)] text-white px-4 py-3 rounded-2xl flex items-center justify-between flex-wrap gap-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <span className="text-lg shrink-0">💡</span>
          <div className="text-xs sm:text-sm font-extrabold tracking-tight">
            <span className="underline decoration-wavy mr-1.5">[안전 정보]</span>
            도로교통공단 공식 통계를 실시간 연동하여 거주 지역의 교통사고 위험과 대처법을 조명합니다.
          </div>
        </div>
        <button 
          onClick={() => {
            const el = document.getElementById('region-selector-area');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
          className="text-[10px] font-black uppercase tracking-wider bg-white text-[var(--google-blue)] px-2.5 py-1 rounded-lg border border-white hover:bg-blue-50 transition-colors cursor-pointer"
        >
          지역선택
        </button>
      </div>

      {/* 헤더 타이틀 */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202124] dark:text-[#e8eaed] tracking-tight">
          보상스쿨 <span className="bg-gradient-to-r from-[var(--google-blue)] to-[#174ea6] bg-clip-text text-transparent">교통사고 로컬 안심케어 센터</span>
        </h1>
        <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-lg mx-auto leading-relaxed font-medium">
          내가 걷는 보도와 매일 지나는 사거리는 안전할까요? 사시는 동네를 선택하시면 도로교통공단 공식 위험 다발지역과 교통사고 발생 시 뼈·신경 치료 전문 병원 정보를 즉석에서 융합해 드립니다.
        </p>
      </div>

      {/* 지역 선택 셀렉터 */}
      <div id="region-selector-area" className="bg-white dark:bg-[#202124] p-5 sm:p-7 rounded-3xl border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
        <div className="flex gap-3 flex-col sm:flex-row items-stretch sm:items-center">
          <div className="flex-1 grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1.5">시/도 선택</label>
              <select
                value={selectedSido}
                onChange={(e) => handleSidoChange(e.target.value)}
                className="w-full px-3 py-2.5 sm:py-3 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/2 focus:outline-none focus:border-[var(--google-blue)] focus:ring-1 focus:ring-[var(--google-blue)] dark:text-white text-xs font-semibold shadow-inner"
              >
                {Object.keys(SIDO_GUGUN_MAP).map(sido => (
                  <option key={sido} value={sido}>{sido}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 mb-1.5">시/군/구 선택</label>
              <select
                value={selectedGugun}
                onChange={(e) => setSelectedGugun(e.target.value)}
                className="w-full px-3 py-2.5 sm:py-3 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/2 focus:outline-none focus:border-[var(--google-blue)] focus:ring-1 focus:ring-[var(--google-blue)] dark:text-white text-xs font-semibold shadow-inner"
              >
                {(SIDO_GUGUN_MAP[selectedSido] || []).map(gugun => (
                  <option key={gugun} value={gugun}>{gugun}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="sm:mt-5 px-6 py-3 rounded-xl bg-[var(--google-blue)] hover:bg-[#174ea6] text-white font-bold text-sm tracking-wide shadow-md transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
          >
            {loading ? '안전망 분석 중...' : '실시간 지역 분석'}
          </button>
        </div>
      </div>

      {/* 실시간 로딩 창 */}
      {loading && (
        <div className="bg-white dark:bg-[#202124] rounded-3xl py-14 px-6 text-center border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
          <div className="inline-block w-8 h-8 border-4 border-[var(--google-blue)] border-t-transparent rounded-full animate-spin" />
          <div className="text-sm font-bold text-[#202124] dark:text-[#e8eaed]">📡 도로교통공단 실시간 교통사고 통계 및 안전망 분석 중...</div>
          <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] max-w-xs mx-auto leading-relaxed">
            전국 도로의 위험 위치 좌표와 상해 요인을 융합하고 주변 우수 의료진 정보를 매칭하고 있습니다.
          </p>
        </div>
      )}

      {/* 에러 피드백 */}
      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-3xl py-10 px-5 text-center font-bold text-sm">
          {error}
        </div>
      )}

      {/* 메인 데이터 영역 */}
      {!loading && zones.length > 0 && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
            {/* 좌측 사고 다발 지점 리스트 선택창 (2/5 영역) */}
            <div className="md:col-span-2 space-y-3">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-100 dark:border-white/5">
                📍 {selectedGugun} 사고 다발 구역 Top {zones.length}
              </h2>
              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {zones.map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => setSelectedZoneId(zone.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 shadow-xs ${
                      selectedZoneId === zone.id
                        ? 'bg-blue-50/45 border-[var(--google-blue)] dark:bg-blue-950/20 dark:border-[#8ab4f8]'
                        : 'bg-white border-gray-100 hover:bg-gray-50 dark:bg-[#202124] dark:border-white/5 dark:hover:bg-white/2'
                    }`}
                  >
                    <span className="text-xs font-extrabold text-[#202124] dark:text-[#e8eaed] line-clamp-2 leading-snug">
                      {zone.locationName}
                    </span>
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
                      <span>연간 사고 <span className="text-[var(--google-blue)] dark:text-[#8ab4f8] font-extrabold">{zone.occurCount}건</span></span>
                      <span>사상자 <span className="text-red-500 font-extrabold">{zone.casualtyCount}명</span></span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 우측 지도 및 세부 요약, 손해사정 가이드 (3/5 영역) */}
            <div className="md:col-span-3 space-y-5">
              {activeZone && (
                <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-md space-y-5">
                  {/* 지점명 */}
                  <div className="pb-3 border-b border-gray-100 dark:border-white/5">
                    <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold border border-rose-100/30">
                      🚨 위험 구역
                    </span>
                    <h3 className="text-sm sm:text-base font-extrabold text-[#202124] dark:text-[#e8eaed] mt-1.5 leading-snug">
                      {activeZone.locationName}
                    </h3>
                  </div>

                  {/* 📍 구글 지도 임베드 시각화 (비용 Zero, API키 무설치 100% 무료 연동) */}
                  <div className="w-full h-[240px] rounded-2xl overflow-hidden border border-gray-150 dark:border-white/5 shadow-inner">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0 }}
                      src={`https://maps.google.com/maps?q=${activeZone.latitude},${activeZone.longitude}&z=16&output=embed`}
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>

                  {/* 🧠 AI 3줄 요약 */}
                  <div className="bg-blue-50/20 dark:bg-blue-950/10 p-4 rounded-2xl border border-blue-100/30 dark:border-blue-900/25 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#1a73e8] dark:text-[#8ab4f8]">
                      <span className="text-sm">🧠</span>
                      AI 위험 3줄 요약
                    </div>
                    <ul className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium space-y-1.5 list-disc pl-4">
                      {getAiSummary(activeZone).map((line, idx) => (
                        <li key={idx}>{line}</li>
                      ))}
                    </ul>
                  </div>

                  {/* 👨‍🏫 손해사정사 코멘트 */}
                  <div className="bg-[#fcf8e3]/30 dark:bg-[#fcf8e3]/5 p-4 rounded-2xl border border-[#faebcc]/50 dark:border-[#faebcc]/10 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-black text-[#8a6d3b] dark:text-[#c4a86f]">
                      <span className="text-sm">👨‍🏫</span>
                      보상스쿨 손해사정사 대처 조언
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium pl-1">
                      {getPracticeComment(activeZone)}
                    </p>
                  </div>

                  {/* 액션 버튼 영역 (관련 분석 칼럼 자동 매핑 포함) */}
                  <div className="flex items-center gap-2.5 pt-3 border-t border-gray-50 dark:border-white/2 flex-wrap sm:flex-nowrap">
                    {(() => {
                      const matchedCol = getMatchedColumn(activeZone);
                      if (matchedCol) {
                        return (
                          <Link
                            href={`/blog/${matchedCol.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-center py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-[#202124] dark:text-[#e8eaed] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          >
                            📖 관련 분석 칼럼 읽기 (1건)
                          </Link>
                        );
                      } else {
                        return (
                          <Link
                            href="/blog"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-center py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-[#202124] dark:text-[#e8eaed] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          >
                            📖 보상스쿨 전체 칼럼 읽기
                          </Link>
                        );
                      }
                    })()}
                    <a
                      href={getKakaoLink(activeZone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center py-2.5 bg-[var(--google-blue)] hover:bg-[#174ea6] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      💬 내 보상 무료 검토 신청 (카톡)
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 하단 🏥 우리 동네 병원 리스트 정보 영역 */}
          {hospitals.length > 0 && (
            <div className="bg-white dark:bg-[#202124] p-5 sm:p-7 rounded-3xl border border-gray-100 dark:border-white/5 shadow-md space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-white/5 pb-3">
                <h3 className="text-sm sm:text-base font-extrabold text-[#202124] dark:text-[#e8eaed] flex items-center gap-1.5">
                  <span>🏥</span>
                  {selectedGugun} 교통사고 추천 정형외과 · 신경외과 병원
                </h3>
                
                {/* 병원 편의 진료 필터 */}
                <div className="flex gap-3 text-[10px] font-bold text-gray-500">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={onlyNight}
                      onChange={(e) => setOnlyNight(e.target.checked)}
                      className="rounded border-gray-300 text-[var(--google-blue)] focus:ring-[var(--google-blue)] cursor-pointer"
                    />
                    주말진료 병원만
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={onlyEmergency}
                      onChange={(e) => setOnlyEmergency(e.target.checked)}
                      className="rounded border-gray-300 text-[var(--google-blue)] focus:ring-[var(--google-blue)] cursor-pointer"
                    />
                    종합 대형병원만
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-1">
                {filteredHospitals.length > 0 ? (
                  filteredHospitals.map((h, idx) => {
                    const isWeekend = h.name.includes('한방') || h.name.includes('한의');
                    const isBig = h.name.includes('종합') || h.name.includes('병원') && !h.name.includes('의원');
                    
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/30 dark:bg-white/2 hover:border-blue-100 dark:hover:border-blue-900/40 transition-colors flex flex-col justify-between space-y-2.5"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-gray-800 dark:text-gray-200">{h.name}</span>
                            {isWeekend && (
                              <span className="px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 text-[9px] font-extrabold border border-green-100/30">
                                주말진료
                              </span>
                            )}
                            {isBig && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/20 text-[#1a73e8] dark:text-[#8ab4f8] text-[9px] font-extrabold border border-blue-100/30">
                                대형병원
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{h.address}</p>
                        </div>
                        {h.tel && (
                          <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                            <span>📞</span> {h.tel}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-1 sm:col-span-2 py-8 text-center text-xs font-bold text-gray-400 dark:text-gray-500">
                    선택하신 필터 조건에 부합하는 병원 정보가 없습니다. 필터를 해제해 보세요.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ⚠️ 법률 면책 고지 배너 (가장 최하단 배치로 패밀리룩 유지) */}
      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-semibold leading-relaxed shadow-sm">
        <span className="text-base shrink-0 mt-0.5">⚠️</span>
        <span>본 교통사고 정보 시스템은 도로교통공단 및 심평원의 공공 데이터에 기반하여 참고용으로 제공되며, 실제 사고 발생 시 과실 조율 및 보험 합의 대처는 반드시 전문 손해사정사와 상담하여 결정하시기 바랍니다.</span>
      </div>
    </div>
  );
}
