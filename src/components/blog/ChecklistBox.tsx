'use client';

import { useState } from 'react';

interface ChecklistBoxProps {
  items: string[];
}

export default function ChecklistBox({ items }: ChecklistBoxProps) {
  const [checked, setChecked] = useState<boolean[]>(new Array(items.length).fill(false));
  const count = checked.filter(Boolean).length;
  const pct = Math.round((count / items.length) * 100);

  return (
    <div className="my-10 bg-white dark:bg-[#202124] p-5 sm:p-6 rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:shadow-[0_16px_50px_rgba(52,168,83,0.25)] hover:border-[var(--google-green)] transition-all duration-300 relative overflow-hidden group">
      <div className="absolute right-[-10px] bottom-[-20px] opacity-[0.03] dark:opacity-[0.05] text-[120px] select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
        ☑️
      </div>
      <div className="relative z-10">
        <div className="border-b border-gray-100 dark:border-white/5 pb-3 mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2 border-l-4 border-[var(--google-green)] pl-2.5">
              <span className="text-[var(--google-green)] text-lg leading-none">☑️</span>
              1분 자가진단 체크리스트
            </h3>
            <div className="text-right flex items-center gap-2">
              <span className="text-xs text-[#5f6368] font-bold">해당 항목 클릭</span>
              <span className="text-lg font-black text-[var(--google-green)] dark:text-[#81c995]">
                {count}<span className="text-xs font-bold text-gray-400">/{items.length}</span>
              </span>
            </div>
          </div>
        </div>

        {/* 진행 바 */}
        <div className="h-1 bg-gray-100 dark:bg-white/5 mb-4">
          <div
            className="h-full bg-[var(--google-green)] transition-all duration-500 rounded-none"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* 항목들 */}
        <div className="divide-y divide-gray-100 dark:divide-white/5 border-t border-gray-100 dark:border-white/5">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => {
                const next = [...checked];
                next[i] = !next[i];
                setChecked(next);
              }}
              className={`w-full flex items-start gap-3 py-3.5 text-left transition-colors group ${
                checked[i] ? '' : ''
              }`}
            >
              <div
                className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center shrink-0 transition-all mt-0.5 ${
                  checked[i]
                    ? 'bg-[var(--google-green)] border-[var(--google-green)] shadow-sm'
                    : 'border-gray-300 dark:border-gray-600 group-hover:border-[var(--google-green)]'
                }`}
              >
                {checked[i] && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span
                className={`flex-1 text-[14.5px] leading-relaxed break-keep transition-colors ${
                  checked[i]
                    ? 'text-[var(--google-green)] dark:text-[#81c995] font-bold'
                    : 'text-gray-800 dark:text-[#e8eaed] font-medium group-hover:text-[var(--google-green)] dark:group-hover:text-[#81c995]'
                }`}
                dangerouslySetInnerHTML={{ __html: item }}
              />
            </button>
          ))}
        </div>

        {/* 결과 메시지 */}
        {count >= 3 && (
          <div className="mt-4 bg-[#fce8e6] dark:bg-[#c5221f]/10 border border-[#f28b82]/30 px-4 py-3 flex items-start gap-2 rounded-none">
            <span className="text-[14px] mt-0.5">⚠️</span>
            <p className="text-[#c5221f] dark:text-[#f28b82] text-[13px] font-semibold leading-relaxed">
              <strong className="font-extrabold">{count}개 이상 해당</strong>됩니다. 숨은 보상금이 있을 가능성이 높으니 전문가 무료 진단을 권장합니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
