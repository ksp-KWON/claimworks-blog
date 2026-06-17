// Cloudflare Pages Function: /api/precedent-detail 프록시
export async function onRequest(context: any) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get('ID') || '';
    const lawApiKey = env.LAW_API_KEY || 'ksp78';

    const detailUrl = `https://www.law.go.kr/DRF/lawService.do?target=prec&type=XML&OC=${lawApiKey}&ID=${id}`;
    
    const response = await fetch(detailUrl);
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
