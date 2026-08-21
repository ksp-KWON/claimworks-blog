'use client';

import React from 'react';

export interface AdminStatusSelectProps {
  status?: string;
  value?: string;
  onStatusChange?: (newStatus: any) => void;
  onChange?: (newStatus: any) => void;
  onDelete?: () => void;
  options?: { value: string; label: string }[];
  className?: string;
}

const DEFAULT_OPTIONS = [
  { value: '대기', label: '대기' },
  { value: '미확인', label: '미확인' },
  { value: '상담중', label: '상담중' },
  { value: '상담', label: '상담' },
  { value: '보류', label: '보류' },
  { value: '완료', label: '완료' },
  { value: '종결', label: '종결' },
  { value: '삭제', label: '삭제' },
];

export function AdminStatusSelect({
  status,
  value,
  onStatusChange,
  onChange,
  onDelete,
  options = DEFAULT_OPTIONS,
  className = ''
}: AdminStatusSelectProps) {
  const currentVal = value || status || '대기';

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVal = e.target.value;
    if (newVal === '삭제' && onDelete) {
      if (confirm('정말로 이 항목을 삭제하시겠습니까?')) {
        onDelete();
      }
      return;
    }
    if (onStatusChange) onStatusChange(newVal);
    if (onChange) onChange(newVal);
  };

  const getStyle = (val: string) => {
    const v = val.toLowerCase();
    if (v.includes('미확인') || v.includes('new') || v.includes('대기')) {
      return 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50';
    }
    if (v.includes('상담') || v.includes('진행') || v.includes('답변완료')) {
      return 'bg-blue-50 dark:bg-blue-950/40 text-[var(--google-blue)] dark:text-[#8ab4f8] border-blue-200 dark:border-blue-800/50';
    }
    if (v.includes('보류') || v.includes('재검토')) {
      return 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50';
    }
    if (v.includes('종결') || v.includes('완료') || v.includes('발행')) {
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50';
    }
    return 'bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-700';
  };

  return (
    <select
      value={currentVal}
      onChange={handleChange}
      className={`text-xs font-bold px-2.5 py-1 rounded-none border appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-sm ${getStyle(currentVal)} ${className}`}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-white dark:bg-zinc-900 text-gray-900 dark:text-white">
          {opt.label}
        </option>
      ))}
    </select>
  );
}
