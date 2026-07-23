/**
 * blog-utils.ts
 * 블로그 포스트 본문 파싱 공통 유틸리티
 *
 * BlogPostContent.tsx 와 blog/[slug]/page.tsx 에서 공통으로 사용하는
 * 마크다운 파싱 함수들을 단일 모듈로 통합하여 중복을 제거합니다.
 */

import GithubSlugger from 'github-slugger';

// ─── 섹션 패턴 ───────────────────────────────────────────────────────────────
const KEY_POINT_PATTERNS = /(?:핵심\s*요약|key\s*point)/i;
const CHECKLIST_PATTERNS = /(?:자가진단|체크리스트|1분\s*체크|체크)/i;
const FAQ_PATTERNS       = /(?:faq|자주\s*묻는)/i;
const CTA_PATTERNS       = /(?:실시간 채팅|call\s*to\s*action|상담\s*신청)/i;

// ─── 단일 통합 파서 (Single-pass Parser) ───────────────────────────────────
export interface ParsedBlogPost {
  opening: string;
  keyPoints: string[];
  checklistItems: string[];
  faqItems: { q: string; a: string }[];
  toc: { id: string; text: string }[];
  sections: string[];
}

export function parseBlogPost(content: string): ParsedBlogPost {
  const lines = content.split(/\r?\n/);
  const slugger = new GithubSlugger();
  
  const result: ParsedBlogPost = {
    opening: '',
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
  let hasFirstHeading = false;

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
      
      const id = slugger.slug(rawText.replace(/\*\*(.*?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/<[^>]+>/g, '').trim());
      const text = rawText
        .replace(/^\d+\.\s*/, '')
        .replace(/\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\[\s*\]/g, '')
        .replace(/<[^>]+>/g, '')
        .trim();
        
      if (text) {
        result.toc.push({ id, text });
      }

      // 첫 번째 TOC 제목 등장 전까지의 텍스트를 오프닝으로 분리
      if (!hasFirstHeading) {
        hasFirstHeading = true;
        const opStr = currentSectionLines.join('\n').trim();
        if (opStr) result.opening = opStr;
        currentSectionLines = [line];
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

      // 1. 관련 정보 텍스트 자동 삭제 (피로감 줄이기)
      if (/^\s*(\[|\*\*|#+\s*)?(관련\s*(정보|글|포스팅)|함께\s*읽기|관련정보|관련글)(\]|\*\*|:)?\s*$/.test(trimmed)) {
        continue; // 이 줄은 완전히 렌더링에서 제외
      }

      // 2. 단독 링크 자동 감지 및 변환 (불릿 유무 무관)
      const singleLinkMatch = trimmed.match(/^\s*(?:[-*]\s*)?\[([^\]]+)\]\(([^)]+)\)\s*$/);
      if (singleLinkMatch) {
        const text = singleLinkMatch[1].trim();
        const href = singleLinkMatch[2].trim();
        processedLine = `<calloutlink href="${href}" text="${text}"></calloutlink>`;
      }
      
      currentSectionLines.push(processedLine);
    }
  }

  if (currentQ) {
    result.faqItems.push({ q: currentQ, a: currentA.trim() });
  }
  pushCurrentSection();

  const applyBold = (str: string) => str.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
  
  result.sections = result.sections.map(applyBold);
  result.keyPoints = result.keyPoints.map(applyBold);
  result.checklistItems = result.checklistItems.map(applyBold);
  result.faqItems = result.faqItems.map(faq => ({ ...faq, a: applyBold(faq.a) }));

  // 연달아 나오는 calloutlink들을 하나의 relatedbox로 묶기
  const groupRelatedLinks = (text: string) => {
    return text.replace(/(<calloutlink[^>]+>\s*<\/calloutlink>\s*)+/g, (match) => {
      return `<relatedbox>\n${match.trim()}\n</relatedbox>\n\n`;
    });
  };

  if (result.opening) {
    result.opening = groupRelatedLinks(result.opening);
  }
  result.sections = result.sections.map(groupRelatedLinks);

  return result;
}
