/**
 * post-builder.js
 * 블로그/판례 자동글쓰기 공용 유틸리티 및 파일 IO 모듈
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── 공통 유틸 (pipeline-utils.js 에서 단일 공급) ────────────────────────────
const { POSTS_DIR, sleep } = require('../../scripts/pipeline-utils.js');
const { yamlSafe, parseGeneratedContent, buildMarkdownFrontmatter } = require('./content-parser');

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
      const content  = fs.readFileSync(filePath, 'utf8');
      const slug     = file.replace(/\.md$/, '');
      const titleMatch = content.match(/^title:\s*["']?(.*?)["']?\r?$/m);
      const title    = titleMatch ? titleMatch[1].trim() : slug;
      posts.push({ slug, title });
    } catch { /* 스킵 */ }
  }
  return posts;
}

function resolveUniqueSlug(baseSlug) {
  let slug    = baseSlug;
  let counter = 2;
  while (fs.existsSync(path.join(POSTS_DIR, `${slug}.md`))) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

function saveMarkdownPost(topic, summary, content, additionalFrontmatter = {}) {
  const uniqueSlug = resolveUniqueSlug(topic.slug);
  topic.slug = uniqueSlug;

  const fullContent = buildMarkdownFrontmatter(topic, summary, content, additionalFrontmatter);

  const filePath = path.join(POSTS_DIR, `${uniqueSlug}.md`);
  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });
  fs.writeFileSync(filePath, fullContent, 'utf8');

  return { filePath, slug: uniqueSlug };
}

module.exports = {
  POSTS_DIR,
  sleep,
  yamlSafe,
  getExistingPosts,
  resolveUniqueSlug,
  parseGeneratedContent,
  saveMarkdownPost,
};
