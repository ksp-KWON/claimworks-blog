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

// ── 도메인 일반 범용어 및 불용어 정의 ──────────────────────────────────────
const DOMAIN_COMMON_WORDS = new Set([
  // 보험/손해사정 일반어
  '보험', '보험금', '보험사', '손해배상', '손해사정', '보상', '보상금', '진단비', '수술비', '입원비', '치료비', '합의금', '위자료', '일실수입', '간병비', '휴차료', '면책금', '자기부담금', '실손', '실손보험', '실비', '실비보험', '생명보험', '화재보험', '자동차보험', '운전자보험', '산재보험', '근재보험', '배상책임', '일상생활배상책임', '일배책',
  // 법률/청구/분쟁 일반어
  '약관', '특약', '청구', '지급', '부지급', '삭감', '거절', '면책', '해지', '무효', '취소', '소송', '판례', '판례로', '대법원', '대법원판례', '하급심', '금감원', '분쟁', '분조위', '분조례', '결정례', '분쟁조정', '결정', '조정', '합의', '과실', '과실비율', '인과관계', '입증', '소명', '손해', '피해', '피해자', '가해자', '피보험자', '계약자', '수익자', '채무부존재', '구상금', '구상권', '판결', '승소', '패소', '실무', '손사', '손해사정사',
  // 의료/진료 및 일반 상태어
  '진료', '진단', '수술', '치료', '시술', '검사', '입원', '통원', '병원', '의원', '대학병원', '의사', '주치의', '의료진', '간호사', '의무기록', '진단서', '소견서', '조직검사', '판독지', '기왕증', '합병증', '부작용', '후유증', '의료사고', '의료과실', '장해', '후유장해', '장애', '한시장해', '영구장해', '맥브라이드', '노동능력상실률', '비급여', '급여', '질병', '상해', '사고', '손상', '골절', '파열', '염증', '출혈', '괴사', '절제', '이식', '마비', '통증', '질환', '상태', '증상', '발생', '발병',
  // 블로그 수식어/불용어/접미사
  '이것', '저것', '그것', '모르면', '알면', '받는', '방법', '전략', '가이드', '포인트', '핵심', '주의사항', '대응', '대응법', '해결책', '사례', '총정리', '완벽', '정리', '필독', '확인', '이유', '어떻게', '알아보기', '주의', '비교', '대비', '필수', '체크', '노하우', '청구법', '하는법', '받는법', '팁', '경우', '대한', '위한', '통해', '대해', '어떤', '모든', '실제', '바로', '진짜', '당일', '첫날', '내원', '기준', '분류', '단계', '선임', '상담', '비결', '돌파', '해결', '성공', '주의점', '입증법', '대처법', '해결법', '방어법', '환수법', '청구방법', '대응방법', '기반', '보상청구'
]);



const ENGLISH_STOPWORDS = new Set([
  'to', 'of', 'in', 'on', 'at', 'for', 'is', 'it', 'the', 'and', 'with', 'by', 'as', 'from', 'an', 'or'
]);

function extractKeywordsFromText(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .replace(/[^가-힣a-zA-Z0-9]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim().toLowerCase())
    .filter(w => {
      if (w.length < 2) return false;
      if (DOMAIN_COMMON_WORDS.has(w)) return false;
      if (ENGLISH_STOPWORDS.has(w)) return false;
      // 순수 영문인 경우 3글자 이상
      if (/^[a-z0-9]+$/i.test(w) && w.length < 3) return false;
      return true;
    });
}

/**
 * 최근 30일 이내의 전역 포스트 및 카테고리 컨텍스트 통합 로드
 */
function getRecent30DaysContext(targetCategory = null) {
  const existingPosts = getExistingPosts();
  const now = Date.now();
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

  // 1. 최근 30일 이내 포스트 필터링 (최소 40개 안전 보장)
  const globalPosts = existingPosts.filter((p, index) => {
    if (!p.date) return index < 40;
    const postTime = new Date(p.date).getTime();
    if (isNaN(postTime)) return index < 40;
    return (now - postTime) <= THIRTY_DAYS_MS || index < 40;
  });

  // 2. 전역 금지 키워드/엔티티 집합 구축
  const forbiddenKeywords = new Set();
  globalPosts.forEach(p => {
    extractKeywordsFromText(p.title).forEach(w => forbiddenKeywords.add(w));
    if (Array.isArray(p.tags)) {
      p.tags.forEach(t => {
        extractKeywordsFromText(String(t)).forEach(w => forbiddenKeywords.add(w));
      });
    }
  });

  // 3. AI 프롬프트용 텍스트 포맷팅
  const globalRecentTitlesStr = globalPosts
    .slice(0, 50)
    .map((p, idx) => `${idx + 1}. [${p.category || '일반'}] ${p.title}`)
    .join('\n');

  // 4. 해당 카테고리 전용 최근 글 (맥락 제공용)
  let categoryPosts = globalPosts;
  if (targetCategory && targetCategory !== '판례·분쟁조정' && targetCategory !== '판례·법률 해석') {
    categoryPosts = existingPosts.filter(p => {
      const cat = String(p.category || '');
      return cat.includes(targetCategory) || targetCategory.includes(cat);
    });
  }
  const categoryTitlesStr = categoryPosts
    .slice(0, 20)
    .map((p, idx) => `${idx + 1}. ${p.title}`)
    .join('\n');

  return {
    globalPosts,
    categoryPosts,
    forbiddenKeywords,
    globalRecentTitlesStr: globalRecentTitlesStr || '최근 발행 글 없음',
    categoryTitlesStr: categoryTitlesStr || '최근 카테고리 글 없음',
    total30DaysCount: globalPosts.length
  };
}

/**
 * 단일 공통 중복 검증기 (Strict Deduplicator)
 */
function isDuplicateTopic(keyword, forbiddenKeywords) {
  if (!keyword || typeof keyword !== 'string') return true;
  const kw = keyword.toLowerCase().trim();
  if (kw.length < 2) return true;
  if (DOMAIN_COMMON_WORDS.has(kw)) return false;

  if (forbiddenKeywords.has(kw)) return true;

  const tokens = extractKeywordsFromText(kw);
  for (const token of tokens) {
    if (forbiddenKeywords.has(token)) return true;
  }

  for (const forbidden of forbiddenKeywords) {
    if (forbidden.length >= 2 && !DOMAIN_COMMON_WORDS.has(forbidden)) {
      if (kw === forbidden) return true;
      if (kw.includes(forbidden) || forbidden.includes(kw)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 2단계 기획안 가드레일 (Strict Topic Plan Verification)
 */
function verifyTopicPlan(topic, forbiddenKeywords) {
  if (!topic) return { isDuplicate: true, reason: '기획안이 비어 있습니다.' };

  const checkTargets = [
    { type: '제목', val: topic.title },
    ...(Array.isArray(topic.tags) ? topic.tags.map(t => ({ type: '태그', val: t })) : []),
    ...(Array.isArray(topic.keywords) ? topic.keywords.map(k => ({ type: '키워드', val: k })) : [])
  ];

  for (const target of checkTargets) {
    if (!target.val) continue;
    const tokens = extractKeywordsFromText(target.val);
    for (const token of tokens) {
      if (forbiddenKeywords.has(token)) {
        return {
          isDuplicate: true,
          matchedKeyword: token,
          reason: `기획안의 ${target.type}("${target.val}")에 최근 30일 이내 다룬 핵심 키워드("${token}")가 포함되어 있습니다.`
        };
      }
    }

    for (const forbidden of forbiddenKeywords) {
      if (forbidden.length >= 2 && !DOMAIN_COMMON_WORDS.has(forbidden)) {
        const valLower = String(target.val).toLowerCase();
        if (valLower.includes(forbidden)) {
          return {
            isDuplicate: true,
            matchedKeyword: forbidden,
            reason: `기획안의 ${target.type}("${target.val}")에 최근 30일 이내 다룬 핵심 키워드("${forbidden}")가 포함되어 있습니다.`
          };
        }
      }
    }
  }

  return { isDuplicate: false };
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
  getRecent30DaysContext,
  extractKeywordsFromText,
  isDuplicateTopic,
  verifyTopicPlan,
  resolveUniqueSlug,
  saveMarkdownPost,
  DOMAIN_COMMON_WORDS
};


