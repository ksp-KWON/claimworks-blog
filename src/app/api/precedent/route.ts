import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

// XML 태그 추출 헬퍼 (로딩 속도 및 경량화 유지)
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query) {
      return NextResponse.json({ success: false, error: '검색어를 입력해 주세요.' }, { status: 400 });
    }

    const LAW_API_KEY = process.env.LAW_API_KEY || 'ksp.claimworks';

    // 1. 법제처 판례 목록 검색
    const listUrl = `https://www.law.go.kr/DRF/lawSearch.do?target=prec&type=XML&OC=${LAW_API_KEY}&search=2&query=${encodeURIComponent(query)}`;
    const listRes = await fetch(listUrl, { next: { revalidate: 3600 } }); // 1시간 캐시 적용

    if (!listRes.ok) {
      return NextResponse.json({ success: false, error: '법제처 API 호출 실패' }, { status: 502 });
    }

    const listXml = await listRes.text();
    if (listXml.includes('사용자 정보 검증에 실패하였습니다')) {
      return NextResponse.json({ 
        success: false, 
        error: '법제처 API 인증 지연 중입니다. 포털 등록 IP와 웹서버 IP 불일치 또는 동기화 지연일 수 있습니다. 잠시 후 이용해 주세요.' 
      }, { status: 403 });
    }

    const ids = getXmlTags(listXml, '판례정보일련번호');
    const titles = getXmlTags(listXml, '사건명');
    const caseNos = getXmlTags(listXml, '사건번호');

    if (ids.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // 최대 5건의 판례 상세 데이터 수집 (속도 및 토큰 절약)
    const targetIds = ids.slice(0, 5);
    const precedentDetails = await Promise.all(
      targetIds.map(async (id, index) => {
        try {
          const detailUrl = `https://www.law.go.kr/DRF/lawService.do?target=prec&type=XML&OC=${LAW_API_KEY}&ID=${id}`;
          const detailRes = await fetch(detailUrl, { next: { revalidate: 86400 } }); // 상세 데이터는 24시간 캐시
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

    return NextResponse.json({
      success: true,
      data: validDetails
    });

  } catch (error: any) {
    console.error('Precedent API error:', error);
    return NextResponse.json({ success: false, error: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
  }
}
