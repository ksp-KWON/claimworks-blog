/**
 * markdown-standard.js
 * 보상스쿨 단일 표준 마크다운 정규화 엔진 (Single Source of Truth)
 * 
 * [헌법 원칙 준수]
 * - 표준 · 범용 · 콤팩트 · 통합 · 공유 · 공통
 * - 사후 땜질이 아닌 저장 직전(Pre-save) 원천 차단 및 사전 예방
 * - W3C 시맨틱 위계, GFM 순수 텍스트 미니멀리즘 준수
 */

'use strict';

const matter = require('gray-matter');

/**
 * 프론트매터 메타데이터 단일 표준 정규화
 */
function normalizeFrontmatter(data = {}) {
  const cleanData = { ...data };

  // 1. summary 정규화 (단일 문자열, 줄바꿈 제거, 따옴표 정리)
  if (cleanData.summary) {
    cleanData.summary = String(cleanData.summary)
      .replace(/[\r\n]+/g, ' ')
      .replace(/"/g, "'")
      .replace(/^'+|'+$/g, '')
      .trim();
  }

  // 2. category 단일 표준화 (string[] Monomorphic SSOT)
  let categories = [];
  if (Array.isArray(cleanData.category)) {
    categories = cleanData.category.map(c => String(c).trim()).filter(Boolean);
  } else if (typeof cleanData.category === 'string' && cleanData.category.trim()) {
    categories = [cleanData.category.trim()];
  }

  if (cleanData.specialtyCategory && typeof cleanData.specialtyCategory === 'string' && cleanData.specialtyCategory.trim()) {
    const spec = cleanData.specialtyCategory.trim();
    if (!categories.includes(spec)) {
      categories.push(spec);
    }
  }

  if (categories.length === 0) {
    categories = ['보상가이드'];
  }

  cleanData.category = categories;
  delete cleanData.specialtyCategory;

  // 3. tags 정규화 (string[] 표준)
  if (typeof cleanData.tags === 'string') {
    cleanData.tags = cleanData.tags.split(',').map(t => t.trim()).filter(Boolean);
  } else if (!Array.isArray(cleanData.tags)) {
    cleanData.tags = [];
  }

  return cleanData;
}

/**
 * 마크다운 본문 단일 표준 정규화 (사전 예방 및 렌더링 무결성 보장)
 */
function normalizeMarkdownBody(rawBody, fallbackSummary = '') {
  if (!rawBody) return '';
  let body = String(rawBody);

  // ── [1. AI 상투적 더미 멘트 및 메모 원천 제거] ─────────────────────
  body = body.replace(
    />\s*###\s*(?:💡|👨‍⚖️|⚖️)?\s*보상스쿨\s*실무쟁점[\s\S]*?(?=\r?\n\r?\n(?:##|#|[^\n>])|$)/gi,
    ''
  );
  body = body.replace(/\[\s*(?:이미지\s*제안|관련\s*글\s*추천|이미지제안|관련글추천)\s*:[^\]]*\]/gi, '');

  // ── [2. 비표준 alert 박스 ➔ 시그니처 인사이트 박스 표준화] ──────────
  body = body.replace(/>\s*\[!(?:TIP|NOTE|IMPORTANT|WARNING|CAUTION)\]\s*\r?\n/gi, '> ### 보상스쿨 피드백 & 실무 인사이트\n');
  body = body.replace(/>\s*(?:전문가\s*조언|손해사정사\s*실무\s*조언|실무\s*TIP)\s*:\s*/gi, '> ### 보상스쿨 피드백 & 실무 인사이트\n> ');

  // ── [3. 오프닝 & 핵심 요약 위계 배치 보장] ──────────────────────────
  const keyPointOrderMatch = body.match(/(?:^|\r?\n)(##\s*(?:💡|🎯)?\s*(?:핵심\s*요약|핵심요약|핵심\s*포인트)[^\n]*\r?\n+(?:[ \t]*>.*(?:\r?\n|$))+)/i);
  if (keyPointOrderMatch && keyPointOrderMatch.index > 0) {
    const beforeKeyPoints = body.slice(0, keyPointOrderMatch.index).trim();
    const keyPointsBlock = keyPointOrderMatch[1].trim();
    const afterKeyPoints = body.slice(keyPointOrderMatch.index + keyPointOrderMatch[0].length).trim();
    if (beforeKeyPoints && !beforeKeyPoints.startsWith('#') && !beforeKeyPoints.startsWith('>')) {
      body = `${keyPointsBlock}\n\n${beforeKeyPoints}\n\n${afterKeyPoints}`;
    }
  }

  // ── [4. 다단계 솔루션(①~⑳) 콜론 분리 및 H6 헤딩 승격] ──────────────
  body = body.replace(
    /(?:^|\r?\n)(?<!#\s*)([①-⑳])\s*(?:\*\*)?(?:[1-9]단계\s*:\s*)?([^\n:]+?)(?:\*\*)?\s*:\s*([^\n]+)/g,
    (m, num, title, desc) => {
      if (m.trim().startsWith('#')) return m;
      if (/\d+$/.test(title.trim()) && /^\d+/.test(desc.trim())) return m;
      const cleanTitle = title.replace(/[*_#]/g, '').trim();
      const cleanDesc = desc.trim();
      return `\n\n###### ${num} ${cleanTitle}\n\n${cleanDesc}`;
    }
  );

  // ── [5. 핵심 요약 박스 순수 텍스트 정규화] ──────────────────────────
  body = body.replace(
    /(##\s*(?:💡\s*|🎯\s*)?(?:핵심\s*요약|핵심요약|핵심\s*포인트)\s*\r?\n+)((?:[ \t]*>.*(?:\r?\n|$))+)/gi,
    (m, head, bullets) => {
      const cleanBullets = bullets
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => {
          let text = l.replace(/^(?:>\s*)?[-*+]\s*/, '').replace(/^>\s*/, '').trim();
          text = text.replace(/^(?:\*\*)?\[?\s*핵심\s*쟁점\s*\d*\s*\]?(?:\*\*)?\s*\*+\s*:\s*/gi, '');
          text = text.replace(/^\[?\s*핵심\s*쟁점\s*\d*\s*\]?\s*:\s*/gi, '');
          text = text.replace(/^\[[^\n\]]+\]\s*\*+\s*:\s*/, '');
          text = text.replace(/^[💡🎯📌⭐🛡️✅☑️✔]+\s*/, '');
          text = text.replace(/^(?:\*\*)?핵심\s*키워드\s*\d*(?:\*\*)?\s*[:：]\s*/i, '');
          if (!text) return '';
          return `> - ${text.trim()}`;
        })
        .filter(Boolean)
        .join('\n');
      return `## 핵심 요약\n${cleanBullets}\n\n`;
    }
  );

  // ── [6. 1분 자가진단 헤딩 및 체크리스트 완전 표준화] ─────────────────
  body = body.replace(/##[^\n]*1분\s*(?:자가진단|체크리스트|체크)[^\n]*/gi, (m) => {
    let subject = '';
    const colonMatch = m.match(/:\s*([^\n\r]+)/);
    if (colonMatch && !colonMatch[1].includes('지금 전문가')) {
      subject = ` : ${colonMatch[1].replace(/체크리스트/g, '').replace(/[💡🎯📌⭐🛡️✅☑️✔]/g, '').trim()} 체크리스트`;
    } else {
      subject = ' : 체크리스트';
    }
    return `## 1분 자가진단${subject}`;
  });

  body = body.replace(/(##\s*1분\s*자가진단[^\n]*\r?\n+)((?:[ \t]*>?[ \t]*[-*+☑️✅✔\[].*\r?\n*)+)/gi, (m, head, bullets) => {
    const cleanBullets = bullets
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('---') && !l.startsWith('***') && !l.includes('위 항목 중 하나라도'))
      .map((l) => {
        let text = l.replace(/^(?:>\s*)?[-*+]\s*/, '').trim();
        text = text.replace(/^[☑️✅✔]+\s*/, '');
        if (!text.startsWith('[ ]') && !text.startsWith('[-]') && !text.startsWith('[x]')) {
          text = `[ ] ${text}`;
        }
        return `> - ${text}`;
      })
      .join('\n');
    return `${head.trim()}\n${cleanBullets}\n\n`;
  });

  // ── [7. FAQ 및 결론 헤딩 표준화] ────────────────────────────────────
  body = body.replace(/##\s*(?:[1-9]\.\s*)?(?:💡\s*|❓\s*)?(?:자주\s*묻는\s*질문|자주묻는질문|FAQ)[^\n]*/gi, '## 자주 묻는 질문 (FAQ)');
  body = body.replace(/##\s*(?:[1-9]\.\s*)?(?:결론\s*및\s*보상스쿨의\s*맞춤형\s*솔루션|결론\s*및\s*보상스쿨\s*맞춤형\s*솔루션|결론\s*및\s*맞춤형\s*솔루션)[^\n]*/gi, '## 결론 및 보상스쿨의 맞춤형 솔루션');

  // ── [8. 인라인 용어사전 및 시그니처 박스 표준화] ─────────────────────
  body = body.replace(
    />\s*###\s*(?:💡\s*|👨‍⚖️\s*|⚖️\s*)?(?:보상스쿨\s*피드백\s*&\s*실무\s*인사이트|보상스쿨\s*실무\s*TIP|보상스쿨\s*실무TIP|손해사정사\s*실무\s*조언|실무\s*TIP|보상스쿨\s*실무쟁점)[^\n]*/gi,
    '> ### 보상스쿨 피드백 & 실무 인사이트'
  );
  body = body.replace(
    />\s*(?:💡\s*)?\*\*(?:보상스쿨\s*피드백\s*&\s*실무\s*인사이트|보상스쿨\s*실무\s*TIP|보상스쿨\s*실무TIP|손해사정사\s*실무\s*조언|실무\s*TIP)\*\*\s*:\s*/gi,
    '> ### 보상스쿨 피드백 & 실무 인사이트\n> '
  );
  body = body.replace(/>\s*(?:💡|📖|📌)\s*(?:\*\*)?\[([^\n\]]+)\](?:\*\*)?\s*:\s*/g, '> **$1** : ');
  body = body.replace(/>\s*(?:💡|📖|📌)\s*(?:\*\*)?([^:\n*]+?)(?:\*\*)?\s*:\s*/g, (m, term) => {
    const cleanTerm = term.replace(/[*_\[\]]/g, '').trim();
    if (cleanTerm.includes('피드백') || cleanTerm.includes('실무')) return m;
    return `> **${cleanTerm}** : `;
  });

  // ── [9. 피드백 박스 헤딩 직후 표준 빈 줄(>) 보장 (볼드 파싱 파손 원천 차단)] ─
  body = body.replace(/(>\s*###\s*보상스쿨 피드백 & 실무 인사이트\s*\n)(>\s*[^\n\s>])/g, '$1>\n$2');

  // ── [10. LaTeX 수식 기호 ($$) 완전 자동 정규화 (순수 마크다운화)] ───────
  if (body.includes('$$')) {
    body = body.replace(/\$\$([\s\S]*?)\$\$/g, (m, p1) => {
      let clean = p1.replace(/\\text\{([^}]+)\}/g, '$1')
                    .replace(/\\times/g, '×')
                    .replace(/\\sim/g, '~')
                    .replace(/\\%/g, '%')
                    .trim();
      return `> **산출 공식** : **${clean}**`;
    });
  }

  // ── [11. 계산식 인라인 백틱(\`) 자동 정규화 (개발자 코딩 폰트 이질감 박멸)] ─
  body = body.replace(/`([^`\n]*[=×x][^`\n]*)`/g, (match, formula) => {
    const pretty = formula.replace(/\s+x\s+/g, ' × ').trim();
    return `**${pretty}**`;
  });

  // ── [12. 헤딩 유착 사전 분리 및 표준 빈 줄 보장] ───────────────────────
  body = body.replace(/^(#{2,4}[^\n\r*]+)(\*\*[가-힣A-Za-z0-9])/gm, '$1\n\n$2');
  body = body.replace(/^(#{2,4}[^\n\r]+)\r?\n([^\r\n#>-|])/gm, '$1\n\n$2');
  body = body.replace(/###\s*(?:[가-하]\.|\([가-하]\)|[1-9]\.|\([1-9]\)|[1-9]\))\s*/g, '### ');

  // ── [13. 마크다운 표(Table) 문법 정밀 표준화] ──────────────────────────
  body = body.replace(/(\|(?:\s*:?-+:?\s*\|)+)\s*>[ \t]*/g, '$1\n');
  body = body.replace(/(\|.*\|)\r?\n[ \t]*\r?\n+(\s*\|)/g, '$1\n$2');
  body = body.replace(/(\|.*\|)\r?\n(>[^\n]+)/g, '$1\n\n$2');

  // ── [14. 마크다운 별표(Bold) 문법 정밀 표준화 및 고아 태그 정리] ────────
  body = body.replace(/\*{3,}([^\n*]+?)\*{2,}/g, '**$1**');
  body = body.replace(/\*{2,}([^\n*]+?)\*{3,}/g, '**$1**');
  body = body.replace(/^>\s*\*\*([^*:\n]+)\*\s*:/gm, '> **$1** :');
  body = body.replace(/(>\s*-\s*)([^\n*:]+?)\*\*\s*:/g, '$1**$2** :');

  const bMatches = body.match(/\*\*/g);
  if (bMatches && bMatches.length % 2 !== 0) {
    const lastIdx = body.lastIndexOf('**');
    if (lastIdx !== -1) {
      body = body.slice(0, lastIdx) + body.slice(lastIdx + 2);
    }
  }

  // ── [15. 중복 관련 글 추천 헤더 및 본문 단독 링크 목록 삭제] ───────────
  body = body.replace(/##\s*🔗?\s*함께\s*읽으면\s*(?:도움이\s*되는|도움되는|좋은)\s*보상\s*(?:칼럼|글)[\s\S]*?(?=\r?\n\r?\n#|$)/gi, '');
  body = body.replace(/(?:^|\r?\n)\[[^\]\n]+\]\(\/blog\/[^\)\n]+\)[ \t]*(?=\r?\n|$)/g, '');

  // ── [16. 스마트 문단 호흡 정규화 (GFM Paragraph Breathing)] ───────────
  const blocks = body.split(/\r?\n\r?\n/);
  const normalizedBlocks = blocks.map(block => {
    const trimmed = block.trim();
    if (
      !trimmed ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('>') ||
      trimmed.startsWith('|') ||
      trimmed.startsWith('-') ||
      trimmed.startsWith('*') ||
      /^[1-9]\./.test(trimmed) ||
      trimmed.startsWith('```')
    ) {
      return block;
    }

    const sentences = [];
    let current = '';
    let inParen = 0;
    let inQuote = false;

    for (let i = 0; i < block.length; i++) {
      const char = block[i];
      current += char;

      if (char === '(' || char === '[' || char === '{') inParen++;
      else if (char === ')' || char === ']' || char === '}') inParen = Math.max(0, inParen - 1);
      else if (char === '"' || char === '“' || char === '”') inQuote = !inQuote;

      if (inParen === 0 && (char === '.' || char === '?' || char === '!')) {
        const nextChar = block[i + 1];
        const isEnd = (nextChar === undefined || /\s/.test(nextChar) || nextChar === '"' || nextChar === '”');
        const prevTrimmed = current.slice(0, -1).trim();
        const prevChar = prevTrimmed.slice(-1);
        const isSentenceEnd = /[가-힣0-9"'\)\]]/.test(prevChar);
        const isNumberDot = /\d+\.$/.test(current.trim());

        if (isEnd && isSentenceEnd && !isNumberDot) {
          while (i + 1 < block.length && /\s/.test(block[i + 1])) {
            i++;
          }
          sentences.push(current.trim());
          current = '';
        }
      }
    }

    if (current.trim()) {
      sentences.push(current.trim());
    }

    if (sentences.length < 4) return block;

    const chunks = [];
    let currentChunk = [];

    for (let i = 0; i < sentences.length; i++) {
      currentChunk.push(sentences[i]);
      const remaining = sentences.length - (i + 1);
      if (currentChunk.length >= 2 && remaining >= 2) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [];
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }

    return chunks.join('\n\n');
  });

  body = normalizedBlocks.join('\n\n');

  // ── [17. 다중 빈 줄 정리] ──────────────────────────────────────────────
  body = body.replace(/(?:\r?\n){3,}/g, '\n\n').trim();

  return body;
}

/**
 * 포스트 전체(Frontmatter + Body) 통합 표준 정규화 (SSOT 진입점)
 */
function normalizePost(rawFileContent) {
  let parsed;
  try {
    parsed = matter(rawFileContent);
  } catch (e) {
    const rawFixed = rawFileContent.replace(/summary:\s*([\s\S]*?)(?=\r?\n[a-zA-Z0-9_-]+:|$)/m, (m, val) => {
      let clean = val.replace(/[\r\n]+/g, ' ').replace(/"/g, "'").replace(/^'+|'+$/g, '').trim();
      return `summary: "${clean}"`;
    });
    parsed = matter(rawFixed);
  }

  const cleanData = normalizeFrontmatter(parsed.data);
  const cleanBody = normalizeMarkdownBody(parsed.content, cleanData.summary);

  const cleanContent = matter.stringify(cleanBody, cleanData);
  return {
    data: cleanData,
    content: cleanBody,
    fullContent: cleanContent,
    isChanged: cleanContent !== rawFileContent
  };
}

module.exports = {
  normalizeFrontmatter,
  normalizeMarkdownBody,
  normalizePost
};
