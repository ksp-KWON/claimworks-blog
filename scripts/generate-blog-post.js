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
  getBlogSkeleton
} = require('../src/lib/prompt-rules.js');

const {
  sleep,
  getExistingPosts,
  parseGeneratedContent,
  saveMarkdownPost
} = require('../src/lib/post-builder.js');

// ── 토픽 선정 스키마 ────────────────────────────────────────────────────────
const TOPIC_SCHEMA = {
  type: 'OBJECT',
  properties: {
    slug: { type: 'STRING', description: '하이픈 구분 영문 소문자 URL 슬러그' },
    title: { type: 'STRING', description: 'SEO 최적화 포스팅 제목' },
    category: { type: 'STRING', description: '카테고리명' },
    specialtyCategory: { type: 'STRING', description: '전문 진료과목' },
    tags: { type: 'ARRAY', items: { type: 'STRING' }, description: '관련 태그 5개' },
    keywords: { type: 'STRING', description: '타겟 키워드 목록' },
    calculatorType: { type: 'STRING', description: '"auto" 또는 "medical"' },
  },
  required: ['slug', 'title', 'category', 'specialtyCategory', 'tags', 'keywords', 'calculatorType'],
};

// ── 프롬프트 빌더 ────────────────────────────────────────────────────────────
function buildPrompt(topic, angle, existingPosts) {
  const postsCtx = existingPosts.length > 0
    ? existingPosts.map(p => `- [${p.title}](/blog/${p.slug})`).join('\n')
    : '- (없음)';

  const calcTag = topic.calculatorType === 'medical'
    ? '<calculator type="medical" />'
    : '<calculator type="auto" />';

  return `${getBlogRole()}

${getBlogObjective(topic.keywords)}

# ⚖️ 공통 글쓰기 헌법 규칙 (STRICT WRITING RULES)
${STRICT_RULES}

${getBlogMetaFirstLine()}

${getBlogSkeleton(angle, calcTag, postsCtx)}

위 뼈대와 규칙을 엄격히 준수하여 본문을 작성해 주세요.
`;
}

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
  const rawOutput = await callGemini(buildPrompt(topic, currentAngle, existingPosts));

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
