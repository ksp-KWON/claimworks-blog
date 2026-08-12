'use client';

/**
 * BlogPostContent.tsx
 * 블로그 포스팅 본문 렌더링 클라이언트 컴포넌트
 * - Key Points 박스 (최상단, Google Blue 톤)
 * - 클린 TOC (DOM에서 직접 읽어 ID 100% 일치 보장)
 * - 본문에서 중복 섹션(목차/요약/체크리스트/FAQ/CTA) 자동 제거
 * - 자가진단 인터랙티브 체크리스트
 * - FAQ 아코디언
 * - CTA 배너 (헤더 배너 스타일 + 그림자)
 * - 저자 바이오 카드 (E-E-A-T 신호)
 */

import React, { useEffect, useState } from 'react';
// 분리된 서브 컴포넌트 임포트
import KeyPointsBox from './blog/KeyPointsBox';
import FAQBox from './blog/FAQBox';
import CTABanner from './blog/CTABanner';
import ChecklistBox from './blog/ChecklistBox';
import TableOfContents from './blog/TableOfContents';
import GlobalCalculatorAccordion from './blog/GlobalCalculatorAccordion';
import MarkdownRenderer from './blog/MarkdownRenderer';

import { parseBlogPost } from '@/lib/blog-utils';

// ─── 스크롤 오프셋: header(64) + sticky banner(52) + 버퍼(20) = 136px ───
const SCROLL_OFFSET = 140;

interface BlogPostContentProps { 
  content: string;
  relatedPostsNode?: React.ReactNode;
  authorBioNode?: React.ReactNode;
}

export default function BlogPostContent({ content, relatedPostsNode, authorBioNode }: BlogPostContentProps) {
  const [activeId, setActiveId] = useState('');
  const { opening, keyPoints, checklistItems, faqItems, toc, sections } = parseBlogPost(content);

  useEffect(() => {
    const onScroll = () => {
      const headings = document.querySelectorAll('[data-blog-body] h2[id]');
      let current = '';
      headings.forEach(h => {
        if (h.getBoundingClientRect().top < SCROLL_OFFSET + 10) current = h.id;
      });
      setActiveId(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleTOCClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET,
        behavior: 'smooth'
      });
    }
  };

  // 본문 섹션(sections) 분리
  // [근본 수정] sections가 1개 이하일 때 middleSections가 비어 본문이 사라지는 버그 수정.
  // sections가 2개 이상이면: 마지막을 closingSection으로 분리 (박스 배치 목적)
  // sections가 1개이면: 해당 1개를 middleSections로 렌더링, closingSection = ''
  // sections가 0개이면: opening도 확인 후 fallback 처리
  const middleSections = sections.length > 1 ? sections.slice(0, -1) : sections;
  const closingSection = sections.length > 1 ? sections[sections.length - 1] : '';

  return (
    <div>
      {/* 1. 핵심 요약 포인트 박스 */}
      {keyPoints.length > 0 && <KeyPointsBox points={keyPoints} />}

      {/* 2. 오프닝 (도입부 본문) */}
      {opening && (
        <div data-blog-body>
          <MarkdownRenderer content={opening} />
        </div>
      )}

      {/* 3. 이 글의 목차 */}
      {toc.length > 0 && (
        <TableOfContents toc={toc} activeId={activeId} onItemClick={handleTOCClick} />
      )}

      {/* 4. 중간 본문 섹션들 + (자가진단, FAQ 박스 분산 배치) */}
      <div data-blog-body>
        {(() => {
          const innerBoxes = [
            checklistItems.length > 0 ? <ChecklistBox key="checklist" items={checklistItems} /> : null,
            faqItems.length > 0 ? <FAQBox key="faq" items={faqItems} /> : null,
          ].filter(Boolean);

          const N = middleSections.length;
          const M = innerBoxes.length;

          const boxesPerSection: React.ReactNode[][] = Array.from({ length: Math.max(1, N) }, () => []);

          if (N > 0) {
            innerBoxes.forEach((box, i) => {
              const sectionIndex = Math.floor((i * N) / M);
              boxesPerSection[sectionIndex].push(box);
            });
          } else {
            boxesPerSection[0] = innerBoxes;
          }

          return middleSections.map((sec, idx) => (
            <React.Fragment key={idx}>
              <MarkdownRenderer content={sec} />
              {boxesPerSection[idx] && boxesPerSection[idx].map((box) => box)}
            </React.Fragment>
          ));
        })()}
      </div>

      {/* 5. 계산기 박스 */}
      <div className="mt-8 mb-6">
        <GlobalCalculatorAccordion />
      </div>

      {/* 6. 클로징 섹션 (마지막 본문) */}
      {closingSection && (
        <div data-blog-body>
          <MarkdownRenderer content={closingSection} />
        </div>
      )}

      {/* 7. CTA 박스 */}
      <div className="mt-8 mb-10">
        <CTABanner />
      </div>

      {/* 8. 관련글 박스 */}
      {relatedPostsNode && (
        <div className="mt-10">
          {relatedPostsNode}
        </div>
      )}

      {/* 9. 저자소개 박스 */}
      {authorBioNode && (
        <div className="mt-10">
          {authorBioNode}
        </div>
      )}
    </div>
  );
}
