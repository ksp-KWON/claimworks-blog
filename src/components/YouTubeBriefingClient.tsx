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

      {/* 2. 비디오 리스트 레이아웃: 매거진 패밀리룩 2열 입체 인터랙티브 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {loading ? (
          // 로딩 스켈레톤
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#202124] p-4 sm:p-5 border border-gray-100 dark:border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.6)] space-y-3.5 animate-pulse">
              <div className="w-full aspect-video bg-gray-200 dark:bg-zinc-800"></div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-1/4"></div>
              </div>
              <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-3/4"></div>
            </div>
          ))
        ) : (
          videos.map((video) => (
            <a
              key={video.id}
              href={`https://youtu.be/${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col justify-between bg-white dark:bg-[#202124] p-4 sm:p-5 border border-gray-100 dark:border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.6)] hover:border-red-500 hover:shadow-[0_16px_45px_rgba(239,68,68,0.15)] dark:hover:shadow-[0_16px_45px_rgba(239,68,68,0.25)] hover:-translate-y-1.5 transition-all duration-300 overflow-hidden outline-none"
            >
              {/* 좌측 레드 포인트 바 (호버 시 등장) */}
              <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity z-20"></div>

              {/* 배경 레드 파스텔 그라데이션 (호버 시 부드럽게 전환) */}
              <div className="absolute inset-0 bg-gradient-to-br from-rose-50/90 via-red-50/40 to-transparent dark:from-rose-950/40 dark:via-red-950/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"></div>

              <div className="relative z-10 space-y-3.5">
                {/* 16:9 와이드 썸네일 & 팝업 플레이 버튼 */}
                <div className="relative w-full aspect-video overflow-hidden bg-gray-100 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700/50 shadow-inner">
                  <Image 
                    src={`https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`} 
                    alt={video.title} 
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/15 group-hover:bg-black/35 transition-colors duration-300 flex items-center justify-center">
                    <div className="w-11 h-11 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-110 transition-all duration-300">
                      <AppIcon name="play" size={20} className="ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* 뱃지 & 날짜 */}
                <div className="flex items-center justify-between gap-2">
                  <PremiumBadge color="red">YouTube 브리핑</PremiumBadge>
                  <time className="text-[11px] sm:text-xs text-[#5f6368] dark:text-[#9aa0a6] font-medium flex items-center gap-1">
                    <AppIcon name="calendar" size={13} className="text-gray-400" />
                    <span>{video.published}</span>
                  </time>
                </div>

                {/* 영상 제목 */}
                <h4 className="text-sm sm:text-[15px] font-extrabold text-[#202124] dark:text-[#e8eaed] group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2 leading-snug break-keep">
                  {video.title}
                </h4>
              </div>

              {/* 하단 시청하기 바 */}
              <div className="mt-3.5 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs font-bold text-red-600 dark:text-red-400 relative z-10">
                <span className="text-[11px] text-gray-400 font-normal">보상스쿨 공식 채널</span>
                <span className="flex items-center gap-1 group-hover:underline">
                  <span>영상 시청하기</span>
                  <AppIcon name="chevron-right" size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </a>
          ))
        )}
      </div>
    </section>
  );
}
