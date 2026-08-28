'use client';

import PostCard from '@/components/ui/PostCard';
import SectionLayout, { SectionThemeColor } from '@/components/ui/SectionLayout';
import AppIcon from '@/components/ui/AppIcon';
import { PostData } from '@/lib/posts';
import { COLUMN_CATEGORIES, isCategoryMatch } from '@/lib/constants/categories';

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
    <div className="space-y-8 sm:space-y-10">
      {categoriesWithPosts.map(({ category, posts }) => {
        const themeMap: Record<string, SectionThemeColor> = {
          sky: 'cyan',
          emerald: 'green',
          amber: 'yellow',
          indigo: 'indigo',
          rose: 'rose',
          red: 'red',
          orange: 'orange',
          purple: 'purple',
          blue: 'blue',
          teal: 'teal'
        };
        const themeColor: SectionThemeColor = themeMap[category.themeColor] || 'blue';
        const displayPosts = posts.slice(0, 2);

        return (
          <SectionLayout
            key={category.slug}
            title={category.name}
            icon={<AppIcon name={category.iconName} size={22} />}
            watermarkIcon={category.iconName}
            themeColor={themeColor}
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
