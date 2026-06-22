// Cloudflare Pages Function: /api/fss-news-detail
export async function onRequest(context: any) {
  try {
    const { request } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get('id') || '';

    if (!id) {
      return new Response(JSON.stringify({ error: 'id 파라미터가 누락되었습니다.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
      });
    }

    // 정적 자원 경로에서 데이터를 가져옵니다.
    const dataUrl = new URL('/data/fss-consumer-data.json', request.url);
    const response = await fetch(dataUrl.toString());
    
    if (!response.ok) {
      throw new Error(`데이터 데이터베이스를 로드할 수 없습니다. (HTTP ${response.status})`);
    }

    const allData: any[] = await response.json();
    const item = allData.find(d => d.id === id);

    if (!item) {
      return new Response(JSON.stringify({ error: '해당 데이터를 찾을 수 없습니다.' }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json;charset=UTF-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 결과를 JSON 형식으로 반환합니다.
    return new Response(JSON.stringify(item), {
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
