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
const { getExistingPosts } = require('../src/lib/post-builder.js');
const { 
  getQueryGenerationPrompt, 
  getKeywordExtractionPrompt, 
  getFallbackLegalKeywordPrompt 
} = require('../src/lib/prompt-rules.js');

// ── 상수 ─────────────────────────────────────────────────────────────────
const POSTS_DIR          = _POSTS_DIR;
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


// ── 기존 포스트 분석 (중복 방지) ─────────────────────────────────────────
function getUsedMetadata() {
  const usedCaseNumbers = new Set();
  
  if (!fs.existsSync(POSTS_DIR)) return { usedCaseNumbers };

  const posts = [];
  for (const file of fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'))) {
    try {
      const filePath = path.join(POSTS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(content);

      const caseNo = data.caseNumber ? String(data.caseNumber).trim() : '';
      if (caseNo) usedCaseNumbers.add(caseNo);
    } catch { /* 파싱 불가 파일 무시 */ }
  }

  return { usedCaseNumbers };
}

// ── XML 파서 ─────────────────────────────────────────────────────────────
const xmlParser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });

// ── [0단계] 트렌드 키워드 동적 창작 ──────────────────────────────────────
async function generateTrendySearchKeywords(targetCategory, existingTitles) {
  console.log(`[0/5] AI가 [${targetCategory}] 관련 새로운 검색 키워드 창작 중...`);
  
  const categoryContext = targetCategory === '판례·법률 해석' 
    ? '전체 보상/보험/손해사정 분야' 
    : `[${targetCategory}] 관련 분야`;

  const prompt = getQueryGenerationPrompt(categoryContext, existingTitles);

  const schema = {
    type: 'OBJECT',
    properties: {
      thoughtProcess: {
        type: 'STRING',
        description: '어떤 손해사정 실무 및 수임 관점에서 이 트렌드를 분석하고 키워드를 도출했는지 단계별로 서술한 논리 (Chain-of-Thought)'
      },
      queries: {
        type: 'ARRAY',
        items: { type: 'STRING' },
        description: '구글 뉴스 검색용 실무 키워드 배열 (개수 제한 없음)'
      }
    },
    required: ['thoughtProcess', 'queries']
  };

  try {
    const res = await callGemini(prompt, schema, 'lite');
    console.log(`    🧠 [AI 사고 과정]: ${res.thoughtProcess}`);
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
async function extractInsuranceKeywords(headlines, targetCategory, existingTitles) {
  if (!headlines.length) return [];
  console.log(`[2/5] AI 분석 — [${targetCategory}] 연관 키워드 추출 중...`);

  const prompt = getKeywordExtractionPrompt(targetCategory, existingTitles, headlines);

  const schema = {
    type: 'OBJECT',
    properties: {
      thoughtProcess: {
        type: 'STRING',
        description: '각 뉴스 헤드라인의 빈도수와 사회적 파급력을 분석한 연쇄 사고 논리 (Chain-of-Thought)'
      },
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
    required: ['thoughtProcess', 'candidates'],
  };

  try {
    const result = await callGemini(prompt, schema, 'lite');
    console.log(`    🧠 [AI 사고 과정]: ${result.thoughtProcess}`);
    if (!result.candidates || result.candidates.length === 0) {
      throw new Error('추출된 키워드가 없습니다.');
    }
    return result.candidates;
  } catch (err) {
    console.warn('❌ Gemini AI 키워드 추출 실패 (Fallback 반환):', err.message);
    return [{ newsTitle: `${targetCategory} 주요 분쟁 이슈`, searchKeyword: '보험금 분쟁' }];
  }
}

// ── [2.5단계] Gemini AI → 상위 법률 용어 도출 (2차 탐색용) ─────────────────
async function getGenericLegalKeywords(targetCategory, rankedCandidates) {
  console.log(`[2.5/5] AI 분석 — [${targetCategory}] 상위 법률 용어 도출 중...`);
  
  const context = rankedCandidates ? rankedCandidates.slice(0, 5).map(c => c.searchKeyword).join(', ') : '';

  const prompt = getFallbackLegalKeywordPrompt(targetCategory, context);

  const schema = {
    type: 'OBJECT',
    properties: {
      thoughtProcess: {
        type: 'STRING',
        description: '뉴스 트렌드 이면에 숨겨진 본질적인 법률/의학 분쟁 요소를 분석한 단계별 논리 (Chain-of-Thought)'
      },
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
    required: ['thoughtProcess', 'keywords']
  };

  try {
    const result = await callGemini(prompt, schema, 'lite');
    console.log(`    🧠 [AI 사고 과정]: ${result.thoughtProcess}`);
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
  const p = doc?.PrecService || {};
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

/** 판례 목록에서 유효한 판례 1건을 반환 (최대 30건 탐색) */
async function scanPrecedentList(list, usedCaseNumbers) {
  for (const { id, caseNo } of list.slice(0, 100)) {
    if (usedCaseNumbers.has(caseNo)) { console.log(`    [-] 중복: ${caseNo}`); continue; }
    try {
      const detail = await getPrecedentDetail(id);
      if (usedCaseNumbers.has(detail.caseNo)) { console.log(`    [-] 중복: ${detail.caseNo}`); continue; }
      if (detail.caseContent && detail.caseContent.length >= 200) {
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

// ── 3차 탐색망 유틸리티 (카테고리 순환) ───────────────────────────────────
function getNextFallbackCategory() {
  const fallbacks = TARGET_CATEGORIES.filter(c => c !== '판례·법률 해석');
  const statePath = path.join(process.cwd(), 'scripts/.fallback-state.json');
  let idx = 0;
  
  try {
    if (fs.existsSync(statePath)) {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      if (typeof state.index === 'number') {
        idx = (state.index + 1) % fallbacks.length;
      }
    }
  } catch(e) {}
  
  fs.writeFileSync(statePath, JSON.stringify({ index: idx }), 'utf8');
  return fallbacks[idx];
}

// ── [2.8단계] AI로 3차 백업 키워드 추출 ───────────────────────────────────
async function getFallbackAiKeyword(fallbackCategory) {
  console.log(`[2.8/5] 3차 안전장치 — [${fallbackCategory}] 맞춤형 AI 실무 키워드 도출 중...`);
  
  const prompt = `${LOSS_ADJUSTER_CONTEXT}
지금 판례 검색을 위한 마지막 안전장치로, **[${fallbackCategory}]** 카테고리에서 가장 빈번하게 발생하는 구체적인 보험금 분쟁 또는 손해배상 사건의 핵심 단어(명사)를 생성해야 합니다.
개수에 얽매이지 말고, 연쇄 사고(Chain-of-Thought)를 통해 해당 카테고리에서 손해사정사 수임과 가장 직결되는 실무 단어들을 도출해 주세요.
[중요] 이 키워드들은 법제처 판례 API 검색에 직접(Exact Match) 사용됩니다. 문장형태나 너무 긴 복합어를 쓰면 판례가 검색되지 않습니다. 반드시 짧고 핵심적인 법률/의학 명사(예: "일실수익", "장해진단", "면책약관")로만 추출하세요.`;

  const schema = {
    type: 'OBJECT',
    properties: {
      thoughtProcess: {
        type: 'STRING',
        description: '해당 카테고리에서 발생할 수 있는 주요 분쟁 상황과 수임 포인트를 분석한 논리 (Chain-of-Thought)'
      },
      keywords: { 
        type: 'ARRAY',
        items: { type: 'STRING' },
        description: '매우 구체적인 실무 분쟁 키워드 배열' 
      }
    },
    required: ['thoughtProcess', 'keywords']
  };

  try {
    const res = await callGemini(prompt, schema, 'lite');
    console.log(`    🧠 [AI 사고 과정]: ${res.thoughtProcess}`);
    return res.keywords;
  } catch (err) {
    console.warn('⚠️ 3차 AI 키워드 도출 실패, 카테고리명으로 대체');
    return [fallbackCategory];
  }
}

// ── 메인 ─────────────────────────────────────────────────────────────────
async function getDailyTopic(inputCategory) {
  let targetCategory = inputCategory || determineCategory();
  console.log(`=== 1단계: [${targetCategory}] 주제 및 판례 데이터 연쇄 탐색 시작 ===`);

  const existingPosts = getExistingPosts();
  const usedCaseNumbers = new Set(existingPosts.map(p => p.caseNumber).filter(Boolean));
  const existingTitles = existingPosts.map(p => p.title).join('\n');
  console.log(`  [분석] 기발행 포스트 판례 번호 로드 완료`);

  // 1. 구글 뉴스 RSS 수집
  const aiQueries = await generateTrendySearchKeywords(targetCategory, existingTitles);
  const headlines = await fetchTrendingNews(aiQueries);

  // 2. AI 키워드 추출 (자동 랭킹 포함)
  const rankedCandidates = await extractInsuranceKeywords(headlines, targetCategory, existingTitles);

  let found = null;

  if (targetCategory === '판례·법률 해석') {
    // 3. 1차 탐색망 (트렌드 기반 판례 검색)
    console.log('[3/4] 1차 탐색망: 트렌드 키워드 기반 법제처 판례 탐색 중...');
    found = await findPrecedent(rankedCandidates, usedCaseNumbers);

    // 4. 2차 탐색망 (AI 상위 법률 용어)
    if (!found) {
      console.log('[3/4] ⚠️ 1차 탐색 실패. 2차 탐색망(상위 법률 용어) 가동...');
      const genericKeywords = await getGenericLegalKeywords(targetCategory, rankedCandidates);
      found = await findPrecedent(genericKeywords, usedCaseNumbers);
    }

    // 5. 3차 탐색망 (마지막 안전장치 - 7개 카테고리명 순환 검색 기반 AI 키워드)
    if (!found) {
      console.log('[3/4] ⚠️ 2차 탐색 실패. 3차 탐색망(마지막 안전장치: 카테고리 순환 검색) 가동...');
      const fallbackCategory = getNextFallbackCategory();
      console.log(`    3차 안전장치 카테고리: "${fallbackCategory}"`);
      const fallbackKeywords = await getFallbackAiKeyword(fallbackCategory);
      found = await findPrecedent(fallbackKeywords.map(k => ({ searchKeyword: k, newsTitle: '' })), usedCaseNumbers);
    }

    if (!found) {
      console.warn('⚠️ 3중 탐색망 모두 실패 — 적절한 판례를 찾지 못했습니다. 일반 포스트(보상가이드)로 Fallback 합니다.');
      targetCategory = '보상가이드';
      found = {
        keyword: '보험금 청구 실무 가이드',
        newsTitle: '보험금 분쟁 예방 및 대응법',
        detail: null
      };
    }
  } else {
    // 트렌드 포스팅인 경우 판례 검색 없이 즉시 1위 키워드 채택
    console.log(`[3/4] 일반 트렌드 카테고리이므로 판례 탐색을 생략하고 즉시 1위 키워드를 채택합니다.`);
    if (rankedCandidates && rankedCandidates.length > 0) {
      found = {
        keyword: rankedCandidates[0].searchKeyword,
        newsTitle: rankedCandidates[0].newsTitle,
        detail: null
      };
    } else {
      found = {
        keyword: targetCategory + ' 핵심 분쟁 실무',
        newsTitle: '손해사정 주요 실무 쟁점',
        detail: null
      };
    }
  }

  const output = {
    category:   targetCategory,
    keyword:    found.keyword,
    source:     found.newsTitle ? 'trend' : 'backup',
    trendTitle: found.newsTitle,
    precedent:  found.detail,
    selectedAt: new Date().toISOString(),
  };

  console.log(`[완료] 오늘의 주제: "${found.keyword}"`);
  console.log('=== 1단계 프로세스 완료 ===\n');
  return output;
}

module.exports = { getDailyTopic, determineCategory };
