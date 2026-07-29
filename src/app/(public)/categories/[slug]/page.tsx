import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSortedPostsData } from '@/lib/posts';
import { ALL_CATEGORIES, getCategoryBySlug, STOP_WORDS } from '@/lib/constants/categories';
import PostCard from '@/components/ui/PostCard';
import Link from 'next/link';

export const dynamicParams = false;

// 빌드 시 모든 카테고리 페이지를 미리 생성 (정적 사이트 배포용)
export async function generateStaticParams() {
  return ALL_CATEGORIES.map((cat) => ({ slug: cat.slug }));
}

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    return {
      title: '카테고리를 찾을 수 없습니다 | 보상스쿨 손해사정 보상가이드',
    };
  }

  return {
    title: `${category.name} 전문 보상가이드 | 보상스쿨`,
    description: category.desc,
    alternates: {
      canonical: `https://claim-works.com/categories/${slug}`,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  // 서버 환경이므로 로컬 파일 시스템에서 직접 포스트를 가져와서 정렬
  const allPosts = getSortedPostsData(false);
  
  const filterText = category.name.toLowerCase();
  const keywords = [filterText, ...category.keywords];

  // 엄격한 필터링 로직 적용
  const filteredPosts = allPosts.filter(p => {
    // 1. 카테고리 또는 특수분류 완전 일치/포함
    if (p.category && p.category.toLowerCase().includes(filterText)) return true;
    if (p.specialtyCategory && p.specialtyCategory.toLowerCase().includes(filterText)) return true;
    
    // 2. 태그 매칭 (가장 중요) - 확장 키워드 포함
    if (p.tags && p.tags.length > 0) {
      const hasMatchingTag = p.tags.some(t => {
        const tag = t.toLowerCase();
        return keywords.some(kw => {
          if (tag.includes(kw) || tag === kw) {
            if (STOP_WORDS.includes(tag)) return false;
            return true;
          }
          return false;
        });
      });
      if (hasMatchingTag) return true;
    }
    
    // 3. 제목이나 요약에 키워드가 포함된 경우
    if (p.title) {
      const titleLower = p.title.toLowerCase();
      if (keywords.some(kw => titleLower.includes(kw))) return true;
    }
    
    // 4. 핵심 질환명이 제목에 포함된 경우
    const firstWord = filterText.split(/[\s(]/)[0];
    if (firstWord && firstWord.length > 1 && !STOP_WORDS.includes(firstWord)) {
       if (p.title && p.title.toLowerCase().includes(firstWord)) return true;
    }

    return false;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-4">
        <Link 
          href="/categories" 
          className="inline-flex items-center text-sm font-bold text-[#5f6368] hover:text-[var(--google-blue)] transition-colors"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          카테고리 홈으로
        </Link>
      </div>

      <div className="border-b border-[var(--google-border)] pb-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2">
          <span className="text-2xl">{category.icon}</span>
          {category.name} 보상가이드
        </h1>
        <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] mt-1.5">
          {category.desc}
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap mb-6">
        <div className="flex items-center gap-2 px-3 py-2 bg-[#e8f0fe] dark:bg-[#174ea6]/30 rounded-none border border-[var(--google-blue)]/30">
          <svg className="w-4 h-4 text-[var(--google-blue)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <span className="text-sm font-bold text-[var(--google-blue)]">{category.name}</span>
          <span className="text-xs text-[#5f6368] dark:text-[#9aa0a6]">{filteredPosts.length}개 게시글</span>
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="bg-white dark:bg-[#202124] rounded-none p-8 sm:p-10 text-center border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)]">
          <svg className="w-12 h-12 text-[#dadce0] dark:text-[#5f6368] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          <h3 className="text-lg font-bold text-[#202124] dark:text-[#e8eaed] mb-2">
            해당 진료과목과 관련된 칼럼이 없습니다.
          </h3>
          <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] mb-6 leading-relaxed">
            관련 보상 가이드 칼럼을 정성껏 준비 중입니다.<br />
            궁금하신 사항은 아래 버튼을 통해 언제든 실시간 상담을 이용해 주세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#chat"
              onClick={(e) => {
                e.preventDefault();
                // @ts-ignore - 클라이언트 사이드 이벤트 트리거 (실제로는 a 태그의 onClick에서 발생)
                if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('open-chat'));
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-none text-sm transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3c-5.5 0-10 3.5-10 7.8 0 2.7 1.7 5.1 4.2 6.5l-1.1 4.1c-.1.3.2.5.4.4l4.8-3.2c.5.1 1.1.1 1.7.1 5.5 0 10-3.5 10-7.8s-4.5-7.8-10-7.8z"/></svg>
              실시간 채팅상담
            </a>
            <Link
              href="/consultation"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--google-blue)] hover:bg-[#1557b0] text-white font-bold rounded-none text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              예약 상담 신청
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <PostCard key={post.slug} post={post as any} variant="list" />
          ))}
        </div>
      )}
    </div>
  );
}
