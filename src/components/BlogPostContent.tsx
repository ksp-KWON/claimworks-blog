'use client';

/**
 * BlogPostContent.tsx
 * 블로그 포스트 본문 렌더링 클라이언트 컴포넌트
 * - [헌법 제10조 준수: AI 자유도 100% 보장 동적 렌더링 아키텍처]
 *   - 섹션 개수가 2개든 5개든 8개든 토큰 한도 및 기승전결에 맞추어 완전 동적(Dynamic) 렌더링
 *   - 1. KeyPointsBox (핵심 요약)
 *   - 2. opening (도입부 본문 서술)
 *   - 3. TableOfContents (전체 소제목 목차)
 *   - 4. 본문 일반 챕터들 (1번 ~ N-1번 본문들 완전 자율 전개)
 *        * ChecklistBox : 본문 1번 섹션 직후 배치
 *        * FAQBox : 본문 중후반부 섹션 직후 아코디언 배치
 *   - 5. GlobalCalculatorAccordion (계산기 아코디언)
 *   - 6. closingSection (마지막 결론 및 맞춤 솔루션 챕터)
 *   - 7. CTABanner (무료 상담 신청 배너)
 *   - 8. relatedPostsNode (관련 글)
 *   - 9. authorBioNode (손해사정사 프로필)
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

  // ── [AI 자유도 보장] 동적 본문 & 클로징 분리 알고리즘 ──
  // 섹션이 1개든 10개든 제한 없이 유연하게 처리
  const CLOSING_PATTERN = /^(?:#+s*)?(?:d+[.)]s*)?(?:[⚖️💡🛡️📌s]*)(?:결론|솔루션|마무리|대응s*전략|권익s*보호|맺음말)/i;

  let bodySections: string[] = sections;
  let closingSection: string | null = null;

  if (sections.length > 1) {
    const lastSection = sections[sections.length - 1];
    const firstLineOfLast = lastSection.trim().split('\n')[0];
    
    // 마지막 섹션이 결론 성격이거나, 총 섹션 수가 3개 이상일 때 마지막 챕터를 계산기 뒤 솔루션으로 배치
    if (CLOSING_PATTERN.test(firstLineOfLast) || sections.length >= 3) {
      bodySections = sections.slice(0, -1);
      closingSection = lastSection;
    }
  }

  // 본문 개수에 따른 유연한 체크리스트 & FAQ 배치 인덱스
  const N = bodySections.length;
  const checklistTargetIdx = 0; // 1번 챕터 직후
  const faqTargetIdx = N >= 2 ? N - 1 : 0; // 본문 전개의 마지막 직전/직후

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

      {/* 3. 이 글의 목차 (TOC - AI가 생성한 N개 챕터 100% 동적 반영) */}
      {toc.length > 0 && (
        <TableOfContents toc={toc} activeId={activeId} onItemClick={handleTOCClick} />
      )}

      {/* 4. 본문 일반 챕터들 (AI의 창작 자유도에 따라 1번 ~ N번까지 순차 전개) */}
      <div data-blog-body className="space-y-6">
        {bodySections.map((sec, idx) => (
          <React.Fragment key={idx}>
            <MarkdownRenderer content={sec} />

            {/* 체크리스트 박스 (1번 챕터 직후 자연스럽게 배치) */}
            {idx === checklistTargetIdx && checklistItems.length > 0 && (
              <div className="my-6">
                <ChecklistBox items={checklistItems} />
              </div>
            )}

            {/* FAQ 아코디언 박스 (본문 중후반부 직후 배치) */}
            {idx === faqTargetIdx && faqItems.length > 0 && (
              <div className="my-6">
                <FAQBox items={faqItems} />
              </div>
            )}
          </React.Fragment>
        ))}

        {/* 본문 섹션이 없을 때의 안전 fallback */}
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

      {/* 5. 보상스쿨 통합 계산기 (본문 일반 전개 완료 후 자가 진단 유도) */}
      <div className="mt-10 mb-6">
        <GlobalCalculatorAccordion />
      </div>

      {/* 6. 결론 및 맞춤 솔루션 (계산기 직후 확신 부여 챕터) */}
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
