import React from 'react';

interface KeyPointsBoxProps {
  points: string[];
}

export default function KeyPointsBox({ points }: KeyPointsBoxProps) {
  return (
    <div className="mb-10 rounded-none overflow-hidden bg-white dark:bg-[#202124] border border-gray-200 dark:border-white/10 shadow-[0_6px_25px_rgba(0,0,0,0.08)] dark:shadow-[0_6px_25px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_40px_rgba(26,115,232,0.15)] transition-shadow duration-300 relative group">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 to-[#1a73e8] dark:from-red-500 dark:to-blue-500" />
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 dark:border-white/5">
        <div className="w-8 h-8 rounded-none bg-gradient-to-br from-red-50 to-blue-50 dark:from-red-900/20 dark:to-blue-900/20 border border-gray-200 dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
          <svg className="w-4 h-4 text-[#1a73e8] dark:text-[#8ab4f8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <span className="text-[16px] font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">핵심 요약 포인트</span>
      </div>
      <ul className="px-4 py-4 space-y-3">
        {points.map((point, i) => (
          <li key={i} className="flex items-start gap-3.5">
            <span className="w-6 h-6 rounded-none bg-gradient-to-br from-red-500 to-[#1a73e8] text-white shadow-sm text-[12px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              {i + 1}
            </span>
            <span
              className="flex-1 text-[15.5px] font-semibold text-gray-800 dark:text-[#e8eaed] leading-[1.7] break-keep"
              dangerouslySetInnerHTML={{
                __html: point.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:800;color:#1a73e8">$1</strong>'),
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
