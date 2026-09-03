/**
 * ingest-precedents.js
 * 대한민국 법원 판례 및 금융감독원 분쟁조정 결정례 전사 통합 수집 엔진
 * 
 * [헌법 6대 슬로건: 표준 · 범용 · 콤팩트 · 통합 · 공유 · 공통]
 * — 단 하나의 스크립트로 법제처 오픈API 및 금융감독원 분조위 564편 전건을 통합 수집/동기화합니다.
 * 
 * [CLI 옵션]
 *  node scripts/ingest-precedents.js --incremental     : 정기 배포용 (최신 1페이지 증분 동기화, 1초 소요)
 *  node scripts/ingest-precedents.js --source=fss        : 금융감독원 분조위 564편 아카이브 전건 수집
 *  node scripts/ingest-precedents.js --source=law        : 대한민국 법제처 공식 오픈API 판례 수집
 *  node scripts/ingest-precedents.js --source=all        : 전 소스 일괄 수집
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const { POOL_PATH, savePool } = require('../src/lib/precedent-pool.js');

// ── 통신 공통 유틸리티 ────────────────────────────────────────────────────────
function fetchText(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', (err) => {
      console.warn(`  [통신 오류] ${url}: ${err.message}`);
      resolve('');
    });
  });
}

function cleanText(str) {
  if (!str) return '';
  return str
    .replace(/<[^>]+>/g, ' ')
    .replace(/&middot;/g, '·')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function loadPool() {
  if (!fs.existsSync(POOL_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(POOL_PATH, 'utf8'));
  } catch {
    return [];
  }
}

// ── 1. 금융감독원 분쟁조정사례 수집 엔진 (wpwsyn.tistory.com 564편) ───────────
const FSS_BASE_URL = 'https://wpwsyn.tistory.com';
const FSS_CAT_PATH = '/category/%3C%3C%EB%B3%B4%ED%97%98%EA%B4%80%EB%A0%A8%3E%3E/%EB%B3%B4%ED%97%98%EB%B6%84%EC%9F%81%EC%A1%B0%EC%A0%95%EC%82%AC%EB%A1%80';

function parseFssTitle(rawTitle, itemUrl = '') {
  const clean = cleanText(rawTitle);
  const urlMatch = itemUrl.match(/\/(\d+)$/);
  const articleId = urlMatch ? urlMatch[1] : '';

  const match1 = clean.match(/(제?\d{4}-\d+호\]?|제?\d{4}-\d+|제?\d{2}-\d+호)/);
  if (match1) {
    const caseNumber = match1[1].replace(/[\[\]]/g, '');
    const caseName = clean.replace(match1[0], '').replace(/^\]\s*/, '').trim();
    return { caseNumber: `금융분쟁조정위원회 ${caseNumber}`, caseName };
  }

  const match2 = clean.match(/(\d{6}(?:분조위무번호|조위무번호)?\]?|\d{6}\])/);
  if (match2) {
    const numStr = match2[1].replace(/[\[\]]/g, '').trim();
    const caseNumber = articleId ? `금융분쟁조정사례 (${numStr}-${articleId})` : `금융분쟁조정사례 (${numStr})`;
    const caseName = clean.replace(match2[0], '').replace(/^\]\s*/, '').trim();
    return { caseNumber, caseName };
  }

  const match3 = clean.match(/(소보원\d+\]?)/);
  if (match3) {
    const numStr = match3[1].replace(/[\[\]]/g, '').trim();
    const caseNumber = articleId ? `소비자원 조정사례 (${numStr}-${articleId})` : `소비자원 조정사례 (${numStr})`;
    const caseName = clean.replace(match3[0], '').replace(/^\]\s*/, '').trim();
    return { caseNumber, caseName };
  }

  const uniqueId = articleId ? `no.${articleId}` : clean.substring(0, 15);
  return { caseNumber: `금융분쟁조정사례 [${uniqueId}]`, caseName: clean };
}

function parseFssBody(html) {
  let containerIdx = html.indexOf('tt_article_useless_p_margin');
  if (containerIdx === -1) containerIdx = html.indexOf('contents_style');
  if (containerIdx === -1) containerIdx = html.indexOf('entry-content');
  if (containerIdx === -1) return '';

  const snippet = html.substring(containerIdx, containerIdx + 6000);
  const text = cleanText(snippet);

  let summary = '';
  const keywords = ['사례 요약', '위원회 판단', '위원회의 판단', '처리 결과', '처리결과', '결론', '쟁점'];
  for (const kw of keywords) {
    const idx = text.indexOf(kw);
    if (idx !== -1) {
      summary = text.substring(idx, idx + 1000);
      break;
    }
  }

  if (!summary) {
    summary = text.substring(0, 800);
  }

  return summary.trim();
}

async function ingestFssDisputes(startPage = 1, endPage = 60) {
  console.log(`\n🏛️ [금융감독원 분조위 수집 시작] (페이지 ${startPage} ~ ${endPage})`);
  const pool = loadPool();
  const existingUrls = new Set(pool.filter(p => p.url).map(p => p.url));
  let addedCount = 0;

  for (let page = startPage; page <= endPage; page++) {
    const pageUrl = `${FSS_BASE_URL}${FSS_CAT_PATH}?page=${page}`;
    const listHtml = await fetchText(pageUrl);
    if (!listHtml || listHtml.length < 500) break;

    const regex = /<a href="(\/\d+)"[^>]*class="link-article"[^>]*>[\s\S]*?<strong class="title">([\s\S]*?)<\/strong>/g;
    let match;
    const pageItems = [];

    while ((match = regex.exec(listHtml)) !== null) {
      pageItems.push({
        url: `${FSS_BASE_URL}${match[1]}`,
        rawTitle: match[2]
      });
    }

    if (pageItems.length === 0) break;

    const promises = pageItems.map(async (item) => {
      if (existingUrls.has(item.url)) return null;

      const { caseNumber, caseName } = parseFssTitle(item.rawTitle, item.url);
      const detailHtml = await fetchText(item.url);
      const summary = parseFssBody(detailHtml);
      if (!summary || summary.length < 40) return null;

      return {
        id: `FSS-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        source: 'fss-dispute',
        rawResponseId: item.url,
        caseNumber,
        caseName: caseName || cleanText(item.rawTitle),
        courtName: '금융감독원 금융분쟁조정위원회',
        judgmentDate: '',
        summary: summary.substring(0, 1000),
        url: item.url,
        targetKeyword: '분쟁조정',
        used: false,
        ingestedAt: new Date().toISOString()
      };
    });

    const results = await Promise.all(promises);
    for (const res of results) {
      if (res) {
        pool.push(res);
        existingUrls.add(res.url);
        addedCount++;
      }
    }

    if (page % 5 === 0) {
      savePool(pool);
      console.log(`  💾 중간 동기화 완료 (누적 풀: ${pool.length}건, 신규: ${addedCount}건)`);
    }
  }

  savePool(pool);
  console.log(`  ✅ [분조위 완료] 신규 추가: ${addedCount}건 / 전체 풀: ${pool.length}건`);
  return addedCount;
}

// ── 2. 대한민국 법제처 공식 오픈API 수집 엔진 ───────────────────────────────
async function ingestLawPrecedents() {
  console.log(`\n⚖️ [법제처 오픈API 판례 수집 시작]...`);
  const apiKey = process.env.LAW_API_KEY;
  if (!apiKey) {
    console.log('  ℹ️ LAW_API_KEY 환경변수가 없어 법제처 판례 수집을 스킵합니다.');
    return 0;
  }

  const pool = loadPool();
  const existingIds = new Set(pool.filter(p => p.rawResponseId).map(p => p.rawResponseId));
  let addedCount = 0;

  const keywords = ['보험금', '손해배상', '고지의무', '설명의무', '후유장해'];
  for (const kw of keywords) {
    const listUrl = `https://www.law.go.kr/DRF/lawSearch.do?target=prec&type=XML&OC=${apiKey}&search=2&query=${encodeURIComponent(kw)}`;
    const xml = await fetchText(listUrl);
    if (!xml.includes('<판례일련번호>')) continue;

    const idMatches = xml.match(/<판례일련번호>([^<]+)<\/판례일련번호>/g) || [];
    for (const tag of idMatches.slice(0, 5)) {
      const precId = tag.replace(/<\/?판례일련번호>/g, '').trim();
      if (existingIds.has(precId)) continue;

      const detailUrl = `https://www.law.go.kr/DRF/lawService.do?target=prec&type=XML&OC=${apiKey}&ID=${precId}`;
      const detailXml = await fetchText(detailUrl);
      
      const caseNo = (detailXml.match(/<사건번호>([^<]+)<\/사건번호>/) || [])[1] || '';
      const caseName = (detailXml.match(/<사건명>([^<]+)<\/사건명>/) || [])[1] || '';
      const courtName = (detailXml.match(/<법원명>([^<]+)<\/법원명>/) || [])[1] || '대법원';
      const judgmentDate = (detailXml.match(/<선고일자>([^<]+)<\/선고일자>/) || [])[1] || '';
      const summaryMatch = detailXml.match(/<판결요지>([\s\S]*?)<\/판결요지>/);
      const summary = summaryMatch ? cleanText(summaryMatch[1]) : '';

      if (!caseNo || !summary) continue;

      pool.push({
        id: `PREC-${precId}`,
        source: 'law.go.kr-api',
        rawResponseId: precId,
        caseNumber: caseNo,
        caseName: cleanText(caseName),
        courtName: cleanText(courtName),
        judgmentDate: cleanText(judgmentDate),
        summary: summary.substring(0, 1000),
        targetKeyword: kw,
        used: false,
        ingestedAt: new Date().toISOString()
      });

      existingIds.add(precId);
      addedCount++;
    }
  }

  savePool(pool);
  console.log(`  ✅ [법제처 완료] 신규 추가: ${addedCount}건 / 전체 풀: ${pool.length}건`);
  return addedCount;
}

// ── 전사 단일 엔트리포인트 (Main Dispatcher) ──────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const isIncremental = args.includes('--incremental');
  const sourceArg = (args.find(a => a.startsWith('--source=')) || '').replace('--source=', '') || 'all';

  console.log('================================================================');
  console.log('🚀 [보상스쿨 전사 단일 판례·분조위 통합 수집 엔진]');
  console.log(`   모드: ${isIncremental ? '증분 업데이트 (1페이지)' : `전수 수집 (${sourceArg})`}`);
  console.log(`   저장소(SSOT): ${POOL_PATH}`);
  console.log('================================================================');

  if (isIncremental) {
    // GitHub Actions 정기 워크플로우: 1초 만에 최신 1페이지 증분 동기화
    await ingestFssDisputes(1, 1);
  } else if (sourceArg === 'fss') {
    await ingestFssDisputes(1, 60);
  } else if (sourceArg === 'law') {
    await ingestLawPrecedents();
  } else {
    await ingestLawPrecedents();
    await ingestFssDisputes(1, 60);
  }

  const finalPool = loadPool();
  console.log('\n🏆 [통합 수집 엔진 완결] 현재 전사 황금 풀 총합:', finalPool.length, '건');
}

if (require.main === module) {
  main();
}

module.exports = { ingestFssDisputes, ingestLawPrecedents };
