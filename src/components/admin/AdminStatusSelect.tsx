'use client';

import React from 'react';

interface AdminStatusSelectProps {
  status: string;
  onStatusChange: (newStatus: string) => void;
  onDelete: () => void;
  className?: string;
}

export function AdminStatusSelect({ status, onStatusChange, onDelete, className = '' }: AdminStatusSelectProps) {
  // Normalize status strings for display (e.g. '상담완료' -> '완료')
  const normalizedStatus = status === '상담완료' || status === '상담 완료' ? '완료' : (status || '대기');

  return (
    <select
      value={normalizedStatus}
      onClick={e => e.stopPropagation()}
      onChange={(e) => {
        const val = e.target.value;
        if (val === 'delete') {
          e.target.value = normalizedStatus; // revert visual selection temporarily
          onDelete();
        } else {
          onStatusChange(val);
        }
      }}
      className={`appearance-none text-center font-bold outline-none border-0 cursor-pointer shadow-sm shrink-0 ${
        normalizedStatus === '대기' ? 'bg-red-50 text-red-600' :
        normalizedStatus === '상담' ? 'bg-blue-50 text-blue-600' :
        normalizedStatus === '완료' ? 'bg-green-50 text-green-600' :
        normalizedStatus === '보류' ? 'bg-yellow-50 text-yellow-600' :
        'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-300'
      } ${className}`}
    >
      <option value="대기" className="text-gray-900 bg-white font-medium">대기</option>
      <option value="상담" className="text-gray-900 bg-white font-medium">상담</option>
      <option value="완료" className="text-gray-900 bg-white font-medium">완료</option>
      <option value="보류" className="text-gray-900 bg-white font-medium">보류</option>
      <option value="delete" className="text-red-600 bg-white font-bold">삭제</option>
    </select>
  );
}
