// Cloudflare Pages Function: /api/disputes
// 금융감독원 금융분쟁조정위원회 결정문 검색 및 상세 전문 조회 API
export async function onRequest(context: any) {
  try {
    const { request } = context;
    const url = new URL(request.url);
    const detailId = url.searchParams.get('id');
    const query = url.searchParams.get('query') || '';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(url.searchParams.get('pageSize') || '10', 10)));

    // 정적 자원 경로에서 분쟁조정 전문 데이터를 가져옵니다.
    const dataUrl = new URL('/data/fss-disputes-full.json', request.url);
    const response = await fetch(dataUrl.toString());

    if (!response.ok) {
      throw new Error(`분쟁조정 데이터베이스를 로드할 수 없습니다. (HTTP ${response.status})`);
    }

    const allData: any[] = await response.json();

    // 1. 단일 건 상세 전문 온디맨드 조회 (Lazy Loading)
    if (detailId) {
      const item = allData.find(d => d.id === detailId);
      if (!item) {
        return new Response(JSON.stringify({ error: '해당 분쟁조정 결정을 찾을 수 없습니다.' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json; charset=utf-8' }
        });
      }
      return new Response(JSON.stringify(item), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=86400'
        }
      });
    }

    // 2. 키워드 검색 및 목록 페이징 (경량화 메타 응답)
    let filtered = allData;
    if (query.trim() !== '') {
      const q = query.toLowerCase().trim();
      const terms = q.split(/\s+/).filter(Boolean);

      filtered = allData.filter(item => {
        const target = `${item.caseNumber || ''} ${item.caseName || ''} ${item.summary || ''} ${item.fullText || ''}`.toLowerCase();
        return terms.every(term => target.includes(term));
      });
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    
    // 목록 응답 시 거대한 fullText는 제외하고 핵심 메타데이터만 경량 전송
    const items = filtered.slice(start, end).map(item => ({
      id: item.id,
      caseNumber: item.caseNumber,
      caseName: item.caseName,
      courtName: item.courtName,
      judgmentDate: item.judgmentDate,
      summary: item.summary,
      url: item.url
    }));

    return new Response(JSON.stringify({
      total,
      page,
      pageSize,
      items
    }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}
