/**
 * post-builder.js
 * 블로그/판례 자동글쓰기 공용 유틸리티 및 파일 IO 모듈 (Zero-Regex 개편)
 */

'use strict';

const fs     = require('fs');
const path   = require('path');
const matter = require('gray-matter');

// ── 공통 유틸 (pipeline-utils.js 에서 단일 공급) ────────────────────────────
const { POSTS_DIR, sleep } = require('../../scripts/pipeline-utils.js');

// ── 공통 비즈니스 로직 ──────────────────────────────────────────────────────
function getExistingPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));

  const posts = [];
  for (const file of files) {
    try {
      const filePath = path.join(POSTS_DIR, file);
      const content  = fs.readFileSync(filePath, 'utf8');
      const slug     = file.replace(/\.md$/, '');
      const m = matter(content);
      const data = m.data || {};
      const title = data.title || slug;
      const caseNumber = data.caseNumber ? String(data.caseNumber).trim() : null;
      const category = Array.isArray(data.category) ? data.category.join(', ') : String(data.category || '');
      const tags = Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []);
      const date = String(data.date || '');
      posts.push({ slug, title, caseNumber, category, tags, date });
    } catch { /* 스킵 */ }
  }

  // 최신 발행일 기준 내림차순 정렬
  posts.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
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

  const today = new Date();
  const dateStr = today.toISOString().split('T')[0] + 'T' + 
                  String(today.getHours()).padStart(2, '0') + ':' + 
                  String(today.getMinutes()).padStart(2, '0') + ':00+09:00';

  const fmData = {
    title: topic.title,
    date: dateStr,
    summary: summary || topic.summary || '',
    category: [topic.category],
    tags: Array.isArray(topic.tags) ? topic.tags : [topic.tags],
    ...additionalFrontmatter
  };
  
  if (topic.specialtyCategory) {
    fmData.category.push(topic.specialtyCategory);
  }

  // gray-matter를 이용한 직렬화
  const fullContent = matter.stringify(content, fmData);

  const filePath = path.join(POSTS_DIR, `${uniqueSlug}.md`);
  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });
  fs.writeFileSync(filePath, fullContent, 'utf8');

  return { filePath, slug: uniqueSlug };
}

module.exports = {
  getExistingPosts,
  resolveUniqueSlug,
  saveMarkdownPost,
};
