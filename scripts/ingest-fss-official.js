/**
 * ingest-fss-official.js
 * 대한민국 금융감독원(fss.or.kr) 공식 서버 분쟁조정 결정문/보도자료 직접 수집 파이프라인
 * 
 * [원천] https://www.fss.or.kr/fss/bbs/B0000188/list.do?menuNo=200218
 * [검색어] '분쟁조정'
 * — LLM 개입 0% 기계적 파싱 및 precedent-pool.json 자동 적재
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const { POOL_PATH, PUBLIC_POOL_PATH, savePool } = require('../src/lib/precedent-pool.js');

const BASE_HOST = 'www.fss.or.kr';
const LIST_PATH = '/fss/bbs/B0000188/list.do?menuNo=200218&searchCnd=1&searchWrd=' + encodeURIComponent('분쟁조정');

function fetchUrl(urlPath) {
  return new Promise((resolve) => {
    const fullUrl = urlPath.startsWith('http') ? urlPath : `https://${BASE_HOST}${urlPath}`;
    https.get(fullUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', (err) => {
      console.warn(`  [금감원 통신 오류] ${urlPath}: ${err.message}`);
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ingestFssOfficial(maxPages = 3) {
  console.log('🏛️ [금융감독원 공식 홈페이지 fss.or.kr 직접 수집 시작]...');

  let pool = [];
  if (fs.existsSync(POOL_PATH)) {
    pool = JSON.parse(fs.readFileSync(POOL_PATH, 'utf8'));
  }
  const existingCaseNumbers = new Set(pool.map(p => p.caseNumber));
  console.log(`📂 현재 풀 적재 현황: ${pool.length}건`);

  let addedCount = 0;

  for (let page = 1; page <= maxPages; page++) {
    const pagePath = `${LIST_PATH}&pageIndex=${page}`;
    console.log(`\n📄 [금감원 공식 페이지 ${page}/${maxPages} 조회 중]...`);
    const listHtml = await fetchUrl(pagePath);
    if (!listHtml) break;

    // 게시물 링크 및 제목 파싱
    const itemRegex = /<a href="[^"]*nttId=(\d+)[^"]*">([\s\S]*?)<\/a>/g;
    let match;
    const pageItems = [];

    while ((match = itemRegex.exec(listHtml)) !== null) {
      const nttId = match[1].trim();
      const rawTitle = cleanText(match[2]);
      if (rawTitle && rawTitle.length > 5 && !rawTitle.includes('이전') && !rawTitle.includes('다음')) {
        pageItems.push({
          id: nttId,
          title: rawTitle,
          url: `/fss/bbs/B0000188/view.do?nttId=${nttId}&menuNo=200218`
        });
      }
    }

    console.log(`  ➔ 금감원 공식 분쟁조정 항목 ${pageItems.length}건 발견`);
    if (pageItems.length === 0) break;

    for (const item of pageItems) {
      const caseNumber = `금융감독원 분쟁조정 (nttId:${item.id})`;
      if (existingCaseNumbers.has(caseNumber) || existingCaseNumbers.has(item.title)) {
        continue;
      }

      await sleep(300);
      const detailHtml = await fetchUrl(item.url);
      
      // 본문 발췌
      let content = '';
      const bViewerIdx = detailHtml.indexOf('b-viewer');
      if (bViewerIdx !== -1) {
        const endIdx = detailHtml.indexOf('<!-- //bd-view-content -->', bViewerIdx);
        const rawBody = endIdx !== -1 ? detailHtml.substring(bViewerIdx, endIdx) : detailHtml.substring(bViewerIdx, bViewerIdx + 4000);
        content = cleanText(rawBody);
      } else {
        const bodyMatch = detailHtml.match(/<div class="bd-view-content"[^>]*>([\s\S]*?)<\/div>/);
        if (bodyMatch) content = cleanText(bodyMatch[1]);
      }

      if (!content || content.length < 50) continue;

      const newEntry = {
        id: `FSS-OFFICIAL-${item.id}`,
        source: 'fss-official-api',
        rawResponseId: item.id,
        caseNumber: `금감원 분조위 결정 [${item.id}]`,
        caseName: item.title,
        courtName: '금융감독원 금융분쟁조정위원회',
        judgmentDate: '',
        summary: content.substring(0, 1000),
        url: `https://${BASE_HOST}${item.url}`,
        targetKeyword: '분쟁조정',
        used: false,
        ingestedAt: new Date().toISOString()
      };

      pool.push(newEntry);
      existingCaseNumbers.add(caseNumber);
      existingCaseNumbers.add(item.title);
      addedCount++;

      console.log(`  ✅ [금감원 공식 수집] ${newEntry.caseNumber} - ${newEntry.caseName.substring(0, 35)}...`);
    }
  }

  savePool(pool);
  console.log(`\n🎉 [금감원 공식 수집 완료] 신규 추가: ${addedCount}건 / 전체 풀 총합: ${pool.length}건`);
}

if (require.main === module) {
  const pages = parseInt(process.argv[2], 10) || 3;
  ingestFssOfficial(pages);
}

module.exports = { ingestFssOfficial };
