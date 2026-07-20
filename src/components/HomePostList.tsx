'use client';

import PostCard from '@/components/ui/PostCard';
import SectionLayout, { SectionThemeColor } from '@/components/ui/SectionLayout';
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
    <div className="space-y-12 sm:space-y-16">
      {categoriesWithPosts.map(({ category, posts }) => {
        const theme = getCategoryTheme(category);
        const displayPosts = posts.slice(0, 2);

        return (
          <SectionLayout
            key={category}
            title={category}
            icon={<span aria-hidden="true">{theme.icon}</span>}
            themeColor={theme.color as SectionThemeColor}
            viewAllLink={{ href: `/blog?category=${encodeURIComponent(category)}` }}
          >
            {/* 게시물 그리드 */}
            <div className="grid gap-3 sm:gap-4 lg:gap-5 sm:grid-cols-2">
              {displayPosts.map((post) => (
                <PostCard key={post.slug} post={post} variant="grid" />
              ))}
            </div>
          </SectionLayout>
        );
      })}
    </div>
  );
}
