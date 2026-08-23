/**
 * select-daily-topic.js
 * 보상스쿨 오늘의 블로그 주제 확정 스크립트 (8대 카테고리 단일 표준 통합 엔진)
 *
 * [핵심 아키텍처: 단일 표준 중복 방지 & 3단계 통합 파이프라인]
 *  1. 카테고리별 최근 30개 글 기반 금지 키워드(Blacklist) 및 제목 목록 추출
 *  2. 표준 3단계 파이프라인:
 *     - [1단계: 트렌드 뉴스 탐색] 구글 뉴스 RSS 수집 ➔ AI 키워드 추출 ➔ 중복 검증
 *     - [2단계: 중복 검증 및 확정] 최근 30일 다룬 주제와 겹치지 않는 신규 키워드 채택
 *     - [3단계: 미개척 쟁점 발굴] 뉴스 후보 부재/전원 중복 시 AI 단독 발굴 + 사후 중복 검증 루프
 *  3. 8개 카테고리(판례·분쟁조정 포함) 전체가 단 1개의 공통 표준 파이프라인 공유
 */

'use strict';

const { sleep, safeFetch } = require('./pipeline-utils.js');
const { callGemini } = require('./gemini-helper');
const { 
  getRecent30DaysContext, 
  isDuplicateTopic 
} = require('../src/lib/post-builder.js');
const { 
  getQueryGenerationPrompt, 
  getKeywordExtractionPrompt, 
  getNovelTopicPrompt
} = require('../src/lib/prompt-rules.js');

const TARGET_CATEGORIES = [
  '판례·분쟁조정',
  '사망·자살 보험금',
  '질병진단·실손',
  '교통사고 보상',
  '배상책임·의료',
  '근재·산재 사고',
  '장해평가·면책',
  '보상가이드'
];

/**
 * 실행 카테고리 결정
 */
function determineCategory() {
  const args = process.argv.slice(2);
  const catIdx = args.indexOf('--category');
  if (catIdx !== -1 && args[catIdx + 1]) {
    const raw = args[catIdx + 1];
    if (raw === '판례·법률 해석' || raw.includes('판례')) return '판례·분쟁조정';
    return raw;
  }
  const utcHour = new Date().getUTCHours();
  if (utcHour >= 0 && utcHour < TARGET_CATEGORIES.length) {
    return TARGET_CATEGORIES[utcHour];
  }
  return TARGET_CATEGORIES[Math.floor(Math.random() * TARGET_CATEGORIES.length)];
}

/**
 * [1단계-A] AI 검색 키워드 창작
 */
async function generateTrendySearchKeywords(targetCategory, recentTitlesStr) {
  console.log(`[1/3] AI가 [${targetCategory}] 최근 30개 글을 분석하여 미개척 검색 키워드 창작 중...`);
  
  const categoryContext = `[${targetCategory}] 관련 보상/보험/손해사정 분야`;
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
    return [`${targetCategory} 분쟁`, '보험금 지급 분쟁', '손해배상 판례'];
  }
}

/**
 * [1단계-B] 구글 뉴스 RSS 헤드라인 수집 (순수 텍스트 추출)
 */
async function fetchTrendingNews(queries) {
  console.log('[1/3] 구글 뉴스 RSS에서 최신 보험·손해사정 이슈 수집 중...');

  const BASE = 'https://news.google.com/rss/search?hl=ko&gl=KR&ceid=KR:ko&q=';
  const headers = { 
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/xml, text/xml, */*'
  };
  const headlines = [];

  for (const query of queries) {
    try {
      const res = await safeFetch(BASE + encodeURIComponent(query), { headers }, 8000);
      if (!res.ok) continue;

      const xml = await res.text();
      // 정규식 기반 경량 태그 추출 (외부 파서 의존성 제거)
      const titleMatches = xml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/g) || [];
      for (const m of titleMatches.slice(0, 8)) {
        const clean = m.replace(/<\/?title>|<!\[CDATA\[|\]\]>/g, '')
          .replace(/\s*-\s*[^-]+$/, '')
          .trim();
        if (clean.length > 5 && !clean.includes('Google 뉴스') && !headlines.includes(clean)) {
          headlines.push(clean);
        }
      }
    } catch {
      // 다음 쿼리로 계속 진행
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
            searchKeyword: { type: 'STRING', description: '블로그 주제용 실무 키워드' },
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
    keyword: `${targetCategory} 권익 구제 실무`,
    newsTitle: `${targetCategory} 손해사정 핵심 쟁점 (${timestamp})`,
  };
}

/**
 * 메인 주제 결정 파이프라인 (8대 카테고리 100% 일원화 & 전역 30일 중복 방지)
 */
async function getDailyTopic(inputCategory) {
  const targetCategory = inputCategory || determineCategory();
  console.log(`=== 1단계: [${targetCategory}] 주제 및 트렌드 데이터 탐색 시작 ===`);

  // 1. 최근 30일 전역 컨텍스트 및 블랙리스트 로드
  const context30Days = getRecent30DaysContext(targetCategory);
  console.log(`  [분석] 최근 30일 발행 글 ${context30Days.total30DaysCount}개 로드 완료 (전역 중복 방지 엔진 가동)`);

  let found = null;

  // 2. 구글 뉴스 RSS 수집 ➔ 실무 키워드 추출 ➔ 전역 30일 중복 검증
  const aiQueries = await generateTrendySearchKeywords(targetCategory, context30Days.globalRecentTitlesStr);
  const headlines = await fetchTrendingNews(aiQueries);
  const rankedCandidates = await extractInsuranceKeywords(headlines, targetCategory, context30Days.globalRecentTitlesStr);

  console.log(`[2/3] 최근 30일 전역 글과 중복 여부 정밀 검증 중...`);
  if (rankedCandidates && rankedCandidates.length > 0) {
    for (const cand of rankedCandidates) {
      if (!isDuplicateTopic(cand.searchKeyword, context30Days.forbiddenKeywords)) {
        console.log(`    ✅ 중복되지 않는 참신한 뉴스 키워드 채택: "${cand.searchKeyword}"`);
        found = {
          keyword: cand.searchKeyword,
          newsTitle: cand.newsTitle,
        };
        break;
      } else {
        console.log(`    ⏩ 최근 30일 글과 중복되어 스킵: "${cand.searchKeyword}"`);
      }
    }
  }

  // 3. 뉴스 후보가 전원 중복되었거나 없을 경우: 3단계 AI 단독 발굴 엔진 실행
  if (!found) {
    console.log(`    ⚠️ 뉴스 후보 전원 중복/부재. [3단계 미개척 주제 발굴 엔진] 가동...`);
    found = await generateNovelTopicWithRetry(targetCategory, context30Days.globalRecentTitlesStr, context30Days.forbiddenKeywords);
  }

  const output = {
    category:   targetCategory,
    keyword:    found.keyword,
    source:     found.newsTitle ? 'trend' : 'ai-novel',
    trendTitle: found.newsTitle,
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

