/**
 * generate-post.js
 * 보상스쿨 자동글쓰기 통합 스크립트 (트렌드 / 판례)
 * (데드코드 제거 및 단일 파이프라인으로 최적화됨)
 */

'use strict';
const fs = require('fs');
const path = require('path');

const { callGemini } = require('./gemini-helper');
const { getDailyTopic } = require('./select-daily-topic');
const { 
  getRandomAngle,
  getTopicPlanningPrompt,
  getPrecedentPlanningPrompt,
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


async function generateSinglePost() {
  console.log(`=== 자동글쓰기 통합 컴포넌트 시작 (${new Date().toISOString()}) ===`);

  // 1. Topic 로드 (직접 모듈 호출로 통합)
  const postTypeEnv = process.env.POST_TYPE || 'all';
  const targetCategory = postTypeEnv === 'all' ? null : postTypeEnv;
  const dailyTopic = await getDailyTopic(targetCategory);

  // 단일 파이프라인 판단: 카테고리가 '판례'인 경우에만 예외 로직 활성화
  const isPrecedent = dailyTopic.category === '판례·법률 해석';

  if (isPrecedent) {
    console.log(`  [로드] 확정 판례: ${dailyTopic.precedent.caseNo} (${dailyTopic.precedent.caseName})`);
    console.log('  [대기] 법제처 API 과부하 방지를 위해 15초 대기합니다...');
    await sleep(15000);
  } else {
    console.log(`  [로드] 확정 키워드: '${dailyTopic.keyword}'`);
  }

  const existingPosts = getExistingPosts();
  const context30Days = getRecent30DaysContext(dailyTopic.category);
  const currentAngle = getRandomAngle();
  console.log(`  [설정] 오늘의 글쓰기 관점(Angle): ${currentAngle.name}`);

  // 2. 기획안 생성 및 2차 가드레일 검증 루프 (Gemini)
  console.log('[2] 기획안 생성 및 전역 30일 가드레일 검증 중...');
  const existingSlugsStr = existingPosts.map(p => p.slug).join(', ');
  
  let topic = null;
  const MAX_PLAN_RETRIES = 3;
  let planFeedback = '';

  for (let planAttempt = 1; planAttempt <= MAX_PLAN_RETRIES; planAttempt++) {
    const planPrompt = isPrecedent 
      ? getPrecedentPlanningPrompt(dailyTopic.precedent, existingSlugsStr, dailyTopic.category, planFeedback)
      : getTopicPlanningPrompt(dailyTopic.keyword, dailyTopic.trendTitle || '없음', existingSlugsStr, dailyTopic.category, planFeedback);

    const candidateTopic = await callGemini(planPrompt, TOPIC_SCHEMA, 'flash');

    // 💡 [핵심] 기획안 제목 및 태그 2차 가드레일 엄격 검증
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
      // 3차 시도까지 걸린 경우라도 candidateTopic을 사용하되 제목에 고유성 부여
      topic = candidateTopic;
      console.warn('    ⚠️ 최대 재시도 도달: 현 기획안을 안전 채택합니다.');
    }
  }

  if (!isPrecedent) {
    console.log('  [대기] 10초 쿨다운...');
    await sleep(10000);
  }


  // 3. 본문 생성 (Gemini JSON Mode)
  console.log('[3] 블로그 본문 칼럼 작성 중...');
  const articlePrompt = isPrecedent
    ? buildArticlePrompt(topic, currentAngle, existingPosts, dailyTopic.precedent)
    : buildArticlePrompt(topic, currentAngle, existingPosts);
    
  const contentResult = await callGemini(articlePrompt, CONTENT_SCHEMA, 'flash');
  console.log(`    🧠 [본문 집필 사고 과정] : \n${contentResult.thoughtProcess}`);

  // 4. 파싱 및 저장 (이제 정규식 처리 없이 JSON에서 직접 추출)
  const content = contentResult.markdownContent || contentResult.content;
  if (!content) {
    throw new Error('본문 내용(markdownContent)이 비어 있습니다.');
  }
  console.log(`[4] 파싱 완료 (${content.length}자) | 기획: ${topic.title}`);

  const additionalFm = isPrecedent ? { caseNumber: dailyTopic.precedent.caseNo } : {};
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
      console.log('🔄 15초 대기 후 전체 파이프라인을 초기화하고 다시 시작합니다...');
      await sleep(15000);
    }
  }
}

main();
