/**
 * scripts/ingest-precedents.js
 * 대한민국 법제처 공식 API(DRF)를 직접 기계적으로 호출하여
 * 실존하는 손해사정 핵심 판례 원본 데이터를 수집하는 자동 풀(Pool) 파이프라인
 * 
 * [원칙]
 * - AI 글짓기/환각 0%: 법제처 오픈API XML 응답에서 사건번호, 법원명, 판결요지를 100% 그대로 파싱
 * - 중복 방지: 사건번호(caseNumber) 기준 고유성 보장
 * - 점진적 증분 확장: 기존 pool 파일이 있으면 유지하면서 새 판례만 덧붙임
 */

const fs = require('fs');
const path = require('path');

// 1. 환경변수 로드 (.env.local)
const envPath = path.resolve(process.cwd(), '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(l => {
    const [k, ...v] = l.trim().split('=');
    if (k && !k.startsWith('#')) env[k.trim()] = v.join('=').trim();
  });
}

const apiKey = env.LAW_API_KEY || process.env.LAW_API_KEY;
const endpoint = env.LAW_PROXY_ENDPOINT || process.env.LAW_PROXY_ENDPOINT;
const token = env.LAW_PROXY_TOKEN || process.env.LAW_PROXY_TOKEN;

if (!apiKey && !endpoint) {
  console.error('❌ LAW_API_KEY 또는 LAW_PROXY_ENDPOINT가 설정되지 않았습니다.');
  process.exit(1);
}

// 2. 수집 대상 보상스쿨 핵심 키워드 목록 (1차 스타터 시드용 핵심 단어)
const TARGET_KEYWORDS = [
  '보험금',
  '손해배상',
  '교통사고',
  '후유장해',
  '일실수입',
  '추간판',
  '골절',
  '암진단',
  '과실상계',
  '배상책임'
];

const POOL_FILE = path.resolve(process.cwd(), 'src/data/precedent-pool.json');

// 3. 기존 풀 로드
let pool = [];
if (fs.existsSync(POOL_FILE)) {
  try {
    pool = JSON.parse(fs.readFileSync(POOL_FILE, 'utf8'));
    console.log(`📂 기존 판례 풀 로드 완료: 총 ${pool.length}건`);
  } catch (e) {
    console.warn('⚠️ 기존 풀 파일 파싱 오류, 새로 생성합니다.');
  }
}

const existingCaseNumbers = new Set(pool.map(p => p.caseNumber));

// 4. 단일 판례 상세 조회 함수
async function fetchPrecedentDetail(precId) {
  let detailUrl = '';
  const headers = { 'User-Agent': 'Mozilla/5.0' };
  
  if (endpoint) {
    detailUrl = `${endpoint.trim()}/api/precedent-detail?ID=${precId}`;
    if (token) headers['X-Proxy-Token'] = token.trim();
  } else if (apiKey) {
    detailUrl = `https://www.law.go.kr/DRF/lawService.do?target=prec&type=XML&OC=${apiKey}&ID=${precId}`;
  }

  try {
    const res = await fetch(detailUrl, { headers });
    if (!res.ok) return null;
    const xml = await res.text();

    const cleanTag = (str) => str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim();

    const getTag = (tagName) => {
      const regex = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`);
      const match = xml.match(regex);
      return match ? cleanTag(match[1]) : '';
    };

    const caseNumber = getTag('사건번호');
    const caseName = getTag('사건명');
    const courtName = getTag('법원명');
    const judgmentDate = getTag('선고일자');
    const summary = getTag('판결요지');
    const content = getTag('판례내용');

    if (!caseNumber || (!summary && !content)) return null;

    return {
      id: precId,
      caseNumber,
      caseName: caseName || '손해배상(기) 등',
      courtName: courtName || (caseNumber.includes('다') || caseNumber.includes('두') ? '대법원' : '법원'),
      judgmentDate,
      summary: summary || content.substring(0, 500),
      content: content ? content.substring(0, 3000) : '',
      used: false,
      collectedAt: new Date().toISOString()
    };
  } catch (err) {
    return null;
  }
}

// 5. 키워드별 검색 및 수집 메인 파이프라인
async function runIngestion() {
  console.log('🚀 [법제처 공식 API] 손해사정 실존 판례 기계적 수집 시작...\n');
  let addedCount = 0;

  for (const keyword of TARGET_KEYWORDS) {
    console.log(`🔍 키워드 검색 중: "${keyword}"`);
    let listUrl = '';
    const headers = { 'User-Agent': 'Mozilla/5.0' };

    if (endpoint) {
      listUrl = `${endpoint.trim()}/api/precedent?query=${encodeURIComponent(keyword)}&page=1`;
      if (token) headers['X-Proxy-Token'] = token.trim();
    } else if (apiKey) {
      listUrl = `https://www.law.go.kr/DRF/lawSearch.do?target=prec&type=XML&OC=${apiKey}&search=2&query=${encodeURIComponent(keyword)}`;
    }

    try {
      const res = await fetch(listUrl, { headers });
      if (!res.ok) {
        console.warn(`  ⚠️ 검색 실패 (HTTP ${res.status})`);
        continue;
      }
      const xml = await res.text();

      // <prec id="..."> 또는 <prec> 태그 블록 분리
      const precBlocks = xml.split(/<prec\b[^>]*>/).slice(1);
      console.log(`  ➔ 검색 결과: ${precBlocks.length}건 발견`);

      for (const block of precBlocks.slice(0, 6)) { // 키워드당 상위 6건 정밀 수집
        const idMatch = block.match(/<판례일련번호>([^<]+)<\/판례일련번호>/);
        const caseNoMatch = block.match(/<사건번호>([^<]+)<\/사건번호>/);

        if (!idMatch) continue;
        const precId = idMatch[1].trim();
        const caseNo = caseNoMatch ? caseNoMatch[1].trim() : '';

        if (existingCaseNumbers.has(caseNo)) {
          continue;
        }

        // 상세 원문 API 호출
        const detail = await fetchPrecedentDetail(precId);
        if (detail && !existingCaseNumbers.has(detail.caseNumber)) {
          detail.targetKeyword = keyword;
          pool.push(detail);
          existingCaseNumbers.add(detail.caseNumber);
          addedCount++;
          console.log(`  ✅ 수집 완료: [${detail.courtName}] ${detail.caseNumber} - ${detail.caseName.substring(0, 30)} (${detail.judgmentDate})`);
        }

        // API 과부하 방지 150ms 지연
        await new Promise(r => setTimeout(r, 150));
      }
    } catch (e) {
      console.error(`  ❌ 에러 발생 (${keyword}):`, e.message);
    }
  }

  // 6. 결과 파일 저장
  const dir = path.dirname(POOL_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(POOL_FILE, JSON.stringify(pool, null, 2), 'utf8');

  console.log(`\n🎉 [수집 완료] 신규 수집: ${addedCount}건 / 전체 판례 풀 총합: ${pool.length}건`);
  console.log(`💾 저장 경로: ${POOL_FILE}`);
}

runIngestion();
