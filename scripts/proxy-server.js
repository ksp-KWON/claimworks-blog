// scripts/proxy-server.js
// 구글 클라우드(GCP) 무료 서버에 업로드하여 24시간 가동할 초경량 중계(Proxy) 프로그램입니다.
// 외부 의존성 패키지 없이 Node.js 순수 기본 모듈로만 구현하여 설치 및 구동이 극도로 간편합니다.

const http = require('http');
const https = require('https');

const PORT = 8080;
const LAW_API_KEY = 'ksp78'; // 대표님의 법제처 인증키
const PROXY_TOKEN = 'secure_secret_token_12345'; // 도용 방지용 보안 암호 (블로그 설정과 일치시켜야 함)

const server = http.createServer((req, res) => {
  // CORS 정책 허용 (보상스쿨 블로그 도메인에서의 접속을 허가)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Proxy-Token');
  
  // 브라우저의 사전 탐색(OPTIONS) 요청 시 즉시 200 응답 처리
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 1. 도용 방지 헤더 보안 키 검증
  const clientToken = req.headers['x-proxy-token'];
  if (clientToken !== PROXY_TOKEN) {
    res.writeHead(403, { 'Content-Type': 'application/json;charset=UTF-8' });
    res.end(JSON.stringify({ error: '인증되지 않은 접근입니다. 보안 토큰이 올바르지 않습니다.' }));
    return;
  }

  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const query = urlObj.searchParams.get('query') || '';
  const id = urlObj.searchParams.get('ID') || '';
  const display = urlObj.searchParams.get('display') || '100';
  const page = urlObj.searchParams.get('page') || '1';

  let targetUrl = '';
  
  // 판례 목록 조회 및 상세 조회 경로 매핑
  if (urlObj.pathname === '/api/precedent') {
    targetUrl = `https://www.law.go.kr/DRF/lawSearch.do?target=prec&type=XML&OC=${LAW_API_KEY}&search=2&display=${display}&page=${page}&query=${encodeURIComponent(query)}`;
  } else if (urlObj.pathname === '/api/precedent-detail') {
    targetUrl = `https://www.law.go.kr/DRF/lawService.do?target=prec&type=XML&OC=${LAW_API_KEY}&ID=${id}`;
  } else if (urlObj.pathname === '/api/rss') {
    targetUrl = `https://news.google.com/rss/search?hl=ko&gl=KR&ceid=KR:ko&q=${encodeURIComponent(query)}`;
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json;charset=UTF-8' });
    res.end(JSON.stringify({ error: '지원하지 않는 API 경로입니다.' }));
    return;
  }

  console.log(`[Proxy Request] Path: ${urlObj.pathname}, Query: "${query}", ID: "${id}"`);

  // 2. 법제처 서버로 요청 전송 (구글의 고정 IP로 출발하므로 법제처 방화벽이 승인)
  const options = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    }
  };

  https.get(targetUrl, options, (apiRes) => {
    res.writeHead(apiRes.statusCode, { 
      'Content-Type': 'application/xml;charset=UTF-8',
      'Access-Control-Allow-Origin': '*'
    });
    apiRes.pipe(res);
  }).on('error', (err) => {
    console.error('[Proxy Error]', err.message);
    res.writeHead(500, { 'Content-Type': 'application/json;charset=UTF-8' });
    res.end(JSON.stringify({ error: '법제처 API 호출 중 오류가 발생했습니다.', message: err.message }));
  });
});

server.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 보상스쿨 GCP 법제처 API 중계 서버 가동 시작`);
  console.log(`- 포트 번호: ${PORT}`);
  console.log(`- 보안 토큰 사용 중: ${PROXY_TOKEN ? '예' : '아니오'}`);
  console.log(`==================================================`);
});
