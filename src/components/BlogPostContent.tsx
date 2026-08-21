'use client';

/**
 * BlogPostContent.tsx
 * 블로그 포스트 본문 렌더링 클라이언트 컴포넌트
 * - [황금 표준 레이아웃 순서]
 *   1. KeyPointsBox (핵심 요약)
 *   2. opening (도입부 본문 서술)
 *   3. TableOfContents (목차)
 *   4. 본문 섹션들 (본문 1번 ~ 본문 끝까지 순차 렌더링)
 *      - ChecklistBox (본문 1~2번 섹션 직후 자연스럽게 배치)
 *      - FAQBox (본문 비교표/섹션 직후 아코디언 배치)
 *   5. GlobalCalculatorAccordion (본문 종료 후 계산기)
 *   6. CTABanner (무료 상담 신청)
 *   7. relatedPostsNode (관련 글)
 *   8. authorBioNode (손해사정사 프로필)
 */

import React, { useEffect, useState } from 'react';
import KeyPointsBox from './blog/KeyPointsBox';
import FAQBox from './blog/FAQBox';
import CTABanner from './blog/CTABanner';
import ChecklistBox from './blog/ChecklistBox';
import TableOfContents from './blog/TableOfContents';
import GlobalCalculatorAccordion from './blog/GlobalCalculatorAccordion';
import MarkdownRenderer from './blog/MarkdownRenderer';

import { parseBlogPost } from '@/lib/blog-utils';

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

  // 체크리스트와 FAQ가 배치될 최적의 섹션 인덱스 계산
  // - 체크리스트: 1번 섹션 직후 (인덱스 0 뒤)
  // - FAQ: 본문 후반부 (예: N-2번째 또는 N-1번째 섹션 뒤)
  const N = sections.length;
  const checklistTargetIdx = N > 1 ? 0 : 0;
  const faqTargetIdx = N >= 3 ? Math.min(2, N - 1) : N > 1 ? 1 : 0;

  return (
    <div className="space-y-6">
      {/* 1. 핵심 요약 포인트 박스 */}
      {keyPoints.length > 0 && <KeyPointsBox points={keyPoints} />}

      {/* 2. 오프닝 (도입부 본문 서술) */}
      {opening && (
        <div data-blog-body className="text-gray-700 dark:text-gray-300 leading-relaxed">
          <MarkdownRenderer content={opening} />
        </div>
      )}

      {/* 3. 이 글의 목차 (TOC) */}
      {toc.length > 0 && (
        <TableOfContents toc={toc} activeId={activeId} onItemClick={handleTOCClick} />
      )}

      {/* 4. 본문 전체 순차 렌더링 (체크리스트 & FAQ 자연스럽게 결합) */}
      <div data-blog-body className="space-y-6">
        {sections.map((sec, idx) => (
          <React.Fragment key={idx}>
            <MarkdownRenderer content={sec} />

            {/* 체크리스트 박스 (1번 섹션 직후) */}
            {idx === checklistTargetIdx && checklistItems.length > 0 && (
              <div className="my-6">
                <ChecklistBox items={checklistItems} />
              </div>
            )}

            {/* FAQ 아코디언 박스 (본문 후반부 섹션 직후) */}
            {idx === faqTargetIdx && faqItems.length > 0 && (
              <div className="my-6">
                <FAQBox items={faqItems} />
              </div>
            )}
          </React.Fragment>
        ))}

        {/* 섹션이 없을 때 fallback */}
        {sections.length === 0 && checklistItems.length > 0 && (
          <div className="my-6">
            <ChecklistBox items={checklistItems} />
          </div>
        )}
        {sections.length === 0 && faqItems.length > 0 && (
          <div className="my-6">
            <FAQBox items={faqItems} />
          </div>
        )}
      </div>

      {/* 5. 보상스쿨 통합 계산기 (모든 본문이 온전히 끝난 뒤 하단 배치) */}
      <div className="mt-10 mb-6">
        <GlobalCalculatorAccordion />
      </div>

      {/* 6. CTA 무료 상담 배너 */}
      <div className="mt-8 mb-10">
        <CTABanner />
      </div>

      {/* 7. 관련 글 탐색 박스 */}
      {relatedPostsNode && (
        <div className="mt-10">
          {relatedPostsNode}
        </div>
      )}

      {/* 8. 전문가 프로필 카드 */}
      {authorBioNode && (
        <div className="mt-10">
          {authorBioNode}
        </div>
      )}
    </div>
  );
}
