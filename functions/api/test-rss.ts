export async function onRequestGet(context: any) {
  const query = '보험금 지급거절 분쟁';
  const BASE = 'https://news.google.com/rss/search?hl=ko&gl=KR&ceid=KR:ko&q=';
  try {
    const res = await fetch(BASE + encodeURIComponent(query));
    const text = await res.text();
    return new Response(JSON.stringify({
      status: res.status,
      headers: Object.fromEntries(res.headers),
      bodyLength: text.length,
      bodyPreview: text.substring(0, 500)
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }));
  }
}
