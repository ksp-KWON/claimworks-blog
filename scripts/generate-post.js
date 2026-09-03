/**
 * generate-post.js
 * 보상스쿨 자동글쓰기 통합 실행 스크립트 (8대 카테고리 단일 표준 파이프라인)
 */

'use strict';

const { callGemini } = require('./gemini-helper');
const { getDailyTopic } = require('./select-daily-topic');
const { 
  getRandomAngle,
  getTopicPlanningPrompt,
  TOPIC_SCHEMA,
  CONTENT_SCHEMA,
  buildArticlePrompt
} = require('../src/lib/prompt-rules.js');

const { sleep } = require('./pipeline-utils.js');
const {
  getExistingPosts,
  getRecent30DaysContext,
  verifyTopicPlan,
  saveMarkdownPost
} = require('../src/lib/post-builder.js');

// ── [판례·분쟁조정 전용 법제처 실시간 1회 안전 검증 게이트] ──────────
async function fetchPrecedentQuick(query) {
  if (!query) return null;
  const endpoint = process.env.LAW_PROXY_ENDPOINT;
  const token = process.env.LAW_PROXY_TOKEN;
  const apiKey = process.env.LAW_API_KEY;

  let listUrl = '';
  const headers = { 'User-Agent': 'Mozilla/5.0' };

  if (endpoint) {
    listUrl = `${endpoint.trim()}/api/precedent?query=${encodeURIComponent(query)}&page=1`;
    if (token) headers['X-Proxy-Token'] = token.trim();
  } else if (apiKey) {
    listUrl = `https://www.law.go.kr/DRF/lawSearch.do?target=prec&type=XML&OC=${apiKey}&search=2&query=${encodeURIComponent(query)}`;
  } else {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(listUrl, { headers, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const xml = await res.text();
    if (xml.includes('사용자 정보 검증에 실패하였습니다') || !xml.includes('<판례일련번호>')) return null;

    const idMatch = xml.match(/<판례일련번호>([^<]+)<\/판례일련번호>/);
    const caseNoMatch = xml.match(/<사건번호>([^<]+)<\/사건번호>/);
    const caseNameMatch = xml.match(/<사건명>([^<]+)<\/사건명>/);

    if (!idMatch) return null;
    const precId = idMatch[1].trim();
    const caseNo = caseNoMatch ? caseNoMatch[1].trim() : '';
    const caseName = caseNameMatch ? caseNameMatch[1].trim() : '';

    let detailUrl = '';
    if (endpoint) {
      detailUrl = `${endpoint.trim()}/api/precedent-detail?ID=${precId}`;
    } else if (apiKey) {
      detailUrl = `https://www.law.go.kr/DRF/lawService.do?target=prec&type=XML&OC=${apiKey}&ID=${precId}`;
    }

    const detailController = new AbortController();
    const detailTimeout = setTimeout(() => detailController.abort(), 6000);
    const detailRes = await fetch(detailUrl, { headers, signal: detailController.signal });
    clearTimeout(detailTimeout);
    if (!detailRes.ok) return null;

    const detailXml = await detailRes.text();
    const summaryMatch = detailXml.match(/<판결요지>([\s\S]*?)<\/판결요지>/);
    const contentMatch = detailXml.match(/<판례내용>([\s\S]*?)<\/판례내용>/);

    const summary = summaryMatch ? summaryMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    const content = contentMatch ? contentMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    if (!summary && !content) return null;

    return {
      id: precId,
      caseNo,
      caseName,
      judgmentSummary: summary.slice(0, 1500),
      content: content.slice(0, 2000)
    };
  } catch (err) {
    console.warn('    ⚠️ 법제처 실시간 조회 예외 발생 (안전 강등 모드 유지):', err.message);
    return null;
  }
}

async function generateSinglePost() {
  console.log(`=== 자동글쓰기 통합 컴포넌트 시작 (${new Date().toISOString()}) ===`);

  // 1. Topic 로드
  const postTypeEnv = process.env.POST_TYPE || 'all';
  let targetCategory = postTypeEnv === 'all' ? null : postTypeEnv;
  if (targetCategory === '판례·법률 해석' || (targetCategory && targetCategory.includes('판례'))) {
    targetCategory = '판례·분쟁조정';
  }
  const dailyTopic = await getDailyTopic(targetCategory);

  console.log(`  [로드] 카테고리: [${dailyTopic.category}] | 확정 키워드: '${dailyTopic.keyword}' (${dailyTopic.trendTitle || '미개척 실무'})`);

  const existingPosts = getExistingPosts();
  const context30Days = getRecent30DaysContext(dailyTopic.category);
  const currentAngle = getRandomAngle();
  console.log(`  [설정] 오늘의 글쓰기 관점(Angle): ${currentAngle.name}`);

  // 2. 기획안 생성 및 전역 30일 가드레일 검증 루프
  console.log('[2] 기획안 생성 및 전역 30일 가드레일 검증 중...');
  const existingSlugsStr = existingPosts.map(p => p.slug).join(', ');
  
  let topic = null;
  const MAX_PLAN_RETRIES = 3;
  let planFeedback = '';

  for (let planAttempt = 1; planAttempt <= MAX_PLAN_RETRIES; planAttempt++) {
    const planPrompt = getTopicPlanningPrompt(dailyTopic.keyword, dailyTopic.trendTitle || '없음', existingSlugsStr, dailyTopic.category, planFeedback);
    const candidateTopic = await callGemini(planPrompt, TOPIC_SCHEMA, 'flash');

    // 기획안 제목 및 태그 2차 가드레일 검증
    const verification = verifyTopicPlan(candidateTopic, context30Days.forbiddenKeywords);
    if (!verification.isDuplicate) {
      topic = candidateTopic;
      console.log(`    🧠 [기획 사고 과정] : ${topic.thoughtProcess}`);
      console.log(`    ✅ [가드레일 통과] 기획 완료 (${planAttempt}차 시도) : ${topic.title} (${topic.slug})`);
      break;
    }

    console.warn(`    ⚠️ [${planAttempt}/${MAX_PLAN_RETRIES}차 기획안 반려] ${verification.reason}`);
    planFeedback = `[주의] 이전 기획안의 제목/태그에 최근 30일 이내 다룬 주제/엔티티("${verification.matchedKeyword}")가 포함되어 기획이 반려되었습니다. "${verification.matchedKeyword}" 대신 완전히 다른 신규 쟁점과 질환/사고로 기획안을 다시 작성하십시오.`;
    
    if (planAttempt === MAX_PLAN_RETRIES) {
      topic = candidateTopic;
      console.warn('    ⚠️ 최대 재시도 도달: 현 기획안을 안전 채택합니다.');
    }
  }

  // 3. 본문 생성 (판례 카테고리 자가 검증 풀 우선 연동)
  console.log('[3] 블로그 본문 칼럼 작성 중...');
  
  let precedentData = null;
  let markPrecedentUsed = null;

  const { getVerifiedPrecedent } = require('../src/lib/precedent-pool.js');
  const isPrecedentCategory = dailyTopic.category === '판례·분쟁조정' || dailyTopic.category.includes('판례');

  console.log(`  ⚖️ [지능형 분조위·판례 게이트] 주제("${dailyTopic.keyword}") 연관 선례 탐색 중...`);
  const poolResult = getVerifiedPrecedent(dailyTopic.keyword);

  if (poolResult && poolResult.item) {
    const p = poolResult.item;
    precedentData = {
      id: p.id,
      caseNo: p.caseNumber,
      caseName: p.caseName,
      judgmentSummary: p.summary,
      courtName: p.courtName
    };
    markPrecedentUsed = poolResult.markAsUsed;
    console.log(`    ✅ [실존 선례 주입] [${p.courtName}] ${p.caseNumber} - ${p.caseName.substring(0, 40)}`);
  } else if (isPrecedentCategory) {
    console.log(`  ℹ️ 풀 내 매칭 부재 → 법제처 실시간 1회 안전 탐색으로 폴백...`);
    precedentData = await fetchPrecedentQuick(dailyTopic.keyword);
    if (precedentData) {
      console.log(`    ✅ [실시간 확보] 법제처 판례 주입: ${precedentData.caseNo} (${precedentData.caseName})`);
    } else {
      console.log(`    ℹ️ [안전 강등] 일치 판례 부재 → 파이프라인 무중단 유지 및 사건번호 없는 원칙명 모드로 자동 강등`);
    }
  }

  const articlePrompt = buildArticlePrompt(topic, currentAngle, existingPosts, precedentData);
  const contentResult = await callGemini(articlePrompt, CONTENT_SCHEMA, 'flash');
  if (markPrecedentUsed) {
    markPrecedentUsed();
  }
  console.log(`    🧠 [본문 집필 사고 과정] : \n${contentResult.thoughtProcess}`);

  // 4. 파싱 및 저장
  const content = contentResult.markdownContent || contentResult.content;
  if (!content) {
    throw new Error('본문 내용(markdownContent)이 비어 있습니다.');
  }
  console.log(`[4] 파싱 완료 (${content.length}자) | 기획: ${topic.title}`);

  const confirmedCaseNo = precedentData?.caseNo || topic.caseNumber;
  const additionalFm = confirmedCaseNo ? { caseNumber: confirmedCaseNo } : {};
  const saved = saveMarkdownPost(topic, topic.summary, content, additionalFm);
  
  console.log(`[5] 저장 완료 : ${saved.filePath}`);
  console.log('=== 자동글쓰기 종료 ===');
}

async function main() {
  const MAX_RETRIES = 3;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await generateSinglePost();
      return; // 성공 시 즉시 종료
    } catch (err) {
      console.error(`\n[⚠️ 자동글쓰기 빌드 에러] (시도: ${attempt}/${MAX_RETRIES})`, err.stack || err.message);
      if (attempt === MAX_RETRIES) {
        console.error('❌ 최대 재시도 횟수 초과. 스크립트를 강제 종료합니다.');
        process.exit(1);
      }
      console.log('🔄 10초 대기 후 전체 파이프라인을 초기화하고 다시 시작합니다...');
      await sleep(10000);
    }
  }
}

main();
