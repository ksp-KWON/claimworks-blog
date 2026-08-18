/**
 * select-daily-topic.js
 * 오늘의 블로그 주제 및 판례 확정 스크립트
 *
 * [핵심 강화] 최근 30개 발행 글 기반 엄격한 중복 방지(Deduplication) 엔진 탑재
 *   1. 카테고리별 최근 30개 글의 주제/태그/핵심명사 추출 및 금지 목록(Blacklist) 생성
 *   2. 구글 뉴스 RSS 후보 중 최근 30개 주제와 중복되는 키워드(도수치료, 백내장, 자율주행 등) 자동 스킵
 *   3. 중복되지 않는 참신한 미개척 쟁점 키워드 우선 채택
 *   4. 판례 탐색 및 3중 안전장치 연계
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

// ── [핵심] 카테고리별 최근 30개 글 추출 및 중복 방지 블랙리스트 생성 ─────────
function getRecentCategoryContext(targetCategory, limit = 30) {
  const existingPosts = getExistingPosts();
  
  // 1. 해당 카테고리 글 필터링 (최신순 정렬)
  const categoryPosts = existingPosts
    .filter(p => {
      if (targetCategory === '판례·법률 해석') return true;
      const cat = String(p.category || '');
      return cat.includes(targetCategory) || targetCategory.includes(cat);
    })
    .slice(0, limit);

  // 2. 최근 30개 글의 제목 목록
  const recentTitlesStr = categoryPosts.map((p, idx) => `${idx + 1}. ${p.title}`).join('\n');

  // 3. 중복 검사용 핵심 단어(금지 키워드) 집합
  const forbiddenKeywords = new Set();
  categoryPosts.forEach(p => {
    // 제목에서 2글자 이상 명사 단어 추출
    const titleWords = p.title.replace(/[^가-힣a-zA-Z0-9]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
    titleWords.forEach(w => forbiddenKeywords.add(w.toLowerCase()));

    // 태그 등록
    if (Array.isArray(p.tags)) {
      p.tags.forEach(t => forbiddenKeywords.add(String(t).toLowerCase()));
    }
  });

  return {
    recentTitlesStr: recentTitlesStr || '최근 발행 글 없음',
    forbiddenKeywords,
    recentCount: categoryPosts.length
  };
}

// ── XML 파서 ─────────────────────────────────────────────────────────────
const xmlParser = new XMLParser({ ignoreAttributes: false, parseTagValue: false });

// ── [0단계] 트렌드 키워드 동적 창작 ──────────────────────────────────────
async function generateTrendySearchKeywords(targetCategory, recentTitlesStr) {
  console.log(`[0/5] AI가 [${targetCategory}] 최근 30개 글을 분석하여 미개척 검색 키워드 창작 중...`);
  
  const categoryContext = targetCategory === '판례·법률 해석' 
    ? '전체 보상/보험/손해사정 분야' 
    : `[${targetCategory}] 관련 분야`;

  const prompt = getQueryGenerationPrompt(categoryContext, recentTitlesStr);

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

// ── [2단계] Gemini AI → 손해사정 실무 키워드 추출 ───────────────────────
async function extractInsuranceKeywords(headlines, targetCategory, recentTitlesStr) {
  console.log('[2/5] Gemini AI로 뉴스 헤드라인에서 실무 키워드 추출 중...');

  const prompt = getKeywordExtractionPrompt(targetCategory, recentTitlesStr, headlines);

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
async function getGenericLegalKeywords(targetCategory, rankedCandidates, recentTitlesStr) {
  console.log(`[2.5/5] AI 분석 — [${targetCategory}] 상위 법률 용어 도출 중...`);
  
  const context = rankedCandidates ? rankedCandidates.slice(0, 5).map(c => c.searchKeyword).join(', ') : '';
  const prompt = getFallbackLegalKeywordPrompt(targetCategory, context, recentTitlesStr);

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
    return [{ searchKeyword: '보험계약' }, { searchKeyword: '손해배상' }];
  }
}

// ── [3단계] 법제처 API 판례 탐색 ─────────────────────────────────────────
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
      // 검색 실패 시 다음 후보로
    }
  }

  return null;
}

// ── [2.8단계] AI로 3차 백업 키워드 추출 ───────────────────────────────────
async function getFallbackAiKeyword(fallbackCategory, recentTitlesStr) {
  console.log(`[2.8/5] 3차 안전장치 — [${fallbackCategory}] 맞춤형 AI 실무 키워드 도출 중...`);
  
  const prompt = `당신은 대한민국 최고의 손해사정 블로그 수석 편집장입니다.
지금 판례 검색을 위한 마지막 안전장치로, **[${fallbackCategory}]** 카테고리에서 가장 빈번하게 발생하는 구체적인 보험금 분쟁 또는 손해배상 사건의 핵심 단어(명사)를 생성해야 합니다.

[최근 발행 글 제외 목록]
${recentTitlesStr}

[중요] 위 목록에 있는 주제(도수치료, 백내장, 자율주행, 캠핑장 등)는 절대 생성하지 마십시오.
문장형태나 너무 긴 복합어를 쓰지 말고, 반드시 짧고 핵심적인 법률/의학 명사(예: "일실수익", "장해진단", "면책약관", "체외충격파", "치아보철")로만 추출하세요.`;

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

// ── [2.9단계] 100% 새로운 미개척 실무 주제 단독 생성 (비판례 트렌드용 최종 안전장치) ──
async function generateNovelCategoryTopic(targetCategory, recentTitlesStr) {
  console.log(`  [신규 주제 발굴] [${targetCategory}] 최근 30개 글과 완전히 다른 새로운 실무 분쟁 주제 생성 중...`);
  
  const prompt = `당신은 대한민국 최고의 손해사정 전문 블로그 수석 편집장입니다.
**[${targetCategory}]** 카테고리에서 최근 아래의 주제들이 이미 발행되었습니다:

[최근 30개 발행 글 (절대 중복 금지!)]
${recentTitlesStr}

[지시사항]
1. 위 목록에 이미 등장한 흔한 주제(예: 도수치료, 백내장, 자율주행, 캠핑장 배상 등)는 절대 다루지 마십시오.
2. **[${targetCategory}]** 분야에서 실제 손해사정사에게 가장 상담 문의가 폭주하지만 아직 블로그에 다루지 않은 '완전히 새로운 실무 분쟁 주제' 1개를 발굴하십시오.
   - 예시: 체외충격파 실손 횟수 분쟁, 갑상선암 림프절 전이 일반암 청구, 치아보험 임플란트 치조골이식, 뇌경색 열공성 뇌경색 코드 분쟁, 전동 킥보드 일배책 분쟁, 스키장 슬로프 충돌 사고, 감정노동자 적응장애 산재, 급성심근경색증 사망보험금 기왕증 방어 등.

반드시 아래 JSON 형식으로 반환하세요:
{"thoughtProcess": "새로운 주제 선정 이유 및 수임 관점 논리 (Chain-of-Thought)", "keyword": "완전히 새로운 핵심 키워드", "newsTitle": "최신 실무 분쟁 이슈 제목"}`;

  const schema = {
    type: 'OBJECT',
    properties: {
      thoughtProcess: { type: 'STRING', description: '선정 논리' },
      keyword: { type: 'STRING', description: '새로운 핵심 키워드' },
      newsTitle: { type: 'STRING', description: '실무 분쟁 이슈 제목' }
    },
    required: ['thoughtProcess', 'keyword', 'newsTitle']
  };

  try {
    const res = await callGemini(prompt, schema, 'flash');
    console.log(`    🧠 [신규 주제 AI 사고 과정]: ${res.thoughtProcess}`);
    console.log(`    ✨ 선정된 새로운 미개척 주제: "${res.keyword}" (${res.newsTitle})`);
    return {
      keyword: res.keyword,
      newsTitle: res.newsTitle,
      detail: null
    };
  } catch (err) {
    console.warn('    ⚠️ 신규 주제 생성 실패:', err.message);
    return {
      keyword: `${targetCategory} 세부 분쟁 실무 전략`,
      newsTitle: '손해사정 핵심 실무 쟁점',
      detail: null
    };
  }
}

// ── 메인 함수 ─────────────────────────────────────────────────────────────
async function getDailyTopic(inputCategory) {
  let targetCategory = inputCategory || determineCategory();
  console.log(`=== 1단계: [${targetCategory}] 주제 및 판례 데이터 연쇄 탐색 시작 ===`);

  const existingPosts = getExistingPosts();
  const usedCaseNumbers = new Set(existingPosts.map(p => p.caseNumber).filter(Boolean));
  
  // [핵심] 해당 카테고리의 최근 30개 글 기반 블랙리스트 & 제목 목록 로드
  const { recentTitlesStr, forbiddenKeywords, recentCount } = getRecentCategoryContext(targetCategory, 30);
  console.log(`  [분석] [${targetCategory}] 최근 발행 글 ${recentCount}개 로드 완료 (중복 방지 엔진 가동)`);

  // 1. 구글 뉴스 RSS 수집
  const aiQueries = await generateTrendySearchKeywords(targetCategory, recentTitlesStr);
  const headlines = await fetchTrendingNews(aiQueries);

  // 2. AI 키워드 추출 (최근 30개 글과 중복 배제)
  const rankedCandidates = await extractInsuranceKeywords(headlines, targetCategory, recentTitlesStr);

  let found = null;

  if (targetCategory === '판례·법률 해석') {
    // 3. 1차 탐색망 (트렌드 기반 판례 검색)
    console.log('[3/4] 1차 탐색망: 트렌드 키워드 기반 법제처 판례 탐색 중...');
    found = await findPrecedent(rankedCandidates, usedCaseNumbers);

    // 4. 2차 탐색망 (AI 상위 법률 용어)
    if (!found) {
      console.log('[3/4] ⚠️ 1차 탐색 실패. 2차 탐색망(상위 법률 용어) 가동...');
      const genericKeywords = await getGenericLegalKeywords(targetCategory, rankedCandidates, recentTitlesStr);
      found = await findPrecedent(genericKeywords, usedCaseNumbers);
    }

    // 5. 3차 탐색망 (카테고리 순환 검색)
    if (!found) {
      console.log('[3/4] ⚠️ 2차 탐색 실패. 3차 탐색망(카테고리 순환 검색) 가동...');
      const fallbackKeywords = await getFallbackAiKeyword(targetCategory, recentTitlesStr);
      found = await findPrecedent(fallbackKeywords.map(k => ({ searchKeyword: k, newsTitle: '' })), usedCaseNumbers);
    }

    if (!found) {
      console.warn('⚠️ 3중 탐색망 모두 실패 — 적절한 판례를 찾지 못했습니다. 일반 포스트(보상가이드)로 전환합니다.');
      targetCategory = '보상가이드';
      found = await generateNovelCategoryTopic('보상가이드', recentTitlesStr);
    }
  } else {
    // [핵심] 일반 트렌드 카테고리: 최근 30개 글과 중복되지 않는 후보 필터링
    console.log(`[3/4] 일반 트렌드 카테고리: 최근 30개 글과 중복 여부 정밀 검증 중...`);
    
    if (rankedCandidates && rankedCandidates.length > 0) {
      for (const cand of rankedCandidates) {
        const kw = cand.searchKeyword.toLowerCase().trim();
        // 금지 단어 포함 여부 검사
        const isForbidden = forbiddenKeywords.has(kw) || 
                            Array.from(forbiddenKeywords).some(fb => kw.includes(fb) || fb.includes(kw));
        
        if (!isForbidden) {
          console.log(`    ✅ 중복되지 않는 참신한 키워드 채택: "${cand.searchKeyword}"`);
          found = {
            keyword: cand.searchKeyword,
            newsTitle: cand.newsTitle,
            detail: null
          };
          break;
        } else {
          console.log(`    ⏩ 최근 발행 글과 중복되어 스킵: "${cand.searchKeyword}"`);
        }
      }
    }

    // 모든 뉴스 후보가 중복되었거나 후보가 없을 경우 → AI 신규 주제 직접 발굴 엔진 가동
    if (!found) {
      console.log(`    ⚠️ 뉴스 후보 전원 중복. [신규 주제 발굴 엔진]을 즉시 가동합니다...`);
      found = await generateNovelCategoryTopic(targetCategory, recentTitlesStr);
    }
  }

  const output = {
    category:   targetCategory,
    keyword:    found.keyword,
    source:     found.newsTitle ? 'trend' : 'ai-novel',
    trendTitle: found.newsTitle,
    precedent:  found.detail,
    selectedAt: new Date().toISOString(),
  };

  console.log(`[완료] 오늘의 확정 주제: "${found.keyword}" (${found.trendTitle || '미개척 실무 주제'})`);
  console.log('=== 1단계 프로세스 완료 ===\n');
  return output;
}

module.exports = { getDailyTopic, determineCategory };
