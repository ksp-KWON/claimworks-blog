'use client';

import Link from 'next/link';
import { KAKAO_OPEN_CHAT_URL } from '@/lib/constants';

export default function CTABanner() {
  return (
    <div className="mt-12 mb-8 bg-white dark:bg-[#202124] px-4 py-5 sm:p-6 rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:shadow-[0_16px_50px_rgba(26,115,232,0.25)] hover:border-[#1a73e8] transition-all duration-300 relative overflow-hidden group">
      <div className="absolute right-[-10px] bottom-[-20px] opacity-[0.03] dark:opacity-[0.05] text-[120px] select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
        🤝
      </div>
      
      <div className="relative z-10 space-y-5">
        <div>
          <h3 className="font-extrabold text-gray-900 dark:text-white text-[16px] tracking-tight flex items-center gap-2 border-l-4 border-[#1a73e8] pl-2.5">
            <span className="text-[17px] leading-none">🤝</span>
            정당한 권리, 보상스쿨과 함께라면 결과가 달라집니다.
          </h3>
          <p className="text-xs sm:text-[13px] text-[#5f6368] dark:text-[#9aa0a6] mt-2 leading-relaxed ml-3.5">
            수많은 성공 사례로 증명된 전문 손해사정사가 최적의 해답을 제시해 드립니다.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* 카드 1: 보상스쿨 내부 실시간 채팅 */}
        <a
          href={KAKAO_OPEN_CHAT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-none bg-white dark:bg-[#202124] border border-gray-200 dark:border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_15px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(26,115,232,0.2)] hover:border-[#1a73e8] hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/10 dark:hover:to-indigo-900/10 hover:-translate-y-1 transition-all duration-300 group text-left w-full block"
          id="cta-chat-btn"
        >
          <div className="w-10 h-10 rounded-none bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-[#174ea6]/20 dark:to-indigo-900/40 border border-blue-200 dark:border-indigo-800/30 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5 text-[#1a73e8] dark:text-[#8ab4f8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-[#202124] dark:text-[#e8eaed] truncate group-hover:text-[#1a73e8] transition-colors">채팅 상담</span>
            <span className="block text-xs text-[#5f6368] dark:text-[#9aa0a6] truncate mt-0.5">보상스쿨 실시간 상담</span>
          </div>
        </a>

        {/* 카드 2: 상담신청 양식 */}
        <Link
          href="/consultation"
          className="flex items-center gap-3 p-3 rounded-none bg-white dark:bg-[#202124] border border-gray-200 dark:border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_15px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(52,168,83,0.2)] hover:border-[#34A853] hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 dark:hover:from-green-900/10 dark:hover:to-emerald-900/10 hover:-translate-y-1 transition-all duration-300 group text-left w-full block"
        >
          <div className="w-10 h-10 rounded-none bg-gradient-to-br from-green-100 to-emerald-100 dark:from-[#0d652d]/20 dark:to-emerald-900/40 border border-green-200 dark:border-emerald-800/30 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5 text-[var(--google-green)] dark:text-[#81c995]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-[#202124] dark:text-[#e8eaed] truncate group-hover:text-[var(--google-green)] transition-colors">상담신청 양식</span>
            <span className="block text-xs text-[#5f6368] dark:text-[#9aa0a6] truncate mt-0.5">예약상담 신청서</span>
          </div>
        </Link>

        {/* 카드 3: 보상스쿨 소개 */}
        <Link
          href="/about"
          className="flex items-center gap-3 p-3 rounded-none bg-white dark:bg-[#202124] border border-gray-200 dark:border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_15px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(26,115,232,0.2)] hover:border-[#1A73E8] hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/10 dark:hover:to-indigo-900/10 hover:-translate-y-1 transition-all duration-300 group"
        >
          <div className="w-10 h-10 rounded-none bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-[#174ea6]/20 dark:to-indigo-900/40 border border-blue-200 dark:border-indigo-800/30 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5 text-[var(--google-blue)] dark:text-[#8ab4f8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-[#202124] dark:text-[#e8eaed] truncate group-hover:text-[var(--google-blue)] transition-colors">보상스쿨 소개</span>
            <span className="block text-xs text-[#5f6368] dark:text-[#9aa0a6] truncate mt-0.5">자격 및 경력사항</span>
          </div>
        </Link>

        {/* 카드 4: 보상스쿨 TV */}
        <a
          href="https://www.youtube.com/@bosangschool"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-none bg-white dark:bg-[#202124] border border-gray-200 dark:border-white/10 shadow-[0_4px_15px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_15px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(217,48,37,0.2)] hover:border-[#d93025] hover:bg-gradient-to-br hover:from-red-50 hover:to-rose-50 dark:hover:from-red-900/10 dark:hover:to-rose-900/10 hover:-translate-y-1 transition-all duration-300 group"
        >
          <div className="w-10 h-10 rounded-none bg-gradient-to-br from-red-100 to-rose-100 dark:from-[#c5221f]/20 dark:to-rose-900/40 border border-red-200 dark:border-rose-800/30 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
            <svg className="w-5 h-5 text-[var(--google-red)] dark:text-[#f28b82]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-[#202124] dark:text-[#e8eaed] truncate group-hover:text-[var(--google-red)] transition-colors">보상스쿨 TV</span>
            <span className="block text-xs text-[#5f6368] dark:text-[#9aa0a6] truncate mt-0.5">유튜브 바로가기</span>
          </div>
        </a>
      </div>
      </div>
    </div>
  );
}
