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
  const currentAngle = getRandomAngle();
  console.log(`  [설정] 오늘의 글쓰기 관점(Angle): ${currentAngle.name}`);

  // 2. 기획안 생성 (Gemini)
  console.log('[2] 기획안 생성 중...');
  const existingSlugsStr = existingPosts.map(p => p.slug).join(', ');
  
  const planPrompt = isPrecedent 
    ? getPrecedentPlanningPrompt(dailyTopic.precedent, existingSlugsStr, dailyTopic.category)
    : getTopicPlanningPrompt(dailyTopic.keyword, dailyTopic.trendTitle || '없음', existingSlugsStr, dailyTopic.category);

  const topic = await callGemini(planPrompt, TOPIC_SCHEMA, 'flash');
  console.log(`    🧠 [기획 사고 과정] : ${topic.thoughtProcess}`);
  console.log(`    ✅ 기획 완료 : ${topic.title} (${topic.slug})`);

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
