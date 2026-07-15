'use client';

import Link from 'next/link';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PostCard from '@/components/ui/PostCard';
import { PostData } from '@/lib/posts';
import { CATEGORIES, getCategoryTheme } from '@/lib/constants';

export default function HomePostList({ initialPosts }: { initialPosts: Omit<PostData, 'content'>[] }) {
  // 카테고리별로 포스트 분류
  const categoriesWithPosts = CATEGORIES.map(category => {
    const posts = initialPosts.filter(post => {
      if (!post.category) return false;
      const cats = post.category.split(',').map(x => x.trim()).filter(Boolean);
      return cats.some(cat => cat.includes(category) || category.includes(cat));
    });
    return { category, posts };
  }).filter(item => item.posts.length > 0);

  return (
    <div className="space-y-10 sm:space-y-14">
      {categoriesWithPosts.map(({ category, posts }) => {
        const theme = getCategoryTheme(category);
        const displayPosts = posts.slice(0, 2);

        return (
          <section key={category} className="relative group/box">
            <PremiumCard borderColor={theme.color} hoverEffect className="!p-6 sm:!p-8">
            
              {/* 블록 헤더 */}
              <div className="flex items-end justify-between mb-6 pb-2 border-b border-gray-100 dark:border-white/5 relative z-10 group/header">
                
                <PremiumHeading level={2} gradient={theme.color} icon={<span aria-hidden="true">{theme.icon}</span>} className="!mb-0" showLeftBorder={true}>
                  {category}
                </PremiumHeading>
                
                <Link 
                  href={`/blog?category=${encodeURIComponent(category)}`}
                  className={`flex items-center gap-1 text-[11px] sm:text-xs font-bold text-gray-500 hover:text-${theme.color}-500 transition-colors group/link`}
                >
                  전체보기
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </Link>
              </div>
              
              {/* 게시물 그리드 */}
              <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 relative z-10">
                {displayPosts.map((post) => (
                  <PostCard key={post.slug} post={post} variant="grid" />
                ))}
              </div>
            </PremiumCard>
          </section>
        );
      })}
    </div>
  );
}
