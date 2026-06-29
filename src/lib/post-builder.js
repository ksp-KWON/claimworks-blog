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
  if (summary.length > 158) summary = summary.slice(0, 155) + '...';

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
