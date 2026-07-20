import { NextResponse } from 'next/server';

function extractXmlValues(xml: string, tag: string) {
  const re = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*?))</${tag}>`, 'g');
  const out = [];
  let m;
  while ((m = re.exec(xml)) !== null) out.push((m[1] ?? m[2] ?? '').trim());
  return out;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, ...payload } = body;

    // 1. Google News RSS Proxy
    if (action === 'rss') {
      const BASE = 'https://news.google.com/rss/search?hl=ko&gl=KR&ceid=KR:ko&q=';
      const queries = payload.queries || ['보험금 지급거절 분쟁'];
      const headlines = [];
      
      for (const query of queries) {
        try {
          const res = await fetch(BASE + encodeURIComponent(query), {
            headers: { 
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
              'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            },
          });
          if (res.ok) {
            const xml = await res.text();
            const titles = extractXmlValues(xml, 'title')
              .filter(t => t && !t.startsWith('"') && !t.includes('Google 뉴스'));
            headlines.push(...titles);
          } else {
            console.warn(`RSS fetch failed for ${query}: HTTP ${res.status}`);
          }
        } catch (e) {
          console.warn('RSS Error:', e);
        }
      }
      return NextResponse.json({ data: [...new Set(headlines)] });
    }

    // (네이버 데이터랩 API 기능은 2026.07.23 서비스 종료로 인해 삭제됨)

    // 3. Law API Proxy
    if (action === 'law') {
      const { LAW_API_KEY, LAW_PROXY_ENDPOINT, LAW_PROXY_TOKEN } = process.env;
      let listUrl = '';
      const headers: any = { 'User-Agent': 'Mozilla/5.0' };

      if (LAW_PROXY_ENDPOINT) {
        listUrl = `${LAW_PROXY_ENDPOINT}/api/precedent?query=${encodeURIComponent(payload.keyword)}`;
        if (LAW_PROXY_TOKEN) headers['X-Proxy-Token'] = LAW_PROXY_TOKEN;
      } else {
        if (!LAW_API_KEY) throw new Error('LAW_API_KEY missing');
        listUrl = `https://www.law.go.kr/DRF/lawSearch.do?target=prec&type=XML&OC=${LAW_API_KEY}&search=2&query=${encodeURIComponent(payload.keyword)}`;
      }

      const res = await fetch(listUrl, { headers });
      if (!res.ok) throw new Error('Law list error');
      const xml = await res.text();
      
      const ids = extractXmlValues(xml, '판례일련번호');
      if (ids.length === 0) return NextResponse.json({ data: null });

      // Fetch first valid detail
      for (const id of ids.slice(0, 3)) {
        let detailUrl = '';
        if (LAW_PROXY_ENDPOINT) {
          detailUrl = `${LAW_PROXY_ENDPOINT}/api/precedent-detail?ID=${id}`;
        } else {
          detailUrl = `https://www.law.go.kr/DRF/lawService.do?target=prec&type=XML&OC=${LAW_API_KEY}&ID=${id}`;
        }
        
        const dRes = await fetch(detailUrl, { headers });
        if (dRes.ok) {
          const dXml = await dRes.text();
          const judgmentSummary = extractXmlValues(dXml, '판결요지')[0];
          const caseContent = extractXmlValues(dXml, '판례내용')[0];
          
          if (judgmentSummary && judgmentSummary.length >= 40 && caseContent) {
            return NextResponse.json({
              data: {
                id,
                caseNo: extractXmlValues(dXml, '사건번호')[0],
                judgmentSummary,
                caseContent
              }
            });
          }
        }
      }
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
