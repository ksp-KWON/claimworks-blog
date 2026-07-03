'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export interface YouTubeVideo {
  id: string;
  title: string;
  published: string;
}

const FALLBACK_VIDEOS: YouTubeVideo[] = [
  {
    id: '9zmUJIeKGWo',
    title: '내과실 높은 교통사고 치료비 공제 문제 해결 : 자상 담보 선지급 처리 방법',
    published: '2026. 6. 12.'
  },
  {
    id: 'T04PI99YjNA',
    title: '병원에서 대장점막내암(D01)코드를 받았는데, 이거 일반암으로 받을 수 있나요?',
    published: '2026. 6. 4.'
  },
  {
    id: 'ur-2qcXQEKA',
    title: '보험사가 티눈 시술은 수술이 아니라고 지급을 거절할 때 객관적으로 대응하는 방법',
    published: '2026. 6. 1.'
  },
  {
    id: 'RiBX0eA_Dv8',
    title: '업무 중 교통사고 났을 때, 산재보험과 자동차보험 중 무엇을 먼저 처리해야 하나요?',
    published: '2026. 5. 29.'
  }
];

export default function YouTubeBriefing() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVideos() {
      try {
        // 5분 단위로 바뀌는 타임스탬프를 쿼리에 추가하여 CDN의 긴 캐시를 강제로 우회합니다.
        const timeBucket = Math.floor(Date.now() / (1000 * 60 * 5));
        const res = await fetch(`/api/youtube?v=${timeBucket}`);
        if (!res.ok) throw new Error('API fetch failed');
        const data = await res.json();
        if (data && data.length > 0) {
          setVideos(data);
        } else {
          setVideos(FALLBACK_VIDEOS);
        }
      } catch (error) {
        console.error('Failed to fetch YouTube videos:', error);
        setVideos(FALLBACK_VIDEOS);
      } finally {
        setLoading(false);
      }
    }
    
    loadVideos();
  }, []);

  if (!loading && videos.length === 0) return null;

  return (
    <section className="mb-12 relative">
      
      {/* 1. 사이드바 스타일 헤더 (입체 박스) */}
      <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 mb-6 rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:shadow-[0_16px_50px_rgba(255,0,0,0.2)] hover:border-[#FF0000] transition-all duration-300 relative overflow-hidden group/headerbox">
        <div className="flex items-end justify-between mb-3">
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2 border-l-4 border-[#FF0000] pl-2.5 sm:pl-3">
            <span className="text-[#FF0000] text-2xl leading-none">📺</span>
            <span className="bg-gradient-to-r from-red-600 to-amber-500 bg-clip-text text-transparent">보상스쿨 미디어 센터</span>
          </h3>
          <a 
            href="https://www.youtube.com/@bosangschool" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-gray-500 hover:text-[#FF0000] transition-colors group/link"
          >
            전체보기
            <svg className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </a>
        </div>
        <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">
          어렵고 복잡한 보상 실무와 의학 지식을 보상스쿨 전문가가 영상으로 알기 쉽게 브리핑합니다.
        </p>
      </div>

      {/* 2. 비디오 리스트 레이아웃: 가로형 2단 그리드 (모바일 1단) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {loading ? (
          // 스켈레톤 UI (데이터 로딩 중)
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={`skeleton-${idx}`} className="group flex gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-none bg-white dark:bg-[#202124] border border-gray-100 dark:border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] items-center animate-pulse">
              <div className="w-32 sm:w-36 shrink-0 aspect-video rounded-none bg-gray-200 dark:bg-zinc-800"></div>
              <div className="flex flex-col flex-1 py-0.5 pr-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-3/4"></div>
                <div className="mt-auto flex items-center justify-between pt-2">
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
