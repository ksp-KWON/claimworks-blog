/**
 * select-daily-topic.js
 * 보상스쿨 오늘의 블로그 주제 및 판례 확정 스크립트 (표준 통합 엔진)
 *
 * [핵심 아키텍처: 단일 표준 중복 방지 & 3단계 통합 파이프라인]
 *  1. 카테고리별 최근 30개 글 기반 금지 키워드(Blacklist) 및 제목 목록 추출
 *  2. 표준 3단계 파이프라인:
 *     - [1단계: 트렌드 뉴스 탐색] 구글 뉴스 RSS 수집 ➔ AI 키워드 추출 ➔ 중복 검증
 *     - [2단계: 판례 탐색] ('판례·법률 해석' 카테고리 전용) 법제처 판례 연쇄 탐색
 *     - [3단계: 미개척 쟁점 발굴] 후보군 부재/전원 중복 시 AI 단독 발굴 + 사후 중복 검증 루프
 *  3. 모든 경로에서 단일 공통 중복 검증기(isDuplicateTopic) 통과 강제
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { XMLParser } = require('fast-xml-parser');

// ── 공통 유틸 ────────────────────────────────────────────────────────────
const { POSTS_DIR, sleep, safeFetch } = require('./pipeline-utils.js');
const { callGemini } = require('./gemini-helper');
const { 
  getExistingPosts, 
  getRecent30DaysContext, 
  isDuplicateTopic 
} = require('../src/lib/post-builder.js');
const { 
  getQueryGenerationPrompt, 
  getKeywordExtractionPrompt, 
  getFallbackLegalKeywordPrompt,
  getNovelTopicPrompt
} = require('../src/lib/prompt-rules.js');

// ── 환경변수 및 상수 ───────────────────────────────────────────────────────
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

// XML 파서
const xmlParser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });

/**
 * 실행 카테고리 결정
 */
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


/**
 * [1단계-A] AI 검색 키워드 창작
 */
async function generateTrendySearchKeywords(targetCategory, recentTitlesStr) {
  console.log(`[1/3] AI가 [${targetCategory}] 최근 30개 글을 분석하여 미개척 검색 키워드 창작 중...`);
  
  const categoryContext = targetCategory === '판례·법률 해석' 
    ? '전체 보상/보험/손해사정 분야' 
    : `[${targetCategory}] 관련 분야`;

  const prompt = getQueryGenerationPrompt(categoryContext, recentTitlesStr);

  const schema = {
    type: 'OBJECT',
    properties: {
      thoughtProcess: {
        type: 'STRING',
        description: '손해사정 실무 및 수임 관점에서 트렌드를 분석하고 키워드를 도출한 연쇄 사고 논리 (Chain-of-Thought)'
      },
      queries: {
        type: 'ARRAY',
        items: { type: 'STRING' },
        description: '구글 뉴스 검색용 실무 키워드 배열'
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
    return ['보험금 지급 분쟁', '손해배상 판례', '보험 분쟁조정'];
  }
}

/**
 * [1단계-B] 구글 뉴스 RSS 헤드라인 수집
 */
async function fetchTrendingNews(queries) {
  console.log('[1/3] 구글 뉴스 RSS에서 최신 보험·손해사정 이슈 수집 중...');

  const BASE    = 'https://news.google.com/rss/search?hl=ko&gl=KR&ceid=KR:ko&q=';
  const headers = { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' };
  const headlines = [];

  for (const query of queries) {
    try {
      let res;
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

      if (!usedProxy) {
        res = await safeFetch(BASE + encodeURIComponent(query), { headers }, 10000);
      }

      if (!res.ok) continue;

      const xml = await res.text();
      const parsed = xmlParser.parse(xml);
      const items = parsed?.rss?.channel?.item ?? [];
      const itemArr = Array.isArray(items) ? items : [items];

      for (const item of itemArr.slice(0, 8)) {
        const raw = item.title ?? '';
        const clean = raw.replace(/\s*-\s*[^-]+$/, '').trim();
        if (clean.length > 5 && !headlines.includes(clean)) {
          headlines.push(clean);
        }
      }
    } catch {
      // 검색 실패 시 계속 진행
    }
  }

  console.log(`    총 ${headlines.length}개 뉴스 헤드라인 수집 완료`);
  return headlines;
}

/**
 * [1단계-C] Gemini AI로 뉴스 헤드라인에서 실무 키워드 추출
 */
async function extractInsuranceKeywords(headlines, targetCategory, recentTitlesStr) {
  if (!headlines || headlines.length === 0) return [];
  console.log('[1/3] Gemini AI로 뉴스 헤드라인에서 실무 키워드 추출 중...');

  const prompt = getKeywordExtractionPrompt(targetCategory, recentTitlesStr, headlines);

  const schema = {
    type: 'OBJECT',
    properties: {
      thoughtProcess: {
        type: 'STRING',
        description: '뉴스 헤드라인의 쟁점과 사회적 파급력을 분석한 연쇄 사고 논리 (Chain-of-Thought)'
      },
      candidates: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            newsTitle:     { type: 'STRING', description: '원본 뉴스 헤드라인' },
            searchKeyword: { type: 'STRING', description: '법제처 API 검색 및 주제용 실무 키워드' },
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
    return result.candidates || [];
  } catch (err) {
    console.warn('❌ Gemini AI 키워드 추출 실패:', err.message);
    return [];
  }
}

/**
 * [2단계] 법제처 API 판례 탐색 (판례 카테고리 전용)
 */
async function findPrecedent(candidates, usedCaseNumbers) {
  if (!candidates || candidates.length === 0) return null;

  for (const { searchKeyword, newsTitle } of candidates) {
    console.log(`    [판례 검색] 키워드: "${searchKeyword}"`);

    try {
      const searchUrl = LAW_PROXY_ENDPOINT 
        ? `${LAW_PROXY_ENDPOINT.trim()}/api/law/search?query=${encodeURIComponent(searchKeyword)}`
        : `https://www.law.go.kr/DRF/lawSearch.do?OC=${LAW_API_KEY}&target=prec&type=XML&query=${encodeURIComponent(searchKeyword)}&display=10`;

      const headers = {};
      if (LAW_PROXY_ENDPOINT && LAW_PROXY_TOKEN) {
        headers['X-Proxy-Token'] = LAW_PROXY_TOKEN.trim();
      }

      const res = await safeFetch(searchUrl, { headers }, 10000);
      if (!res.ok) continue;

      const xml = await res.text();
      const parsed = xmlParser.parse(xml);
      const precList = parsed?.PrecSearch?.prec ?? [];
      const items = Array.isArray(precList) ? precList : [precList];

      for (const item of items) {
        if (!item || !item['판례일련번호']) continue;
        const caseNo = item['사건번호'];
        if (usedCaseNumbers.has(caseNo)) continue;

        const precSeq = item['판례일련번호'];
        const detailUrl = LAW_PROXY_ENDPOINT
          ? `${LAW_PROXY_ENDPOINT.trim()}/api/law/detail?precSeq=${precSeq}`
          : `https://www.law.go.kr/DRF/lawService.do?OC=${LAW_API_KEY}&target=prec&type=XML&ID=${precSeq}`;

        const detailRes = await safeFetch(detailUrl, { headers }, 10000);
        if (!detailRes.ok) continue;

        const detailXml = await detailRes.text();
        const detailParsed = xmlParser.parse(detailXml);
        const precDetail = detailParsed?.PrecService;

        if (precDetail && precDetail['판시사항'] && precDetail['판결요지']) {
          console.log(`      ✅ 판례 확정: ${caseNo} (${precDetail['사건명'] || ''})`);
          return {
            keyword: searchKeyword,
            newsTitle: newsTitle || '',
            detail: {
              precSeq,
              caseNo,
              caseName: precDetail['사건명'] || '',
              courtName: precDetail['법원명'] || '',
              judgmentDate: precDetail['선고일자'] || '',
              judgmentSummary: precDetail['판결요지'] || '',
              caseContent: precDetail['판례내용'] || ''
            }
          };
        }
      }
    } catch {
      // 다음 후보로 진행
    }
  }

  return null;
}

/**
 * [3단계] 100% 새로운 미개척 실무 주제 발굴 엔진 (사후 중복 검증 루프 장착)
 */
async function generateNovelTopicWithRetry(targetCategory, recentTitlesStr, forbiddenKeywords, maxRetries = 3) {
  console.log(`[3/3] [${targetCategory}] 최근 30개 글과 100% 중복 없는 미개척 실무 분쟁 주제 발굴 엔진 가동...`);

  const schema = {
    type: 'OBJECT',
    properties: {
      thoughtProcess: { type: 'STRING', description: '새로운 주제 선정 이유 및 수임 관점 논리 (Chain-of-Thought)' },
      keyword: { type: 'STRING', description: '완전히 새로운 핵심 키워드' },
      newsTitle: { type: 'STRING', description: '실무 분쟁 이슈 제목' }
    },
    required: ['thoughtProcess', 'keyword', 'newsTitle']
  };

  let lastRejected = '';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const prompt = getNovelTopicPrompt(targetCategory, recentTitlesStr, lastRejected);
    try {
      const res = await callGemini(prompt, schema, 'flash');
      const candidateKeyword = (res.keyword || '').trim();

      // 엄격한 중복 검증
      if (!isDuplicateTopic(candidateKeyword, forbiddenKeywords)) {
        console.log(`    🧠 [신규 주제 AI 사고 과정]: ${res.thoughtProcess}`);
        console.log(`    ✨ 검증 통과 미개척 주제 채택 (${attempt}차 시도): "${candidateKeyword}" (${res.newsTitle})`);
        return {
          keyword: candidateKeyword,
          newsTitle: res.newsTitle,
          detail: null
        };
      }

      console.warn(`    ⚠️ [${attempt}/${maxRetries}] 생성된 주제("${candidateKeyword}")가 최근 글과 중복 감지됨 ➔ 즉시 재생성...`);
      lastRejected = candidateKeyword;
    } catch (err) {
      console.warn(`    ⚠️ [${attempt}/${maxRetries}] AI 주제 생성 실패:`, err.message);
    }
  }

  // Fallback (시간 기반 고유성 부여)
  const timestamp = new Date().toISOString().slice(5, 10);
  return {
    keyword: `${targetCategory} 권익 구제 가이드`,
    newsTitle: `${targetCategory} 손해사정 핵심 쟁점 (${timestamp})`,
    detail: null
  };
}

/**
 * 메인 주제 결정 파이프라인 (표준 3단계 일원화 & 전역 30일 중복 방지)
 */
async function getDailyTopic(inputCategory) {
  let targetCategory = inputCategory || determineCategory();
  console.log(`=== 1단계: [${targetCategory}] 주제 및 판례 데이터 연쇄 탐색 시작 ===`);

  const existingPosts = getExistingPosts();
  const usedCaseNumbers = new Set(existingPosts.map(p => p.caseNumber).filter(Boolean));
  
  // 1. 최근 30일 전역 컨텍스트 및 블랙리스트 로드
  let context30Days = getRecent30DaysContext(targetCategory);
  console.log(`  [분석] 최근 30일 발행 글 ${context30Days.total30DaysCount}개 로드 완료 (전역 중복 방지 엔진 가동)`);

  let found = null;

  if (targetCategory === '판례·법률 해석') {
    // 2-A. 판례 카테고리: 트렌드 뉴스 수집 ➔ 판례 탐색망
    const aiQueries = await generateTrendySearchKeywords(targetCategory, context30Days.globalRecentTitlesStr);
    const headlines = await fetchTrendingNews(aiQueries);
    const rankedCandidates = await extractInsuranceKeywords(headlines, targetCategory, context30Days.globalRecentTitlesStr);

    console.log('[2/3] 트렌드 키워드 기반 법제처 판례 탐색 중...');
    found = await findPrecedent(rankedCandidates, usedCaseNumbers);

    // 판례 탐색 2차 안전장치 (상위 법률 용어)
    if (!found) {
      console.log('[2/3] ⚠️ 1차 탐색 실패. 2차 안전망(상위 법률 용어) 가동...');
      const fallbackPrompt = getFallbackLegalKeywordPrompt(targetCategory, rankedCandidates.slice(0, 3).map(c => c.searchKeyword).join(', '), context30Days.globalRecentTitlesStr);
      try {
        const schema = {
          type: 'OBJECT',
          properties: {
            thoughtProcess: { type: 'STRING' },
            candidates: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: { searchKeyword: { type: 'STRING' } },
                required: ['searchKeyword']
              }
            }
          },
          required: ['thoughtProcess', 'candidates']
        };
        const legalRes = await callGemini(fallbackPrompt, schema, 'lite');
        found = await findPrecedent(legalRes.candidates || [], usedCaseNumbers);
      } catch { /* 스킵 */ }
    }

    // 판례 미발견 시: '보상가이드' 카테고리로 안전 전환 및 컨텍스트 즉시 갱신
    if (!found) {
      console.warn('⚠️ 판례 탐색 실패 — 일반 포스트(보상가이드)로 안전 전환합니다.');
      targetCategory = '보상가이드';
      context30Days = getRecent30DaysContext(targetCategory);
      found = await generateNovelTopicWithRetry(targetCategory, context30Days.globalRecentTitlesStr, context30Days.forbiddenKeywords);
    }
  } else {
    // 2-B. 일반 트렌드 카테고리: 뉴스 수집 ➔ 실무 키워드 추출 ➔ 전역 30일 중복 검증
    const aiQueries = await generateTrendySearchKeywords(targetCategory, context30Days.globalRecentTitlesStr);
    const headlines = await fetchTrendingNews(aiQueries);
    const rankedCandidates = await extractInsuranceKeywords(headlines, targetCategory, context30Days.globalRecentTitlesStr);

    console.log(`[2/3] 일반 트렌드 카테고리: 최근 30일 전역 글과 중복 여부 정밀 검증 중...`);
    if (rankedCandidates && rankedCandidates.length > 0) {
      for (const cand of rankedCandidates) {
        if (!isDuplicateTopic(cand.searchKeyword, context30Days.forbiddenKeywords)) {
          console.log(`    ✅ 중복되지 않는 참신한 뉴스 키워드 채택: "${cand.searchKeyword}"`);
          found = {
            keyword: cand.searchKeyword,
            newsTitle: cand.newsTitle,
            detail: null
          };
          break;
        } else {
          console.log(`    ⏩ 최근 30일 글과 중복되어 스킵: "${cand.searchKeyword}"`);
        }
      }
    }

    // 뉴스 후보가 전원 중복되었거나 없을 경우: 3단계 AI 단독 발굴 엔진 실행
    if (!found) {
      console.log(`    ⚠️ 뉴스 후보 전원 중복/부재. [3단계 미개척 주제 발굴 엔진] 가동...`);
      found = await generateNovelTopicWithRetry(targetCategory, context30Days.globalRecentTitlesStr, context30Days.forbiddenKeywords);
    }
  }

  const output = {
    category:   targetCategory,
    keyword:    found.keyword,
    source:     found.detail ? 'precedent' : (found.newsTitle ? 'trend' : 'ai-novel'),
    trendTitle: found.newsTitle,
    precedent:  found.detail,
    selectedAt: new Date().toISOString(),
  };

  console.log(`[완료] 오늘의 확정 주제: "${found.keyword}" (${found.trendTitle || '미개척 실무 주제'})`);
  console.log('=== 1단계 프로세스 완료 ===\n');
  return output;
}

module.exports = { 
  getDailyTopic, 
  determineCategory 
};

