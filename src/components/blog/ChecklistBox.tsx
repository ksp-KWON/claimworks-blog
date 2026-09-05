'use client';

import { useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import CommonBox from './CommonBox';
import AppIcon from '@/components/ui/AppIcon';

interface ChecklistBoxProps {
  items: string[];
}

export default function ChecklistBox({ items }: ChecklistBoxProps) {
  const [checked, setChecked] = useState<boolean[]>(new Array(items.length).fill(false));
  const count = checked.filter(Boolean).length;
  const pct = Math.round((count / items.length) * 100);

  const progressBar = (
    <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 dark:bg-white/5 z-20">
      <div
        className="h-full bg-[var(--google-green)] transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );

  const headerRight = (
    <div className="text-right flex items-center gap-2">
      <span className="text-xs text-[#5f6368] dark:text-gray-400 font-bold">해당 항목 클릭</span>
      <span className="text-lg font-black text-[var(--google-green)] dark:text-[#81c995]">
        {count}<span className="text-xs font-bold text-gray-400">/{items.length}</span>
      </span>
    </div>
  );

  const icon = <AppIcon name="shield-check" size={16} className="text-[var(--google-green)] dark:text-[#81c995]" />;

  return (
    <CommonBox
      tone="green"
      title="1분 자가진단 체크리스트"
      icon={icon}
      topElement={progressBar}
      headerRight={headerRight}
    >
      <div className="divide-y divide-gray-100 dark:divide-white/5 pt-1">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => {
              const next = [...checked];
              next[i] = !next[i];
              setChecked(next);
            }}
            className="w-full flex items-start gap-3 py-2 text-left transition-colors group/btn"
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
            <div
              className={`flex-1 text-[14.5px] leading-[1.6] break-keep transition-colors ${
                checked[i]
                  ? 'text-[var(--google-green)] dark:text-[#81c995] font-bold'
                  : 'text-gray-800 dark:text-[#e8eaed] font-medium group-hover:text-[var(--google-green)] dark:group-hover:text-[#81c995]'
              }`}
            >
              <MarkdownRenderer content={item} inline={true} />
            </div>
          </button>
        ))}
      </div>

      {count >= 3 && (
        <div className="mt-4 bg-[#fce8e6] dark:bg-[#c5221f]/10 px-4 py-3 flex items-start gap-2 rounded-none">
          <p className="text-[#c5221f] dark:text-[#f28b82] text-[13.5px] font-semibold leading-relaxed">
            <strong className="font-extrabold">{count}개 이상 해당</strong>됩니다. 정당한 보상 항목이 누락되었을 가능성이 있으니 전문가 정밀 진단을 권장합니다.
          </p>
        </div>
      )}
    </CommonBox>
  );
}
