'use client';

import Link from 'next/link';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumBadge from '@/components/ui/PremiumBadge';

// Post 데이터 타입 정의 (임시, 필요시 lib/posts에서 가져옴)
type PostData = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  content?: string;
  tags?: string[];
  category: string;
};

const getCategoryTheme = (category: string) => {
  const c = category || '보상가이드';
  
  if (c.includes('교통사고')) return { color: 'red' as const, icon: '🚗' };
  if (c.includes('사망') || c.includes('자살')) return { color: 'rose' as const, icon: '⚖️' };
  if (c.includes('질병진단') || c.includes('실손') || c.includes('의료비')) return { color: 'blue' as const, icon: '🏥' };
  if (c.includes('배상책임') || c.includes('의료')) return { color: 'green' as const, icon: '🛡️' };
  if (c.includes('근재') || c.includes('산재')) return { color: 'teal' as const, icon: '👷' };
  if (c.includes('장해평가') || c.includes('면책') || c.includes('후유장해')) return { color: 'purple' as const, icon: '♿' };
  if (c.includes('판례') || c.includes('법률')) return { color: 'indigo' as const, icon: '📖' };
  return { color: 'yellow' as const, icon: '💡' };
}

const CATEGORIES = [
  '판례·법률 해석',
  '사망·자살 보험금',
  '질병진단·실손',
  '교통사고 보상',
  '배상책임·의료',
  '근재·산재 사고',
  '장해평가·면책',
  '보상가이드'
];

export default function HomePostList({ initialPosts }: { initialPosts: PostData[] }) {
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
    <div className="space-y-8 sm:space-y-12">
      {categoriesWithPosts.map(({ category, posts }) => {
        const theme = getCategoryTheme(category);
        const displayPosts = posts.slice(0, 2);

        return (
          <section key={category} className="relative group/box">
            <PremiumCard borderColor={theme.color} hoverEffect className="!p-6 sm:!p-8">
            
              {/* 블록 헤더 */}
              <div className="flex items-end justify-between mb-6 pb-2 border-b border-gray-100 dark:border-white/5 relative z-10 group/header">
                
                <PremiumHeading level={2} gradient={theme.color} icon={<span aria-hidden="true">{theme.icon}</span>} className="!mb-0" showLeftBorder={false}>
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
                {displayPosts.map((post) => {
                  const firstCategory = post.category ? post.category.split(',')[0].trim() : '보상가이드';
                  const postTheme = getCategoryTheme(firstCategory);
                  
                  return (
                    <Link 
                      href={`/blog/${post.slug}`} 
                      key={post.slug}
                      className="group flex flex-col relative bg-gray-50/50 dark:bg-[#202124] border border-gray-100 dark:border-white/10 p-5 transition-all duration-300 overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
                    >
                      <div className="flex items-center justify-between gap-2 mb-3 z-10">
                        <PremiumBadge color={postTheme.color}>{firstCategory}</PremiumBadge>
                        <time className="text-[11px] font-medium text-gray-400 dark:text-gray-500 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          {post.date}
                        </time>
                      </div>
                      <div className="flex-1 space-y-2.5 z-10">
                        <h3 className={`text-[15px] sm:text-base font-bold text-gray-900 dark:text-white leading-snug break-keep group-hover:text-${theme.color}-500 transition-colors`}>
                          {post.title}
                        </h3>
                        <p className="text-xs sm:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 break-keep">
                          {post.summary}
                        </p>
                      </div>

                      {/* 하단: 디테일 바로가기 링크 */}
                      <div className={`mt-4 w-full text-[13px] font-bold text-[#202124] dark:text-[#e8eaed] flex items-center justify-between transition-colors p-2.5 rounded-none bg-gray-50 dark:bg-white/5 group-hover:bg-gray-100 dark:group-hover:bg-white/10 group-hover:text-${theme.color}-600 dark:group-hover:text-${theme.color}-400`}>
                        <div className="flex items-center gap-2">
                          전문 읽기
                        </div>
                        <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </PremiumCard>
          </section>
        );
      })}
    </div>
  );
}
