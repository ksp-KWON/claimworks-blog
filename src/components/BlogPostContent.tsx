'use client';

/**
 * BlogPostContent.tsx
 * 블로그 포스트 본문 렌더링 클라이언트 컴포넌트
 * - [황금 전환 퍼널(Conversion Funnel) 표준 레이아웃]
 *   1. KeyPointsBox (핵심 요약)
 *   2. opening (도입부 본문 서술)
 *   3. TableOfContents (목차)
 *   4. 본문 일반 섹션들 (본문 1번 ~ 본문 4번)
 *      - ChecklistBox (본문 1번 섹션 직후 배치)
 *      - FAQBox (본문 비교표/섹션 직후 아코디언 배치)
 *   5. GlobalCalculatorAccordion (계산기 아코디언)
 *   6. closingSection (5. 결론 및 보상스쿨 맞춤 솔루션)
 *   7. CTABanner (무료 상담 신청 배너)
 *   8. relatedPostsNode (관련 글 목록)
 *   9. authorBioNode (손해사정사 프로필)
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

  // ── 지능형 클로징 섹션(결론 및 솔루션) 감지 알고리즘 ──
  // 마지막 섹션이 '결론', '솔루션', '마무리', '대응 전략' 등인지 확인하여 분리
  const CLOSING_PATTERN = /^(?:#+s*)?(?:d+[.)]s*)?(?:[⚖️💡🛡️📌s]*)(?:결론|솔루션|마무리|대응s*전략|권익s*보호|맺음말)/i;

  let bodySections: string[] = sections;
  let closingSection: string | null = null;

  if (sections.length > 1) {
    const lastSection = sections[sections.length - 1];
    const firstLineOfLast = lastSection.trim().split('\n')[0];
    if (CLOSING_PATTERN.test(firstLineOfLast) || sections.length >= 4) {
      bodySections = sections.slice(0, -1);
      closingSection = lastSection;
    }
  }

  // 체크리스트와 FAQ가 배치될 최적의 섹션 인덱스 계산
  const N = bodySections.length;
  const checklistTargetIdx = 0; // 1번 섹션 직후
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

      {/* 4. 본문 일반 섹션들 (본문 1번 ~ 본문 4번) */}
      <div data-blog-body className="space-y-6">
        {bodySections.map((sec, idx) => (
          <React.Fragment key={idx}>
            <MarkdownRenderer content={sec} />

            {/* 체크리스트 박스 (1번 섹션 직후) */}
            {idx === checklistTargetIdx && checklistItems.length > 0 && (
              <div className="my-6">
                <ChecklistBox items={checklistItems} />
              </div>
            )}

            {/* FAQ 아코디언 박스 (본문 비교표/섹션 직후) */}
            {idx === faqTargetIdx && faqItems.length > 0 && (
              <div className="my-6">
                <FAQBox items={faqItems} />
              </div>
            )}
          </React.Fragment>
        ))}

        {/* 본문 섹션이 없을 때의 fallback */}
        {bodySections.length === 0 && checklistItems.length > 0 && (
          <div className="my-6">
            <ChecklistBox items={checklistItems} />
          </div>
        )}
        {bodySections.length === 0 && faqItems.length > 0 && (
          <div className="my-6">
            <FAQBox items={faqItems} />
          </div>
        )}
      </div>

      {/* 5. 보상스쿨 통합 계산기 (본문 4번 직후, 결론 직전의 최적 타이밍!) */}
      <div className="mt-10 mb-6">
        <GlobalCalculatorAccordion />
      </div>

      {/* 6. 결론 및 보상스쿨의 맞춤형 솔루션 (클로징 섹션) */}
      {closingSection && (
        <div data-blog-body className="mt-6 mb-6">
          <MarkdownRenderer content={closingSection} />
        </div>
      )}

      {/* 7. CTA 무료 상담 신청 배너 */}
      <div className="mt-8 mb-10">
        <CTABanner />
      </div>

      {/* 8. 관련 글 탐색 박스 */}
      {relatedPostsNode && (
        <div className="mt-10">
          {relatedPostsNode}
        </div>
      )}

      {/* 9. 전문가 프로필 카드 */}
      {authorBioNode && (
        <div className="mt-10">
          {authorBioNode}
        </div>
      )}
    </div>
  );
}
