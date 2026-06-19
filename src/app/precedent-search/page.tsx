'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
}

// 텍스트 클리닝 헬퍼: 법제처 판결요지 및 판례본문의 HTML 태그와 엔티티를 정제하여 줄바꿈을 깔끔하게 유지합니다.
function cleanLawText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<br\s*\/?>/gi, '\n')              // <br> 태그를 줄바꿈 문자로 변환
    .replace(/<[^>]*>/g, '')                    // 기타 모든 HTML 태그 제거
    .replace(/&nbsp;/g, ' ')                    // 공백 문자 복원
    .replace(/&lt;/g, '<')                      // 기본 엔티티 디코딩
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')                 // 3회 이상 연속된 줄바꿈을 2회로 축소
    .trim();
}

// 세션 스토리지 기반 검색 캐싱: 불필요한 법제처 API 중복 호출을 방지하고 0ms 로딩 속도를 달성합니다.
const getCachedSearch = (query: string): Precedent[] | null => {
  try {
    const key = `prec_cache_${query.trim()}`;
    const cached = sessionStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

const setCachedSearch = (query: string, data: Precedent[]) => {
  try {
    const key = `prec_cache_${query.trim()}`;
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch {}
};



// 보상스쿨 AI 판례검색센터의 핵심 프론트엔드 컴포넌트입니다.

export default function PrecedentSearchPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Precedent[]>([]);
  const [error, setError] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [basket, setBasket] = useState<Precedent[]>([]);
  const [openDetailId, setOpenDetailId] = useState<string | null>(null);
  
  // 로컬 블로그 포스트 리스트 데이터 (실무 칼럼 매핑용)
  const [blogPosts, setBlogPosts] = useState<any[]>([]);

  // 자가진단 제거됨

  // AI 상태값 제거됨

  // 로컬스토리지 로드 및 블로그 포스트 정적 DB 로드
  useEffect(() => {
    const saved = localStorage.getItem('recent_prec_searches');
    if (saved) setRecentSearches(JSON.parse(saved));

    const savedBasket = localStorage.getItem('prec_basket');
    if (savedBasket) setBasket(JSON.parse(savedBasket));

    // API를 통해 포스트 데이터 불러오기
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

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    const trimmedQuery = searchQuery.trim();
    setQuery(trimmedQuery);
    setLoading(true);
    setError('');
    setResults([]);
    setOpenDetailId(null);
    saveSearch(trimmedQuery);

    // 1. 세션 캐시 조회 (0ms 즉시 반환으로 사용자 경험 극대화)
    const cached = getCachedSearch(trimmedQuery);
    if (cached) {
      setResults(cached);
      setLoading(false);
      return;
    }

    try {
      // 2. 법제처 API 목록 조회 (프록시 경로 호출)
      const listRes = await fetch(`/api/precedent?query=${encodeURIComponent(trimmedQuery)}`);
      if (!listRes.ok) {
        throw new Error(`목록 조회에 실패했습니다. (HTTP ${listRes.status})`);
      }
      
      const listXml = await listRes.text();
      if (listXml.includes('사용자 정보 검증에 실패하였습니다')) {
        setError('법제처 API 인증 실패: 등록된 IP와 현재 요청 IP가 일치하지 않거나 서버 동기화 지연 중입니다.');
        setLoading(false);
        return;
      }

      // 브라우저의 Native DOMParser 사용 (서버 렌더링 시점에는 실행되지 않는 이벤트 핸들러 내부이므로 안전)
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(listXml, "text/xml");
      
      // XML 파싱 에러 검출
      const parserError = xmlDoc.getElementsByTagName('parsererror')[0];
      if (parserError) {
        throw new Error('법제처 응답 XML 파싱 중 오류가 발생했습니다.');
      }

      const ids = Array.from(xmlDoc.getElementsByTagName('판례일련번호')).map(el => el.textContent?.trim() || '');
      const titles = Array.from(xmlDoc.getElementsByTagName('사건명')).map(el => el.textContent?.trim() || '');
      const caseNos = Array.from(xmlDoc.getElementsByTagName('사건번호')).map(el => el.textContent?.trim() || '');

      if (ids.length === 0) {
        setError('입력하신 조건과 일치하는 판례 데이터를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      // 검색 속도 및 API 호출 부하 절약을 위해 상위 5건만 상세 조회 수행
      const targetIds = ids.slice(0, 5);
      const precedentDetails = await Promise.all(
        targetIds.map(async (id, index) => {
          try {
            const detailRes = await fetch(`/api/precedent-detail?ID=${id}`);
            if (!detailRes.ok) return null;

            const detailXml = await detailRes.text();
            const detailDoc = parser.parseFromString(detailXml, "text/xml");
            
            // XML 파싱 에러 검출
            if (detailDoc.getElementsByTagName('parsererror')[0]) return null;

            const getValue = (tagName: string) => {
              const el = detailDoc.getElementsByTagName(tagName)[0];
              return el?.textContent?.trim() || '';
            };

            return {
              id,
              title: titles[index] || getValue('사건명'),
              caseNo: caseNos[index] || getValue('사건번호'),
              judgmentDate: getValue('선고일자'),
              courtName: getValue('법원명'),
              judgmentSummary: cleanLawText(getValue('판결요지')),
              caseContent: cleanLawText(getValue('판례내용')),
              caseType: getValue('사건종류명'),
              officialUrl: `https://www.law.go.kr/LSW/precInfoP.do?precSeq=${id}`
            };
          } catch {
            return null;
          }
        })
      );

      const parsedData = precedentDetails.filter((item): item is Precedent => item !== null);
      setResults(parsedData);
      
      if (parsedData.length === 0) {
        setError('입력하신 조건과 일치하는 판례 상세 정보를 불러오지 못했습니다.');
      } else {
        // 세션 캐시에 검색 결과 저장
        setCachedSearch(trimmedQuery, parsedData);
      }
    } catch (err: any) {
      console.error(err);
      setError('법제처 API 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const toggleBasket = (prec: Precedent) => {
    let next;
    if (basket.some(x => x.id === prec.id)) {
      next = basket.filter(x => x.id !== prec.id);
    } else {
      next = [...basket, prec];
    }
    setBasket(next);
    localStorage.setItem('prec_basket', JSON.stringify(next));
  };

  // handleRequestAiSummary 제거됨

  // 자가진단 핸들러 제거됨

  // 대법원 판례에 해당되는 보상스쿨의 전문 해설글 자동 매핑 알고리즘
  const getRelatedBlogPosts = (prec: Precedent) => {
    if (blogPosts.length === 0) return [];
    
    return blogPosts.filter(post => {
      // 1. 사건번호가 마크다운 frontmatter에 있는 caseNumber와 일치하는지 비교 (빈칸 제거 후 비교)
      if (post.caseNumber && prec.caseNo) {
        const pNum = post.caseNumber.replace(/\s+/g, '');
        const cNum = prec.caseNo.replace(/\s+/g, '');
        if (pNum.includes(cNum) || cNum.includes(pNum)) return true;
      }
      
      // 2. 제목 내 주요 매칭 키워드가 겹치는지 비교
      const titleLower = prec.title.toLowerCase();
      const postTitleLower = post.title.toLowerCase();
      const matchKeywords = ['기왕증', '압박골절', '자살', '사망보험금', '백내장', '도수치료', '실손', '교통사고', '장해', '배상책임'];
      
      return matchKeywords.some(kw => titleLower.includes(kw) && postTitleLower.includes(kw));
    }).slice(0, 2); // 최대 2개의 연계 포스트만 노출
  };

  // 상담 신청용 URL 빌더
  const getKakaoLink = () => {
    const precList = basket.map(x => `${x.caseNo} (${x.title})`).join(', ');
    const text = `안녕하세요 대표님, 보상스쿨 AI판례센터에서 [${precList}] 판례를 바탕으로 무료 손해사정 가능성 검토를 요청합니다.`;
    return `https://open.kakao.com/o/sWeszp7?text=${encodeURIComponent(text)}`;
  };

  const getFormLink = () => {
    const precList = basket.map(x => `${x.caseNo}(${x.title})`).join(', ');
    return `https://forms.gle/E9vj7iqAHeJGhJ549?entry_prec=${encodeURIComponent(precList)}`;
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* ⚠️ 법률 면책 고지 배너 */}
      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-semibold leading-relaxed shadow-sm">
        <span className="text-base shrink-0 mt-0.5">⚠️</span>
        <span>본 판례 검색 시스템은 법제처 공공 API에 기반하여 참고용 판례 정보를 제공하며, 어떠한 법률 자문 대행도 하지 않습니다. 실제 지급 거절 및 삭감 대처 시에는 반드시 전문 손해사정사와 상담하십시오.</span>
      </div>

      {/* 헤더 타이틀 */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202124] dark:text-[#e8eaed] tracking-tight">
          보상스쿨 <span className="bg-gradient-to-r from-[var(--google-blue)] to-[#174ea6] bg-clip-text text-transparent">AI 판례검색센터</span>
        </h1>
        <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-lg mx-auto leading-relaxed">
          보험사가 주장하는 까다로운 법률 핑계에 기죽지 마세요. 억울한 보상 사연을 평소 대화하듯 편하게 작성하시면 실시간 법제처 데이터를 매칭해 드립니다.
        </p>
      </div>

      {/* 상황 마법사 제거됨 */}

      {/* 검색 박스 영역 */}
      <div className="bg-white dark:bg-[#202124] p-5 sm:p-7 rounded-3xl border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-4">
        <div className="flex gap-2 flex-col sm:flex-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
            placeholder="상황이나 키워드를 적어보세요 (예: 교통사고 과실 합의금 삭감)"
            className="flex-1 px-4 py-3 sm:py-3.5 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/2 focus:outline-none focus:border-[var(--google-blue)] focus:ring-1 focus:ring-[var(--google-blue)] dark:text-white text-sm font-medium shadow-inner"
          />
          <button
            onClick={() => handleSearch(query)}
            disabled={loading}
            className="px-6 py-3 sm:py-3.5 rounded-xl bg-[var(--google-blue)] hover:bg-[#174ea6] text-white font-bold text-sm tracking-wide shadow-md transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? '검색 중...' : '판례 검색'}
          </button>
        </div>

        {/* 최근 검색어 */}
        {recentSearches.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-white/5 text-[11px] font-bold">
            <span className="text-[#9aa0a6] shrink-0">최근 검색:</span>
            <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
              {recentSearches.map((h, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSearch(h)}
                  className="px-2 py-0.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 cursor-pointer text-[10px]"
                >
                  {h}
                </button>
              ))}
            </div>
            <button onClick={clearRecent} className="text-gray-300 dark:text-gray-600 hover:text-[var(--google-red)] cursor-pointer shrink-0">지우기</button>
          </div>
        )}
      </div>

      {/* 📥 보상 바구니 현황 바 */}
      {basket.length > 0 && (
        <div className="bg-[#e8f0fe] dark:bg-[#174ea6]/20 p-4 sm:p-5 rounded-2xl border border-[#d2e3fc]/30 flex items-center justify-between flex-wrap gap-3.5 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="text-lg">📥</span>
            <div>
              <div className="text-xs font-bold text-[#202124] dark:text-[#e8eaed]">
                보상 상담 바구니에 판례가 담겼습니다! (<span className="text-[var(--google-blue)] dark:text-[#8ab4f8] font-extrabold">{basket.length}건</span>)
              </div>
              <div className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed mt-0.5">상담 신청 시 선택한 판례 목록이 자동으로 전달되어 더욱 유리하고 현실적인 보상 전략을 컨설팅 해드립니다.</div>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href={getKakaoLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-amber-400 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              카톡 상담신청
            </a>
            <a
              href={getFormLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-[var(--google-blue)] hover:bg-[#174ea6] text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              상담 신청서 작성
            </a>
          </div>
        </div>
      )}

      {/* 검색 진행상태 및 로딩창 */}
      {loading && (
        <div className="bg-white dark:bg-[#202124] rounded-3xl py-16 px-4 text-center border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
          <div className="inline-block w-9 h-9 border-4 border-[var(--google-blue)] border-t-transparent rounded-full animate-spin" />
          <div className="text-sm font-bold text-[#202124] dark:text-[#e8eaed]">AI 기반 법제처 실시간 데이터 연동 분석 중...</div>
          <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] max-w-xs mx-auto leading-relaxed">
            국가법령 공동활용 API 시스템을 거쳐 유사도 기준 최상위에 해당하는 공식 판결문 요지를 확보하고 있습니다.
          </p>
        </div>
      )}

      {/* 에러 및 안내 메시지 */}
      {error && !loading && (
        <div className="bg-white dark:bg-[#202124] rounded-3xl py-12 px-5 border border-gray-100 dark:border-white/5 shadow-sm text-center space-y-3">
          <div className="text-sm font-bold text-gray-700 dark:text-gray-300">{error}</div>
          
          {error.includes('인증 실패') && (
            <div className="text-xs text-gray-500 dark:text-gray-400 max-w-lg mx-auto leading-relaxed space-y-1.5 bg-gray-50 dark:bg-white/2 p-3.5 rounded-xl border border-gray-150 dark:border-white/5">
              <div className="font-bold text-[var(--google-blue)] dark:text-[#8ab4f8]">💡 법제처 API IP 인증에 실패한 경우의 해결 방법:</div>
              <p>법제처 API는 국가에서 지정한 고정 IP 서버에서만 조회가 가능합니다. 현재 구글 클라우드(GCP) 중계 서버의 <b>고정 외부 IP</b>가 법제처 오픈 API 센터 마이페이지에 올바르게 등록되지 않았거나, 중계 서버 프로그램이 꺼져 있을 때 발생합니다.</p>
              <p className="font-bold text-[10px] text-gray-400">구글 클라우드 콘솔에서 발급받은 고정 IP 주소를 법제처 오픈 API 센터(open.law.go.kr) 마이페이지의 IP 주소 변경 메뉴에 등록해 주시면 정상 가동됩니다.</p>
            </div>
          )}
        </div>
      )}

      {/* 검색 결과 목록 */}
      {!loading && results.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-base sm:text-lg font-bold text-[#202124] dark:text-[#e8eaed] border-b border-gray-100 dark:border-white/5 pb-2">
            유사 법원 판례 검색 결과 총 <span className="text-[var(--google-blue)] dark:text-[#8ab4f8]">{results.length}</span>건
          </h2>

          <div className="space-y-6">
            {results.map((prec) => {
              const isDetailOpen = openDetailId === prec.id;
              const isAdded = basket.some(x => x.id === prec.id);
              // 🔗 보상스쿨 블로그 내 관련 분석글 가져오기
              const relatedPosts = getRelatedBlogPosts(prec);
              
              return (
                <article
                  key={prec.id}
                  className="bg-white dark:bg-[#2b2c2f] rounded-2xl border border-gray-200/60 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-y-[-2px] p-6 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* 상단 메타데이터 배지 */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-[#1a73e8] dark:text-[#8ab4f8] text-[10px] sm:text-xs font-bold tracking-tight">
                          🏛️ {prec.courtName || '법원'}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs font-semibold">
                          📅 {prec.judgmentDate || '선고일'}
                        </span>
                        {prec.caseType && (
                          <span className="px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 text-[10px] sm:text-xs font-semibold">
                            {prec.caseType}
                          </span>
                        )}
                      </div>
                      
                      {/* 담기 버튼 */}
                      <div className="shrink-0">
                        <button
                          onClick={() => toggleBasket(prec)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs ${
                            isAdded 
                              ? 'bg-rose-500 hover:bg-rose-600 text-white' 
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-[#3f3f42] dark:hover:bg-[#4d4d50] dark:text-gray-200'
                          }`}
                        >
                          {isAdded ? '❌ 바구니 제외' : '📥 상담 보관함 담기'}
                        </button>
                      </div>
                    </div>

                    {/* 제목 및 판례 사건번호 */}
                    <div className="space-y-1.5">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 leading-snug">
                        {prec.title}
                      </h3>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-blue-50/50 dark:bg-blue-950/20 text-[11px] font-bold text-[var(--google-blue)] dark:text-[#8ab4f8] border border-blue-100/30">
                        ⚖️ 공식 판례번호: {prec.caseNo}
                      </div>
                    </div>

                    {/* 판례 내용 기반 콤팩트 요약 프리뷰 (세련된 인용구 스타일) */}
                    <div className="bg-slate-50/50 dark:bg-black/10 p-4 rounded-xl text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium border-l-2 border-[var(--google-blue)] dark:border-[#8ab4f8]">
                      <div className="font-extrabold text-gray-900 dark:text-white mb-1 flex items-center gap-1 text-[11px] tracking-wide uppercase">
                        🔍 판례 요약 (줄거리)
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 font-medium">
                        {prec.judgmentSummary 
                          ? (prec.judgmentSummary.length > 150 ? prec.judgmentSummary.slice(0, 150) + '...' : prec.judgmentSummary)
                          : (prec.caseContent ? (prec.caseContent.length > 150 ? prec.caseContent.slice(0, 150) + '...' : prec.caseContent) : '판례 상세 내용을 확인해 주세요.')
                        }
                      </p>
                    </div>

                    {/* 🔗 보상스쿨 블로그 내 유사 보상 분석 칼럼 연동 */}
                    {relatedPosts.length > 0 && (
                      <div className="border-t border-dashed border-gray-200 dark:border-white/10 pt-4 mt-2">
                        <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-2.5 flex items-center gap-1">
                          📚 이 판례와 연결된 보상스쿨 전문 칼럼:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {relatedPosts.map((post: any) => (
                            <Link
                              key={post.slug}
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-3 rounded-xl border border-gray-200/60 dark:border-white/5 bg-white dark:bg-[#202124] hover:bg-[#e8f0fe]/20 dark:hover:bg-[#174ea6]/10 hover:border-[#8ab4f8]/30 transition-all duration-200 text-xs font-bold text-gray-800 dark:text-gray-200 shadow-xs hover:shadow-sm"
                            >
                              <span className="truncate pr-2 font-semibold">{post.title}</span>
                              <span className="text-[10px] text-[var(--google-blue)] dark:text-[#8ab4f8] shrink-0 font-bold hover:underline flex items-center gap-0.5">
                                읽기 🔗
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 판결문 전문 아코디언 */}
                    {prec.caseContent && (
                      <div className="space-y-2 pt-2">
                        <button
                          onClick={() => setOpenDetailId(isDetailOpen ? null : prec.id)}
                          className="w-full flex items-center justify-between p-3 bg-gray-50/50 dark:bg-black/10 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-[var(--google-blue)] dark:hover:text-[#8ab4f8] transition-all duration-200 cursor-pointer border border-gray-150 dark:border-white/5 hover:border-[var(--google-blue)]/20"
                        >
                          <span className="flex items-center gap-1.5">
                            <span>📜</span>
                            {isDetailOpen ? '공식 판결문 전문 접기' : '공식 판결문 전문 전체 확인하기'}
                          </span>
                          <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${isDetailOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                        
                        {isDetailOpen && (
                          <div className="p-4 bg-slate-50/20 dark:bg-black/10 rounded-xl border border-gray-150 dark:border-white/5 animate-in slide-in-from-top-2 duration-200">
                            <pre className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-h-[350px] overflow-y-auto whitespace-pre-wrap font-sans pr-2">
                              {prec.caseContent}
                            </pre>
                            <div className="mt-4 pt-3 border-t border-gray-250/20 dark:border-white/5 flex items-center justify-between text-[10px] font-bold">
                              <span className="text-gray-400 dark:text-gray-500">출처: 국가법령정보공동활용 API</span>
                              <a
                                href={prec.officialUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--google-blue)] dark:text-[#8ab4f8] hover:underline flex items-center gap-1"
                              >
                                법제처 원문 새창 보기 🔗
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* 사전 섹션 제거됨 */}
    </div>
  );
}
