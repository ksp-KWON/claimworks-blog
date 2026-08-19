/**
 * naver-formatter.ts
 * 네이버 블로그 스마트에디터 ONE(SmartEditor ONE) 전용 6대 인용구 & 무결점 테이블 변환 엔진 2.0
 *
 * [근본적인 네이버 네이티브 6대 인용구 및 레이아웃 아키텍처]
 * 네이버 스마트에디터의 paste sanitizer에 100% 면역된 Table 기반 6대 인용구 툴 매핑:
 *
 * 1. 툴 1: [라인형 인용구 (대제목 H2)]
 *    - 챕터 시작 전 확실한 수평 가로줄(1px 구분선 테이블)
 *    - 좌측 6px 초록 포인트 라인 + #f8fafc 배경 + 19px 대형 볼드
 * 2. 툴 2: [포스트잇/박스형 인용구 (중제목 H3)]
 *    - 좌측 4px 파랑 포인트 라인 + #f8fafc 배경 + 16.5px 중형 볼드 + ■ 포인트
 * 3. 툴 3: [버블/뱃지형 인용구 (소제목 & 솔루션 H6)]
 *    - 연초록(#ecfdf5) 배경 + #a7f3d0 테두리 + 15px 볼드 + ✔ ①, ② 넘버링
 * 4. 툴 4: [따옴표/상하 라인 인용구 (핵심 요약 Summary)]
 *    - 상하 2px 초록 라인 + #f8fafc 배경 + 15px 요약 텍스트
 * 5. 툴 5: [메모/점선형 인용구 (용어사전 Glossary)]
 *    - 연초록(#f0fdf4) 배경 + 1px 초록 점선 테두리 + 💡 용어 설명
 * 6. 툴 6: [체크보드 카드 인용구 (1분 자가진단 Checklist)]
 *    - 헤더(#f1f5f9) + 본문(#f8fafc)의 단일 통합 체크보드 테이블
 *
 * [FAQ 및 비교표]
 * - FAQ Q&A: 상하 2단 파스텔 카드 테이블 (Q: #eff6ff 연파랑 / A: #ffffff 화이트)
 * - 비교표(Table): 표준 테두리 및 가운데 정렬 데이터 테이블
 * - 하단 CTA: 보상스쿨 공식 스마트 링크 배너 테이블
 */

export interface NaverFormatOptions {
  title?: string;
  targetBlog?: 'default' | 'traffic' | 'medical' | 'accident';
}

const LINK_CARDS = {
  default: {
    title: '보상스쿨 | 손해사정 실무 솔루션 & 무료 상담',
    desc: '보험사의 일방적인 삭감·면책 주장, 전문 손해사정사의 객관적인 권익 보호 솔루션',
    url: 'https://claim-works.com',
    badge: '🏛️ 보상스쿨 공식 본진',
  },
  traffic: {
    title: '보상스쿨 1분 자동차사고 합의금 계산기',
    desc: '과실비율, 입원/통원 치료비, 휴업손해, 향후치료비 손해사정 알고리즘 실시간 산정',
    url: 'https://claim-works.com/calculator/auto',
    badge: '🚗 교통사고 실시간 계산기',
  },
  medical: {
    title: '보상스쿨 대법원 보험금 판례 & 분쟁 검색기',
    desc: '실손의료비, 질병진단비, 고지의무, 부책 분쟁 대법원 리딩 판례 실시간 검색',
    url: 'https://claim-works.com/precedent-search',
    badge: '🩺 보험금 판례 검색기',
  },
  accident: {
    title: '보상스쿨 1:1 실시간 비공개 손해사정 채팅 상담',
    desc: '산재·근재·일상생활 배상책임 및 상해 후유장해 1:1 실시간 무료 법률·의학 검토',
    url: 'https://claim-works.com/chat',
    badge: '⚖️ 1:1 실시간 상담창구',
  },
};

/**
 * 키워드 강조를 네이버 시그니처 노란색 형광펜으로 변환
 */
function applyNaverHighlighter(text: string): string {
  if (!text) return '';
  return text.replace(
    /\*\*(.*?)\*\*/g,
    '<strong style="background-color: #fef08a; padding: 2px 4px; border-radius: 2px; color: #111827; font-weight: bold;">$1</strong>'
  );
}

/**
 * 마크다운 텍스트를 네이버 스마트에디터 ONE 전용 HTML로 완벽 변환 (정밀 파서)
 */
export function convertMarkdownToNaverHtml(markdown: string, options: NaverFormatOptions = {}): string {
  const blogType = options.targetBlog || 'default';
  const linkCard = LINK_CARDS[blogType] || LINK_CARDS.default;

  // 1. Frontmatter 및 주석 제거, 줄바꿈 표준화
  let cleanMd = markdown
    .replace(/^---[\s\S]*?---\n*/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/^##\s*💡\s*핵심\s*요약\s*$/gm, '')
    .replace(/^##\s*핵심\s*요약\s*$/gm, '')
    .trim();

  const lines = cleanMd.split('\n');
  const blocks: string[] = [];
  let i = 0;
  let isFirstH2 = true;

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // 0. 빈 줄 건너뛰기
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
        
        // 헤더
        const headers = tableLines[0].split('|').map(s => s.trim()).filter(s => s.length > 0);
        tableHtml += `<thead><tr style="background-color: #f1f5f9;">`;
        headers.forEach(h => {
          tableHtml += `<th style="padding: 10px 12px; font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1; text-align: center; vertical-align: middle; background-color: #f1f5f9;">${h}</th>`;
        });
        tableHtml += `</tr></thead><tbody>`;

        // 데이터 행
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

    // 2. 대제목 H2 (## ...) ➔ 상단 확실한 가로 구분선 + [라인형 인용구 툴 1]
    if (trimmed.startsWith('## ')) {
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
              <p style="font-size: 19px; font-weight: bold; color: #0f172a; margin: 0; line-height: 1.4;">
                📌 <strong>${titleText}</strong>
              </p>
            </td>
          </tr>
        </table>
      `;
      blocks.push(h2Html);
      i++;
      continue;
    }

    // 3. 중제목 H3 (### ...) ➔ [포스트잇/박스형 인용구 툴 2]
    if (trimmed.startsWith('### ')) {
      const titleText = trimmed.replace(/^###\s+/, '').trim();
      const h3Html = `
        <table style="width: 100%; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; background-color: #f8fafc; border-collapse: collapse; margin: 26px 0 12px 0;">
          <tr>
            <td style="padding: 10px 16px;">
              <p style="font-size: 16.5px; font-weight: bold; color: #1e293b; margin: 0; line-height: 1.4;">
                <span style="color: #3b82f6; margin-right: 6px;">■</span><strong>${titleText}</strong>
              </p>
            </td>
          </tr>
        </table>
      `;
      blocks.push(h3Html);
      i++;
      continue;
    }

    // 4. 소제목 / 솔루션 H6 (###### ...) ➔ [버블/뱃지형 인용구 툴 3] (핵심솔루션 문구 삭제, ✔ ①, ②...)
    if (trimmed.startsWith('###### ') || trimmed.startsWith('#### ') || trimmed.startsWith('##### ')) {
      let titleText = trimmed.replace(/^#{4,6}\s+/, '').trim();
      titleText = titleText.replace(/^핵심\s*솔루션\s*/, '');

      const h6Html = `
        <table style="width: 100%; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-collapse: collapse; margin: 20px 0 10px 0;">
          <tr>
            <td style="padding: 10px 14px;">
              <p style="font-size: 15px; font-weight: bold; color: #065f46; margin: 0;">
                <span style="color: #059669; margin-right: 6px;">✔</span><strong>${titleText}</strong>
              </p>
            </td>
          </tr>
        </table>
      `;
      blocks.push(h6Html);
      i++;
      continue;
    }

    // 5. FAQ (Q&A) 질문-답변 블록 ➔ [상하 2단 파스텔 카드 테이블]
    if (trimmed.includes('Q :') || trimmed.includes('Q:') || trimmed.startsWith('■Q') || trimmed.startsWith('Q.')) {
      let qText = trimmed.replace(/^[■\s]*Q\s*[:.]\s*/, '').trim();
      let aText = '';
      i++;

      // 다음 답변 행 찾기
      while (i < lines.length && !lines[i].trim().includes('Q :') && !lines[i].trim().includes('Q:') && !lines[i].trim().startsWith('■Q') && !lines[i].trim().startsWith('Q.') && !lines[i].trim().startsWith('##')) {
        const lineVal = lines[i].trim();
        if (lineVal.startsWith('A :') || lineVal.startsWith('A:') || lineVal.startsWith('A.')) {
          aText += (aText ? '<br/>' : '') + lineVal.replace(/^A\s*[:.]\s*/, '').trim();
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
              ❓ ${qHighlighted}
            </td>
          </tr>
          <tr>
            <td style="padding: 14px 16px; background-color: #ffffff; color: #334155; line-height: 1.85;">
              💡 ${aHighlighted}
            </td>
          </tr>
        </table>
      `;
      blocks.push(faqTable);
      continue;
    }

    // 6. 인용구 블록 (> ...)
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, '').trim());
        i++;
      }

      // 6-A. 1분 자가진단 체크리스트 ➔ [체크보드 카드 인용구 툴 6]
      if (quoteLines.some(l => l.startsWith('- [ ]') || l.startsWith('- [x]'))) {
        const checkItems = quoteLines.map(l => {
          const itemText = l.replace(/^- \[( |x)\]\s*/, '');
          const highlighted = applyNaverHighlighter(itemText);
          return `<div style="margin: 6px 0; font-size: 14px; color: #334155; line-height: 1.6;"><span style="color: #059669; font-weight: bold; margin-right: 6px;">☑️</span>${highlighted}</div>`;
        }).join('');

        const checklistTable = `
          <table style="width: 100%; border: 1px solid #cbd5e1; border-collapse: collapse; margin: 22px 0; font-size: 14px;">
            <tr>
              <td style="padding: 11px 16px; background-color: #f1f5f9; border-bottom: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">
                📋 <strong>1분 자가진단 체크리스트</strong>
              </td>
            </tr>
            <tr>
              <td style="padding: 14px 16px; background-color: #f8fafc; color: #334155; line-height: 1.8;">
                ${checkItems}
              </td>
            </tr>
          </table>
        `;
        blocks.push(checklistTable);
        continue;
      }

      // 6-B. 인라인 용어사전 (💡 ...) ➔ [메모/점선형 인용구 툴 5]
      const joinedQuote = quoteLines.join('<br/>');
      if (joinedQuote.includes('💡') || joinedQuote.includes('용어')) {
        const highlighted = applyNaverHighlighter(joinedQuote);
        const glossaryTable = `
          <table style="width: 100%; border: 1px dashed #86efac; background-color: #f0fdf4; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 12px 18px; font-size: 14px; color: #166534; line-height: 1.75;">
                ${highlighted}
              </td>
            </tr>
          </table>
        `;
        blocks.push(glossaryTable);
        continue;
      }

      // 6-C. 핵심 요약 (상하 초록 라인) ➔ [따옴표/상하 라인 인용구 툴 4]
      const summaryHighlighted = applyNaverHighlighter(joinedQuote);
      const summaryTable = `
        <table style="width: 100%; border-top: 2px solid #03c75a; border-bottom: 2px solid #03c75a; background-color: #f8fafc; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 16px 20px; font-size: 14.5px; line-height: 1.8; color: #334155;">
              ${summaryHighlighted}
            </td>
          </tr>
        </table>
      `;
      blocks.push(summaryTable);
      continue;
    }

    // 7. 불릿 리스트 (- 항목 또는 * 항목)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        const itemVal = lines[i].trim().replace(/^[-*]\s+/, '');
        listItems.push(applyNaverHighlighter(itemVal));
        i++;
      }

      const ulHtml = `<ul style="margin: 12px 0 16px 20px; padding: 0;">` +
        listItems.map(l => `<li style="margin-bottom: 6px; color: #334155; line-height: 1.7; font-size: 14.5px;">${l}</li>`).join('') +
        `</ul>`;
      blocks.push(ulHtml);
      continue;
    }

    // 8. 일반 본문 문단 (2~3줄 단위 부드러운 줄간격)
    const pLines: string[] = [];
    while (i < lines.length && lines[i].trim() && !lines[i].trim().startsWith('#') && !lines[i].trim().startsWith('>') && !lines[i].trim().startsWith('|') && !lines[i].trim().startsWith('- ') && !lines[i].trim().startsWith('* ') && !lines[i].trim().includes('Q :') && !lines[i].trim().includes('Q:') && !lines[i].trim().startsWith('■Q') && !lines[i].trim().startsWith('Q.')) {
      pLines.push(lines[i].trim());
      i++;
    }

    if (pLines.length > 0) {
      const pText = applyNaverHighlighter(pLines.join('<br/>'));
      blocks.push(`<p style="font-size: 15px; line-height: 1.85; color: #27272a; margin-bottom: 16px; word-break: keep-all;">${pText}</p>`);
    }
  }

  // 9. 하단 보상스쿨 스마트 링크 배너 테이블
  const footerHtml = `
    <table style="width: 100%; border: 0; border-collapse: collapse; margin: 40px 0 24px 0;">
      <tr><td style="border-top: 1px solid #cbd5e1; height: 1px; padding: 0;"></td></tr>
    </table>
    <table style="width: 100%; border: 2px solid #03c75a; border-collapse: collapse; margin-top: 24px; background-color: #f8fafc; text-align: center;">
      <tr>
        <td style="padding: 22px 20px;">
          <p style="font-size: 12px; font-weight: bold; color: #03c75a; margin: 0 0 6px 0;">${linkCard.badge}</p>
          <p style="font-size: 17px; font-weight: bold; color: #0f172a; margin: 0 0 6px 0;"><strong>${linkCard.title}</strong></p>
          <p style="font-size: 13.5px; color: #64748b; margin: 0 0 16px 0; line-height: 1.5;">${linkCard.desc}</p>
          <p style="margin: 0;"><a href="${linkCard.url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 10px 24px; background-color: #03c75a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: bold; border-radius: 6px;">👉 ${linkCard.url.replace('https://', '')} 바로가기</a></p>
        </td>
      </tr>
    </table>
  `;

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
