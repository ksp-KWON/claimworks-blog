'use client';

import { useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import CommonBox from './CommonBox';

interface FAQItem {
  q: string;
  a: string;
}

interface FAQBoxProps {
  items: FAQItem[];
}

export default function FAQBox({ items }: FAQBoxProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <CommonBox tone="blue" title="자주 묻는 질문 (FAQ)">
      <div className="divide-y divide-gray-100 dark:divide-white/5">
        {items.map((item, i) => (
          <div key={i}>
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="w-full flex items-center gap-3 py-2.5 text-left transition-colors group/btn"
            >
              <span className={`text-[13px] font-black shrink-0 transition-colors mt-0.5 ${openIdx === i ? 'text-[var(--google-blue)]' : 'text-gray-400 dark:text-gray-500 group-hover/btn:text-[var(--google-blue)]'}`}>
                Q{i + 1}
              </span>
              <span className={`flex-1 text-[14.5px] transition-colors break-keep ${openIdx === i ? 'font-bold text-[var(--google-blue)] dark:text-[#8ab4f8]' : 'font-medium text-gray-800 dark:text-[#e8eaed] group-hover/btn:text-[var(--google-blue)] dark:group-hover/btn:text-[#8ab4f8]'}`}>
                {item.q}
              </span>
              <svg
                className={`w-4 h-4 shrink-0 transition-transform duration-300 ${openIdx === i ? 'rotate-180 text-[var(--google-blue)] dark:text-[#8ab4f8]' : 'text-gray-400 group-hover/btn:text-[var(--google-blue)] dark:group-hover/btn:text-[#8ab4f8]'}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                openIdx === i ? 'max-h-[1000px] opacity-100 mt-2 mb-3' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="pl-[30px] pr-2 py-2">
                <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-none p-4 text-[13.5px] leading-[1.75] text-gray-700 dark:text-gray-300 border-l-2 border-blue-300 dark:border-blue-700 break-keep">
                  <MarkdownRenderer content={item.a} inline={true} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </CommonBox>
  );
}
