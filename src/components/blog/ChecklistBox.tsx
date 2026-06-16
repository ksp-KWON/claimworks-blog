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
    <div className="my-12 rounded-2xl overflow-hidden bg-white dark:bg-[#202124] border border-gray-200 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] relative">
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#34A853]" />
      {/* 헤더 */}
      <div className="px-4 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#e6f4ea] dark:bg-[#34A853]/20 flex items-center justify-center shrink-0">
            <span className="text-xl">🛡️</span>
          </div>
          <div>
            <p className="font-extrabold text-gray-900 dark:text-white text-[16px] tracking-tight">
              보험 자가테스트
            </p>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
              해당 항목을 클릭해 체크해 보세요
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-[#34A853] dark:text-[#81c995]">
            {count}<span className="text-sm font-bold text-gray-400 dark:text-gray-500">/{items.length}</span>
          </p>
        </div>
      </div>

      {/* 진행 바 */}
      <div className="h-1 bg-gray-100 dark:bg-white/5">
        <div
          className="h-full bg-[#34A853] transition-all duration-500 rounded-r-full"
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
            className={`w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-colors ${
              checked[i]
                ? 'bg-gray-50 dark:bg-white/[0.02]'
                : 'hover:bg-gray-50 dark:hover:bg-[#303134]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                checked[i]
                  ? 'bg-[#34A853] border-[#34A853]'
                  : 'border-gray-300 dark:border-gray-600'
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
                  ? 'text-[#34A853] dark:text-[#81c995] font-bold line-through opacity-80'
                  : 'text-gray-800 dark:text-[#e8eaed] font-medium'
              }`}
              dangerouslySetInnerHTML={{ __html: item }}
            />
          </button>
        ))}
      </div>

      {/* 결과 메시지 */}
      {count >= 3 && (
        <div className="bg-[#e6f4ea] dark:bg-[#34A853]/10 border-t border-[#34A853]/20 px-4 py-3.5 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <p className="text-[#137333] dark:text-[#81c995] text-[14px] font-semibold leading-relaxed">
            <strong className="font-extrabold">{count}개 이상 해당</strong>됩니다. 청구 가능한 보험금이 남아있을 가능성이 높으니 전문가 무료 진단을 받아보세요.
          </p>
        </div>
      )}
    </div>
  );
}
