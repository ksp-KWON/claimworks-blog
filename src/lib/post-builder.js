/**
 * post-builder.js
 * 블로그/판례 자동글쓰기 공용 유틸리티 및 파일 IO 모듈
 * (중복 코드 제거 및 콤팩트 빌드 목적)
 */

'use strict';
const fs = require('fs');
const path = require('path');
const { yamlSafe, parseGeneratedContent, buildMarkdownFrontmatter } = require('./content-parser');

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

function saveMarkdownPost(topic, summary, content, additionalFrontmatter = {}) {
  const uniqueSlug = resolveUniqueSlug(topic.slug);
  topic.slug = uniqueSlug; // override slug for buildMarkdownFrontmatter

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
  saveMarkdownPost
};
