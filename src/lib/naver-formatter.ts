/**
 * naver-formatter.ts
 * 네이버 블로그 스마트에디터 ONE(SmartEditor ONE) 전용 W3C 표준 AST 기반 변환 엔진 3.0
 * 
 * [헌법 원칙: 표준 · 범용 · 콤팩트 · 통합 · 공유 · 공통]
 * - 수작업 while 루프 파서를 전면 폐기하고, react-markdown/AST 표준 엔진에 100% 위임
 * - 무한 루프(Freezing) 가능성을 수학적으로 0%로 원천 차단 (사전 예방)
 * - blog-tokens.ts와 완전 연동되는 단일 진실 공급원(SSOT)
 * - 네이버 스마트에디터 ONE 전용 인라인 스타일 테이블 및 시맨틱 카드 렌더링
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import type { Components } from 'react-markdown';
import { BLOG_TONE_TOKENS, getToneColor, getKeywordTone, BlogTone } from './blog-tokens';

const h = React.createElement;

export interface NaverFormatOptions {
  title?: string;
  targetBlog?: 'default' | 'traffic' | 'medical' | 'accident';
}

const extractTextFromNode = (n: any): string => {
  if (typeof n === 'string') return n;
  if (Array.isArray(n)) return n.map(extractTextFromNode).join('');
  if (n?.props?.children) return extractTextFromNode(n.props.children);
  return '';
};

/**
 * 네이버 스마트에디터 ONE 전용 시맨틱 컴포넌트 맵 (W3C AST 기반)
 */
export const naverComponents: Components = {
  // 1. 대제목 H1 / H2
  h1: ({ children }) =>
    h('table', { style: { width: '100%', borderLeft: '6px solid #1a73e8', backgroundColor: '#f8fafc', borderCollapse: 'collapse', margin: '32px 0 16px 0' } },
      h('tbody', null,
        h('tr', null,
          h('td', { style: { padding: '12px 18px' } },
            h('p', { style: { fontSize: '18.5px', fontWeight: 'bold', color: '#0f172a', margin: 0, lineHeight: 1.4 } }, children)
          )
        )
      )
    ),

  h2: ({ children }) => {
    const text = extractTextFromNode(children).trim();
    const isSpecial = /1분\s*자가진단|자가진단|체크리스트|FAQ|자주\s*묻는\s*질문/i.test(text);

    return h('table', { style: { width: '100%', borderLeft: `6px solid ${isSpecial ? '#6366f1' : '#03c75a'}`, backgroundColor: '#f8fafc', borderCollapse: 'collapse', margin: '36px 0 16px 0' } },
      h('tbody', null,
        h('tr', null,
          h('td', { style: { padding: '12px 18px' } },
            h('p', { style: { fontSize: '18px', fontWeight: 'bold', color: '#0f172a', margin: 0, lineHeight: 1.4 } }, children)
          )
        )
      )
    );
  },

  // 2. 중제목 H3
  h3: ({ children }) =>
    h('table', { style: { width: '100%', border: '1px solid #e2e8f0', borderLeft: '4px solid #3b82f6', backgroundColor: '#f8fafc', borderCollapse: 'collapse', margin: '26px 0 12px 0' } },
      h('tbody', null,
        h('tr', null,
          h('td', { style: { padding: '10px 15px' } },
            h('span', { style: { fontSize: '16px', fontWeight: 'bold', color: '#1e3a8a' } }, children)
          )
        )
      )
    ),

  // 3. 소제목 / 다단계 솔루션 H4, H5, H6
  h4: ({ children }) =>
    h('table', { style: { width: '100%', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderCollapse: 'collapse', margin: '18px 0 10px 0' } },
      h('tbody', null,
        h('tr', null,
          h('td', { style: { padding: '10px 14px' } },
            h('p', { style: { fontSize: '14.5px', fontWeight: 'bold', color: '#065f46', margin: 0, lineHeight: 1.5 } }, children)
          )
        )
      )
    ),
  h5: (props) => naverComponents.h4 ? (naverComponents.h4 as any)(props) : null,
  h6: (props) => naverComponents.h4 ? (naverComponents.h4 as any)(props) : null,

  // 4. 일반 본문 문단 및 해시태그 처리
  p: ({ children }) => {
    const text = extractTextFromNode(children).trim();

    // 해시태그 목록 라인 감지 (#태그1 #태그2 ...)
    if (/^#[^\s#]/.test(text) && text.includes('#')) {
      const tags = text.split(/\s+/).filter(t => t.startsWith('#'));
      if (tags.length > 0) {
        return h('p', { style: { margin: '24px 0 16px 0', fontSize: '13.5px', color: '#64748b', lineHeight: 1.8, wordBreak: 'keep-all' } },
          tags.map((t, idx) =>
            h('span', { key: idx, style: { display: 'inline-block', marginRight: '8px', color: '#0284c7', fontWeight: 500 } }, t)
          )
        );
      }
    }

    return h('p', { style: { fontSize: '15.5px', lineHeight: 1.9, color: '#27272a', marginBottom: '16px', wordBreak: 'keep-all' } }, children);
  },

  // 5. 키워드 강조 (**볼드**) ➔ 5대 톤온톤 스마트 하이라이터
  strong: ({ children }) => {
    const text = extractTextFromNode(children).trim();
    const tone = getKeywordTone(text);
    const token = BLOG_TONE_TOKENS[tone].hex;

    return h('strong', {
      style: {
        backgroundColor: token.highlightBg,
        color: token.highlightText,
        padding: '2px 5px',
        borderRadius: '3px',
        fontWeight: 'bold'
      }
    }, children);
  },

  // 6. 인용구 블록 (자가진단 체크리스트, 인사이트 박스, 용어사전, 단순인용구 완벽 분기)
  blockquote: ({ children }) => {
    const fullText = extractTextFromNode(children).trim();
    const tone: BlogTone = getToneColor(fullText);
    const token = BLOG_TONE_TOKENS[tone].hex;

    // A. 1분 자가진단 체크리스트 블록 (체크박스 감지)
    if (fullText.includes('[ ]') || fullText.includes('[x]') || fullText.includes('☑')) {
      return h('table', { style: { width: '100%', border: '1px solid #cbd5e1', borderCollapse: 'collapse', margin: '22px 0', fontSize: '14px' } },
        h('tbody', null,
          h('tr', null,
            h('td', { style: { padding: '12px 18px', backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1', fontWeight: 'bold', color: '#0f172a', fontSize: '14.5px' } },
              '1분 자가진단 체크리스트'
            )
          ),
          h('tr', null,
            h('td', { style: { padding: '16px 18px', backgroundColor: '#f8fafc', color: '#334155', lineHeight: 1.85 } },
              children
            )
          )
        )
      );
    }

    // B. 보상스쿨 실무 팁 / 인사이트 박스 (헤더 스트립 탑재)
    if (fullText.includes('피드백') || fullText.includes('인사이트') || fullText.includes('실무') || fullText.includes('조언')) {
      return h('table', { style: { width: '100%', border: `1px solid ${token.border}`, borderCollapse: 'collapse', margin: '26px 0 16px 0' } },
        h('tbody', null,
          h('tr', null,
            h('td', { style: { padding: '10px 16px', backgroundColor: token.headerBg, borderBottom: `1px solid ${token.headerBorderBottom}` } },
              h('span', { style: { fontSize: '15px', fontWeight: 'bold', color: token.headerText } },
                '보상스쿨 피드백 & 실무 인사이트'
              )
            )
          ),
          h('tr', null,
            h('td', { style: { padding: '16px 18px', backgroundColor: token.bodyBg, lineHeight: 1.85 } },
              children
            )
          )
        )
      );
    }

    // C. 인라인 전문 용어 사전
    if (fullText.includes('용어') || (fullText.includes(':') && fullText.length < 200)) {
      const yellowToken = BLOG_TONE_TOKENS.yellow.hex;
      return h('table', { style: { width: '100%', border: `1px dashed ${yellowToken.border}`, backgroundColor: '#fffbeb', borderCollapse: 'collapse', margin: '16px 0' } },
        h('tbody', null,
          h('tr', null,
            h('td', { style: { padding: '12px 18px', fontSize: '14px', color: yellowToken.headerText, lineHeight: 1.75 } },
              children
            )
          )
        )
      );
    }

    // D. 일반 인용구 (좌측 톤온톤 라인 카드)
    return h('table', { style: { width: '100%', borderLeft: `4px solid ${token.borderAccent}`, backgroundColor: token.headerBg, borderCollapse: 'collapse', margin: '18px 0' } },
      h('tbody', null,
        h('tr', null,
          h('td', { style: { padding: '14px 18px', fontSize: '14.5px', lineHeight: 1.8, color: token.headerText } },
            children
          )
        )
      )
    );
  },

  // 7. W3C 시맨틱 마크다운 표(Table) 완벽 렌더링
  table: ({ children }) =>
    h('table', { style: { width: '100%', borderCollapse: 'collapse', border: '1px solid #cbd5e1', margin: '24px 0', fontSize: '13.5px', lineHeight: 1.5 } },
      children
    ),
  thead: ({ children }) => h('thead', { style: { backgroundColor: '#f1f5f9' } }, children),
  tbody: ({ children }) => h('tbody', null, children),
  tr: ({ children }) => h('tr', null, children),
  th: ({ children, style }) =>
    h('th', {
      style: {
        padding: '10px 12px',
        fontWeight: 'bold',
        color: '#1e293b',
        border: '1px solid #cbd5e1',
        textAlign: (style?.textAlign as any) || 'center',
        verticalAlign: 'middle',
        backgroundColor: '#f1f5f9'
      }
    }, children),
  td: ({ children, style }) =>
    h('td', {
      style: {
        padding: '10px 12px',
        color: '#334155',
        border: '1px solid #cbd5e1',
        textAlign: (style?.textAlign as any) || 'left',
        verticalAlign: 'middle',
        lineHeight: 1.5
      }
    }, children),

  // 8. 불릿 및 넘버링 리스트
  ul: ({ children }) => h('ul', { style: { margin: '12px 0 16px 20px', padding: 0, color: '#334155', lineHeight: 1.8, fontSize: '15px' } }, children),
  ol: ({ children }) => h('ol', { style: { margin: '12px 0 16px 20px', padding: 0, color: '#334155', lineHeight: 1.8, fontSize: '15px' } }, children),
  li: ({ children }) => {
    const text = extractTextFromNode(children).trim();
    if (text.startsWith('[ ]') || text.startsWith('[x]')) {
      const isChecked = text.startsWith('[x]');
      return h('li', { style: { listStyleType: 'none', marginBottom: '8px', color: '#334155', lineHeight: 1.8, fontSize: '14.5px' } },
        h('span', { style: { color: isChecked ? '#059669' : '#94a3b8', fontSize: '15px', fontWeight: 'bold', marginRight: '8px' } }, isChecked ? '☑' : '☐'),
        h('span', null, children)
      );
    }
    return h('li', { style: { marginBottom: '6px' } }, children);
  },

  // 9. 인라인 코드 및 링크
  code: ({ children }) =>
    h('code', { style: { backgroundColor: '#f1f5f9', color: '#0f172a', padding: '2px 6px', borderRadius: '3px', fontSize: '0.92em', fontWeight: 'bold' } }, children),
  a: ({ href, children }) =>
    h('a', { href, style: { color: '#1a73e8', textDecoration: 'underline', fontWeight: 'bold' }, target: '_blank', rel: 'noopener noreferrer' }, children),
  hr: () =>
    h('hr', { style: { border: 'none', borderTop: '1px solid #e2e8f0', margin: '32px 0' } })
};

/**
 * 마크다운 텍스트를 네이버 스마트에디터 ONE 전용 HTML로 W3C 표준 AST 변환 (무한 루프 0%)
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

  // 1. Frontmatter, 백틱 코드블록 래핑, HTML 주석 정제
  let cleanMd = raw
    .replace(/^---[\s\S]*?---\n*/, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^```(?:markdown)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .replace(/^(?:thoughtProcess|사고\s*과정|생각의\s*사슬)[\s\S]*?(?=\n##|\n#)/i, '')
    .trim();

  // 최상단 중복 H1 제거
  cleanMd = cleanMd.replace(/^#\s+[^\n]+\n+/, '').trim();

  // 2. React-Markdown 및 W3C 표준 AST 변환 엔진을 통한 인라인 HTML 직렬화 (무한 루프 원천 차단)
  const element = h(
    ReactMarkdown,
    {
      remarkPlugins: [remarkGfm, remarkBreaks],
      components: naverComponents
    },
    cleanMd
  );

  const bodyHtml = renderToStaticMarkup(element);

  // 3. 하단 보상스쿨 공식 배너 이미지 CTA 자동 결합
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
