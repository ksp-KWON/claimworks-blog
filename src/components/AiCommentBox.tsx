'use client';

import { useState } from 'react';
import AppIcon from '@/components/ui/AppIcon';

interface AiCommentBoxProps {
  sourceText: string;
  type: 'precedent' | 'fss' | 'traffic';
  // UI Customization
  className?: string;
}

export default function AiCommentBox({ sourceText, type, className = '' }: AiCommentBoxProps) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const fetchComment = async () => {
    setHasStarted(true);
    setLoading(true);
    setError(false);
    
    try {
      const res = await fetch('/api/generate-ai-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceText, type })
      });
      
      if (!res.ok) throw new Error('API 오류');
      
      const data = await res.json();
      setComment(data.comment || '분석 결과를 가져오지 못했습니다.');
    } catch (err) {
      setError(true);
      setComment('서버 통신 오류로 코멘트를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-amber-50/40 dark:bg-amber-950/20 p-4 rounded-none border border-amber-200/80 dark:border-amber-900/40 space-y-2 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
        <AppIcon name="book" size={16} />
        <span>보상스쿨 수석 손해사정사 실무 코멘트</span>
      </div>
      
      <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium pl-1 min-h-[2.5rem]">
        {!hasStarted ? (
          <button
            onClick={fetchComment}
            className="mt-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 text-white text-xs font-bold rounded-none shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <AppIcon name="zap" size={14} />
            이 사안의 핵심 실무 요약 보기
          </button>
        ) : loading ? (
          <div className="flex items-center gap-2 text-amber-700/80 dark:text-amber-300/80 animate-pulse mt-1">
            <div className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            <span>해당 사안을 실시간으로 분석하고 있습니다... (약 2~4초 소요)</span>
          </div>
        ) : (
          <div className="space-y-1.5 mt-1">
            <p className={`whitespace-pre-wrap ${error ? 'text-red-500' : ''}`}>{comment}</p>
            {!error && (
              <p className="text-[10px] text-gray-400 mt-2 block border-t border-gray-100 dark:border-zinc-800 pt-2">
                ※ 본 코멘트는 보상스쿨의 누적된 보상 실무 빅데이터를 기반으로 실시간 요약된 참고용 팁입니다. 개별 사실관계에 따라 결과가 달라질 수 있으므로 반드시 전문가와 상담하시기 바랍니다.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
