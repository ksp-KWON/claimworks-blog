// Cloudflare Pages Function: /api/precedent 프록시 테스트
export async function onRequest(context: any) {
  try {
    const testUrl = `https://www.law.go.kr`;
    
    const response = await fetch(testUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      }
    });

    const html = await response.text();
    return new Response(JSON.stringify({
      status: response.status,
      ok: response.ok,
      preview: html.substring(0, 500)
    }), {
      status: 200,
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
