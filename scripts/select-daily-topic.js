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
const matter = require('gray-matter');
const { XMLParser } = require('fast-xml-parser');

// ── 공통 유틸 (pipeline-utils.js 에서 단일 공급 — .env.local 로드 포함) ────
const { POSTS_DIR: _POSTS_DIR, sleep, safeFetch } = require('./pipeline-utils.js');
const { callGemini } = require('./gemini-helper');

// ── 상수 ─────────────────────────────────────────────────────────────────
const OUTPUT_JSON_PATH   = path.join(process.cwd(), 'scripts/daily-topic.json');
const POSTS_DIR          = _POSTS_DIR; // pipeline-utils 에서 공급
const LAW_API_KEY        = process.env.LAW_API_KEY;
const LAW_PROXY_ENDPOINT = process.env.LAW_PROXY_ENDPOINT;
const LAW_PROXY_TOKEN    = process.env.LAW_PROXY_TOKEN;

const TARGET_CATEGORIES = [
  '사망·자살 보험금',
  '질병진단·실손',
  '교통사고 보상',
  '배상책임·의료',
  '근재·산재 사고',
  '장해평가·면책',
  '보상가이드',
  '판례·법률 해석'
];

function determineCategory() {
  const args = process.argv.slice(2);
  const catIdx = args.indexOf('--category');
  if (catIdx !== -1 && args[catIdx + 1]) {
    return args[catIdx + 1];
  }
  const utcHour = new Date().getUTCHours();
  if (utcHour >= 0 && utcHour <= 7) {
    return TARGET_CATEGORIES[utcHour];
  }
  return TARGET_CATEGORIES[Math.floor(Math.random() * TARGET_CATEGORIES.length)];
}

// sleep 은 pipeline-utils.js 에서 공급됨

// ── 기존 포스트 분석 (중복 방지) ─────────────────────────────────────────
function getUsedMetadata(targetCategory) {
  const usedCaseNumbers = new Set();
  const usedKeywords    = new Set();

  if (!fs.existsSync(POSTS_DIR)) return { usedCaseNumbers, usedKeywords };

  const posts = [];
  for (const file of fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'))) {
    try {
      const filePath = path.join(POSTS_DIR, file);
      const stat = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(content);

      const category = data.category ? String(data.category).trim() : '';
      const caseNo = data.caseNumber ? String(data.caseNumber).trim() : '';
      
      let tags = [];
      if (Array.isArray(data.tags)) {
        tags = data.tags.map(t => String(t).trim()).filter(Boolean);
      } else if (typeof data.tags === 'string') {
        tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
      
      posts.push({ category, caseNo, tags, mtime: stat.mtimeMs });
    } catch { /* 파싱 불가 파일 무시 */ }
  }

  // 판례 번호는 기간, 카테고리 상관없이 블로그 전체 역사상 쓰인 모든 판례 번호를 영구 배제
  for (const p of posts) {
    if (p.caseNo) usedCaseNumbers.add(p.caseNo);
  }

  // 키워드는 타겟 카테고리에 해당하는 최신순 30개 글에서만 추출하여 단기 중복 방지
  const filteredPosts = posts
    .filter(p => p.category === targetCategory)
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, 30);

  for (const p of filteredPosts) {
    p.tags.forEach(t => usedKeywords.add(t));
  }

  return { usedCaseNumbers, usedKeywords };
}

// ── XML 파서 ─────────────────────────────────────────────────────────────
const xmlParser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });

// ── [0단계] 트렌드 키워드 동적 창작 ──────────────────────────────────────
async function generateTrendySearchKeywords(usedKeywordsSet, targetCategory) {
  console.log(`[0/5] AI가 최근 발행된 30개 포스트를 바탕으로 [${targetCategory}] 관련 새로운 검색 키워드 창작 중...`);
  const usedArray = Array.from(usedKeywordsSet);
  let prompt = '';

  if (targetCategory === '판례·법률 해석') {
    // 판례 카테고리는 카테고리 족쇄를 풀고 자율성을 부여 (과거 금요일 프롬프트 복원)
    prompt = `당신은 대한민국 최고의 손해사정 블로그 수석 편집장입니다.
아래는 최근 우리 블로그에서 다루었던 최신 포스트의 키워드 목록입니다.
[최근 키워드 목록]
${usedArray.join(', ')}

이 키워드들과 겹치지 않으면서도, 현재 대중들이 가장 궁금해할 만한 **전체 보상/보험/손해사정 분야**의 핫 트렌드 검색 키워드 3개를 창작해 주세요.
(특정 카테고리에 얽매이지 말고, 가장 굵직하고 보편적인 법률 및 실무 분쟁 이슈를 뽑아내야 합니다.)
이 키워드는 구글 뉴스 검색에 사용될 것입니다.`;
  } else {
    // 일반 트렌드 카테고리는 카테고리에 맞게 정밀 타겟팅
    prompt = `당신은 대한민국 최고의 손해사정 블로그 수석 편집장입니다.
아래는 최근 우리 블로그의 [${targetCategory}] 카테고리에서 다루었던 최신 포스트의 키워드 목록입니다.
[최근 키워드 목록]
${usedArray.join(', ')}

이 키워드들과 겹치지 않으면서도, 현재 대중들이 가장 궁금해할 만한 **[${targetCategory}]** 관련 핫 트렌드 검색 키워드 3개를 창작해 주세요.
이 키워드는 구글 뉴스 검색에 사용될 것입니다.`;
  }

  const schema = {
    type: 'OBJECT',
    properties: {
      queries: {
        type: 'ARRAY',
        items: { type: 'STRING' },
        description: '구글 뉴스 검색용 키워드 3개'
      }
    },
    required: ['queries']
  };

  try {
    const res = await callGemini(prompt, schema);
    if (!res.queries || res.queries.length === 0) throw new Error('생성된 쿼리가 없습니다.');
    console.log('    ✨ AI 생성 검색 쿼리:', res.queries);
    return res.queries;
  } catch (err) {
    console.warn('    ⚠️ AI 검색 키워드 생성 실패, 기본값 사용:', err.message);
    return ['보험금 지급 분쟁', '교통사고 손해사정', '산재 보상금 판례'];
  }
}

// ── [1단계] 구글 뉴스 RSS → 최신 이슈 헤드라인 수집 ─────────────────────
async function fetchTrendingNews(queries) {
  console.log('[1/5] 구글 뉴스 RSS에서 최신 보험·손해사정 이슈 수집 중...');

  const BASE    = 'https://news.google.com/rss/search?hl=ko&gl=KR&ceid=KR:ko&q=';
  const headers = { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' };
  const headlines = [];

  for (const query of queries) {
    try {
      let res;
      // RSS 프록시 엔드포인트가 있으면 우선 시도합니다.
      let usedProxy = false;
      if (LAW_PROXY_ENDPOINT) {
        try {
          const proxyUrl = `${LAW_PROXY_ENDPOINT.trim()}/api/rss?query=${encodeURIComponent(query)}`;
          const proxyHeaders = { ...headers };
          if (LAW_PROXY_TOKEN) proxyHeaders['X-Proxy-Token'] = LAW_PROXY_TOKEN.trim();
          res = await safeFetch(proxyUrl, { headers: proxyHeaders }, 10000);
          if (res.ok) usedProxy = true;
        } catch (proxyErr) {
          console.warn(`    [프록시 경고] 프록시 실패 (${proxyErr.message}), 직접 호출로 Fallback...`);
        }
      }

      // 프록시를 안 쓰거나 실패했을 경우 직접 호출
      if (!usedProxy) {
        res = await safeFetch(BASE + encodeURIComponent(query), { headers }, 10000);
      }

      if (!res.ok) { console.warn(`    [경고] "${query}" (HTTP ${res.status})`); continue; }

      const xml = await res.text();
      const doc = xmlParser.parse(xml);
      const items = [].concat(doc?.rss?.channel?.item || []);
      const titles = items.map(i => i.title).filter(t => t && !t.startsWith('"') && !t.includes('Google 뉴스')).slice(0, 10);

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
async function extractInsuranceKeywords(headlines, targetCategory) {
  if (!headlines.length) return [];
  console.log(`[2/5] AI 분석 — [${targetCategory}] 연관 키워드 추출 중...`);

  const prompt = `당신은 대한민국 최고의 손해사정 블로그 수석 편집장입니다.
아래 뉴스 헤드라인 목록에서 [${targetCategory}] 분야와
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

// ── [2.5단계] Gemini AI → 상위 법률 용어 도출 (2차 탐색용) ─────────────────
async function getGenericLegalKeywords(targetCategory) {
  console.log(`[2.5/5] AI 분석 — [${targetCategory}] 상위 법률 용어(면책사유 등) 도출 중...`);
  const prompt = `당신은 대한민국 최고의 손해사정 블로그 수석 편집장입니다.
방금 뉴스 트렌드 기반으로 대법원 판례 검색을 시도했으나 너무 최신 유행어라서 판례를 찾지 못했습니다.
따라서, **[${targetCategory}]** 분야의 대법원 판례에서 가장 자주 등장하는 보편적이고 핵심적인 상위 법률 용어(예: 면책사유, 인과관계, 설명의무, 안전배려의무 등) 3가지를 도출해 주세요.

반드시 아래 뉴스 헤드라인과 연관된 용어일 필요는 없으며, 해당 카테고리를 관통하는 가장 본질적인 법률 키워드여야 합니다.`;

  const schema = {
    type: 'OBJECT',
    properties: {
      keywords: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            searchKeyword: { type: 'STRING' },
            newsTitle: { type: 'STRING', description: '빈 문자열 냅둡니다' }
          },
          required: ['searchKeyword']
        }
      }
    },
    required: ['keywords']
  };

  try {
    const result = await callGemini(prompt, schema);
    return result.keywords || [];
  } catch (err) {
    console.warn('⚠️ 상위 법률 용어 도출 실패:', err.message);
    return [];
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
  const doc = xmlParser.parse(xml);
  const precs = [].concat(doc?.PrecSearch?.prec || []);
  return precs.map(p => ({
    id: String(p['판례일련번호'] || ''),
    title: String(p['사건명'] || ''),
    caseNo: String(p['사건번호'] || '')
  }));
}

async function getPrecedentDetail(id) {
  const xml = await fetchLawAPI('detail', { id });
  const doc = xmlParser.parse(xml);
  const p = doc?.PrecDetail || {};
  return {
    id,
    caseName:        String(p['사건명'] || ''),
    caseNo:          String(p['사건번호'] || ''),
    judgmentDate:    String(p['선고일자'] || ''),
    courtName:       String(p['법원명'] || ''),
    judgmentSummary: String(p['판결요지'] || ''),
    caseContent:     String(p['판례내용'] || ''),
    caseType:        String(p['사건종류명'] || ''),
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
  const targetCategory = determineCategory();
  console.log(`=== 1단계: [${targetCategory}] 주제 및 판례 데이터 연쇄 탐색 시작 ===`);

  const { usedCaseNumbers, usedKeywords } = getUsedMetadata(targetCategory);
  console.log(`  [분석] 기발행 [${targetCategory}] 카테고리 포스트 30개 분석 | 기사용 키워드 수: ${usedKeywords.size}개`);

  // 1. 구글 뉴스 RSS 수집
  const aiQueries = await generateTrendySearchKeywords(usedKeywords, targetCategory);
  const headlines = await fetchTrendingNews(aiQueries);

  // 2. AI 키워드 추출 (자동 랭킹 포함)
  const rankedCandidates = await extractInsuranceKeywords(headlines, targetCategory);

  let found = null;

  if (targetCategory === '판례·법률 해석') {
    // 3. 1차 탐색망 (트렌드 기반 판례 검색)
    console.log('[3/4] 1차 탐색망: 트렌드 키워드 기반 법제처 판례 탐색 중...');
    found = await findPrecedent(rankedCandidates, usedCaseNumbers);

    // 4. 2차 탐색망 (AI 상위 법률 용어)
    if (!found) {
      console.log('[3/4] ⚠️ 1차 탐색 실패. 2차 탐색망(상위 법률 용어) 가동...');
      const genericKeywords = await getGenericLegalKeywords(targetCategory);
      found = await findPrecedent(genericKeywords, usedCaseNumbers);
    }

    if (!found) {
      console.warn('⚠️ 2중 탐색망 모두 실패 — 적절한 판례를 찾지 못했습니다.');
      throw new Error('적절한 판례를 찾지 못했습니다.');
    }
  } else {
    // 트렌드 포스팅인 경우 판례 검색 없이 즉시 1위 키워드 채택
    console.log(`[3/4] 일반 트렌드 카테고리이므로 판례 탐색을 생략하고 즉시 1위 키워드를 채택합니다.`);
    found = {
      keyword: rankedCandidates[0].searchKeyword,
      newsTitle: rankedCandidates[0].newsTitle,
      detail: null
    };
  }

  const output = {
    category:   targetCategory,
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
