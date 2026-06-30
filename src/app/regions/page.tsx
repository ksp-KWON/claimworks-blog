import Link from 'next/link';

const REGIONS_DATA = [
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
      '원주시', '인제군', '정선군', '철원군', '춘천시', '태백시', '평창군', '홍천군', 
      '화천군', '횡성군'
    ]
  },
  {
    name: '충청북도',
    districts: [
      '괴산군', '단양군', '보은군', '영동군', '옥천군', '음성군', '제천시', '증평군', 
      '진천군', '청주시', '충주시'
    ]
  },
  {
    name: '충청남도',
    districts: [
      '계룡시', '공주시', '금산군', '논산시', '당진시', '보령시', '부여군', '서산시', 
      '서천군', '아산시', '예산군', '천안시', '청양군', '태안군', '홍성군'
    ]
  },
  {
    name: '전북특별자치도',
    districts: [
      '고창군', '군산시', '김제시', '남원시', '무주군', '부안군', '순창군', '완주군', 
      '익산시', '임실군', '장수군', '전주시', '정읍시', '진안군'
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
      '거제시', '거창군', '고성군', '김해시', '남해군', '밀양시', '사천시', '산청군', 
      '양산시', '의령군', '진주시', '창녕군', '창원시', '통영시', '하동군', '함안군', 
      '함양군', '합천군'
    ]
  },
  {
    name: '제주특별자치도',
    districts: ['서귀포시', '제주시']
  }
];

export const metadata = {
  title: '지역별 의료기관 - 보상스쿨',
  description: '전국 17개 시/도, 226개 시/군/구별 보상 전문 의료기관 및 협력 병원 정보를 제공합니다.',
};

export default function RegionsIndex() {
  return (
    <>
      <div className="space-y-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="bg-white dark:bg-[#202124] rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:border-[var(--google-green)] hover:shadow-[0_16px_50px_rgba(52,168,83,0.15)] transition-all duration-300 overflow-hidden">
          
          {/* 🗺️ 상단 정보성 띠 배너 */}
          <div className="bg-[var(--google-green)] text-white px-5 py-3 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-lg shrink-0">🗺️</span>
              <div className="text-xs sm:text-sm font-extrabold tracking-tight">
                <span className="underline decoration-wavy mr-1.5">[전국 네트워크]</span>
                우리 지역에서 가장 가까운 보상 전문 협력 병원을 찾아보세요.
              </div>
            </div>
            <div className="text-[10px] font-black uppercase tracking-wider bg-white text-[var(--google-green)] px-2.5 py-1 rounded-none border border-white opacity-90">
              전국 매핑
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-12">
            {/* 헤더 타이틀 */}
            <div className="text-center space-y-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202124] dark:text-[#e8eaed] tracking-tight">
                보상스쿨 <span className="bg-gradient-to-r from-green-500 to-green-700 bg-clip-text text-transparent">지역별 의료기관 네트워크</span>
              </h1>
              <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-lg mx-auto leading-relaxed font-medium">
                교통사고, 산업재해, 의료분쟁 등 특수한 보상 처리에 전문적인 지식을 갖춘 전국 17개 시/도의 우수 병원 및 협력 기관을 안내합니다.
              </p>
            </div>

            {/* 전국 지역 그리드 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {REGIONS_DATA.map((region) => (
                <Link 
                  key={region.name} 
                  href={`/blog?sido=${encodeURIComponent(region.name)}`} 
                  className="group flex flex-col items-center justify-center p-4 sm:p-6 bg-white dark:bg-[#303134] rounded-none border border-gray-200 dark:border-gray-700 shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-[4px_8px_20px_rgba(52,168,83,0.15)] hover:border-[var(--google-green)] hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-12 h-12 flex items-center justify-center text-2xl text-green-600 bg-green-50 dark:bg-green-900/20 rounded-full mb-3 group-hover:scale-110 group-hover:bg-[var(--google-green)] group-hover:text-white transition-all duration-300">
                    📍
                  </div>
                  <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-green)] transition-colors text-center">{region.name}</h3>
                  <p className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6] mt-1 font-medium">{region.districts.length}개 시/군/구</p>
                </Link>
              ))}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
