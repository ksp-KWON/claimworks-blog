'use client';

import PostCard from '@/components/ui/PostCard';
import SectionLayout, { SectionThemeColor } from '@/components/ui/SectionLayout';
import { PostData } from '@/lib/posts';
import { COLUMN_CATEGORIES, isCategoryMatch } from '@/lib/constants/categories';
import { CATEGORY_ICONS } from '@/components/ui/CategoryIcons';

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
      return cats.some(c => isCategoryMatch(c, cat.name));
    });
    return { category: cat, posts };
  }).filter(item => item.posts.length > 0);

  return (
    <div className="space-y-12 sm:space-y-16">
      {categoriesWithPosts.map(({ category, posts }) => {
        const themeColorMap: Record<string, SectionThemeColor> = {
          'bg-blue-600': 'blue',
          'bg-[var(--google-blue)]': 'blue',
          'bg-rose-500': 'rose',
          'bg-sky-500': 'cyan',
          'bg-cyan-600': 'cyan',
          'bg-indigo-500': 'cyan',
          'bg-red-600': 'red',
          'bg-red-500': 'red',
          'bg-emerald-600': 'green',
          'bg-green-500': 'green',
          'bg-orange-500': 'orange',
          'bg-teal-500': 'orange',
          'bg-purple-600': 'purple',
          'bg-purple-500': 'purple',
          'bg-amber-500': 'yellow',
          'bg-yellow-600': 'yellow'
        };
        const themeColor = themeColorMap[category.color] || 'blue';
        const displayPosts = posts.slice(0, 2);

        return (
          <SectionLayout
            key={category.slug}
            title={category.name}
            icon={(() => { const Icon = CATEGORY_ICONS[category.slug]; return Icon ? <Icon /> : null; })()}
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
