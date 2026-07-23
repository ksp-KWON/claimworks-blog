import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보처리방침 | 보상스쿨 헬스케어 & 손해사정 보상가이드',
  description: '보상스쿨 헬스케어 & 손해사정 보상가이드의 개인정보처리방침입니다.',
  alternates: {
    canonical: 'https://claim-works.com/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <div className="bg-white dark:bg-[#202124] rounded-none p-6 sm:p-12 border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#202124] dark:text-[#e8eaed] mb-8 pb-4 border-b border-gray-100 dark:border-white/5">
        개인정보처리방침
      </h1>
      <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-[#5f6368] dark:text-[#9aa0a6] space-y-6">
        <p>
          &quot;보상스쿨 헬스케어 &amp; 손해사정 보상가이드&quot;(이하 &quot;사이트&quot;)는 이용자의 개인정보를 중요시하며, 「개인정보보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법규를 준수하고 있습니다.
        </p>
        <p>
          본 사이트는 기본적으로 별도의 회원가입 없이 콘텐츠 열람 및 계산기 이용이 가능하며, 이 과정에서 <strong>이용자를 식별할 수 있는 민감한 개인정보를 수집하거나 저장하지 않습니다.</strong>
        </p>

        <section>
          <h3 className="font-bold text-[#202124] dark:text-[#e8eaed] mt-6 mb-2">1. 수집하는 개인정보 항목 및 수집 방법</h3>
          <p>
            - <strong>자동 수집 항목:</strong> 사이트 이용 과정에서 접속 IP 정보, 쿠키(Cookie), 접속 로그, 브라우저 종류 및 OS, 방문 일시 등 서비스 이용 기록이 자동으로 생성되어 수집될 수 있습니다.<br />
            - <strong>실시간 채팅 상담:</strong> 우측 하단의 실시간 채팅 상담 버튼을 통해 문의하실 경우, 상담 진행을 위해 실시간 채팅 프로필 정보(이름 등)가 해당 플랫폼을 통해 확인될 수 있으나, 본 사이트 서버에 별도로 저장하지 않습니다.<br />
            - <strong>수집 방법:</strong> 웹사이트 실행 및 이용 과정에서의 자동 수집
          </p>
        </section>

        <section>
          <h3 className="font-bold text-[#202124] dark:text-[#e8eaed] mt-6 mb-2">2. 개인정보의 수집 및 이용 목적</h3>
          <p>
            사이트는 수집한 정보를 다음의 목적을 위해 이용합니다.<br />
            - <strong>서비스 제공:</strong> 접속 빈도 파악 및 서비스 이용에 대한 통계<br />
            - <strong>서비스 개선:</strong> 이용자의 접속 환경에 최적화된 서비스 제공 및 신규 서비스 개발의 기초 자료
          </p>
        </section>

        <section>
          <h3 className="font-bold text-[#202124] dark:text-[#e8eaed] mt-6 mb-2">3. 개인정보의 보유 및 이용 기간</h3>
          <p>
            이용자의 개인정보는 원칙적으로 개인정보의 수집 및 이용목적이 달성되면 지체 없이 파기합니다. 단, 다음의 정보에 대해서는 아래의 이유로 명시한 기간 동안 보존합니다.
          </p>
          <p>
            - 보존 항목: 접속 로그, 접속 IP 정보<br />
            - 보존 근거: 통신비밀보호법<br />
            - 보존 기간: 3개월
          </p>
        </section>

        <section>
          <h3 className="font-bold text-[#202124] dark:text-[#e8eaed] mt-6 mb-2">4. 개인정보의 제3자 제공 및 위탁</h3>
          <p>
            사이트는 이용자의 사전 동의 없이는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 단, 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우는 예외로 합니다.
          </p>
        </section>

        <section>
          <h3 className="font-bold text-[#202124] dark:text-[#e8eaed] mt-6 mb-2">5. 쿠키(Cookie)의 운용 및 거부</h3>
          <p>
            사이트는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 &apos;쿠키(cookie)&apos;를 사용합니다. 쿠키는 웹사이트를 운영하는데 이용되는 서버가 이용자의 브라우저에게 보내는 소량의 정보이며 이용자들의 PC 컴퓨터내의 하드디스크에 저장되기도 합니다.
          </p>
          <p>
            - <strong>쿠키의 사용 목적:</strong> 이용자의 접속 빈도나 방문 시간 등을 파악하여 최적화된 정보 제공을 위해 사용됩니다.<br />
            - <strong>쿠키 설정 거부 방법:</strong> 이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다. 웹브라우저 상단의 도구 &gt; 인터넷 옵션 &gt; 개인정보 메뉴의 옵션 설정을 통해 모든 쿠키를 허용하거나, 거부할 수 있습니다.
          </p>
        </section>

        <div className="mt-12 text-sm text-[#5f6368] dark:text-[#9aa0a6] border-t border-gray-100 dark:border-white/5 pt-6">
          본 개인정보처리방침은 2024년 1월 1일부터 적용됩니다.
        </div>
      </div>
    </div>
  );
}
