'use client';

import PostCard from '@/components/ui/PostCard';
import SectionLayout, { SectionThemeColor } from '@/components/ui/SectionLayout';
import { PostData } from '@/lib/posts';
import { COLUMN_CATEGORIES } from '@/lib/constants/categories';

export default function HomePostList({ initialPosts }: { initialPosts: Omit<PostData, 'content'>[] }) {
  // 카테고리별로 포스트 분류
  const categoriesWithPosts = COLUMN_CATEGORIES.map(cat => {
    const posts = initialPosts.filter(post => {
      if (!post.category) return false;
      const cats = Array.isArray(post.category) 
        ? post.category 
        : typeof post.category === 'string'
          ? post.category.split(',').map(x => x.trim()).filter(Boolean)
          : [];
      return cats.some(c => c.includes(cat.name) || cat.name.includes(c));
    });
    return { category: cat, posts };
  }).filter(item => item.posts.length > 0);

  return (
    <div className="space-y-12 sm:space-y-16">
      {categoriesWithPosts.map(({ category, posts }) => {
        const themeColorMap: Record<string, string> = {
          'bg-[var(--google-blue)]': 'blue',
          'bg-rose-500': 'rose',
          'bg-blue-500': 'blue',
          'bg-red-500': 'red',
          'bg-green-500': 'green',
          'bg-teal-500': 'teal',
          'bg-purple-500': 'purple',
          'bg-yellow-600': 'yellow'
        };
        const themeColor = themeColorMap[category.color] || 'blue';
        const displayPosts = posts.slice(0, 2);

        return (
          <SectionLayout
            key={category.slug}
            title={category.name}
            icon={<span aria-hidden="true">{category.icon}</span>}
            themeColor={themeColor as SectionThemeColor}
            viewAllLink={{ href: `/categories/${category.slug}` }}
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
