/**
 * post-builder.js
 * 블로그/판례 자동글쓰기 공용 유틸리티 및 파일 IO 모듈
 * (중복 코드 제거 및 콤팩트 빌드 목적)
 */

'use strict';
const fs = require('fs');
const path = require('path');

// ── 공통 환경변수 로드 (.env.local) ─────────────────────────────────────────
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)?\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = (m[2] ?? '').replace(/(^['"]|['"]$)/g, '').trim();
    }
  });
}

const POSTS_DIR = path.join(process.cwd(), 'src/content/posts');

// ── 유틸리티 ────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function yamlSafe(str) {
  return String(str).replace(/"/g, "'").replace(/\n/g, ' ').trim();
}

// ── 공통 비즈니스 로직 ──────────────────────────────────────────────────────
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

function parseGeneratedContent(rawOutput) {
  // 1. [ANALYSIS_START] ... [ANALYSIS_END] 블록 제거
  let cleanOutput = rawOutput;
  if (cleanOutput.includes('[ANALYSIS_START]')) {
    cleanOutput = cleanOutput.replace(/\[ANALYSIS_START\][\s\S]*?\[ANALYSIS_END\]/, '').trim();
  }

  // 2. SEO_META 파싱
  const lines = cleanOutput.split('\n');
  let summary = '';
  let contentStart = 0;

  if (lines[0] && lines[0].startsWith('SEO_META:')) {
    summary = yamlSafe(lines[0].replace('SEO_META:', '').trim());
    contentStart = 1;
    while (contentStart < lines.length && lines[contentStart].trim() === '') contentStart++;
  }

  // 본문 추출 및 불필요한 [BLOCK-X] 치환표 제거
  let content = lines.slice(contentStart).join('\n').replace(/\[BLOCK-\d+:[^\]]*\]/gi, '').trim();

  // 요약이 없을 경우 본문 발췌
  if (!summary) {
    summary = content.replace(/[#*`>[\]!]/g, '').replace(/\s+/g, ' ').trim().slice(0, 140);
  }

  // SEO 괄호 제거 필터링
  summary = summary.replace(/^\[(.*)\]$/, '$1').trim();
  
  if (summary.length > 158) summary = summary.slice(0, 155) + '...';

  // 글로벌 정제 필터링 (품질 검사 통과 보장)
  content = content.replace(/<calculator type=".*?" \/>/gi, '');
  content = content.replace(/\[이미지 제안:.*?\]/g, '');
  content = content.replace(/\[관련 글 추천\]/g, '');

  // ── 제목 내 # 문자 제거 (## # Q: → ### Q:, ## # 텍스트 → ### 텍스트) ──
  // FAQ: ## # Q : → ### Q :
  content = content.replace(/^## #\s+Q\s*:/gm, '### Q :');
  // 그 외 ## # 패턴 → ###
  content = content.replace(/^## #\s+/gm, '### ');
  // 이중 ## 패턴 제거: ## ## → ##
  content = content.replace(/^## ## /gm, '## ');

  // ── [추천 제목 2개] ~ 파일 끝 블록 자동 삭제 ──────────────────────────
  const summaryMarkerIdx = content.indexOf('[추천 제목 2개]');
  if (summaryMarkerIdx >= 0) {
    let trimEnd = summaryMarkerIdx;
    // 앞에 있는 --- 구분선과 빈줄도 같이 제거
    const beforeMarker = content.substring(0, summaryMarkerIdx).trimEnd();
    content = beforeMarker.endsWith('---')
      ? beforeMarker.slice(0, -3).trimEnd()
      : beforeMarker;
  }

  // ── H2/H3 제목의 콜론 띄어쓰기 정규화 ────────────────────────────────
  // "## 제목:내용" → "## 제목 : 내용" (앞뒤 공백 없는 경우)
  content = content.replace(/^(#{1,3}\s[^`\n]*?)(?<!\s):(?!\s)(?!\/\/)/gm, '$1 : ');
  content = content.replace(/^(#{1,3}\s[^`\n]*?)(?<!\s):\s+(?!\/\/)/gm, '$1 : ');

  // H2 콜론 띄어쓰기 교정 (기존 코드는 삭제하고 위로 통합)

  // CTA 텍스트 자연스러운 교정
  content = content.replace(/<blue>보상스쿨에 문의하세요<\/blue>를 통해/g, '전문가의 조력을 통해');
  content = content.replace(/<blue>보상스쿨에 문의하세요<\/blue>는/g, '전문가와의 상담은');
  content = content.replace(/<blue>보상스쿨에 문의하세요<\/blue>와 같은/g, '보상스쿨과 같은');
  content = content.replace(/언제든 <blue>보상스쿨에 문의하세요<\/blue>\./g, '언제든 전문가와 상의하십시오.');
  content = content.replace(/<blue>보상스쿨에 문의하세요\.<\/blue>/g, '전문가와 상의하십시오.');
  content = content.replace(/<blue>보상스쿨에 문의하세요<\/blue>\./g, '전문가와 상의하십시오.');
  content = content.replace(/\*\s*<blue>보상스쿨에 문의하세요<\/blue>\s*:/g, '* 전문가와의 상담 :');
  content = content.replace(/언제든 보상스쿨에 문의하세요\./g, '언제든 전문가와 상의하십시오.');
  content = content.replace(/보상스쿨의 전문 상담 채널을 통해 현재 상황을 진단받아 보시기 바랍니다\.\s*전문가와 상의하십시오\./g, '보상스쿨의 전문 상담 채널을 통해 현재 상황을 진단받아 보시기 바랍니다.');

  content = content.replace(/\n\s*\n\s*\n/g, '\n\n').trim();

  return { summary, content };
}

function saveMarkdownPost(topic, summary, content, additionalFrontmatter = {}) {
  const uniqueSlug = resolveUniqueSlug(topic.slug);
  const kstDate = new Date(Date.now() + 9 * 3600 * 1000).toISOString().split('T')[0];
  const tagsStr = topic.tags.map(t => `"${yamlSafe(t)}"`).join(', ');

  // Frontmatter 동적 조립
  let fm = `---
title: "${yamlSafe(topic.title)}"
slug: "${uniqueSlug}"
date: "${kstDate}"
updatedAt: "${kstDate}"
summary: "${summary}"
category: "${yamlSafe(topic.category)}"
regionCategory: ""
specialtyCategory: "${yamlSafe(topic.specialtyCategory)}"
tags: [${tagsStr}]
`;

  // 추가 Frontmatter 필드 (예: caseNumber 등)
  for (const [k, v] of Object.entries(additionalFrontmatter)) {
    if (v) fm += `${k}: "${yamlSafe(v)}"\n`;
  }
  fm += `published: true\n---\n\n${content}\n`;

  const filePath = path.join(POSTS_DIR, `${uniqueSlug}.md`);
  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });
  fs.writeFileSync(filePath, fm, 'utf8');

  return { filePath, slug: uniqueSlug };
}

module.exports = {
  POSTS_DIR,
  sleep,
  yamlSafe,
  getExistingPosts,
  resolveUniqueSlug,
  parseGeneratedContent,
  saveMarkdownPost
};
