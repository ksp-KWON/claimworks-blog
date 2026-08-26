'use client';

import Link from 'next/link';
import AppIcon from '@/components/ui/AppIcon';

export default function CTABanner() {
  return (
    <div className="mt-12 mb-8 bg-white dark:bg-[#202124] px-4 py-5 sm:p-6 rounded-none border border-gray-200 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.4)] hover:shadow-[0_16px_50px_rgba(26,115,232,0.18)] hover:border-[#1a73e8] transition-all duration-300 relative overflow-hidden group">
      <div className="relative z-10 space-y-5">
        <div>
          <h3 className="font-extrabold text-gray-900 dark:text-white text-[16.5px] tracking-tight flex items-center gap-2.5">
            <AppIcon name="shield-check" size={20} className="text-[#1a73e8] dark:text-[#8ab4f8] shrink-0" />
            <span>정당한 권리, 보상스쿨과 함께라면 결과가 달라집니다</span>
          </h3>
          <p className="text-xs sm:text-[13px] text-[#5f6368] dark:text-[#9aa0a6] mt-2 leading-relaxed ml-3.5 font-medium">
            수많은 성공 사례로 증명된 전문 손해사정사가 최적의 해답을 제시해 드립니다.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* 카드 1: 보상스쿨 내부 실시간 채팅 */}
          <button
            onClick={(e) => {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent('open-chat'));
            }}
            className="flex items-center gap-3 p-3 rounded-none bg-white dark:bg-[#202124] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-[0_8px_25px_rgba(26,115,232,0.15)] hover:border-[#1a73e8] hover:bg-gradient-to-br hover:from-blue-50/80 hover:to-indigo-50/80 dark:hover:from-blue-900/10 dark:hover:to-indigo-900/10 hover:-translate-y-0.5 transition-all duration-300 group text-left w-full block"
            id="cta-chat-btn"
          >
            <div className="w-10 h-10 rounded-none bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-[#174ea6]/20 dark:to-indigo-900/40 border border-blue-200 dark:border-indigo-800/30 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <AppIcon name="chat" size={20} className="text-[#1a73e8] dark:text-[#8ab4f8]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-[#202124] dark:text-[#e8eaed] truncate group-hover:text-[#1a73e8] transition-colors">실시간 채팅상담</span>
              <span className="block text-xs text-[#5f6368] dark:text-[#9aa0a6] truncate mt-0.5">보상스쿨 실시간 상담</span>
            </div>
          </button>

          {/* 카드 2: 상담신청 양식 */}
          <Link
            href="/consultation"
            className="flex items-center gap-3 p-3 rounded-none bg-white dark:bg-[#202124] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-[0_8px_25px_rgba(52,168,83,0.15)] hover:border-[#34A853] hover:bg-gradient-to-br hover:from-green-50/80 hover:to-emerald-50/80 dark:hover:from-green-900/10 dark:hover:to-emerald-900/10 hover:-translate-y-0.5 transition-all duration-300 group text-left w-full block"
          >
            <div className="w-10 h-10 rounded-none bg-gradient-to-br from-green-100 to-emerald-100 dark:from-[#0d652d]/20 dark:to-emerald-900/40 border border-green-200 dark:border-emerald-800/30 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <AppIcon name="file-text" size={20} className="text-[var(--google-green)] dark:text-[#81c995]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-[#202124] dark:text-[#e8eaed] truncate group-hover:text-[var(--google-green)] transition-colors">상담신청 양식</span>
              <span className="block text-xs text-[#5f6368] dark:text-[#9aa0a6] truncate mt-0.5">예약상담 신청서</span>
            </div>
          </Link>

          {/* 카드 3: 보상스쿨 소개 */}
          <Link
            href="/about"
            className="flex items-center gap-3 p-3 rounded-none bg-white dark:bg-[#202124] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-[0_8px_25px_rgba(168,85,247,0.18)] hover:border-purple-500 hover:bg-gradient-to-br hover:from-purple-50/80 hover:to-indigo-50/80 dark:hover:from-purple-900/15 dark:hover:to-indigo-900/15 hover:-translate-y-0.5 transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-none bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-900/10 border border-purple-200 dark:border-purple-800/40 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <AppIcon name="user" size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-[#202124] dark:text-[#e8eaed] truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">보상스쿨 소개</span>
              <span className="block text-xs text-[#5f6368] dark:text-[#9aa0a6] truncate mt-0.5">자격 및 경력사항</span>
            </div>
          </Link>

          {/* 카드 4: 보상스쿨 TV */}
          <a
            href="https://www.youtube.com/@bosangschool"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-none bg-white dark:bg-[#202124] border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-[0_8px_25px_rgba(217,48,37,0.15)] hover:border-[#d93025] hover:bg-gradient-to-br hover:from-red-50/80 hover:to-rose-50/80 dark:hover:from-red-900/10 dark:hover:to-rose-900/10 hover:-translate-y-0.5 transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-none bg-gradient-to-br from-red-100 to-rose-100 dark:from-[#c5221f]/20 dark:to-rose-900/40 border border-red-200 dark:border-rose-800/30 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <AppIcon name="youtube" size={20} className="text-[var(--google-red)] dark:text-[#f28b82]" />
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
