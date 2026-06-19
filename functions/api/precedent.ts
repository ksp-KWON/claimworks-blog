// Cloudflare Pages Function: /api/precedent 프록시
export async function onRequest(context: any) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';

    // Cloudflare Pages 환경 변수에서 엔드포인트와 보안 토큰을 로드합니다.
    const proxyEndpoint = env.LAW_PROXY_ENDPOINT || 'http://localhost:8080';
    const proxyToken = env.LAW_PROXY_TOKEN || 'secure_secret_token_12345';

    const targetUrl = `${proxyEndpoint}/api/precedent?query=${encodeURIComponent(query)}`;

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'X-Proxy-Token': proxyToken
      }
    });

    const bodyText = await response.text();

    return new Response(bodyText, {
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
// Trigger redeploy to apply Cloudflare Pages environment variables
