/**
 * naver-formatter.ts
 * 네이버 블로그 스마트에디터 ONE(SmartEditor ONE) 전용 세계 표준 Lexer 변환 엔진 4.0
 * 
 * [헌법 원칙: 표준 · 범용 · 콤팩트 · 통합 · 공유 · 공통]
 * - [사전예방·근본해결·사후대책금지] 수작업 while 루프를 영구히 0줄로 박멸
 * - 전 세계 1위 W3C 표준 마크다운 렉서(marked, 주간 7천만 다운로드) 100% 채택
 * - 브라우저/서버 완전 독립 구동 (React 가상 DOM 의존성 0%)
 * - 블로그 디자인 토큰(blog-tokens.ts) 연동 5대 톤온톤 시맨틱 인라인 카드 렌더링
 * - 3중 클립보드 파이프라인(ClipboardItem ➔ 이벤트 리스너 ➔ Range) 완비
 */

import { marked } from 'marked';
import { BLOG_TONE_TOKENS, getToneColor, getKeywordTone, BlogTone } from './blog-tokens';

export interface NaverFormatOptions {
  title?: string;
  targetBlog?: 'default' | 'traffic' | 'medical' | 'accident';
}

/**
 * 네이버 스마트에디터 ONE 전용 W3C 커스텀 렌더러 생성
 */
function createNaverRenderer() {
  const renderer = new marked.Renderer();

  // 1. 헤딩 H1~H6
  renderer.heading = function({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);

    if (depth === 1) {
      return `
        <table style="width: 100%; border-left: 6px solid #1a73e8; background-color: #f8fafc; border-collapse: collapse; margin: 32px 0 16px 0;">
          <tr>
            <td style="padding: 12px 18px;">
              <p style="font-size: 18.5px; font-weight: bold; color: #0f172a; margin: 0; line-height: 1.4;">
                ${text}
              </p>
            </td>
          </tr>
        </table>
      `.trim() + '\n';
    }

    if (depth === 2) {
      const isSpecial = /1분\s*자가진단|자가진단|체크리스트|FAQ|자주\s*묻는\s*질문/i.test(text);
      const accent = isSpecial ? '#6366f1' : '#03c75a';
      return `
        <table style="width: 100%; border-left: 6px solid ${accent}; background-color: #f8fafc; border-collapse: collapse; margin: 36px 0 16px 0;">
          <tr>
            <td style="padding: 12px 18px;">
              <p style="font-size: 18px; font-weight: bold; color: #0f172a; margin: 0; line-height: 1.4;">
                ${text}
              </p>
            </td>
          </tr>
        </table>
      `.trim() + '\n';
    }

    if (depth === 3) {
      return `
        <table style="width: 100%; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; background-color: #f8fafc; border-collapse: collapse; margin: 26px 0 12px 0;">
          <tr>
            <td style="padding: 10px 15px;">
              <span style="font-size: 16px; font-weight: bold; color: #1e3a8a;">
                ${text}
              </span>
            </td>
          </tr>
        </table>
      `.trim() + '\n';
    }

    // depth >= 4 (소제목 / 솔루션)
    return `
      <table style="width: 100%; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-collapse: collapse; margin: 18px 0 10px 0;">
        <tr>
          <td style="padding: 10px 14px;">
            <p style="font-size: 14.5px; font-weight: bold; color: #065f46; margin: 0; line-height: 1.5;">
              ${text}
            </p>
          </td>
        </tr>
      </table>
    `.trim() + '\n';
  };

  // 2. 키워드 강조 (**볼드**) ➔ 5대 톤온톤 하이라이터
  renderer.strong = function({ tokens }) {
    const rawText = this.parser.parseInline(tokens);
    const plainText = rawText.replace(/<[^>]+>/g, '').trim();
    const tone = getKeywordTone(plainText);
    const token = BLOG_TONE_TOKENS[tone].hex;

    return `<strong style="background-color: ${token.highlightBg}; color: ${token.highlightText}; padding: 2px 5px; border-radius: 3px; font-weight: bold; font-family: inherit;">${rawText}</strong>`;
  };

  // 3. 인용구 블록 (> ...)
  renderer.blockquote = function({ tokens }) {
    const bodyHtml = this.parser.parse(tokens);
    const plainText = bodyHtml.replace(/<[^>]+>/g, '').trim();
    const tone: BlogTone = getToneColor(plainText);
    const token = BLOG_TONE_TOKENS[tone].hex;

    // A. 체크리스트 인용구
    if (plainText.includes('체크리스트') || plainText.includes('☑') || plainText.includes('☐')) {
      return `
        <table style="width: 100%; border: 1px solid #cbd5e1; border-collapse: collapse; margin: 22px 0; font-size: 14px;">
          <tr>
            <td style="padding: 12px 18px; background-color: #f1f5f9; border-bottom: 1px solid #cbd5e1; font-weight: bold; color: #0f172a; font-size: 14.5px;">
              1분 자가진단 체크리스트
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 18px; background-color: #f8fafc; color: #334155; line-height: 1.85;">
              ${bodyHtml}
            </td>
          </tr>
        </table>
      `.trim() + '\n';
    }

    // B. 보상스쿨 인사이트 박스
    if (plainText.includes('피드백') || plainText.includes('인사이트') || plainText.includes('실무')) {
      return `
        <table style="width: 100%; border: 1px solid ${token.border}; border-collapse: collapse; margin: 26px 0 16px 0;">
          <tr>
            <td style="padding: 10px 16px; background-color: ${token.headerBg}; border-bottom: 1px solid ${token.headerBorderBottom};">
              <span style="font-size: 15px; font-weight: bold; color: ${token.headerText};">
                보상스쿨 피드백 & 실무 인사이트
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 18px; background-color: ${token.bodyBg}; line-height: 1.85;">
              ${bodyHtml}
            </td>
          </tr>
        </table>
      `.trim() + '\n';
    }

    // C. 일반 인용구 (좌측 톤온톤 라인 카드)
    return `
      <table style="width: 100%; border-left: 4px solid ${token.borderAccent}; background-color: ${token.headerBg}; border-collapse: collapse; margin: 18px 0;">
        <tr>
          <td style="padding: 14px 18px; font-size: 14.5px; line-height: 1.8; color: ${token.headerText};">
            ${bodyHtml}
          </td>
        </tr>
      </table>
    `.trim() + '\n';
  };

  // 4. W3C 시맨틱 마크다운 표
  renderer.table = function({ header, rows }) {
    let out = '<table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; margin: 24px 0; font-size: 13.5px; line-height: 1.5;">\n<thead><tr style="background-color: #f1f5f9;">';
    header.forEach(cell => {
      const align = cell.align || 'center';
      out += `<th style="padding: 10px 12px; font-weight: bold; color: #1e293b; border: 1px solid #cbd5e1; text-align: ${align}; vertical-align: middle; background-color: #f1f5f9;">${this.parser.parseInline(cell.tokens)}</th>`;
    });
    out += '</tr></thead>\n<tbody>';

    rows.forEach((row, rIdx) => {
      const bg = rIdx % 2 === 1 ? '#f8fafc' : '#ffffff';
      out += `<tr style="background-color: ${bg};">`;
      row.forEach((cell) => {
        const align = cell.align || 'left';
        out += `<td style="padding: 10px 12px; color: #334155; border: 1px solid #cbd5e1; text-align: ${align}; vertical-align: middle; line-height: 1.5;">${this.parser.parseInline(cell.tokens)}</td>`;
      });
      out += '</tr>';
    });

    out += '</tbody></table>\n';
    return out;
  };

  // 5. 일반 본문 문단 (해시태그 역슬래시 자동 제거하여 순수 #태그 빈칸 유지)
  renderer.paragraph = function({ tokens }) {
    const text = this.parser.parseInline(tokens);
    const cleanText = text.replace(/\\#/g, '#');
    return `<p style="font-size: 15.5px; line-height: 1.9; color: #27272a; margin-bottom: 16px; word-break: keep-all;">${cleanText}</p>\n`;
  };

  // 6. 리스트 및 체크박스
  renderer.list = function({ ordered, items }) {
    const tag = ordered ? 'ol' : 'ul';
    let body = '';
    items.forEach(item => {
      body += this.listitem(item);
    });
    return `<${tag} style="margin: 12px 0 16px 20px; padding: 0; color: #334155; line-height: 1.8; font-size: 15px;">\n${body}</${tag}>\n`;
  };

  renderer.listitem = function(item) {
    if (item.task) {
      const checkSymbol = item.checked
        ? '<span style="color: #059669; font-size: 15px; font-weight: bold; margin-right: 8px;">☑</span>'
        : '<span style="color: #94a3b8; font-size: 15px; font-weight: bold; margin-right: 8px;">☐</span>';
      const cleanTokens = item.tokens.filter((t: any) => t.type !== 'checkbox');
      const text = this.parser.parse(cleanTokens);
      return `<li style="list-style-type: none; margin-bottom: 8px; font-size: 14.5px; line-height: 1.8;">${checkSymbol}<span>${text.replace(/^<p[^>]*>|<\/p>\n?$/g, '')}</span></li>\n`;
    }

    const text = this.parser.parse(item.tokens);
    return `<li style="margin-bottom: 6px;">${text.replace(/^<p[^>]*>|<\/p>\n?$/g, '')}</li>\n`;
  };

  // 7. 인라인 코드 및 링크
  renderer.codespan = function({ text }) {
    return `<code style="background-color: #f1f5f9; color: #0f172a; padding: 2px 6px; border-radius: 3px; font-size: 0.92em; font-weight: bold;">${text}</code>`;
  };

  renderer.link = function({ href, text }) {
    return `<a href="${href}" style="color: #1a73e8; text-decoration: underline; font-weight: bold;" target="_blank" rel="noopener noreferrer">${text}</a>`;
  };

  return renderer;
}

/**
 * 마크다운 텍스트를 네이버 스마트에디터 ONE 전용 HTML로 W3C 표준 렉서 변환 (무한 루프 0%)
 */
export function convertMarkdownToNaverHtml(markdown: string, options: NaverFormatOptions = {}): string {
  if (!markdown) return '';

  let raw = markdown;

  // 1. JSON 문자열 형태인 경우 내용 추출
  try {
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.markdownContent || parsed.content)) {
      raw = parsed.markdownContent || parsed.content;
    }
  } catch {}

  // 2. Frontmatter 및 코드블록 정제
  let cleanMd = raw
    .replace(/^---[\s\S]*?---\n*/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^```(?:markdown|json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .replace(/^(?:thoughtProcess|사고\s*과정|생각의\s*사슬)[\s\S]*?(?=\n##|\n#)/i, '')
    .replace(/\\#/g, '#')
    .trim();

  // 최상단 중복 H1 제거
  cleanMd = cleanMd.replace(/^#\s+[^\n]+\n+/, '').trim();

  // 3. 세계 표준 marked 렉서 엔진 실행
  const renderer = createNaverRenderer();
  const bodyHtml = marked.parse(cleanMd, {
    renderer,
    gfm: true,
    breaks: true
  }) as string;

  // 4. 하단 보상스쿨 공식 배너 이미지 CTA 결합
  const footerHtml = `
    <p style="text-align: center; margin: 40px auto 20px auto;">
      <a href="https://claim-works.com/consultation" target="_blank" rel="noopener noreferrer" style="text-decoration: none; display: inline-block;">
        <img src="https://claim-works.com/images/bosangschool-cta-banner.png" alt="보상스쿨 보험금 분쟁 무료 상담 신청하기" style="max-width: 100%; width: 620px; height: auto; border-radius: 6px; box-shadow: 0 4px 14px rgba(0,0,0,0.08); display: block; margin: 0 auto;" />
      </a>
    </p>
  `.trim();

  return `${bodyHtml}\n${footerHtml}`;
}

/**
 * 네이버 블로그 스마트에디터 ONE 클립보드에 HTML 리치 텍스트로 안전 복사 (3중 폴백)
 */
export async function copyToNaverClipboard(markdown: string, options: NaverFormatOptions = {}): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const html = convertMarkdownToNaverHtml(markdown, options);
    const plainText = options.title ? `${options.title}\n\n${markdown}` : markdown;

    // 1순위: 최신 비동기 클립보드 API
    if (navigator.clipboard && window.ClipboardItem) {
      try {
        const htmlBlob = new Blob([html], { type: 'text/html' });
        const textBlob = new Blob([plainText], { type: 'text/plain' });
        const item = new ClipboardItem({
          'text/html': htmlBlob,
          'text/plain': textBlob,
        });
        await navigator.clipboard.write([item]);
        return true;
      } catch (clipErr) {
        console.warn('Async Clipboard API fallback triggered:', clipErr);
      }
    }

    // 2순위: 전통적 안전 이벤트 리스너 방식
    const listener = (e: ClipboardEvent) => {
      e.clipboardData?.setData('text/html', html);
      e.clipboardData?.setData('text/plain', plainText);
      e.preventDefault();
    };
    document.addEventListener('copy', listener);
    const success = document.execCommand('copy');
    document.removeEventListener('copy', listener);

    if (success) return true;

    // 3순위: 숨김 contenteditable div를 통한 Range 복사
    const hiddenDiv = document.createElement('div');
    hiddenDiv.contentEditable = 'true';
    hiddenDiv.innerHTML = html;
    hiddenDiv.style.position = 'fixed';
    hiddenDiv.style.left = '-9999px';
    hiddenDiv.style.top = '-9999px';
    document.body.appendChild(hiddenDiv);

    const range = document.createRange();
    range.selectNodeContents(hiddenDiv);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    const execSuccess = document.execCommand('copy');
    document.body.removeChild(hiddenDiv);
    sel?.removeAllRanges();

    return execSuccess;
  } catch (err) {
    console.error('Failed to copy to Naver clipboard:', err);
    return false;
  }
}
