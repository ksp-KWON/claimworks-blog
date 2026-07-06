'use client';

import { useState, useEffect } from 'react';

interface AiCommentBoxProps {
  sourceText: string;
  type: 'precedent' | 'fss' | 'traffic';
  // UI Customization
  className?: string;
}

function IconBriefcase({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
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
    <div className={`bg-[#fcf8e3]/30 dark:bg-[#fcf8e3]/5 p-4 rounded-none border border-[#faebcc]/50 dark:border-[#faebcc]/10 space-y-2 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs font-black text-[#8a6d3b] dark:text-[#c4a86f]">
        <span className="text-sm"><IconBriefcase className="w-4 h-4" /></span>
        👨‍🏫 보상스쿨 AI 손해사정사 실무 코멘트
      </div>
      
      <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium pl-1 min-h-[2.5rem]">
        {!hasStarted ? (
          <button
            onClick={fetchComment}
            className="mt-1 px-5 py-2.5 bg-[#8a6d3b] dark:bg-[#c4a86f] text-white dark:text-[#202124] text-xs font-bold rounded-none shadow-md hover:bg-[#6e562d] dark:hover:bg-[#a38a58] transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            이 사안의 AI 실무 핵심 요약 보기
          </button>
        ) : loading ? (
          <div className="flex items-center gap-2 text-[#8a6d3b]/70 dark:text-[#c4a86f]/70 animate-pulse mt-1">
            <div className="w-3 h-3 border-2 border-[#8a6d3b] border-t-transparent rounded-full animate-spin" />
            <span>해당 사안을 실시간으로 분석하고 있습니다... (약 2~4초 소요)</span>
          </div>
        ) : (
          <div className="space-y-1.5 mt-1">
            <p className={`whitespace-pre-wrap ${error ? 'text-red-500' : ''}`}>{comment}</p>
            {!error && (
              <p className="text-[10px] text-gray-400 mt-2 block border-t border-gray-100 dark:border-gray-800 pt-2">
                ※ 본 코멘트는 최신 AI(Gemini)가 데이터를 실시간으로 요약한 참고용 실무 팁입니다. 개별 사실관계에 따라 결과가 달라질 수 있으므로 반드시 전문가와 상담하시기 바랍니다.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
