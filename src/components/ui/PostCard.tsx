import Link from 'next/link';
import { PostData } from '@/lib/posts';
import { getCategoryMeta, getCategoryThemeStyle } from '@/lib/constants/categories';
import PremiumBadge from '@/components/ui/PremiumBadge';
import AppIcon from '@/components/ui/AppIcon';

interface PostCardProps {
  post: Omit<PostData, 'content'>;
  variant?: 'grid' | 'list';
}

export default function PostCard({ post, variant = 'grid' }: PostCardProps) {
  const firstCategory = post.category 
    ? (Array.isArray(post.category) ? post.category[0] : post.category.split(',')[0].trim())
    : '보상가이드';
  
  const meta = getCategoryMeta(firstCategory);
  const theme = getCategoryThemeStyle(meta.themeColor);

  if (variant === 'list') {
    return (
      <article className={`group flex flex-col justify-between bg-white dark:bg-[#202124] p-4 sm:p-6 border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] ${theme.hoverBorder} ${theme.hoverShadow} hover:-translate-y-1 transition-all duration-300 relative overflow-hidden`}>
        {/* 좌측 테마 액센트 바 */}
        <div className={`absolute top-0 left-0 w-1 h-full ${theme.accentBar} opacity-0 group-hover:opacity-100 transition-opacity z-20`}></div>
        {/* 배경 은은한 그라데이션 */}
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0`}></div>
        
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 text-xs mb-3">
            <PremiumBadge color={theme.badgeColor}>{firstCategory}</PremiumBadge>
            <time className="text-[#5f6368] dark:text-[#9aa0a6] font-medium flex items-center gap-1">
              <AppIcon name="calendar" size={14} />
              {post.date}
            </time>
          </div>
          <div className="relative w-full overflow-hidden mb-2">
            <h2 className={`text-base sm:text-lg font-bold text-[#202124] dark:text-[#e8eaed] ${theme.titleHover} transition-colors line-clamp-2 leading-snug`}>
              <Link href={`/blog/${post.slug}`} className="before:absolute before:inset-0">
                {post.title}
              </Link>
            </h2>
          </div>
          <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] line-clamp-2 leading-relaxed font-normal">
            {post.summary}
          </p>
        </div>
        
        <div className="mt-4 pt-4 border-t border-[var(--google-border)] flex items-center justify-between gap-2 z-10 relative">
          <div className="flex flex-wrap gap-1.5">
            {(post.tags || []).slice(0, 3).map((tag) => (
              <Link
                key={tag}
                href={`/blog?tag=${encodeURIComponent(tag)}`}
                className={`text-[11px] font-bold px-2 py-0.5 border transition-colors text-[#5f6368] dark:text-[#9aa0a6] bg-[var(--google-surface-variant)] dark:bg-[#303134] border-transparent ${theme.textHover}`}
              >
                #{tag}
              </Link>
            ))}
          </div>
          <Link
            href={`/blog/${post.slug}`}
            className={`shrink-0 text-sm font-bold ${theme.textMain} hover:underline transition-colors flex items-center gap-1`}
          >
            자세히 보기
            <AppIcon name="chevron-right" size={16} strokeWidth={2.5} />
          </Link>
        </div>
      </article>
    );
  }

  // Grid view (used in HomePostList)
  return (
    <Link 
      href={`/blog/${post.slug}`} 
      className={`group flex flex-col relative bg-gray-50/50 dark:bg-[#202124] border border-gray-100 dark:border-white/10 p-5 ${theme.hoverBorder} ${theme.hoverShadow} transition-all duration-300 overflow-hidden`}
    >
      <div className={`absolute top-0 left-0 w-1 h-full ${theme.accentBar} opacity-0 group-hover:opacity-100 transition-opacity z-20`}></div>
      <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0`}></div>
      <div className="flex items-center justify-between gap-2 mb-3 z-10">
        <PremiumBadge color={theme.badgeColor}>{firstCategory}</PremiumBadge>
        <time className="text-[11px] font-medium text-gray-400 dark:text-gray-500 flex items-center gap-1">
          <AppIcon name="calendar" size={13} />
          {post.date}
        </time>
      </div>
      <div className="flex-1 space-y-2.5 z-10">
        <h3 className={`text-[15px] sm:text-base font-bold text-gray-900 dark:text-white leading-snug break-keep ${theme.titleHover} transition-colors`}>
          {post.title}
        </h3>
        <p className="text-xs sm:text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 break-keep">
          {post.summary}
        </p>
      </div>

      <div className={`mt-4 w-full text-[13px] font-bold text-[#202124] dark:text-[#e8eaed] flex items-center justify-between transition-colors p-2.5 bg-gray-50 dark:bg-white/5 group-hover:bg-gray-100 dark:group-hover:bg-white/10 ${theme.titleHover}`}>
        <div className="flex items-center gap-2">
          <span>글 읽기</span>
        </div>
        <AppIcon name="chevron-right" size={16} strokeWidth={2.5} />
      </div>
    </Link>
  );
}
