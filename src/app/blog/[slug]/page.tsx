import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPostData, getSortedPostsData } from '@/lib/posts';
import type { Metadata } from 'next';
import BlogPostContent from '@/components/BlogPostContent';
import AuthorBioCard from '@/components/blog/AuthorBioCard';
import { parseBlogPost } from '@/lib/blog-utils';

export const dynamicParams = false;

// 빌드 시 모든 블로그 글을 미리 생성 (정적 사이트 배포용)
export async function generateStaticParams() {
  const posts = getSortedPostsData(false);
  return posts.map((post) => ({ slug: post.slug }));
}

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

// SEO를 위한 동적 메타데이터 생성
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostData(slug);

  if (!post) {
    return {
      title: '포스트를 찾을 수 없습니다 | 보상스쿨 손해사정 보상가이드',
    };
  }

  const ogImageUrl = `https://claim-works.com/blog/${slug}/opengraph-image`;

  return {
    title: `${post.title} | 보상스쿨 손해사정 보상가이드`,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.date,
      authors: ['보상스쿨 손해사정사'],
      siteName: '보상스쿨 헬스케어 & 손해사정 보상가이드',
      locale: 'ko_KR',
      url: `https://claim-works.com/blog/${slug}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `https://claim-works.com/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostData(slug);

  if (!post) {
    notFound();
  }

  // FAQ 파싱 — 단일 파서 사용
  const { faqItems: faqs } = parseBlogPost(post.content);


  const postUrl = `https://claim-works.com/blog/${slug}`;
  const ogImageUrl = `https://claim-works.com/blog/${slug}/opengraph-image`;

  // 1. BlogPosting 구조화 데이터 (구글 리치결과 완전 자격 요건 충족)
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.summary,
    "datePublished": post.date,
    "dateModified": post.updatedAt || post.date,
    "url": postUrl,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": postUrl
    },
    "image": {
      "@type": "ImageObject",
      "url": ogImageUrl,
      "width": 1200,
      "height": 630
    },
    "author": {
      "@type": "Person",
      "name": "보상스쿨 손해사정사",
      "url": "https://claim-works.com/about"
    },
    "publisher": {
      "@type": "Organization",
      "name": "보상스쿨",
      "url": "https://claim-works.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://claim-works.com/favicon.ico",
        "width": 32,
        "height": 32
      }
    },
    "inLanguage": "ko-KR",
    "keywords": post.tags?.join(', ') ?? ''
  };

  // 2. Breadcrumb 구조화 데이터
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "홈",
        "item": "https://claim-works.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "블로그",
        "item": "https://claim-works.com/blog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.title,
        "item": postUrl
      }
    ]
  };

  // 3. FAQ 구조화 데이터 (존재하는 경우에만 생성)
  const faqJsonLd = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a.replace(/\*\*/g, '').replace(/<[^>]*>/g, '') // 마크다운 볼드 및 HTML 태그 제거
      }
    }))
  } : null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <article className="bg-white dark:bg-[#202124] rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:border-[var(--google-blue)] hover:shadow-[0_16px_50px_rgba(26,115,232,0.2)] transition-all duration-300 overflow-hidden">
        <div className="px-3 py-6 sm:px-8 sm:py-10 space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      {/* 상단 네비게이션 */}
      <div className="mb-6">
        <Link
          href="/blog"
          className="inline-flex items-center text-sm font-bold text-[#5f6368] hover:text-[var(--google-blue)] transition-colors"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          목록으로 돌아가기
        </Link>
      </div>

      {/* 글 헤더 */}
      <header className="border-b border-[var(--google-border)] pb-8 mb-8 sm:mb-10">
        <div className="flex flex-wrap items-center gap-3 text-xs mb-4">
          <span className="px-2.5 py-1 font-bold rounded-none bg-[var(--google-surface-variant)] text-[#5f6368] dark:bg-[#303134] dark:text-[#9aa0a6] border border-transparent">
            {post.category}
          </span>
          {post.caseNumber && (
            <span className="px-2.5 py-1 font-bold rounded-none bg-[#fce8e6] dark:bg-[#c5221f]/10 text-[#c5221f] dark:text-[#f28b82] border border-[#f28b82]/30 flex items-center gap-1">
              ⚖️ 사건번호: {post.caseNumber}
            </span>
          )}
          {/* 발행일 */}
          <time dateTime={post.date} className="text-[#5f6368] dark:text-[#9aa0a6] font-medium tracking-wide flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            발행 {post.date}
          </time>
          {/* 수정일 — 발행일과 다를 때만 표시 */}
          {post.updatedAt && post.updatedAt !== post.date && (
            <time dateTime={post.updatedAt} className="text-[#1A73E8] dark:text-[#8ab4f8] font-bold tracking-wide flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              업데이트 {post.updatedAt}
            </time>
          )}
          {post.specialtyCategory && (
            <span className="px-2.5 py-1 font-bold rounded-none bg-[#e8f0fe] dark:bg-[#174ea6]/20 text-[var(--google-blue)] dark:text-[#8ab4f8] text-xs">
              {post.specialtyCategory}
            </span>
          )}
        </div>

        {/* 제목 */}
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[#202124] dark:text-[#e8eaed] tracking-tight leading-snug">
          {post.title}
        </h1>


      </header>

      {/* 본문 — BlogPostContent 컴포넌트로 렌더링 (내부에서 박스 자동 분배) */}
      <BlogPostContent 
        content={post.content} 
        relatedPostsNode={<RelatedPostsBox currentSlug={slug} currentPost={post} />}
        authorBioNode={<AuthorBioCard />}
      />

      {/* 태그 목록 */}
      <footer className="mt-14 pt-8 border-t border-[var(--google-border)]">
        <div className="flex flex-wrap gap-2.5">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/blog?tag=${encodeURIComponent(tag)}`}
              className="text-[13px] font-bold text-[var(--google-blue)] dark:text-[#8ab4f8] bg-[#e8f0fe] dark:bg-[#174ea6]/20 px-3.5 py-1.5 rounded-full border border-[var(--google-blue)]/20 hover:bg-[#d2e3fc] dark:hover:bg-[#174ea6]/40 transition-colors cursor-pointer"
            >
              #{tag}
            </Link>
          ))}
        </div>
      </footer>
        </div>
      </article>
    </div>
  );
}

// ─── 관련 글 보기 박스 ───
function RelatedPostsBox({
  currentSlug,
  currentPost,
}: {
  currentSlug: string;
  currentPost: { category: string; tags: string[]; title: string };
}) {
  const allPosts = getSortedPostsData(false);

  // 같은 카테고리이거나 태그가 겹치는 글 → 점수 높은 순 최대 3개
  const scored = allPosts
    .filter(p => p.slug !== currentSlug)
    .map(p => {
      let score = 0;
      if (p.category === currentPost.category) score += 3;
      const sharedTags = p.tags.filter(t => currentPost.tags.includes(t)).length;
      score += sharedTags * 2;
      return { ...p, score };
    })
    .sort((a, b) => b.score - a.score || b.date.localeCompare(a.date))
    .slice(0, 3);

  if (scored.length === 0) return null;

  return (
    <div className="mt-12 bg-white dark:bg-[#202124] p-5 sm:p-6 rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:shadow-[0_16px_50px_rgba(26,115,232,0.25)] hover:border-[#1a73e8] transition-all duration-300 relative overflow-hidden group">
      <div className="absolute right-[-10px] bottom-[-20px] opacity-[0.03] dark:opacity-[0.05] text-[120px] select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
        🔗
      </div>
      
      <div className="relative z-10 space-y-5">
        <div>
          <h3 className="font-extrabold text-gray-900 dark:text-white text-[16px] tracking-tight flex items-center gap-2 border-l-4 border-[#1a73e8] pl-2.5">
            <span className="text-[17px] leading-none">🔗</span>
            함께 읽으면 도움이 되는 글
          </h3>
          <p className="text-xs sm:text-[13px] text-[#5f6368] dark:text-[#9aa0a6] mt-2 leading-relaxed ml-3.5">
            비슷한 주제의 다른 보상 사례들도 확인해 보세요
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {scored.map(p => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="group flex flex-row items-center gap-3 p-3.5 rounded-none bg-gray-50 dark:bg-[#2d2e30] border border-gray-100 dark:border-white/5 hover:border-[#1A73E8] hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(26,115,232,0.15)] hover:bg-white dark:hover:bg-[#353638] transition-all duration-300 relative overflow-hidden"
            >
              <span className="text-[10px] font-bold px-2 py-1 rounded-none bg-white dark:bg-white/10 text-[#1A73E8] dark:text-[#8ab4f8] border border-gray-200 dark:border-white/10 shadow-sm shrink-0">
                {p.category}
              </span>
              <span className="flex-1 text-[14px] font-bold text-gray-800 dark:text-gray-100 leading-snug line-clamp-1 group-hover:text-[#1A73E8] dark:group-hover:text-[#8ab4f8] transition-colors">
                {p.title}
              </span>
              <svg className="w-4 h-4 shrink-0 text-gray-300 dark:text-gray-600 group-hover:text-[#1a73e8] dark:group-hover:text-[#8ab4f8] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="square" strokeLinejoin="miter" d="M9 5l7 7-7 7" /></svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
