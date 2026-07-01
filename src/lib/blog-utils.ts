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

// ─── 단일 통합 파서 (Single-pass Parser) ───────────────────────────────────
export interface ParsedBlogPost {
  keyPoints: string[];
  checklistItems: string[];
  faqItems: { q: string; a: string }[];
  toc: { id: string; text: string }[];
  sections: string[];
}

export function parseBlogPost(content: string): ParsedBlogPost {
  const lines = content.split('\n');
  const slugger = new GithubSlugger();
  
  const result: ParsedBlogPost = {
    keyPoints: [],
    checklistItems: [],
    faqItems: [],
    toc: [],
    sections: [],
  };

  let currentSectionType: 'NONE' | 'KEY_POINTS' | 'CHECKLIST' | 'FAQ' | 'CTA' = 'NONE';
  let currentSectionLines: string[] = [];
  let currentQ = '';
  let currentA = '';
  let inCodeBlock = false;

  const pushCurrentSection = () => {
    if (currentSectionLines.length > 0) {
      const secStr = currentSectionLines.join('\n').trim();
      if (secStr) result.sections.push(secStr);
      currentSectionLines = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    
    // code block check for TOC
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      if (currentSectionType === 'NONE') {
        currentSectionLines.push(line);
      }
      continue;
    }

    // 1. Heading Detection
    const headingMatch = trimmed.match(/^##\s+(.+)$/);
    if (headingMatch && !inCodeBlock) {
      const rawText = headingMatch[1].trim();
      
      let isSpecial = false;
      if (KEY_POINT_PATTERNS.test(rawText)) {
        currentSectionType = 'KEY_POINTS';
        isSpecial = true;
      } else if (CHECKLIST_PATTERNS.test(rawText)) {
        currentSectionType = 'CHECKLIST';
        isSpecial = true;
      } else if (FAQ_PATTERNS.test(rawText)) {
        if (currentQ) {
          result.faqItems.push({ q: currentQ, a: currentA.trim() });
          currentQ = ''; currentA = '';
        }
        currentSectionType = 'FAQ';
        isSpecial = true;
      } else if (CTA_PATTERNS.test(rawText)) {
        currentSectionType = 'CTA';
        isSpecial = true;
      }

      if (isSpecial) continue;

      currentSectionType = 'NONE';
      
      const id = slugger.slug(rawText.replace(/\*\*(.*?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim());
      const text = rawText
        .replace(/^\d+\.\s*/, '')
        .replace(/\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\[\s*\]/g, '')
        .trim();
        
      if (text) {
        result.toc.push({ id, text });
      }

      // 1번 섹션과 오프닝 텍스트(현재까지 모인 라인들)를 하나로 합침
      if (result.sections.length === 0 && currentSectionLines.length > 0) {
        currentSectionLines.push('\n' + line);
      } else {
        pushCurrentSection();
        currentSectionLines.push(line);
      }
      continue;
    }

    // 2. Process Line based on currentSectionType
    // Stop early triggers
    if (/^#{1,6}\s/.test(trimmed) && currentSectionType !== 'NONE') {
      if (currentSectionType === 'FAQ' && /^#+\s*/.test(trimmed)) {
        if (currentQ) result.faqItems.push({ q: currentQ, a: currentA.trim() });
        currentQ = trimmed.replace(/^(?:#+\s*)+/, '').replace(/^[*_💬✅☑️🛡️⭐\s]*Q\d+[*_]*\s*[:.-]?\s*/i, '').trim();
        currentA = '';
        continue;
      } else if (currentSectionType !== 'FAQ') {
         currentSectionType = 'NONE';
      }
    }
    
    if (/\[SEO_SUMMARY\]/.test(trimmed)) {
      currentSectionType = 'NONE';
      continue;
    }

    if (currentSectionType === 'KEY_POINTS') {
      if (/^---/.test(trimmed)) continue;
      if (/^[-*]\s+/.test(trimmed) || /^[🛡️💡✅☑️⭐]/.test(trimmed)) {
        const text = trimmed.replace(/^[-*]\s*/, '').replace(/^[🛡️💡✅☑️⭐]+\s*/, '').trim();
        if (text && result.keyPoints.length < 3) result.keyPoints.push(text);
      }
    } else if (currentSectionType === 'CHECKLIST') {
      if (/^---/.test(trimmed)) continue;
      if (/^[-*]\s+/.test(trimmed) || /^[\u2611\u2705\uFE0F[\]]/.test(trimmed)) {
        const text = trimmed.replace(/^[-*]\s*/, '').replace(/^\[[ x]\]\s*/i, '').replace(/^[\u2611\u2705\uFE0F]+\s*/gu, '').trim();
        if (text) result.checklistItems.push(text);
      }
    } else if (currentSectionType === 'FAQ') {
      if (currentQ) {
        if (trimmed !== '---') currentA += line + '\n';
      }
    } else if (currentSectionType === 'CTA') {
      // skip
    } else if (currentSectionType === 'NONE') {
      let processedLine = line;
      const singleLinkMatch = trimmed.match(/^\s*\[([^\]]+)\]\(([^)]+)\)\s*$/);
      if (singleLinkMatch) {
        const text = singleLinkMatch[1].trim();
        const href = singleLinkMatch[2].trim();
        processedLine = `<calloutlink href="${href}" text="${text}"></calloutlink>`;
      }
      
      processedLine = processedLine
        .replace(/\[BLOCKS?-\d+[^\]]*\]/gi, '')
        .replace(/<calculator\s+type="([^"]+)"\s*\/>/g, '<calculator type="$1"></calculator>')
        .replace(/\[[^\]]*(?:카카오|상담)[^\]]*\]\([^)]*\)/g, '');

      currentSectionLines.push(processedLine);
    }
  }

  if (currentQ) {
    result.faqItems.push({ q: currentQ, a: currentA.trim() });
  }
  pushCurrentSection();

  // 파싱 완료 후, sections[0]이 헤딩(##)으로 시작하지 않고(오프닝 텍스트), sections[1]이 존재한다면 
  // "오프닝 & 1번 섹션 문단"을 하나로 묶기 위해 병합합니다.
  if (result.sections.length > 1 && !result.sections[0].trim().startsWith('##')) {
    result.sections[0] = result.sections[0] + '\n\n' + result.sections[1];
    result.sections.splice(1, 1);
  }

  result.sections = result.sections.map(sec => sec.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>'));

  return result;
}
