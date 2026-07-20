'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { YouTubeVideo } from './YouTubeBriefing';
import PremiumHeading from '@/components/ui/PremiumHeading';

export default function YouTubeBriefingClient({ fallbackVideos }: { fallbackVideos: YouTubeVideo[] }) {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVideos() {
      try {
        const res = await fetch('/api/youtube');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setVideos(data);
            return;
          }
        }
        setVideos(fallbackVideos);
      } catch (error) {
        console.error('Failed to fetch YouTube API:', error);
        setVideos(fallbackVideos);
      } finally {
        setLoading(false);
      }
    }
    fetchVideos();
  }, [fallbackVideos]);

  return (
    <section className="space-y-6 sm:space-y-8">
      {/* 텍스트 타이틀 영역 (시각적 계층화를 위해 박스 제거) */}
      <div className="px-1 sm:px-2">
        <div className="flex flex-wrap gap-y-2 items-end justify-between mb-3">
          <PremiumHeading level={2} gradient="red" showLeftBorder={true} className="!mb-0 !text-xl sm:!text-2xl flex items-center">
            <span aria-hidden="true" className="text-2xl leading-none mr-2">📺</span>
            보상스쿨 미디어 센터
          </PremiumHeading>
          
          {/* 전체보기 링크 */}
          <a 
            href="https://www.youtube.com/@bosangschool" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-gray-500 hover:text-red-500 transition-colors group/link shrink-0"
          >
            전체보기
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover/link:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </a>
        </div>
        
        <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] break-keep leading-relaxed font-medium">
          어렵고 복잡한 보상 실무와 의학 지식을 보상스쿨 전문가가 영상으로 알기 쉽게 브리핑합니다.
        </p>
      </div>

      {/* 비디오 리스트 레이아웃: 가로형 2단 그리드 (모바일 1단) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {loading ? (
          // 로딩 스켈레톤
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-none bg-white dark:bg-[#202124] border border-gray-100 dark:border-white/5 shadow-sm items-center animate-pulse">
              <div className="w-32 sm:w-36 shrink-0 aspect-video rounded-none bg-gray-200 dark:bg-zinc-800"></div>
              <div className="flex flex-col flex-1 py-0.5 pr-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-3/4"></div>
                <div className="mt-auto pt-2">
                  <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          ))
        ) : (
          videos.map((video) => (
            <a
              key={video.id}
              href={`https://youtu.be/${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-none bg-white dark:bg-[#202124] border border-gray-100 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:border-[#FF0000] transition-all duration-300 items-center"
            >
              {/* 썸네일 */}
              <div className="relative w-32 sm:w-36 shrink-0 aspect-video rounded-none overflow-hidden bg-gray-100 dark:bg-zinc-800">
                <Image 
                  src={`https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`} 
                  alt={video.title} 
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/5 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                  <div className="w-8 h-8 bg-white/95 text-[#FF0000] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-md">
                    <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
              </div>
              
              {/* 텍스트 정보 */}
              <div className="flex flex-col flex-1 py-0.5 pr-1">
                <h4 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[#FF0000] transition-colors leading-snug mb-2 break-keep line-clamp-2">
                  {video.title}
                </h4>
                <div className="mt-auto flex items-center justify-between text-[11px] sm:text-xs font-medium text-[#5f6368] dark:text-[#9aa0a6]">
                  <time className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    {video.published}
                  </time>
                </div>
              </div>
            </a>
          ))
        )}
      </div>
    </section>
  );
}
