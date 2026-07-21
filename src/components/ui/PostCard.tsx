import Link from 'next/link';
import { PostData } from '@/lib/posts';
import { getCategoryTheme } from '@/lib/constants';
import PremiumBadge from '@/components/ui/PremiumBadge';

interface PostCardProps {
  post: Omit<PostData, 'content'>;
  variant?: 'grid' | 'list';
}

export default function PostCard({ post, variant = 'grid' }: PostCardProps) {
  // Use first category for theme determination
  const firstCategory = post.category ? post.category.split(',')[0].trim() : '보상가이드';
  const theme = getCategoryTheme(firstCategory);

  // Safe-listed gradient colors for Tailwind JIT
  const gradientMap: Record<string, string> = {
    red: 'from-red-50/80 to-transparent dark:from-red-950/30',
    rose: 'from-rose-50/80 to-transparent dark:from-rose-950/30',
    blue: 'from-blue-50/80 to-transparent dark:from-blue-950/30',
    green: 'from-green-50/80 to-transparent dark:from-green-950/30',
    teal: 'from-teal-50/80 to-transparent dark:from-teal-950/30',
    purple: 'from-purple-50/80 to-transparent dark:from-purple-950/30',
    indigo: 'from-indigo-50/80 to-transparent dark:from-indigo-950/30',
    yellow: 'from-yellow-50/80 to-transparent dark:from-yellow-950/30',
    default: 'from-blue-50/80 to-transparent dark:from-blue-900/20'
  };
  const bgGradientClass = gradientMap[theme.color] || gradientMap['default'];


  if (variant === 'list') {
    // List view (used in BlogPageClient)
    return (
      <article className={`group flex flex-col justify-between bg-white dark:bg-[#202124] p-4 sm:p-6 rounded-none sm:rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:border-${theme.color}-500 hover:shadow-[0_16px_50px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_16px_50px_rgba(0,0,0,0.8)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden`}>
        {/* Subtle left border accent on hover */}
        <div className={`absolute top-0 left-0 w-1 h-full bg-${theme.color}-500 opacity-0 group-hover:opacity-100 transition-opacity z-20`}></div>
        {/* Background color gradient on hover */}
        <div className={`absolute inset-0 bg-gradient-to-br ${bgGradientClass} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0`}></div>
        
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-3 text-xs mb-3">
            <PremiumBadge color={theme.color}>{firstCategory}</PremiumBadge>
            <time className="text-[#5f6368] dark:text-[#9aa0a6] font-medium flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              {post.date}
            </time>
          </div>
          <div className="relative w-full overflow-hidden mb-2">
            <h2 className={`text-base sm:text-lg font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-${theme.color}-500 transition-colors line-clamp-2 leading-snug`}>
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
                className={`text-[11px] font-bold px-2 py-0.5 rounded-none border transition-colors text-[#5f6368] dark:text-[#9aa0a6] bg-[var(--google-surface-variant)] dark:bg-[#303134] border-transparent hover:border-${theme.color}-500 hover:text-${theme.color}-500`}
              >
                #{tag}
              </Link>
            ))}
          </div>
          <Link
            href={`/blog/${post.slug}`}
            className={`shrink-0 text-sm font-bold text-${theme.color}-600 dark:text-${theme.color}-400 hover:underline transition-colors flex items-center gap-1`}
          >
            자세히 보기
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </Link>
        </div>
      </article>
    );
  }

  // Grid view (used in HomePostList)
  return (
    <Link 
      href={`/blog/${post.slug}`} 
      className="group flex flex-col relative bg-gray-50/50 dark:bg-[#202124] border border-gray-100 dark:border-white/10 p-5 transition-all duration-300 overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
    >
      <div className={`absolute top-0 left-0 w-1 h-full bg-${theme.color}-500 opacity-0 group-hover:opacity-100 transition-opacity z-20`}></div>
      <div className={`absolute inset-0 bg-gradient-to-br ${bgGradientClass} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0`}></div>
      <div className="flex items-center justify-between gap-2 mb-3 z-10">
        <PremiumBadge color={theme.color}>{firstCategory}</PremiumBadge>
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

      <div className={`mt-4 w-full text-[13px] font-bold text-[#202124] dark:text-[#e8eaed] flex items-center justify-between transition-colors p-2.5 rounded-none bg-gray-50 dark:bg-white/5 group-hover:bg-gray-100 dark:group-hover:bg-white/10 group-hover:text-${theme.color}-600 dark:group-hover:text-${theme.color}-400`}>
        <div className="flex items-center gap-2">
          <span>글 읽기</span>
        </div>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </div>
    </Link>
  );
}
