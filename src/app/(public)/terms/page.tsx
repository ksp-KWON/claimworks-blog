import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '이용약관 | 보상스쿨 전문 손해사정 그룹',
  description: '보상스쿨 전문 손해사정 그룹의 서비스 이용약관입니다.',
  alternates: {
    canonical: 'https://claim-works.com/terms',
  },
};

export default function TermsPage() {
  return (
    <div className="bg-white dark:bg-[#202124] rounded-none p-6 sm:p-12 border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#202124] dark:text-[#e8eaed] mb-8 pb-4 border-b border-gray-100 dark:border-white/5">
        이용약관
      </h1>
      <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-[#5f6368] dark:text-[#9aa0a6] space-y-6">
        <section>
          <h2 className="text-lg font-bold text-[#202124] dark:text-[#e8eaed] mb-3">제 1 장 총칙</h2>
          <h3 className="font-bold text-[#202124] dark:text-[#e8eaed] mt-4 mb-2">제 1 조 (목적)</h3>
          <p>
            본 약관은 &quot;보상스쿨 전문 손해사정 그룹&quot;(이하 &quot;사이트&quot;)가 제공하는 모든 서비스의 이용조건 및 절차, 이용자와 사이트의 권리, 의무, 책임사항과 기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>
          <h3 className="font-bold text-[#202124] dark:text-[#e8eaed] mt-4 mb-2">제 2 조 (용어의 정의)</h3>
          <p>
            1. &quot;이용자&quot;란 본 사이트에 접속하여 본 약관에 따라 사이트가 제공하는 서비스를 받는 자를 말합니다.<br />
            2. &quot;서비스&quot;란 사이트가 이용자에게 제공하는 모든 정보(게시물, 계산기 등) 제공 행위를 말합니다.
          </p>
          <h3 className="font-bold text-[#202124] dark:text-[#e8eaed] mt-4 mb-2">제 3 조 (약관의 효력과 변경)</h3>
          <p>
            1. 본 약관은 사이트 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.<br />
            2. 사이트는 필요하다고 인정되는 경우 본 약관을 개정할 수 있으며, 개정된 약관은 제1항과 같은 방법으로 공지함으로써 효력이 발생합니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#202124] dark:text-[#e8eaed] mb-3">제 2 장 서비스의 제공 및 이용</h2>
          <h3 className="font-bold text-[#202124] dark:text-[#e8eaed] mt-4 mb-2">제 4 조 (서비스의 내용)</h3>
          <p>
            사이트는 다음과 같은 서비스를 제공합니다.<br />
            - 손해사정 및 보상 관련 정보 제공<br />
            - 헬스케어 및 의료기관 관련 정보 제공<br />
            - 자동차보험, 실손의료비 등의 예상 계산기 서비스<br />
            - 기타 사이트가 자체 개발하거나 다른 기관과의 협의 등을 통해 제공하는 일체의 서비스
          </p>
          <h3 className="font-bold text-[#202124] dark:text-[#e8eaed] mt-4 mb-2">제 5 조 (서비스 이용의 한계 및 면책)</h3>
          <p>
            1. 사이트에서 제공하는 정보 및 계산기 결과는 <strong>참고용</strong>으로만 제공되며, 법적 또는 의학적 판단의 근거로 사용될 수 없습니다.<br />
            2. 사이트는 제공된 정보의 정확성, 완전성, 적시성을 보증하지 않으며, 이 정보를 이용함으로 인해 발생하는 어떠한 직간접적인 손해에 대해서도 책임을 지지 않습니다.<br />
            3. 실제 보상 금액 및 법적 결과는 구체적인 사실관계, 가입한 보험 약관, 관련 법령 등에 따라 크게 달라질 수 있으므로, 반드시 전문가(손해사정사, 변호사 등)와 직접 상담하시기 바랍니다.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-[#202124] dark:text-[#e8eaed] mb-3">제 3 장 권리와 의무</h2>
          <h3 className="font-bold text-[#202124] dark:text-[#e8eaed] mt-4 mb-2">제 6 조 (저작권의 귀속 및 이용제한)</h3>
          <p>
            1. 사이트가 작성한 저작물에 대한 저작권 및 기타 지적재산권은 사이트에 귀속됩니다.<br />
            2. 이용자는 사이트를 이용함으로써 얻은 정보를 사이트의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리 목적으로 이용하거나 제3자에게 이용하게 하여서는 안 됩니다.
          </p>
          <h3 className="font-bold text-[#202124] dark:text-[#e8eaed] mt-4 mb-2">제 7 조 (이용자의 의무)</h3>
          <p>
            이용자는 다음 행위를 하여서는 안 됩니다.<br />
            - 사이트가 정한 정보 이외의 정보(컴퓨터 프로그램 등)의 송신 또는 게시<br />
            - 사이트 기타 제3자의 저작권 등 지적재산권에 대한 침해<br />
            - 사이트 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위<br />
            - 외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 사이트에 공개 또는 게시하는 행위
          </p>
        </section>

        <div className="mt-12 text-sm text-[#5f6368] dark:text-[#9aa0a6] border-t border-gray-100 dark:border-white/5 pt-6">
          본 약관은 2024년 1월 1일부터 시행됩니다.
        </div>
      </div>
    </div>
  );
}
