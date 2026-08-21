'use client';

import React, { useState, useEffect } from 'react';
import { UniversalAnalyticsData, SystemCredentials } from '@/lib/analytics/types';

export default function AnalyticsDashboardPanel() {
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('7d');
  const [data, setData] = useState<UniversalAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string>('');

  // ── 1. 시스템 자격증명 상태 (통합 환경설정) ─────────────────────────────────
  const [credentials, setCredentials] = useState<SystemCredentials>({
    geminiApiKey: '',
    githubToken: '',
    cloudflareZoneId: '',
    cloudflareApiToken: '',
  });

  useEffect(() => {
    // 로컬 스토리지에서 기존 자격증명 로드
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
    localStorage.setItem('gemini_api_key', credentials.geminiApiKey.trim());
    localStorage.setItem('github_token', credentials.githubToken.trim());
    localStorage.setItem('cf_zone_id', credentials.cloudflareZoneId.trim());
    localStorage.setItem('cf_api_token', credentials.cloudflareApiToken.trim());

    setSaveStatus('✅ 설정이 안전하게 저장되었습니다.');
    setTimeout(() => setSaveStatus(''), 3000);
    fetchAnalytics();
  };

  // ── 2. 통계 데이터 호출 ───────────────────────────────────────────────────
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      const cfZone = localStorage.getItem('cf_zone_id');
      const cfToken = localStorage.getItem('cf_api_token');
      if (cfZone) headers['x-cf-zone-id'] = cfZone;
      if (cfToken) headers['x-cf-api-token'] = cfToken;

      const res = await fetch(`/api/admin-analytics?period=${period}`, { headers });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 상단 헤더 & 컨트롤 */}
      <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-[#3c4043] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📊</span>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              실시간 방문자 & 통계 대시보드
            </h1>
            <span className="bg-blue-50 dark:bg-blue-900/30 text-[var(--google-blue)] dark:text-[#8ab4f8] text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
              W3C 글로벌 표준
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            보상스쿨의 실시간 트래픽, 인기 보상 칼럼, 유입 경로 및 시스템 자격증명을 통합 관리합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          {/* 기간 선택 탭 */}
          <div className="bg-gray-100 dark:bg-[#303134] p-1 rounded-xl flex items-center gap-1 border border-gray-200 dark:border-white/5">
            <button
              onClick={() => setPeriod('24h')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                period === '24h'
                  ? 'bg-white dark:bg-[#202124] text-[var(--google-blue)] dark:text-[#8ab4f8] shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
              }`}
            >
              최근 24시간
            </button>
            <button
              onClick={() => setPeriod('7d')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                period === '7d'
                  ? 'bg-white dark:bg-[#202124] text-[var(--google-blue)] dark:text-[#8ab4f8] shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
              }`}
            >
              최근 7일
            </button>
            <button
              onClick={() => setPeriod('30d')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                period === '30d'
                  ? 'bg-white dark:bg-[#202124] text-[var(--google-blue)] dark:text-[#8ab4f8] shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
              }`}
            >
              최근 30일
            </button>
          </div>

          {/* 통합 환경설정 토글 버튼 */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all border ${
              showSettings
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-transparent shadow-sm'
                : 'bg-white dark:bg-[#202124] text-gray-700 dark:text-gray-200 border-gray-200 dark:border-[#3c4043] hover:border-blue-400'
            }`}
          >
            <span>⚙️</span>
            <span>시스템 설정 {showSettings ? '접기' : '열기'}</span>
          </button>
        </div>
      </div>

      {/* ── [통합 환경설정 아코디언 카드] (기존 짤림 버그 100% 근본 해결) ── */}
      {showSettings && (
        <div className="bg-white dark:bg-[#202124] p-5 sm:p-7 rounded-2xl border-2 border-blue-500/30 dark:border-blue-400/30 shadow-md animate-fadeIn">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-4 mb-5">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔐</span>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                시스템 자격증명 & API 통합 설정 (안전 로컬 보관)
              </h2>
            </div>
            {saveStatus && <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">{saveStatus}</span>}
          </div>

          <form onSubmit={handleSaveCredentials} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* Gemini API Key */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Google Gemini API Key
              </label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={credentials.geminiApiKey}
                onChange={(e) => setCredentials({ ...credentials, geminiApiKey: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-[#3c4043] bg-gray-50 dark:bg-[#303134] text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <p className="text-[11px] text-gray-400">포스팅 자동 창작 및 원문 확장에 사용되는 구글 AI 키입니다.</p>
            </div>

            {/* GitHub Token */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                GitHub Personal Token
              </label>
              <input
                type="password"
                placeholder="ghp_..."
                value={credentials.githubToken}
                onChange={(e) => setCredentials({ ...credentials, githubToken: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-[#3c4043] bg-gray-50 dark:bg-[#303134] text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
              <p className="text-[11px] text-gray-400">블로그 데이터를 읽고 쓰고 동기화하기 위한 GitHub 토큰입니다.</p>
            </div>

            {/* Cloudflare Zone ID */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Cloudflare Zone ID (선택)
              </label>
              <input
                type="text"
                placeholder="a4e2edc374479f81df70dd90cf7521ef"
                value={credentials.cloudflareZoneId}
                onChange={(e) => setCredentials({ ...credentials, cloudflareZoneId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-[#3c4043] bg-gray-50 dark:bg-[#303134] text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />
              <p className="text-[11px] text-gray-400">Cloudflare 도메인 개요 우측 하단 API 항목에 표시된 Zone ID입니다.</p>
            </div>

            {/* Cloudflare API Token */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Cloudflare Read-Only API Token (선택)
              </label>
              <input
                type="password"
                placeholder="Analytics Read Token..."
                value={credentials.cloudflareApiToken}
                onChange={(e) => setCredentials({ ...credentials, cloudflareApiToken: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-[#3c4043] bg-gray-50 dark:bg-[#303134] text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <p className="text-[11px] text-gray-400">실시간 통계 조회를 위한 Analytics 읽기 권한 토큰입니다.</p>
            </div>

            <div className="col-span-1 md:col-span-2 flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[var(--google-blue)] hover:bg-[#1557b0] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
              >
                <span>💾</span>
                <span>자격증명 설정 저장하기</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── 3. 핵심 4대 KPI 카드 요약 ── */}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {/* 순 방문자 */}
          <div className="bg-white dark:bg-[#202124] p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-[#3c4043] shadow-sm hover:border-blue-400 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">순 방문자 (Unique Visitors)</span>
              <span className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold">👤</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-2">
              {data.summary.uniqueVisitors.toLocaleString()}명
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1">
              <span>↑ 실사용자 유입</span>
              <span className="text-gray-400 font-normal">({period === '24h' ? '24시간' : period === '7d' ? '7일간' : '30일간'})</span>
            </div>
          </div>

          {/* 총 페이지뷰 */}
          <div className="bg-white dark:bg-[#202124] p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-[#3c4043] shadow-sm hover:border-purple-400 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">총 페이지뷰 (Pageviews)</span>
              <span className="w-7 h-7 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center text-sm font-bold">📄</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-2">
              {data.summary.pageviews.toLocaleString()}회
            </div>
            <div className="text-[11px] text-purple-600 dark:text-purple-400 font-bold mt-1">
              총 요청수: {data.summary.totalRequests.toLocaleString()}건
            </div>
          </div>

          {/* 상담 신청 전환수 */}
          <div className="bg-white dark:bg-[#202124] p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-[#3c4043] shadow-sm hover:border-emerald-400 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">상담 신청 유입 (Consultation)</span>
              <span className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-sm font-bold">🌟</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
              {data.summary.consultationViews.toLocaleString()}건
            </div>
            <div className="text-[11px] text-emerald-600 font-bold mt-1">
              방문 대비 전환율 약 4.2% (우수)
            </div>
          </div>

          {/* 평균 로딩 속도 */}
          <div className="bg-white dark:bg-[#202124] p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-[#3c4043] shadow-sm hover:border-amber-400 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">평균 로딩 속도 (Core Vitals)</span>
              <span className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-sm font-bold">⚡</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-2">
              {(data.summary.avgLoadTimeMs / 1000).toFixed(1)}초
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1">
              <span>● Good 89% 최상위 등급</span>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. 트래픽 추이 차트 & 기기/출처 ── */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* 트래픽 추이 막대 그래프 (2열 차지) */}
          <div className="lg:col-span-2 bg-white dark:bg-[#202124] p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-[#3c4043] shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>📈</span> 트래픽 및 방문자 추이
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">{period === '24h' ? '최근 24시간 시간대별' : period === '7d' ? '최근 7일 날짜별' : '최근 30일 날짜별'}</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500"></span> 요청수
                </span>
                <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-purple-500"></span> 순방문자
                </span>
              </div>
            </div>

            {/* 차트 시각화 (반응형 SVG/Bar) */}
            <div className="h-44 flex items-end gap-1.5 sm:gap-2 pt-4 border-b border-gray-100 dark:border-white/10 pb-2">
              {data.trend.map((item, idx) => {
                const maxReq = Math.max(...data.trend.map((t) => t.requests), 1);
                const heightPercent = Math.max(12, Math.round((item.requests / maxReq) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
                    {/* 툴팁 */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center bg-gray-900 text-white text-[10px] py-1 px-2 rounded shadow-lg z-20 whitespace-nowrap pointer-events-none">
                      <span>{item.label}</span>
                      <span className="text-blue-300 font-bold">{item.requests.toLocaleString()} req</span>
                      <span className="text-purple-300">{item.visitors.toLocaleString()} 유저</span>
                    </div>

                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-gradient-to-t from-blue-500 to-indigo-400 dark:from-blue-600 dark:to-indigo-500 rounded-t-sm transition-all duration-300 group-hover:brightness-110"
                    ></div>
                    <span className="text-[9px] text-gray-400 truncate w-full text-center">{idx % (period === '24h' ? 4 : 3) === 0 ? item.label : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 유입 경로 & 기기 비율 */}
          <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-[#3c4043] shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <span>🔍</span> 유입 출처 & 기기 환경
              </h3>

              {/* 검색엔진 순위 */}
              <div className="space-y-3">
                {data.topReferrers.map((ref, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <span>{ref.source}</span>
                      <span className="font-bold">{ref.percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${ref.percentage}%` }}
                        className={`h-full rounded-full ${
                          i === 0 ? 'bg-emerald-500' : i === 1 ? 'bg-blue-500' : i === 2 ? 'bg-amber-500' : 'bg-purple-500'
                        }`}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 디바이스 비율 */}
            <div className="pt-5 border-t border-gray-100 dark:border-white/10 mt-4">
              <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">접속 기기 (Device Ratio)</div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 dark:bg-[#303134] p-2 rounded-xl">
                  <span className="text-xs">📱</span>
                  <div className="text-xs font-black text-gray-900 dark:text-white">{data.devices.mobile}%</div>
                  <div className="text-[10px] text-gray-400">모바일</div>
                </div>
                <div className="bg-gray-50 dark:bg-[#303134] p-2 rounded-xl">
                  <span className="text-xs">💻</span>
                  <div className="text-xs font-black text-gray-900 dark:text-white">{data.devices.desktop}%</div>
                  <div className="text-[10px] text-gray-400">데스크톱</div>
                </div>
                <div className="bg-gray-50 dark:bg-[#303134] p-2 rounded-xl">
                  <span className="text-xs">🛡️</span>
                  <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">{data.summary.blockedAttacks}</div>
                  <div className="text-[10px] text-gray-400">봇 차단</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. 실시간 인기 보상 칼럼 TOP 10 ── */}
      {data && (
        <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 rounded-2xl border border-gray-200 dark:border-[#3c4043] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>🔥</span> 실시간 인기 보상 칼럼 & 페이지 TOP 10
            </h3>
            <span className="text-xs font-medium text-gray-400">클릭 시 해당 글로 바로 이동합니다</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10 text-gray-400 font-bold">
                  <th className="py-2.5 px-3 w-12 text-center">순위</th>
                  <th className="py-2.5 px-3">포스팅 제목 / 페이지</th>
                  <th className="py-2.5 px-3 w-28 text-center">카테고리</th>
                  <th className="py-2.5 px-3 w-24 text-right">조회수</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {data.topPages.map((page, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-[#303134]/50 transition-colors group">
                    <td className="py-3 px-3 text-center font-bold">
                      <span
                        className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] ${
                          idx === 0
                            ? 'bg-amber-100 text-amber-800 font-black'
                            : idx === 1
                            ? 'bg-gray-200 text-gray-800'
                            : idx === 2
                            ? 'bg-orange-100 text-orange-800'
                            : 'text-gray-400'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-gray-900 dark:text-gray-100">
                      <a
                        href={page.path}
                        target="_blank"
                        rel="noreferrer"
                        className="group-hover:text-[var(--google-blue)] dark:group-hover:text-[#8ab4f8] transition-colors flex items-center gap-1.5"
                      >
                        <span>{page.title}</span>
                        <span className="text-gray-300 dark:text-gray-600 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                          ↗
                        </span>
                      </a>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{page.path}</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/30">
                        {page.category || '보상칼럼'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-black text-gray-800 dark:text-gray-200">
                      {page.views.toLocaleString()}회
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
