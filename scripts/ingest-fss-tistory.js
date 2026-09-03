/**
 * ingest-fss-tistory.js
 * 금융감독원 분쟁조정위원회(분조위) 실물 결정례 기계적 수집 파이프라인
 * 
 * [출처] 금융감독원 분쟁조정사례 전문 아카이브 (wpwsyn.tistory.com)
 * — 사건번호 (예: 제2023-2호, 231207 등), 안건명, 사실관계, 위원회 판단 요약 추출
 * — LLM 개입 0% 기계적 파싱 및 precedent-pool.json 무결점 자동 병합
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const POOL_PATH = path.resolve(__dirname, '../src/data/precedent-pool.json');
const BASE_URL = 'https://wpwsyn.tistory.com';
const CATEGORY_PATH = '/category/%3C%3C%EB%B3%B4%ED%97%98%EA%B4%80%EB%A0%A8%3E%3E/%EB%B3%B4%ED%97%98%EB%B6%84%EC%9F%81%EC%A1%B0%EC%A0%95%EC%82%AC%EB%A1%80';

function fetchHtml(url) {
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── 텍스트 정제 ────────────────────────────────────────────────────────────
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

// ── 사건번호 및 안건명 파싱 ────────────────────────────────────────────────
function parseTitleAndCaseNumber(rawTitle) {
  const clean = cleanText(rawTitle);
  // 패턴 1: 제2023-2호] 일본뇌염의 상해사고 인정여부
  const match1 = clean.match(/(제?\d{4}-\d+호\]?|제?\d{4}-\d+|제?\d{2}-\d+호)/);
  if (match1) {
    const caseNumber = match1[1].replace(/[\[\]]/g, '');
    const caseName = clean.replace(match1[0], '').replace(/^\]\s*/, '').trim();
    return { caseNumber: `금융분쟁조정위원회 ${caseNumber}`, caseName };
  }

  // 패턴 2: 231207분조위무번호] 자동차 사고 ...
  const match2 = clean.match(/(\d{6}분조위무번호\]?|\d{6}\])/);
  if (match2) {
    const caseNumber = `금융분쟁조정사례 (${match2[1].replace(/[\[\]]/g, '')})`;
    const caseName = clean.replace(match2[0], '').replace(/^\]\s*/, '').trim();
    return { caseNumber, caseName };
  }

  // 패턴 3: 일반 날짜/키워드
  return { caseNumber: `금융분쟁조정사례`, caseName: clean };
}

// ── 본문에서 사실관계 및 위원회 판단 요약 추출 ──────────────────────────────
function parseDecisionContent(html) {
  const containerIdx = html.indexOf('tt_article_useless_p_margin');
  if (containerIdx === -1) return '';

  const snippet = html.substring(containerIdx, containerIdx + 6000);
  const text = cleanText(snippet);

  // '위원회 판단' 또는 '처리결과' 추출 시도
  let summary = '';
  const judgmentIdx = text.indexOf('위원회 판단') !== -1 ? text.indexOf('위원회 판단') : text.indexOf('위원회의 판단');
  if (judgmentIdx !== -1) {
    summary = text.substring(judgmentIdx, judgmentIdx + 1000);
  } else if (text.indexOf('처리 결과') !== -1 || text.indexOf('처리결과') !== -1) {
    const rIdx = text.indexOf('처리 결과') !== -1 ? text.indexOf('처리 결과') : text.indexOf('처리결과');
    summary = text.substring(rIdx, rIdx + 800);
  } else {
    // 쟁점 또는 기초 사실 발췌
    summary = text.substring(0, 800);
  }

  return summary.trim();
}

async function ingestFssFromTistory(maxPages = 3) {
  console.log('🚀 [금감원 분조위 실물 아카이브 수집 시작] (출처: wpwsyn.tistory.com)');

  // 1. 기존 풀 로드
  let pool = [];
  if (fs.existsSync(POOL_PATH)) {
    pool = JSON.parse(fs.readFileSync(POOL_PATH, 'utf8'));
  }
  const existingCaseNumbers = new Set(pool.map(p => p.caseNumber));
  console.log(`📂 기존 풀 항목 수: ${pool.length}건 (대법원 판례 등)`);

  let addedCount = 0;

  for (let page = 1; page <= maxPages; page++) {
    const pageUrl = `${BASE_URL}${CATEGORY_PATH}?page=${page}`;
    console.log(`\n📄 [페이지 ${page}/${maxPages} 탐색 중] ${pageUrl}`);
    const listHtml = await fetchHtml(pageUrl);
    if (!listHtml) break;

    // 링크 및 제목 추출
    const itemRegex = /<a href="(\/\d+)"[^>]*class="link-article"[^>]*>[\s\S]*?<strong class="title">([\s\S]*?)<\/strong>/g;
    let match;
    const pageItems = [];

    while ((match = itemRegex.exec(listHtml)) !== null) {
      pageItems.push({
        url: `${BASE_URL}${match[1]}`,
        rawTitle: match[2]
      });
    }

    console.log(`  ➔ ${pageItems.length}개 분쟁조정 글 발견`);
    if (pageItems.length === 0) break;

    for (const item of pageItems) {
      const { caseNumber, caseName } = parseTitleAndCaseNumber(item.rawTitle);
      
      // 중복 체크
      if (existingCaseNumbers.has(caseNumber) || existingCaseNumbers.has(item.url)) {
        continue;
      }

      await sleep(300); // 친절한 요청 간격
      const detailHtml = await fetchHtml(item.url);
      const summary = parseDecisionContent(detailHtml);

      if (!summary || summary.length < 50) {
        continue;
      }

      const newEntry = {
        id: `FSS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        source: 'fss-dispute',
        rawResponseId: item.url,
        caseNumber,
        caseName: caseName || cleanText(item.rawTitle),
        courtName: '금융감독원 분쟁조정위원회',
        judgmentDate: '',
        summary: summary.substring(0, 1000),
        url: item.url,
        targetKeyword: '분쟁조정',
        used: false,
        ingestedAt: new Date().toISOString()
      };

      pool.push(newEntry);
      existingCaseNumbers.add(caseNumber);
      existingCaseNumbers.add(item.url);
      addedCount++;

      console.log(`  ✅ 수집 완료: [${newEntry.courtName}] ${newEntry.caseNumber} - ${newEntry.caseName.substring(0, 40)}...`);
    }
  }

  // 2. 풀 저장
  fs.writeFileSync(POOL_PATH, JSON.stringify(pool, null, 2), 'utf8');
  console.log(`\n🎉 [수집 완료] 신규 분조위 사례: ${addedCount}건 추가 / 전체 풀 총합: ${pool.length}건`);
  console.log(`💾 저장 경로: ${POOL_PATH}`);
}

if (require.main === module) {
  const maxPages = parseInt(process.argv[2], 10) || 3;
  ingestFssFromTistory(maxPages);
}

module.exports = { ingestFssFromTistory };
