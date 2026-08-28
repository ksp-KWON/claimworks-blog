'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import type { YouTubeVideo } from './YouTubeBriefing';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumBadge from '@/components/ui/PremiumBadge';
import PremiumHeaderBanner from '@/components/ui/PremiumHeaderBanner';
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
            setVideos(data.slice(0, 2));
            return;
          }
        }
        setVideos(fallbackVideos.slice(0, 2));
      } catch (error) {
        console.error('Failed to fetch YouTube API:', error);
        setVideos(fallbackVideos.slice(0, 2));
      } finally {
        setLoading(false);
      }
    }
    fetchVideos();
  }, [fallbackVideos]);

  return (
    <section className="space-y-6">
      {/* 1. 보상스쿨 미디어 센터 메인 헤더 배너 */}
      <PremiumHeaderBanner
        theme="red"
        icon="youtube"
        title="보상스쿨 미디어 센터"
        level={2}
        badges={['실시간 전문가 영상 브리핑', { text: '보상스쿨 유튜브 공식 채널', color: 'gray' }]}
        description="어렵고 복잡한 보상 실무와 핵심 의학 지식을 보상스쿨 손해사정사가 영상으로 알기 쉽게 1분 브리핑합니다."
        rightLink={{ href: 'https://www.youtube.com/@bosangschool', text: '전체보기', isExternal: true }}
      />

      {/* 2. 비디오 리스트 레이아웃: 2열 콤팩트 표준 인터랙티브 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        {loading ? (
          // 로딩 스켈레톤 (정확히 2개 일치화로 CLS 제로 달성)
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#202124] p-3.5 sm:p-4 border border-gray-200/80 dark:border-zinc-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] space-y-2.5 animate-pulse">
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
              className="group relative flex flex-col justify-between bg-white dark:bg-[#202124] p-3.5 sm:p-4 border border-gray-200/80 dark:border-zinc-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] hover:border-red-500 dark:hover:border-red-500 hover:shadow-[0_8px_24px_rgba(239,68,68,0.12)] dark:hover:shadow-[0_8px_24px_rgba(239,68,68,0.18)] active:scale-[0.98] transition-all duration-200 overflow-hidden outline-none"
            >
              {/* 1. 좌측 레드 포인트 바 (호버 시 점등) */}
              <div className="absolute top-0 left-0 w-1 h-full bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity z-20"></div>

              {/* 2. 배경 레드 파스텔 그라데이션 (호버 시 은은한 앰비언트 효과) */}
              <div className="absolute inset-0 bg-gradient-to-br from-rose-50/80 via-red-50/30 to-transparent dark:from-rose-950/30 dark:via-red-950/15 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-0"></div>

              <div className="relative z-10 space-y-2.5">
                {/* 16:9 와이드 썸네일 (고화질 HD 썸네일 및 단정한 고정 뷰) */}
                <div className="relative w-full aspect-video overflow-hidden bg-gray-100 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700/50">
                  <Image 
                    src={`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`} 
                    alt={video.title} 
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  {/* 우측 상단 단정 유튜브 뱃지 */}
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
                    <AppIcon name="youtube" size={12} className="text-red-500" />
                    <span>유튜브 브리핑</span>
                  </div>
                </div>

                {/* 영상 제목 (호버 시 레드 텍스트 전환) */}
                <h4 className="text-xs sm:text-[13.5px] font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2 leading-snug break-keep">
                  {video.title}
                </h4>

                {/* 하단 메타데이터 (날짜 + 시청 액션) */}
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
