/**
 * generate-blog-post.js
 * 보상스쿨 블로그 자동글쓰기 스크립트 v7
 * (Dynamic Angle 적용 및 파일 IO 공통 모듈화로 초경량화)
 */

'use strict';
const fs = require('fs');
const path = require('path');

const { callGemini } = require('./gemini-helper');
const { 
  STRICT_RULES, 
  getRandomAngle,
  getBlogRole, 
  getBlogObjective, 
  getBlogMetaFirstLine, 
  getTopicPlanningPrompt, 
  getBlogSkeleton,
  TOPIC_SCHEMA,
  buildBlogPrompt
} = require('../src/lib/prompt-rules.js');

const {
  sleep,
  getExistingPosts,
  parseGeneratedContent,
  saveMarkdownPost
} = require('../src/lib/post-builder.js');

// ── 프롬프트 빌더는 prompt-rules.js 로 공통화 됨 ──
// ── 메인 실행 ───────────────────────────────────────────────────────────────
async function main() {
  console.log(`=== 자동글쓰기 (트렌드 블로그) 시작 (${new Date().toISOString()}) ===`);

  // 1. Topic 로드
  const topicJsonPath = path.join(process.cwd(), 'scripts/daily-topic.json');
  if (!fs.existsSync(topicJsonPath)) {
    throw new Error('daily-topic.json 파일이 존재하지 않습니다.');
  }
  const dailyTopic = JSON.parse(fs.readFileSync(topicJsonPath, 'utf8'));
  console.log(`  [로드] 확정 키워드: '${dailyTopic.keyword}'`);

  const existingPosts = getExistingPosts();
  
  // 2. 다이나믹 앵글 결정
  const currentAngle = getRandomAngle();
  console.log(`  [설정] 오늘의 글쓰기 관점(Angle): ${currentAngle.name}`);

  // 3. 토픽 기획 (Gemini)
  console.log('[2] 토픽 상세 기획 생성 중...');
  const topicPrompt = getTopicPlanningPrompt(dailyTopic.keyword, dailyTopic.trendTitle || '없음', existingPosts.map(p=>p.slug).join(', '));
  const topic = await callGemini(topicPrompt, TOPIC_SCHEMA);
  console.log(`    기획 완료 : ${topic.title} (${topic.slug})`);

  console.log('  [대기] 10초 쿨다운...');
  await sleep(10000);

  // 4. 본문 생성 (Gemini)
  console.log('[3] 블로그 본문 칼럼 작성 중...');
  const rawOutput = await callGemini(buildBlogPrompt(topic, currentAngle, existingPosts));

  // 5. 파싱 및 저장
  const { summary, content } = parseGeneratedContent(rawOutput);
  console.log(`[4] 파싱 완료 (${content.length}자) | SEO : ${summary.slice(0, 30)}...`);

  const saved = saveMarkdownPost(topic, summary, content);
  console.log(`[5] 저장 완료 : ${saved.filePath}`);
  console.log('=== 자동글쓰기 종료 ===');
}

main().catch(err => {
  console.error(`치명적 오류 : ${err.message}`);
  process.exit(1);
});
