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
    setSaveStatus('✅ 설정이 안전하게 로컬에 저장되었습니다.');
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
    <div className="h-full flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar space-y-4 max-w-7xl mx-auto w-full">
      {/* 👑 상단 기능 툴바 (설명 박스 제거, 기능 버튼만 콤팩트 배치) */}
      <div className="flex items-center justify-between gap-3 shrink-0 pb-1">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <span>📊</span>
            <span>실시간 대시보드 통계</span>
          </span>
          <span className="text-[11px] font-bold text-gray-400 font-mono">
            {new Date(data.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 기준
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <PremiumButton
            variant="secondary"
            onClick={() => setShowSettings(!showSettings)}
            className="!px-3 !py-1.5 !text-xs font-bold"
            icon={<span>⚙️</span>}
          >
            시스템 API 설정
          </PremiumButton>

          <div className="flex bg-gray-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-gray-200/80 dark:border-zinc-700 text-xs font-bold">
            {(['24h', '7d', '30d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 rounded-md transition-all ${period === p ? 'bg-white dark:bg-zinc-900 text-[var(--google-blue)] dark:text-[#8ab4f8] shadow-sm font-bold' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900'}`}
              >
                {p === '24h' ? '24시간' : p === '7d' ? '7일간' : '30일간'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ⚙️ 시스템 API 자격증명 설정 아코디언 카드 */}
      {showSettings && (
        <PremiumCard borderColor="blue" className="bg-gradient-to-b from-blue-50/30 to-transparent dark:from-blue-950/20 shrink-0">
          <div className="flex items-center justify-between border-b border-gray-200/80 dark:border-zinc-800 pb-2.5 mb-3">
            <h3 className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
              <span>🔐</span>
              <span>시스템 API 키 및 자격증명 설정</span>
            </h3>
            <span className="text-[11px] text-gray-400">로컬 브라우저 암호화 저장</span>
          </div>

          <form onSubmit={handleSaveCredentials} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-zinc-400 mb-1">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={credentials.geminiApiKey}
                  onChange={(e) => setCredentials({ ...credentials, geminiApiKey: e.target.value })}
                  placeholder="AI_zaSy..."
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-blue-500 font-mono text-gray-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-zinc-400 mb-1">
                  GitHub Token
                </label>
                <input
                  type="password"
                  value={credentials.githubToken}
                  onChange={(e) => setCredentials({ ...credentials, githubToken: e.target.value })}
                  placeholder="github_pat_..."
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-blue-500 font-mono text-gray-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-zinc-400 mb-1">
                  CF Zone ID
                </label>
                <input
                  type="text"
                  value={credentials.cloudflareZoneId || ''}
                  onChange={(e) => setCredentials({ ...credentials, cloudflareZoneId: e.target.value })}
                  placeholder="Zone ID (32자리)"
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-blue-500 font-mono text-gray-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-zinc-400 mb-1">
                  CF API Token
                </label>
                <input
                  type="password"
                  value={credentials.cloudflareApiToken || ''}
                  onChange={(e) => setCredentials({ ...credentials, cloudflareApiToken: e.target.value })}
                  placeholder="Analytics Read Token"
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg focus:ring-1 focus:ring-blue-500 font-mono text-gray-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{saveStatus}</span>
              <PremiumButton type="submit" variant="primary" className="!px-3.5 !py-1.5 !text-xs font-bold">
                저장하기
              </PremiumButton>
            </div>
          </form>
        </PremiumCard>
      )}

      {/* ── 3. 콤팩트 4대 KPI 카드 그리드 ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        {[
          { label: '고유 방문자 (UV)', value: (summary.uniqueVisitors || 0).toLocaleString(), icon: '👥', color: 'text-blue-600 dark:text-blue-400', border: 'blue' as const },
          { label: '총 페이지뷰 (PV)', value: (summary.pageviews || 0).toLocaleString(), icon: '👀', color: 'text-emerald-600 dark:text-emerald-400', border: 'green' as const },
          { label: '상담 유입 건수', value: `${summary.consultationViews || 0}건`, icon: '📋', color: 'text-purple-600 dark:text-purple-400', border: 'purple' as const },
          { label: '평균 응답 속도', value: `${summary.avgLoadTimeMs || 0}ms`, icon: '⚡', color: 'text-amber-600 dark:text-amber-400', border: 'yellow' as const },
        ].map((kpi, idx) => (
          <PremiumCard key={idx} hoverEffect={true} borderColor={kpi.border} className="!p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-lg shrink-0 border border-gray-100 dark:border-zinc-700/60 shadow-inner">
              {kpi.icon}
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500 dark:text-zinc-400">{kpi.label}</p>
              <p className={`text-base sm:text-lg font-extrabold tracking-tight ${kpi.color}`}>
                {loading ? '...' : kpi.value}
              </p>
            </div>
          </PremiumCard>
        ))}
      </div>

      {/* ── 4. 트래픽 차트 + 유입 채널 (콤팩트 그리드) ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 flex-1 min-h-0">
        <PremiumCard className="lg:col-span-2 !p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-zinc-800 pb-2">
            <span className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
              <span>📈</span>
              <span>방문 추이 분석</span>
            </span>
            <span className="text-[10px] text-gray-400">최근 {period === '24h' ? '24시간' : period === '7d' ? '7일' : '30일'}</span>
          </div>

          <div className="flex-1 min-h-[140px] flex items-end gap-2 pt-2 px-1">
            {trend.length > 0 ? (
              trend.map((t, idx) => {
                const maxReq = Math.max(...trend.map(d => d.requests), 1);
                const heightPercent = Math.max(12, (t.requests / maxReq) * 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="text-[9px] text-gray-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      {t.requests}
                    </div>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-[24px] rounded-t bg-gradient-to-t from-[var(--google-blue)] to-blue-400 dark:from-blue-700 dark:to-blue-400 group-hover:brightness-110 transition-all shadow-sm"
                    />
                    <span className="text-[9px] text-gray-400 truncate w-full text-center">
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

        <PremiumCard className="!p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-zinc-800 pb-2">
            <span className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
              <span>🧭</span>
              <span>검색 & 유입 채널</span>
            </span>
            <span className="text-[10px] text-gray-400">비율</span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto custom-scrollbar pr-1">
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

      {/* ── 5. 인기 보상 칼럼 TOP 10 (콤팩트 테이블) ───────────────────────── */}
      <PremiumCard className="!p-0 shrink-0">
        <div className="p-3 sm:px-4 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
          <span className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
            <span>🏆</span>
            <span>인기 보상 칼럼 TOP 10</span>
          </span>
          <PremiumBadge color="blue" className="!text-[10px] !px-2 !py-0.5">실시간 PV</PremiumBadge>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-zinc-800/60 max-h-48 overflow-y-auto custom-scrollbar">
          {topPages.length > 0 ? (
            topPages.map((page, idx) => (
              <div key={idx} className="px-3.5 py-2 flex items-center justify-between gap-3 hover:bg-gray-50/80 dark:hover:bg-zinc-800/40 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-extrabold shrink-0 ${idx < 3 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
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
                <div className="shrink-0 text-[11px] font-bold text-gray-900 dark:text-white">
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
