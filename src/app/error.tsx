'use client'; // Error boundaries must be Client Components

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Next.js Page Error:', error);
  }, [error]);

  return (
    <div className="bg-red-50 text-red-600 p-8 rounded-none border border-red-100 shadow-sm">
      <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        화면을 불러오는 중 오류가 발생했습니다.
      </h2>
      <p className="text-sm mb-4">
        {error.message || '알 수 없는 오류가 발생했습니다.'}
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-none hover:bg-red-700 transition-colors"
      >
        다시 시도
      </button>
    </div>
  );
}
