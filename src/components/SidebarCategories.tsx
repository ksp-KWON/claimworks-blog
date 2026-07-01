'use client';

import Link from 'next/link';

export const REGIONS_DATA = [
  {
    name: '서울특별시',
    districts: [
      '강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', 
      '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', 
      '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'
    ]
  },
  {
    name: '부산광역시',
    districts: [
      '강서구', '금정구', '기장군', '남구', '동구', '동래구', '부산진구', '북구', 
      '사상구', '사하구', '서구', '수영구', '연제구', '영도구', '중구', '해운대구'
    ]
  },
  {
    name: '인천광역시',
    districts: [
      '강화군', '계양구', '남동구', '동구', '미추홀구', '부평구', '서구', '연수구', '옹진군', '중구'
    ]
  },
  {
    name: '대구광역시',
    districts: [
      '군위군', '남구', '달서구', '달성군', '동구', '북구', '서구', '수성구', '중구'
    ]
  },
  {
    name: '광주광역시',
    districts: ['광산구', '남구', '동구', '북구', '서구']
  },
  {
    name: '대전광역시',
    districts: ['대덕구', '동구', '서구', '유성구', '중구']
  },
  {
    name: '울산광역시',
    districts: ['남구', '동구', '북구', '울주군', '중구']
  },
  {
    name: '세종특별자치시',
    districts: ['세종시']
  },
  {
    name: '경기도',
    districts: [
      '가평군', '고양시', '과천시', '광명시', '광주시', '구리시', '군포시', '김포시', 
      '남양주시', '동두천시', '부천시', '성남시', '수원시', '시흥시', '안산시', '안성시', 
      '안양시', '양주시', '양평군', '여주시', '연천군', '오산시', '용인시', '의왕시', 
      '의정부시', '이천시', '파주시', '평택시', '포천시', '하남시', '화성시'
    ]
  },
  {
    name: '강원특별자치도',
    districts: [
      '강릉시', '고성군', '동해시', '삼척시', '속초시', '양구군', '양양군', '영월군', 
      '원주시', '인제군', '정선군', '철원군', '춘천시', '태백시', '평창군', '홍천군', '화천군', '횡성군'
    ]
  },
  {
    name: '충청북도',
    districts: [
      '괴산군', '단양군', '보은군', '영동군', '옥천군', '음성군', '제천시', '증평군', '진천군', '청주시', '충주시'
    ]
  },
  {
    name: '충청남도',
    districts: [
      '계룡시', '금산군', '공주시', '논산시', '당진시', '부여군', '보령시', '서산시', 
      '서천군', '아산시', '예산군', '천안시', '청양군', '태안군', '홍성군'
    ]
  },
  {
    name: '전북특별자치도',
    districts: [
      '고창군', '군산시', '김제시', '남원시', '무주군', '부안군', '순창군', '완주군', '익산시', '임실군', '장수군', '전주시', '정읍시', '진안군'
    ]
  },
  {
    name: '전라남도',
    districts: [
      '강진군', '고흥군', '곡성군', '광양시', '구례군', '나주시', '담양군', '목포시', 
      '무안군', '보성군', '순천시', '신안군', '여수시', '영광군', '영암군', '완도군', 
      '장성군', '장흥군', '진도군', '함평군', '해남군', '화순군'
    ]
  },
  {
    name: '경상북도',
    districts: [
      '경산시', '경주시', '고령군', '구미시', '김천시', '문경시', '봉화군', '상주시', 
      '성주군', '안동시', '영덕군', '영양군', '영주시', '영천시', '예천군', '울릉군', 
      '울진군', '의성군', '청도군', '청송군', '칠곡군', '포항시'
    ]
  },
  {
    name: '경상남도',
    districts: [
      '거제시', '거창군', '김해시', '남해군', '밀양시', '사천시', '산청군', '양산시', 
      '의령군', '진주시', '창녕군', '창원시', '통영시', '하동군', '함안군', '함양군', '합천군'
    ]
  },
  {
    name: '제주특별자치도',
    districts: ['제주시', '서귀포시']
  }
];

// 1. 대한민국 전체 행정구역 카테고리 (대분류 17개 시/도, 중분류 226개 시/군/구 전수조사 반영)
export function RegionalCategories() {
  return (
    <Link href="/regions" className="block group">
      <div className="bg-white dark:bg-[#202124] p-5 rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:shadow-[0_16px_50px_rgba(52,168,83,0.25)] hover:border-[var(--google-green)] transition-all duration-300 relative overflow-hidden">
        <div className="absolute right-[-10px] bottom-[-20px] opacity-[0.03] dark:opacity-[0.05] text-[90px] select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">🗺️</div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2 border-l-4 border-[var(--google-green)] pl-2.5">
              <span className="text-[var(--google-green)] text-lg leading-none">🗺️</span>
              지역별 의료기관
            </h3>
            <span className="bg-green-50 dark:bg-green-950/20 text-[var(--google-green)] dark:text-[#81c995] text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-green-100/30 dark:border-green-950/30">전국 매핑</span>
          </div>
          <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">
            전국 17개 시/도, 226개 시/군/구별 보상 전문 의료기관 및 협력 병원 정보를 제공합니다.
          </p>
          <div className="mt-3 w-full text-[13px] font-bold text-[#202124] dark:text-[#e8eaed] flex items-center justify-between transition-colors p-2.5 rounded-none bg-gray-50 dark:bg-white/5 group-hover:bg-green-50 dark:group-hover:bg-green-950/20 group-hover:text-[var(--google-green)] dark:group-hover:text-[#81c995]">
            <div className="flex items-center gap-2">
              지역별 기관 찾기
            </div>
            <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

// 2. 대학병원 진료과목 기준 보상 가이드 카테고리 (진료과목 대분류, 보상/분쟁 대표병명 중분류)
export function SpecialtyDiseaseCategories() {
  return (
    <Link href="/categories" className="block group">
      <div className="bg-white dark:bg-[#202124] p-5 rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:shadow-[0_16px_50px_rgba(26,115,232,0.25)] hover:border-[var(--google-blue)] transition-all duration-300 relative overflow-hidden">
        <div className="absolute right-[-10px] bottom-[-20px] opacity-[0.03] dark:opacity-[0.05] text-[90px] select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">🩺</div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2 border-l-4 border-[var(--google-blue)] pl-2.5">
              <span className="text-[var(--google-blue)] text-lg leading-none">🩺</span>
              진료과목별 분쟁 가이드
            </h3>
            <span className="bg-blue-50 dark:bg-blue-950/20 text-[var(--google-blue)] dark:text-[#8ab4f8] text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-blue-100/30 dark:border-blue-950/30">심층 가이드</span>
          </div>
          <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">
            진료과목 및 질병에 따른 주요 의료분쟁 사례와 보상 청구 팁을 확인하세요.
          </p>
          <div className="mt-3 w-full text-[13px] font-bold text-[#202124] dark:text-[#e8eaed] flex items-center justify-between transition-colors p-2.5 rounded-none bg-gray-50 dark:bg-white/5 group-hover:bg-[#e8f0fe] dark:group-hover:bg-[#174ea6]/20 group-hover:text-[var(--google-blue)] dark:group-hover:text-[#8ab4f8]">
            <div className="flex items-center gap-2">
              분쟁 가이드 살펴보기
            </div>
            <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

// 하위 호환성을 위해 기존 컴포넌트 이름 유지형 래퍼
export function InjuryCategories() {
  return <SpecialtyDiseaseCategories />;
}

export function DiseaseCategories() {
  return null;
}
