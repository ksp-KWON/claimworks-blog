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

  // 첫 번째 영상을 강조형으로, 나머지를 리스트형으로 분리
  const featuredVideo = videos[0];
  const sideVideos = videos.slice(1, 4); // 최대 3개 노출

  return (
    <section className="mb-12 relative bg-white dark:bg-[#1e1e20] border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm">
      
      {/* 1. 메인 블로그 인트로와 동일한 헤더 스타일 유지하되 프리미엄 요소 추가 */}
      <div className="border-b border-[var(--google-border)] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-0 mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2">
            <svg className="w-5 h-5 text-[#FF0000] drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            보상스쿨 미디어 센터
            <a 
              href="https://www.youtube.com/@bosangschool" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#FF0000] transition-colors ml-1" 
              title="유튜브 채널 홈으로 이동"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
            </a>
          </h2>
          <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] mt-1.5 break-keep">
            어렵고 복잡한 보상 실무와 의학 지식을 보상스쿨 전문가가 영상으로 알기 쉽게 브리핑합니다.
          </p>
        </div>
      </div>

      {/* 2. 강조형 레이아웃: 메인 영상 + 사이드 리스트 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        
        {/* 메인 강조 영상 */}
        <a
          href={`https://youtu.be/${featuredVideo.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group lg:col-span-2 relative block overflow-hidden rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_16px_40px_rgba(255,0,0,0.12)] transition-all duration-500 aspect-video bg-zinc-900"
        >
          {/* 썸네일 */}
          <Image 
            src={`https://i.ytimg.com/vi/${featuredVideo.id}/hqdefault.jpg`} 
            alt={featuredVideo.title} 
            fill
            unoptimized
            className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
          />
          
          {/* 그라데이션 오버레이 (텍스트 가독성 확보) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* 플레이 버튼 (중앙) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#FF0000]/90 text-white rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(255,0,0,0.4)] transform group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 ml-1 sm:ml-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>

          {/* 하단 텍스트 정보 (글래스모피즘) */}
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 backdrop-blur-sm bg-black/10 border-t border-white/10 transform sm:translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
            <span className="inline-block mb-3 px-3 py-1 text-[11px] sm:text-xs font-bold rounded-md bg-[#FF0000] text-white shadow-lg tracking-wide">
              최신 브리핑
            </span>
            <h3 className="text-lg sm:text-2xl font-bold text-white leading-snug line-clamp-2 drop-shadow-md">
              {featuredVideo.title}
            </h3>
            <div className="mt-3 sm:mt-4 flex items-center gap-3 text-xs sm:text-sm text-gray-300 font-medium">
              <time className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                {featuredVideo.published}
              </time>
              <span className="flex items-center gap-1 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-10px] group-hover:translate-x-0">
                시청하기 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
              </span>
            </div>
          </div>
        </a>

        {/* 사이드 영상 리스트 */}
        <div className="flex flex-col gap-3 sm:gap-4">
          {sideVideos.map((video) => (
            <a
              key={video.id}
              href={`https://youtu.be/${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-[#202124] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:border-[#FF0000]/20 transition-all duration-300 items-center"
            >
              {/* 썸네일 */}
              <div className="relative w-32 sm:w-36 shrink-0 aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-800">
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
                <h4 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[#FF0000] transition-colors leading-snug mb-2 break-keep">
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
          ))}
          
          {/* 유튜브 채널 바로가기 배너 */}
          <a
            href="https://www.youtube.com/@bosangschool" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-[#2a2b2e] dark:to-[#323438] border border-gray-100 dark:border-gray-700 hover:border-[#FF0000]/30 transition-all duration-300 mt-1 sm:mt-0"
          >
            <div>
              <p className="text-[11px] sm:text-xs font-bold text-[#FF0000] mb-0.5">보상스쿨 공식 유튜브</p>
              <p className="text-xs sm:text-sm font-bold text-[#202124] dark:text-[#e8eaed]">더 많은 보상 노하우 영상 보기</p>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white dark:bg-[#202124] shadow-sm flex items-center justify-center text-gray-400 group-hover:text-[#FF0000] group-hover:scale-110 transition-all duration-300">
              <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
