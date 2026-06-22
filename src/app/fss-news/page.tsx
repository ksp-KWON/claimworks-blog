'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface FssNewsItem {
  id: string;
  category: 'alert' | 'case' | 'tip' | 'press';
  title: string;
  date: string;
  content: string;
  summary: string[];
  comment: string;
  keywords: string[];
  relColumn: string;
}

export default function FssNewsPage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'alert' | 'case' | 'tip' | 'press'>('all');
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<FssNewsItem[]>([]);
  const [latestAlert, setLatestAlert] = useState<FssNewsItem | null>(null);
  const [error, setError] = useState('');

  // 실시간 호출을 시뮬레이션하고 실제 API 데이터를 받아옵니다.
  const fetchFssData = async (searchQuery: string, categoryTab: string) => {
    setLoading(true);
    setError('');
    
    // 최소 로딩 대기 시간 (0.8초)을 걸어 정부 서버 실시간 수집 로딩창 피드백을 구현합니다.
    const delayPromise = new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      const url = `/api/fss-news?query=${encodeURIComponent(searchQuery)}&type=${categoryTab}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`금감원 실시간 데이터 연동 중 통신 오류가 발생했습니다. (HTTP ${res.status})`);
      }
      
      const data: FssNewsItem[] = await res.json();
      
      await delayPromise; // 최소 로딩 시간 보장
      
      setResults(data);
      
      // 최상단 경보 배너용 최신 alert 데이터 추출
      if (categoryTab === 'all' || categoryTab === 'alert') {
        const alerts = data.filter(item => item.category === 'alert');
        if (alerts.length > 0) {
          setLatestAlert(alerts[0]);
        }
      }
    } catch (e: any) {
      await delayPromise;
      setError(e.message || '데이터를 가져오는 중 알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 마운트 시 최초 1회 호출
  useEffect(() => {
    fetchFssData('', 'all');
  }, []);

  // 탭 변경 시 호출
  const handleTabChange = (tab: 'all' | 'alert' | 'case' | 'tip' | 'press') => {
    setActiveTab(tab);
    fetchFssData(query, tab);
  };

  // 검색 시 호출
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFssData(query, activeTab);
  };

  const getKakaoLink = (itemTitle: string) => {
    const text = `안녕하세요 대표님, 보상스쿨 금감원 소비자보호센터에서 [${itemTitle}] 글을 보고 무료 손해사정 상담을 요청합니다.`;
    return `https://open.kakao.com/o/sWeszp7?text=${encodeURIComponent(text)}`;
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'alert':
        return 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-800/30';
      case 'case':
        return 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/30';
      case 'tip':
        return 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-200/50 dark:border-green-800/30';
      case 'press':
        return 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30';
      default:
        return 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'alert':
        return '🚨 소비자경보';
      case 'case':
        return '⚖️ 분쟁조정사례';
      case 'tip':
        return '💡 금융꿀팁';
      case 'press':
        return '📢 보도자료';
      default:
        return '일반';
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* 🚨 실시간 소비자 이슈 브리핑 상단 띠 배너 */}
      {latestAlert && (
        <div className="bg-red-600 text-white px-4 py-3 rounded-2xl flex items-center justify-between flex-wrap gap-3 shadow-md animate-pulse">
          <div className="flex items-center gap-2.5">
            <span className="text-lg shrink-0">🚨</span>
            <div className="text-xs sm:text-sm font-extrabold tracking-tight">
              <span className="underline decoration-wavy mr-1.5">[긴급 소비자경보]</span>
              {latestAlert.title}
            </div>
          </div>
          <button 
            onClick={() => {
              const el = document.getElementById(latestAlert.id);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="text-[10px] font-black uppercase tracking-wider bg-white text-red-600 px-2.5 py-1 rounded-lg border border-white hover:bg-red-50 transition-colors cursor-pointer"
          >
            경보보기
          </button>
        </div>
      )}

      {/* 헤더 타이틀 */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202124] dark:text-[#e8eaed] tracking-tight">
          보상스쿨 <span className="bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">금감원 소비자보호센터</span>
        </h1>
        <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-xl mx-auto leading-relaxed font-medium">
          금융감독원이 발표하는 실시간 소비자 경보, 민원 분쟁사례, 실용 금융꿀팁, 약관 보도자료를 연동하여 제공합니다. 보험사 부당 지급 거절에 현명하게 대처해 보세요.
        </p>
      </div>

      {/* 검색 박스 영역 */}
      <div className="bg-white dark:bg-[#202124] p-5 sm:p-7 rounded-3xl border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-col sm:flex-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색어를 입력해 보세요 (예: 도수치료, 백내장, 단체보험)"
            className="flex-1 px-4 py-3 sm:py-3.5 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/2 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:text-white text-sm font-medium shadow-inner"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-red-500 to-amber-500 hover:opacity-90 text-white font-bold text-sm tracking-wide shadow-md transition-opacity cursor-pointer disabled:opacity-50"
          >
            {loading ? '연동 중...' : '실시간 조회'}
          </button>
        </form>

        {/* 탭 카테고리 메뉴 */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-gray-100 dark:border-white/5">
          {[
            { id: 'all', label: '전체보기' },
            { id: 'alert', label: '🚨 소비자경보' },
            { id: 'case', label: '⚖️ 분쟁사례' },
            { id: 'tip', label: '💡 금융꿀팁' },
            { id: 'press', label: '📢 보도자료' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 실시간 로딩 피드백 안내창 */}
      {loading && (
        <div className="bg-white dark:bg-[#202124] rounded-3xl py-14 px-6 text-center border border-gray-100 dark:border-white/5 shadow-sm space-y-4 animate-pulse">
          <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-sm font-bold text-[#202124] dark:text-[#e8eaed]">🏛️ 금융감독원 공식 실시간 데이터를 연동 분석 중입니다...</div>
          <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] max-w-xs mx-auto leading-relaxed">
            금감원 공공 데이터베이스 서버와 API 중계를 통해 최신 보상 지침 및 분쟁 기준을 직접 호출하고 있습니다.
          </p>
        </div>
      )}

      {/* 에러 및 빈 화면 피드백 */}
      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-3xl py-10 px-5 text-center font-bold text-sm">
          {error}
        </div>
      )}

      {!loading && results.length === 0 && !error && (
        <div className="bg-white dark:bg-[#202124] rounded-3xl py-14 px-5 border border-gray-100 dark:border-white/5 text-center text-sm font-bold text-gray-500 dark:text-gray-400">
          검색된 금감원 소비자보호 데이터가 없습니다. 다른 검색어를 입력해 보세요.
        </div>
      )}

      {/* 데이터 결과 카드 목록 */}
      {!loading && results.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-base sm:text-lg font-bold text-[#202124] dark:text-[#e8eaed] border-b border-gray-100 dark:border-white/5 pb-2">
            조회된 금감원 보상 데이터 총 <span className="text-amber-500">{results.length}</span>건
          </h2>

          <div className="space-y-6">
            {results.map((item) => (
              <div
                key={item.id}
                id={item.id}
                className="bg-white dark:bg-[#202124] p-5 sm:p-7 rounded-3xl border border-gray-100 dark:border-white/5 shadow-md hover:shadow-lg transition-all duration-300 space-y-4 scroll-mt-24"
              >
                {/* 헤더 (카테고리 및 날짜) */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${getCategoryBadgeClass(item.category)}`}>
                    {getCategoryName(item.category)}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">{item.date}</span>
                </div>

                {/* 제목 */}
                <h3 className="text-base sm:text-lg font-extrabold text-[#202124] dark:text-[#e8eaed] leading-snug">
                  {item.title}
                </h3>

                {/* 원문 본문 */}
                <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed font-medium">
                  {item.content}
                </p>

                {/* 🧠 AI 요약 박스 */}
                <div className="bg-gray-50 dark:bg-white/2 p-4 rounded-2xl border border-gray-150/50 dark:border-white/2 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                    <span className="text-sm">🧠</span>
                    AI 핵심 3줄 요약
                  </div>
                  <ul className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium space-y-1.5 list-disc pl-4">
                    {item.summary.map((sumLine, idx) => (
                      <li key={idx}>{sumLine}</li>
                    ))}
                  </ul>
                </div>

                {/* 👨‍🏫 손해사정사 전문 실무 코멘트 */}
                <div className="bg-[#fcf8e3]/30 dark:bg-[#fcf8e3]/5 p-4 rounded-2xl border border-[#faebcc]/50 dark:border-[#faebcc]/10 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#8a6d3b] dark:text-[#c4a86f]">
                    <span className="text-sm">👨‍🏫</span>
                    보상스쿨 손해사정사 실무 코멘트
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium pl-1">
                    {item.comment}
                  </p>
                </div>

                {/* 해시태그 목록 */}
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {item.keywords.map((kw, idx) => (
                    <span key={idx} className="text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-white/2 px-2 py-0.5 rounded-md">
                      #{kw}
                    </span>
                  ))}
                </div>

                {/* 액션 버튼 그룹 */}
                <div className="flex items-center gap-2.5 pt-3 border-t border-gray-50 dark:border-white/2 flex-wrap sm:flex-nowrap">
                  <Link 
                    href={item.relColumn}
                    className="flex-1 text-center py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-[#202124] dark:text-[#e8eaed] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    📖 관련 분석 칼럼 읽기
                  </Link>
                  <a 
                    href={getKakaoLink(item.title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-2.5 bg-amber-400 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    💬 내 보상 무료 검토 신청 (카톡)
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
