'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { YouTubeVideo } from './YouTubeBriefing';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumBadge from '@/components/ui/PremiumBadge';
import AppIcon from '@/components/ui/AppIcon';

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
    <section className="space-y-6">
      {/* 1. 보상스쿨 미디어 센터 메인 헤더 배너 (입체감 있는 레드 파스텔 PremiumCard) */}
      <PremiumCard 
        borderColor="red" 
        hoverEffect={false} 
        watermarkIcon="youtube" 
        className="!p-5 sm:!p-7 !bg-gradient-to-r !from-rose-50/90 !via-red-50/50 !to-transparent dark:!from-rose-950/40 dark:!via-red-950/20 dark:!to-transparent border-rose-200/90 dark:border-rose-900/50"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3 mb-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <PremiumBadge color="red">실시간 전문가 영상 브리핑</PremiumBadge>
              <PremiumBadge color="gray">보상스쿨 유튜브 공식 채널</PremiumBadge>
            </div>
            {/* 전체보기 링크 */}
            <a 
              href="https://www.youtube.com/@bosangschool" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors group/link shrink-0"
            >
              전체보기
              <AppIcon name="chevron-right" size={14} className="group-hover/link:translate-x-0.5 transition-transform" />
            </a>
          </div>

          <PremiumHeading 
            level={2} 
            gradient="red" 
            showLeftBorder={false} 
            icon={<AppIcon name="youtube" size={24} className="text-red-600 shrink-0" />}
            className="!mb-2 !text-xl sm:!text-2xl"
          >
            보상스쿨 미디어 센터
          </PremiumHeading>

          <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] break-keep leading-relaxed font-medium">
            어렵고 복잡한 보상 실무와 핵심 의학 지식을 보상스쿨 손해사정사가 영상으로 알기 쉽게 1분 브리핑합니다.
          </p>
        </div>
      </PremiumCard>

      {/* 2. 비디오 리스트 레이아웃: 가로형 2단 그리드 (PremiumCard 표준 컴포넌트 일체화) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {loading ? (
          // 로딩 스켈레톤
          Array.from({ length: 4 }).map((_, i) => (
            <PremiumCard key={i} borderColor="default" hoverEffect={false} className="!p-2.5 sm:!p-3.5 flex gap-3 sm:gap-4 items-center animate-pulse">
              <div className="w-32 sm:w-36 shrink-0 aspect-video bg-gray-200 dark:bg-zinc-800"></div>
              <div className="flex flex-col flex-1 py-0.5 pr-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-3/4"></div>
                <div className="mt-auto pt-2">
                  <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-1/3"></div>
                </div>
              </div>
            </PremiumCard>
          ))
        ) : (
          videos.map((video) => (
            <a
              key={video.id}
              href={`https://youtu.be/${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group block outline-none"
            >
              <PremiumCard 
                borderColor="red" 
                hoverEffect={true} 
                className="!p-2.5 sm:!p-3.5 flex gap-3 sm:gap-4 items-center h-full transition-all duration-200 group-hover:scale-[1.006]"
              >
                {/* 썸네일 */}
                <div className="relative w-32 sm:w-36 shrink-0 aspect-video overflow-hidden bg-gray-100 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700/50">
                  <Image 
                    src={`https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`} 
                    alt={video.title} 
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                    <div className="w-8 h-8 bg-white/95 text-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-md">
                      <AppIcon name="play" size={15} className="ml-0.5" />
                    </div>
                  </div>
                </div>
                
                {/* 텍스트 정보 */}
                <div className="flex flex-col flex-1 py-0.5 pr-1 min-w-0">
                  <h4 className="text-xs sm:text-[13.5px] font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-snug mb-2 break-keep line-clamp-2">
                    {video.title}
                  </h4>
                  <div className="mt-auto flex items-center justify-between text-[11px] sm:text-xs font-medium text-[#5f6368] dark:text-[#9aa0a6]">
                    <time className="flex items-center gap-1.5">
                      <AppIcon name="calendar" size={12} className="text-gray-400" />
                      <span>{video.published}</span>
                    </time>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-900/40 font-bold">
                      YouTube
                    </span>
                  </div>
                </div>
              </PremiumCard>
            </a>
          ))
        )}
      </div>
    </section>
  );
}
