import type { Metadata } from 'next';
import Link from 'next/link';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumBadge from '@/components/ui/PremiumBadge';
import AppIcon from '@/components/ui/AppIcon';

export const metadata: Metadata = {
  title: '개인정보처리방침 | 보상스쿨 전문 손해사정 그룹',
  description: '보상스쿨 전문 손해사정 그룹의 개인정보보호 정책 및 투명한 처리 방침입니다.',
  alternates: {
    canonical: 'https://claim-works.com/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* 상단 브레드크럼 */}
      <nav className="flex text-xs text-[#5f6368] dark:text-[#9aa0a6]" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1.5">
          <li><Link href="/" className="hover:text-[var(--google-blue)] transition-colors">홈</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="text-[#202124] dark:text-[#e8eaed] font-medium" aria-current="page">개인정보처리방침</li>
        </ol>
      </nav>

      {/* 헤더 배너 */}
      <PremiumCard borderColor="green" hoverEffect={false} watermarkIcon="shield-check" className="!p-6 sm:!p-8">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <PremiumBadge color="green">개인정보보호법 준수</PremiumBadge>
            <PremiumBadge color="gray">시행일: 2024. 01. 01</PremiumBadge>
          </div>
          <PremiumHeading 
            level={1} 
            gradient="green" 
            showLeftBorder={false}
            icon={<AppIcon name="shield-check" size={24} className="text-emerald-600 dark:text-emerald-400 shrink-0" />}
            className="!mb-2 !text-xl sm:!text-2xl"
          >
            보상스쿨 개인정보처리방침
          </PremiumHeading>
          <p className="text-xs sm:text-[13.5px] text-[#5f6368] dark:text-[#9aa0a6] font-medium leading-relaxed break-keep">
            보상스쿨은 이용자의 소중한 개인정보를 철저히 보호하며, 별도의 불필요한 개인정보 저장을 지양하는 안전한 플랫폼입니다.
          </p>
        </div>
      </PremiumCard>

      {/* 본문 내용 */}
      <div className="space-y-5">
        {/* 핵심 선언문 */}
        <PremiumCard borderColor="blue" hoverEffect={false} className="!p-5 sm:!p-7">
          <div className="space-y-3 text-[13px] sm:text-[14px] text-[#3c4043] dark:text-[#bdc1c6] leading-[1.85] break-keep">
            <p>
              &quot;보상스쿨 전문 손해사정 그룹&quot;(이하 &quot;사이트&quot;)은 「개인정보보호법」 및 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」을 준수하고 있습니다.
            </p>
            <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 rounded-none text-xs sm:text-[13px] text-blue-900 dark:text-blue-300 font-medium">
              💡 <strong>회원가입 없는 안심 이용:</strong> 본 사이트는 별도의 회원가입 없이 모든 콘텐츠와 계산기 서비스를 무료로 이용할 수 있으며, 이 과정에서 <strong>식별 가능한 민감한 개인정보를 수집하거나 서버에 저장하지 않습니다.</strong>
            </div>
          </div>
        </PremiumCard>

        {/* 1. 수집 항목 및 방법 */}
        <PremiumCard borderColor="indigo" hoverEffect={false} className="!p-5 sm:!p-7">
          <div className="space-y-3">
            <PremiumHeading level={2} gradient="indigo" showLeftBorder={true} className="!text-base sm:!text-lg">
              1. 수집하는 개인정보 항목 및 수집 방법
            </PremiumHeading>

            <div className="space-y-2 text-[13px] sm:text-[14px] text-[#3c4043] dark:text-[#bdc1c6] leading-[1.85] break-keep">
              <ul className="list-disc list-inside space-y-1.5 pl-1">
                <li><strong>서비스 이용 자동 생성 정보:</strong> 접속 로그, 접속 IP 주소, 브라우저 종류, 방문 일시 등 (통계 및 시스템 안정성 유지 목적)</li>
                <li><strong>실시간 1:1 상담 문의:</strong> 상담 진행 시 카카오톡 또는 채팅 위젯을 통해 문의자가 자발적으로 제공하는 상담 내용에 한하여 활용되며, 목적 달성 후 안전하게 처리됩니다.</li>
              </ul>
            </div>
          </div>
        </PremiumCard>

        {/* 2. 개인정보의 이용 목적 및 보유 기간 */}
        <PremiumCard borderColor="green" hoverEffect={false} className="!p-5 sm:!p-7">
          <div className="space-y-3">
            <PremiumHeading level={2} gradient="green" showLeftBorder={true} className="!text-base sm:!text-lg">
              2. 개인정보의 이용 목적 및 보유 기간
            </PremiumHeading>

            <div className="space-y-2 text-[13px] sm:text-[14px] text-[#3c4043] dark:text-[#bdc1c6] leading-[1.85] break-keep">
              <p>수집된 최소한의 기술적 정보는 다음 목적으로만 이용됩니다.</p>
              <ul className="list-disc list-inside space-y-1 pl-1 text-xs sm:text-[13px] text-gray-600 dark:text-zinc-400">
                <li>사이트 품질 개선 및 접속 기기별 최적화 화면 제공</li>
                <li>부정 이용 방지 및 시스템 보안 강화</li>
              </ul>
              <p className="pt-2 text-xs text-gray-500">
                ※ 법정 보존 기준: 통신비밀보호법에 따른 웹사이트 접속 로그 기록 (3개월 보존 후 영구 파기)
              </p>
            </div>
          </div>
        </PremiumCard>

        {/* 3. 쿠키(Cookie) 운용 및 제3자 제공 원칙 */}
        <PremiumCard borderColor="purple" hoverEffect={false} className="!p-5 sm:!p-7">
          <div className="space-y-3">
            <PremiumHeading level={2} gradient="purple" showLeftBorder={true} className="!text-base sm:!text-lg">
              3. 쿠키(Cookie) 운용 및 제3자 제공 원칙
            </PremiumHeading>

            <div className="space-y-2.5 text-[13px] sm:text-[14px] text-[#3c4043] dark:text-[#bdc1c6] leading-[1.85] break-keep">
              <p>
                1. <strong>제3자 제공 금지:</strong> 사이트는 이용자의 동의 없이 개인정보를 외부에 제공하거나 위탁하지 않습니다. (법령에 따른 적법한 수사기관의 요청 제외)
              </p>
              <p>
                2. <strong>쿠키의 설정:</strong> 다크모드 설정 등 사용자 환경 저장을 위해 쿠키를 활용할 수 있으며, 이용자는 브라우저 설정을 통해 쿠키 저장을 언제든지 거부할 수 있습니다.
              </p>
            </div>
          </div>
        </PremiumCard>
      </div>

      {/* 하단 푸터 고지 */}
      <div className="text-center py-4 text-xs text-[#5f6368] dark:text-[#9aa0a6]">
        본 개인정보처리방침은 2024년 1월 1일부터 제정되어 시행되고 있습니다.
      </div>
    </div>
  );
}
