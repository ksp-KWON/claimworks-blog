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
import AutoCalculatorContainer from './calculator/auto/AutoCalculatorContainer';
import MedicalCalculator from './calculator/MedicalCalculator';

// 분리된 서브 컴포넌트 임포트
import KeyPointsBox from './blog/KeyPointsBox';
import FAQBox from './blog/FAQBox';
import CTABanner from './blog/CTABanner';
import AuthorBioCard from './blog/AuthorBioCard';
import ChecklistBox from './blog/ChecklistBox';
import TableOfContents from './blog/TableOfContents';
import GlobalCalculatorAccordion from './blog/GlobalCalculatorAccordion';
import MarkdownRenderer from './blog/MarkdownRenderer';

import { parseBlogPost } from '@/lib/blog-utils';

// ─── 스크롤 오프셋: header(64) + sticky banner(52) + 버퍼(20) = 136px ───
const SCROLL_OFFSET = 140;

interface TOCItem { id: string; text: string; }
interface BlogPostContentProps { content: string; }

export default function BlogPostContent({ content }: BlogPostContentProps) {
  const [activeId, setActiveId] = useState('');
  const [calcOpen, setCalcOpen] = useState(false);

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

      {/* 3. 본문 (섹션별 렌더링 및 컴포넌트 삽입) */}
      <div data-blog-body>
        {sections.map((sec, idx) => (
          <React.Fragment key={idx}>
            <MarkdownRenderer content={sec} />
            
            {idx === 0 && checklistItems.length > 0 && <ChecklistBox items={checklistItems} />}
            {idx === 1 && faqItems.length > 0 && <FAQBox items={faqItems} />}
            {idx === 2 && <GlobalCalculatorAccordion />}
            {idx === 3 && <CTABanner />}
          </React.Fragment>
        ))}

        {/* 남은 컴포넌트 처리 (섹션 개수가 모자랄 경우) */}
        {sections.length <= 0 && checklistItems.length > 0 && <ChecklistBox items={checklistItems} />}
        {sections.length <= 1 && faqItems.length > 0 && <FAQBox items={faqItems} />}
        {sections.length <= 2 && <GlobalCalculatorAccordion />}
        {sections.length <= 3 && <CTABanner />}
      </div>

      {/* 4. 저자 바이오 카드 (맨 하단) */}
      <AuthorBioCard />
    </div>
  );
}
