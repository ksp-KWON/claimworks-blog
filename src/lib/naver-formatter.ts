/**
 * naver-formatter.ts
 * 네이버 블로그 스마트에디터 ONE(SmartEditor ONE) 전용 무결점 W3C 테이블 변환 엔진 3.0
 * 
 * [원칙: 표준, 범용, 콤팩트, 통합, 공유, 공통]
 * - blog-tokens.ts와 완전 연동되는 단일 진실 공급원(Single Source of Truth)
 * - 보상스쿨 글로벌 헌법 제1조(순수 텍스트 미니멀리즘, 이모지 전면 배제) 및 제12조 준수
 * - 웹의 CommonBox와 100% 동일한 비주얼 룩앤필의 [상단 톤온톤 헤더 스트립 + 하단 본문] 5대 Table 카드 시스템
 */

import { BLOG_TONE_TOKENS, getToneColor, getKeywordTone, BlogTone } from './blog-tokens';

export interface NaverFormatOptions {
  title?: string;
  targetBlog?: 'default' | 'traffic' | 'medical' | 'accident';
}

/**
 * 키워드 강조(**텍스트**)를 5대 패밀리 톤온톤 스마트 하이라이터로 변환
 */
export function applyNaverHighlighter(text: string): string {
  if (!text) return '';
  return text.replace(/\*\*(.*?)\*\*/g, (_, match) => {
    const tone = getKeywordTone(match);
    const token = BLOG_TONE_TOKENS[tone].hex;
    return `<strong style="background-color: ${token.highlightBg}; color: ${token.highlightText}; padding: 2px 5px; border-radius: 3px; font-weight: bold; font-family: inherit;">${match}</strong>`;
  });
}

/**
 * 마크다운 텍스트를 네이버 스마트에디터 ONE 전용 HTML로 완벽 변환
 */
export function convertMarkdownToNaverHtml(markdown: string, options: NaverFormatOptions = {}): string {
  if (!markdown) return '';

  let raw = markdown;

  // 0. JSON 문자열 형태인 경우 markdownContent 필드 자동 추출
  try {
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.markdownContent || parsed.content)) {
      raw = parsed.markdownContent || parsed.content;
    }
  } catch {}

  try {
    const jsonMatch = raw.match(/```(?:json)?\s*\n([\s\S]*?)\n```/) || raw.match(/\{[\s\S]*"(?:markdownContent|content)"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      if (parsed && (parsed.markdownContent || parsed.content)) {
        raw = parsed.markdownContent || parsed.content;
      }
    }
  } catch {}

  // 1. Frontmatter, 백틱 코드블록 래핑, 사고과정(thoughtProcess), HTML 주석 정제
  let cleanMd = raw
    .replace(/^---[\s\S]*?---\n*/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^```(?:markdown)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .replace(/^(?:thoughtProcess|사고\s*과정|생각의\s*사슬)[\s\S]*?(?=\n##|\n#)/i, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

  // 최상단 H1(# 제목)이 옵션 title과 중복되거나 잘못 들어온 경우 제거
  cleanMd = cleanMd.replace(/^#\s+[^\n]+\n+/, '').trim();

  // 2. 핵심 요약 (Key Points) 추출
  let keyPoints: string[] = [];
  const keyPointsHeaderRegex = /##\s*(?:[💡🎯📌⭐\s]*)(?:핵심\s*요약|핵심요약|핵심\s*포인트|3줄\s*요약)(?:[^\n]*)\n+((?:[ \t]*>?[ \t]*[-*+].*\n*)+)/i;
  const keyPointsMatch = cleanMd.match(keyPointsHeaderRegex);

  if (keyPointsMatch) {
    const rawBullets = keyPointsMatch[1];
    keyPoints = rawBullets
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map(l => l.replace(/^(?:>\s*)?[-*+]\s*/, '').trim())
      .filter(l => l.length > 0 && !l.startsWith('[ ]') && !l.startsWith('[x]'));

    cleanMd = cleanMd.replace(keyPointsMatch[0], '\n\n');
  }

  // 3. 첫 번째 본문 대제목(## H2) 찾기 및 오프닝 분리
  const firstH2Match = cleanMd.match(/^##\s+.+$/m);
  let openingText = '';
  let bodyMd = cleanMd;

  if (firstH2Match && firstH2Match.index !== undefined) {
    const introPart = cleanMd.slice(0, firstH2Match.index).trim();
    bodyMd = cleanMd.slice(firstH2Match.index).trim();

    if (keyPoints.length === 0) {
      const quoteMatches = introPart.match(/^>[ \t]*[-*+](.+)$/gm);
      if (quoteMatches) {
        keyPoints = quoteMatches.map(m => m.replace(/^>[ \t]*[-*+]\s*/, '').trim());
      }
    }

    const introLines = introPart.split('\n')
      .map(l => l.trim())
      .filter(l => {
        if (!l) return false;
        if (l.startsWith('>')) return false;
        if (l.startsWith('#')) return false;
        if (l.startsWith('|')) return false;
        if (l.startsWith('[') && l.includes('](')) return false;
        if (l.startsWith('![')) return false;
        return true;
      });
    openingText = introLines.join('<br/>');
  } else {
    openingText = cleanMd;
    bodyMd = '';
  }

  const blocks: string[] = [];

  // ── [1단계] 최상단 시작 가로 구분선 ──
  blocks.push(`
    <table style="width: 100%; border: 0; border-collapse: collapse; margin: 10px 0 20px 0;">
      <tr><td style="border-top: 1px solid #cbd5e1; height: 1px; padding: 0;"></td></tr>
    </table>
  `.trim());

  // ── [2단계] 핵심 요약 박스 (W3C 표준 톤온톤 에메랄드 카드) ──
  if (keyPoints.length > 0) {
    const greenToken = BLOG_TONE_TOKENS.green.hex;
    const itemsHtml = keyPoints.map(item => {
      const highlighted = applyNaverHighlighter(item);
      return `<div style="margin: 8px 0; font-size: 14.5px; color: ${greenToken.bodyText}; line-height: 1.8;"><span style="color: ${greenToken.borderAccent}; font-weight: bold; margin-right: 8px;">•</span>${highlighted}</div>`;
    }).join('');

    const summaryBoxHtml = `
      <table style="width: 100%; border: 1.5px solid ${greenToken.border}; background-color: #f0fdf4; border-collapse: collapse; margin: 16px 0 20px 0; border-radius: 4px;">
        <tr>
          <td style="padding: 10px 16px; background-color: ${greenToken.headerBg}; border-bottom: 1px solid ${greenToken.border}; font-weight: bold; color: ${greenToken.headerText}; font-size: 15px;">
            핵심 요약
          </td>
        </tr>
        <tr>
          <td style="padding: 16px 20px; background-color: #f0fdf4;">
            ${itemsHtml}
          </td>
        </tr>
      </table>
    `.trim();
    blocks.push(summaryBoxHtml);
  }

  // ── [3단계] 공감 오프닝 문단 ──
  if (openingText) {
    const highlightedOpening = applyNaverHighlighter(openingText);
    blocks.push(`<p style="font-size: 15.5px; line-height: 1.9; color: #27272a; margin: 20px 0; word-break: keep-all;">${highlightedOpening}</p>`);
  }

  // ── [4단계] 본문 시작 직전 가로 구분선 ──
  blocks.push(`
    <table style="width: 100%; border: 0; border-collapse: collapse; margin: 32px 0 24px 0;">
      <tr><td style="border-top: 1px solid #cbd5e1; height: 1px; padding: 0;"></td></tr>
    </table>
  `.trim());

  // ── [5단계] 본문 챕터 순차 파싱 ──
  const lines = bodyMd.split('\n');
  let i = 0;
  let isFirstH2 = true;

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // 1. 마크다운 표 (| 구분 | 내용 | ...)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        let tableHtml = `<table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; margin: 24px 0; font-size: 13.5px; line-height: 1.5;">`;
        
        const headers = tableLines[0].split('|').map(s => s.trim()).filter(s => s.length > 0);
        tableHtml += `<thead><tr style="background-color: #f1f5f9;">`;
        headers.forEach(h => {
          tableHtml += `<th style="padding: 10px 12px; font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1; text-align: center; vertical-align: middle; background-color: #f1f5f9;">${h}</th>`;
        });
        tableHtml += `</tr></thead><tbody>`;

        const dataRows = tableLines.slice(2);
        dataRows.forEach((row, rIdx) => {
          const cells = row.split('|').map(s => s.trim()).filter(s => s.length > 0);
          const bg = rIdx % 2 === 1 ? '#f8fafc' : '#ffffff';
          tableHtml += `<tr style="background-color: ${bg};">`;
          cells.forEach((c, cIdx) => {
            const align = cIdx === 0 ? 'center' : 'left';
            const cellText = applyNaverHighlighter(c);
            tableHtml += `<td style="padding: 10px 12px; color: #334155; border: 1px solid #cbd5e1; text-align: ${align}; vertical-align: middle; line-height: 1.5;">${cellText}</td>`;
          });
          tableHtml += `</tr>`;
        });

        tableHtml += `</tbody></table>`;
        blocks.push(tableHtml);
      }
      continue;
    }

    // 2. 대제목 H2 (## ...) -> 상단 구분선 + 좌측 6px 에메랄드 라인 헤더 카드
    if (trimmed.startsWith('## ') && !/1분\s*자가진단|자가진단|체크리스트|FAQ|자주\s*묻는\s*질문/i.test(trimmed)) {
      const titleText = trimmed.replace(/^##\s+/, '').trim();
      
      const dividerHtml = isFirstH2 
        ? '' 
        : `<table style="width: 100%; border: 0; border-collapse: collapse; margin: 40px 0 24px 0;"><tr><td style="border-top: 1px solid #cbd5e1; height: 1px; padding: 0;"></td></tr></table>`;
      isFirstH2 = false;

      const h2Html = `
        ${dividerHtml}
        <table style="width: 100%; border-left: 6px solid #03c75a; background-color: #f8fafc; border-collapse: collapse; margin: 0 0 16px 0;">
          <tr>
            <td style="padding: 12px 18px;">
              <p style="font-size: 18.5px; font-weight: bold; color: #0f172a; margin: 0; line-height: 1.4;">
                ${titleText}
              </p>
            </td>
          </tr>
        </table>
      `.trim();
      blocks.push(h2Html);
      i++;
      continue;
    }

    // 3. 1분 자가진단 헤딩 (## 1분 자가진단 ...)
    if (trimmed.startsWith('## ') && /1분\s*자가진단|자가진단|체크리스트/i.test(trimmed)) {
      const titleText = trimmed.replace(/^##\s+/, '').trim();
      const checkLines: string[] = [];
      i++;

      while (i < lines.length && (lines[i].trim().startsWith('>') || lines[i].trim().startsWith('- [') || lines[i].trim().startsWith('* [') || lines[i].trim() === '')) {
        const l = lines[i].trim();
        if (l) checkLines.push(l.replace(/^>\s?/, ''));
        i++;
      }

      const checkItems = checkLines
        .filter(l => l.startsWith('- [ ]') || l.startsWith('- [x]') || l.startsWith('* [ ]') || l.startsWith('* [x]') || l.startsWith('- ') || l.startsWith('* '))
        .map(l => {
          const isChecked = l.includes('[x]');
          const itemText = l.replace(/^[-*]\s*(?:\[[ xX]\]\s*)?/, '').trim();
          const highlighted = applyNaverHighlighter(itemText);
          const checkSymbol = '<span style="color: #059669; font-size: 15px; font-weight: bold; margin-right: 8px; font-family: inherit;">☑</span>';
          
          return `<div style="margin: 10px 0; font-size: 14.5px; color: #334155; line-height: 1.85; padding-left: 2px;">${checkSymbol}<span style="vertical-align: middle;">${highlighted}</span></div>`;
        }).join('');

      const checklistTable = `
        <table style="width: 100%; border: 1px solid #cbd5e1; border-collapse: collapse; margin: 26px 0 16px 0; font-size: 14px;">
          <tr>
            <td style="padding: 12px 18px; background-color: #f1f5f9; border-bottom: 1px solid #cbd5e1; font-weight: bold; color: #0f172a; font-size: 15px;">
              ${titleText}
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 18px; background-color: #f8fafc; color: #334155; line-height: 1.85;">
              ${checkItems || '<div style="font-size: 14px; color: #64748b;">체크리스트 항목을 확인하십시오.</div>'}
            </td>
          </tr>
        </table>
      `.trim();
      blocks.push(checklistTable);
      continue;
    }

    // 4. FAQ 헤더 또는 FAQ Q&A 블록
    const isFaqHeader = trimmed.startsWith('## ') && /(FAQ|자주\s*묻는\s*질문)/i.test(trimmed);
    const isFaqQ = /^(?:###\s*)?(?:\*\*)?(?:Q\d*|질문\d*)\s*[:.]\s*/i.test(trimmed);

    if (isFaqHeader) {
      i++;
      continue; // FAQ 메인 헤더는 개별 Q&A 카드에서 표시하므로 스킵
    }

    if (isFaqQ) {
      let qText = trimmed
        .replace(/^###\s*/, '')
        .replace(/^\*\*/, '')
        .replace(/\*\*$/, '')
        .replace(/^(?:Q\d*|질문\d*)\s*[:.]\s*/i, '')
        .trim();
      let aText = '';
      i++;

      while (
        i < lines.length && 
        !lines[i].trim().startsWith('## ') && 
        !/^(?:###\s*)?(?:\*\*)?(?:Q\d*|질문\d*)\s*[:.]\s*/i.test(lines[i].trim())
      ) {
        const lineVal = lines[i].trim();
        if (/^(?:\*\*)?(?:A\d*|답변\d*)\s*[:.]\s*/i.test(lineVal)) {
          aText += (aText ? '<br/>' : '') + lineVal.replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/^(?:A\d*|답변\d*)\s*[:.]\s*/i, '').trim();
        } else if (lineVal && aText) {
          aText += '<br/>' + lineVal;
        } else if (lineVal && !aText) {
          qText += ' ' + lineVal;
        }
        i++;
      }

      const qHighlighted = applyNaverHighlighter(qText);
      const aHighlighted = applyNaverHighlighter(aText);

      const faqTable = `
        <table style="width: 100%; border: 1px solid #bfdbfe; border-collapse: collapse; margin: 18px 0; font-size: 14px;">
          <tr>
            <td style="padding: 12px 16px; background-color: #eff6ff; border-bottom: 1px solid #bfdbfe; font-weight: bold; color: #1e40af; line-height: 1.5;">
              <strong style="color: #2563eb; font-size: 16px; margin-right: 8px; font-family: inherit;">Q.</strong><span style="color: #1e40af; font-weight: bold;">${qHighlighted}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 14px 16px; background-color: #ffffff; color: #334155; line-height: 1.85;">
              ${aHighlighted}
            </td>
          </tr>
        </table>
      `.trim();
      blocks.push(faqTable);
      continue;
    }

    // 5. 보상스쿨 피드백 & 실무 인사이트 시그니처 박스 (인용구 또는 단독 헤딩 모두 지원)
    const isInsightHeading = /^(?:>\s*)?###\s*(?:보상스쿨|실무\s*인사이트|실무인사이트)/i.test(trimmed);
    if (isInsightHeading) {
      const headerTitle = trimmed.replace(/^>\s?/, '').replace(/^###\s+/, '').trim();
      const bodyLines: string[] = [];
      i++;

      while (i < lines.length && (lines[i].trim().startsWith('>') || (!lines[i].trim().startsWith('#') && lines[i].trim() !== ''))) {
        const l = lines[i].trim();
        if (l) bodyLines.push(l.replace(/^>\s?/, ''));
        i++;
      }

      const token = BLOG_TONE_TOKENS.purple.hex;
      const bodyHtml = bodyLines.map(l => {
        const highlighted = applyNaverHighlighter(l);
        return `<p style="margin: 8px 0; font-size: 14.5px; color: ${token.bodyText}; line-height: 1.85;">${highlighted}</p>`;
      }).join('') || `<p style="margin: 8px 0; font-size: 14.5px; color: ${token.bodyText};">전문 손해사정사가 직접 진단한 실무 핵심 법리입니다.</p>`;

      const insightCardHtml = `
        <table style="width: 100%; border: 1px solid ${token.border}; border-collapse: collapse; margin: 26px 0 16px 0;">
          <tr>
            <td style="padding: 10px 16px; background-color: ${token.headerBg}; border-bottom: 1px solid ${token.headerBorderBottom};">
              <span style="font-size: 15px; font-weight: bold; color: ${token.headerText};">
                ${headerTitle}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 18px; background-color: ${token.bodyBg}; line-height: 1.85;">
              ${bodyHtml}
            </td>
          </tr>
        </table>
      `.trim();
      blocks.push(insightCardHtml);
      continue;
    }

    // 6. 소제목 / 다단계 솔루션 (###### ①, ###### 1단계, ① ...)
    const isSolution = /^(?:#{4,6}\s+|[①-⑳]\s*|[1-9]단계\s*[:.]\s*)/.test(trimmed);
    if (isSolution) {
      let titleText = trimmed
        .replace(/^#{4,6}\s+/, '')
        .replace(/^핵심\s*솔루션\s*/, '')
        .trim();

      const h6Html = `
        <table style="width: 100%; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-collapse: collapse; margin: 20px 0 10px 0;">
          <tr>
            <td style="padding: 10px 14px;">
              <p style="font-size: 15px; font-weight: bold; color: #065f46; margin: 0; line-height: 1.5;">
                <span style="color: #065f46; font-weight: bold;">${titleText}</span>
              </p>
            </td>
          </tr>
        </table>
      `.trim();
      blocks.push(h6Html);
      i++;
      continue;
    }

    // 7. 일반 중제목 H3 (### ...) -> 좌측 4px 블루 라인 헤더 박스
    if (trimmed.startsWith('### ')) {
      const titleText = trimmed.replace(/^###\s+/, '').trim();
      const h3Html = `
        <table style="width: 100%; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; background-color: #f8fafc; border-collapse: collapse; margin: 26px 0 12px 0;">
          <tr>
            <td style="padding: 10px 15px;">
              <span style="font-size: 16px; font-weight: bold; color: #1e3a8a;">
                ${titleText}
              </span>
            </td>
          </tr>
        </table>
      `.trim();
      blocks.push(h3Html);
      i++;
      continue;
    }

    // 8. 인용구 블록 (> ...) -> 통합 구조적 블록 파서 엔진 (AST 기반)
    if (trimmed.startsWith('>')) {
      const rawQuoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        rawQuoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }

      // 8-A. 1분 자가진단 체크리스트 블록
      if (rawQuoteLines.some(l => l.startsWith('- [ ]') || l.startsWith('- [x]'))) {
        const checkItems = rawQuoteLines
          .filter(l => (l.startsWith('- [ ]') || l.startsWith('- [x]')) && !/^[-=_*~]{2,}$/.test(l.replace(/^- \[( |x)\]\s*/, '').trim()))
          .map(l => {
            const itemText = l.replace(/^- \[( |x)\]\s*/, '');
            const highlighted = applyNaverHighlighter(itemText);
            const checkSymbol = '<span style="color: #059669; font-size: 15px; font-weight: bold; margin-right: 8px; font-family: inherit;">☑</span>';
            
            return `<div style="margin: 10px 0; font-size: 14.5px; color: #334155; line-height: 1.85; padding-left: 2px;">${checkSymbol}<span style="vertical-align: middle;">${highlighted}</span></div>`;
          }).join('');

        const checklistTable = `
          <table style="width: 100%; border: 1px solid #cbd5e1; border-collapse: collapse; margin: 22px 0; font-size: 14px;">
            <tr>
              <td style="padding: 12px 18px; background-color: #f1f5f9; border-bottom: 1px solid #cbd5e1; font-weight: bold; color: #0f172a; font-size: 14.5px;">
                1분 자가진단 체크리스트
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 18px; background-color: #f8fafc; color: #334155; line-height: 1.85;">
                ${checkItems}
              </td>
            </tr>
          </table>
        `.trim();
        blocks.push(checklistTable);
        continue;
      }

      // 8-B. 헤딩이 포함된 인용구 (예: > ### 헤딩)
      const firstLine = rawQuoteLines[0] || '';
      const headingMatch = firstLine.match(/^#{1,6}\s+(.+)$/);

      if (headingMatch) {
        const headerTitle = headingMatch[1].trim();
        const bodyLines = rawQuoteLines.slice(1).filter(l => l.trim());
        const fullContent = `${headerTitle} ${bodyLines.join(' ')}`;
        
        const tone = getToneColor(fullContent);
        const token = BLOG_TONE_TOKENS[tone].hex;

        const bodyHtml = bodyLines.map(l => {
          const highlighted = applyNaverHighlighter(l);
          return `<p style="margin: 8px 0; font-size: 14.5px; color: ${token.bodyText}; line-height: 1.85;">${highlighted}</p>`;
        }).join('') || `<p style="margin: 8px 0; font-size: 14.5px; color: ${token.bodyText};">전문 손해사정사가 직접 진단한 실무 핵심 법리입니다.</p>`;

        const insightCardHtml = `
          <table style="width: 100%; border: 1px solid ${token.border}; border-collapse: collapse; margin: 26px 0 16px 0;">
            <tr>
              <td style="padding: 10px 16px; background-color: ${token.headerBg}; border-bottom: 1px solid ${token.headerBorderBottom};">
                <span style="font-size: 15px; font-weight: bold; color: ${token.headerText};">
                  ${headerTitle}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 16px 18px; background-color: ${token.bodyBg}; line-height: 1.85;">
                ${bodyHtml}
              </td>
            </tr>
          </table>
        `.trim();
        blocks.push(insightCardHtml);
        continue;
      }

      // 8-C. 인라인 용어 사전 (> **용어명** : 설명)
      const joinedQuote = rawQuoteLines.join('<br/>');
      if (joinedQuote.includes('용어') || (joinedQuote.includes('**') && (joinedQuote.includes(' : ') || joinedQuote.includes(':')))) {
        const highlighted = applyNaverHighlighter(joinedQuote);
        const yellowToken = BLOG_TONE_TOKENS.yellow.hex;
        const glossaryTable = `
          <table style="width: 100%; border: 1px dashed ${yellowToken.border}; background-color: #fffbeb; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 12px 18px; font-size: 14px; color: ${yellowToken.headerText}; line-height: 1.75;">
                ${highlighted}
              </td>
            </tr>
          </table>
        `.trim();
        blocks.push(glossaryTable);
        continue;
      }

      // 8-D. 일반 인용구 (좌측 톤온톤 라인 카드)
      const tone = getToneColor(joinedQuote);
      const token = BLOG_TONE_TOKENS[tone].hex;
      const highlighted = applyNaverHighlighter(joinedQuote);

      const standardQuoteTable = `
        <table style="width: 100%; border-left: 4px solid ${token.borderAccent}; background-color: ${token.headerBg}; border-collapse: collapse; margin: 18px 0;">
          <tr>
            <td style="padding: 14px 18px; font-size: 14.5px; line-height: 1.8; color: ${token.headerText};">
              ${highlighted}
            </td>
          </tr>
        </table>
      `.trim();
      blocks.push(standardQuoteTable);
      continue;
    }

    // 9. 불릿 리스트 (- 항목 또는 * 항목)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        const itemVal = lines[i].trim().replace(/^[-*]\s+/, '');
        listItems.push(applyNaverHighlighter(itemVal));
        i++;
      }

      const ulHtml = `<ul style="margin: 12px 0 16px 20px; padding: 0;">` +
        listItems.map(l => `<li style="margin-bottom: 6px; color: #334155; line-height: 1.8; font-size: 15px;">${l}</li>`).join('') +
        `</ul>`;
      blocks.push(ulHtml);
      continue;
    }

    // 9-B. 순서 번호 리스트 (1. 항목, 2. 항목...)
    if (/^\d+\.\s+/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        const itemVal = lines[i].trim().replace(/^\d+\.\s+/, '');
        listItems.push(applyNaverHighlighter(itemVal));
        i++;
      }

      const olHtml = `<ol style="margin: 12px 0 16px 20px; padding: 0;">` +
        listItems.map(l => `<li style="margin-bottom: 6px; color: #334155; line-height: 1.8; font-size: 15px;">${l}</li>`).join('') +
        `</ol>`;
      blocks.push(olHtml);
      continue;
    }

    // 10. 일반 본문 문단 (2~3줄 단위 부드러운 줄간격)
    const pLines: string[] = [];
    while (
      i < lines.length && 
      lines[i].trim() && 
      !lines[i].trim().startsWith('#') && 
      !lines[i].trim().startsWith('>') && 
      !lines[i].trim().startsWith('|') && 
      !lines[i].trim().startsWith('- ') && 
      !lines[i].trim().startsWith('* ') && 
      !/^\d+\.\s+/.test(lines[i].trim()) && 
      !lines[i].trim().includes('Q :') && 
      !lines[i].trim().includes('Q:') && 
      !lines[i].trim().startsWith('■Q') && 
      !lines[i].trim().startsWith('Q.') &&
      !/^(?:[①-⑳]|[1-9]단계)/.test(lines[i].trim())
    ) {
      pLines.push(lines[i].trim());
      i++;
    }

    if (pLines.length > 0) {
      const pText = applyNaverHighlighter(pLines.join('<br/>'));
      blocks.push(`<p style="font-size: 15.5px; line-height: 1.9; color: #27272a; margin-bottom: 16px; word-break: keep-all;">${pText}</p>`);
    }
  }

  // 11. 하단 보상스쿨 공식 배너 이미지 CTA
  const footerHtml = `
    <hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 40px 0 24px 0;" />

    <p style="text-align: center; margin: 30px auto 20px auto;">
      <a href="https://claim-works.com/consultation" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
        <img src="https://claim-works.com/images/bosangschool-cta-banner.png" alt="보상스쿨 보험금 분쟁 무료 상담 신청하기" style="max-width: 100%; width: 620px; height: auto; border-radius: 6px; box-shadow: 0 4px 14px rgba(0,0,0,0.08); display: block; margin: 0 auto;" />
      </a>
    </p>
  `.trim();

  blocks.push(footerHtml);

  return blocks.join('\n');
}

/**
 * 네이버 블로그 스마트에디터 ONE 클립보드에 HTML 리치 텍스트로 복사
 */
export async function copyToNaverClipboard(markdown: string, options: NaverFormatOptions = {}): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const html = convertMarkdownToNaverHtml(markdown, options);
    const plainText = options.title ? `${options.title}\n\n${markdown}` : markdown;

    if (navigator.clipboard && window.ClipboardItem) {
      const htmlBlob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([plainText], { type: 'text/plain' });
      const item = new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob,
      });
      await navigator.clipboard.write([item]);
      return true;
    } else {
      const listener = (e: ClipboardEvent) => {
        e.clipboardData?.setData('text/html', html);
        e.clipboardData?.setData('text/plain', plainText);
        e.preventDefault();
      };
      document.addEventListener('copy', listener);
      document.execCommand('copy');
      document.removeEventListener('copy', listener);
      return true;
    }
  } catch (err) {
    console.error('Failed to copy to Naver clipboard:', err);
    return false;
  }
}
