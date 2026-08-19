/**
 * naver-formatter.ts
 * 네이버 블로그 스마트에디터 ONE 전용 리치 텍스트(HTML) 변환 및 스마트 클립보드 복사 엔진
 *
 * [핵심 설계]
 * — W3C 마크다운 본문을 네이버 스마트에디터 ONE이 가장 완벽하게 인식하는 인라인 스타일 HTML로 변환
 * — 표(Table), 인용구(Quote 박스), 체크리스트, 헤딩(H2/H3), 본문 문단(2~3줄 호흡) 완벽 보존
 * — 네이버 D.I.A.+ 가이드라인에 따른 '보상스쿨 링크 카드(계산기/판례/챗봇)' 자동 부착
 * — navigator.clipboard.write API(text/html + text/plain)를 통해 Ctrl+V 시 디자인 100% 유지
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
 * 마크다운 텍스트를 네이버 스마트에디터 ONE 전용 HTML로 정밀 변환
 */
export function convertMarkdownToNaverHtml(markdown: string, options: NaverFormatOptions = {}): string {
  const blogType = options.targetBlog || 'default';
  const linkCard = LINK_CARDS[blogType] || LINK_CARDS.default;

  let html = markdown
    // Frontmatter 제거
    .replace(/^---[\s\S]*?---\n*/, '')
    // HTML 주석 제거
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();

  // 1. 헤딩 변환 (H2 -> 네이버 세련된 섹션 소제목)
  html = html.replace(/^## (.*?)$/gm, (match, p1) => {
    return `<div style="margin-top: 32px; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 2px solid #03c75a;"><h2 style="font-size: 20px; font-weight: bold; color: #111827; margin: 0; line-height: 1.4;">${p1}</h2></div>`;
  });

  // 2. 서브 헤딩 변환 (H3 -> 네이버 서브 타이틀)
  html = html.replace(/^### (.*?)$/gm, (match, p1) => {
    return `<div style="margin-top: 24px; margin-bottom: 10px;"><h3 style="font-size: 17px; font-weight: bold; color: #1f2937; margin: 0; line-height: 1.4;">📌 ${p1}</h3></div>`;
  });

  // 3. 다단계 솔루션 헤딩 변환 (H6 -> 네이버 넘버링 솔루션 뱃지)
  html = html.replace(/^###### (.*?)$/gm, (match, p1) => {
    return `<div style="margin-top: 20px; margin-bottom: 8px; padding: 6px 12px; background-color: #ecfdf5; border-left: 4px solid #059669; border-radius: 4px;"><h4 style="font-size: 15px; font-weight: bold; color: #065f46; margin: 0;">${p1}</h4></div>`;
  });

  // 4. 자가진단 체크리스트 변환 (> - [ ] ...)
  html = html.replace(/^> - \[( |x)\] (.*?)$/gm, (match, p1, p2) => {
    return `<div style="display: flex; align-items: center; margin-bottom: 8px; padding: 8px 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; color: #334155;"><span style="color: #03c75a; font-weight: bold; margin-right: 8px;">☑️</span><span>${p2}</span></div>`;
  });

  // 5. 인용구 및 인라인 용어사전 (> ...)
  html = html.replace(/^> (.*?)$/gm, (match, p1) => {
    return `<div style="margin: 16px 0; padding: 14px 18px; background-color: #f0fdf4; border-left: 4px solid #03c75a; border-radius: 6px; font-size: 14px; line-height: 1.6; color: #166534;">${p1}</div>`;
  });

  // 6. 마크다운 테이블 변환 (| 구분 | 내용 | ...)
  html = html.replace(/((?:\|[^\n]+\|\n?)+)/g, (match) => {
    const lines = match.trim().split('\n').filter(l => l.includes('|'));
    if (lines.length < 2) return match;

    let tableHtml = `<div style="margin: 20px 0; overflow-x: auto;"><table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; font-size: 13px; text-align: left;">`;
    
    // Header
    const headers = lines[0].split('|').map(s => s.trim()).filter(s => s.length > 0);
    tableHtml += `<thead><tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">`;
    headers.forEach(h => {
      tableHtml += `<th style="padding: 10px 14px; font-weight: bold; color: #374151; border: 1px solid #e5e7eb;">${h}</th>`;
    });
    tableHtml += `</tr></thead><tbody>`;

    // Body (skip separator line lines[1])
    const rows = lines.slice(2);
    rows.forEach((row, idx) => {
      const cells = row.split('|').map(s => s.trim()).filter(s => s.length > 0);
      const bg = idx % 2 === 1 ? 'background-color: #fbfbfb;' : 'background-color: #ffffff;';
      tableHtml += `<tr style="${bg} border-bottom: 1px solid #e5e7eb;">`;
      cells.forEach(c => {
        tableHtml += `<td style="padding: 9px 14px; color: #4b5563; border: 1px solid #e5e7eb; line-height: 1.5;">${c}</td>`;
      });
      tableHtml += `</tr>`;
    });

    tableHtml += `</tbody></table></div>`;
    return tableHtml;
  });

  // 7. 굵은 글씨 (**강조**) -> 네이버 강조 컬러 스팬
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #1e40af; background-color: #eff6ff; padding: 1px 4px; border-radius: 3px;">$1</strong>');

  // 8. 불릿 리스트 (- 항목)
  html = html.replace(/^- (.*?)$/gm, '<li style="margin-bottom: 6px; color: #374151; line-height: 1.6;">$1</li>');
  html = html.replace(/(<li[\s\S]*?<\/li>(\n<li[\s\S]*?<\/li>)*)/g, '<ul style="margin: 12px 0 16px 20px; padding: 0;">$1</ul>');

  // 9. 일반 문단 처리 (2~3줄 호흡으로 부드러운 줄간격 적용)
  const paragraphs = html.split(/\n\s*\n/);
  const formattedParagraphs = paragraphs.map(p => {
    p = p.trim();
    if (!p) return '';
    if (p.startsWith('<div') || p.startsWith('<table') || p.startsWith('<ul') || p.startsWith('<h')) {
      return p;
    }
    return `<p style="font-size: 15px; line-height: 1.8; color: #27272a; margin-bottom: 16px; word-break: keep-all;">${p.replace(/\n/g, '<br/>')}</p>`;
  });

  html = formattedParagraphs.join('\n');

  // 10. 상단 제목 (Title) 추가 (옵션)
  let headerHtml = '';
  if (options.title) {
    headerHtml = `
      <div style="margin-bottom: 28px; padding-bottom: 16px; border-bottom: 3px solid #111827;">
        <h1 style="font-size: 24px; font-weight: 800; color: #111827; line-height: 1.35; margin: 0;">
          ${options.title}
        </h1>
        <div style="margin-top: 10px; font-size: 13px; color: #6b7280;">
          보상스쿨 손해사정 그룹 · 네이버 D.I.A.+ 실무 칼럼
        </div>
      </div>
    `;
  }

  // 11. 하단 보상스쿨 스마트 링크 카드 (네이버 클릭 유도 퍼널)
  const footerHtml = `
    <div style="margin-top: 40px; padding: 20px; background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; text-align: center;">
      <div style="display: inline-block; padding: 4px 10px; background-color: #03c75a; color: #ffffff; font-size: 12px; font-weight: bold; border-radius: 20px; margin-bottom: 8px;">
        ${linkCard.badge}
      </div>
      <h3 style="font-size: 17px; font-weight: bold; color: #0f172a; margin: 6px 0 8px 0;">
        ${linkCard.title}
      </h3>
      <p style="font-size: 13px; color: #64748b; margin: 0 0 16px 0; line-height: 1.5;">
        ${linkCard.desc}
      </p>
      <a href="${linkCard.url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 10px 24px; background-color: #03c75a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: bold; border-radius: 8px; box-shadow: 0 2px 6px rgba(3, 199, 90, 0.3);">
        👉 지금 바로 확인하기 (${linkCard.url.replace('https://', '')})
      </a>
    </div>
  `;

  return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; max-width: 720px; margin: 0 auto; color: #27272a;">${headerHtml}${html}${footerHtml}</div>`;
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
      // Fallback for older browsers
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
