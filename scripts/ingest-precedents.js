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
    .replace(/<[^>]*>?/g, ' ')
    .replace(/&middot;/g, '·')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&ldquo;|&rdquo;|&ldqu;|&rdqu;/g, '"')
    .replace(/&lsquo;|&rsquo;/g, "'")
    .replace(/&times;/g, '×')
    .replace(/&divide;/g, '÷')
    .replace(/&rarr;/g, '→')
    .replace(/&ndash;/g, '-')
    .replace(/&hellip;/g, '…')
    .replace(/&[a-zA-Z0-9#]+;?/g, ' ')
    .replace(/tt_article_useless_p_margin/g, '')
    .replace(/contents_style/g, '')
    .replace(/^["'>\s\\]+/, '')
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

// ── 1. 금융감독원 공식 분쟁조정사례 수집 엔진 (fss.or.kr 1차 원문 직결) ────────
const FSS_BASE_URL = 'https://www.fss.or.kr';
const FSS_CASE_LIST_PATH = '/fss/job/fncCnflCase/list.do?menuNo=201195';

function parseCaseNumber(title, caseSlno) {
  const clean = cleanText(title);
  // 공식 결정호수(제XXXX-XX호) 패턴이 제목에 직접 있는 경우
  const hoMatch = clean.match(/(제?\d{4}-\d+호?|제?\d{2}-\d+호)/);
  if (hoMatch) {
    let ho = hoMatch[1].replace(/[\[\]]/g, '');
    if (!ho.startsWith('제')) ho = '제' + ho;
    if (!ho.endsWith('호')) ho = ho + '호';
    return `금융분쟁조정위원회 ${ho}`;
  }
  // 공식 일련번호 기반 고유 사건번호 부여 (날짜 오인식 0% 방어)
  return `금융감독원 분쟁조정사례 (제${caseSlno}호)`;
}

async function ingestFssOfficialCases(startPage = 1, endPage = 21) {
  console.log(`\n🏛️ [금융감독원 공식 분조위 수집 시작] (페이지 ${startPage} ~ ${endPage})`);
  const pool = loadPool();
  const existingUrls = new Set(pool.filter(p => p.url).map(p => p.url));
  const existingCaseNos = new Set(pool.filter(p => p.caseNumber).map(p => p.caseNumber));
  let addedCount = 0;

  for (let page = startPage; page <= endPage; page++) {
    const pageUrl = `${FSS_BASE_URL}${FSS_CASE_LIST_PATH}&pageIndex=${page}`;
    const listHtml = await fetchText(pageUrl);
    if (!listHtml || listHtml.length < 500) break;

    const tbodyMatch = listHtml.match(/<tbody>([\s\S]*?)<\/tbody>/);
    if (!tbodyMatch) break;

    const trMatches = tbodyMatch[1].match(/<tr>([\s\S]*?)<\/tr>/g) || [];
    if (trMatches.length === 0) break;

    const pageItems = [];
    for (const tr of trMatches) {
      const tds = (tr.match(/<td[^>]*>([\s\S]*?)<\/td>/g) || []).map(cleanText);
      const linkMatch = tr.match(/caseSlno=(\d+)/);
      const caseSlno = linkMatch ? linkMatch[1] : '';
      if (!caseSlno) continue;

      const detailUrl = `${FSS_BASE_URL}/fss/job/fncCnflCase/view.do?caseSlno=${caseSlno}&menuNo=201195`;
      const title = tds[3] || '';
      const category = tds[1] || '보험';
      const subCategory = tds[2] || '';
      const regDate = (tds[4] || '').replace(/-/g, '');

      pageItems.push({
        caseSlno,
        title,
        category,
        subCategory,
        regDate,
        url: detailUrl
      });
    }

    if (pageItems.length === 0) break;

    const promises = pageItems.map(async (item) => {
      if (existingUrls.has(item.url)) return null;

      const caseNumber = parseCaseNumber(item.title, item.caseSlno);
      if (existingCaseNos.has(caseNumber)) return null;

      const detailHtml = await fetchText(item.url);
      if (!detailHtml) return null;

      const text = cleanText(detailHtml);
      let summary = '';
      const startIdx = text.indexOf('▣ 민원내용');
      if (startIdx !== -1) {
        const endIdx = text.indexOf('정보관리 담당부서', startIdx);
        summary = endIdx !== -1 ? text.substring(startIdx, endIdx) : text.substring(startIdx, startIdx + 1200);
      } else {
        const contentStart = text.indexOf('분쟁조정사례');
        if (contentStart !== -1) {
          summary = text.substring(contentStart, contentStart + 1000);
        }
      }

      summary = cleanText(summary);
      if (!summary || summary.length < 40) return null;

      let targetKeyword = item.subCategory ? item.subCategory.split('(')[0] : '분쟁조정';
      if (targetKeyword.length < 2) targetKeyword = '보험금분쟁';

      return {
        id: `FSS-OFFICIAL-${item.caseSlno}`,
        source: 'fss-official',
        rawResponseId: item.caseSlno,
        caseNumber,
        caseName: cleanText(item.title),
        courtName: '금융감독원 금융분쟁조정위원회',
        judgmentDate: item.regDate || '',
        summary: summary.substring(0, 1200),
        url: item.url,
        targetKeyword,
        used: false,
        ingestedAt: new Date().toISOString()
      };
    });

    const results = await Promise.all(promises);
    for (const res of results) {
      if (res) {
        pool.push(res);
        existingUrls.add(res.url);
        existingCaseNos.add(res.caseNumber);
        addedCount++;
      }
    }

    if (page % 5 === 0 || page === endPage) {
      savePool(pool);
      console.log(`  💾 중간 동기화 완료 (누적 풀: ${pool.length}건, 신규: ${addedCount}건, 페이지: ${page})`);
    }
  }

  savePool(pool);
  console.log(`  ✅ [금감원 공식 분조위 완료] 신규 추가: ${addedCount}건 / 전체 풀: ${pool.length}건`);
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
    await ingestFssOfficialCases(1, 1);
  } else if (sourceArg === 'law') {
    await ingestLawPrecedents();
  } else if (sourceArg === 'fss') {
    await ingestFssOfficialCases(1, 21);
  } else {
    // 기본 디폴트: 금감원 공식 분조위 전수 + 법제처
    await ingestFssOfficialCases(1, 21);
    await ingestLawPrecedents();
  }

  const finalPool = loadPool();
  console.log('\n🏆 [통합 수집 엔진 완결] 현재 전사 황금 풀 총합:', finalPool.length, '건');
}

if (require.main === module) {
  main();
}

module.exports = { ingestFssOfficialCases, ingestLawPrecedents };
