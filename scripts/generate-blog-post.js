/**
 * generate-blog-post.js
 * 보상스쿨 블로그 자동글쓰기 스크립트 v6
 *
 * v5 → v6 핵심 변경사항:
 *   [FIX-1] buildPrompt 전면 재설계 : 규칙 나열형 → 스켈레톤(뼈대) 강제 출력 방식
 *           AI에게 "어디에 넣어라"는 설명 대신 번호 달린 출력 뼈대를 직접 제공해
 *           저자 박스 위치·계산기 삽입 위치·섹션 번호·체크리스트 순서 오류 근본 해결
 *   [FIX-2] TOPIC_SCHEMA에 calculatorType 필드 추가
 *           토픽 선정 단계에서 auto/medical을 AI가 결정 → 본문 프롬프트에 직접 주입
 *           계산기 주제 부적합 오류 및 H2 제목 내 삽입 오류 근본 해결
 *   [FIX-3] 외부 링크(카카오톡 등) 금지 규칙을 스켈레톤 내 해당 블록에 명시
 *   [FIX-4] FAQ 형식 명확화 — ### Q1 : 형식 엄수 지시로 Q1Q1 이중 표기 방지
 *           (page.tsx BlogPostContent 렌더러 코드 수정도 병행 필요)
 */

'use strict';
const fs   = require('fs');
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
  getBlogRole, 
  getBlogObjective, 
  getBlogMetaFirstLine, 
  getTopicPlanningPrompt, 
  getBlogSkeleton 
} = require('../src/lib/prompt-rules.js');

const POSTS_DIR = path.join(process.cwd(), 'src/content/posts');

// ── 유틸 ────────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function yamlSafe(str) {
  return String(str).replace(/"/g, "'").replace(/\n/g, ' ').trim();
}



// ── 기존 포스트 목록 ────────────────────────────────────────────────────────
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

// ── 슬러그 중복 방지 ────────────────────────────────────────────────────────
function resolveUniqueSlug(baseSlug) {
  let slug = baseSlug;
  let counter = 2;
  while (fs.existsSync(path.join(POSTS_DIR, `${slug}.md`))) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}



// ── 토픽 선정 스키마 ────────────────────────────────────────────────────────
const TOPIC_SCHEMA = {
  type: 'OBJECT',
  properties: {
    slug: {
      type: 'STRING',
      description: '하이픈 구분 영문 소문자 URL 슬러그',
    },
    title: {
      type: 'STRING',
      description: 'SEO 최적화 포스팅 제목',
    },
    category: {
      type: 'STRING',
      description: '사망·자살 보험금|질병진단·실손|교통사고 보상|배상책임·의료|근재·산재 사고|장해평가·면책|보상가이드 중 최소 1개 이상 선택하여 기재합니다. 만약 2개 이상의 카테고리에 해당한다면 쉼표(,)로 구분하여 나열해 주세요. (예: "장해평가·면책, 교통사고 보상")',
    },
    specialtyCategory: {
      type: 'STRING',
      description: '전문 진료과목 (예: 정형외과)',
    },
    tags: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: '관련 태그 5개',
    },
    keywords: {
      type: 'STRING',
      description: '타겟 키워드 목록 (쉼표 구분)',
    },
    calculatorType: {
      type: 'STRING',
      description:
        '본문에 삽입할 계산기 종류. ' +
        '교통사고·배상책임·후유장해·맥브라이드·일실수입·휴업손해·산재 관련이면 "auto", ' +
        '실손의료비·병원비·입원비·수술비 관련이면 "medical".',
    },
  },
  required: ['slug', 'title', 'category', 'specialtyCategory', 'tags', 'keywords', 'calculatorType'],
};

// ── 토픽 기획 프롬프트 ──────────────────────────────────────────────────────
function buildTopicPromptFromKeyword(keyword, trendTitle, existingPosts) {
  return getTopicPlanningPrompt(keyword, trendTitle || '없음', existingPosts.join(', '));
}

// ── 본문 프롬프트 — 스켈레톤 강제 출력 방식 ─────────────────────────────────
function buildPrompt(topic, existingPosts) {
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

${getBlogSkeleton(calcTag, postsCtx)}

위 뼈대와 규칙을 엄격히 준수하여 본문을 작성해 주세요.
`;
}

// ── 메인 실행 ───────────────────────────────────────────────────────────────
async function main() {
  console.log(`=== 자동글쓰기 시작 (${new Date().toISOString()}) ===`);
  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });

  // 1단계에서 저장한 daily-topic.json 로드
  const topicJsonPath = path.join(process.cwd(), 'scripts/daily-topic.json');
  if (!fs.existsSync(topicJsonPath)) {
    throw new Error('daily-topic.json 파일이 존재하지 않습니다. 먼저 select-daily-topic.js를 실행해 주세요.');
  }

  const dailyTopic = JSON.parse(fs.readFileSync(topicJsonPath, 'utf8'));
  console.log(`  [로드] 확정된 오늘의 키워드: '${dailyTopic.keyword}' (출처: ${dailyTopic.source})`);

  const existingPosts = getExistingPosts();

  // Step 2 : 토픽 정보 상세 기획 (AI 호출)
  console.log('[2] 제미나이를 통한 오늘의 토픽 상세 기획 생성 중...');
  const topic = await callGemini(
    buildTopicPromptFromKeyword(dailyTopic.keyword, dailyTopic.trendTitle, existingPosts),
    TOPIC_SCHEMA
  );
  console.log(`    토픽 기획 완료 : ${topic.title} (${topic.slug})`);
  console.log(`    계산기 타입 : ${topic.calculatorType}`);

  console.log('  [대기] 10초 쿨다운...');
  await sleep(10000);

  // Step 3 : 본문 생성
  console.log('[3] 제미나이를 통한 블로그 본문 칼럼 작성 중...');
  const rawOutput = await callGemini(buildPrompt(topic, existingPosts));

  // SEO_META 파싱
  const lines = rawOutput.split('\n');
  let summary = '';
  let contentStart = 0;

  if (lines[0].startsWith('SEO_META:')) {
    summary = yamlSafe(lines[0].replace('SEO_META:', '').trim());
    contentStart = 1;
    while (contentStart < lines.length && lines[contentStart].trim() === '') contentStart++;
  }

  const content = lines.slice(contentStart).join('\n').replace(/\[BLOCK-\d+:[^\]]*\]/gi, '').trim();

  if (!summary) {
    summary = content.replace(/[#*`>[\]!]/g, '').replace(/\s+/g, ' ').trim().slice(0, 140);
    console.warn('  [경고] SEO_META 파싱 실패 - 본문 앞부분으로 대체.');
  }
  if (summary.length > 158) summary = summary.slice(0, 155) + '...';

  console.log(`[4] 본문 생성 완료 (${content.length}자) | SEO : ${summary.slice(0, 30)}...`);

  // Step 4 : 저장
  const slug    = resolveUniqueSlug(topic.slug);
  const kstDate = new Date(Date.now() + 9 * 3600 * 1000).toISOString().split('T')[0];
  const tagsStr = topic.tags.map(t => `"${yamlSafe(t)}"`).join(', ');

  const md = `---
title: "${yamlSafe(topic.title)}"
slug: "${slug}"
date: "${kstDate}"
updatedAt: "${kstDate}"
summary: "${summary}"
category: "${yamlSafe(topic.category)}"
regionCategory: ""
specialtyCategory: "${yamlSafe(topic.specialtyCategory)}"
tags: [${tagsStr}]
published: true
---

${content}
`;

  const filePath = path.join(POSTS_DIR, `${slug}.md`);
  fs.writeFileSync(filePath, md, 'utf8');
  console.log(`[5] 저장 완료 : ${filePath}`);
  console.log('=== 자동글쓰기 종료 ===');
}

main().catch(err => {
  console.error(`치명적 오류 : ${err.message}`);
  process.exit(1);
});
