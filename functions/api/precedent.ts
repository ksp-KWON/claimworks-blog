// Cloudflare Pages Function: /api/precedent 프록시
export async function onRequest(context: any) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';
    const lawApiKey = env.LAW_API_KEY || 'ksp78';

    const listUrl = `https://www.law.go.kr/DRF/lawSearch.do?target=prec&type=XML&OC=${lawApiKey}&search=2&query=${encodeURIComponent(query)}`;
    
    const response = await fetch(listUrl);
    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': 'application/xml;charset=UTF-8',
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
