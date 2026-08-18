// Cloudflare Pages Function: /api/fss-news
export async function onRequest(context: any) {
  try {
    const { request } = context;
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';
    const type = url.searchParams.get('type') || 'all';

    // 정적 자원 경로에서 데이터를 가져옵니다.
    const dataUrl = new URL('/data/fss-consumer-data.json', request.url);
    const response = await fetch(dataUrl.toString());
    
    if (!response.ok) {
      throw new Error(`데이터 데이터베이스를 로드할 수 없습니다. (HTTP ${response.status})`);
    }

    const allData: any[] = await response.json();

    // 1. 카테고리 필터링 (warn과 alert 상호 호환)
    let filtered = allData;
    if (type !== 'all') {
      filtered = filtered.filter(item => {
        const itemCat = item.category === 'warn' ? 'alert' : item.category;
        return itemCat === type;
      });
    }

    // 2. 키워드 검색 필터링
    if (query.trim() !== '') {
      const q = query.toLowerCase().trim();
      filtered = filtered.filter(item => {
        const titleMatch = item.title?.toLowerCase().includes(q);
        const contentMatch = item.content?.toLowerCase().includes(q);
        const keywordMatch = item.keywords?.some((k: string) => k.toLowerCase().includes(q));
        const commentMatch = item.comment?.toLowerCase().includes(q);
        const summaryMatch = item.summary?.some((s: string) => s.toLowerCase().includes(q));
        return titleMatch || contentMatch || keywordMatch || commentMatch || summaryMatch;
      });
    }

    // 결과를 JSON 형식으로 반환합니다.
    return new Response(JSON.stringify(filtered), {
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }), 
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json;charset=UTF-8',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}
