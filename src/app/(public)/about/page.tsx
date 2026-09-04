import Link from 'next/link';
import { Metadata } from 'next';
import CredentialsGallery from '@/components/CredentialsGallery';
import PremiumHeaderBanner from '@/components/ui/PremiumHeaderBanner';
import SectionLayout from '@/components/ui/SectionLayout';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumBadge from '@/components/ui/PremiumBadge';
import AppIcon from '@/components/ui/AppIcon';

export const metadata: Metadata = {
  title: '플랫폼 소개 & 공인 라이선스 | 보상스쿨 전문 손해사정 그룹',
  description: '금융감독원 공인 신체손해사정사 및 보험조사분석사(CIFI), 생명보험심사역(CKLU), 개인보험심사역(APIU) 공인 라이선스를 바탕으로 18년 보험 전주기 전문성을 증명합니다.',
  alternates: {
    canonical: 'https://claim-works.com/about',
  },
  openGraph: {
    title: '플랫폼 소개 & 공인 라이선스 | 보상스쿨 전문 손해사정 그룹',
    description: '금융감독원 공인 신체손해사정사 및 보험조사분석사(CIFI), 생명보험심사역(CKLU), 개인보험심사역(APIU) 공인 라이선스 증명',
    url: 'https://claim-works.com/about',
    siteName: '보상스쿨 전문 손해사정 그룹',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: 'https://claim-works.com/og-image.png',
        width: 1200,
        height: 630,
        alt: '보상스쿨 플랫폼 소개 및 공인 라이선스',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '플랫폼 소개 & 공인 라이선스 | 보상스쿨 전문 손해사정 그룹',
    description: '금융감독원 공인 신체손해사정사 그룹의 E-E-A-T 공인 라이선스 증명',
    images: ['https://claim-works.com/og-image.png'],
  },
};

export default function AboutPage() {
  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* 1. 상단 브레드크럼 */}
      <nav className="flex text-xs text-[#5f6368] dark:text-[#9aa0a6]" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1.5">
          <li><Link href="/" className="hover:text-[var(--google-blue)] transition-colors">홈</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="text-[#202124] dark:text-[#e8eaed] font-medium" aria-current="page">플랫폼 소개 & 공인 라이선스</li>
        </ol>
      </nav>

      {/* 2. 전역 표준 메인 헤더 배너 */}
      <PremiumHeaderBanner
        theme="indigo"
        icon="shield-check"
        title="보상스쿨 플랫폼 소개 & 전문 자격 인증"
        badges={['공인 손해사정 그룹', { text: '금융감독원 등록 1급 전문인', color: 'green' }]}
        description="금융감독원 공인 신체손해사정사와 보험심사·조사 공인 전문가 그룹이 이끄는 독립 손해사정 플랫폼입니다."
      />

      {/* 3. 섹션 1: 플랫폼 철학 & 미션 선언문 */}
      <SectionLayout
        title="기울어진 운동장을 바로잡는 정직한 나침반"
        icon={<AppIcon name="compass" size={20} />}
        themeColor="blue"
        description="거대 보험사의 일방적인 삭감·면책 논리에 맞서 소비자의 정당한 권익을 수호합니다."
      >
        <PremiumCard borderColor="blue" hoverEffect={false} className="!p-5 sm:!p-7">
          <div className="space-y-4 text-[13.5px] sm:text-[14.5px] text-[#3c4043] dark:text-[#bdc1c6] leading-[1.85] break-keep">
            <p>
              보험 사고가 발생했을 때, 거대 보험사는 막대한 자본과 전문 의료·법률 인력을 바탕으로 면책과 삭감 논리를 정교하게 구성합니다. 반면, 정보와 의학 지식이 부족한 일반 소비자는 보험사의 일방적인 부지급 안내문 앞에서 막막한 현실에 부딪힙니다.
            </p>
            <p>
              <strong className="text-indigo-600 dark:text-indigo-400 font-bold">보상스쿨</strong>은 이 불공평한 구조를 바로잡기 위해 탄생했습니다. 건강보험심사평가원(HIRA)의 공공 빅데이터와 <strong className="text-blue-600 dark:text-blue-400 font-bold">18년간 축적된 보험 전주기(상품 설계·언더라이팅·손해사정) 실무 노하우</strong>를 바탕으로, 소비자의 정당한 권익을 투명하고 평등하게 지켜드립니다.
            </p>
          </div>
        </PremiumCard>
      </SectionLayout>

      {/* 4. 섹션 2: 4대 국가공인 & 전문 라이선스 인증 (E-E-A-T 증명) */}
      <SectionLayout
        title="국가공인 및 전문 라이선스 실물 인증"
        icon={<AppIcon name="award" size={20} />}
        themeColor="green"
        description="공식 기관의 직인과 등록번호가 부여된 1급 공인 전문 자격증서입니다. (카드를 클릭하시면 고화질 원본 증서를 확인하실 수 있습니다.)"
      >
        <CredentialsGallery />
      </SectionLayout>

      {/* 5. 섹션 3: 18년 보험 전주기(全週期) 실무 이력 */}
      <SectionLayout
        title="2007년부터 이어진 18년 보험 전주기(全週期) 실무 이력"
        icon={<AppIcon name="trending-up" size={20} />}
        themeColor="purple"
        description="보험사의 상품 설계부터 언더라이팅 심사, 보상 조사 기법까지 전체 과정을 꿰뚫어 완벽한 반박 논리를 구축합니다."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          {/* STAGE 01 */}
          <PremiumCard borderColor="blue" hoverEffect watermarkIcon="book" className="!p-4 sm:!p-5">
            <div className="relative z-10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 tracking-wider">STAGE 01</span>
                <PremiumBadge color="blue">2007 ~ 2015</PremiumBadge>
              </div>
              <h3 className="text-[14.5px] sm:text-base font-bold text-[#202124] dark:text-[#e8eaed]">
                보험 상품 구조 & 약관 설계 정복
              </h3>
              <p className="text-[12px] sm:text-[13px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed break-keep font-medium">
                생명보험·손해보험·제3보험·변액보험 공인 자격을 바탕으로, 보험사가 상품을 설계하는 메커니즘과 약관 조항의 뼈대를 완벽히 체득했습니다.
              </p>
            </div>
          </PremiumCard>

          {/* STAGE 02 */}
          <PremiumCard borderColor="indigo" hoverEffect watermarkIcon="scale" className="!p-4 sm:!p-5">
            <div className="relative z-10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">STAGE 02</span>
                <PremiumBadge color="indigo">2020 ~ 현재</PremiumBadge>
              </div>
              <h3 className="text-[14.5px] sm:text-base font-bold text-indigo-600 dark:text-indigo-400">
                국가공인 신체손해사정 실무
              </h3>
              <p className="text-[12px] sm:text-[13px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed break-keep font-medium">
                금융감독원 등록 신체손해사정사로서 다수의 교통사고, 배상책임, 후유장해 및 질병 보상 분쟁을 직접 수행하며 현장 중심의 실무 데이터를 축적했습니다.
              </p>
            </div>
          </PremiumCard>

          {/* STAGE 03 */}
          <PremiumCard borderColor="green" hoverEffect watermarkIcon="award" className="!p-4 sm:!p-5">
            <div className="relative z-10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">STAGE 03</span>
                <PremiumBadge color="green">2023 ~ 2024</PremiumBadge>
              </div>
              <h3 className="text-[14.5px] sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
                언더라이팅 & 사기조사 최고 전문역
              </h3>
              <p className="text-[12px] sm:text-[13px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed break-keep font-medium">
                CKLU(생보심사)·APIU(개인보험심사)·CIFI(보험조사분석) 자격을 모두 취득하여 보험사의 의학적 삭감 근거를 사전에 면밀히 검토·대응합니다.
              </p>
            </div>
          </PremiumCard>
        </div>
      </SectionLayout>

      {/* 6. 섹션 4: E-E-A-T 4대 행동 원칙 */}
      <SectionLayout
        title="보상스쿨이 지키는 4대 핵심 가치 (E-E-A-T)"
        icon={<AppIcon name="shield" size={20} />}
        themeColor="yellow"
        description="구글 국제 표준 E-E-A-T 가이드라인에 입각한 공인 손해사정 그룹의 4대 행동 원칙입니다."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
          {/* E: Experience */}
          <PremiumCard borderColor="blue" hoverEffect watermarkIcon="car" className="!p-4 sm:!p-5">
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-[var(--google-blue)] dark:bg-blue-900/40 dark:text-[#8ab4f8] flex items-center justify-center font-bold text-xs">E</span>
                <h3 className="text-sm sm:text-[15px] font-bold text-[#202124] dark:text-[#e8eaed]">
                  Experience <span className="font-medium text-xs text-[#5f6368] dark:text-[#9aa0a6]">(풍부한 실무 경험)</span>
                </h3>
              </div>
              <p className="text-xs sm:text-[13px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed break-keep font-medium">
                다수의 자동차사고, 배상책임, 개인보험 장해 평가 실무를 직접 수행하며 축적한 <strong className="text-[var(--google-blue)] dark:text-[#8ab4f8]">현장 중심의 실무 노하우</strong>를 전달합니다.
              </p>
            </div>
          </PremiumCard>

          {/* E: Expertise */}
          <PremiumCard borderColor="indigo" hoverEffect watermarkIcon="stethoscope" className="!p-4 sm:!p-5">
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">E</span>
                <h3 className="text-sm sm:text-[15px] font-bold text-[#202124] dark:text-[#e8eaed]">
                  Expertise <span className="font-medium text-xs text-[#5f6368] dark:text-[#9aa0a6]">(공인된 의학·법률 전문성)</span>
                </h3>
              </div>
              <p className="text-xs sm:text-[13px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed break-keep font-medium">
                일반인이 이해하기 힘든 <strong className="text-indigo-600 dark:text-indigo-400">복잡한 보험 약관과 맥브라이드, AMA 장해 평가 기준</strong>을 국가공인 손해사정사가 명쾌하게 분석합니다.
              </p>
            </div>
          </PremiumCard>

          {/* A: Authoritativeness */}
          <PremiumCard borderColor="green" hoverEffect watermarkIcon="landmark" className="!p-4 sm:!p-5">
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-100 text-[var(--google-green)] dark:bg-emerald-900/40 dark:text-[#81c995] flex items-center justify-center font-bold text-xs">A</span>
                <h3 className="text-sm sm:text-[15px] font-bold text-[#202124] dark:text-[#e8eaed]">
                  Authoritativeness <span className="font-medium text-xs text-[#5f6368] dark:text-[#9aa0a6]">(국가공인 권위성)</span>
                </h3>
              </div>
              <p className="text-xs sm:text-[13px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed break-keep font-medium">
                단순한 인터넷 정보가 아닌, <strong className="text-[var(--google-green)] dark:text-[#81c995]">금융감독원 등록 라이선스와 HIRA 공공 빅데이터</strong>를 바탕으로 법적·의학적 객관성을 담보합니다.
              </p>
            </div>
          </PremiumCard>

          {/* T: Trustworthiness */}
          <PremiumCard borderColor="yellow" hoverEffect watermarkIcon="shield-check" className="!p-4 sm:!p-5">
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-amber-100 text-[#b06000] dark:bg-amber-900/40 dark:text-[#fde293] flex items-center justify-center font-bold text-xs">T</span>
                <h3 className="text-sm sm:text-[15px] font-bold text-[#202124] dark:text-[#e8eaed]">
                  Trustworthiness <span className="font-medium text-xs text-[#5f6368] dark:text-[#9aa0a6]">(소비자 권익 신뢰성)</span>
                </h3>
              </div>
              <p className="text-xs sm:text-[13px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed break-keep font-medium">
                특정 보험사에 종속되지 않는 <strong className="text-amber-700 dark:text-amber-300">소비자 중심의 독립 손해사정 원칙</strong>을 준수하며, 오직 피해자의 정당한 권리만을 위해 행동합니다.
              </p>
            </div>
          </PremiumCard>
        </div>
      </SectionLayout>

      {/* 7. 하단 1:1 전문 상담 연계 배너 & 법적 고지 */}
      <PremiumCard 
        borderColor="blue" 
        hoverEffect={true} 
        watermarkIcon="shield" 
        className="!p-6 sm:!p-8 !bg-gradient-to-r !from-blue-50/90 !via-indigo-50/40 !to-transparent dark:!from-blue-950/40 dark:!via-indigo-950/20 dark:!to-transparent border-blue-200/90 dark:border-blue-900/50 text-center sm:text-left"
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <PremiumBadge color="blue">1:1 맞춤형 진단</PremiumBadge>
              <PremiumBadge color="green">금융감독원 공인 전문가</PremiumBadge>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#202124] dark:text-[#e8eaed]">
              정당한 권리 구제를 위해 손해사정사와 직접 상의하세요
            </h3>
            <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-xl font-medium">
              보상스쿨 전문 손해사정 그룹은 보험업법에 따라 공인된 손해사정 업무를 수행하며, 착수금 없는 투명한 무료 진단을 제공합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <Link
              href="/consultation"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
            >
              <span>1:1 무료상담 신청</span>
              <AppIcon name="chevron-right" size={14} />
            </Link>
            <Link
              href="/blog"
              className="px-4 py-2.5 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-[#202124] dark:text-[#e8eaed] border border-gray-300 dark:border-zinc-700 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all"
            >
              <AppIcon name="book" size={14} />
              <span>보상 실무 칼럼</span>
            </Link>
          </div>
        </div>
      </PremiumCard>
    </div>
  );
}
