'use client';

import { useState } from 'react';

interface GlossaryItem {
  term: string;
  definition: string;
}

interface GlossaryBoxProps {
  items: GlossaryItem[];
}

export default function GlossaryBox({ items }: GlossaryBoxProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="my-10 bg-white dark:bg-[#202124] p-5 sm:p-6 rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:shadow-[0_16px_50px_rgba(251,188,4,0.3)] hover:border-[var(--google-yellow)] transition-all duration-300 relative overflow-hidden group">
      <div className="absolute right-[-10px] bottom-[-20px] opacity-[0.03] dark:opacity-[0.05] text-[120px] select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
        📖
      </div>
      <div className="relative z-10">
        <div className="border-b border-gray-100 dark:border-white/5 pb-3 mb-4">
          <h3 className="text-base font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2 border-l-4 border-[var(--google-yellow)] pl-2.5">
            <span className="text-[var(--google-yellow)] text-lg leading-none">📖</span>
            핵심 보상 용어 사전
          </h3>
        </div>

        <div className="border-t border-gray-100 dark:border-white/5 divide-y divide-gray-100 dark:divide-white/5">
          {items.map((item, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center gap-3 py-3 text-left transition-colors group/btn"
              >
                <span className={`text-[13px] font-black shrink-0 transition-colors mt-0.5 ${openIdx === i ? 'text-[var(--google-yellow)]' : 'text-gray-400 dark:text-gray-500 group-hover/btn:text-[var(--google-yellow)]'}`}>
                  {i + 1}
                </span>
                <span className={`flex-1 text-[14.5px] transition-colors break-keep ${openIdx === i ? 'font-bold text-[var(--google-yellow)] dark:text-yellow-400' : 'font-medium text-gray-800 dark:text-[#e8eaed] group-hover/btn:text-[var(--google-yellow)] dark:group-hover/btn:text-yellow-400'}`}>
                  {item.term}
                </span>
                <svg
                  className={`w-4 h-4 shrink-0 transition-transform duration-300 ${openIdx === i ? 'rotate-180 text-[var(--google-yellow)] dark:text-yellow-400' : 'text-gray-400 group-hover/btn:text-[var(--google-yellow)] dark:group-hover/btn:text-yellow-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIdx === i ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="pb-4 pl-[26px] pr-4">
                  <p
                    className="text-[14px] text-gray-600 dark:text-[#bdc1c6] leading-relaxed break-keep border-l-2 border-[var(--google-yellow)]/30 pl-3"
                    dangerouslySetInnerHTML={{
                      __html: item.definition.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:700;color:currentColor">$1</strong>'),
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
