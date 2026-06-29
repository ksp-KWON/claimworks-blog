import { getSortedPostsData } from "@/lib/posts";
import YouTubeBriefing from "@/components/YouTubeBriefing";
import HomePostList from "@/components/HomePostList";
import PortalSearchBar from "@/components/PortalSearchBar";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "지역별 병원추천 & 보상 실무 가이드 | 보상스쿨",
  description: "건강보험심사평가원 공개 데이터를 기반으로 분석한 지역별 우수 병원 추천 및 손해사정 보상 실무 가이드를 제공합니다.",
  alternates: {
    canonical: "https://claim-works.com",
  },
};

export default function Home() {
  // 전체 최신 보상 가이드 블로그 목록 로드
  const posts = getSortedPostsData();

  return (
    <div className="w-full max-w-7xl mx-auto sm:px-0 bg-[var(--portal-gray)] min-h-screen pb-12">
      
      {/* 1. 상단 헤더: 검색창 & 퀵메뉴 (네이버 벤치마킹) */}
      <div className="bg-white dark:bg-[#202124] border-b border-[var(--google-border)] py-8 px-4 sm:px-8 mb-6">
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202124] dark:text-white mb-6 tracking-tight flex items-center gap-2">
            <span className="text-[var(--portal-blue)]">보상스쿨</span> 통합 검색
          </h1>
          
          <div className="w-full mb-8">
            <PortalSearchBar placeholder="어떤 보상 사례를 찾으시나요? (예: 십자인대 파열, 백내장)" />
          </div>

          {/* 퀵메뉴 아이콘 */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 w-full max-w-2xl">
            {[
              { label: "교통사고", icon: "🚗", color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30" },
              { label: "실손/질병", icon: "🏥", color: "bg-green-50 text-green-600 dark:bg-green-900/30" },
              { label: "산업재해", icon: "👷", color: "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30" },
              { label: "병원추천", icon: "📍", color: "bg-purple-50 text-purple-600 dark:bg-purple-900/30" },
              { label: "보상금 계산", icon: "🧮", color: "bg-red-50 text-[var(--portal-red)] dark:bg-red-900/30 font-bold border border-red-100 dark:border-red-900/50" },
            ].map((item, idx) => (
              <Link href="#" key={idx} className="flex flex-col items-center group">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-2xl sm:text-3xl mb-2 transition-transform group-hover:scale-105 shadow-sm ${item.color}`}>
                  {item.icon}
                </div>
                <span className="text-xs sm:text-sm font-medium text-[#5f6368] dark:text-[#9aa0a6] group-hover:text-[var(--portal-blue)] transition-colors">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 2단 레이아웃 컨테이너 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ======================================================== */}
          {/* [좌측 메인 구역 70%] 8단 박스 배치 (다음/네이버 하이브리드) */}
          {/* ======================================================== */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. 미디어센터 (유튜브) */}
            <section className="bg-white dark:bg-[#202124] rounded-xl border border-[var(--google-border)] overflow-hidden shadow-sm">
              <div className="bg-[var(--portal-blue)] px-4 py-3 flex items-center justify-between">
                <h2 className="text-white font-bold flex items-center gap-2">
                  <span className="text-xl">📺</span> 미디어센터
                </h2>
              </div>
              <div className="p-4">
                <YouTubeBriefing />
              </div>
            </section>

            {/* 2. 판례검색센터 */}
            <section className="bg-white dark:bg-[#202124] rounded-xl border border-[var(--google-border)] overflow-hidden shadow-sm">
              <div className="border-b border-[var(--google-border)] px-4 py-3 flex items-center justify-between">
                <h2 className="text-[var(--portal-blue)] font-bold flex items-center gap-2">
                  <span className="text-xl">⚖️</span> 판례검색센터
                </h2>
                <span className="text-xs text-gray-400">더보기 &gt;</span>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-500 mb-4">현재까지 가장 많이 조회된 핫이슈 판례 리스트입니다.</p>
                {/* 추후 다음 카페 스타일의 고밀도 텍스트 리스트로 교체 예정 */}
                <HomePostList initialPosts={posts.slice(0, 3)} />
              </div>
            </section>

            {/* 3. 금감원 소비자 보호센터 */}
            <section className="bg-white dark:bg-[#202124] rounded-xl border border-[var(--google-border)] overflow-hidden shadow-sm">
              <div className="border-b border-[var(--google-border)] px-4 py-3 flex items-center justify-between">
                <h2 className="text-[var(--portal-blue)] font-bold flex items-center gap-2">
                  <span className="text-xl">🏛️</span> 금감원 소비자 보호센터
                </h2>
              </div>
              <div className="p-4">
                 <div className="bg-gray-50 dark:bg-[#303134] p-3 rounded text-sm text-gray-600 dark:text-gray-300">
                    최근 실손의료비 백내장 수술 관련 금감원 소비자 주의보가 발령되었습니다.
                 </div>
              </div>
            </section>

            {/* 4. 교통사고 로컬안심케어 */}
            <section className="bg-white dark:bg-[#202124] rounded-xl border border-[var(--google-border)] overflow-hidden shadow-sm">
              <div className="border-b border-[var(--google-border)] px-4 py-3 flex items-center justify-between">
                <h2 className="text-[var(--portal-blue)] font-bold flex items-center gap-2">
                  <span className="text-xl">🚗</span> 교통사고 로컬안심케어
                </h2>
              </div>
              <div className="p-4">
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['서울', '경기/인천', '충청/대전', '경상/부산'].map((region) => (
                      <button key={region} className="p-2 border border-gray-200 dark:border-gray-700 rounded text-sm hover:bg-blue-50 hover:text-[var(--portal-blue)] transition-colors">
                        {region} 병원찾기
                      </button>
                    ))}
                 </div>
              </div>
            </section>

            {/* 5. 합의금 계산기 (대형 배너) */}
            <section className="rounded-xl overflow-hidden shadow-md bg-gradient-to-r from-[var(--portal-blue)] to-[#007bff] text-white">
              <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-2">내 합의금은 얼마가 적당할까?</h2>
                  <p className="text-blue-100 text-sm">과거 유사 판례를 바탕으로 예상 보상금을 즉시 계산해 드립니다.</p>
                </div>
                <button className="whitespace-nowrap px-6 py-3 bg-[var(--portal-red)] hover:bg-red-700 text-white font-bold rounded-lg shadow-lg transition-transform hover:scale-105">
                  지금 바로 계산하기 👉
                </button>
              </div>
            </section>

            {/* 6. 분야별 보상칼럼 (탭 메뉴) */}
            <section className="bg-white dark:bg-[#202124] rounded-xl border border-[var(--google-border)] overflow-hidden shadow-sm">
              <div className="border-b border-[var(--google-border)] px-4 py-3 flex items-center justify-between">
                <h2 className="text-[var(--portal-blue)] font-bold flex items-center gap-2">
                  <span className="text-xl">📁</span> 분야별 보상칼럼
                </h2>
              </div>
              <div className="p-4">
                 <HomePostList initialPosts={posts.slice(3, 7)} />
              </div>
            </section>

            {/* 7. 진료과목별 분쟁가이드 */}
            <section className="bg-white dark:bg-[#202124] rounded-xl border border-[var(--google-border)] overflow-hidden shadow-sm">
              <div className="border-b border-[var(--google-border)] px-4 py-3 flex items-center justify-between">
                <h2 className="text-[var(--portal-blue)] font-bold flex items-center gap-2">
                  <span className="text-xl">🩺</span> 진료과목별 분쟁가이드
                </h2>
              </div>
              <div className="p-4">
                 <p className="text-sm text-gray-500">정형외과, 안과, 신경외과 등 진료과목별 분쟁 가이드 컴포넌트가 들어갈 자리입니다.</p>
              </div>
            </section>

            {/* 8. 지역별 의료기관 */}
            <section className="bg-white dark:bg-[#202124] rounded-xl border border-[var(--google-border)] overflow-hidden shadow-sm">
              <div className="border-b border-[var(--google-border)] px-4 py-3 flex items-center justify-between">
                <h2 className="text-[var(--portal-blue)] font-bold flex items-center gap-2">
                  <span className="text-xl">🏥</span> 지역별 의료기관
                </h2>
              </div>
              <div className="p-4 h-48 bg-gray-100 dark:bg-gray-800 flex items-center justify-center rounded">
                 <span className="text-gray-400">지도 API 및 지역 탐색 컴포넌트 영역</span>
              </div>
            </section>

          </div>

          {/* ======================================================== */}
          {/* [우측 고정 사이드바 30%] 네이버 로그인 위젯 벤치마킹 */}
          {/* ======================================================== */}
          <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-20 space-y-6">
              
              {/* 1. 로그인 창 위치 -> 보상 상담/계산기 강력한 CTA 위젯 */}
              <div className="bg-white dark:bg-[#202124] rounded-xl border-2 border-[var(--portal-blue)] overflow-hidden shadow-lg">
                <div className="p-5 text-center">
                  <h3 className="font-bold text-[#202124] dark:text-white text-lg mb-1">정당한 내 권리 찾기</h3>
                  <p className="text-xs text-gray-500 mb-4">손해사정사와의 빠르고 정확한 무료 검토</p>
                  
                  <button className="w-full py-3 bg-[var(--portal-blue)] hover:bg-blue-700 text-white font-bold rounded-lg mb-2 transition-colors">
                    무료 전화 상담 (1588-XXXX)
                  </button>
                  <button className="w-full py-3 bg-white dark:bg-gray-800 border border-[var(--portal-blue)] text-[var(--portal-blue)] font-bold rounded-lg transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/30">
                    카카오톡 1:1 상담
                  </button>
                </div>
                <div className="bg-gray-50 dark:bg-[#303134] px-4 py-3 text-xs text-gray-500 flex justify-between">
                  <span>누적 상담 <strong className="text-[var(--portal-blue)]">3,452</strong>건</span>
                  <span>승인율 <strong className="text-[var(--portal-blue)]">98%</strong></span>
                </div>
              </div>

              {/* 2. 실시간 인기 트렌드 (네이버 실검 느낌) */}
              <div className="bg-white dark:bg-[#202124] rounded-xl border border-[var(--google-border)] shadow-sm">
                <div className="border-b border-[var(--google-border)] px-4 py-3">
                  <h3 className="font-bold text-[var(--portal-blue)] text-sm">🔥 실시간 많이 찾는 정보</h3>
                </div>
                <ul className="p-4 space-y-3 text-sm">
                  {[
                    { rank: 1, title: "12대 중과실 형사합의금 기준", up: true },
                    { rank: 2, title: "백내장 수술 실손 면책 대응법", up: true },
                    { rank: 3, title: "오토바이 책임보험 한도", up: false },
                    { rank: 4, title: "전동킥보드 일배책 적용 여부", up: true },
                    { rank: 5, title: "추간판 탈출증 후유장해", up: false }
                  ].map((item) => (
                    <li key={item.rank} className="flex items-center justify-between cursor-pointer hover:text-[var(--portal-blue)] group">
                      <div className="flex items-center gap-3 truncate pr-4">
                        <span className={`font-bold ${item.rank <= 3 ? 'text-[var(--portal-red)]' : 'text-gray-400'}`}>{item.rank}</span>
                        <span className="truncate text-gray-700 dark:text-gray-300 group-hover:text-[var(--portal-blue)]">{item.title}</span>
                      </div>
                      {item.up ? (
                         <span className="text-red-500 text-xs">▲</span>
                      ) : (
                         <span className="text-blue-500 text-xs">▼</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* 3. 맞춤형 공지사항 / 이벤트 */}
              <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 text-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  📢 2026년 도로교통법 개정안 요약 배포
                </span>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
