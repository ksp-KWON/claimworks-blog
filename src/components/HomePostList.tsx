'use client';

import { useState } from 'react';
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
  const c = category || '보상정보';
  
  if (c.includes('교통사고')) {
    return {
      badge: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
      border: 'hover:border-red-400',
      hoverText: 'group-hover:text-red-600 dark:group-hover:text-red-400',
      arrowColor: 'text-red-500'
    };
  }
  if (c.includes('배상책임')) {
    return {
      badge: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      border: 'hover:border-green-400',
      hoverText: 'group-hover:text-green-600 dark:group-hover:text-green-400',
      arrowColor: 'text-green-500'
    };
  }
  if (c.includes('실손의료비') || c.includes('실손')) {
    return {
      badge: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      border: 'hover:border-blue-400',
      hoverText: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
      arrowColor: 'text-blue-500'
    };
  }
  if (c.includes('보상가이드')) {
    return {
      badge: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
      border: 'hover:border-yellow-400',
      hoverText: 'group-hover:text-yellow-600 dark:group-hover:text-yellow-400',
      arrowColor: 'text-yellow-500'
    };
  }
  if (c.includes('보험상식')) {
    return {
      badge: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
      border: 'hover:border-orange-400',
      hoverText: 'group-hover:text-orange-600 dark:group-hover:text-orange-400',
      arrowColor: 'text-orange-500'
    };
  }
  if (c.includes('후유장해')) {
    return {
      badge: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
      border: 'hover:border-purple-400',
      hoverText: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
      arrowColor: 'text-purple-500'
    };
  }
  if (c.includes('판례') || c.includes('법률')) {
    return {
      badge: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
      border: 'hover:border-indigo-400',
      hoverText: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
      arrowColor: 'text-indigo-500'
    };
  }
  
  // 기본 (보상정보 및 기타)
  return {
    badge: 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400',
    border: 'hover:border-teal-400',
    hoverText: 'group-hover:text-teal-600 dark:group-hover:text-teal-400',
    arrowColor: 'text-teal-500'
  };
}

export const CATEGORIES = [
  '전체',
  '판례·법률 해석',
  '교통사고',
  '배상책임',
  '보상가이드',
  '실손의료비',
  '보험상식',
  '후유장해 보상',
  '보상정보'
];

export default function HomePostList({ initialPosts }: { initialPosts: PostData[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');

  // 선택된 카테고리에 맞춰 글 필터링
  const filteredPosts = selectedCategory === '전체' 
    ? initialPosts 
    : initialPosts.filter(post => post.category?.includes(selectedCategory));

  return (
    <div className="space-y-6">
      {/* 카테고리 필터 버튼 칩 영역 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(category => {
          const isSelected = selectedCategory === category;
          // 선택되지 않았을 때 색상 로직 (선택되면 해당 카테고리 색상 짙게)
          let colorClasses = 'bg-white dark:bg-[#303134] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50';
          
          if (isSelected) {
            if (category === '전체') colorClasses = 'bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-gray-900';
            else if (category.includes('교통사고')) colorClasses = 'bg-red-500 text-white border-red-500';
            else if (category.includes('배상책임')) colorClasses = 'bg-green-500 text-white border-green-500';
            else if (category.includes('실손')) colorClasses = 'bg-blue-500 text-white border-blue-500';
            else if (category.includes('보상가이드')) colorClasses = 'bg-yellow-500 text-white border-yellow-500';
            else if (category.includes('보험상식')) colorClasses = 'bg-orange-500 text-white border-orange-500';
            else if (category.includes('후유장해')) colorClasses = 'bg-purple-500 text-white border-purple-500';
            else if (category.includes('판례') || category.includes('법률')) colorClasses = 'bg-indigo-500 text-white border-indigo-500';
            else colorClasses = 'bg-teal-500 text-white border-teal-500';
          }

          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold border transition-all duration-200 shadow-sm ${colorClasses}`}
            >
              {category}
            </button>
          );
        })}
      </div>

      {/* 필터링된 게시글 목록 */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white dark:bg-[#202124] rounded-3xl p-12 text-center border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          <svg className="w-12 h-12 text-[#dadce0] dark:text-[#5f6368] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M3 15h6"></path><path d="M3 19h6"></path><path d="M10 15h8"></path><path d="M10 19h8"></path></svg>
          <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] font-medium">선택하신 카테고리의 가이드 문서가 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredPosts.map((post) => {
            const colors = getCategoryColor(post.category);
            return (
              <article 
                key={post.slug}
                className={`group bg-white dark:bg-[#202124] rounded-[20px] sm:rounded-3xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] ${colors.border} hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)] hover:-translate-y-1 transition-all duration-300 flex flex-col min-h-[220px]`}
              >
                <Link href={`/blog/${post.slug}`} className="p-4 sm:p-5 flex flex-col justify-between h-full flex-1">
                  
                  {/* 상단: 카테고리 배지와 날짜 */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-md border border-transparent ${colors.badge}`}>
                      {post.category || '보상정보'}
                    </span>
                    <time className="text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      {post.date}
                    </time>
                  </div>

                  {/* 중단: 제목 및 설명 */}
                  <div className="min-w-0 flex-1 space-y-2">
                    <h3 className={`text-base font-bold text-[#202124] dark:text-[#e8eaed] ${colors.hoverText} transition-colors line-clamp-2 leading-snug`}>
                      {post.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] line-clamp-2 leading-relaxed font-normal break-keep">
                      {post.summary}
                    </p>
                  </div>

                  {/* 하단: 디테일 바로가기 링크 */}
                  <div className={`mt-3 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs font-bold ${colors.arrowColor}`}>
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
      )}
    </div>
  );
}
