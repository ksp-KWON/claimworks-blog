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
            headers: { 'User-Agent': 'Mozilla/5.0' },
          });
          if (res.ok) {
            const xml = await res.text();
            const titles = extractXmlValues(xml, 'title')
              .filter(t => t && !t.startsWith('"') && !t.includes('Google 뉴스'));
            headlines.push(...titles);
          }
        } catch (e) {
          console.warn('RSS Error:', e);
        }
      }
      return NextResponse.json({ data: [...new Set(headlines)] });
    }

    // 2. Naver Datalab Proxy
    if (action === 'naver') {
      const { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, NCP_API_KEY_ID, NCP_API_KEY } = process.env;
      
      const hasNCP = !!(NCP_API_KEY_ID && NCP_API_KEY);
      const hasNaver = !!(NAVER_CLIENT_ID && NAVER_CLIENT_SECRET);
      
      if (!hasNCP && !hasNaver) {
        return NextResponse.json({ data: payload.candidates });
      }

      const today = new Date();
      const endDate = today.toISOString().slice(0, 10);
      const startDate = new Date(today.getTime() - 30 * 86400000).toISOString().slice(0, 10);
      const scores = new Map();
      const candidates = payload.candidates || [];

      for (let i = 0; i < candidates.length; i += 5) {
        const batch = candidates.slice(i, i + 5);
        try {
          const url = hasNCP 
            ? 'https://naverapihub.apigw.ntruss.com/search-trend/v1/search'
            : 'https://openapi.naver.com/v1/datalab/search';
            
          const headers: any = hasNCP ? {
              'x-ncp-apigw-api-key-id': NCP_API_KEY_ID,
              'x-ncp-apigw-api-key': NCP_API_KEY,
              'Content-Type': 'application/json',
          } : {
              'X-Naver-Client-Id': NAVER_CLIENT_ID,
              'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
              'Content-Type': 'application/json',
          };

          const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              startDate, endDate, timeUnit: 'month',
              keywordGroups: batch.map((c: any) => ({ groupName: c.searchKeyword, keywords: [c.searchKeyword] })),
            }),
          });
          if (res.ok) {
            const result = await res.json();
            for (const r of (result.results || [])) {
              const avg = r.data.reduce((s: number, d: any) => s + d.ratio, 0) / (r.data.length || 1);
              scores.set(r.title, avg);
            }
          }
        } catch (e) {}
      }

      const ranked = [...candidates].sort((a, b) =>
        (scores.get(b.searchKeyword) ?? 0) - (scores.get(a.searchKeyword) ?? 0)
      );
      return NextResponse.json({ data: ranked });
    }

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
