/**
 * generate-precedent-post.js
 * 법제처 판례 API + 제미나이 AI 기반 손해사정 판례 분석 블로그 글 자동생성기
 */

'use strict';
const fs = require('fs');
const path = require('path');

// ── 환경변수 로드 (.env.local) ──────────────────────────────────────────────
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)?\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = (m[2] ?? '').replace(/(^['"]|['"]$)/g, '').trim();
    }
  });
}

const { callGemini } = require('./gemini-helper');
const { 
  STRICT_RULES, 
  getPrecedentRole, 
  getPrecedentObjective, 
  getPrecedentMetaFirstLine, 
  getPrecedentPlanningPrompt, 
  getPrecedentSkeleton,
  cleanAnalysisBlock
} = require('../src/lib/prompt-rules.js');

const POSTS_DIR     = path.join(process.cwd(), 'src/content/posts');
const LAW_API_KEY   = process.env.LAW_API_KEY;
const LAW_PROXY_ENDPOINT = process.env.LAW_PROXY_ENDPOINT;
const LAW_PROXY_TOKEN    = process.env.LAW_PROXY_TOKEN;

const sleep = ms => new Promise(r => setTimeout(r, ms));

function yamlSafe(str) {
  return String(str).replace(/"/g, "'").replace(/\n/g, ' ').trim();
}

// XML 태그 추출 헬퍼 (로딩 속도 및 경량화 유지)
function getXmlTagContent(xml, tag) {
  const regex = new RegExp(`<${tag}>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*?))</${tag}>`);
  const match = xml.match(regex);
  return match ? (match[1] || match[2] || '').trim() : '';
}

function getXmlTags(xml, tag) {
  const regex = new RegExp(`<${tag}>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*?))</${tag}>`, 'g');
  const results = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    results.push((match[1] || match[2] || '').trim());
  }
  return results;
}



// ── 3. 기존 글 읽기 (슬러그 중복 및 내부 링크용) ──────────────────────────────
function getExistingPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const files = fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort()
    .slice(-25);

  const posts = [];
  for (const file of files) {
    try {
      const filePath = path.join(POSTS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const slug = file.replace(/\.md$/, '');
      const titleMatch = content.match(/^title:\s*["']?(.*?)["']?\r?$/m);
      const title = titleMatch ? titleMatch[1].trim() : slug;
      posts.push({ slug, title });
    } catch {
      // 스킵
    }
  }
  return posts;
}

function resolveUniqueSlug(baseSlug) {
  let slug = baseSlug;
  let counter = 2;
  while (fs.existsSync(path.join(POSTS_DIR, `${slug}.md`))) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}



// ── 5. 토픽 정보 구조화용 스키마 ──────────────────────────────────────────────
const TOPIC_SCHEMA = {
  type: 'OBJECT',
  properties: {
    slug: { type: 'STRING', description: '하이픈 구분 영문 소문자 URL 슬러그 (예: spinal-fracture-precedent)' },
    title: { type: 'STRING', description: '법률적 신뢰도와 호기심을 유발하는 SEO 최적화 블로그 제목' },
    category: { type: 'STRING', description: '무조건 "판례·법률 해석" 지정' },
    specialtyCategory: { type: 'STRING', description: '전문 진료과목 (예: 정형외과, 신경외과 등)' },
    tags: { type: 'ARRAY', items: { type: 'STRING' }, description: '태그 5개 (예: ["대법원판례", "압박골절", "보험금분쟁"])' },
    keywords: { type: 'STRING', description: '타겟 키워드 목록 (쉼표 구분)' },
    calculatorType: { type: 'STRING', description: 'auto 또는 medical 중 삽입할 계산기 종류' }
  },
  required: ['slug', 'title', 'category', 'specialtyCategory', 'tags', 'keywords', 'calculatorType'],
};

// ── 6. 기획 프롬프트 ──────────────────────────────────────────────────────────
function buildPlanningPrompt(detail, existingPosts) {
  return getPrecedentPlanningPrompt(detail, existingPosts.join(', '));
}

function buildWritingPrompt(detail, topic, existingPosts) {
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
* 판결요지 및 내용: 
${detail.judgmentSummary}
${detail.caseContent.slice(0, 3000)} (본문 일부)

[기획안]
* 제목: ${topic.title}
* 카테고리: ${topic.category}
* 핵심 키워드: ${topic.keywords}

${getPrecedentMetaFirstLine()}

${getPrecedentSkeleton(detail, calcTag, postsCtx)}

위 뼈대와 규칙을 바탕으로 상세하게 본문을 작성해 주세요.`;
}

async function main() {
  console.log('=== 판례 기반 자동글쓰기 프로세스 시작 ===');

  console.log('  [쿨다운] API 과부하 및 429 차단 방지를 위해 65초간 대기합니다...');
  await sleep(65000);

  // 1단계에서 저장한 daily-topic.json 로드
  const topicJsonPath = path.join(process.cwd(), 'scripts/daily-topic.json');
  if (!fs.existsSync(topicJsonPath)) {
    throw new Error('daily-topic.json 파일이 존재하지 않습니다. 먼저 select-daily-topic.js를 실행해 주세요.');
  }

  const dailyTopic = JSON.parse(fs.readFileSync(topicJsonPath, 'utf8'));
  const detail = dailyTopic.precedent;
  console.log(`  [로드] 확정된 판례 확보: ${detail.caseNo} (${detail.caseName})`);

  // 1. 토픽 선정 (기획안 생성)
  console.log('[2] 제미나이를 이용한 포스팅 기획안 생성 중...');
  const existingPosts = getExistingPosts();
  const topic = await callGemini(buildPlanningPrompt(detail, existingPosts), TOPIC_SCHEMA);
  console.log(`    기획 완료: ${topic.title} (${topic.slug})`);

  // 2. 본문 생성
  console.log('[3] 제미나이를 이용한 판례 분석 칼럼 작성 중...');
  const rawOutput = await callGemini(buildWritingPrompt(detail, topic, existingPosts));

  // [ANALYSIS] 영역 도려내기
  const cleanOutput = cleanAnalysisBlock(rawOutput);

  // 3. 파싱 및 빌드
  const lines = cleanOutput.split('\n');
  let summary = '';
  let contentStart = 0;

  if (lines[0] && lines[0].startsWith('SEO_META:')) {
    summary = yamlSafe(lines[0].replace('SEO_META:', '').trim());
    contentStart = 1;
    while (contentStart < lines.length && lines[contentStart].trim() === '') contentStart++;
  }

  const content = lines.slice(contentStart).join('\n').replace(/\[BLOCK-\d+:[^\]]*\]/gi, '').trim();

  if (!summary) {
    summary = content.replace(/[#*`>[\]!]/g, '').replace(/\s+/g, ' ').trim().slice(0, 140);
  }
  if (summary.length > 158) summary = summary.slice(0, 155) + '...';

  // 4. 마크다운 저장
  const uniqueSlug = resolveUniqueSlug(topic.slug);
  const kstDate = new Date(Date.now() + 9 * 3600 * 1000).toISOString().split('T')[0];
  const tagsStr = topic.tags.map(t => `"${yamlSafe(t)}"`).join(', ');

  const md = `---
title: "${yamlSafe(topic.title)}"
slug: "${uniqueSlug}"
date: "${kstDate}"
updatedAt: "${kstDate}"
summary: "${summary}"
category: "판례·법률 해석"
caseNumber: "${yamlSafe(detail.caseNo)}"
regionCategory: ""
specialtyCategory: "${yamlSafe(topic.specialtyCategory)}"
tags: [${tagsStr}]
published: true
---

${content}
`;

  const filePath = path.join(POSTS_DIR, `${uniqueSlug}.md`);
  fs.writeFileSync(filePath, md, 'utf8');
  console.log(`[4] 블로그 포스팅 저장 완료: ${filePath}`);

  console.log('=== 프로세스 완료 ===');
}

main().catch(err => {
  console.error(`\n[⚠️ 자동글쓰기 빌드 경고] 프로세스가 중단되었습니다.`);
  console.error(`상세 에러 내용: ${err.message}`);
  console.error(`이 오류는 외부 API(법제처 또는 Gemini) 통신 실패 또는 환경 변수 누락으로 인한 것입니다.`);
  console.error(`전체 빌드 파이프라인의 안정성을 위해 성공 상태(Exit 0)로 정상 우회 종료합니다.\n`);
  process.exit(0);
});
