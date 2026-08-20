/**
 * naver-formatter.ts
 * 네이버 블로그 스마트에디터 ONE(SmartEditor ONE) 전용 6대 인용구 & 무결점 테이블 변환 엔진 2.0
 *
 * [핵심 아키텍처: 오류 없는 표(Table) 기반 카드 레이아웃]
 * 1. 무결점 표(Table) 기반 레이아웃:
 *    - 네이버 에디터에서 왜곡이나 서식 깨짐이 전혀 없는 <table>을 핵심 컨테이너로 채택.
 *    - FAQ: 상하 2단 파스텔 카드 테이블 (Q: #eff6ff 연파랑 / A: #ffffff 화이트).
 *    - 1분 자가진단: 헤더(#f1f5f9) + 내용(#f8fafc)의 단일 통합 체크보드 테이블.
 *    - 용어사전/요약: 좌측 초록 라인 + 연초록(#f0fdf4) 배경의 안전한 카드 테이블.
 *    - 하단 CTA 배너: 스크린샷과 100% 동일한 [공식 썸네일 이미지 + 타이틀 + 설명 + 초록 URL]의 스마트 OG 프리뷰 카드 테이블.
 * 2. 인용구 툴 기반 헤딩 위계:
 *    - 대제목(H2): 상단 구분선(<hr>) + 좌측 초록 라인 인용구 박스 + 19px 대형 볼드.
 *    - 중제목(H3): 16.5px 중형 볼드 + 포인트 불릿(■).
 *    - 소제목/솔루션(H6): 15px 포인트 볼드 + 넘버링(✔ ①, ②...).
 * 3. 형광펜 및 호흡:
 *    - 노란색 형광펜(#fef08a) 키워드 하이라이트.
 *    - 2~3줄 단위의 부드러운 줄간격(1.85) 유지.
 */

export interface NaverFormatOptions {
  title?: string;
  targetBlog?: 'default' | 'traffic' | 'medical' | 'accident';
}

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
 * 
 * [표준 출력 위계 (W3C & 네이버 스마트에디터 완벽 호환)]
 * 1. 최상단 시작 가로선 (<hr>)
 * 2. 핵심 요약 박스 (연초록 카드 테이블)
 * 3. 공감 오프닝 서술 문단
 * 4. 중간 가로 구분선 (<hr>)
 * 5. 본문 1번 (## H2 대제목)부터 순차적 본문 렌더링
 * 6. 하단 보상스쿨 공식 4대 통합 CTA 카드 배너
 */
export function convertMarkdownToNaverHtml(markdown: string, options: NaverFormatOptions = {}): string {
  // 1. Frontmatter 및 주석 제거, 줄바꿈 표준화
  let cleanMd = markdown
    .replace(/^---[\s\S]*?---\n*/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

  // 2. 핵심 요약 (Key Points) 추출
  let keyPoints: string[] = [];
  const keyPointsHeaderRegex = /##\s*(?:💡|🎯)?\s*핵심\s*요약(?:[^\n]*)\n+((?:[ \t]*>?[ \t]*[-*+].*\n*)+)/i;
  const keyPointsMatch = cleanMd.match(keyPointsHeaderRegex);

  if (keyPointsMatch) {
    const rawBullets = keyPointsMatch[1];
    keyPoints = rawBullets
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .map(l => l.replace(/^(?:>\s*)?[-*+]\s*/, '').trim())
      .filter(l => l.length > 0 && !l.startsWith('[ ]') && !l.startsWith('[x]'));

    // cleanMd에서 해당 헤더와 불릿 블록 제거
    cleanMd = cleanMd.replace(keyPointsMatch[0], '\n\n');
  }

  // 3. 첫 번째 본문 대제목(## H2) 찾기 (핵심 요약 헤더는 이미 제거됨)
  const firstH2Match = cleanMd.match(/^##\s+.+$/m);
  let openingText = '';
  let bodyMd = cleanMd;

  if (firstH2Match && firstH2Match.index !== undefined) {
    const introPart = cleanMd.slice(0, firstH2Match.index).trim();
    bodyMd = cleanMd.slice(firstH2Match.index).trim();

    // introPart에서 혹시 keyPoints가 아직 안 뽑혔는데 `> - ...` 가 있다면 추출
    if (keyPoints.length === 0) {
      const quoteMatches = introPart.match(/^>[ \t]*[-*+](.+)$/gm);
      if (quoteMatches) {
        keyPoints = quoteMatches.map(m => m.replace(/^>[ \t]*[-*+]\s*/, '').trim());
      }
    }

    // introPart에서 일반 오프닝 문단만 추출
    const introLines = introPart.split('\n')
      .map(l => l.trim())
      .filter(l => {
        if (!l) return false;
        if (l.startsWith('>')) return false; // 인용구는 오프닝에서 제외
        if (l.startsWith('#')) return false;
        if (l.startsWith('|')) return false;
        if (l.startsWith('[') && l.includes('](')) return false; // 단독 링크 줄 제외
        if (l.startsWith('![')) return false; // 단독 이미지 줄 제외
        return true;
      });
    openingText = introLines.join('<br/>');
  } else {
    // H2가 없는 경우
    openingText = cleanMd;
    bodyMd = '';
  }

  const blocks: string[] = [];

  // ── [1단계] 처음 시작할 때 최상단 가로선 ──
  blocks.push(`
    <table style="width: 100%; border: 0; border-collapse: collapse; margin: 10px 0 20px 0;">
      <tr><td style="border-top: 1px solid #cbd5e1; height: 1px; padding: 0;"></td></tr>
    </table>
  `.trim());

  // ── [2단계] 그 다음 핵심요약 박스 ──
  if (keyPoints.length > 0) {
    const itemsHtml = keyPoints.map(item => {
      const highlighted = applyNaverHighlighter(item);
      return `<div style="margin: 6px 0; font-size: 14.5px; color: #166534; line-height: 1.8;"><span style="color: #059669; font-weight: bold; margin-right: 8px;">•</span>${highlighted}</div>`;
    }).join('');

    const summaryBoxHtml = `
      <table style="width: 100%; border: 1.5px solid #10b981; background-color: #f0fdf4; border-collapse: collapse; margin: 16px 0 20px 0; border-radius: 6px;">
        <tr>
          <td style="padding: 16px 20px;">
            ${itemsHtml}
          </td>
        </tr>
      </table>
    `.trim();
    blocks.push(summaryBoxHtml);
  }

  // ── [3단계] 그 다음 오프닝 문단 ──
  if (openingText) {
    const highlightedOpening = applyNaverHighlighter(openingText);
    blocks.push(`<p style="font-size: 15.5px; line-height: 1.9; color: #27272a; margin: 20px 0; word-break: keep-all;">${highlightedOpening}</p>`);
  }

  // ── [4단계] 그 다음 가로선 (본문 1번 시작 직전) ──
  blocks.push(`
    <table style="width: 100%; border: 0; border-collapse: collapse; margin: 32px 0 24px 0;">
      <tr><td style="border-top: 1px solid #cbd5e1; height: 1px; padding: 0;"></td></tr>
    </table>
  `.trim());

  // ── [5단계] 그 다음 본문 1번 시작부터 나머지 본문 파싱 ──
  const lines = bodyMd.split('\n');
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

    // 3. 중제목 H3 (### ...) ➔ [포스트잇/박스형 인용구 툴 2] (FAQ Q 라인은 FAQ 파서로 위임)
    if (trimmed.startsWith('### ') && !trimmed.includes('Q :') && !trimmed.includes('Q:') && !trimmed.startsWith('### Q')) {
      const titleText = trimmed.replace(/^###\s+/, '').trim();
      const h3Html = `
        <table style="width: 100%; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; background-color: #f8fafc; border-collapse: collapse; margin: 26px 0 12px 0;">
          <tr>
            <td style="padding: 10px 15px;">
              <span style="font-size: 16.5px; font-weight: bold; color: #1e3a8a;">
                ■ <strong>${titleText}</strong>
              </span>
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
    const cleanQLine = trimmed.replace(/^###\s+/, '');
    if (cleanQLine.includes('Q :') || cleanQLine.includes('Q:') || cleanQLine.startsWith('■Q') || cleanQLine.startsWith('Q.')) {
      let qText = cleanQLine.replace(/^[■\s]*Q\s*[:.]\s*/, '').trim();
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
        const checkItems = quoteLines
          .filter(l => (l.startsWith('- [ ]') || l.startsWith('- [x]')) && !/^[-=_*~]{2,}$/.test(l.replace(/^- \[( |x)\]\s*/, '').trim()))
          .map(l => {
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
        listItems.map(l => `<li style="margin-bottom: 6px; color: #334155; line-height: 1.8; font-size: 15px;">${l}</li>`).join('') +
        `</ul>`;
      blocks.push(ulHtml);
      continue;
    }

    // 7-B. 순서 번호 리스트 (1. 항목, 2. 항목...)
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

    // 8. 일반 본문 문단 (2~3줄 단위 부드러운 줄간격)
    const pLines: string[] = [];
    while (i < lines.length && lines[i].trim() && !lines[i].trim().startsWith('#') && !lines[i].trim().startsWith('>') && !lines[i].trim().startsWith('|') && !lines[i].trim().startsWith('- ') && !lines[i].trim().startsWith('* ') && !/^\d+\.\s+/.test(lines[i].trim()) && !lines[i].trim().includes('Q :') && !lines[i].trim().includes('Q:') && !lines[i].trim().startsWith('■Q') && !lines[i].trim().startsWith('Q.')) {
      pLines.push(lines[i].trim());
      i++;
    }

    if (pLines.length > 0) {
      const pText = applyNaverHighlighter(pLines.join('<br/>'));
      blocks.push(`<p style="font-size: 15.5px; line-height: 1.9; color: #27272a; margin-bottom: 16px; word-break: keep-all;">${pText}</p>`);
    }
  }

  // 9. 하단 보상스쿨 공식 4대 CTA 프리미엄 박스 테이블 (네이버 스마트에디터 완벽 호환)
  const footerHtml = `
    <table style="width: 100%; border: 0; border-collapse: collapse; margin: 40px 0 24px 0;">
      <tr><td style="border-top: 1px solid #cbd5e1; height: 1px; padding: 0;"></td></tr>
    </table>

    <table style="width: 100%; max-width: 680px; margin: 28px auto 20px auto; border: 1.5px solid #3b82f6; border-collapse: separate; border-radius: 8px; background-color: #ffffff; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.08);">
      <tr>
        <td style="padding: 24px 20px;">
          <!-- 1. 헤더 타이틀 영역 -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
            <tr>
              <td style="border-left: 4px solid #2563eb; padding-left: 10px;">
                <p style="margin: 0; font-size: 16.5px; font-weight: bold; color: #0f172a; line-height: 1.4;">
                  <span style="font-size: 17px; margin-right: 4px;">🤝</span><strong>정당한 권리, 보상스쿨과 함께라면 결과가 달라집니다.</strong>
                </p>
              </td>
            </tr>
          </table>
          <p style="margin: 0 0 18px 14px; font-size: 13px; color: #64748b; line-height: 1.5;">
            수많은 성공 사례로 증명된 전문 손해사정사가 최적의 해답을 제시해 드립니다.
          </p>

          <!-- 2. 2x2 링크 카드 그리드 테이블 -->
          <table style="width: 100%; border-collapse: separate; border-spacing: 8px 10px;">
            <tr>
              <!-- 카드 1: 실시간 채팅상담 -->
              <td style="width: 50%; padding: 0; vertical-align: middle;">
                <a href="https://claim-works.com/chat" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: block;">
                  <table style="width: 100%; background-color: #f8fafc; border: 1px solid #e2e8f0; border-collapse: collapse; border-radius: 6px;">
                    <tr>
                      <td style="width: 46px; padding: 12px 8px; background-color: #eff6ff; text-align: center; vertical-align: middle; border-right: 1px solid #dbeafe;">
                        <span style="font-size: 20px;">💬</span>
                      </td>
                      <td style="padding: 10px 14px; vertical-align: middle;">
                        <div style="font-size: 14px; font-weight: bold; color: #2563eb; margin-bottom: 2px; line-height: 1.2;">실시간 채팅상담</div>
                        <div style="font-size: 11.5px; color: #64748b; line-height: 1.2;">보상스쿨 실시간 상담</div>
                      </td>
                    </tr>
                  </table>
                </a>
              </td>

              <!-- 카드 2: 전화상담 신청서 -->
              <td style="width: 50%; padding: 0; vertical-align: middle;">
                <a href="https://claim-works.com/consultation" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: block;">
                  <table style="width: 100%; background-color: #f8fafc; border: 1px solid #e2e8f0; border-collapse: collapse; border-radius: 6px;">
                    <tr>
                      <td style="width: 46px; padding: 12px 8px; background-color: #ecfdf5; text-align: center; vertical-align: middle; border-right: 1px solid #d1fae5;">
                        <span style="font-size: 20px;">📞</span>
                      </td>
                      <td style="padding: 10px 14px; vertical-align: middle;">
                        <div style="font-size: 14px; font-weight: bold; color: #059669; margin-bottom: 2px; line-height: 1.2;">전화상담 신청서</div>
                        <div style="font-size: 11.5px; color: #64748b; line-height: 1.2;">전문 손해사정사 전화예약</div>
                      </td>
                    </tr>
                  </table>
                </a>
              </td>
            </tr>

            <tr>
              <!-- 카드 3: 예상 합의금 계산기 -->
              <td style="width: 50%; padding: 0; vertical-align: middle;">
                <a href="https://claim-works.com/calculator/auto" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: block;">
                  <table style="width: 100%; background-color: #f8fafc; border: 1px solid #e2e8f0; border-collapse: collapse; border-radius: 6px;">
                    <tr>
                      <td style="width: 46px; padding: 12px 8px; background-color: #eff6ff; text-align: center; vertical-align: middle; border-right: 1px solid #dbeafe;">
                        <span style="font-size: 20px;">🧮</span>
                      </td>
                      <td style="padding: 10px 14px; vertical-align: middle;">
                        <div style="font-size: 14px; font-weight: bold; color: #2563eb; margin-bottom: 2px; line-height: 1.2;">예상 합의금 계산기</div>
                        <div style="font-size: 11.5px; color: #64748b; line-height: 1.2;">1분 실시간 보상금 산정</div>
                      </td>
                    </tr>
                  </table>
                </a>
              </td>

              <!-- 카드 4: 보상스쿨 TV -->
              <td style="width: 50%; padding: 0; vertical-align: middle;">
                <a href="https://www.youtube.com/@bosangschool" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: block;">
                  <table style="width: 100%; background-color: #f8fafc; border: 1px solid #e2e8f0; border-collapse: collapse; border-radius: 6px;">
                    <tr>
                      <td style="width: 46px; padding: 12px 8px; background-color: #fef2f2; text-align: center; vertical-align: middle; border-right: 1px solid #fee2e2;">
                        <span style="font-size: 20px;">▶️</span>
                      </td>
                      <td style="padding: 10px 14px; vertical-align: middle;">
                        <div style="font-size: 14px; font-weight: bold; color: #dc2626; margin-bottom: 2px; line-height: 1.2;">보상스쿨 TV</div>
                        <div style="font-size: 11.5px; color: #64748b; line-height: 1.2;">유튜브 바로가기</div>
                      </td>
                    </tr>
                  </table>
                </a>
              </td>
            </tr>
          </table>
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
