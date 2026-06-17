// Cloudflare Pages Function: /functions/api/precedent.ts
// 이 파일은 Cloudflare Pages 배포 시 엣지 함수(Serverless Worker)로 구동되어 
// 정적 빌드(static export) 환경에서도 실시간 법제처 API 연동 검색을 가능하게 합니다.

export async function onRequest(context: any) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: '검색어를 입력해 주세요.' }), 
        {
          status: 400,
          headers: { 'Content-Type': 'application/json;charset=UTF-8' }
        }
      );
    }

    // Cloudflare Pages에 등록된 LAW_API_KEY 환경변수 로드
    const LAW_API_KEY = env.LAW_API_KEY || 'ksp.claimworks';

    // 1. 법제처 판례 목록 검색
    const listUrl = `https://www.law.go.kr/DRF/lawSearch.do?target=prec&type=XML&OC=${LAW_API_KEY}&search=2&query=${encodeURIComponent(query)}`;
    const listRes = await fetch(listUrl);

    if (!listRes.ok) {
      return new Response(
        JSON.stringify({ success: false, error: '법제처 API 호출 실패' }), 
        {
          status: 502,
          headers: { 'Content-Type': 'application/json;charset=UTF-8' }
        }
      );
    }

    const listXml = await listRes.text();
    if (listXml.includes('사용자 정보 검증에 실패하였습니다')) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '법제처 API 인증 지연 중입니다. 포털 등록 IP와 웹서버 IP 불일치 또는 동기화 지연일 수 있습니다. 잠시 후 이용해 주세요.' 
        }), 
        {
          status: 403,
          headers: { 'Content-Type': 'application/json;charset=UTF-8' }
        }
      );
    }

    // XML 태그 추출 헬퍼 (정규식 기반 파싱)
    const getXmlTagContent = (xml: string, tag: string): string => {
      const regex = new RegExp(`<${tag}>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*?))</${tag}>`);
      const match = xml.match(regex);
      return match ? (match[1] || match[2] || '').trim() : '';
    };

    const getXmlTags = (xml: string, tag: string): string[] => {
      const regex = new RegExp(`<${tag}>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*?))</${tag}>`, 'g');
      const results: string[] = [];
      let match;
      while ((match = regex.exec(xml)) !== null) {
        results.push((match[1] || match[2] || '').trim());
      }
      return results;
    };

    const ids = getXmlTags(listXml, '판례정보일련번호');
    const titles = getXmlTags(listXml, '사건명');
    const caseNos = getXmlTags(listXml, '사건번호');

    if (ids.length === 0) {
      return new Response(
        JSON.stringify({ success: true, data: [] }), 
        {
          headers: { 'Content-Type': 'application/json;charset=UTF-8' }
        }
      );
    }

    // 최대 5건의 판례 상세 데이터 수집 (엣지 응답 속도 최적화)
    const targetIds = ids.slice(0, 5);
    const precedentDetails = await Promise.all(
      targetIds.map(async (id, index) => {
        try {
          const detailUrl = `https://www.law.go.kr/DRF/lawService.do?target=prec&type=XML&OC=${LAW_API_KEY}&ID=${id}`;
          const detailRes = await fetch(detailUrl);
          if (!detailRes.ok) return null;

          const detailXml = await detailRes.text();
          
          return {
            id,
            title: titles[index] || getXmlTagContent(detailXml, '사건명'),
            caseNo: caseNos[index] || getXmlTagContent(detailXml, '사건번호'),
            judgmentDate: getXmlTagContent(detailXml, '선고일자'),
            courtName: getXmlTagContent(detailXml, '법원명'),
            judgmentSummary: getXmlTagContent(detailXml, '판결요지'),
            caseContent: getXmlTagContent(detailXml, '판례내용'),
            caseType: getXmlTagContent(detailXml, '사건종류명'),
            officialUrl: `https://www.law.go.kr/LSW/precInfoP.do?precSeq=${id}`
          };
        } catch {
          return null;
        }
      })
    );

    const validDetails = precedentDetails.filter(Boolean);

    return new Response(
      JSON.stringify({
        success: true,
        data: validDetails
      }), 
      {
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: '서버 내부 오류가 발생했습니다: ' + error.message }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
      }
    );
  }
}
