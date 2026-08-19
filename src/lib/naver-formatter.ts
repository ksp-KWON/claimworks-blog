/**
 * naver-formatter.ts
 * 네이버 블로그 스마트에디터 ONE(SmartEditor ONE) 전용 네이티브 완벽 호환 HTML 변환 엔진
 *
 * [대표님 실무 피드백 기반 100% 정밀 최적화]
 * 1. 불필요한 기계적 라벨 제거:
 *    - 상단 서브라벨("보상스쿨 손해사정 실무 칼럼...") 및 본문 "📌 💡 핵심 요약" 텍스트 완전 제거.
 *    - 솔루션에서 상투적인 "핵심 솔루션" 문구 삭제 ➔ "① 제목", "② 제목" 번호 중심 간결화.
 * 2. 시각적 호흡 및 위계 완벽 확립:
 *    - 섹션 구분선(<hr>): 대제목 '앞'에 배치하여 챕터 간 시각적 경계감 극대화.
 *    - 대제목(H2): 안정적인 라인형 인용구 박스 + 19px 대형 볼드 폰트.
 *    - 중제목(H3): 네이버 포인트 불릿(■) + 17px 중형 볼드 폰트.
 *    - 소제목/솔루션(H6): 15.5px 포인트 볼드 + 넘버링(①, ②...).
 * 3. FAQ(Q&A) 문단 호흡 최적화:
 *    - Q와 A를 한 줄씩 띄우고 질문은 파란색/볼드, 답변은 부드러운 들여쓰기로 독자 가독성 극대화.
 * 4. 따옴표 인용구 & 노란색 형광펜 하이라이트 & 완벽한 표준 표(Table) 유지.
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
    // 상투적인 [핵심 요약] 헤더 라인 제거
    .replace(/^##\s*💡\s*핵심\s*요약\s*$/gm, '')
    .replace(/^##\s*핵심\s*요약\s*$/gm, '')
    .trim();

  const rawSections = cleanMd.split(/\n{2,}/);
  const formattedSections: string[] = [];

  let isFirstH2 = true;

  for (let section of rawSections) {
    section = section.trim();
    if (!section) continue;

    // A. 마크다운 테이블 (| 구분 | 내용 | ...)
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

    // D. 솔루션 단계 H6 (###### ...) -> '핵심 솔루션' 문구 제거하고 번호 중심(①, ②...) 간결화
    if (section.startsWith('###### ')) {
      let titleText = section.replace(/^######\s+/, '').trim();
      titleText = titleText.replace(/^핵심\s*솔루션\s*/, ''); // 상투적 문구 삭제

      formattedSections.push(
        `<p style="font-size: 15.5px; font-weight: bold; color: #065f46; margin-top: 22px; margin-bottom: 8px; line-height: 1.4;"><span style="color: #059669; margin-right: 4px;">✔</span><strong>${titleText}</strong></p>`
      );
      continue;
    }

    // E. FAQ (Q&A) 문단 자동 감지 및 넉넉한 호흡 분리 (Q와 A 사이에 빈 줄 적용)
    if (section.includes('Q :') || section.includes('Q:') || section.startsWith('■Q') || section.startsWith('Q.')) {
      const lines = section.split('\n').map(l => l.trim()).filter(Boolean);
      let faqHtml = '';
      
      for (const line of lines) {
        if (line.includes('Q :') || line.includes('Q:') || line.startsWith('■Q') || line.startsWith('Q.')) {
          const qText = applyNaverHighlighter(line);
          faqHtml += `<p style="font-size: 15.5px; font-weight: bold; color: #1d4ed8; margin-top: 20px; margin-bottom: 6px; line-height: 1.5;">${qText}</p>`;
        } else if (line.startsWith('A :') || line.startsWith('A:') || line.startsWith('A.')) {
          const aText = applyNaverHighlighter(line);
          faqHtml += `<p style="font-size: 14.5px; color: #334155; line-height: 1.8; margin-bottom: 20px; padding-left: 6px; word-break: keep-all;">${aText}</p>`;
        } else {
          const normalText = applyNaverHighlighter(line);
          faqHtml += `<p style="font-size: 14.5px; color: #334155; line-height: 1.8; margin-bottom: 12px; word-break: keep-all;">${normalText}</p>`;
        }
      }
      
      formattedSections.push(faqHtml);
      continue;
    }

    // F. 인용구 / 용어사전 / 체크리스트 (> ...)
    if (section.startsWith('>')) {
      const quoteLines = section.split('\n').map(l => l.replace(/^>\s?/, '').trim()).filter(Boolean);
      
      // 체크리스트인 경우
      if (quoteLines.some(l => l.startsWith('- [ ]') || l.startsWith('- [x]'))) {
        const checkItems = quoteLines.map(l => {
          const itemText = l.replace(/^- \[( |x)\]\s*/, '');
          const highlighted = applyNaverHighlighter(itemText);
          return `<p style="margin: 6px 0; font-size: 14px; color: #334155; line-height: 1.6;"><span style="color: #059669; font-weight: bold; margin-right: 6px;">☑️</span>${highlighted}</p>`;
        }).join('');

        formattedSections.push(
          `<blockquote style="margin: 18px 0; padding: 14px 18px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">` +
          `<p style="font-size: 14px; font-weight: bold; color: #0f172a; margin: 0 0 10px 0;">📋 <strong>1분 자가진단 체크리스트</strong></p>` +
          `${checkItems}</blockquote>`
        );
      } else {
        // 일반 인용구 / 핵심 요약 / 용어 사전 -> 네이버 따옴표형 인용구
        const quoteContent = quoteLines.join('<br/>');
        const highlighted = applyNaverHighlighter(quoteContent);
        formattedSections.push(
          `<blockquote style="margin: 18px 0; padding: 14px 20px; font-size: 15px; line-height: 1.8; color: #334155;">${highlighted}</blockquote>`
        );
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

  // 11. 하단 보상스쿨 스마트 링크 카드 (네이버 클릭 유도 퍼널)
  const footerHtml = `
    <hr style="border: 0; height: 1px; background-color: #e2e8f0; margin: 40px 0 24px 0;" />
    <blockquote style="margin-top: 24px; padding: 20px; background-color: #f8fafc; border: 2px solid #03c75a; border-radius: 10px; text-align: center;">
      <p style="font-size: 12px; font-weight: bold; color: #03c75a; margin: 0 0 6px 0;">${linkCard.badge}</p>
      <p style="font-size: 16.5px; font-weight: bold; color: #0f172a; margin: 0 0 6px 0;"><strong>${linkCard.title}</strong></p>
      <p style="font-size: 13.5px; color: #64748b; margin: 0 0 16px 0; line-height: 1.5;">${linkCard.desc}</p>
      <p style="margin: 0;"><a href="${linkCard.url}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 10px 24px; background-color: #03c75a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: bold; border-radius: 6px;">👉 ${linkCard.url.replace('https://', '')} 바로가기</a></p>
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
