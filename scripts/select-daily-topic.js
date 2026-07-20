/**
 * select-daily-topic.js
 * 오늘의 블로그 주제 및 판례 확정 스크립트
 *
 * 데이터 파이프라인:
 *   1. 구글 뉴스 RSS     → 보험·손해사정 분야 최신 이슈 헤드라인 수집
 *   2. Gemini AI        → 손해사정 연관 키워드 정제·추출
 *   3. 네이버 데이터랩 API → 키워드 실제 검색 수요 검증·순위화
 *   4. 법제처 API        → 최적 키워드 기반 판례 탐색
 *   5. 백업 키워드       → 1~4 모두 실패 시 전문 키워드 풀로 재탐색
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');
const { safeFetch } = require('./fetch-utils.js');

// ── 환경변수 로드 (.env.local) ────────────────────────────────────────────
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)?\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = (m[2] ?? '').replace(/(^['"]|['"]$)/g, '').trim();
    }
  });
}

const { callGemini } = require('./gemini-helper');

// ── 상수 ─────────────────────────────────────────────────────────────────
const OUTPUT_JSON_PATH     = path.join(process.cwd(), 'scripts/daily-topic.json');
const POSTS_DIR            = path.join(process.cwd(), 'src/content/posts');
const LAW_API_KEY          = process.env.LAW_API_KEY;
const LAW_PROXY_ENDPOINT   = process.env.LAW_PROXY_ENDPOINT;
const LAW_PROXY_TOKEN      = process.env.LAW_PROXY_TOKEN;

/** 구글 뉴스 RSS 검색 쿼리 — 보험·손해사정 도메인 특화 */
const NEWS_QUERIES = [
  '보험금 지급거절 분쟁',
  '손해사정 교통사고 보상',
  '실손보험 산재 후유장해',
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── 기존 포스트 분석 (중복 방지) ─────────────────────────────────────────
function getUsedMetadata() {
  const usedCaseNumbers = new Set();
  const usedKeywords    = new Set();

  if (!fs.existsSync(POSTS_DIR)) return { usedCaseNumbers, usedKeywords };

  for (const file of fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'))) {
    try {
      const yaml = (fs.readFileSync(path.join(POSTS_DIR, file), 'utf8')
        .match(/^---\r?\n([\s\S]*?)\r?\n---/) ?? [])[1] ?? '';

      const caseNo = yaml.match(/caseNumber:\s*["']?(.*?)["']?\r?$/m)?.[1]?.trim();
      if (caseNo) usedCaseNumbers.add(caseNo);

      // 인라인: tags: ["a","b"] | 블록: tags:\n  - a
      const inline = yaml.match(/tags:\s*\[(.*?)\]/)?.[1];
      if (inline) {
        inline.split(',').forEach(t => { const v = t.replace(/['"]/g,'').trim(); if(v) usedKeywords.add(v); });
      } else {
        yaml.match(/tags:\r?\n((?:\s*-\s*.*?\r?\n)*)/)?.[1]?.split('\n').forEach(l => {
          const v = l.replace(/^\s*-\s*/,'').replace(/['"]/g,'').trim();
          if (v) usedKeywords.add(v);
        });
      }
    } catch { /* 파싱 불가 파일 무시 */ }
  }
  return { usedCaseNumbers, usedKeywords };
}

// ── XML 값 추출 헬퍼 ─────────────────────────────────────────────────────
function extractXmlValues(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*?))</${tag}>`, 'g');
  const out = [];
  let m;
  while ((m = re.exec(xml)) !== null) out.push((m[1] ?? m[2] ?? '').trim());
  return out;
}

// ── [1단계] 구글 뉴스 RSS → 최신 이슈 헤드라인 수집 ─────────────────────
async function fetchTrendingNews() {
  console.log('[1/5] 구글 뉴스 RSS에서 최신 보험·손해사정 이슈 수집 중...');

  const BASE    = 'https://news.google.com/rss/search?hl=ko&gl=KR&ceid=KR:ko&q=';
  const headers = { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' };
  const headlines = [];

  for (const query of NEWS_QUERIES) {
    try {
      const res = await safeFetch(BASE + encodeURIComponent(query), { headers }, 10000);
      if (!res.ok) { console.warn(`    [경고] "${query}" (HTTP ${res.status})`); continue; }

      const xml = await res.text();
      const titles = extractXmlValues(xml, 'title')
        .filter(t => t && !t.startsWith('"') && !t.includes('Google 뉴스'));

      headlines.push(...titles);
      console.log(`    "${query}" → ${titles.length}건`);
    } catch (err) {
      console.warn(`    [경고] "${query}" 오류: ${err.message}`);
    }
  }

  const unique = [...new Set(headlines)];
  console.log(`    총 ${unique.length}개 헤드라인 수집 완료`);
  return unique;
}

// ── [2단계] Gemini AI → 손해사정 키워드 추출 ────────────────────────────
async function extractInsuranceKeywords(headlines) {
  if (!headlines.length) return [];
  console.log('[2/5] AI 분석 — 손해사정 연관 키워드 추출 중...');

  const prompt = `당신은 대한민국 최고의 손해사정 블로그 수석 편집장입니다.
아래 뉴스 헤드라인 목록에서 손해사정(교통사고·산재·질병·배상책임·보험금 분쟁)과
직접 연관된 이슈를 분석하여, 법제처 판례 API 검색에 즉시 활용할 구체적인 법률·보험 용어 키워드를 추출하세요.

[중요 지시사항]
반드시 아래 뉴스 헤드라인에서 가장 자주 언급된 빈도수(Frequency)와 사회적 파급력을 분석하여, 
대중의 검색 수요와 화제성이 가장 높을 것으로 예상되는 순서대로 키워드 순위를 정렬하여 반환하세요.
(1위 키워드가 가장 핫한 이슈가 되도록 정렬해야 합니다.)

[헤드라인 목록]
${headlines.slice(0, 50).map((t, i) => `${i + 1}. ${t}`).join('\n')}`;

  const schema = {
    type: 'OBJECT',
    properties: {
      candidates: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            newsTitle:     { type: 'STRING', description: '원본 뉴스 헤드라인' },
            searchKeyword: { type: 'STRING', description: '법제처 API 검색용 손해사정 키워드' },
          },
          required: ['newsTitle', 'searchKeyword'],
        },
      },
    },
    required: ['candidates'],
  };

  try {
    const result = await callGemini(prompt, schema);
    if (!result.candidates || result.candidates.length === 0) {
      throw new Error('추출된 키워드가 없습니다.');
    }
    return result.candidates;
  } catch (err) {
    console.warn('❌ Gemini AI 키워드 추출 실패:', err.message);
    throw new Error('뉴스 키워드 추출에 실패했습니다.');
  }
}

// ── 법제처 API 공통 호출 ─────────────────────────────────────────────────
async function fetchLawAPI(type, params) {
  const headers = { 'User-Agent': 'Mozilla/5.0' };
  let url;

  if (LAW_PROXY_ENDPOINT?.trim()) {
    url = type === 'list'
      ? `${LAW_PROXY_ENDPOINT.trim()}/api/precedent?query=${encodeURIComponent(params.query)}`
      : `${LAW_PROXY_ENDPOINT.trim()}/api/precedent-detail?ID=${params.id}`;
    if (LAW_PROXY_TOKEN) headers['X-Proxy-Token'] = LAW_PROXY_TOKEN.trim();
  } else {
    if (!LAW_API_KEY) throw new Error('LAW_API_KEY 미설정');
    url = type === 'list'
      ? `https://www.law.go.kr/DRF/lawSearch.do?target=prec&type=XML&OC=${LAW_API_KEY}&search=2&query=${encodeURIComponent(params.query)}`
      : `https://www.law.go.kr/DRF/lawService.do?target=prec&type=XML&OC=${LAW_API_KEY}&ID=${params.id}`;
  }

  const res = await safeFetch(url, { headers }, 10000);
  if (!res.ok) throw new Error(`법제처 HTTP ${res.status}`);
  return res.text();
}

async function searchPrecedents(query) {
  const xml = await fetchLawAPI('list', { query });
  if (xml.includes('사용자 정보 검증에 실패하였습니다')) throw new Error('법제처 인증 실패');
  const ids     = extractXmlValues(xml, '판례일련번호');
  const titles  = extractXmlValues(xml, '사건명');
  const caseNos = extractXmlValues(xml, '사건번호');
  return ids.map((id, i) => ({ id, title: titles[i], caseNo: caseNos[i] }));
}

async function getPrecedentDetail(id) {
  const xml = await fetchLawAPI('detail', { id });
  return {
    id,
    caseName:        extractXmlValues(xml, '사건명')[0]     ?? '',
    caseNo:          extractXmlValues(xml, '사건번호')[0]   ?? '',
    judgmentDate:    extractXmlValues(xml, '선고일자')[0]   ?? '',
    courtName:       extractXmlValues(xml, '법원명')[0]     ?? '',
    judgmentSummary: extractXmlValues(xml, '판결요지')[0]   ?? '',
    caseContent:     extractXmlValues(xml, '판례내용')[0]   ?? '',
    caseType:        extractXmlValues(xml, '사건종류명')[0] ?? '',
  };
}

/** 판례 목록에서 유효한 판례 1건을 반환 (최대 5건 탐색) */
async function scanPrecedentList(list, usedCaseNumbers) {
  for (const { id, caseNo } of list.slice(0, 5)) {
    if (usedCaseNumbers.has(caseNo)) { console.log(`    [-] 중복: ${caseNo}`); continue; }
    try {
      const detail = await getPrecedentDetail(id);
      if (usedCaseNumbers.has(detail.caseNo)) { console.log(`    [-] 중복: ${detail.caseNo}`); continue; }
      if (detail.judgmentSummary?.length >= 40 && detail.caseContent) {
        console.log(`    [✓] 판례 확보: ${detail.caseNo} (${detail.caseName})`);
        return detail;
      }
    } catch (err) {
      console.warn(`    [-] 판례 상세 실패 (ID: ${id}): ${err.message}`);
    }
  }
  return null;
}

/** 키워드 배열을 순회하며 유효한 판례를 탐색 */
async function findPrecedent(keywords, usedCaseNumbers) {
  for (const { searchKeyword, newsTitle } of keywords) {
    const hint = newsTitle ? ` (이슈: ${newsTitle})` : '';
    console.log(`  [탐색] "${searchKeyword}"${hint}`);
    try {
      const list = await searchPrecedents(searchKeyword);
      if (list.length) {
        const detail = await scanPrecedentList(list, usedCaseNumbers);
        if (detail) return { keyword: searchKeyword, newsTitle: newsTitle ?? '', detail };
      }
    } catch (err) {
      console.warn(`  [실패] "${searchKeyword}": ${err.message}`);
    }
    await sleep(1000);
  }
  return null;
}

// ── 메인 ─────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== 1단계: 오늘의 주제 및 판례 데이터 연쇄 탐색 시작 ===');

  const { usedCaseNumbers, usedKeywords } = getUsedMetadata();
  console.log(`  [분석] 기발행 포스트 수: ${usedCaseNumbers.size}개 | 기사용 키워드 수: ${usedKeywords.size}개`);

  // 1. 구글 뉴스 RSS 수집
  const headlines = await fetchTrendingNews();

  // 2. AI 키워드 추출 (자동 랭킹 포함)
  const rankedCandidates = await extractInsuranceKeywords(headlines);

  // 3. 트렌드 기반 판례 탐색
  console.log('[3/4] 트렌드 키워드 기반 법제처 판례 탐색 중...');
  let found = await findPrecedent(rankedCandidates, usedCaseNumbers);

  if (!found) {
    console.warn('⚠️ 모든 소스 탐색 실패 — 적절한 판례를 찾지 못했습니다.');
    throw new Error('적절한 판례를 찾지 못했습니다.');
  }

  const output = {
    keyword:    found.keyword,
    source:     found.newsTitle ? 'trend' : 'backup',
    trendTitle: found.newsTitle,
    precedent:  found.detail,
    selectedAt: new Date().toISOString(),
  };

  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(output, null, 2), 'utf8');
  console.log(`[완료] 오늘의 주제: "${found.keyword}" → ${OUTPUT_JSON_PATH}`);
  console.log('=== 1단계 프로세스 완료 ===\n');
}

main().catch(err => {
  console.error('\n[⚠️ 1단계 오류] 치명적인 에러 발생:', err.message);
  process.exit(1);
});
