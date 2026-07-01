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
  // Single pass parser 호출
  const { keyPoints, checklistItems, faqItems, toc, sections } = parseBlogPost(content);

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

  return (
    <div>
      {/* 1. 목차 (최상단) */}
      {toc.length > 0 && (
        <TableOfContents toc={toc} activeId={activeId} onItemClick={handleTOCClick} />
      )}

      {/* 2. Key Points */}
      {keyPoints.length > 0 && <KeyPointsBox points={keyPoints} />}

      {/* 3. 본문 (섹션별 렌더링 및 컴포넌트 자동 분배 삽입) */}
      <div data-blog-body>
        {(() => {
          // 유효한 컴포넌트들을 순서대로 수집
          const validBoxes = [
            checklistItems.length > 0 ? <ChecklistBox key="checklist" items={checklistItems} /> : null,
            faqItems.length > 0 ? <FAQBox key="faq" items={faqItems} /> : null,
            <GlobalCalculatorAccordion key="calc" />,
            <CTABanner key="cta" />,
            relatedPostsNode ? <React.Fragment key="related">{relatedPostsNode}</React.Fragment> : null,
            authorBioNode ? <React.Fragment key="author">{authorBioNode}</React.Fragment> : null
          ].filter(Boolean); // null 제외

          const N = sections.length;
          const M = validBoxes.length;

          // 각 섹션 인덱스에 할당될 박스 배열 초기화
          const boxesPerSection: React.ReactNode[][] = Array.from({ length: Math.max(1, N) }, () => []);

          if (N > 0) {
            // 박스 개수(M)를 섹션 개수(N)에 균등하게 분배
            validBoxes.forEach((box, i) => {
              const sectionIndex = Math.floor((i * N) / M);
              boxesPerSection[sectionIndex].push(box);
            });
          } else {
            // 섹션이 아예 없는 예외 경우 (모두 0번째에 몰아넣음)
            boxesPerSection[0] = validBoxes;
          }

          // 섹션과 할당된 박스들을 순차적으로 렌더링
          return sections.map((sec, idx) => (
            <React.Fragment key={idx}>
              <MarkdownRenderer content={sec} />
              {boxesPerSection[idx] && boxesPerSection[idx].map((box) => box)}
            </React.Fragment>
          ));
        })()}
      </div>

    </div>
  );
}
