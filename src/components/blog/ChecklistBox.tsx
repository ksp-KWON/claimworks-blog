'use client';

import React, { useState } from 'react';

interface ChecklistBoxProps {
  items: string[];
}

export default function ChecklistBox({ items }: ChecklistBoxProps) {
  const [checked, setChecked] = useState<boolean[]>(new Array(items.length).fill(false));
  const count = checked.filter(Boolean).length;
  const pct = Math.round((count / items.length) * 100);

  return (
    <div className="my-12 rounded-none overflow-hidden bg-white dark:bg-[#202124] border border-gray-200 dark:border-white/10 shadow-[0_6px_25px_rgba(0,0,0,0.08)] dark:shadow-[0_6px_25px_rgba(0,0,0,0.4)] relative">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 to-[#1a73e8] dark:from-red-500 dark:to-blue-500" />
      {/* 헤더 */}
      <div className="px-4 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-none bg-gradient-to-br from-red-50 to-blue-50 dark:from-red-900/20 dark:to-blue-900/20 border border-gray-200 dark:border-white/10 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-xl">🛡️</span>
          </div>
          <div>
            <p className="font-black text-gray-900 dark:text-white text-[17px] tracking-tight">
              보험 자가테스트
            </p>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
              해당 항목을 클릭해 체크해 보세요
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-[#1a73e8] dark:text-[#8ab4f8]">
            {count}<span className="text-sm font-bold text-gray-400 dark:text-gray-500">/{items.length}</span>
          </p>
        </div>
      </div>

      {/* 진행 바 */}
      <div className="h-1 bg-gray-100 dark:bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-red-500 to-[#1a73e8] transition-all duration-500 rounded-none"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* 항목들 */}
      <div className="bg-white dark:bg-[#202124] divide-y divide-gray-100 dark:divide-white/5">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => {
              const next = [...checked];
              next[i] = !next[i];
              setChecked(next);
            }}
            className={`w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-colors group ${
              checked[i]
                ? 'bg-blue-50/50 dark:bg-blue-900/10'
                : 'hover:bg-gray-50 dark:hover:bg-[#303134]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-none border-2 flex items-center justify-center shrink-0 transition-all ${
                checked[i]
                  ? 'bg-gradient-to-br from-red-500 to-[#1a73e8] border-transparent shadow-sm'
                  : 'border-gray-300 dark:border-gray-600 group-hover:border-[#1a73e8]/50'
              }`}
            >
              {checked[i] && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span
              className={`text-[15px] leading-relaxed break-keep transition-colors ${
                checked[i]
                  ? 'text-[#1a73e8] dark:text-[#8ab4f8] font-bold opacity-90'
                  : 'text-gray-800 dark:text-[#e8eaed] font-medium group-hover:text-[#1a73e8] dark:group-hover:text-[#8ab4f8]'
              }`}
              dangerouslySetInnerHTML={{ __html: item }}
            />
          </button>
        ))}
      </div>

      {/* 결과 메시지 */}
      {count >= 3 && (
        <div className="bg-red-50 dark:bg-red-900/10 border-t border-red-200 dark:border-red-800/30 px-4 py-3.5 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <p className="text-red-700 dark:text-red-400 text-[14px] font-semibold leading-relaxed">
            <strong className="font-extrabold">{count}개 이상 해당</strong>됩니다. 청구 가능한 보험금이 남아있을 가능성이 높으니 전문가 무료 진단을 받아보세요.
          </p>
        </div>
      )}
    </div>
  );
}
