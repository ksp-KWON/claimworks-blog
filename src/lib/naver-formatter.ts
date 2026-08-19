/**
 * naver-formatter.ts
 * 네이버 블로그 스마트에디터 ONE(SmartEditor ONE) 전용 무결점 테이블 & 인용구 변환 엔진
 *
 * [핵심 아키텍처: 오류 없는 표(Table) 기반 카드 레이아웃]
 * 1. 무결점 표(Table) 기반 레이아웃:
 *    - 네이버 에디터에서 왜곡이나 서식 깨짐이 전혀 없는 <table>을 핵심 컨테이너로 채택.
 *    - FAQ: 상하 2단 파스텔 카드 테이블 (Q: #eff6ff 연파랑 배경 / A: #ffffff 화이트 배경).
 *    - 1분 자가진단: 헤더(#f1f5f9) + 내용(#f8fafc)의 단일 라운드 체크 카드 테이블.
 *    - 용어사전/요약: 좌측 초록 라인 + 연초록(#f0fdf4) 배경의 안전한 카드 테이블.
 *    - 하단 CTA 배너: 2px 초록 테두리 공식 배너 테이블.
 * 2. 인용구 툴 기반 헤딩 위계:
 *    - 대제목(H2): 상단 구분선(<hr>) + 좌측 초록 라인 인용구 박스 + 19px 대형 볼드.
 *    - 중제목(H3): 17px 중형 볼드 + 포인트 불릿(■).
 *    - 소제목/솔루션(H6): 15.5px 포인트 볼드 + 넘버링(✔ ①, ②...).
 * 3. 형광펜 및 호흡:
 *    - 노란색 형광펜(#fef08a) 키워드 하이라이트.
 *    - 2~3줄 단위의 부드러운 줄간격(1.85) 유지.
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
  return text.replace(
    /\*\*(.*?)\*\*/g,
    '<strong style="background-color: #fef08a; padding: 2px 4px; border-radius: 2px; color: #111827; font-weight: bold;">$1</strong>'
  );
}

/**
 * 마크다운 텍스트를 네이버 스마트에디터 ONE 전용 HTML로 정밀 변환
 */
export function convertMarkdownToNaverHtml(markdown: string, options: NaverFormatOptions = {}): string {
  const blogType = options.targetBlog || 'default';
  const linkCard = LINK_CARDS[blogType] || LINK_CARDS.default;

  // Frontmatter 및 주석 제거
  let cleanMd = markdown
    .replace(/^---[\s\S]*?---\n*/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/^##\s*💡\s*핵심\s*요약\s*$/gm, '')
    .replace(/^##\s*핵심\s*요약\s*$/gm, '')
    .trim();

  const rawSections = cleanMd.split(/\n{2,}/);
  const formattedSections: string[] = [];

  let isFirstH2 = true;

  for (let section of rawSections) {
    section = section.trim();
    if (!section) continue;

    // A. 마크다운 비교표 (| 구분 | 내용 | ...)
    if (section.includes('|') && section.split('\n').filter(l => l.includes('|')).length >= 2) {
      const lines = section.split('\n').map(l => l.trim()).filter(l => l.startsWith('|') && l.endsWith('|'));
      if (lines.length >= 2) {
        let tableHtml = `<table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; margin: 24px 0; font-size: 13.5px; line-height: 1.5;">`;
        
        // 헤더 행
        const headers = lines[0].split('|').map(s => s.trim()).filter(s => s.length > 0);
        tableHtml += `<thead><tr style="background-color: #f1f5f9;">`;
        headers.forEach(h => {
          tableHtml += `<th style="padding: 10px 12px; font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1; text-align: center; vertical-align: middle; background-color: #f1f5f9;">${h}</th>`;
        });
        tableHtml += `</tr></thead><tbody>`;

        // 데이터 행
        const rows = lines.slice(2);
        rows.forEach((row, rIdx) => {
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
        formattedSections.push(tableHtml);
        continue;
      }
    }

    // B. 대주제 H2 (## ...) -> 구분선을 제목 '앞'에 배치 + 안정적인 라인형 인용구 헤딩
    if (section.startsWith('## ')) {
      const titleText = section.replace(/^##\s+/, '').trim();
      const divider = isFirstH2 ? '' : `<hr style="border: 0; height: 1px; background-color: #e2e8f0; margin: 40px 0 24px 0;" />`;
      isFirstH2 = false;

      formattedSections.push(
        `${divider}<blockquote style="margin: 0 0 16px 0; padding: 12px 18px; border-left: 5px solid #03c75a; background-color: #f8fafc;"><p style="font-size: 19px; font-weight: bold; color: #0f172a; margin: 0; line-height: 1.4;">📌 <strong>${titleText}</strong></p></blockquote>`
      );
      continue;
    }

    // C. 중주제 H3 (### ...) -> 네이버 포인트 불릿(■) + 17px 중형 볼드 폰트
    if (section.startsWith('### ')) {
      const titleText = section.replace(/^###\s+/, '').trim();
      formattedSections.push(
        `<p style="font-size: 17px; font-weight: bold; color: #1e293b; margin-top: 28px; margin-bottom: 10px; line-height: 1.4;"><span style="color: #03c75a; margin-right: 6px;">■</span><strong>${titleText}</strong></p>`
      );
      continue;
    }

    // D. 솔루션 단계 H6 (###### ...) -> 번호 중심(✔ ①, ②...) 간결화
    if (section.startsWith('###### ')) {
      let titleText = section.replace(/^######\s+/, '').trim();
      titleText = titleText.replace(/^핵심\s*솔루션\s*/, '');

      formattedSections.push(
        `<p style="font-size: 15.5px; font-weight: bold; color: #065f46; margin-top: 22px; margin-bottom: 8px; line-height: 1.4;"><span style="color: #059669; margin-right: 4px;">✔</span><strong>${titleText}</strong></p>`
      );
      continue;
    }

    // E. FAQ (Q&A) -> [상하 2단 파스텔 카드 테이블] 렌더링
    if (section.includes('Q :') || section.includes('Q:') || section.startsWith('■Q') || section.startsWith('Q.')) {
      const lines = section.split('\n').map(l => l.trim()).filter(Boolean);
      let currentQ = '';
      let currentA = '';
      let faqTables = '';

      const flushQA = () => {
        if (currentQ) {
          const qText = applyNaverHighlighter(currentQ);
          const aText = applyNaverHighlighter(currentA);
          faqTables += `
            <table style="width: 100%; border: 1px solid #bfdbfe; border-collapse: collapse; margin: 16px 0; font-size: 14px; border-radius: 6px;">
              <tr>
                <td style="padding: 12px 16px; background-color: #eff6ff; border-bottom: 1px solid #bfdbfe; font-weight: bold; color: #1e40af; line-height: 1.5;">
                  ❓ ${qText}
                </td>
              </tr>
              <tr>
                <td style="padding: 14px 16px; background-color: #ffffff; color: #334155; line-height: 1.8;">
                  💡 ${aText}
                </td>
              </tr>
            </table>
          `;
          currentQ = '';
          currentA = '';
        }
      };

      for (const line of lines) {
        if (line.includes('Q :') || line.includes('Q:') || line.startsWith('■Q') || line.startsWith('Q.')) {
          flushQA();
          currentQ = line.replace(/^[■\s]*Q\s*[:.]\s*/, '');
        } else if (line.startsWith('A :') || line.startsWith('A:') || line.startsWith('A.')) {
          currentA = line.replace(/^A\s*[:.]\s*/, '');
        } else if (currentA) {
          currentA += '<br/>' + line;
        } else if (currentQ) {
          currentQ += ' ' + line;
        }
      }
      flushQA();

      formattedSections.push(faqTables);
      continue;
    }

    // F. 인용구 / 용어사전 / 체크리스트 (> ...)
    if (section.startsWith('>')) {
      const quoteLines = section.split('\n').map(l => l.replace(/^>\s?/, '').trim()).filter(Boolean);
      
      // 체크리스트인 경우 -> 단일 라운드 체크 카드 테이블
      if (quoteLines.some(l => l.startsWith('- [ ]') || l.startsWith('- [x]'))) {
        const checkItems = quoteLines.map(l => {
          const itemText = l.replace(/^- \[( |x)\]\s*/, '');
          const highlighted = applyNaverHighlighter(itemText);
          return `<div style="margin: 6px 0; font-size: 14px; color: #334155; line-height: 1.6;"><span style="color: #059669; font-weight: bold; margin-right: 6px;">☑️</span>${highlighted}</div>`;
        }).join('');

        formattedSections.push(`
          <table style="width: 100%; border: 1px solid #cbd5e1; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
            <tr>
              <td style="padding: 10px 16px; background-color: #f1f5f9; border-bottom: 1px solid #cbd5e1; font-weight: bold; color: #0f172a;">
                📋 <strong>1분 자가진단 체크리스트</strong>
              </td>
            </tr>
            <tr>
              <td style="padding: 14px 16px; background-color: #f8fafc; color: #334155; line-height: 1.8;">
                ${checkItems}
              </td>
            </tr>
          </table>
        `);
      } else {
        // 일반 인용구 / 핵심 요약 / 용어 사전 -> [견고한 초록 라인 카드 테이블]
        const quoteContent = quoteLines.join('<br/>');
        const highlighted = applyNaverHighlighter(quoteContent);
        formattedSections.push(`
          <table style="width: 100%; border-left: 5px solid #03c75a; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; border-collapse: collapse; margin: 18px 0; font-size: 14.5px; background-color: #f0fdf4;">
            <tr>
              <td style="padding: 14px 18px; color: #166534; line-height: 1.75;">
                ${highlighted}
              </td>
            </tr>
          </table>
        `);
      }
      continue;
    }

    // G. 리스트 (- 항목)
    if (section.startsWith('- ') || section.startsWith('* ')) {
      const listItems = section.split('\n')
        .map(l => l.replace(/^[-*]\s+/, '').trim())
        .filter(Boolean)
        .map(l => {
          const highlighted = applyNaverHighlighter(l);
          return `<li style="margin-bottom: 6px; color: #334155; line-height: 1.7; font-size: 14.5px;">${highlighted}</li>`;
        }).join('');
      formattedSections.push(`<ul style="margin: 10px 0 16px 20px; padding: 0;">${listItems}</ul>`);
      continue;
    }

    // H. 일반 본문 문단 (2~3줄 단위 부드러운 줄간격)
    let pContent = applyNaverHighlighter(section)
      .replace(/\n/g, '<br/>');

    formattedSections.push(
      `<p style="font-size: 15px; line-height: 1.85; color: #27272a; margin-bottom: 16px; word-break: keep-all;">${pContent}</p>`
    );
  }

  // 11. 하단 보상스쿨 스마트 링크 배너 (무결점 공식 테이블 배너)
  const footerHtml = `
    <hr style="border: 0; height: 1px; background-color: #e2e8f0; margin: 40px 0 24px 0;" />
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

  formattedSections.push(footerHtml);

  return formattedSections.join('\n');
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
