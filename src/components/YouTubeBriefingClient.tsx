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

      {/* 2. 비디오 리스트 레이아웃: 2열 콤팩트 슬림 입체 인터랙티브 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        {loading ? (
          // 로딩 스켈레톤 (슬림형)
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#202124] p-3 sm:p-3.5 border border-gray-200/80 dark:border-zinc-800 shadow-[0_8px_25px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_25px_rgba(0,0,0,0.5)] space-y-2.5 animate-pulse">
              <div className="w-full aspect-video bg-gray-200 dark:bg-zinc-800"></div>
              <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-3/4"></div>
              <div className="flex justify-between pt-1">
                <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-16"></div>
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
              className="group relative flex flex-col justify-between bg-white dark:bg-[#202124] p-3 sm:p-3.5 border border-gray-200/80 dark:border-zinc-800 shadow-[0_8px_25px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_25px_rgba(0,0,0,0.5)] hover:border-red-500 dark:hover:border-red-500 hover:shadow-[0_14px_35px_rgba(239,68,68,0.12)] dark:hover:shadow-[0_14px_35px_rgba(239,68,68,0.22)] hover:-translate-y-1 transition-all duration-300 overflow-hidden outline-none"
            >
              {/* 좌측 레드 포인트 바 (호버 시 등장) */}
              <div className="absolute top-0 left-0 w-1 h-full bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity z-20"></div>

              {/* 배경 레드 파스텔 그라데이션 (호버 시 부드러운 색상 효과) */}
              <div className="absolute inset-0 bg-gradient-to-br from-rose-50/80 via-red-50/30 to-transparent dark:from-rose-950/30 dark:via-red-950/15 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0"></div>

              <div className="relative z-10 space-y-2.5">
                {/* 16:9 와이드 썸네일 (버블 팝업 없이 깔끔한 줌인 효과) */}
                <div className="relative w-full aspect-video overflow-hidden bg-gray-100 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700/50">
                  <Image 
                    src={`https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`} 
                    alt={video.title} 
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* 우측 상단 슬림 유튜브 뱃지 오버레이 */}
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold flex items-center gap-1 shadow-sm">
                    <AppIcon name="youtube" size={11} className="text-red-500" />
                    <span>영상</span>
                  </div>
                </div>

                {/* 영상 제목 (콤팩트 2줄) */}
                <h4 className="text-xs sm:text-[13.5px] font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2 leading-snug break-keep">
                  {video.title}
                </h4>

                {/* 하단 메타데이터 (날짜 + 자세히보기 콤팩트 정렬) */}
                <div className="flex items-center justify-between text-[11px] font-medium text-[#5f6368] dark:text-[#9aa0a6] pt-0.5">
                  <time className="flex items-center gap-1">
                    <AppIcon name="calendar" size={12} className="text-gray-400" />
                    <span>{video.published}</span>
                  </time>
                  <span className="flex items-center gap-0.5 text-red-600 dark:text-red-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>시청</span>
                    <AppIcon name="chevron-right" size={12} />
                  </span>
                </div>
              </div>
            </a>
          ))
        )}
      </div>
    </section>
  );
}
