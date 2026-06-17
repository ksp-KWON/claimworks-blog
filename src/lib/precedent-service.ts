// Shared platform-agnostic precedent search logic
// 이 서비스는 Next.js 로컬 서버와 Cloudflare Pages 에지 함수에서 공용으로 사용하는 비즈니스 로직입니다.

export interface Precedent {
  id: string;
  title: string;
  caseNo: string;
  judgmentDate: string;
  courtName: string;
  judgmentSummary: string;
  caseContent: string;
  caseType: string;
  officialUrl: string;
}

// XML 태그 추출 헬퍼 (로딩 속도 및 메모리 사용을 최소화하기 위해 가벼운 정규식 파싱 적용)
function getXmlTagContent(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*?))</${tag}>`);
  const match = xml.match(regex);
  return match ? (match[1] || match[2] || '').trim() : '';
}

function getXmlTags(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*?))</${tag}>`, 'g');
  const results: string[] = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    results.push((match[1] || match[2] || '').trim());
  }
  return results;
}

/**
 * 법제처 API를 통해 실시간 판례 정보를 수집하고 정제된 JSON 리스트로 변환합니다.
 */
export async function searchAndFetchPrecedents(query: string, apiKey: string): Promise<Precedent[]> {
  const listUrl = `https://www.law.go.kr/DRF/lawSearch.do?target=prec&type=XML&OC=${apiKey}&search=2&query=${encodeURIComponent(query)}`;
  
  // 목록 조회 (Next.js fetch 캐싱은 각 호출단 레이어에서 처리하도록 순수 fetch 적용)
  const listRes = await fetch(listUrl);
  if (!listRes.ok) {
    throw new Error(`법제처 API 목록 조회 실패: HTTP ${listRes.status}`);
  }

  const listXml = await listRes.text();
  if (listXml.includes('사용자 정보 검증에 실패하였습니다')) {
    throw new Error('법제처 API 인증 실패: 등록된 IP와 현재 요청 IP가 일치하지 않거나 서버 동기화 지연 중입니다.');
  }

  const ids = getXmlTags(listXml, '판례정보일련번호');
  const titles = getXmlTags(listXml, '사건명');
  const caseNos = getXmlTags(listXml, '사건번호');

  if (ids.length === 0) {
    return [];
  }

  // 검색 속도 및 API 할당량 절약을 위해 유사도 상위 5건만 상세 정보를 수집합니다.
  const targetIds = ids.slice(0, 5);
  const precedentDetails = await Promise.all(
    targetIds.map(async (id, index) => {
      try {
        const detailUrl = `https://www.law.go.kr/DRF/lawService.do?target=prec&type=XML&OC=${apiKey}&ID=${id}`;
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

  return precedentDetails.filter((item): item is Precedent => item !== null);
}
