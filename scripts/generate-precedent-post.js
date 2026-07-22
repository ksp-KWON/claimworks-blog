/**
 * generate-precedent-post.js
 * 법제처 판례 API + 제미나이 AI 기반 손해사정 판례 분석 글 자동생성기
 * (Dynamic Angle 적용 및 파일 IO 공통 모듈화, 데드코드 전면 삭제)
 */

'use strict';
const fs = require('fs');
const path = require('path');

const { callGemini } = require('./gemini-helper');
const { 
  STRICT_RULES, 
  getRandomAngle,
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

// ── 프롬프트 빌더는 prompt-rules.js 로 공통화 됨 ──

// ── 메인 ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== 판례 기반 자동글쓰기 프로세스 시작 ===');
  console.log('  [쿨다운] API 과부하 방지를 위해 65초간 대기합니다...');
  await sleep(65000);

  // 1. Topic 로드
  const topicJsonPath = path.join(process.cwd(), 'scripts/daily-topic.json');
  if (!fs.existsSync(topicJsonPath)) throw new Error('daily-topic.json 누락');
  
  const dailyTopic = JSON.parse(fs.readFileSync(topicJsonPath, 'utf8'));
  const detail = dailyTopic.precedent;
  console.log(`  [로드] 확정 판례: ${detail.caseNo} (${detail.caseName})`);

  const existingPosts = getExistingPosts();
  const currentAngle = getRandomAngle();
  console.log(`  [설정] 오늘의 판례 해석 관점(Angle): ${currentAngle.name}`);

  // 2. 토픽 기획
  console.log('[2] 기획안 생성 중...');
  const planPrompt = getPrecedentPlanningPrompt(detail, existingPosts.map(p=>p.slug).join(', '));
  const topic = await callGemini(planPrompt, TOPIC_SCHEMA);
  console.log(`    기획 완료: ${topic.title} (${topic.slug})`);

  // 4. 본문 생성 (Gemini)
  console.log('[3] 판례 분석 본문 작성 중...');
  const rawOutput = await callGemini(buildArticlePrompt(topic, currentAngle, existingPosts, detail));

  // 4. 파싱 및 저장
  const { summary, content } = parseGeneratedContent(rawOutput);
  const additionalFm = { caseNumber: detail.caseNo };
  
  const saved = saveMarkdownPost(topic, summary, content, additionalFm);
  console.log(`[4] 블로그 포스팅 저장 완료: ${saved.filePath}`);
  console.log('=== 프로세스 완료 ===');
}

main().catch(err => {
  console.error(`\n[⚠️ 자동글쓰기 빌드 경고] 외부 API 통신 실패로 인한 종료: ${err.message}`);
  process.exit(0); // 파이프라인 안정을 위해 exit 0
});
