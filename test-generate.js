/**
 * test-generate.js
 * 개발 환경 로컬 글쓰기 테스트 스크립트
 * — gemini-helper.js (자동 탐색) 사용으로 통일
 */

'use strict';

const { STRICT_RULES, getBlogRole, getBlogMetaFirstLine, getBlogSkeleton, getBlogFrontmatter, getRandomAngle } = require('./src/lib/prompt-rules.js');
const { callGemini } = require('./scripts/gemini-helper.js');
const fs   = require('fs');
const path = require('path');

// .env.local 로드 (pipeline-utils 와 동일 방식)
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)?\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = (m[2] ?? '').replace(/(^['"]|['"]$)/g, '').trim();
    }
  });
}

if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY not found in .env.local!');
  process.exit(1);
}

async function generate(topic, type) {
  const angle       = getRandomAngle();
  const currentDate = new Date().toISOString().split('T')[0];
  const prompt = `
${getBlogRole()}
# Objective
주제: ${topic}
이 주제로 ${type === 'legal' ? '최신 판례 해설 및 법률' : '최신 보상 트렌드'} 전문 칼럼을 작성하세요.
반드시 아래의 STRICT WRITING RULES를 100% 철저히 준수해야 합니다.

# 🚨 STRICT WRITING RULES
${STRICT_RULES}

${getBlogFrontmatter(topic, currentDate)}
${getBlogMetaFirstLine()}
${getBlogSkeleton(angle, '<calculator type="auto" />', '- (없음)')}
  `;

  console.log(`Requesting [${type}] post — 모델 자동 탐색 중...`);
  return callGemini(prompt);
}

async function main() {
  try {
    console.log('=== Generating Legal Post ===');
    const legalText = await generate('음주운전 뺑소니 사고 피해자의 정부보장사업 및 무보험차상해 완벽 보상 실무', 'legal');
    fs.writeFileSync('./src/content/posts/test-legal-post.md', legalText);
    console.log('Saved → test-legal-post.md\n');

    console.log('=== Generating Trend Post ===');
    const trendText = await generate('2026년 하반기 실손의료비 청구 간소화 도입에 따른 소비자 선임권 보호 전략', 'trend');
    fs.writeFileSync('./src/content/posts/test-trend-post.md', trendText);
    console.log('Saved → test-trend-post.md\n');

    console.log('All done!');
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

main();
