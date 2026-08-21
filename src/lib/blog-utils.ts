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

// ─── 유틸리티 함수 ───────────────────────────────────────────────────────────
function cleanHeadingText(rawText: string, removeNumbering = false): string {
  let cleaned = rawText
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim();

  if (removeNumbering) {
    cleaned = cleaned
      .replace(/^\d+\.\s*/, '')
      .replace(/\p{Extended_Pictographic}|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu, '')
      .replace(/\[\s*\]/g, '')
      .trim();
  }
  return cleaned;
}

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
    
    // code block check
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      if (currentSectionType === 'NONE') {
        currentSectionLines.push(line);
      }
      continue;
    }

    // 1. Heading Detection (H2, H3)
    let headingMatch = !inCodeBlock ? trimmed.match(/^(#{2,3})\s+(.+)$/) : null;
    
    // [FAQ 내 H3 충돌 방어] FAQ 수집 모드에서 ### Q: 또는 ### A: 형태는 섹션 분기용 헤딩이 아님
    if (headingMatch && currentSectionType === 'FAQ' && /^(?:[*_💬✅☑️🛡️⭐\s]*[QA]\d*[*_]*\s*[:.-]?\s*)/i.test(headingMatch[2])) {
      headingMatch = null;
    }

    if (headingMatch) {
      const rawText = headingMatch[2].trim();
      
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

      // 일반 본문 헤딩을 만났을 때
      if (currentSectionType === 'FAQ' && currentQ) {
        result.faqItems.push({ q: currentQ, a: currentA.trim() });
        currentQ = ''; currentA = '';
      }
      currentSectionType = 'NONE';
      
      const isH2 = headingMatch[1].length === 2;
      const id = slugger.slug(cleanHeadingText(rawText));
      const text = cleanHeadingText(rawText, true);
        
      if (isH2) {
        if (text) result.toc.push({ id, text });

        // 첫 번째 일반 H2 제목 등장 전까지 모인 내용을 오프닝(도입부)으로 분리
        if (!hasFirstHeading) {
          hasFirstHeading = true;
          const opStr = currentSectionLines.join('\n').trim();
          if (opStr) result.opening = opStr;
          currentSectionLines = [line];
        } else {
          pushCurrentSection();
          currentSectionLines = [line];
        }
      } else {
        // H3 헤딩은 현재 섹션의 하위 내용으로 포함
        currentSectionLines.push(line);
      }
      continue;
    }

    // 2. Process Lines by State
    if (currentSectionType === 'FAQ') {
      if (/^(?:#+\s*)?(?:[*_💬✅☑️🛡️⭐\s]*Q\d*[*_]*\s*[:.-]?\s*)/i.test(trimmed)) {
        if (currentQ) result.faqItems.push({ q: currentQ, a: currentA.trim() });
        currentQ = trimmed.replace(/^(?:#+\s*)?(?:[*_💬✅☑️🛡️⭐\s]*Q\d*[*_]*\s*[:.-]?\s*)/i, '').trim();
        currentA = '';
        continue;
      }
      if (currentQ) {
        if (trimmed !== '---') {
          const cleanLine = line.replace(/^\s*(?:[*_💬✅☑️🛡️⭐\s]*A\d*[*_]*\s*[:.-]?\s*)/i, '');
          currentA += cleanLine + '\n';
        }
        continue;
      }
    }

    if (currentSectionType === 'KEY_POINTS') {
      const cleanLine = trimmed.replace(/^[> \t]+/, '').trim();
      if (!cleanLine) continue; // 빈 줄은 스킵

      const isBullet = /^[-*+]\s+/.test(cleanLine) || /^[🛡️💡✅☑️⭐]/.test(cleanLine);
      if (isBullet && result.keyPoints.length < 3) {
        const text = cleanLine.replace(/^[-*+]\s*/, '').replace(/^[🛡️💡✅☑️⭐]+\s*/, '').trim();
        if (text && !/^[-=_*~]{2,}$/.test(text)) {
          result.keyPoints.push(text);
          continue;
        }
      }

      // 구분선인 경우 스킵
      if (/^[-=_*]{2,}$/.test(cleanLine)) continue;

      // 불릿이 아닌 일반 텍스트 라인을 만나면 -> KEY_POINTS 종료, 일반 모드로 전환하여 오프닝 라인에 추가
      currentSectionType = 'NONE';
    }

    if (currentSectionType === 'CHECKLIST') {
      const cleanLine = trimmed.replace(/^[> \t]+/, '').trim();
      if (!cleanLine) continue;

      const isCheckItem = /^[-*+]\s+/.test(cleanLine) || /^\[[ xX-]\]/.test(cleanLine) || /^[\u2611\u2705\uFE0F[\]]/.test(cleanLine);
      if (isCheckItem) {
        const text = cleanLine.replace(/^[-*+]\s*/, '').replace(/^\[[ xX-]\]\s*/i, '').replace(/^[\u2611\u2705\uFE0F]+\s*/gu, '').trim();
        if (text && !/^[-=_*~]{2,}$/.test(text)) {
          result.checklistItems.push(text);
          continue;
        }
      }

      if (/^[-=_*]{2,}$/.test(cleanLine)) continue;

      // 체크리스트가 아닌 일반 텍스트면 NONE으로 전환
      currentSectionType = 'NONE';
    }

    if (currentSectionType === 'CTA') {
      continue;
    }

    if (currentSectionType === 'NONE') {
      if (/\[SEO_SUMMARY\]/.test(trimmed)) continue;

      // 1. 관련 정보 텍스트 자동 삭제
      if (/^\s*(\[|\*\*|#+\s*)?(관련\s*(정보|글|포스팅)|함께\s*읽기|관련정보|관련글)(\]|\*\*|:)?\s*$/.test(trimmed)) {
        continue;
      }

      // 2. 단독 링크 자동 감지 및 변환
      let processedLine = line;
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
  
  if (!hasFirstHeading) {
    const opStr = currentSectionLines.join('\n').trim();
    if (opStr) result.opening = opStr;
  } else {
    pushCurrentSection();
  }

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

  // [재발방지 Fallback]
  // sections도 비어있고 opening도 비어있을 때만 (극단적 파싱 실패 방어)
  if (!result.opening && result.sections.length === 0 && content.trim()) {
    result.sections = [groupRelatedLinks(applyBold(content.trim()))];
  }

  return result;
}

