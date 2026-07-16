'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AiCommentBox from '@/components/AiCommentBox';
import { KAKAO_OPEN_CHAT_URL } from '@/lib/constants';
interface Precedent {
  id: string;
  title: string;
  caseNo: string;
  judgmentDate: string;
  courtName: string;
  judgmentSummary: string;
  caseContent: string;
  caseType: string;
  officialUrl: string;
  casePoints: string; // ⚖️ 공식 판시사항
}

// 텍스트 클리닝 헬퍼: 법제처 판결요지 및 판례본문의 HTML 태그와 엔티티를 정제하여 줄바꿈을 깔끔하게 유지합니다.
function cleanLawText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// AI 코멘트 모듈로 분리되었습니다.

// 날짜 포맷팅 헬퍼
function formatJudgmentDate(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('.')) return dateStr.trim();
  if (dateStr.length === 8 && /^\d+$/.test(dateStr)) {
    const y = dateStr.slice(0, 4);
    const m = parseInt(dateStr.slice(4, 6), 10);
    const d = parseInt(dateStr.slice(6, 8), 10);
    return `${y}. ${m}. ${d}.`;
  }
  return dateStr;
}

// 세션 스토리지 기반 검색 캐싱
const getCachedSearch = (query: string): Precedent[] | null => {
  try {
    const key = `prec_cache_list_${query.trim()}`;
    const cached = sessionStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

const setCachedSearch = (query: string, data: Precedent[]) => {
  try {
    const key = `prec_cache_list_${query.trim()}`;
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch {}
};

// 🧠 지능형 판례 요약 알고리즘
function getSmartSummary(summary: string, content: string): string {
  if (!summary && !content) return '판례 상세 내용을 확인해 주세요.';
  if (summary) {
    const sections = summary.split(/\[\d+\]/g).map(s => s.trim()).filter(Boolean);
    if (sections.length > 0) {
      const targetKeywords = ['사안', '사례', '보험금', '해당', '지급', '책임', '과실', '타당'];
      const bestSection = sections.find(sec => targetKeywords.some(kw => sec.includes(kw)));
      if (bestSection) return bestSection.length > 220 ? bestSection.slice(0, 220) + '...' : bestSection;
      const lastSection = sections[sections.length - 1];
      if (lastSection) return lastSection.length > 220 ? lastSection.slice(0, 220) + '...' : lastSection;
    }
    return summary.length > 180 ? summary.slice(0, 180) + '...' : summary;
  }
  if (content) {
    const startIdx = content.indexOf('판단한다');
    const targetText = startIdx !== -1 ? content.slice(startIdx) : content;
    const sentences = targetText.split(/[.?!]\s+/);
    const coreSentences = sentences.filter(s => 
      s.includes('보험금') || s.includes('지급') || s.includes('배상') || s.includes('책임이') || s.includes('타당하다')
    ).slice(0, 2);
    if (coreSentences.length > 0) return coreSentences.join('. ').slice(0, 220) + '...';
    return content.length > 180 ? content.slice(0, 180) + '...' : content;
  }
  return '판례 정보를 읽어올 수 없습니다.';
}


export default function PrecedentSearchPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [results, setResults] = useState<Precedent[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recent_prec_searches');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  
  // 지연 로딩을 위한 상태 관리
  const [openDetailId, setOpenDetailId] = useState<string | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);


  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.ok ? res.json() : [])
      .then(data => setBlogPosts(data))
      .catch(err => console.warn('블로그 포스트 연동 로드 실패:', err));
  }, []);

  const saveSearch = (q: string) => {
    if (!q || recentSearches.includes(q)) return;
    const next = [q, ...recentSearches.slice(0, 5)];
    setRecentSearches(next);
    localStorage.setItem('recent_prec_searches', JSON.stringify(next));
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent_prec_searches');
  };

  const fetchPrecedents = async (searchQuery: string, pageNum: number, isLoadMore = false) => {
    try {
      const listRes = await fetch(`/api/precedent?query=${encodeURIComponent(searchQuery)}&page=${pageNum}`);
      if (!listRes.ok) throw new Error(`목록 조회에 실패했습니다. (HTTP ${listRes.status})`);
      
      const listXml = await listRes.text();
      if (listXml.includes('사용자 정보 검증에 실패하였습니다')) {
        setError('법제처 API 인증 실패: 등록된 IP와 현재 요청 IP가 일치하지 않거나 서버 동기화 지연 중입니다.');
        return;
      }

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(listXml, "text/xml");
      if (xmlDoc.getElementsByTagName('parsererror')[0]) {
        throw new Error('법제처 응답 XML 파싱 중 오류가 발생했습니다.');
      }

      const totalCntNode = xmlDoc.getElementsByTagName('totalCnt')[0];
      const tCount = totalCntNode ? parseInt(totalCntNode.textContent || '0', 10) : 0;
      setTotalCount(tCount);

      const ids = Array.from(xmlDoc.getElementsByTagName('판례일련번호')).map(el => el.textContent?.trim() || '');
      const titles = Array.from(xmlDoc.getElementsByTagName('사건명')).map(el => el.textContent?.trim() || '');
      const caseNos = Array.from(xmlDoc.getElementsByTagName('사건번호')).map(el => el.textContent?.trim() || '');
      const dates = Array.from(xmlDoc.getElementsByTagName('선고일자')).map(el => el.textContent?.trim() || '');
      const courts = Array.from(xmlDoc.getElementsByTagName('법원명')).map(el => el.textContent?.trim() || '');
      const types = Array.from(xmlDoc.getElementsByTagName('사건종류명')).map(el => el.textContent?.trim() || '');

      if (ids.length === 0 && !isLoadMore) {
        setError('입력하신 조건과 일치하는 판례 데이터를 찾을 수 없습니다.');
        return;
      }

      const parsedData: Precedent[] = ids.map((id, i) => ({
        id,
        title: titles[i] || '제목 없음',
        caseNo: caseNos[i] || '',
        judgmentDate: dates[i] || '',
        courtName: courts[i] || '',
        caseType: types[i] || '',
        judgmentSummary: '', 
        caseContent: '',
        casePoints: '',
        officialUrl: `https://www.law.go.kr/LSW/precInfoP.do?precSeq=${id}`
      }));

      if (isLoadMore) {
        setResults(prev => [...prev, ...parsedData]);
      } else {
        setResults(parsedData);
        setCachedSearch(searchQuery, parsedData); // 캐시 업데이트 (첫 페이지만)
      }
    } catch (err: any) {
      console.error(err);
      setError('법제처 API 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    }
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    const trimmedQuery = searchQuery.trim();
    setQuery(trimmedQuery);
    setPage(1);
    setLoading(true);
    setError('');
    setResults([]);
    setOpenDetailId(null);
    saveSearch(trimmedQuery);

    const cached = getCachedSearch(trimmedQuery);
    if (cached) {
      setResults(cached);
      setTotalCount(cached.length); // 임시 할당
      setLoading(false);
    }

    await fetchPrecedents(trimmedQuery, 1, false);
    setLoading(false);
  };

  const handleLoadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchPrecedents(query, nextPage, true);
    setLoadingMore(false);
  };

  // 💡 사용자가 클릭했을 때 호출되는 온디맨드 상세 조회 로직 (지연 로딩)
  const handleToggleDetail = async (prec: Precedent) => {
    // 닫기
    if (openDetailId === prec.id) {
      setOpenDetailId(null);
      return;
    }
    
    // 열기 (아코디언 토글)
    setOpenDetailId(prec.id);
    
    // 이미 캐시되어 있으면 통신 생략
    if (prec.caseContent || prec.judgmentSummary || prec.casePoints) {
      return;
    }
    
    // 첫 클릭 시 1개의 판례만 법제처에 상세 API 호출
    setDetailLoadingId(prec.id);
    try {
      const detailRes = await fetch(`/api/precedent-detail?ID=${prec.id}`);
      if (!detailRes.ok) throw new Error('상세 API 에러');
      
      const detailXml = await detailRes.text();
      const parser = new DOMParser();
      const detailDoc = parser.parseFromString(detailXml, "text/xml");
      
      const getValue = (tagName: string) => {
        const el = detailDoc.getElementsByTagName(tagName)[0];
        return el?.textContent?.trim() || '';
      };

      const newSummary = cleanLawText(getValue('판결요지'));
      const newContent = cleanLawText(getValue('판례내용'));
      const newPoints = cleanLawText(getValue('판시사항'));

      // 상태 업데이트 (원본 배열 중 이 ID만 업데이트)
      const updatedResults = results.map(p => {
        if (p.id === prec.id) {
          return { ...p, judgmentSummary: newSummary, caseContent: newContent, casePoints: newPoints };
        }
        return p;
      });
      setResults(updatedResults);
      setCachedSearch(query, updatedResults); // 캐시도 업데이트
    } catch (err) {
      console.error("상세 정보를 불러오는 중 에러:", err);
    } finally {
      setDetailLoadingId(null);
    }
  };

  const getRelatedBlogPosts = (prec: Precedent) => {
    if (blogPosts.length === 0) return [];
    return blogPosts.filter(post => {
      if (post.caseNumber && prec.caseNo) {
        const pNum = post.caseNumber.replace(/\s+/g, '');
        const cNum = prec.caseNo.replace(/\s+/g, '');
        if (pNum.includes(cNum) || cNum.includes(pNum)) return true;
      }
      const titleLower = prec.title.toLowerCase();
      const postTitleLower = post.title.toLowerCase();
      const matchKeywords = ['기왕증', '압박골절', '자살', '사망보험금', '백내장', '도수치료', '실손', '교통사고', '장해', '배상책임'];
      return matchKeywords.some(kw => titleLower.includes(kw) && postTitleLower.includes(kw));
    }).slice(0, 2);
  };

  const openChatWithContext = (prec: Precedent) => {
    if (typeof window !== 'undefined') {
      window.open(KAKAO_OPEN_CHAT_URL, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-[#202124] rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:border-[var(--google-blue)] hover:shadow-[0_16px_50px_rgba(26,115,232,0.2)] transition-all duration-300 overflow-hidden">
        {/* 상단 띠 배너 */}
        <div className="bg-[var(--google-blue)] text-white px-5 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-lg shrink-0">💡</span>
            <div className="text-xs sm:text-sm font-extrabold tracking-tight">
              <span className="underline decoration-wavy mr-1.5">[보상 트렌드]</span>
              법원의 실시간 대법원 판례 기준을 파악하면 보험사의 삭감 주장을 방어할 수 있습니다.
            </div>
          </div>
          <button 
            onClick={() => document.getElementById('search-box-area')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            className="text-[10px] font-black uppercase tracking-wider bg-white text-[var(--google-blue)] px-2.5 py-1 rounded-none border border-white hover:bg-blue-50 transition-colors cursor-pointer"
          >
            검색하기
          </button>
        </div>

        <div className="p-6 sm:p-10 space-y-6">
          <div className="text-center space-y-3 pb-4 border-b border-gray-100 dark:border-white/5 mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202124] dark:text-[#e8eaed] tracking-tight">
              보상스쿨 <span className="bg-gradient-to-r from-[var(--google-blue)] to-[#174ea6] bg-clip-text text-transparent">손해사정 법률분석센터</span>
            </h1>
            <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-lg mx-auto leading-relaxed font-medium">
              보험사의 억울한 거절과 삭감 주장도 명확한 판례가 있다면 방어할 수 있습니다. 겪으신 상황을 검색하시면 부합하는 법원 판결을 찾아드립니다.
            </p>
          </div>

          <div id="search-box-area" className="space-y-4">
            <div className="flex gap-2 flex-col sm:flex-row">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                placeholder="상황이나 키워드를 적어보세요 (예: 교통사고 합의금)"
                className="flex-1 px-4 py-3 sm:py-3.5 rounded-none border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/2 focus:outline-none focus:border-[var(--google-blue)] focus:ring-1 focus:ring-[var(--google-blue)] dark:text-white text-sm font-medium shadow-inner"
              />
              <button
                onClick={() => handleSearch(query)}
                disabled={loading}
                className="px-6 py-3 sm:py-3.5 rounded-none bg-[var(--google-blue)] hover:bg-[#174ea6] text-white font-bold text-sm tracking-wide shadow-md transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? '검색 중...' : '판례 검색'}
              </button>
            </div>

            {recentSearches.length > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-white/5 text-[11px] font-bold">
                <span className="text-[#9aa0a6] shrink-0">최근 검색:</span>
                <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                  {recentSearches.map((h, idx) => (
                    <button key={idx} onClick={() => handleSearch(h)} className="px-2 py-0.5 rounded-none hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 cursor-pointer text-[10px]">
                      {h}
                    </button>
                  ))}
                </div>
                <button onClick={clearRecent} className="text-gray-300 dark:text-gray-600 hover:text-[var(--google-red)] cursor-pointer shrink-0">지우기</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="bg-white dark:bg-[#202124] rounded-none py-16 px-4 text-center border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
          <div className="inline-block w-9 h-9 border-4 border-[var(--google-blue)] border-t-transparent rounded-full animate-spin" />
          <div className="text-sm font-bold text-[#202124] dark:text-[#e8eaed]">법제처 실시간 데이터 연동 분석 중...</div>
          <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] max-w-xs mx-auto leading-relaxed">
            국가법령 공동활용 API 시스템에서 판례 목록 전체를 확보하고 있습니다.
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-white dark:bg-[#202124] rounded-none py-12 px-5 border border-gray-100 dark:border-white/5 shadow-sm text-center space-y-3">
          <div className="text-sm font-bold text-gray-700 dark:text-gray-300">{error}</div>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-black text-[#202124] dark:text-[#e8eaed] mb-1 tracking-tight flex items-center gap-2">
            검색 결과 <span className="text-[var(--google-blue)]">{totalCount > 0 ? totalCount.toLocaleString() : results.length}</span>건
          </h2>

          <div className="flex flex-col border border-gray-200 dark:border-white/10 rounded-none bg-white dark:bg-[#202124] shadow-sm divide-y divide-gray-100 dark:divide-white/5">
            {results.map((prec) => {
              const isDetailOpen = openDetailId === prec.id;
              const isLoadingDetail = detailLoadingId === prec.id;
              const relatedPosts = getRelatedBlogPosts(prec);
              
              // 💡 초압축 리스트 뷰 UI
              return (
                <div key={prec.id} className="flex flex-col group transition-colors">
                  {/* 리스트 헤더 (클릭 가능 영역) */}
                  <div 
                    onClick={() => handleToggleDetail(prec)}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/2 transition-colors ${isDetailOpen ? 'bg-gray-50 dark:bg-white/2' : ''}`}
                  >
                    <div className="flex-1 min-w-0 space-y-1.5 pr-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {prec.caseType && (
                          <span className="px-2 py-0.5 rounded-none bg-blue-50 dark:bg-blue-900/20 text-[#1a73e8] dark:text-[#8ab4f8] text-[10px] font-bold border border-blue-100/30">
                            {prec.caseType}
                          </span>
                        )}
                        <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                          {prec.courtName || '법원'} {formatJudgmentDate(prec.judgmentDate)}
                        </span>
                      </div>
                      <h3 className="text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] leading-snug group-hover:text-[var(--google-blue)] transition-colors truncate">
                        {prec.title}
                      </h3>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">사건번호: {prec.caseNo}</p>
                    </div>
                    
                    {/* 우측 꺽쇠 화살표 */}
                    <div className="shrink-0 flex items-center justify-end sm:justify-center w-6 h-6 text-gray-300 group-hover:text-[var(--google-blue)] transition-colors">
                      <svg className={`w-5 h-5 transition-transform duration-300 ${isDetailOpen ? 'rotate-180 text-[var(--google-blue)]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* 아코디언 내용 펼쳐짐 영역 */}
                  {isDetailOpen && (
                    <div className="border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#202124] animate-in slide-in-from-top-2 duration-300">
                      {isLoadingDetail ? (
                        <div className="p-10 flex flex-col items-center justify-center space-y-3">
                          <div className="w-6 h-6 border-2 border-[var(--google-blue)] border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs text-gray-500 font-bold">법제처에서 판결 전문을 즉시 불러오는 중입니다...</span>
                        </div>
                      ) : (
                        <div className="p-5 sm:p-7 space-y-5">
                          {/* 판결 핵심 요지 */}
                          <div className="bg-blue-50/30 dark:bg-blue-950/20 p-4 rounded-none border border-blue-100/50 dark:border-blue-900/30 space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1a73e8] dark:text-[#8ab4f8]">
                              <span className="text-sm">⚖️</span> 판결 핵심 요지 및 미리보기
                            </div>
                            <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium whitespace-pre-wrap">
                              {prec.casePoints || prec.judgmentSummary || getSmartSummary('', prec.caseContent)}
                            </div>
                          </div>

                          {/* 실무 코멘트 (통합 AI 컴포넌트) */}
                          <AiCommentBox 
                            sourceText={[prec.title, prec.casePoints, prec.judgmentSummary, prec.caseContent].join('\n\n').slice(0, 4000)}
                            type="precedent"
                          />

                          {/* 원문 새창 버튼 */}
                          <div className="flex pt-1">
                            <a
                              href={prec.officialUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-250 dark:border-white/10 rounded-none text-[11px] font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto"
                            >
                              <span>🔗</span> 법제처 공식 원문 새창으로 열람하기
                            </a>
                          </div>

                          {/* 판결문 본문 (옵션) */}
                          {prec.caseContent && (
                            <div className="bg-gray-50/50 dark:bg-[#303134]/30 p-4 rounded-none border border-gray-200 dark:border-white/5 shadow-inner mt-4">
                              <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-white/5 pb-2 mb-2">
                                📜 대법원 공식 판결문 전문
                              </div>
                              <pre className="text-[11px] text-gray-600 dark:text-gray-400 font-medium leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-wrap font-sans pr-2">
                                {prec.caseContent}
                              </pre>
                            </div>
                          )}

                          {/* 액션 버튼 */}
                          <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-white/5 flex-col sm:flex-row">
                            {relatedPosts.length > 0 ? (
                              <Link href={`/blog/${relatedPosts[0].slug}`} target="_blank" className="w-full text-center py-3 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-[#202124] dark:text-[#e8eaed] text-xs font-bold transition-colors cursor-pointer">
                                📖 관련 분석 칼럼 읽기 ({relatedPosts.length}건)
                              </Link>
                            ) : (
                              <Link href="/blog" target="_blank" className="w-full text-center py-3 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-[#202124] dark:text-[#e8eaed] text-xs font-bold transition-colors cursor-pointer">
                                📖 보상스쿨 전체 칼럼 읽기
                              </Link>
                            )}
                            <button onClick={() => openChatWithContext(prec)} className="w-full text-center py-3 bg-[var(--google-blue)] hover:bg-[#174ea6] text-white text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer" id="precedent-chat-btn">
                              💬 무료 보상 검토 신청
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 더보기 버튼 */}
          {results.length < totalCount && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-8 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-[#202124] dark:text-[#e8eaed] text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 rounded-full min-w-[200px]"
              >
                {loadingMore ? '데이터 불러오는 중...' : `나머지 판례 더보기 (${results.length} / ${totalCount})`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ⚠️ 법률 면책 고지 배너 */}
      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-3.5 rounded-none flex items-start gap-2.5 text-xs font-semibold leading-relaxed shadow-sm mt-8">
        <span className="text-base shrink-0 mt-0.5">⚠️</span>
        <span>본 검색 시스템은 공공 API를 바탕으로 한 참고 정보이며, 어떠한 법률 자문도 대행하지 않습니다. 실제 지급 거절 등의 사안은 전문 손해사정사와 직접 상담하십시오.</span>
      </div>
    </div>
    </>
  );
}
