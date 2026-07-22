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
  const args = process.argv.slice(2);
  const typeIndex = args.indexOf('--type');
  if (typeIndex === -1 || !args[typeIndex + 1]) {
    throw new Error('사용법: node scripts/generate-post.js --type <trend|precedent>');
  }
  const postType = args[typeIndex + 1];
  const isPrecedent = postType === 'precedent';

  console.log(`=== 자동글쓰기 (${isPrecedent ? '판례' : '트렌드'} 블로그) 시작 (${new Date().toISOString()}) ===`);

  if (isPrecedent) {
    console.log('  [쿨다운] API 과부하 방지를 위해 65초간 대기합니다...');
    await sleep(65000);
  }

  // 1. Topic 로드
  const topicJsonPath = path.join(process.cwd(), 'scripts/daily-topic.json');
  if (!fs.existsSync(topicJsonPath)) {
    throw new Error('daily-topic.json 파일이 존재하지 않습니다.');
  }
  const dailyTopic = JSON.parse(fs.readFileSync(topicJsonPath, 'utf8'));
  
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
    ? getPrecedentPlanningPrompt(dailyTopic.precedent, existingSlugsStr)
    : getTopicPlanningPrompt(dailyTopic.keyword, dailyTopic.trendTitle || '없음', existingSlugsStr);

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
  const isPrecedent = process.argv.includes('precedent');
  console.error(`\n[⚠️ 자동글쓰기 빌드 경고] 외부 API 통신 실패로 인한 종료: ${err.message}`);
  process.exit(isPrecedent ? 0 : 1);
});
