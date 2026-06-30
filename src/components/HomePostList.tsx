'use client';

import Link from 'next/link';

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

// 카테고리별 색상 매핑 함수
export function getCategoryColor(category: string) {
  const c = category || '보상가이드';
  
  if (c.includes('교통사고')) {
    return {
      badge: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
      border: 'hover:border-red-400',
      hoverText: 'group-hover:text-red-600 dark:group-hover:text-red-400',
      arrowColor: 'text-red-500',
      icon: '🚗'
    };
  }
  if (c.includes('사망') || c.includes('자살')) {
    return {
      badge: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
      border: 'hover:border-rose-400',
      hoverText: 'group-hover:text-rose-600 dark:group-hover:text-rose-400',
      arrowColor: 'text-rose-500',
      icon: '⚖️'
    };
  }
  if (c.includes('질병진단') || c.includes('실손') || c.includes('의료비')) {
    return {
      badge: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      border: 'hover:border-blue-400',
      hoverText: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
      arrowColor: 'text-blue-500',
      icon: '🏥'
    };
  }
  if (c.includes('배상책임') || c.includes('의료')) {
    return {
      badge: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      border: 'hover:border-green-400',
      hoverText: 'group-hover:text-green-600 dark:group-hover:text-green-400',
      arrowColor: 'text-green-500',
      icon: '🛡️'
    };
  }
  if (c.includes('근재') || c.includes('산재')) {
    return {
      badge: 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400',
      border: 'hover:border-teal-400',
      hoverText: 'group-hover:text-teal-600 dark:group-hover:text-teal-400',
      arrowColor: 'text-teal-500',
      icon: '👷'
    };
  }
  if (c.includes('장해평가') || c.includes('면책') || c.includes('후유장해')) {
    return {
      badge: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
      border: 'hover:border-purple-400',
      hoverText: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
      arrowColor: 'text-purple-500',
      icon: '♿'
    };
  }
  if (c.includes('판례') || c.includes('법률')) {
    return {
      badge: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
      border: 'hover:border-indigo-400',
      hoverText: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
      arrowColor: 'text-indigo-500',
      icon: '📖'
    };
  }
  
  // 기본 (보상가이드 및 기타)
  return {
    badge: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
    border: 'hover:border-yellow-400',
    hoverText: 'group-hover:text-yellow-600 dark:group-hover:text-yellow-400',
    arrowColor: 'text-yellow-500',
    icon: '💡'
  };
}

export const CATEGORIES = [
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
        const primaryColor = getCategoryColor(category);
        const displayPosts = posts.slice(0, 4); // 각 블록당 최대 4개 노출

        return (
          <section key={category} className="bg-white dark:bg-[#1e1e20] border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm">
            
            {/* 블록 헤더 - 프리미엄 디자인 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/50 shadow-sm ${primaryColor.arrowColor}`}>
                  <span className="text-xl sm:text-2xl drop-shadow-sm" aria-hidden="true">{primaryColor.icon}</span>
                </div>
                <h2 className="text-lg sm:text-2xl font-extrabold text-[#202124] dark:text-[#e8eaed] tracking-tight">
                  {category}
                </h2>
              </div>
              <Link 
                href={`/search?q=${encodeURIComponent(category)}`}
                className="group flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 text-[11px] sm:text-sm font-bold text-gray-600 dark:text-gray-300 transition-all border border-gray-200 dark:border-zinc-700/50 hover:border-gray-300 shadow-sm hover:shadow-md"
              >
                전체보기
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
              </Link>
            </div>

            {/* 블록 컨텐츠 (그리드 배열) */}
            <div className="grid gap-4 sm:grid-cols-2">
              {displayPosts.map((post) => {
                const cats = (post.category || '보상가이드').split(',').map(x => x.trim()).filter(Boolean);
                
                return (
                  <article 
                    key={post.slug}
                    className={`group relative bg-white dark:bg-[#1a1a1c] rounded-[20px] sm:rounded-3xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:border-gray-200 dark:hover:border-white/20 hover:-translate-y-1 transition-all duration-300 flex flex-col min-h-[220px]`}
                  >
                    <Link href={`/blog/${post.slug}`} className="p-4 sm:p-5 flex flex-col justify-between h-full flex-1">
                      
                      {/* 상단: 다중 카테고리 배지와 날짜 */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex flex-wrap gap-1.5">
                          {cats.map(cat => {
                            const colors = getCategoryColor(cat);
                            return (
                              <span key={cat} className={`px-2.5 py-1 text-[11px] font-bold rounded-md border border-transparent ${colors.badge}`}>
                                {cat}
                              </span>
                            );
                          })}
                        </div>
                        <time className="text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] flex items-center gap-1 shrink-0">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          {post.date}
                        </time>
                      </div>

                      {/* 중단: 제목 및 설명 */}
                      <div className="min-w-0 flex-1 space-y-2">
                        <h3 className={`text-base font-bold text-[#202124] dark:text-[#e8eaed] ${primaryColor.hoverText} transition-colors line-clamp-2 leading-snug break-keep`}>
                          {post.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] line-clamp-2 leading-relaxed font-normal break-keep">
                          {post.summary}
                        </p>
                      </div>

                      {/* 하단: 디테일 바로가기 링크 */}
                      <div className={`mt-3 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs font-bold ${primaryColor.arrowColor}`}>
                        <span>전문 읽기</span>
                        <span className="transition-transform group-hover:translate-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </span>
                      </div>

                    </Link>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
