/**
 * blog-utils.ts
 * 블로그 포스트 본문 파싱 공통 유틸리티
 *
 * BlogPostContent.tsx 와 blog/[slug]/page.tsx 에서 공통으로 사용하는
 * 마크다운 파싱 함수들을 단일 모듈로 통합하여 중복을 제거합니다.
 */

import GithubSlugger from 'github-slugger';

// ─── 섹션 패턴 ───────────────────────────────────────────────────────────────
export const KEY_POINT_PATTERNS   = /(?:핵심\s*요약|key\s*point)/i;
export const CHECKLIST_PATTERNS   = /(?:자가진단|체크리스트|1분\s*체크|체크)/i;
export const FAQ_PATTERNS         = /(?:faq|자주\s*묻는)/i;
export const CTA_PATTERNS         = /(?:카카오톡|call\s*to\s*action|상담\s*신청)/i;

// ─── 핵심 요약 추출 ──────────────────────────────────────────────────────────
export function extractKeyPoints(content: string): string[] {
  const lines = content.split('\n');
  const points: string[] = [];
  let inSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^##\s+/.test(trimmed) && KEY_POINT_PATTERNS.test(trimmed)) {
      inSection = true;
      continue;
    }
    if (inSection) {
      if (/^#{1,2}\s/.test(trimmed)) break;
      if (/\[SEO_SUMMARY\]/.test(trimmed)) break;
      if (/^---/.test(trimmed)) continue;
      if (/^[-*]\s+/.test(trimmed) || /^[🛡️💡✅☑️⭐]/.test(trimmed)) {
        const text = trimmed
          .replace(/^[-*]\s*/, '')
          .replace(/^[🛡️💡✅☑️⭐]+\s*/, '')
          .trim();
        if (text) points.push(text);
      }
    }
  }
  return points.slice(0, 3);
}

// ─── FAQ 추출 ────────────────────────────────────────────────────────────────
export function extractFAQ(content: string): { q: string; a: string }[] {
  const lines = content.split('\n');
  const faqs: { q: string; a: string }[] = [];
  let inSection = false;
  let currentQ = '';
  let currentA = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^##\s+/.test(trimmed) && FAQ_PATTERNS.test(trimmed)) {
      inSection = true;
      continue;
    }
    if (inSection) {
      if (/^##\s+/.test(trimmed)) break;
      if (/\[SEO_SUMMARY\]/.test(trimmed)) break;

      if (/^#+\s*/.test(trimmed)) {
        if (currentQ) faqs.push({ q: currentQ, a: currentA.trim() });
        // Q번호 앞뒤의 **·*·이모지·공백 어떤 조합도 제거
        currentQ = trimmed
          .replace(/^(?:#+\s*)+/, '')
          .replace(/^[*_💬✅☑️🛡️⭐\s]*Q\d+[*_]*\s*[:.-]?\s*/i, '')
          .trim();
        currentA = '';
      } else if (currentQ) {
        if (trimmed === '---') continue;
        currentA += line + '\n';
      }
    }
  }
  if (currentQ) faqs.push({ q: currentQ, a: currentA.trim() });
  return faqs;
}


// ─── 목차(TOC) 추출 ──────────────────────────────────────────────────────────
export function extractTOC(content: string): { id: string; text: string }[] {
  const lines = content.split('\n');
  const slugger = new GithubSlugger();
  const toc: { id: string; text: string }[] = [];
  
  let inCodeBlock = false;
  
  for (const line of lines) {
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = line.match(/^##\s+(.+)$/);
    if (match) {
      let rawText = match[1].trim();
      
      // 제외할 목차 필터링
      if (
        KEY_POINT_PATTERNS.test(rawText) ||
        CHECKLIST_PATTERNS.test(rawText) ||
        FAQ_PATTERNS.test(rawText) ||
        CTA_PATTERNS.test(rawText)
      ) {
        continue;
      }

      const plainTextForSlug = rawText.replace(/\*\*(.*?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
      const id = slugger.slug(plainTextForSlug);
      
      let text = rawText
        .replace(/^\d+\.\s*/, '')
        .replace(/\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\[\s*\]/g, '')
        .trim();
        
      if (text) {
        toc.push({ id, text });
      }
    }
  }
  
  return toc;
}

// ─── 본문 전처리 ─────────────────────────────────────────────────────────────
export function preprocessBody(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let skipType: 'NONE' | 'KEY_POINTS' | 'CHECKLIST' | 'FAQ' | 'CTA' = 'NONE';
  let clBuffer: string[] = [];

  const singleLinkRegex = /^\s*\[([^\]]+)\]\(([^)]+)\)\s*$/;

  const flushChecklist = () => {
    if (clBuffer.length > 0) {
      result.push(`<inlinechecklist data="${encodeURIComponent(clBuffer.join('||'))}"></inlinechecklist>`);
      clBuffer = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // 단독 줄 마크다운 링크 → 커스텀 추천 칼럼 카드로 치환
    const singleLinkMatch = trimmed.match(singleLinkRegex);
    if (singleLinkMatch) {
      const text = singleLinkMatch[1].trim();
      const href = singleLinkMatch[2].trim();
      result.push(`<calloutlink href="${href}" text="${text}"></calloutlink>`);
      continue;
    }

    if (/^##\s+/.test(trimmed)) {
      const prevSkipType = skipType;
      let newSkipType: 'NONE' | 'KEY_POINTS' | 'CHECKLIST' | 'FAQ' | 'CTA' = skipType;
      let matched = false;

      if      (KEY_POINT_PATTERNS.test(trimmed))  { newSkipType = 'KEY_POINTS'; matched = true; }
      else if (CHECKLIST_PATTERNS.test(trimmed))  { newSkipType = 'CHECKLIST';  clBuffer = []; matched = true; }
      else if (FAQ_PATTERNS.test(trimmed))         { newSkipType = 'FAQ';        matched = true; }
      else if (CTA_PATTERNS.test(trimmed))         { newSkipType = 'CTA';        matched = true; }

      if (matched) {
        if (prevSkipType === 'CHECKLIST') flushChecklist();
        skipType = newSkipType;
        continue;
      }
    }

    if (skipType === 'KEY_POINTS') {
      if (trimmed !== '' && !/^[-*]/.test(trimmed) && !/^#/.test(trimmed)) skipType = 'NONE';
      else if (/^#/.test(trimmed)) skipType = 'NONE';
    } else if (skipType === 'CHECKLIST') {
      if (/^#{1,6}\s/.test(trimmed)) {
        flushChecklist();
        skipType = 'NONE';
      } else if (/^[-*]\s+/.test(trimmed) || /^[\u2611\u2705\uFE0F[\]]/.test(trimmed)) {
        const text = trimmed
          .replace(/^[-*]\s*/, '')
          .replace(/^\[[ x]\]\s*/i, '')
          .replace(/^[\u2611\u2705\uFE0F]+\s*/gu, '')
          .trim();
        if (text) clBuffer.push(text);
        continue;
      } else {
        continue;
      }
    } else if (skipType === 'FAQ' || skipType === 'CTA') {
      if (/^#{1,2}\s/.test(trimmed)) skipType = 'NONE';
    }

    if (skipType === 'NONE') {
      result.push(line);
    }
  }

  flushChecklist();

  const processed = result
    .join('\n')
    .replace(/\[BLOCKS?-\d+[^\]]*\]/gi, '')
    .replace(/<calculator\s+type="([^"]+)"\s*\/>/g, '<calculator type="$1"></calculator>')
    .replace(/\[SEO_SUMMARY\]\s*:\s*.*/gi, '')
    .replace(/\[[^\]]*(?:카카오|상담)[^\]]*\]\([^)]*\)/g, '')
    .trim();

  return processed.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
}
