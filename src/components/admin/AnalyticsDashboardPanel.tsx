'use client';

import React, { useState, useEffect } from 'react';
import { UniversalAnalyticsData, SystemCredentials } from '@/lib/analytics/types';
import { getUniversalAnalyticsData } from '@/lib/analytics/universal-analytics';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumBadge from '@/components/ui/PremiumBadge';
import PremiumButton from '@/components/ui/PremiumButton';

export default function AnalyticsDashboardPanel() {
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('7d');
  const [data, setData] = useState<UniversalAnalyticsData>(() => getUniversalAnalyticsData('7d'));
  const [loading, setLoading] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('');

  const [credentials, setCredentials] = useState<SystemCredentials>({
    geminiApiKey: '',
    githubToken: '',
    cloudflareZoneId: '',
    cloudflareApiToken: '',
  });

  useEffect(() => {
    const gemini = localStorage.getItem('gemini_api_key') || '';
    const github = localStorage.getItem('github_token') || '';
    const cfZone = localStorage.getItem('cf_zone_id') || '';
    const cfToken = localStorage.getItem('cf_api_token') || '';

    setCredentials({
      geminiApiKey: gemini,
      githubToken: github,
      cloudflareZoneId: cfZone,
      cloudflareApiToken: cfToken,
    });
  }, []);

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('gemini_api_key', credentials.geminiApiKey);
    localStorage.setItem('github_token', credentials.githubToken);
    localStorage.setItem('cf_zone_id', credentials.cloudflareZoneId || '');
    localStorage.setItem('cf_api_token', credentials.cloudflareApiToken || '');
    setSaveStatus('✅ 저장되었습니다.');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  useEffect(() => {
    setLoading(true);
    const analytics = getUniversalAnalyticsData(period);
    setData(analytics);
    setLoading(false);
  }, [period]);

  const summary = data?.summary || {
    uniqueVisitors: 0,
    totalRequests: 0,
    pageviews: 0,
    consultationViews: 0,
    avgLoadTimeMs: 0,
    blockedAttacks: 0,
  };
  const trend = data?.trend || [];
  const topReferrers = data?.topReferrers || [];
  const topPages = data?.topPages || [];

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 space-y-3.5 max-w-7xl mx-auto w-full overflow-hidden">
      {/* 👑 1열(1 Row) 콤팩트 상단 컨트롤 바 (아이콘 제거, 6개 박스 일렬 정렬) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 shrink-0">
        {/* 1. 고유 방문자 */}
        <PremiumCard borderColor="blue" className="!p-2.5 flex flex-col justify-center bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-xl shadow-sm">
          <span className="text-[11px] font-bold text-gray-500 dark:text-zinc-400">고유 방문자 (UV)</span>
          <span className="text-base sm:text-lg font-extrabold text-blue-600 dark:text-blue-400 mt-0.5 tracking-tight">
            {(summary.uniqueVisitors || 0).toLocaleString()}
          </span>
        </PremiumCard>

        {/* 2. 총 페이지뷰 */}
        <PremiumCard borderColor="green" className="!p-2.5 flex flex-col justify-center bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-xl shadow-sm">
          <span className="text-[11px] font-bold text-gray-500 dark:text-zinc-400">총 페이지뷰 (PV)</span>
          <span className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 tracking-tight">
            {(summary.pageviews || 0).toLocaleString()}
          </span>
        </PremiumCard>

        {/* 3. 상담 유입 */}
        <PremiumCard borderColor="purple" className="!p-2.5 flex flex-col justify-center bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-xl shadow-sm">
          <span className="text-[11px] font-bold text-gray-500 dark:text-zinc-400">상담 유입 건수</span>
          <span className="text-base sm:text-lg font-extrabold text-purple-600 dark:text-purple-400 mt-0.5 tracking-tight">
            {summary.consultationViews || 0}건
          </span>
        </PremiumCard>

        {/* 4. 응답 속도 */}
        <PremiumCard borderColor="yellow" className="!p-2.5 flex flex-col justify-center bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-xl shadow-sm">
          <span className="text-[11px] font-bold text-gray-500 dark:text-zinc-400">평균 응답 속도</span>
          <span className="text-base sm:text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 tracking-tight">
            {summary.avgLoadTimeMs || 0}ms
          </span>
        </PremiumCard>

        {/* 5. 기간 선택 컨트롤 (24h / 7일 / 30일) */}
        <PremiumCard borderColor="blue" className="!p-2.5 flex flex-col justify-between bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 dark:text-zinc-400">조회 기간 설정</span>
            <span className="text-[10px] font-extrabold text-[var(--google-blue)] dark:text-[#8ab4f8] bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
              {period === '24h' ? '24시간' : period === '7d' ? '7일간' : '30일간'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 bg-gray-100 dark:bg-zinc-800/90 p-0.5 rounded-lg border border-gray-200/80 dark:border-zinc-700 w-full mt-1">
            {(['24h', '7d', '30d'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`py-1 rounded-md text-xs font-bold transition-all text-center flex items-center justify-center ${
                  period === p
                    ? 'bg-white dark:bg-zinc-900 text-[var(--google-blue)] dark:text-[#8ab4f8] shadow-sm font-extrabold ring-1 ring-black/5 dark:ring-white/10'
                    : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-700/50'
                }`}
              >
                {p === '24h' ? '24h' : p === '7d' ? '7일' : '30일'}
              </button>
            ))}
          </div>
        </PremiumCard>

        {/* 6. 시스템 API 설정 토글 */}
        <PremiumCard borderColor="default" className="!p-2.5 flex flex-col justify-between bg-white dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 rounded-xl shadow-sm">
          <span className="text-[11px] font-bold text-gray-500 dark:text-zinc-400">시스템 연동 관리</span>
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`w-full py-1 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 mt-1 border ${
              showSettings
                ? 'bg-blue-50 dark:bg-blue-900/30 text-[var(--google-blue)] dark:text-[#8ab4f8] border-blue-200 dark:border-blue-800 shadow-sm'
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-200/80 dark:border-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-700'
            }`}
          >
            <span>⚙️</span>
            <span>API 설정 {showSettings ? '닫기' : '열기'}</span>
          </button>
        </PremiumCard>
      </div>

      {/* ⚙️ 시스템 API 자격증명 설정 아코디언 카드 (토글 시 노출) */}
      {showSettings && (
        <PremiumCard borderColor="blue" className="bg-gradient-to-b from-blue-50/30 to-transparent dark:from-blue-950/20 shrink-0 !p-3">
          <div className="flex items-center justify-between border-b border-gray-200/80 dark:border-zinc-800 pb-2 mb-2.5">
            <h3 className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
              <span>🔐</span>
              <span>시스템 API 키 및 자격증명 설정</span>
            </h3>
            <span className="text-[10px] text-gray-400">로컬 브라우저 암호화 저장</span>
          </div>

          <form onSubmit={handleSaveCredentials} className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[10px] font-bold text-gray-600 dark:text-zinc-400 mb-0.5">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={credentials.geminiApiKey}
                  onChange={(e) => setCredentials({ ...credentials, geminiApiKey: e.target.value })}
                  placeholder="AI_zaSy..."
                  className="w-full px-2.5 py-1 text-xs bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-blue-500 font-mono text-gray-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 dark:text-zinc-400 mb-0.5">
                  GitHub Token
                </label>
                <input
                  type="password"
                  value={credentials.githubToken}
                  onChange={(e) => setCredentials({ ...credentials, githubToken: e.target.value })}
                  placeholder="github_pat_..."
                  className="w-full px-2.5 py-1 text-xs bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-blue-500 font-mono text-gray-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 dark:text-zinc-400 mb-0.5">
                  CF Zone ID
                </label>
                <input
                  type="text"
                  value={credentials.cloudflareZoneId || ''}
                  onChange={(e) => setCredentials({ ...credentials, cloudflareZoneId: e.target.value })}
                  placeholder="Zone ID (32자리)"
                  className="w-full px-2.5 py-1 text-xs bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-blue-500 font-mono text-gray-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-600 dark:text-zinc-400 mb-0.5">
                  CF API Token
                </label>
                <input
                  type="password"
                  value={credentials.cloudflareApiToken || ''}
                  onChange={(e) => setCredentials({ ...credentials, cloudflareApiToken: e.target.value })}
                  placeholder="Analytics Read Token"
                  className="w-full px-2.5 py-1 text-xs bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-blue-500 font-mono text-gray-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{saveStatus}</span>
              <PremiumButton type="submit" variant="primary" className="!px-3 !py-1 !text-xs font-bold">
                저장하기
              </PremiumButton>
            </div>
          </form>
        </PremiumCard>
      )}

      {/* ── 2. 방문 추이 그래프 (명확한 높이 및 선명한 Bar 렌더링) ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1 min-h-0">
        <PremiumCard className="lg:col-span-2 !p-3.5 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2 border-b border-gray-100 dark:border-zinc-800 pb-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                <span>📈</span>
                <span>방문 추이 분석 그래프</span>
              </span>
              <span className="text-[10px] font-extrabold text-[var(--google-blue)] dark:text-[#8ab4f8] bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-800/50">
                {period === '24h' ? '최근 24시간' : period === '7d' ? '최근 7일' : '최근 30일'}
              </span>
            </div>
            
            {/* 요약 통계 배지 */}
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-gray-500 dark:text-zinc-400">
                최고: <strong className="text-gray-900 dark:text-white font-mono">{Math.max(...(trend.map(d => d.requests) || [0]), 0).toLocaleString()}</strong>건
              </span>
              <span className="text-gray-300 dark:text-zinc-700">|</span>
              <span className="text-gray-500 dark:text-zinc-400">
                평균: <strong className="text-blue-600 dark:text-blue-400 font-mono">{trend.length > 0 ? Math.round(trend.reduce((a, b) => a + b.requests, 0) / trend.length).toLocaleString() : 0}</strong>건
              </span>
            </div>
          </div>

          {/* 명시적 높이와 수치가 명확히 보이는 막대 그래프 렌더링 */}
          <div className="h-48 w-full flex items-end gap-1.5 sm:gap-2 pt-6 px-2 pb-1.5 bg-gray-50/60 dark:bg-zinc-950/50 rounded-xl border border-gray-100/80 dark:border-zinc-800/70 relative">
            {trend.length > 0 ? (
              trend.map((t, idx) => {
                const maxReq = Math.max(...trend.map(d => d.requests), 1);
                const heightPx = Math.max(16, Math.floor((t.requests / maxReq) * 115));
                const isMax = t.requests === maxReq;

                const showValueAlways = period === '7d' ? true : period === '24h' ? (idx % 2 === 0 || isMax) : (idx % 3 === 0 || isMax);
                const showLabelAlways = period === '7d' ? true : period === '24h' ? (idx % 3 === 0 || idx === trend.length - 1) : (idx % 4 === 0 || idx === trend.length - 1);

                return (
                  <div key={idx} className="flex-1 h-full flex flex-col justify-end items-center group relative">
                    {/* 호버 시 툴팁 */}
                    <div className="absolute -top-7 bg-gray-900 text-white dark:bg-white dark:text-zinc-900 text-[10px] font-bold py-0.5 px-2 rounded-md shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-30 whitespace-nowrap">
                      {t.label}: {t.requests}건 (방문자 {t.visitors}명)
                    </div>

                    {/* 상시 노출 수치 */}
                    <span
                      className={`font-mono font-bold tracking-tight mb-1 text-center transition-all ${
                        isMax
                          ? 'text-blue-600 dark:text-blue-400 font-extrabold scale-105'
                          : 'text-gray-600 dark:text-zinc-300'
                      } ${
                        period === '7d'
                          ? 'text-xs'
                          : period === '24h'
                            ? (showValueAlways ? 'text-[9px]' : 'text-[9px] opacity-0 group-hover:opacity-100')
                            : (showValueAlways ? 'text-[8px]' : 'text-[8px] opacity-0 group-hover:opacity-100')
                      }`}
                    >
                      {t.requests}
                    </span>

                    {/* 막대 바 */}
                    <div
                      style={{ height: `${heightPx}px` }}
                      className={`w-full max-w-[28px] rounded-t-md transition-all shadow-sm group-hover:brightness-125 ${
                        isMax
                          ? 'bg-gradient-to-t from-blue-600 to-indigo-400 dark:from-blue-500 dark:to-indigo-300 ring-1 ring-blue-400/40'
                          : 'bg-gradient-to-t from-[var(--google-blue)] to-[#669df6] dark:from-blue-600 dark:to-blue-400'
                      }`}
                    />

                    {/* 하단 날짜/시간 라벨 */}
                    <span className={`text-[9px] text-gray-500 dark:text-zinc-400 truncate w-full text-center font-mono mt-1 ${
                      showLabelAlways ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'
                    }`}>
                      {t.label}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                {loading ? '트래픽 분석 중...' : '데이터 없음'}
              </div>
            )}
          </div>
        </PremiumCard>

        {/* 유입 채널 랭킹 */}
        <PremiumCard className="!p-3.5 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2 border-b border-gray-100 dark:border-zinc-800 pb-1.5 shrink-0">
            <span className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
              <span>🧭</span>
              <span>검색 & 유입 채널</span>
            </span>
            <span className="text-[10px] text-gray-400">점유율</span>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1">
            {topReferrers.length > 0 ? (
              topReferrers.map((ref, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-gray-700 dark:text-zinc-300">{ref.source}</span>
                    <span className="text-[var(--google-blue)] dark:text-[#8ab4f8]">{ref.percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      style={{ width: `${ref.percentage}%` }}
                      className="h-full bg-gradient-to-r from-[var(--google-blue)] to-indigo-500 rounded-full"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-400 py-6 text-center">유입 채널 분석 중...</div>
            )}
          </div>
        </PremiumCard>
      </div>

      {/* ── 3. 인기 보상 칼럼 TOP 10 (콤팩트 테이블) ───────────────────────── */}
      <PremiumCard className="!p-0 shrink-0">
        <div className="p-2.5 sm:px-3.5 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <span className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
            <span>🏆</span>
            <span>인기 보상 칼럼 TOP 10</span>
          </span>
          <PremiumBadge color="blue" className="!text-[10px] !px-2 !py-0.5">실시간 PV</PremiumBadge>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-zinc-800/60 max-h-40 overflow-y-auto custom-scrollbar">
          {topPages.length > 0 ? (
            topPages.map((page, idx) => (
              <div key={idx} className="px-3 py-1.5 flex items-center justify-between gap-3 hover:bg-gray-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-extrabold shrink-0 ${idx < 3 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                    {idx + 1}
                  </span>
                  <a
                    href={page.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-gray-800 dark:text-zinc-200 hover:text-[var(--google-blue)] truncate transition-colors"
                  >
                    {page.title}
                  </a>
                </div>
                <div className="shrink-0 text-[11px] font-bold text-gray-900 dark:text-white font-mono">
                  {(page.views || 0).toLocaleString()} <span className="text-gray-400 font-normal text-[10px]">PV</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-gray-400">집계 중...</div>
          )}
        </div>
      </PremiumCard>
    </div>
  );
}
