import type { Metadata } from 'next';
import Link from 'next/link';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumBadge from '@/components/ui/PremiumBadge';
import PremiumHeaderBanner from '@/components/ui/PremiumHeaderBanner';
import AppIcon from '@/components/ui/AppIcon';

export const metadata: Metadata = {
  title: '서비스 이용약관 | 보상스쿨 전문 손해사정 그룹',
  description: '보상스쿨 전문 손해사정 그룹의 공식 서비스 이용약관 및 법적 면책 기준입니다.',
  alternates: {
    canonical: 'https://claim-works.com/terms',
  },
};

export default function TermsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* 상단 브레드크럼 */}
      <nav className="flex text-xs text-[#5f6368] dark:text-[#9aa0a6]" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1.5">
          <li><Link href="/" className="hover:text-[var(--google-blue)] transition-colors">홈</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="text-[#202124] dark:text-[#e8eaed] font-medium" aria-current="page">이용약관</li>
        </ol>
      </nav>

      {/* 헤더 배너 */}
      <PremiumHeaderBanner
        theme="blue"
        icon="file-text"
        title="보상스쿨 서비스 이용약관"
        badges={['공식 정책', { text: '시행일: 2024. 01. 01', color: 'gray' }]}
        description="보상스쿨 전문 손해사정 그룹(이하 &quot;사이트&quot;)의 서비스 이용 조건, 절차 및 권리·의무에 관한 기본 규정입니다."
      />

      {/* 본문 내용 */}
      <div className="space-y-5">
        {/* 제 1 장 총칙 */}
        <PremiumCard borderColor="blue" hoverEffect={false} className="!p-5 sm:!p-7">
          <div className="space-y-4">
            <PremiumHeading level={2} gradient="blue" showLeftBorder={true} className="!text-base sm:!text-lg">
              제 1 장 총칙
            </PremiumHeading>

            <div className="space-y-3 text-[13px] sm:text-[14px] text-[#3c4043] dark:text-[#bdc1c6] leading-[1.85] break-keep">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">제 1 조 (목적)</h3>
                <p>
                  본 약관은 보상스쿨 전문 손해사정 그룹(이하 &quot;사이트&quot;)이 제공하는 모든 서비스의 이용조건 및 절차, 이용자와 사이트의 권리, 의무, 책임사항과 기타 필요한 사항을 규정함을 목적으로 합니다.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">제 2 조 (용어의 정의)</h3>
                <ul className="list-disc list-inside space-y-1 pl-1">
                  <li><strong>&quot;이용자&quot;</strong>란 본 사이트에 접속하여 본 약관에 따라 사이트가 제공하는 서비스를 이용하는 자를 말합니다.</li>
                  <li><strong>&quot;서비스&quot;</strong>란 사이트가 이용자에게 제공하는 모든 정보(칼럼, 판례 분석, 계산기, 의료기관 정보 등) 제공 행위를 말합니다.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">제 3 조 (약관의 효력과 변경)</h3>
                <p>
                  본 약관은 사이트 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생하며, 관련 법령을 위배하지 않는 범위 내에서 약관을 개정할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </PremiumCard>

        {/* 제 2 장 서비스의 제공 및 이용 */}
        <PremiumCard borderColor="indigo" hoverEffect={false} className="!p-5 sm:!p-7">
          <div className="space-y-4">
            <PremiumHeading level={2} gradient="indigo" showLeftBorder={true} className="!text-base sm:!text-lg">
              제 2 장 서비스의 제공 및 법적 한계
            </PremiumHeading>

            <div className="space-y-3 text-[13px] sm:text-[14px] text-[#3c4043] dark:text-[#bdc1c6] leading-[1.85] break-keep">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">제 4 조 (서비스의 내용)</h3>
                <p>사이트는 다음과 같은 정보 및 편의 기능을 제공합니다.</p>
                <ul className="list-disc list-inside space-y-1 pl-1 text-xs sm:text-[13px] text-gray-600 dark:text-zinc-400 mt-1">
                  <li>손해사정, 보상 분쟁 판례 및 실무 가이드 칼럼 제공</li>
                  <li>건강보험심사평가원(HIRA) 공공 빅데이터 기반 지역별 의료기관 정보 제공</li>
                  <li>자동차보험, 실손의료비, 배상책임 예상 보상금 산출 계산기 서비스</li>
                  <li>손해사정 전문가와의 1:1 상담 안내 및 연결 서비스</li>
                </ul>
              </div>

              <div className="bg-amber-50/70 dark:bg-amber-950/20 p-4 border border-amber-200/80 dark:border-amber-900/40 rounded-none space-y-2">
                <h3 className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <AppIcon name="shield-alert" size={16} className="text-amber-600 shrink-0" />
                  제 5 조 (서비스 이용의 한계 및 면책 조항)
                </h3>
                <div className="text-xs sm:text-[13px] text-amber-950/80 dark:text-amber-300/80 space-y-1.5 leading-relaxed">
                  <p>
                    1. 사이트에서 제공하는 모든 정보 및 계산기 산출 결과는 <strong>참고용 추정치</strong>이며, 법적 또는 의학적 최종 판단의 근거로 사용될 수 없습니다.
                  </p>
                  <p>
                    2. 실제 보상 금액 및 판결 결과는 개별 사고의 구체적 사실관계, 보험사별 약관, 관련 법령 및 법원 신체감정 결과에 따라 달라지므로, 권익 보호를 위해 <strong>반드시 공인 손해사정사와 직접 상담</strong>하시길 권합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </PremiumCard>

        {/* 제 3 장 권리와 의무 */}
        <PremiumCard borderColor="green" hoverEffect={false} className="!p-5 sm:!p-7">
          <div className="space-y-4">
            <PremiumHeading level={2} gradient="green" showLeftBorder={true} className="!text-base sm:!text-lg">
              제 3 장 지적재산권 및 이용자 준수사항
            </PremiumHeading>

            <div className="space-y-3 text-[13px] sm:text-[14px] text-[#3c4043] dark:text-[#bdc1c6] leading-[1.85] break-keep">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">제 6 조 (저작권의 귀속 및 무단 복제 금지)</h3>
                <p>
                  사이트에 게시된 모든 분석 칼럼, 판례 해설, 알고리즘 및 저작물에 대한 지적재산권은 보상스쿨에 귀속됩니다. 사이트의 사전 승낙 없이 무단 전재, 복제, 배포 또는 상업적 이용을 엄격히 금지합니다.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1">제 7 조 (이용자의 의무)</h3>
                <p>
                  이용자는 사이트의 정상적인 운영을 방해하거나, 타인의 명예 및 권리를 침해하는 행위, 악성 프로그램의 유포 행위를 하여서는 안 됩니다.
                </p>
              </div>
            </div>
          </div>
        </PremiumCard>
      </div>

      {/* 하단 푸터 고지 */}
      <div className="text-center py-4 text-xs text-[#5f6368] dark:text-[#9aa0a6]">
        본 약관은 2024년 1월 1일부터 제정되어 시행되고 있습니다.
      </div>
    </div>
  );
}
