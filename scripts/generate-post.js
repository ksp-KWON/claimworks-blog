/**
 * generate-post.js
 * 보상스쿨 자동글쓰기 통합 스크립트 (트렌드 / 판례)
 * (데드코드 제거 및 단일 파이프라인으로 최적화됨)
 */

'use strict';
const fs = require('fs');
const path = require('path');

const { callGemini } = require('./gemini-helper');
const { 
  getRandomAngle,
  getTopicPlanningPrompt,
  getPrecedentPlanningPrompt,
  TOPIC_SCHEMA,
  buildArticlePrompt
} = require('../src/lib/prompt-rules.js');

const {
  sleep,
  getExistingPosts,
  parseGeneratedContent,
  saveMarkdownPost
} = require('../src/lib/post-builder.js');

async function main() {
  console.log(`=== 자동글쓰기 통합 컴포넌트 시작 (${new Date().toISOString()}) ===`);

  // 1. Topic 로드
  const topicJsonPath = path.join(process.cwd(), 'scripts/daily-topic.json');
  if (!fs.existsSync(topicJsonPath)) {
    throw new Error('daily-topic.json 파일이 존재하지 않습니다.');
  }
  const dailyTopic = JSON.parse(fs.readFileSync(topicJsonPath, 'utf8'));

  // 단일 파이프라인 판단: 카테고리가 '판례'인 경우에만 예외 로직 활성화
  const isPrecedent = dailyTopic.category === '판례·법률 해석';

  if (isPrecedent) {
    console.log('  [예외 처리] 판례 API 과부하 방지를 위해 65초간 대기합니다...');
    await sleep(65000);
  }
  
  if (isPrecedent) {
    console.log(`  [로드] 확정 판례: ${dailyTopic.precedent.caseNo} (${dailyTopic.precedent.caseName})`);
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

  const topic = await callGemini(planPrompt, TOPIC_SCHEMA);
  console.log(`    기획 완료 : ${topic.title} (${topic.slug})`);

  if (!isPrecedent) {
    console.log('  [대기] 10초 쿨다운...');
    await sleep(10000);
  }

  // 3. 본문 생성 (Gemini)
  console.log('[3] 블로그 본문 칼럼 작성 중...');
  const rawOutput = isPrecedent
    ? await callGemini(buildArticlePrompt(topic, currentAngle, existingPosts, dailyTopic.precedent))
    : await callGemini(buildArticlePrompt(topic, currentAngle, existingPosts));

  // 4. 파싱 및 저장
  const { summary, content } = parseGeneratedContent(rawOutput);
  console.log(`[4] 파싱 완료 (${content.length}자) | SEO : ${summary.slice(0, 30)}...`);

  const additionalFm = isPrecedent ? { caseNumber: dailyTopic.precedent.caseNo } : {};
  const saved = saveMarkdownPost(topic, summary, content, additionalFm);
  
  console.log(`[5] 저장 완료 : ${saved.filePath}`);
  console.log('=== 자동글쓰기 종료 ===');
}

main().catch(err => {
  console.error(`\n[⚠️ 자동글쓰기 빌드 경고] 통신 실패로 인한 종료: ${err.message}`);
  // 트렌드는 에러 시 실패 처리(1), 판례는 우아한 종료(0)
  try {
    const dailyTopic = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts/daily-topic.json'), 'utf8'));
    process.exit(dailyTopic.category === '판례·법률 해석' ? 0 : 1);
  } catch {
    process.exit(1);
  }
});
