import GithubSlugger from 'github-slugger';

// [정규식 표준 패턴]
const KEY_POINT_PATTERNS = /^(?:#+\s*)?(?:[💡⭐📌\s]*)(?:핵심\s*요약|핵심\s*포인트|요약|3줄\s*요약|핵심\s*정리|Key\s*Points)(?:[\s:]*)/i;
const CHECKLIST_PATTERNS = /^(?:#+\s*)?(?:[📋✅☑️\s]*)(?:1분\s*자가진단|자가진단|체크리스트|Checklist|필수\s*체크|진단\s*체크)(?:[\s:]*)/i;
const FAQ_PATTERNS = /^(?:#+\s*)?(?:[❓💬💡\s]*)(?:자주\s*묻는\s*질문|FAQ|Q&A|질의응답)(?:[\s:]*)/i;
const CTA_PATTERNS = /^(?:#+\s*)?(?:[🛡️📞⚖️💡\s]*)(?:손해사정사\s*조언|맺음말|상담\s*안내|신청\s*안내|도움이\s*필요하신가요)(?:[\s:]*)/i;

export interface ParsedBlogPost {
  opening: string;
  keyPoints: string[];
  checklistItems: string[];
  faqItems: { q: string; a: string }[];
  toc: { id: string; text: string }[];
  sections: string[];
}

export function cleanHeadingText(text: string, removePrefix = false): string {
  let cleaned = text.replace(/^#+\s*/, '').replace(/^[🛡️💡✅☑️⭐❓📋📌]\s*/, '').trim();
  if (removePrefix) {
    cleaned = cleaned.replace(/^\d+[\.\)]\s*/, '').trim();
  }
  return cleaned;
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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // 0. 코드 블록 검사
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      if (currentSectionType === 'NONE') {
        currentSectionLines.push(line);
      }
      continue;
    }

    if (inCodeBlock) {
      if (currentSectionType === 'NONE') currentSectionLines.push(line);
      continue;
    }

    // 1. 헤딩 감지 (H2: ##, H3: ###)
    const headingMatch = trimmed.match(/^(#{2,3})\s+(.+)$/);
    
    if (headingMatch) {
      const level = headingMatch[1].length;
      const rawText = headingMatch[2].trim();

      // [FAQ 모드 내부의 H3 질문 처리]
      if (currentSectionType === 'FAQ' && level === 3) {
        if (/^(?:[*_💬✅☑️🛡️⭐\s]*[QA]\d*[*_]*\s*[:.-]?\s*)/i.test(rawText) || /\?$/.test(rawText)) {
          if (currentQ) {
            result.faqItems.push({ q: currentQ, a: currentA.trim() });
          }
          currentQ = rawText.replace(/^(?:[*_💬✅☑️🛡️⭐\s]*Q\d*[*_]*\s*[:.-]?\s*)/i, '').trim();
          currentA = '';
          continue;
        }
      }

      // 특수 H2 섹션 전환 검사
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

      // 일반 본문 헤딩(H2 or H3)을 만났을 때 -> 특수 상태 종료
      if (currentSectionType === 'FAQ' && currentQ) {
        result.faqItems.push({ q: currentQ, a: currentA.trim() });
        currentQ = ''; currentA = '';
      }
      currentSectionType = 'NONE';

      if (level === 2) {
        const id = slugger.slug(cleanHeadingText(rawText));
        const text = cleanHeadingText(rawText, true);
        if (text) result.toc.push({ id, text });

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
        // H3는 현재 섹션 라인에 추가
        currentSectionLines.push(line);
      }
      continue;
    }

    // 2. 상태별 라인 처리
    if (currentSectionType === 'KEY_POINTS') {
      const cleanLine = trimmed.replace(/^[> \t]+/, '').trim();
      if (!cleanLine) continue;

      const isBullet = /^[-*+]\s+/.test(cleanLine) || /^[🛡️💡✅☑️⭐]/.test(cleanLine);
      if (isBullet && result.keyPoints.length < 3) {
        const text = cleanLine.replace(/^[-*+]\s*/, '').replace(/^[🛡️💡✅☑️⭐]+\s*/, '').trim();
        if (text && !/^[-=_*~]{2,}$/.test(text)) {
          result.keyPoints.push(text);
          continue;
        }
      }

      // 불릿이 아닌 일반 텍스트는 오프닝으로 보냄
      if (!hasFirstHeading) {
        currentSectionLines.push(line);
      }
      continue;
    }

    if (currentSectionType === 'CHECKLIST') {
      const cleanLine = trimmed.replace(/^[> \t]+/, '').trim();
      if (!cleanLine) continue;

      const isCheckItem = /^[-*+]\s*\[[ xX-]?\]/.test(cleanLine) || /^[-*+]\s+/.test(cleanLine) || /^[☑✅️\[\]]/.test(cleanLine);
      if (isCheckItem) {
        const text = cleanLine
          .replace(/^[-*+]\s*/, '')
          .replace(/^\[[ xX-]?\]\s*/i, '')
          .replace(/^[\u2611\u2705\uFE0F]+\s*/gu, '')
          .trim();
        if (text && !/^[-=_*~]{2,}$/.test(text)) {
          result.checklistItems.push(text);
          continue;
        }
      }
      // 설명 문장은 무시하고 다음 체크 항목을 계속 수집
      continue;
    }

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
      continue;
    }

    if (currentSectionType === 'CTA') {
      continue;
    }

    if (currentSectionType === 'NONE') {
      if (/\[SEO_SUMMARY\]/.test(trimmed)) continue;

      if (/^\s*(\[|\*\*|#+\s*)?(관련\s*(정보|글|포스팅)|함께\s*읽기|관련정보|관련글)(\]|\*\*|:)?\s*$/.test(trimmed)) {
        continue;
      }

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

  const groupRelatedLinks = (text: string) => {
    return text.replace(/(<calloutlink[^>]+>\s*<\/calloutlink>\s*)+/g, (match) => {
      return `<relatedbox>\n${match.trim()}\n</relatedbox>\n\n`;
    });
  };

  if (result.opening) {
    result.opening = groupRelatedLinks(applyBold(result.opening));
  }
  result.sections = result.sections.map(groupRelatedLinks);

  if (!result.opening && result.sections.length === 0 && content.trim()) {
    result.sections = [groupRelatedLinks(applyBold(content.trim()))];
  }

  return result;
}
