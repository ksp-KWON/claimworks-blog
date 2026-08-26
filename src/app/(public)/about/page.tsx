import { Metadata } from 'next';
import CredentialsGallery from '@/components/CredentialsGallery';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumBadge from '@/components/ui/PremiumBadge';
import PremiumButton from '@/components/ui/PremiumButton';
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
    <div className="space-y-8 px-3 sm:px-0 max-w-5xl mx-auto">
      
      {/* 1. 소개 페이지 헤더 배너 */}
      <PremiumCard borderColor="indigo" hoverEffect={false} watermarkIcon="shield-check" className="!p-5 sm:!p-7">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <PremiumBadge color="indigo">공인 손해사정 그룹</PremiumBadge>
            <PremiumBadge color="green">금융감독원 등록</PremiumBadge>
          </div>
          <PremiumHeading 
            level={1} 
            gradient="indigo" 
            showLeftBorder={false}
            icon={<AppIcon name="shield-check" size={24} className="text-indigo-600 dark:text-indigo-400 shrink-0" />}
            className="!mb-2 !text-xl sm:!text-2xl"
          >
            보상스쿨 플랫폼 소개 & 전문 자격 인증
          </PremiumHeading>
          <p className="text-xs sm:text-[14px] text-[#5f6368] dark:text-[#9aa0a6] font-medium leading-relaxed break-keep">
            금융감독원 공인 신체손해사정사와 보험심사·조사 공인 전문가 그룹이 이끄는 독립 손해사정 플랫폼입니다.
          </p>
        </div>
      </PremiumCard>

      {/* 2. 핵심 미션 선언문 */}
      <PremiumCard borderColor="blue" hoverEffect watermarkIcon="compass" className="!p-5 sm:!p-7">
        <div className="relative z-10">
          <PremiumHeading 
            level={2} 
            gradient="blue" 
            showLeftBorder={true}
            icon={<AppIcon name="compass" size={20} className="text-[var(--google-blue)] dark:text-[#8ab4f8] shrink-0" />}
            className="!text-lg sm:!text-xl"
          >
            기울어진 운동장을 바로잡는 정직한 나침반
          </PremiumHeading>
          <div className="space-y-3.5 text-[13.5px] sm:text-[14.5px] text-[#3c4043] dark:text-[#bdc1c6] leading-[1.85] break-keep mt-4">
            <p>
              보험 사고가 발생했을 때, 거대 보험사는 막대한 자본과 전문 의료·법률 인력을 바탕으로 면책과 삭감 논리를 정교하게 구성합니다. 반면, 정보와 의학 지식이 부족한 일반 소비자는 보험사의 일방적인 부지급 안내문 앞에서 막막한 현실에 부딪힙니다.
            </p>
            <p>
              <strong className="text-indigo-600 dark:text-indigo-400 font-bold">보상스쿨</strong>은 이 불공평한 구조를 바로잡기 위해 탄생했습니다. 건강보험심사평가원(HIRA)의 공공 빅데이터와 <strong className="text-blue-600 dark:text-blue-400 font-bold">18년간 축적된 보험 전주기(상품 설계·언더라이팅·손해사정) 실무 노하우</strong>를 바탕으로, 소비자의 정당한 권익을 투명하고 평등하게 지켜드립니다.
            </p>
          </div>
        </div>
      </PremiumCard>

      {/* 3. 🌟 4대 국가공인 & 전문 라이선스 인증 섹션 (핵심 E-E-A-T 증명) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <PremiumHeading 
              level={2} 
              gradient="green" 
              showLeftBorder={true}
              icon={<AppIcon name="award" size={20} className="text-[var(--google-green)] dark:text-[#81c995] shrink-0" />}
              className="!mb-1 !text-lg"
            >
              국가공인 및 전문 라이선스 인증
            </PremiumHeading>
            <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">
              공식 기관의 직인과 등록번호가 부여된 1급 공인 전문 자격증서입니다. (카드 클릭 시 확대 뷰)
            </p>
          </div>
          <PremiumBadge color="green" className="w-fit flex items-center gap-1">
            <AppIcon name="check" size={12} />
            <span>공식 검증 완료</span>
          </PremiumBadge>
        </div>

        {/* 4대 자격증 실물 갤러리 */}
        <CredentialsGallery />
      </section>

      {/* 4. 📜 18년 보험 전주기(全週期) 마스터 커리어 타임라인 */}
      <section className="space-y-4">
        <div className="px-1">
          <PremiumHeading 
            level={2} 
            gradient="indigo" 
            showLeftBorder={true}
            icon={<AppIcon name="trending-up" size={20} className="text-indigo-600 dark:text-indigo-400 shrink-0" />}
            className="!mb-1 !text-lg"
          >
            2007년부터 이어진 18년 보험 전주기(全週期) 실무 이력
          </PremiumHeading>
          <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">
            보험사의 상품 설계부터 언더라이팅 심사, 보상 조사 기법까지 전체 과정을 꿰뚫어 완벽한 반박 논리를 구축합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* STAGE 01 */}
          <PremiumCard borderColor="blue" hoverEffect watermarkIcon="book" className="!p-4 sm:!p-5">
            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 tracking-wider">STAGE 01</span>
                <PremiumBadge color="blue">2007 ~ 2015</PremiumBadge>
              </div>
              <h3 className="text-[14.5px] font-bold text-gray-900 dark:text-white">
                보험 상품 구조 & 약관 설계 정복
              </h3>
              <p className="text-[12px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed break-keep">
                생명보험·손해보험·제3보험·변액보험 공인 자격을 바탕으로, 보험사가 상품을 설계하는 메커니즘과 약관 조항의 뼈대를 완벽히 체득했습니다.
              </p>
            </div>
          </PremiumCard>

          {/* STAGE 02 */}
          <PremiumCard borderColor="indigo" hoverEffect watermarkIcon="scale" className="!p-4 sm:!p-5">
            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">STAGE 02</span>
                <PremiumBadge color="indigo">2020 ~ 현재</PremiumBadge>
              </div>
              <h3 className="text-[14.5px] font-bold text-indigo-600 dark:text-indigo-400">
                국가공인 신체손해사정 실무
              </h3>
              <p className="text-[12px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed break-keep">
                금융감독원 등록 신체손해사정사로서 수천 건의 교통사고, 배상책임, 후유장해 및 질병 보상 분쟁을 직접 수행하며 현장 중심의 승소 데이터를 축적했습니다.
              </p>
            </div>
          </PremiumCard>

          {/* STAGE 03 */}
          <PremiumCard borderColor="green" hoverEffect watermarkIcon="award" className="!p-4 sm:!p-5">
            <div className="relative z-10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">STAGE 03</span>
                <PremiumBadge color="green">2023 ~ 2024</PremiumBadge>
              </div>
              <h3 className="text-[14.5px] font-bold text-emerald-600 dark:text-emerald-400">
                언더라이팅 & 사기조사 최고 전문역
              </h3>
              <p className="text-[12px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed break-keep">
                CKLU(생보심사)·APIU(개인보험심사)·CIFI(보험조사분석) 트리플 크라운을 달성하여 보험사의 의학적 삭감 명분을 사전에 완벽히 무력화합니다.
              </p>
            </div>
          </PremiumCard>
        </div>
      </section>

      {/* 5. E-E-A-T 4대 가치 (격자 카드) */}
      <section className="space-y-4">
        <div className="px-1">
          <PremiumHeading 
            level={2} 
            gradient="default" 
            showLeftBorder={true}
            icon={<AppIcon name="shield" size={20} className="text-[var(--google-blue)] dark:text-[#8ab4f8] shrink-0" />}
            className="!mb-1 !text-lg"
          >
            보상스쿨이 지키는 4대 핵심 가치 (E-E-A-T)
          </PremiumHeading>
          <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">
            구글 국제 표준 E-E-A-T 가이드라인에 입각한 공인 손해사정 그룹의 행동 원칙입니다.
          </p>
        </div>
        
        <div className="grid gap-3.5 sm:grid-cols-2">
          
          {/* E: Experience */}
          <PremiumCard borderColor="blue" hoverEffect watermarkIcon="car" className="!p-5">
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-none bg-blue-100 text-[var(--google-blue)] dark:bg-blue-900/30 dark:text-[#8ab4f8] flex items-center justify-center font-bold text-xs">E</span>
                <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">
                  Experience <span className="font-medium text-xs text-[#5f6368] dark:text-[#9aa0a6]">(경험)</span>
                </h3>
              </div>
              <p className="text-[13px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed break-keep">
                수천 건의 자동차사고, 배상책임, 개인보험 장해 평가 실무를 직접 수행하며 피땀으로 얻어낸 <strong className="text-[var(--google-blue)] dark:text-[#8ab4f8]">현장 중심의 실무 노하우</strong>를 전달합니다.
              </p>
            </div>
          </PremiumCard>

          {/* E: Expertise */}
          <PremiumCard borderColor="indigo" hoverEffect watermarkIcon="stethoscope" className="!p-5">
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-none bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">E</span>
                <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">
                  Expertise <span className="font-medium text-xs text-[#5f6368] dark:text-[#9aa0a6]">(전문성)</span>
                </h3>
              </div>
              <p className="text-[13px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed break-keep">
                일반인이 이해하기 힘든 <strong className="text-indigo-600 dark:text-indigo-400">복잡한 보험 약관과 맥브라이드, AMA 장해 평가 기준</strong>을 국가공인 손해사정사가 명쾌하게 분석합니다.
              </p>
            </div>
          </PremiumCard>

          {/* A: Authoritativeness */}
          <PremiumCard borderColor="green" hoverEffect watermarkIcon="landmark" className="!p-5">
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-none bg-emerald-100 text-[var(--google-green)] dark:bg-emerald-900/30 dark:text-[#81c995] flex items-center justify-center font-bold text-xs">A</span>
                <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">
                  Authoritativeness <span className="font-medium text-xs text-[#5f6368] dark:text-[#9aa0a6]">(권위성)</span>
                </h3>
              </div>
              <p className="text-[13px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed break-keep">
                단순한 인터넷 정보가 아닌, <strong className="text-[var(--google-green)] dark:text-[#81c995]">금융감독원 등록 라이선스와 HIRA 공공 빅데이터</strong>를 바탕으로 법적·의학적 객관성을 담보합니다.
              </p>
            </div>
          </PremiumCard>

          {/* T: Trustworthiness */}
          <PremiumCard borderColor="yellow" hoverEffect watermarkIcon="shield-check" className="!p-5">
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-none bg-amber-100 text-[#b06000] dark:bg-amber-900/30 dark:text-[#fde293] flex items-center justify-center font-bold text-xs">T</span>
                <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">
                  Trustworthiness <span className="font-medium text-xs text-[#5f6368] dark:text-[#9aa0a6]">(신뢰성)</span>
                </h3>
              </div>
              <p className="text-[13px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed break-keep">
                특정 보험사에 종속되지 않는 <strong className="text-amber-700 dark:text-amber-300">소비자 중심의 독립 손해사정 원칙</strong>을 준수하며, 오직 피해자의 정당한 권리만을 위해 행동합니다.
              </p>
            </div>
          </PremiumCard>

        </div>
      </section>

      {/* 6. 법적 고지 박스 */}
      <PremiumCard borderColor="default" hoverEffect={false} className="!p-5 text-center">
        <p className="text-[12px] text-[#5f6368] dark:text-[#9aa0a6] font-medium leading-relaxed break-keep max-w-2xl mx-auto">
          보상스쿨 전문 손해사정 그룹은 보험업법에 따라 공인된 손해사정 업무를 수행합니다. 정확한 장해 산정 및 권리 구제 방안은 전문 손해사정사와의 1:1 상담을 통해 확인하실 수 있습니다.
        </p>
      </PremiumCard>

      {/* 7. CTA 버튼 */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
        <PremiumButton 
          variant="primary" 
          href="/consultation"
          icon={<AppIcon name="file-text" size={16} />}
          className="w-full sm:w-auto !h-12 !px-8 !text-sm bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20"
        >
          손해사정사 1:1 무료 상담 신청
        </PremiumButton>
        <PremiumButton 
          variant="secondary" 
          href="/blog"
          icon={<AppIcon name="book" size={16} />}
          className="w-full sm:w-auto !h-12 !px-7 !text-sm"
        >
          보상 실무 칼럼 둘러보기
        </PremiumButton>
      </div>

    </div>
  );
}
