'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { cleanFssText } from '@/lib/cleaners';
import AppIcon from '@/components/ui/AppIcon';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumBadge from '@/components/ui/PremiumBadge';
import PremiumButton from '@/components/ui/PremiumButton';

interface FssNewsItem {
  id: string;
  category: 'alert' | 'case' | 'tip' | 'press' | 'warn';
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

interface FssProductItem {
  kor_co_nm: string;
  fin_prdt_nm: string;
  join_way: string;
  pnsn_recp_trm_nm: string;
  pnsn_entr_age_nm: string;
  mon_pay_atm_nm: string;
}

type TabType = 'all' | 'alert' | 'case' | 'tip' | 'press' | 'products';

export default function FssNewsPage() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<FssNewsItem[]>([]);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);

  // 금융상품 비교 상태
  const [productType, setProductType] = useState<'annuity' | 'deposit'>('annuity');
  const [products, setProducts] = useState<FssProductItem[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [productMessage, setProductMessage] = useState('');

  // 1. 금감원 뉴스/소비자 데이터 조회 (무장애 이중 방어 알고리즘)
  const fetchFssData = useCallback(async (searchQuery: string, categoryTab: TabType) => {
    if (categoryTab === 'products') return;

    setLoading(true);

    try {
      // 1단계: API 엔드포인트 호출
      const apiUrl = `/api/fss-news?query=${encodeURIComponent(searchQuery)}&type=${categoryTab}`;
      const res = await fetch(apiUrl);

      if (res.ok) {
        const data: FssNewsItem[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setResults(data);
          setLoading(false);
          return;
        }
      }
      throw new Error('API 응답 없음 - 정적 데이터로 자동 전환');
    } catch {
      // 2단계: 무장애 Fallback (정적 JSON 직접 로드 및 클라이언트 실시간 필터링)
      try {
        const staticRes = await fetch('/data/fss-consumer-data.json');
        if (staticRes.ok) {
          const allData: FssNewsItem[] = await staticRes.json();
          let filtered = allData;

          // 카테고리 필터링 (warn과 alert 상호 호환)
          if (categoryTab !== 'all') {
            filtered = filtered.filter(item => {
              const itemCat = item.category === 'warn' ? 'alert' : item.category;
              return itemCat === categoryTab;
            });
          }

          // 검색어 필터링
          if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(item => {
              const titleMatch = item.title?.toLowerCase().includes(q);
              const contentMatch = item.content?.toLowerCase().includes(q);
              const fullContentMatch = item.fullContent?.toLowerCase().includes(q);
              const keywordMatch = item.keywords?.some(k => k.toLowerCase().includes(q));
              const commentMatch = item.comment?.toLowerCase().includes(q);
              const summaryMatch = item.summary?.some(s => s.toLowerCase().includes(q));
              return titleMatch || contentMatch || fullContentMatch || keywordMatch || commentMatch || summaryMatch;
            });
          }

          setResults(filtered);
        } else {
          setResults([]);
        }
      } catch (fallbackError) {
        console.error('금감원 데이터 Fallback 로드 실패:', fallbackError);
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. 금융상품 비교 데이터 조회 (연금저축 / 정기예금)
  const fetchProducts = useCallback(async (type: 'annuity' | 'deposit') => {
    setProductLoading(true);
    try {
      const res = await fetch(`/api/fss-products?type=${type}`);
      if (res.ok) {
        const data = await res.json();
        if (data.products && Array.isArray(data.products)) {
          setProducts(data.products);
          setProductMessage(data.message || '');
          setProductLoading(false);
          return;
        }
      }
      throw new Error('API 오류');
    } catch {
      // 정적 Fallback 파일 직접 로드
      try {
        const fallbackRes = await fetch('/data/fss-fallback-products.json');
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          const list = fallbackData[type] || [];
          setProducts(list);
          setProductMessage('금감원 정기 공시 표준 데이터가 표시됩니다.');
        }
      } catch {
        setProducts([]);
      }
    } finally {
      setProductLoading(false);
    }
  }, []);

  // 마운트 시 최초 호출
  useEffect(() => {
    fetchFssData('', 'all');

    // 블로그 포스트 연동 (관련 칼럼 매핑용)
    fetch('/api/posts')
      .then(res => res.ok ? res.json() : [])
      .then(data => setBlogPosts(data))
      .catch(err => console.warn('블로그 포스트 연동 로드 실패:', err));
  }, [fetchFssData]);

  // 상품 탭 진입 시 상품 로드
  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts(productType);
    }
  }, [activeTab, productType, fetchProducts]);

  // 금감원 자료에 해당되는 보상스쿨의 전문 해설글 자동 매핑 알고리즘
  const getRelatedBlogPostsForFss = (item: FssNewsItem) => {
    if (blogPosts.length === 0) {
      return item.relColumn && item.relColumn !== '/blog' 
        ? [{ slug: item.relColumn.replace('/blog/', ''), title: item.title }] 
        : [];
    }
    
    let matchPosts: any[] = [];
    
    // 1. relColumn에 지정된 특정 포스트 매핑
    if (item.relColumn && item.relColumn !== '/blog') {
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
      return (item.keywords || []).some(kw => {
        const k = kw.toLowerCase();
        return (titleLower.includes(k) || contentLower.includes(k)) && postTitleLower.includes(k);
      });
    });
    
    matchPosts = [...matchPosts, ...extra];
    return matchPosts.slice(0, 2);
  };

  // 메인 탭 변경 핸들러
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'products') {
      fetchProducts(productType);
    } else {
      fetchFssData(query, tab);
    }
  };

  // 검색 폼 제출 핸들러
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'products') {
      setActiveTab('all');
      fetchFssData(query, 'all');
    } else {
      fetchFssData(query, activeTab);
    }
  };

  const openChat = () => {
    document.getElementById('chat-floating-btn')?.click();
  };

  const getCategoryBadgeClass = (category: string) => {
    const cat = category === 'warn' ? 'alert' : category;
    switch (cat) {
      case 'alert':
        return 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200/50 dark:border-red-800/30';
      case 'case':
        return 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/30';
      case 'tip':
        return 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-200/50 dark:border-green-800/30';
      case 'press':
      default:
        return 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30';
    }
  };

  const getCategoryName = (category: string) => {
    const cat = category === 'warn' ? 'alert' : category;
    switch (cat) {
      case 'alert':
        return '소비자경보';
      case 'case':
        return '분쟁사례';
      case 'tip':
        return '금융꿀팁';
      case 'press':
      default:
        return '보도자료';
    }
  };

  const getSummaryBoxTitle = (category: string) => {
    const cat = category === 'warn' ? 'alert' : category;
    switch (cat) {
      case 'alert':
        return '소비자경보 핵심 가이드';
      case 'case':
        return '분쟁사례 핵심 요지';
      case 'tip':
        return '실용 금융꿀팁 요약';
      case 'press':
      default:
        return '금감원 핵심 보도 요약';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* 상단 브레드크럼 */}
      <nav className="flex text-xs text-[#5f6368] dark:text-[#9aa0a6]" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1.5">
          <li><Link href="/" className="hover:text-[var(--google-blue)] transition-colors">홈</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="text-[#202124] dark:text-[#e8eaed] font-medium" aria-current="page">금감원 소비자보호센터</li>
        </ol>
      </nav>

      {/* 1. 상단 메인 헤더 배너 (입체감 있는 레드 파스텔 PremiumCard) */}
      <PremiumCard 
        borderColor="red" 
        hoverEffect={false} 
        watermarkIcon="shield-alert" 
        className="!p-5 sm:!p-7 !bg-gradient-to-r !from-rose-50/90 !via-red-50/50 !to-transparent dark:!from-rose-950/40 dark:!via-red-950/20 dark:!to-transparent border-rose-200/90 dark:border-rose-900/50"
      >
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <PremiumBadge color="red">금융감독원 공식 소비자 데이터 연동</PremiumBadge>
            <PremiumBadge color="gray">소비자경보·분쟁조정·비교공시</PremiumBadge>
          </div>

          <PremiumHeading 
            level={1} 
            gradient="red" 
            showLeftBorder={false} 
            icon={<AppIcon name="shield-alert" size={24} className="text-red-600 shrink-0" />}
            className="!mb-2 !text-xl sm:!text-2xl font-black"
          >
            금감원 소비자보호센터
          </PremiumHeading>

          <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] break-keep leading-relaxed font-medium">
            금융감독원 공식 데이터를 실시간 연동하여 소비자 경보, 민원 분쟁사례, 금융 실무 꿀팁 및 금융상품 비교공시를 원스톱 통합 대시보드로 제공합니다.
          </p>
        </div>
      </PremiumCard>

      {/* 2. 검색 및 탭 네비게이션 박스 */}
      <PremiumCard hoverEffect={false} borderColor="red" className="!p-5 sm:!p-6">
        <div className="space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-2 flex-col sm:flex-row">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="검색어를 입력해 보세요 (예: 도수치료, 체외충격파, 대포통장, 여행자보험)"
              className="flex-1 px-4 py-3 sm:py-3.5 rounded-none border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800/40 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 dark:text-white text-xs sm:text-sm font-medium shadow-inner"
            />
            <PremiumButton
              type="submit"
              disabled={loading && activeTab !== 'products'}
              color="red"
              className="py-3 sm:py-3.5 min-w-[120px] flex items-center justify-center h-full !rounded-none font-bold text-xs sm:text-sm"
            >
              {loading ? '연동 중...' : '실시간 조회'}
            </PremiumButton>
          </form>

          {/* 탭 카테고리 메뉴 */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
            {[
              { id: 'all', label: '전체보기', icon: 'list' as const },
              { id: 'alert', label: '소비자경보', icon: 'shield-alert' as const },
              { id: 'case', label: '분쟁사례', icon: 'scale' as const },
              { id: 'tip', label: '금융꿀팁', icon: 'lightbulb' as const },
              { id: 'press', label: '보도자료', icon: 'bullhorn' as const },
              { id: 'products', label: '상품 비교', icon: 'bank' as const }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as TabType)}
                className={`py-2.5 rounded-none text-xs font-bold transition-all cursor-pointer truncate px-1 text-center flex items-center justify-center gap-1.5 border ${
                  activeTab === tab.id
                    ? 'bg-red-600 text-white border-red-600 dark:bg-red-600 dark:text-white dark:border-red-600 shadow-sm font-black'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200/60 dark:bg-zinc-800/60 dark:text-gray-400 dark:border-zinc-700/60 dark:hover:bg-zinc-700/60'
                }`}
              >
                <AppIcon name={tab.icon} size={14} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </PremiumCard>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. 금융상품 비교공시 탭 뷰어 */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-gray-200 dark:border-white/10">
            <h2 className="text-lg font-extrabold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2">
              <AppIcon name="bank" size={20} />
              <span>금융감독원 금융상품 한눈에 비교공시</span>
            </h2>
            <div className="flex gap-1.5">
              <button
                onClick={() => { setProductType('annuity'); fetchProducts('annuity'); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-none cursor-pointer transition-all ${
                  productType === 'annuity'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400'
                }`}
              >
                연금저축보험
              </button>
              <button
                onClick={() => { setProductType('deposit'); fetchProducts('deposit'); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-none cursor-pointer transition-all ${
                  productType === 'deposit'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400'
                }`}
              >
                정기예금
              </button>
            </div>
          </div>

          {productMessage && (
            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1.5">
              <AppIcon name="info" size={14} />
              <span>{productMessage}</span>
            </div>
          )}

          {productLoading ? (
            <div className="bg-white dark:bg-[#202124] rounded-none py-14 px-6 text-center border border-gray-100 dark:border-white/5 shadow-sm space-y-4 animate-pulse">
              <div className="inline-block w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-sm font-bold text-[#202124] dark:text-[#e8eaed]">금융감독원 공시 시스템에서 실시간 상품 정보를 집계 중입니다...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse bg-white dark:bg-[#202124] border border-gray-200 dark:border-white/10 text-xs shadow-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300">
                    <th className="p-3 font-black">금융기관</th>
                    <th className="p-3 font-black">상품명</th>
                    <th className="p-3 font-black">가입방법</th>
                    <th className="p-3 font-black">{productType === 'annuity' ? '수령기간' : '만기후 이율'}</th>
                    <th className="p-3 font-black">{productType === 'annuity' ? '가입연령' : '우대조건'}</th>
                    <th className="p-3 font-black">{productType === 'annuity' ? '납입조건' : '금리'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {products.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors">
                      <td className="p-3 font-bold text-gray-900 dark:text-gray-100">{item.kor_co_nm}</td>
                      <td className="p-3 font-semibold text-blue-600 dark:text-blue-400">{item.fin_prdt_nm}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">{item.join_way}</td>
                      <td className="p-3 text-gray-700 dark:text-gray-300">{item.pnsn_recp_trm_nm}</td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">{item.pnsn_entr_age_nm}</td>
                      <td className="p-3 font-bold text-amber-600 dark:text-amber-400">{item.mon_pay_atm_nm}</td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        공시 데이터가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. 금감원 보도자료 / 소비자경보 / 분쟁사례 리스트 */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab !== 'products' && (
        <>
          {/* 로딩 표시 */}
          {loading && (
            <div className="bg-white dark:bg-[#202124] rounded-none py-14 px-6 text-center border border-gray-100 dark:border-white/5 shadow-sm space-y-4 animate-pulse">
              <div className="inline-block w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-sm font-bold text-[#202124] dark:text-[#e8eaed]">금융감독원 공식 소비자보호 데이터를 동기화 중입니다...</div>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] max-w-xs mx-auto leading-relaxed">
                금감원 최신 소비자경보 및 분쟁조정 가이드라인을 실시간으로 가져옵니다.
              </p>
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="bg-white dark:bg-[#202124] rounded-none py-14 px-5 border border-gray-100 dark:border-white/5 text-center text-sm font-bold text-gray-500 dark:text-gray-400">
              조회된 데이터가 없습니다. 다른 검색어를 입력해 보세요.
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-gray-150 dark:border-white/10">
                <h2 className="text-base sm:text-lg font-bold text-[#202124] dark:text-[#e8eaed]">
                  조회된 금감원 보상 데이터 총 <span className="text-red-600 dark:text-red-400 font-extrabold">{results.length}</span>건
                </h2>
                <span className="text-xs text-gray-400 dark:text-gray-500">실시간 연동 완료</span>
              </div>

              <div className="space-y-6">
                {results.map((item) => (
                  <div
                    key={item.id}
                    id={item.id}
                    className="bg-white dark:bg-[#202124] p-5 sm:p-7 rounded-none border border-gray-200 dark:border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] hover:border-red-500/50 transition-all duration-300 space-y-4 scroll-mt-24"
                  >
                    {/* 헤더 배지 & 날짜 */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-none flex items-center gap-1 ${getCategoryBadgeClass(item.category)}`}>
                        <AppIcon name={item.category === 'warn' || item.category === 'alert' ? 'shield-alert' : item.category === 'case' ? 'scale' : item.category === 'tip' ? 'lightbulb' : 'bullhorn'} size={12} />
                        <span>{getCategoryName(item.category)}</span>
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">{item.date}</span>
                    </div>

                    {/* 제목 */}
                    <h3 className="text-base sm:text-lg font-extrabold text-[#202124] dark:text-[#e8eaed] leading-snug">
                      {item.title}
                    </h3>

                    {/* 핵심 3줄 요약 가이드 */}
                    <div className="bg-gray-50 dark:bg-white/2 p-4 rounded-none border border-gray-200/80 dark:border-white/5 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                        <AppIcon name="lightbulb" size={14} />
                        <span>{getSummaryBoxTitle(item.category || 'press')}</span>
                      </div>
                      <ul className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium space-y-1.5 list-disc pl-4">
                        {(Array.isArray(item.summary) ? item.summary : [item.summary || item.title]).map((sumLine, idx) => (
                          <li key={idx}>{sumLine}</li>
                        ))}
                      </ul>
                    </div>

                    {/* 보상스쿨 수석 손해사정사 실무 코멘트 */}
                    {item.comment && (
                      <div className="bg-[#fcf8e3]/40 dark:bg-[#fcf8e3]/5 p-4 rounded-none border border-[#faebcc] dark:border-[#faebcc]/10 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-black text-[#8a6d3b] dark:text-[#c4a86f]">
                          <AppIcon name="shield-check" size={14} />
                          <span>보상스쿨 수석 손해사정사 실무 코멘트</span>
                        </div>
                        <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed font-medium pl-0.5">
                          {item.comment}
                        </p>
                      </div>
                    )}

                    {/* 태그 */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(Array.isArray(item.keywords) ? item.keywords : []).map((kw, idx) => (
                        <span key={idx} className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-none">
                          #{kw}
                        </span>
                      ))}
                    </div>

                    {/* HWP 파일 무설치 전문보기 및 공식 사이트 새창 이동 */}
                    <div className="flex gap-2 pt-2 w-full">
                      {item.fullContent && (
                        <button
                          onClick={() => setExpandedCardId(expandedCardId === item.id ? null : item.id)}
                          className="flex-1 px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-250 dark:border-white/10 rounded-none text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <AppIcon name="file-text" size={14} />
                          <span>{expandedCardId === item.id ? '보도/결정문 전문 닫기' : '전문 확인 (HWP 변환)'}</span>
                        </button>
                      )}
                      {item.officialUrl && (
                        <a
                          href={item.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-250 dark:border-white/10 rounded-none text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm text-center"
                        >
                          <AppIcon name="external-link" size={14} />
                          <span>금감원 원문 새창보기</span>
                        </a>
                      )}
                    </div>

                    {/* 전문 텍스트 노출 영역 */}
                    {expandedCardId === item.id && item.fullContent && (
                      <div className="bg-gray-50/50 dark:bg-[#303134]/30 p-4 sm:p-5 rounded-none border border-gray-200 dark:border-white/10 text-xs text-gray-800 dark:text-gray-200 leading-relaxed space-y-3 whitespace-pre-wrap font-medium animate-in fade-in slide-in-from-top-2 duration-200 shadow-inner">
                        <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-white/10 pb-2 mb-2 flex justify-between items-center">
                          <span className="flex items-center gap-1">
                            <AppIcon name="file-text" size={12} />
                            <span>금융감독원 보도문/결정문 전문 (한글 HWP 대체 텍스트)</span>
                          </span>
                          <span>HWP 뷰어 무설치 열람 중</span>
                        </div>
                        <div className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed [&>p]:mb-3 [&_a]:text-[var(--google-blue)] hover:[&_a]:underline [&_h3]:text-sm [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:text-gray-900 dark:[&_h3]:text-white [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:space-y-1.5 [&_li]:leading-relaxed">
                          <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                            {cleanFssText(item.fullContent)}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-2.5 pt-3 border-t border-gray-100 dark:border-white/5 flex-wrap sm:flex-nowrap">
                      {(() => {
                        const related = getRelatedBlogPostsForFss(item);
                        if (related.length > 0) {
                          return (
                            <Link 
                              href={`/blog/${related[0].slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 text-center py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-[#202124] dark:text-[#e8eaed] text-xs font-bold rounded-none transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <AppIcon name="book" size={14} />
                              <span>관련 분석 칼럼 읽기 ({related.length}건)</span>
                            </Link>
                          );
                        } else {
                          return (
                            <Link 
                              href="/blog"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 text-center py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-[#202124] dark:text-[#e8eaed] text-xs font-bold rounded-none transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <AppIcon name="book" size={14} />
                              <span>보상스쿨 전체 칼럼 읽기</span>
                            </Link>
                          );
                        }
                      })()}
                      <button 
                        onClick={openChat}
                        className="flex-1 text-center py-2.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold rounded-none shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        id="fss-news-chat-btn"
                      >
                        <AppIcon name="chat" size={14} />
                        <span>내 보상 무료 검토 신청</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
