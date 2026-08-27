import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSortedPostsData } from '@/lib/posts';
import { ALL_CATEGORIES, getCategoryBySlug, isCategoryMatch, STOP_WORDS } from '@/lib/constants/categories';
import PostCard from '@/components/ui/PostCard';
import Link from 'next/link';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumBadge from '@/components/ui/PremiumBadge';
import PremiumHeaderBanner from '@/components/ui/PremiumHeaderBanner';
import AppIcon from '@/components/ui/AppIcon';

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
      title: '카테고리를 찾을 수 없습니다 | 보상스쿨 전문 손해사정 그룹',
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
    if (p.category && isCategoryMatch(String(p.category), category.name)) return true;
    if (p.specialtyCategory && String(p.specialtyCategory).toLowerCase().includes(filterText)) return true;
    
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
    <div className="w-full space-y-6 sm:space-y-8">
      {/* 1. 상단 브레드크럼 */}
      <nav className="flex text-xs text-[#5f6368] dark:text-[#9aa0a6]" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1.5">
          <li><Link href="/" className="hover:text-[var(--google-blue)] transition-colors">홈</Link></li>
          <li><span className="mx-1">/</span></li>
          <li><Link href="/categories" className="hover:text-[var(--google-blue)] transition-colors">분야별 전문 보상가이드</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="text-[#202124] dark:text-[#e8eaed] font-medium" aria-current="page">{category.name}</li>
        </ol>
      </nav>

      {/* 2. 헤더 배너 */}
      <PremiumHeaderBanner
        theme={category.themeColor as any}
        icon={category.iconName}
        title={`${category.name} 전문 보상가이드`}
        badges={[`${category.name} 전문 가이드`, { text: `총 ${filteredPosts.length}개 심층 칼럼`, color: 'gray' }]}
        description={`${category.desc} 관련 보험사 면책 분쟁 대응과 손해사정 성공 실무 사례를 안내합니다.`}
        rightLink={{ href: '/categories', text: '전체 분야 보기' }}
      />

      {/* 3. 칼럼 목록 렌더링 */}
      {filteredPosts.length === 0 ? (
        <PremiumCard borderColor="default" hoverEffect={false} className="!p-8 sm:!p-10 text-center">
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 flex items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
              <AppIcon name="file-text" size={24} />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#202124] dark:text-[#e8eaed]">
              해당 분야와 관련된 칼럼을 정성껏 준비 중입니다.
            </h3>
            <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-md leading-relaxed font-medium">
              관련 사안으로 빠른 검토가 필요하신 경우 아래 버튼을 통해 실시간 상담을 이용해 주세요.
            </p>
            <div className="pt-2 flex flex-wrap gap-2.5 justify-center">
              <Link
                href="/consultation"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
              >
                <span>1:1 무료상담 신청</span>
                <AppIcon name="chevron-right" size={14} />
              </Link>
              <Link
                href="/categories"
                className="px-4 py-2.5 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-[#202124] dark:text-[#e8eaed] border border-gray-300 dark:border-zinc-700 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all"
              >
                <span>다른 카테고리 둘러보기</span>
              </Link>
            </div>
          </div>
        </PremiumCard>
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
