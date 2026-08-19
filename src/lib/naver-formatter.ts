/**
 * naver-formatter.ts
 * 네이버 블로그 스마트에디터 ONE(SmartEditor ONE) 전용 완벽 호환 HTML 변환 엔진
 *
 * [스마트에디터 ONE 핵심 호환 규칙]
 * 1. <div> 중첩 래퍼 제거: 스마트에디터 ONE은 <div> 중첩 시 빈 위젯을 무한 생성하므로, 순수 <p>, <blockquote>, <table> 플랫 구조로 렌더링.
 * 2. 표(Table) 세로 늘어남(Height Distortion) 방지:
 *    - 외곽 <div> 제거
 *    - `vertical-align: middle;` 및 `table-layout: auto; border-collapse: collapse;` 필수 적용.
 *    - 모든 <th>, <td>에 명시적 border, padding, text-align 인라인 선언.
 * 3. 맞춤법 검사기 오작동 방지:
 *    - 불필요한 줄바꿈(<br/>)과 공백 태그를 완전히 제거하고 깔끔한 문단(<p>) 단위로 분할.
 * 4. 인용구 및 체크리스트:
 *    - 네이버 에디터가 좋아하는 <blockquote> 및 간결한 <p> 박스 서식 적용.
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
 * 마크다운 텍스트를 네이버 스마트에디터 ONE 전용 플랫 HTML로 변환
 */
export function convertMarkdownToNaverHtml(markdown: string, options: NaverFormatOptions = {}): string {
  const blogType = options.targetBlog || 'default';
  const linkCard = LINK_CARDS[blogType] || LINK_CARDS.default;

  // Frontmatter 및 주석 제거
  let cleanMd = markdown
    .replace(/^---[\s\S]*?---\n*/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\r\n/g, '\n')
    .trim();

  // 문단 단위로 분리하여 처리
  const rawSections = cleanMd.split(/\n{2,}/);
  const formattedSections: string[] = [];

  // 1. 상단 제목 (옵션)
  if (options.title) {
    formattedSections.push(
      `<p style="font-size: 22px; font-weight: bold; color: #111827; line-height: 1.35; margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 3px solid #03c75a;"><strong>${options.title}</strong></p>` +
      `<p style="font-size: 13px; color: #6b7280; margin: 0 0 24px 0;">보상스쿨 손해사정 실무 칼럼 · 네이버 블로그 공식 배포판</p>`
    );
  }

  for (let section of rawSections) {
    section = section.trim();
    if (!section) continue;

    // A. 마크다운 테이블 (| 구분 | 내용 | ...)
    if (section.includes('|') && section.split('\n').filter(l => l.includes('|')).length >= 2) {
      const lines = section.split('\n').map(l => l.trim()).filter(l => l.startsWith('|') && l.endsWith('|'));
      if (lines.length >= 2) {
        let tableHtml = `<table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; margin: 18px 0; font-size: 13px; line-height: 1.5;">`;
        
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
            tableHtml += `<td style="padding: 9px 12px; color: #334155; border: 1px solid #cbd5e1; text-align: ${align}; vertical-align: middle; line-height: 1.5;">${c}</td>`;
          });
          tableHtml += `</tr>`;
        });

        tableHtml += `</tbody></table>`;
        formattedSections.push(tableHtml);
        continue;
      }
    }

    // B. 대주제 H2 (## ...)
    if (section.startsWith('## ')) {
      const titleText = section.replace(/^##\s+/, '').trim();
      formattedSections.push(
        `<p style="font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 32px; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 2px solid #03c75a;"><strong>${titleText}</strong></p>`
      );
      continue;
    }

    // C. 중주제 H3 (### ...)
    if (section.startsWith('### ')) {
      const titleText = section.replace(/^###\s+/, '').trim();
      formattedSections.push(
        `<p style="font-size: 16px; font-weight: bold; color: #1e293b; margin-top: 24px; margin-bottom: 8px;"><strong>📌 ${titleText}</strong></p>`
      );
      continue;
    }

    // D. 솔루션 단계 H6 (###### ...)
    if (section.startsWith('###### ')) {
      const titleText = section.replace(/^######\s+/, '').trim();
      formattedSections.push(
        `<p style="font-size: 14px; font-weight: bold; color: #065f46; background-color: #ecfdf5; padding: 8px 12px; border-left: 4px solid #059669; margin-top: 18px; margin-bottom: 8px;"><strong>${titleText}</strong></p>`
      );
      continue;
    }

    // E. 인용구 / 용어사전 / 체크리스트 (> ...)
    if (section.startsWith('>')) {
      const quoteLines = section.split('\n').map(l => l.replace(/^>\s?/, '').trim()).filter(Boolean);
      
      // 체크리스트인 경우
      if (quoteLines.some(l => l.startsWith('- [ ]') || l.startsWith('- [x]'))) {
        const checkItems = quoteLines.map(l => {
          const itemText = l.replace(/^- \[( |x)\]\s*/, '');
          return `<p style="margin: 4px 0; padding: 6px 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; color: #334155;">☑️ ${itemText}</p>`;
        }).join('');
        formattedSections.push(checkItems);
      } else {
        // 일반 인용구 / 용어 사전
        const quoteContent = quoteLines.join('<br/>')
          .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #1e40af; background-color: #eff6ff; padding: 1px 4px;">$1</strong>');
        formattedSections.push(
          `<blockquote style="margin: 14px 0; padding: 12px 16px; background-color: #f0fdf4; border-left: 4px solid #03c75a; font-size: 14px; line-height: 1.6; color: #166534;">${quoteContent}</blockquote>`
        );
      }
      continue;
    }

    // F. 리스트 (- 항목)
    if (section.startsWith('- ') || section.startsWith('* ')) {
      const listItems = section.split('\n')
        .map(l => l.replace(/^[-*]\s+/, '').trim())
        .filter(Boolean)
        .map(l => {
          const formatted = l.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #1e40af; background-color: #eff6ff; padding: 1px 4px;">$1</strong>');
          return `<li style="margin-bottom: 6px; color: #334155; line-height: 1.6; font-size: 14.5px;">${formatted}</li>`;
        }).join('');
      formattedSections.push(`<ul style="margin: 10px 0 14px 20px; padding: 0;">${listItems}</ul>`);
      continue;
    }

    // G. 일반 본문 문단
    let pContent = section
      // 볼드 처리
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #1e40af; background-color: #eff6ff; padding: 1px 4px; border-radius: 3px;">$1</strong>')
      // 줄바꿈 처리
      .replace(/\n/g, '<br/>');

    formattedSections.push(
      `<p style="font-size: 15px; line-height: 1.8; color: #27272a; margin-bottom: 14px; word-break: keep-all;">${pContent}</p>`
    );
  }

  // 11. 하단 보상스쿨 스마트 링크 카드 (스마트에디터에 최적화된 심플 박스)
  const footerHtml = `
    <blockquote style="margin-top: 36px; padding: 18px 20px; background-color: #f8fafc; border: 2px solid #03c75a; border-radius: 10px; text-align: center;">
      <p style="font-size: 12px; font-weight: bold; color: #03c75a; margin: 0 0 6px 0;">${linkCard.badge}</p>
      <p style="font-size: 16px; font-weight: bold; color: #0f172a; margin: 0 0 6px 0;"><strong>${linkCard.title}</strong></p>
      <p style="font-size: 13px; color: #64748b; margin: 0 0 14px 0; line-height: 1.5;">${linkCard.desc}</p>
      <p style="margin: 0;"><a href="${linkCard.url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 9px 20px; background-color: #03c75a; color: #ffffff; text-decoration: none; font-size: 13.5px; font-weight: bold; border-radius: 6px;">👉 ${linkCard.url.replace('https://', '')} 바로가기</a></p>
    </blockquote>
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
