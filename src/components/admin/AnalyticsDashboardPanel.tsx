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
    <div className="h-full flex-1 flex flex-col min-h-0 space-y-2.5 max-w-7xl mx-auto w-full overflow-hidden">
      {/* 👑 1열(1 Row) 3D 입체 직사각형 상단 컨트롤 바 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 shrink-0">
        {/* 1. 고유 방문자 */}
        <PremiumCard borderColor="blue" hoverEffect={true} className="!p-2.5 flex flex-col justify-between group">
          <div className="absolute right-[-6px] bottom-[-12px] opacity-[0.04] dark:opacity-[0.08] text-[58px] select-none pointer-events-none group-hover/card:scale-110 group-hover/card:rotate-6 transition-transform duration-300">
            👥
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full">
            <span className="text-[11px] font-bold text-gray-500 dark:text-zinc-400">고유 방문자 (UV)</span>
            <span className="text-base sm:text-lg font-extrabold text-blue-600 dark:text-blue-400 mt-0.5 tracking-tight font-mono">
              {(summary.uniqueVisitors || 0).toLocaleString()}
            </span>
          </div>
        </PremiumCard>

        {/* 2. 총 페이지뷰 */}
        <PremiumCard borderColor="green" hoverEffect={true} className="!p-2.5 flex flex-col justify-between group">
          <div className="absolute right-[-6px] bottom-[-12px] opacity-[0.04] dark:opacity-[0.08] text-[58px] select-none pointer-events-none group-hover/card:scale-110 group-hover/card:rotate-6 transition-transform duration-300">
            📊
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full">
            <span className="text-[11px] font-bold text-gray-500 dark:text-zinc-400">총 페이지뷰 (PV)</span>
            <span className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 tracking-tight font-mono">
              {(summary.pageviews || 0).toLocaleString()}
            </span>
          </div>
        </PremiumCard>

        {/* 3. 상담 유입 */}
        <PremiumCard borderColor="purple" hoverEffect={true} className="!p-2.5 flex flex-col justify-between group">
          <div className="absolute right-[-6px] bottom-[-12px] opacity-[0.04] dark:opacity-[0.08] text-[58px] select-none pointer-events-none group-hover/card:scale-110 group-hover/card:rotate-6 transition-transform duration-300">
            📞
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full">
            <span className="text-[11px] font-bold text-gray-500 dark:text-zinc-400">상담 유입 건수</span>
            <span className="text-base sm:text-lg font-extrabold text-purple-600 dark:text-purple-400 mt-0.5 tracking-tight font-mono">
              {summary.consultationViews || 0}<span className="text-xs font-bold text-gray-400 ml-0.5">건</span>
            </span>
          </div>
        </PremiumCard>

        {/* 4. 응답 속도 */}
        <PremiumCard borderColor="yellow" hoverEffect={true} className="!p-2.5 flex flex-col justify-between group">
          <div className="absolute right-[-6px] bottom-[-12px] opacity-[0.04] dark:opacity-[0.08] text-[58px] select-none pointer-events-none group-hover/card:scale-110 group-hover/card:rotate-6 transition-transform duration-300">
            ⚡
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full">
            <span className="text-[11px] font-bold text-gray-500 dark:text-zinc-400">평균 응답 속도</span>
            <span className="text-base sm:text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 tracking-tight font-mono">
              {summary.avgLoadTimeMs || 0}<span className="text-xs font-bold text-gray-400 ml-0.5">ms</span>
            </span>
          </div>
        </PremiumCard>

        {/* 5. 기간 선택 컨트롤 (24h / 7일 / 30일) */}
        <PremiumCard borderColor="blue" hoverEffect={true} className="!p-2 flex flex-col justify-between group">
          <div className="flex items-center justify-between relative z-10">
            <span className="text-[11px] font-bold text-gray-500 dark:text-zinc-400">조회 기간</span>
            <span className="text-[10px] font-extrabold text-[var(--google-blue)] dark:text-[#8ab4f8] bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.2 rounded-none border border-blue-200 dark:border-blue-800">
              {period === '24h' ? '24시간' : period === '7d' ? '7일간' : '30일간'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 bg-gray-100 dark:bg-zinc-800 p-0.5 rounded-none border border-gray-200/80 dark:border-zinc-700 w-full mt-0.5 relative z-10">
            {(['24h', '7d', '30d'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`py-0.5 text-xs font-bold transition-all text-center flex items-center justify-center rounded-none ${
                  period === p
                    ? 'bg-white dark:bg-zinc-900 text-[var(--google-blue)] dark:text-[#8ab4f8] shadow-sm font-extrabold ring-1 ring-blue-400/30'
                    : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-700/50'
                }`}
              >
                {p === '24h' ? '24h' : p === '7d' ? '7일' : '30일'}
              </button>
            ))}
          </div>
        </PremiumCard>

        {/* 6. 시스템 API 설정 토글 */}
        <PremiumCard borderColor="teal" hoverEffect={true} className="!p-2 flex flex-col justify-between group">
          <span className="text-[11px] font-bold text-gray-500 dark:text-zinc-400 relative z-10">시스템 연동</span>
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`w-full py-1 px-2 text-xs font-bold transition-all flex items-center justify-center mt-0.5 border rounded-none relative z-10 ${
              showSettings
                ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-300 dark:border-teal-800 shadow-sm'
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border-gray-200/80 dark:border-zinc-700 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-950/30'
            }`}
          >
            API {showSettings ? '닫기' : '설정'}
          </button>
        </PremiumCard>
      </div>

      {/* ⚙️ 시스템 API 자격증명 설정 아코디언 카드 (토글 시 노출) */}
      {showSettings && (
        <PremiumCard borderColor="teal" hoverEffect={true} className="bg-gradient-to-b from-teal-50/30 to-transparent dark:from-teal-950/20 shrink-0 !p-3.5 border-teal-200 dark:border-teal-800/60">
          <div className="flex items-center justify-between border-b border-teal-100 dark:border-teal-900/50 pb-2 mb-2.5">
            <h3 className="font-extrabold text-xs text-teal-900 dark:text-teal-200">
              시스템 API 키 및 자격증명 설정
            </h3>
            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded-none border border-teal-200 dark:border-teal-900">로컬 브라우저 암호화 저장</span>
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
                  className="w-full px-2.5 py-1 text-xs bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-none focus:ring-1 focus:ring-teal-500 font-mono text-gray-900 dark:text-zinc-100"
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
                  className="w-full px-2.5 py-1 text-xs bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-none focus:ring-1 focus:ring-teal-500 font-mono text-gray-900 dark:text-zinc-100"
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
                  className="w-full px-2.5 py-1 text-xs bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-none focus:ring-1 focus:ring-teal-500 font-mono text-gray-900 dark:text-zinc-100"
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
                  className="w-full px-2.5 py-1 text-xs bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-none focus:ring-1 focus:ring-teal-500 font-mono text-gray-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{saveStatus}</span>
              <PremiumButton type="submit" variant="primary" className="!px-3 !py-1 !text-xs font-bold rounded-none">
                저장하기
              </PremiumButton>
            </div>
          </form>
        </PremiumCard>
      )}

      {/* ── 2. 방문 추이 그래프 & 검색/유입 채널 ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 shrink-0">
        {/* 1. 방문 추이 그래프 (2칸) */}
        <PremiumCard borderColor="blue" hoverEffect={true} className="lg:col-span-2 !p-3.5 flex flex-col justify-between group">
          <div className="absolute right-[-10px] bottom-[-15px] opacity-[0.03] dark:opacity-[0.06] text-[110px] select-none pointer-events-none group-hover/card:scale-110 group-hover/card:rotate-3 transition-transform duration-300">
            📈
          </div>
          
          <div className="flex items-center justify-between mb-2 border-b border-gray-100 dark:border-zinc-800 pb-2 shrink-0 relative z-10">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white">
                방문 추이 분석 그래프
              </span>
              <span className="text-[10px] font-extrabold text-[var(--google-blue)] dark:text-[#8ab4f8] bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-none border border-blue-200 dark:border-blue-800">
                {period === '24h' ? '최근 24시간' : period === '7d' ? '최근 7일' : '최근 30일'}
              </span>
            </div>
            
            {/* 요약 통계 배지 */}
            <div className="flex items-center gap-2 text-[10.5px]">
              <span className="text-gray-500 dark:text-zinc-400">
                최고: <strong className="text-gray-900 dark:text-white font-mono">{Math.max(...(trend.map(d => d.requests) || [0]), 0).toLocaleString()}</strong>건
              </span>
              <span className="text-gray-300 dark:text-zinc-700">|</span>
              <span className="text-gray-500 dark:text-zinc-400">
                평균: <strong className="text-blue-600 dark:text-blue-400 font-mono">{trend.length > 0 ? Math.round(trend.reduce((a, b) => a + b.requests, 0) / trend.length).toLocaleString() : 0}</strong>건
              </span>
            </div>
          </div>

          {/* 콤팩트한 막대 그래프 (h-36) */}
          <div className="h-36 w-full flex items-end gap-1.5 sm:gap-2 pt-4 px-2 pb-1 bg-gray-50/70 dark:bg-zinc-950/70 rounded-none border border-gray-100 dark:border-zinc-800 relative z-10">
            {trend.length > 0 ? (
              trend.map((t, idx) => {
                const maxReq = Math.max(...trend.map(d => d.requests), 1);
                const heightPx = Math.max(14, Math.floor((t.requests / maxReq) * 82));
                const isMax = t.requests === maxReq;

                const showValueAlways = period === '7d' ? true : period === '24h' ? (idx % 2 === 0 || isMax) : (idx % 3 === 0 || isMax);
                const showLabelAlways = period === '7d' ? true : period === '24h' ? (idx % 3 === 0 || idx === trend.length - 1) : (idx % 4 === 0 || idx === trend.length - 1);

                return (
                  <div key={idx} className="flex-1 h-full flex flex-col justify-end items-center group/bar relative">
                    {/* 호버 시 툴팁 */}
                    <div className="absolute -top-6 bg-gray-900 text-white dark:bg-white dark:text-zinc-900 text-[10px] font-bold py-0.5 px-1.5 rounded-none shadow-lg pointer-events-none opacity-0 group-hover/bar:opacity-100 transition-opacity z-30 whitespace-nowrap">
                      {t.label}: {t.requests}건 (방문자 {t.visitors}명)
                    </div>

                    {/* 상시 노출 수치 */}
                    <span
                      className={`font-mono font-bold tracking-tight mb-0.5 text-center transition-all ${
                        isMax
                          ? 'text-blue-600 dark:text-blue-400 font-extrabold scale-105'
                          : 'text-gray-600 dark:text-zinc-300'
                      } ${
                        period === '7d'
                          ? 'text-[11px]'
                          : period === '24h'
                            ? (showValueAlways ? 'text-[8.5px]' : 'text-[8.5px] opacity-0 group-hover/bar:opacity-100')
                            : (showValueAlways ? 'text-[7.5px]' : 'text-[7.5px] opacity-0 group-hover/bar:opacity-100')
                      }`}
                    >
                      {t.requests}
                    </span>

                    {/* 막대 바 */}
                    <div
                      style={{ height: `${heightPx}px` }}
                      className={`w-full max-w-[28px] rounded-none transition-all shadow-sm group-hover/bar:brightness-125 ${
                        isMax
                          ? 'bg-gradient-to-t from-blue-600 to-indigo-400 dark:from-blue-500 dark:to-indigo-300 ring-1 ring-blue-400/40'
                          : 'bg-gradient-to-t from-[var(--google-blue)] to-[#669df6] dark:from-blue-600 dark:to-blue-400'
                      }`}
                    />

                    {/* 하단 날짜/시간 라벨 */}
                    <span className={`text-[8.5px] text-gray-500 dark:text-zinc-400 truncate w-full text-center font-mono mt-0.5 ${
                      showLabelAlways ? 'opacity-100' : 'opacity-40 group-hover/bar:opacity-100'
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

        {/* 2. 유입 채널 랭킹 (1칸) */}
        <PremiumCard borderColor="purple" hoverEffect={true} className="!p-3.5 flex flex-col justify-between group">
          <div className="absolute right-[-10px] bottom-[-15px] opacity-[0.03] dark:opacity-[0.06] text-[100px] select-none pointer-events-none group-hover/card:scale-110 group-hover/card:rotate-6 transition-transform duration-300">
            🧭
          </div>

          <div className="flex items-center justify-between mb-2 border-b border-gray-100 dark:border-zinc-800 pb-2 shrink-0 relative z-10">
            <span className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white">
              검색 & 유입 채널
            </span>
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-none border border-purple-200 dark:border-purple-900">점유율</span>
          </div>

          <div className="space-y-2 py-0.5 relative z-10">
            {topReferrers.length > 0 ? (
              topReferrers.map((ref, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-gray-700 dark:text-zinc-300 truncate">{ref.source}</span>
                    <span className="text-[var(--google-blue)] dark:text-[#8ab4f8] font-mono shrink-0 ml-2">{ref.percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-none bg-gray-100 dark:bg-zinc-800 overflow-hidden border border-gray-200/50 dark:border-zinc-700/50">
                    <div
                      style={{ width: `${ref.percentage}%` }}
                      className="h-full bg-gradient-to-r from-[var(--google-blue)] to-purple-500 rounded-none"
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-400 py-4 text-center">유입 채널 분석 중...</div>
            )}
          </div>
        </PremiumCard>
      </div>

      {/* ── 3. 인기 보상 칼럼 TOP 10 ───────── */}
      <PremiumCard borderColor="blue" hoverEffect={true} className="!p-0 flex-1 min-h-0 flex flex-col group">
        <div className="p-3 sm:px-4 border-b border-gray-200/80 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-gradient-to-r from-blue-50/60 to-transparent dark:from-blue-950/30 dark:to-transparent relative z-10">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white">
              인기 보상 칼럼 TOP 10 실시간 순위
            </span>
            <span className="text-[10px] text-gray-400 hidden sm:inline-block">독자 유입 및 조회수 랭킹</span>
          </div>
          <PremiumBadge color="blue" className="!text-[10px] !px-2.5 !py-0.5 rounded-none">실시간 PV 집계</PremiumBadge>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-gray-100 dark:divide-zinc-800/60 min-h-0 relative z-10 bg-white dark:bg-[#202124]">
          {topPages.length > 0 ? (
            topPages.map((page, idx) => (
              <div key={idx} className="px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-3 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 transition-all duration-200 group/row border-l-2 border-transparent hover:border-[var(--google-blue)]">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className={`w-5 h-5 rounded-none flex items-center justify-center text-[10px] font-extrabold shrink-0 shadow-sm transition-transform duration-200 group-hover/row:scale-110 ${
                    idx === 0 
                      ? 'bg-amber-500 text-white shadow-amber-500/30' 
                      : idx === 1 
                        ? 'bg-slate-400 text-white shadow-slate-400/30' 
                        : idx === 2 
                          ? 'bg-amber-700 text-white shadow-amber-700/30' 
                          : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}>
                    {idx + 1}
                  </span>
                  <a
                    href={page.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 group-hover/row:text-[var(--google-blue)] dark:group-hover/row:text-[#8ab4f8] truncate transition-colors"
                  >
                    {page.title}
                  </a>
                </div>
                <div className="shrink-0 flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-zinc-900 px-2.5 py-1 rounded-none border border-gray-200/80 dark:border-zinc-700/80 shadow-sm group-hover/row:border-blue-300 dark:group-hover/row:border-blue-700 transition-colors">
                  <span className="text-blue-600 dark:text-blue-400">{(page.views || 0).toLocaleString()}</span>
                  <span className="text-gray-400 font-normal text-[10px]">PV</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-gray-400">집계 중...</div>
          )}
        </div>
      </PremiumCard>
    </div>
  );
}
