'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AiCommentBox from '@/components/AiCommentBox';

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
  fullContent?: string;
  officialUrl?: string;
}

import { cleanFssText } from '@/lib/cleaners';


export default function FssNewsPage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'alert' | 'case' | 'tip' | 'press'>('all');
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<FssNewsItem[]>([]);
  const [latestAlert, setLatestAlert] = useState<FssNewsItem | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [blogPosts, setBlogPosts] = useState<any[]>([]);

  // 1. 금감원 뉴스/소비자 데이터 조회
  const fetchFssData = async (searchQuery: string, categoryTab: string) => {
    setLoading(true);
    setError('');
    
    try {
      const url = `/api/fss-news?query=${encodeURIComponent(searchQuery)}&type=${categoryTab}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`금감원 실시간 데이터 연동 중 통신 오류가 발생했습니다. (HTTP ${res.status})`);
      }
      
      const data: FssNewsItem[] = await res.json();
      setResults(data);
      
      if (categoryTab === 'all' || categoryTab === 'alert') {
        const alerts = data.filter(item => item.category === 'alert');
        if (alerts.length > 0) {
          setLatestAlert(alerts[0]);
        }
      }
    } catch (e: any) {
      setError(e.message || '데이터를 가져오는 중 알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 마운트 시 최초 호출
  useEffect(() => {
    fetchFssData('', 'all');

    // API를 통해 포스트 데이터 불러오기
    fetch('/api/posts')
      .then(res => res.ok ? res.json() : [])
      .then(data => setBlogPosts(data))
      .catch(err => console.warn('블로그 포스트 연동 로드 실패:', err));
  }, []);

  // 금감원 자료에 해당되는 보상스쿨의 전문 해설글 자동 매핑 알고리즘
  const getRelatedBlogPostsForFss = (item: FssNewsItem) => {
    if (blogPosts.length === 0) {
      return item.relColumn ? [{ slug: item.relColumn.replace('/blog/', ''), title: item.title }] : [];
    }
    
    let matchPosts: any[] = [];
    
    // 1. relColumn에 지정된 포스트 매핑
    if (item.relColumn) {
      const slug = item.relColumn.replace('/blog/', '');
      const matched = blogPosts.find(post => post.slug === slug);
      if (matched) {
        matchPosts.push(matched);
      }
    }
    
    // 2. 키워드 기반 추가 포스트 매핑 (최대 2건 제한)
    const titleLower = item.title.toLowerCase();
    const contentLower = item.content.toLowerCase();
    
    const extra = blogPosts.filter(post => {
      if (matchPosts.some(m => m.slug === post.slug)) return false;
      
      const postTitleLower = post.title.toLowerCase();
      return item.keywords.some(kw => {
        const k = kw.toLowerCase();
        return (titleLower.includes(k) || contentLower.includes(k)) && postTitleLower.includes(k);
      });
    });
    
    matchPosts = [...matchPosts, ...extra];
    return matchPosts.slice(0, 2);
  };

  // 메인 탭 변경 핸들러
  const handleTabChange = (tab: 'all' | 'alert' | 'case' | 'tip' | 'press') => {
    setActiveTab(tab);
    fetchFssData(query, tab);
  };

  // 검색 폼 제출 핸들러
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFssData(query, activeTab);
  };

  const getKakaoLink = (itemTitle: string) => {
    const text = `안녕하세요 대표님, 보상스쿨 금감원 소비자보호센터에서 [${itemTitle}] 정보를 보고 무료 손해사정 상담을 요청합니다.`;
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
        return '⚖️ 분쟁사례';
      case 'tip':
        return '💡 금융꿀팁';
      case 'press':
        return '📢 보도자료';
      default:
        return '일반';
    }
  };

  const getSummaryBoxTitle = (category: string) => {
    switch (category) {
      case 'alert':
        return '🚨 소비자경보 핵심 가이드';
      case 'case':
        return '⚖️ 분쟁사례 핵심 요지';
      case 'tip':
        return '💡 실용 금융꿀팁 요약';
      case 'press':
      default:
        return '📢 금감원 핵심 보도 요약';
    }
  };

  return (
    <>
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-[#202124] rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:border-red-500 hover:shadow-[0_16px_50px_rgba(239,68,68,0.2)] transition-all duration-300 overflow-hidden">
      {/* 🚨 실시간 소비자 이슈 브리핑 상단 띠 배너 */}
      {latestAlert && (
        <div className="bg-red-600 text-white px-5 py-3 flex items-center justify-between flex-wrap gap-3 animate-pulse">
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
            className="text-[10px] font-black uppercase tracking-wider bg-white text-red-600 px-2.5 py-1 rounded-none border border-white hover:bg-red-50 transition-colors cursor-pointer"
          >
            경보보기
          </button>
        </div>
      )}

      <div className="p-6 sm:p-10 space-y-8">
      {/* 헤더 타이틀 */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202124] dark:text-[#e8eaed] tracking-tight">
          보상스쿨 <span className="bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">금감원 소비자보호센터</span>
        </h1>
        <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-xl mx-auto leading-relaxed font-medium">
          금융감독원 공식 API 연동을 통해 소비자 경보, 민원 분쟁사례, 금융꿀팁, 실시간 금융상품 한눈에 비교공시 서비스를 하나의 통합 대시보드에서 제공합니다.
        </p>
      </div>

      {/* 검색 박스 영역 */}
      <div className="space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-col sm:flex-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색어를 입력해 보세요 (예: 도수치료, 백내장, 단체보험)"
            className="flex-1 px-4 py-3 sm:py-3.5 rounded-none border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/2 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:text-white text-sm font-medium shadow-inner"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 sm:py-3.5 rounded-none bg-gradient-to-r from-red-500 to-amber-500 hover:opacity-90 text-white font-bold text-sm tracking-wide shadow-md transition-opacity cursor-pointer disabled:opacity-50"
          >
            {loading ? '연동 중...' : '실시간 조회'}
          </button>
        </form>

        {/* 탭 카테고리 메뉴 */}
        <div className="flex w-full gap-1.5 sm:gap-2 mt-5 pt-4 border-t border-gray-100 dark:border-white/5">
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
              className={`flex-1 min-w-0 text-center py-2 sm:py-2.5 rounded-none text-[10px] sm:text-xs font-bold transition-all cursor-pointer truncate px-0.5 ${
                activeTab === tab.id
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm font-black'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>

      </div>
      </div>

      {/* 실시간 로딩 피드백 안내창 */}
      {loading && (
        <div className="bg-white dark:bg-[#202124] rounded-none py-14 px-6 text-center border border-gray-100 dark:border-white/5 shadow-sm space-y-4 animate-pulse">
          <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-sm font-bold text-[#202124] dark:text-[#e8eaed]">🏛️ 금융감독원 공식 실시간 데이터를 연동 분석 중입니다...</div>
          <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] max-w-xs mx-auto leading-relaxed">
            금감원 공공 데이터베이스 서버와 API 중계를 통해 최신 보상 지침 및 비교 공시 데이터를 직접 호출하고 있습니다.
          </p>
        </div>
      )}

      {/* 에러 및 피드백 */}
      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-none py-10 px-5 text-center font-bold text-sm">
          {error}
        </div>
      )}

      {/* 카테고리 1: 뉴스 / 분쟁 / 꿀팁 데이터 카드 */}
      {!loading && (
        <>
          {results.length === 0 && !error && (
            <div className="bg-white dark:bg-[#202124] rounded-none py-14 px-5 border border-gray-100 dark:border-white/5 text-center text-sm font-bold text-gray-500 dark:text-gray-400">
              조회된 데이터가 없습니다. 다른 검색어를 입력해 보세요.
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-base sm:text-lg font-bold text-[#202124] dark:text-[#e8eaed] border-b border-gray-100 dark:border-white/5 pb-2">
                조회된 금감원 보상 데이터 총 <span className="text-amber-500">{results.length}</span>건
              </h2>

              <div className="space-y-6">
                {results.map((item) => (
                  <div
                    key={item.id}
                    id={item.id}
                    className="bg-white dark:bg-[#202124] p-5 sm:p-7 rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:shadow-[0_16px_50px_rgba(255,0,0,0.2)] hover:border-current transition-all duration-300 space-y-4 scroll-mt-24"
                  >
                    {/* 헤더 */}
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

                    {/* 핵심 요약 가이드 (기존 요약 박스 통합 및 지저분한 프리뷰 텍스트 삭제) */}
                    <div className="bg-gray-50 dark:bg-white/2 p-4 rounded-none border border-gray-150/50 dark:border-white/2 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                        <span className="text-sm">📢</span>
                        {getSummaryBoxTitle(item.category)}
                      </div>
                      <ul className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium space-y-1.5 list-disc pl-4">
                        {item.summary.map((sumLine, idx) => (
                          <li key={idx}>{sumLine}</li>
                        ))}
                      </ul>
                    </div>

                    {/* 실무 코멘트 (통합 AI 컴포넌트) */}
                    <AiCommentBox 
                      sourceText={[item.title, item.content, item.fullContent || ''].join('\n\n').slice(0, 4000)}
                      type="fss"
                    />

                    {/* 태그 */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {item.keywords.map((kw, idx) => (
                        <span key={idx} className="text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-white/2 px-2 py-0.5 rounded-none">
                          #{kw}
                        </span>
                      ))}
                    </div>

                    {/* HWP 파일 무설치 전문보기 및 공식 사이트 새창 이동 (좌우 50% 균등 배치) */}
                    <div className="flex gap-2 pt-2 w-full">
                      {item.fullContent && (
                        <button
                          onClick={() => setExpandedCardId(expandedCardId === item.id ? null : item.id)}
                          className="flex-1 px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 text-gray-750 dark:text-gray-300 border border-gray-250 dark:border-white/5 rounded-none text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <span>📄</span>
                          {expandedCardId === item.id ? '보도/결정문 전문 닫기' : '전문 확인 (HWP 변환)'}
                        </button>
                      )}
                      {item.officialUrl && (
                        <a
                          href={item.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 border border-gray-250 dark:border-white/5 rounded-none text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm text-center"
                        >
                          <span>🔗</span> 금감원 원문 새창보기
                        </a>
                      )}
                    </div>

                    {/* 전문 텍스트 노출 영역 */}
                    {expandedCardId === item.id && item.fullContent && (
                      <div className="bg-gray-50/50 dark:bg-[#303134]/30 p-4 sm:p-5 rounded-none border border-gray-200 dark:border-white/5 text-xs text-gray-800 dark:text-gray-200 leading-relaxed space-y-3 whitespace-pre-wrap font-medium animate-in fade-in slide-in-from-top-2 duration-200 shadow-inner">
                        <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-white/5 pb-2 mb-2 flex justify-between">
                          <span>📄 금융감독원 보도문/결정문 전문 (한글 HWP 대체 텍스트)</span>
                          <span>HWP 뷰어 무설치 열람 중</span>
                        </div>
                        {cleanFssText(item.fullContent)}
                      </div>
                    )}

                     {/* 액션 */}
                    <div className="flex items-center gap-2.5 pt-3 border-t border-gray-50 dark:border-white/2 flex-wrap sm:flex-nowrap">
                      {(() => {
                        const related = getRelatedBlogPostsForFss(item);
                        if (related.length > 0) {
                          return (
                            <Link 
                              href={`/blog/${related[0].slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 text-center py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-[#202124] dark:text-[#e8eaed] text-xs font-bold rounded-none transition-colors cursor-pointer"
                            >
                              📖 관련 분석 칼럼 읽기 ({related.length}건)
                            </Link>
                          );
                        } else {
                          return (
                            <Link 
                              href="/blog"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 text-center py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-[#202124] dark:text-[#e8eaed] text-xs font-bold rounded-none transition-colors cursor-pointer"
                            >
                              📖 보상스쿨 전체 칼럼 읽기
                            </Link>
                          );
                        }
                      })()}
                      <a 
                        href={getKakaoLink(item.title)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center py-2.5 bg-amber-400 hover:bg-amber-500 text-white text-xs font-bold rounded-none shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        💬 내 보상 무료 검토 신청 (카톡)
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
