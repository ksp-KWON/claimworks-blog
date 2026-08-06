import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "플랫폼 소개 | 보상스쿨 전문 손해사정 그룹",
  description: "보상스쿨 전문 손해사정 그룹의 핵심 미션과 E-E-A-T 4대 가치를 소개합니다.",
  alternates: {
    canonical: "https://claim-works.com/about",
  },
};

export default function AboutPage() {
  return (
    <div className="space-y-8 px-3 sm:px-0">
      
      {/* 1. 소개 페이지 헤더 (메인 홈과 완벽히 동일한 스타일) */}
      <div className="border-b border-[var(--google-border)] pb-4">
        <h2 className="text-lg sm:text-xl font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--google-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          보상스쿨 플랫폼 소개
        </h2>
        <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] mt-1.5 break-keep">
          당신의 정당한 권리를 되찾는 여정, 보상스쿨이 든든한 나침반이 되겠습니다.
        </p>
      </div>

      {/* 2. 우리의 미션 (단일 카드) */}
      <article className="bg-white dark:bg-[#202124] rounded-none p-6 sm:p-8 border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
        <div className="mb-4">
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-none bg-[#e8f0fe] text-[var(--google-blue)] dark:bg-[#174ea6]/20 dark:text-[#8ab4f8]">
            Our Mission
          </span>
        </div>
        <h3 className="text-base sm:text-lg font-bold text-[#202124] dark:text-[#e8eaed] mb-4 leading-snug break-keep">
          정보의 비대칭성을 허물고, 환자 중심의 올바른 보상 기준을 세웁니다.
        </h3>
        <div className="space-y-3 text-[13px] sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed break-keep font-medium">
          <p>
            수많은 상해 및 질병 사고 피해자분들이 전문적인 의학/법률 지식의 부재로 인해 마땅히 받아야 할 치료를 놓치거나, 대기업 보험회사의 일방적인 주장에 이끌려 정당한 보상금을 포기하곤 합니다.
          </p>
          <p>
            우리는 이 기울어진 운동장을 바로잡고자 합니다. 건강보험심사평가원(HIRA)의 방대한 의료 통계와 현직 보상 실무 전문가들의 현장 노하우를 융합하여, 누구에게나 평등하고 투명한 &apos;무료 보상 가이드&apos;를 제공합니다.
          </p>
        </div>
      </article>

      {/* 3. E-E-A-T 4대 가치 (격자 카드) */}
      <div>
        <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] mb-4 flex items-center gap-1.5 px-1">
          <svg className="w-4 h-4 text-[var(--google-green)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          E-E-A-T 핵심 가치
        </h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          
          {/* E: Experience */}
          <article className="group bg-white dark:bg-[#202124] rounded-none p-5 border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:shadow-[0_16px_50px_rgba(26,115,232,0.2)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)] hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-[#e8f0fe] text-[var(--google-blue)] dark:bg-[#174ea6]/20 dark:text-[#8ab4f8] flex items-center justify-center font-bold text-xs">E</span>
              <h4 className="text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-blue)] transition-colors">
                Experience <span className="font-medium text-sm text-[#5f6368]">(경험)</span>
              </h4>
            </div>
            <p className="text-[13px] sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed break-keep">
              수천 건의 자동차사고, 배상책임, 개인보험 장해 평가 실무를 직접 수행하며 피땀으로 얻어낸 <strong>현장 중심의 실무 노하우</strong>를 그대로 전달합니다.
            </p>
          </article>

          {/* E: Expertise */}
          <article className="group bg-white dark:bg-[#202124] rounded-none p-5 border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:shadow-[0_16px_50px_rgba(26,115,232,0.2)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)] hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-[#fce8e6] text-[var(--google-red)] dark:bg-[#c5221f]/20 dark:text-[#f28b82] flex items-center justify-center font-bold text-xs">E</span>
              <h4 className="text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-red)] transition-colors">
                Expertise <span className="font-medium text-sm text-[#5f6368]">(전문성)</span>
              </h4>
            </div>
            <p className="text-[13px] sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed break-keep">
              일반인이 이해하기 힘든 <strong>복잡한 보험 약관과 맥브라이드, AMA 장해 평가 기준</strong>을 국가공인 전문가 그룹이 알기 쉽게 해석해 드립니다.
            </p>
          </article>

          {/* A: Authoritativeness */}
          <article className="group bg-white dark:bg-[#202124] rounded-none p-5 border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:shadow-[0_16px_50px_rgba(26,115,232,0.2)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)] hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-[#e6f4ea] text-[var(--google-green)] dark:bg-[#0d652d]/20 dark:text-[#81c995] flex items-center justify-center font-bold text-xs">A</span>
              <h4 className="text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-green)] transition-colors">
                Authoritativeness <span className="font-medium text-sm text-[#5f6368]">(권위성)</span>
              </h4>
            </div>
            <p className="text-[13px] sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed break-keep">
              단순한 인터넷 정보가 아닌, <strong>건강보험심사평가원(HIRA)의 공공 빅데이터</strong> 등 공신력 있는 국가 기관의 데이터를 근거로 객관성을 담보합니다.
            </p>
          </article>

          {/* T: Trustworthiness */}
          <article className="group bg-white dark:bg-[#202124] rounded-none p-5 border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:shadow-[0_16px_50px_rgba(26,115,232,0.2)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)] hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-[#fef7e0] text-[#b06000] dark:bg-[#e37400]/20 dark:text-[#fde293] flex items-center justify-center font-bold text-xs">T</span>
              <h4 className="text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[#b06000] dark:group-hover:text-[#fde293] transition-colors">
                Trustworthiness <span className="font-medium text-sm text-[#5f6368]">(신뢰성)</span>
              </h4>
            </div>
            <p className="text-[13px] sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed break-keep">
              특정 이익집단이나 보험사에 편향되지 않는 <strong>독립적인 가이드</strong>입니다. 자극적인 정보가 아닌 환자의 실질적 권리 회복만을 최우선으로 합니다.
            </p>
          </article>

        </div>
      </div>

      {/* 4. 법적 고지 (Empty State 스타일과 유사하게 미니멀) */}
      <div className="bg-white dark:bg-[#202124] rounded-none p-6 sm:p-8 text-center border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
        <svg className="w-8 h-8 text-[#dadce0] dark:text-[#5f6368] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <p className="text-[12px] sm:text-[13px] text-[#5f6368] dark:text-[#9aa0a6] font-medium leading-relaxed break-keep max-w-2xl mx-auto">
          보상스쿨 전문 손해사정 그룹에서 제공하는 모든 포스팅 및 통계 정보는 일반적인 참고용 자료입니다. 당사는 사이트 내 정보만으로 직접적인 법률 대리나 의료 진단 행위를 수행하지 않습니다. 정확한 장해 산정 및 합의 절차는 반드시 공인된 독립손해사정사나 법률 전문가와의 1:1 상담을 통해 결정하시기 바랍니다.
        </p>
      </div>

      {/* 5. CTA 버튼 */}
      <div className="pt-2">
        <Link 
          href="/blog"
          className="flex items-center justify-center w-full sm:w-auto mx-auto h-12 rounded-none bg-white dark:bg-[#202124] px-6 text-sm font-bold text-[#202124] dark:text-[#e8eaed] border border-[var(--google-border)] shadow-sm hover:shadow-md hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all duration-300 gap-1.5"
        >
          보상 실무 가이드 홈으로 이동
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </Link>
      </div>

    </div>
  );
}
