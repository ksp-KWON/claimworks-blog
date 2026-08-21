'use client';

import React from 'react';

export type AdminStatusType = 'new' | 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'draft' | 'published';

interface AdminStatusPillProps {
  status: string;
  className?: string;
}

export default function AdminStatusPill({ status, className = '' }: AdminStatusPillProps) {
  let text = status;
  let colorStyle = 'bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 border-gray-200 dark:border-zinc-700';

  const s = status.toLowerCase();
  if (s.includes('미확인') || s.includes('new') || s.includes('대기') || s.includes('미답변')) {
    text = status || '미확인';
    colorStyle = 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50';
  } else if (s.includes('진행') || s.includes('상담중') || s.includes('in_progress') || s.includes('답변완료')) {
    text = status || '상담중';
    colorStyle = 'bg-blue-50 dark:bg-blue-950/40 text-[var(--google-blue)] dark:text-[#8ab4f8] border-blue-200 dark:border-blue-800/50';
  } else if (s.includes('보류') || s.includes('재검토') || s.includes('pending') || s.includes('임시')) {
    text = status || '보류';
    colorStyle = 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
  } else if (s.includes('완료') || s.includes('종결') || s.includes('completed') || s.includes('발행')) {
    text = status || '종결';
    colorStyle = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
  }

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${colorStyle} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      <span>{text}</span>
    </span>
  );
}
