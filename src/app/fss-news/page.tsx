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

interface FssProductItem {
  kor_co_nm: string;
  fin_prdt_nm: string;
  join_way: string;
  pnsn_recp_trm_nm: string; // 수령기간 또는 만기이율
  pnsn_entr_age_nm: string; // 가입연령 또는 우대조건
  mon_pay_atm_nm: string;   // 납입금액 또는 금리
}

export default function FssNewsPage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'alert' | 'case' | 'tip' | 'press' | 'products'>('all');
  const [productType, setProductType] = useState<'annuity' | 'deposit'>('annuity');
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<FssNewsItem[]>([]);
  const [products, setProducts] = useState<FssProductItem[]>([]);
  const [isRealTimeProduct, setIsRealTimeProduct] = useState(false);
  const [productMessage, setProductMessage] = useState('');
  const [latestAlert, setLatestAlert] = useState<FssNewsItem | null>(null);
  const [error, setError] = useState('');

  // 1. 금감원 뉴스/소비자 데이터 조회
  const fetchFssData = async (searchQuery: string, categoryTab: string) => {
    setLoading(true);
    setError('');
    const delayPromise = new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      const url = `/api/fss-news?query=${encodeURIComponent(searchQuery)}&type=${categoryTab}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`금감원 실시간 데이터 연동 중 통신 오류가 발생했습니다. (HTTP ${res.status})`);
      }
      
      const data: FssNewsItem[] = await res.json();
      await delayPromise;
      setResults(data);
      
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

  // 2. 금감원 금융상품 통합비교공시 API 조회 (대표님 인증키 적용)
  const fetchFssProducts = async (type: 'annuity' | 'deposit') => {
    setLoading(true);
    setError('');
    const delayPromise = new Promise(resolve => setTimeout(resolve, 800));

    try {
      const url = `/api/fss-products?type=${type}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`금융상품 실시간 연동 중 통신 오류가 발생했습니다. (HTTP ${res.status})`);
      }

      const data = await res.json();
      await delayPromise;

      if (data.success) {
        setProducts(data.products || []);
        setIsRealTimeProduct(data.isRealTime);
        setProductMessage(data.message);
      } else {
        throw new Error(data.error || '상품 정보를 파싱하지 못했습니다.');
      }
    } catch (e: any) {
      await delayPromise;
      setError(e.message || '금융상품을 조회하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 마운트 시 최초 호출
  useEffect(() => {
    fetchFssData('', 'all');
  }, []);

  // 메인 탭 변경 핸들러
  const handleTabChange = (tab: 'all' | 'alert' | 'case' | 'tip' | 'press' | 'products') => {
    setActiveTab(tab);
    if (tab === 'products') {
      fetchFssProducts(productType);
    } else {
      fetchFssData(query, tab);
    }
  };

  // 상품 서브 카테고리 변경 핸들러
  const handleProductTypeChange = (type: 'annuity' | 'deposit') => {
    setProductType(type);
    fetchFssProducts(type);
  };

  // 검색 폼 제출 핸들러
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'products') {
      fetchFssProducts(productType);
    } else {
      fetchFssData(query, activeTab);
    }
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
      {latestAlert && activeTab !== 'products' && (
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
          금융감독원 공식 API 연동을 통해 소비자 경보, 민원 분쟁사례, 금융꿀팁, 실시간 금융상품 한눈에 비교공시 서비스를 하나의 통합 대시보드에서 제공합니다.
        </p>
      </div>

      {/* 검색 박스 영역 */}
      <div className="bg-white dark:bg-[#202124] p-5 sm:p-7 rounded-3xl border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-col sm:flex-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={activeTab === 'products'}
            placeholder={activeTab === 'products' ? '금융상품 비교 탭에서는 검색이 아닌 필터링만 제공됩니다.' : '검색어를 입력해 보세요 (예: 도수치료, 백내장, 단체보험)'}
            className="flex-1 px-4 py-3 sm:py-3.5 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/2 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:text-white text-sm font-medium shadow-inner disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || activeTab === 'products'}
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
            { id: 'press', label: '📢 보도자료' },
            { id: 'products', label: '📊 금융상품 비교 (공식 API)' }
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
            금감원 공공 데이터베이스 서버와 API 중계를 통해 최신 보상 지침 및 비교 공시 데이터를 직접 호출하고 있습니다.
          </p>
        </div>
      )}

      {/* 에러 및 피드백 */}
      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-3xl py-10 px-5 text-center font-bold text-sm">
          {error}
        </div>
      )}

      {/* 카테고리 1: 뉴스 / 분쟁 / 꿀팁 데이터 카드 */}
      {!loading && activeTab !== 'products' && (
        <>
          {results.length === 0 && !error && (
            <div className="bg-white dark:bg-[#202124] rounded-3xl py-14 px-5 border border-gray-100 dark:border-white/5 text-center text-sm font-bold text-gray-500 dark:text-gray-400">
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
                    className="bg-white dark:bg-[#202124] p-5 sm:p-7 rounded-3xl border border-gray-100 dark:border-white/5 shadow-md hover:shadow-lg transition-all duration-300 space-y-4 scroll-mt-24"
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

                    {/* 본문 */}
                    <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed font-medium">
                      {item.content}
                    </p>

                    {/* AI 요약 */}
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

                    {/* 전문가 의견 */}
                    <div className="bg-[#fcf8e3]/30 dark:bg-[#fcf8e3]/5 p-4 rounded-2xl border border-[#faebcc]/50 dark:border-[#faebcc]/10 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-[#8a6d3b] dark:text-[#c4a86f]">
                        <span className="text-sm">👨‍🏫</span>
                        보상스쿨 손해사정사 실무 코멘트
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium pl-1">
                        {item.comment}
                      </p>
                    </div>

                    {/* 태그 */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {item.keywords.map((kw, idx) => (
                        <span key={idx} className="text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-white/2 px-2 py-0.5 rounded-md">
                          #{kw}
                        </span>
                      ))}
                    </div>

                    {/* 액션 */}
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
        </>
      )}

      {/* 카테고리 2: 금융상품 비교 탭 화면 */}
      {!loading && activeTab === 'products' && (
        <div className="space-y-6">
          {/* 금감원 API 연결 상태 표시 배너 */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between flex-wrap gap-2 text-xs font-bold ${
            isRealTimeProduct
              ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
          }`}>
            <div className="flex items-center gap-2">
              <span>{isRealTimeProduct ? '🟢' : '⚠️'}</span>
              <span>{productMessage}</span>
            </div>
            {!isRealTimeProduct && (
              <span className="text-[10px] font-medium bg-amber-500/20 px-2 py-0.5 rounded">인증키 IP 등록 또는 정기 점검 시 폴백 가동</span>
            )}
          </div>

          {/* 서브 상품군 선택 탭 */}
          <div className="flex gap-2 bg-gray-100 dark:bg-[#303134] p-1 rounded-xl w-fit">
            <button
              onClick={() => handleProductTypeChange('annuity')}
              className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                productType === 'annuity'
                  ? 'bg-white dark:bg-[#202124] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              📊 연금저축보험 (보험사)
            </button>
            <button
              onClick={() => handleProductTypeChange('deposit')}
              className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                productType === 'deposit'
                  ? 'bg-white dark:bg-[#202124] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              💰 정기예금 (시중은행)
            </button>
          </div>

          {/* 금융상품 목록 표시 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((prod, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#202124] p-5 rounded-3xl border border-gray-100 dark:border-white/5 shadow-md hover:shadow-lg transition-all duration-200 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/2 px-2 py-1 rounded-md">
                      🏛️ {prod.kor_co_nm}
                    </span>
                    <span className="text-xs font-extrabold text-amber-500">
                      {productType === 'annuity' ? '연금보험' : '기본금리: ' + prod.mon_pay_atm_nm}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-[#202124] dark:text-[#e8eaed]">
                    {prod.fin_prdt_nm}
                  </h3>
                  <div className="text-[11px] text-gray-600 dark:text-gray-400 space-y-1.5 pt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-400">가입방법</span>
                      <span>{prod.join_way}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-400">
                        {productType === 'annuity' ? '수령기간' : '만기이율'}
                      </span>
                      <span className="text-right max-w-[200px] truncate">{prod.pnsn_recp_trm_nm}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-400">
                        {productType === 'annuity' ? '가입연령' : '우대조건'}
                      </span>
                      <span className="text-right max-w-[200px] truncate">{prod.pnsn_entr_age_nm}</span>
                    </div>
                    {productType === 'annuity' && (
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-400">최소납입금액</span>
                        <span>{prod.mon_pay_atm_nm}</span>
                      </div>
                    )}
                  </div>
                </div>

                <a
                  href={getKakaoLink(`${prod.kor_co_nm} - ${prod.fin_prdt_nm}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center py-2 bg-amber-400 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  💬 상품 기준 상담 신청하기 (카톡)
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
