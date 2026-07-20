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
const NAVER_CLIENT_ID      = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET  = process.env.NAVER_CLIENT_SECRET;
const NCP_API_KEY_ID       = process.env.NCP_API_KEY_ID;
const NCP_API_KEY          = process.env.NCP_API_KEY;

/** 구글 뉴스 RSS 검색 쿼리 — 보험·손해사정 도메인 특화 */
const NEWS_QUERIES = [
  '보험금 지급거절 분쟁',
  '손해사정 교통사고 보상',
  '실손보험 산재 후유장해',
];

/** 법제처 탐색 실패 시 사용할 전문 손해사정 백업 키워드 50선 */
const BACKUP_KEYWORDS = [
  '사망보험금', '자살보험금', '암진단비', '뇌출혈', '급성심근경색',
  '실손의료비', '소비자선임권', '교통사고 과실비율', '교통사고 위자료', '휴업손해',
  '장해진단', '영업배상책임', '의료사고', '근재보험', '산재보험',
  '장해평가', '면책보험금', '보험금 지급거절', '척추 압박골절 후유장해', '십자인대 파열',
  '회전근개 파열', '추간판탈출증 디스크', '고지의무 위반', '통지의무 위반', '일상생활배상책임',
  '체육시설 사고 배상책임', '도로 관리 하자 배상책임', '스키장 사고 배상책임',
  '개 물림 사고 배상책임', '자전거 교통사고', '보행자 무단횡단 사고',
  '음주운전 면책 동의', '무면허 사고 면책', '뺑소니 사고 보상', '산재 유족급여',
  '산재 요양급여 기각', '소음성 난청 산재', '출퇴근길 사고 산재',
  '뇌경색 진단비 면책', '허혈성심장질환 진단비', '만성 신부전 장해등급',
  '대퇴골 경부 골절 후유장해', '고액암 지급거절', '경계성종양 암진단비',
  '제자리암 소액암 지급', '요추 골절 후유장해', '외상성 뇌손상 인지장해',
  '한시장해 장해진단서', '기왕증 공제 과실상계', '약관 설명의무 위반',
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

function getNaverHeaders() {
  if (NCP_API_KEY_ID && NCP_API_KEY) {
    return {
      'x-ncp-apigw-api-key-id': NCP_API_KEY_ID,
      'x-ncp-apigw-api-key': NCP_API_KEY,
      'Content-Type': 'application/json',
    };
  }
  return {
    'X-Naver-Client-Id': NAVER_CLIENT_ID,
    'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
    'Content-Type': 'application/json',
  };
}

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
    return result.candidates ?? [];
  } catch (err) {
    console.warn(`    [경고] AI 키워드 추출 오류: ${err.message}`);
    return [];
  }
}

// ── [3단계] 네이버 데이터랩 API → 검색 수요 기반 키워드 순위화 ──────────
async function rankByNaverDatalab(candidates) {
  if ((!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) && (!NCP_API_KEY_ID || !NCP_API_KEY)) {
    console.warn('    [데이터랩 스킵] 인증키 미설정 — 원본 순서 유지');
    return candidates;
  }
  if (!candidates.length) return candidates;

  console.log('[3/5] 네이버 데이터랩 API — 키워드 검색 수요 검증 중...');

  const today     = new Date();
  const endDate   = today.toISOString().slice(0, 10);
  const startDate = new Date(today - 30 * 86400000).toISOString().slice(0, 10);
  const scores    = new Map();

  // 데이터랩 API 제한: 요청당 최대 5개 그룹
  for (let i = 0; i < candidates.length; i += 5) {
    const batch = candidates.slice(i, i + 5);
    try {
      const bodyData = {
        startDate, endDate, timeUnit: 'month',
        keywordGroups: batch.map(c => ({ groupName: c.searchKeyword, keywords: [c.searchKeyword] })),
      };

      const endpoint = (NCP_API_KEY_ID && NCP_API_KEY)
        ? 'https://naverapihub.apigw.ntruss.com/search-trend/v1/search'
        : 'https://openapi.naver.com/v1/datalab/search';

      const res = await safeFetch(endpoint, {
        method: 'POST',
        headers: getNaverHeaders(),
        body: JSON.stringify(bodyData)
      }, 10000);

      if (!res.ok) { console.warn(`    [경고] 데이터랩 HTTP ${res.status}`); continue; }

      const { results = [] } = await res.json();
      for (const r of results) {
        const avg = r.data.reduce((s, d) => s + d.ratio, 0) / (r.data.length || 1);
        scores.set(r.title, avg);
      }
    } catch (err) {
      console.warn(`    [경고] 데이터랩 오류: ${err.message}`);
    }
    await sleep(300);
  }

  if (!scores.size) { console.log('    유효 응답 없음 — 원본 순서 유지'); return candidates; }

  const ranked = [...candidates].sort((a, b) =>
    (scores.get(b.searchKeyword) ?? 0) - (scores.get(a.searchKeyword) ?? 0)
  );
  console.log(`    상위 키워드: ${ranked.slice(0, 3).map(c => `"${c.searchKeyword}"(${(scores.get(c.searchKeyword) ?? 0).toFixed(1)})`).join(', ')}`);
  return ranked;
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

  // 2. AI 키워드 추출
  const rawCandidates = await extractInsuranceKeywords(headlines);

  // 3. 데이터랩 검색 수요 순위화
  const rankedCandidates = await rankByNaverDatalab(rawCandidates);

  // 4. 트렌드 기반 판례 탐색
  console.log('[4/5] 트렌드 키워드 기반 법제처 판례 탐색 중...');
  let found = await findPrecedent(rankedCandidates, usedCaseNumbers);

  // 5. 백업 키워드 탐색 (트렌드 탐색 실패 시)
  if (!found) {
    console.log('[5/5] ⚠️ 트렌드 탐색 실패 — 전문 백업 키워드로 재탐색 시작...');
    const backupCandidates = BACKUP_KEYWORDS
      .filter(k => !usedKeywords.has(k))
      .map(k => ({ searchKeyword: k, newsTitle: '' }));
    found = await findPrecedent(backupCandidates, usedCaseNumbers);
  }

  // 비상 더미 (법제처 완전 다운 등 극한 상황)
  if (!found) {
    console.warn('⚠️ 모든 소스 탐색 실패 — 비상 더미 판례로 세션 보호');
    found = {
      keyword: '보험금 청구', newsTitle: '',
      detail: {
        id: '000000', caseName: '손해배상 지급거절 구제',
        caseNo: '대법원 2023다000000', judgmentDate: '20230615', courtName: '대법원',
        judgmentSummary: '보험계약 해석은 신의성실 원칙에 따라야 하며, 신빙성 있는 의학적 소견에 기초한 보험금 청구를 정당한 사유 없이 거절할 수 없다.',
        caseContent: '보험약관은 평균적 고객의 이해를 기준으로 객관적·획일적으로 해석하여야 하며, 모호할 때는 작성자 불이익의 원칙을 적용해 피보험자에게 유리하게 해석해야 한다.',
        caseType: '민사',
      },
    };
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
