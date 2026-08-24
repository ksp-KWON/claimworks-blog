import Link from "next/link";
import { Metadata } from "next";
import CredentialsGallery from "@/components/CredentialsGallery";

export const metadata: Metadata = {
  title: "플랫폼 소개 & 공인 라이선스 | 보상스쿨 전문 손해사정 그룹",
  description: "금융감독원 공인 신체손해사정사 및 보험조사분석사(CIFI), 생명보험심사역(CKLU), 개인보험심사역(APIU) 공인 라이선스를 바탕으로 18년 보험 전주기 전문성을 증명합니다.",
  alternates: {
    canonical: "https://claim-works.com/about",
  },
  openGraph: {
    title: "플랫폼 소개 & 공인 라이선스 | 보상스쿨 전문 손해사정 그룹",
    description: "금융감독원 공인 신체손해사정사 및 보험조사분석사(CIFI), 생명보험심사역(CKLU), 개인보험심사역(APIU) 공인 라이선스 증명",
    url: "https://claim-works.com/about",
    siteName: "보상스쿨 전문 손해사정 그룹",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "https://claim-works.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "보상스쿨 플랫폼 소개 및 공인 라이선스",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "플랫폼 소개 & 공인 라이선스 | 보상스쿨 전문 손해사정 그룹",
    description: "금융감독원 공인 신체손해사정사 그룹의 E-E-A-T 공인 라이선스 증명",
    images: ["https://claim-works.com/og-image.png"],
  },
};

export default function AboutPage() {
  return (
    <div className="space-y-8 px-3 sm:px-0 max-w-5xl mx-auto">
      
      {/* 1. 소개 페이지 헤더 */}
      <div className="border-b border-[var(--google-border)] pb-4">
        <h1 className="text-lg sm:text-xl font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--google-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          보상스쿨 플랫폼 소개 & 전문 자격 인증
        </h1>
        <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] mt-1 font-medium">
          금융감독원 공인 손해사정사와 보험심사·조사 공인 전문가 그룹이 이끄는 독립 손해사정 플랫폼
        </p>
      </div>

      {/* 2. 핵심 미션 선언문 */}
      <article className="bg-white dark:bg-[#202124] rounded-xl p-5 sm:p-7 border border-gray-200/90 dark:border-zinc-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
        <h2 className="text-base sm:text-lg font-bold text-[#202124] dark:text-[#e8eaed] mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--google-blue)]"></span>
          기울어진 운동장을 바로잡는 정직한 나침반
        </h2>
        <div className="space-y-3 text-[13px] sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed break-keep">
          <p>
            보험 사고가 발생했을 때, 거대 보험사는 막대한 자본과 전문 의료·법률 인력을 바탕으로 면책과 삭감 논리를 정교하게 구성합니다. 반면, 정보와 의학 지식이 부족한 일반 소비자는 보험사의 일방적인 부지급 안내문 앞에서 막막한 현실에 부딪힙니다.
          </p>
          <p>
            <strong>보상스쿨</strong>은 이 불공평한 구조를 바로잡기 위해 탄생했습니다. 건강보험심사평가원(HIRA)의 공공 빅데이터와 <strong>18년간 축적된 보험 전주기(상품 설계·언더라이팅·손해사정) 실무 노하우</strong>를 바탕으로, 소비자의 정당한 권익을 투명하고 평등하게 지켜드립니다.
          </p>
        </div>
      </article>

      {/* 3. 🌟 4대 국가공인 & 전문 라이선스 인증 섹션 (핵심 E-E-A-T 증명) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
          <div>
            <h3 className="text-base font-extrabold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2">
              <span className="text-amber-500">🏆</span>
              <span>국가공인 및 전문 라이선스 인증</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              공식 기관의 직인과 등록번호가 부여된 1급 공인 전문 자격증서입니다. (카드 클릭 시 확대 뷰)
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full w-fit">
            <span>✓</span> 공식 검증 완료
          </span>
        </div>

        {/* 4대 자격증 실물 갤러리 */}
        <CredentialsGallery />
      </section>

      {/* 4. 📜 18년 보험 전주기(全週期) 마스터 커리어 타임라인 */}
      <section className="bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-zinc-900/80 dark:via-zinc-900 dark:to-blue-950/20 rounded-xl p-5 sm:p-7 border border-gray-200/90 dark:border-zinc-800 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2">
            <span>🧭</span>
            <span>2007년부터 이어진 18년 보험 전주기(全週期) 실무 이력</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            보험사의 상품 설계부터 언더라이팅 심사, 보상 조사 기법까지 전체 과정을 꿰뚫어 완벽한 반박 논리를 구축합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          {/* 단계 1 */}
          <div className="p-3.5 bg-white dark:bg-zinc-950 border border-gray-200/80 dark:border-zinc-800 rounded-lg space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-gray-400">STAGE 01</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300">2007~2015</span>
            </div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-white">
              보험 상품 구조 & 약관 설계 정복
            </h4>
            <p className="text-[11px] text-gray-600 dark:text-zinc-400 leading-relaxed">
              생명보험·손해보험·제3보험·변액보험 공인 자격을 바탕으로, 보험사가 상품을 설계하는 메커니즘과 약관 조항의 뼈대를 완벽히 체득했습니다.
            </p>
          </div>

          {/* 단계 2 */}
          <div className="p-3.5 bg-white dark:bg-zinc-950 border border-blue-200/80 dark:border-blue-900/60 rounded-lg space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-blue-500">STAGE 02</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">2020~</span>
            </div>
            <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400">
              국가공인 신체손해사정 실무
            </h4>
            <p className="text-[11px] text-gray-600 dark:text-zinc-400 leading-relaxed">
              금융감독원 등록 신체손해사정사로서 수천 건의 교통사고, 배상책임, 후유장해 및 질병 보상 분쟁을 직접 수행하며 현장 중심의 승소 데이터를 축적했습니다.
            </p>
          </div>

          {/* 단계 3 */}
          <div className="p-3.5 bg-white dark:bg-zinc-950 border border-gray-200/80 dark:border-zinc-800 rounded-lg space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-purple-500">STAGE 03</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">2023~2024</span>
            </div>
            <h4 className="text-xs font-bold text-purple-600 dark:text-purple-400">
              언더라이팅 & 사기조사 최고 전문역
            </h4>
            <p className="text-[11px] text-gray-600 dark:text-zinc-400 leading-relaxed">
              CKLU(생보심사)·APIU(개인보험심사)·CIFI(보험조사분석) 트리플 크라운을 달성하여 보험사의 의학적 삭감 명분을 사전에 완벽히 무력화합니다.
            </p>
          </div>
        </div>
      </section>

      {/* 5. E-E-A-T 4대 가치 (격자 카드) */}
      <div>
        <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] mb-4 flex items-center gap-1.5 px-1">
          <svg className="w-4 h-4 text-[var(--google-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          보상스쿨이 지키는 4대 핵심 가치 (E-E-A-T)
        </h3>
        
        <div className="grid gap-3.5 sm:grid-cols-2">
          
          {/* E: Experience */}
          <article className="group bg-white dark:bg-[#202124] rounded-xl p-5 border border-gray-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-6 h-6 rounded-full bg-[#e8f0fe] text-[var(--google-blue)] dark:bg-[#174ea6]/20 dark:text-[#8ab4f8] flex items-center justify-center font-bold text-xs">E</span>
              <h4 className="text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-blue)] transition-colors">
                Experience <span className="font-medium text-sm text-[#5f6368]">(경험)</span>
              </h4>
            </div>
            <p className="text-[13px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed break-keep">
              수천 건의 자동차사고, 배상책임, 개인보험 장해 평가 실무를 직접 수행하며 피땀으로 얻어낸 <strong>현장 중심의 실무 노하우</strong>를 전달합니다.
            </p>
          </article>

          {/* E: Expertise */}
          <article className="group bg-white dark:bg-[#202124] rounded-xl p-5 border border-gray-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-6 h-6 rounded-full bg-[#fce8e6] text-[var(--google-red)] dark:bg-[#c5221f]/20 dark:text-[#f28b82] flex items-center justify-center font-bold text-xs">E</span>
              <h4 className="text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-red)] transition-colors">
                Expertise <span className="font-medium text-sm text-[#5f6368]">(전문성)</span>
              </h4>
            </div>
            <p className="text-[13px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed break-keep">
              일반인이 이해하기 힘든 <strong>복잡한 보험 약관과 맥브라이드, AMA 장해 평가 기준</strong>을 국가공인 손해사정사가 명쾌하게 분석합니다.
            </p>
          </article>

          {/* A: Authoritativeness */}
          <article className="group bg-white dark:bg-[#202124] rounded-xl p-5 border border-gray-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-6 h-6 rounded-full bg-[#e6f4ea] text-[var(--google-green)] dark:bg-[#0d652d]/20 dark:text-[#81c995] flex items-center justify-center font-bold text-xs">A</span>
              <h4 className="text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-green)] transition-colors">
                Authoritativeness <span className="font-medium text-sm text-[#5f6368]">(권위성)</span>
              </h4>
            </div>
            <p className="text-[13px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed break-keep">
              단순한 인터넷 정보가 아닌, <strong>금융감독원 등록 라이선스와 HIRA 공공 빅데이터</strong>를 바탕으로 법적·의학적 객관성을 담보합니다.
            </p>
          </article>

          {/* T: Trustworthiness */}
          <article className="group bg-white dark:bg-[#202124] rounded-xl p-5 border border-gray-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-6 h-6 rounded-full bg-[#fef7e0] text-[#b06000] dark:bg-[#e37400]/20 dark:text-[#fde293] flex items-center justify-center font-bold text-xs">T</span>
              <h4 className="text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[#b06000] dark:group-hover:text-[#fde293] transition-colors">
                Trustworthiness <span className="font-medium text-sm text-[#5f6368]">(신뢰성)</span>
              </h4>
            </div>
            <p className="text-[13px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed break-keep">
              특정 보험사에 종속되지 않는 <strong>소비자 중심의 독립 손해사정 원칙</strong>을 준수하며, 오직 환자의 정당한 피해보상만을 위해 행동합니다.
            </p>
          </article>

        </div>
      </div>

      {/* 6. 법적 고지 */}
      <div className="bg-white dark:bg-[#202124] rounded-xl p-5 sm:p-6 text-center border border-gray-200/80 dark:border-zinc-800 shadow-sm">
        <p className="text-[12px] text-[#5f6368] dark:text-[#9aa0a6] font-medium leading-relaxed break-keep max-w-2xl mx-auto">
          보상스쿨 전문 손해사정 그룹은 보험업법에 따라 공인된 손해사정 업무를 수행합니다. 정확한 장해 산정 및 권리 구제 방안은 전문 손해사정사와의 1:1 상담을 통해 확인하실 수 있습니다.
        </p>
      </div>

      {/* 7. CTA 버튼 */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link 
          href="/consultation"
          className="flex items-center justify-center w-full sm:w-auto h-12 rounded-xl bg-blue-600 hover:bg-blue-700 px-7 text-sm font-extrabold text-white shadow-md shadow-blue-500/20 transition-all duration-300 gap-2"
        >
          <span>📋</span>
          <span>손해사정사 1:1 무료 상담 신청</span>
        </Link>
        <Link 
          href="/blog"
          className="flex items-center justify-center w-full sm:w-auto h-12 rounded-xl bg-white dark:bg-[#202124] px-6 text-sm font-bold text-[#202124] dark:text-[#e8eaed] border border-[var(--google-border)] shadow-sm hover:shadow-md hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all duration-300 gap-1.5"
        >
          보상 실무 칼럼 둘러보기
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </Link>
      </div>

    </div>
  );
}
