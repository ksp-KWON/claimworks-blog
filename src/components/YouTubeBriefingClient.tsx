'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { YouTubeVideo } from './YouTubeBriefing';

export default function YouTubeBriefingClient({ videos: initialVideos }: { videos: YouTubeVideo[] }) {
  const [videos, setVideos] = useState<YouTubeVideo[]>(initialVideos);

  useEffect(() => {
    // 실시간 유튜브 데이터 조회 (서버 단 1시간 캐싱 API 활용)
    fetch('/api/youtube')
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('내부 API 응답 오류');
      })
      .then((parsedVideos: YouTubeVideo[]) => {
        if (parsedVideos && parsedVideos.length > 0) {
          setVideos(parsedVideos);
        }
      })
      .catch(err => {
        console.warn('유튜브 실시간 데이터를 불러오는 데 실패하여 백업 데이터를 사용합니다:', err);
      });
  }, []);

  if (!videos || videos.length === 0) return null;

  return (
    <section className="mb-10 relative">
      
      {/* 1. 메인 블로그 인트로와 완벽하게 동일한 헤더 스타일 */}
      <div className="border-b border-[var(--google-border)] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-0 mb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2">
            <svg className="w-5 h-5 text-[#FF0000]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            보상스쿨 미디어 센터
            <a 
              href="https://www.youtube.com/@bosangschool" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[var(--google-blue)] transition-colors ml-1" 
              title="유튜브 채널 홈으로 이동"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
            </a>
          </h2>
          <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] mt-1.5 break-keep">
            어렵고 복잡한 보상 실무와 의학 지식을 보상스쿨 전문가가 영상으로 알기 쉽게 브리핑합니다.
          </p>
        </div>
      </div>

      {/* 2. 모바일에서는 슬라이더, 데스크탑에서는 3열 그리드로 전환 & 그림자 잘림 방지 py-4 패딩 추가 */}
      <div className="flex overflow-x-auto gap-4 py-4 pb-6 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-2 px-2 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:overflow-visible">
        {videos.slice(0, 3).map(video => (
          <a
            key={video.id}
            href={`https://youtu.be/${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white dark:bg-[#202124] rounded-3xl overflow-hidden border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:border-[#FF0000]/50 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)] hover:-translate-y-1 transition-all duration-300 flex flex-col w-[260px] sm:w-full shrink-0 sm:shrink snap-start min-h-[220px]"
          >
            {/* 썸네일 영역 */}
            <div className="relative aspect-video w-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
              <Image 
                src={`https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`} 
                alt={video.title} 
                width={360}
                height={203}
                unoptimized
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* 유튜브 플레이 아이콘 포인트 */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/5 group-hover:bg-black/20 transition-colors duration-300">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#FF0000] text-white rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5 sm:ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
            </div>
            
            {/* 텍스트 영역 (블로그 카드와 완벽 일치) */}
            <div className="p-4 sm:p-5 flex flex-col justify-between flex-1">
              <div className="mb-2.5">
                <span className="px-2.5 py-1 text-[11px] font-bold rounded-md border border-transparent bg-[#fce8e6] text-[#FF0000] dark:bg-[#c5221f]/20 dark:text-[#f28b82]">
                  YouTube 영상
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[#FF0000] transition-colors line-clamp-2 leading-snug mb-3 min-h-[2.5rem]">
                {video.title}
              </h3>
              
              {/* 하단 날짜 및 링크 */}
              <div className="mt-auto pt-3 border-t border-[var(--google-border)] flex items-center justify-between text-[11px] sm:text-xs font-bold text-[#5f6368] dark:text-[#9aa0a6]">
                <time className="flex items-center gap-1 font-medium">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  {video.published}
                </time>
                <span className="group-hover:text-[#FF0000] transition-colors flex items-center gap-0.5">
                  영상 보기 
                  <span className="transition-transform group-hover:translate-x-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </span>
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
