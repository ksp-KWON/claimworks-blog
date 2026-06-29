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
  getPrecedentRole, 
  getPrecedentObjective, 
  getPrecedentMetaFirstLine, 
  getPrecedentPlanningPrompt, 
  getPrecedentSkeleton
} = require('../src/lib/prompt-rules.js');

const {
  sleep,
  getExistingPosts,
  parseGeneratedContent,
  saveMarkdownPost
} = require('../src/lib/post-builder.js');

// ── 토픽 정보 구조화용 스키마 ──────────────────────────────────────────────
const TOPIC_SCHEMA = {
  type: 'OBJECT',
  properties: {
    slug: { type: 'STRING', description: '영문 소문자 URL 슬러그' },
    title: { type: 'STRING', description: 'SEO 최적화 제목' },
    category: { type: 'STRING', description: '무조건 "판례·법률 해석"' },
    specialtyCategory: { type: 'STRING', description: '전문 진료과목' },
    tags: { type: 'ARRAY', items: { type: 'STRING' }, description: '태그 5개' },
    keywords: { type: 'STRING', description: '타겟 키워드 목록' },
    calculatorType: { type: 'STRING', description: 'auto 또는 medical' }
  },
  required: ['slug', 'title', 'category', 'specialtyCategory', 'tags', 'keywords', 'calculatorType'],
};

// ── 본문 프롬프트 빌더 ──────────────────────────────────────────────────────
function buildWritingPrompt(detail, topic, angle, existingPosts) {
  const postsCtx = existingPosts.length > 0
    ? existingPosts.map(p => `- [${p.title}](/blog/${p.slug})`).join('\n')
    : '- (없음)';

  const calcTag = topic.calculatorType === 'medical'
    ? '<calculator type="medical" />'
    : '<calculator type="auto" />';

  return `${getPrecedentRole()}

${getPrecedentObjective()}

# ⚖️ 공통 글쓰기 헌법 규칙 (STRICT WRITING RULES)
${STRICT_RULES}

[원본 판례 정보]
* 사건번호: ${detail.caseNo} (${detail.courtName} ${detail.judgmentDate} 선고)
* 사건명: ${detail.caseName}
* 판결요지: 
${detail.judgmentSummary}
${detail.caseContent.slice(0, 3000)} (본문 일부)

[기획안]
* 제목: ${topic.title}
* 카테고리: ${topic.category}
* 핵심 키워드: ${topic.keywords}

${getPrecedentMetaFirstLine()}

${getPrecedentSkeleton(detail, angle, calcTag, postsCtx)}

위 뼈대와 규칙을 바탕으로 상세하게 본문을 작성해 주세요.`;
}

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

  // 3. 본문 생성
  console.log('[3] 판례 분석 칼럼 작성 중...');
  const rawOutput = await callGemini(buildWritingPrompt(detail, topic, currentAngle, existingPosts));

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
