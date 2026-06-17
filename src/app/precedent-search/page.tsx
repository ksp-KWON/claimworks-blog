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

const RECOMMEND_KEYWORDS = [
  '척추골절 기왕증',
  '자살 재해사망',
  '회전근개 파열 교통사고',
  '백내장 실손의료비',
  '음주운전 면책',
  '산재 신청 불승인'
];

const LAW_DICTIONARY: Record<string, string> = {
  '기왕증': '사고 이전에 환자가 이미 가지고 있던 질병이나 체질적 요인입니다. 보험사는 이를 이유로 보상금을 자주 삭감하려 합니다.',
  '일실수입': '사고로 인해 앞으로 벌지 못하게 된 장래의 소득 손실액입니다. 합의금 산정 시 가장 큰 비중을 차지합니다.',
  '상당인과관계': '사고와 부상/사망 사이에 상식적으로 인정되는 인과관계입니다. 이것이 증명되어야 보상을 받을 수 있습니다.',
  '과실상계': '피해자의 잘못(과실) 비율만큼 보상금에서 공제하는 제도입니다.',
  '맥브라이드': '노동능력 상실률을 평가할 때 사용하는 전 세계적인 의학 기준표입니다. 후유장해 보험금 산정의 기초가 됩니다.',
  '면책': '보험회사가 보험금 지급 의무를 면하는 것(부지급)을 의미합니다. 소비자가 가장 경계해야 할 단어입니다.',
  '휴업손해': '치료 기간 동안 일하지 못해 발생한 소득 감소분 보상액입니다.'
};

export default function PrecedentSearchPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Precedent[]>([]);
  const [error, setError] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [basket, setBasket] = useState<Precedent[]>([]);
  const [openDetailId, setOpenDetailId] = useState<string | null>(null);

  // 로컬스토리지 로드
  useEffect(() => {
    const saved = localStorage.getItem('recent_prec_searches');
    if (saved) setRecentSearches(JSON.parse(saved));

    const savedBasket = localStorage.getItem('prec_basket');
    if (savedBasket) setBasket(JSON.parse(savedBasket));
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
    setQuery(searchQuery);
    setLoading(true);
    setError('');
    setResults([]);
    setOpenDetailId(null);
    saveSearch(searchQuery.trim());

    try {
      const res = await fetch(`/api/precedent?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();

      if (data.success) {
        setResults(data.data || []);
        if (data.data.length === 0) {
          setError('입력하신 조건과 일치하는 판례 데이터를 찾을 수 없습니다.');
        }
      } else {
        setError(data.error || '검색 과정에서 오류가 발생했습니다.');
      }
    } catch {
      setError('서버와 연결할 수 없습니다. 인터넷 상태를 확인해 주세요.');
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

  // 상담 신청용 URL 빌더 (카카오톡 및 상담 신청 폼용 정보 주입)
  const getKakaoLink = () => {
    const precList = basket.map(x => `${x.caseNo} (${x.title})`).join(', ');
    const text = `안녕하세요 대표님, 보상스쿨 판례검색센터에서 [${precList}] 판례를 담아 보상 가능성 상담을 신청합니다.`;
    return `https://open.kakao.com/o/sWeszp7?text=${encodeURIComponent(text)}`;
  };

  const getFormLink = () => {
    const precList = basket.map(x => `${x.caseNo}(${x.title})`).join(', ');
    // 구글설문지 사전기입 파라미터가 없더라도, URL 쿼리 파라미터로 붙여두어 연동 흔적을 남김
    return `https://forms.gle/E9vj7iqAHeJGhJ549?entry_prec=${encodeURIComponent(precList)}`;
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* ⚠️ 법률 면책 고지 배너 */}
      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-semibold leading-relaxed shadow-sm">
        <span className="text-base shrink-0 mt-0.5">⚠️</span>
        <span>본 판례 검색 시스템은 참고용 보상 정보를 제공하며, 어떠한 법률 자문 대행도 하지 않습니다. 정확한 장해율 평가 및 보험금 사정 청구는 반드시 전문 손해사정사와 상담하여 주시기 바랍니다.</span>
      </div>

      {/* 헤더 타이틀 */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202124] dark:text-[#e8eaed] tracking-tight">
          보상스쿨 <span className="bg-gradient-to-r from-[var(--google-blue)] to-[var(--google-red)] bg-clip-text text-transparent">AI 판례검색센터</span>
        </h1>
        <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-lg mx-auto leading-relaxed">
          구구절절한 사연도 괜찮습니다. 평소 쓰는 일상어로 사연을 적어주시면 AI와 실시간 데이터 연동을 통해 손해사정 맞춤형 법원 판례를 찾아드립니다.
        </p>
      </div>

      {/* 검색 박스 영역 */}
      <div className="bg-white dark:bg-[#202124] p-5 sm:p-7 rounded-3xl border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-4">
        <div className="flex gap-2 flex-col sm:flex-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
            placeholder="예: 교통사고 척추 골절 후유장해 장해율 분쟁"
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

        {/* 💡 추천 검색 칩 */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-[#5f6368] dark:text-[#9aa0a6]">💡 추천 키워드로 빠르게 찾아보세요:</div>
          <div className="flex flex-wrap gap-1.5">
            {RECOMMEND_KEYWORDS.map(kw => (
              <button
                key={kw}
                onClick={() => handleSearch(kw)}
                className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-gray-50 hover:bg-[#e8f0fe] dark:bg-[#303134] dark:hover:bg-[#174ea6]/20 border border-gray-100 dark:border-white/5 hover:border-[var(--google-blue)] text-[#5f6368] dark:text-[#c4c7c5] hover:text-[var(--google-blue)] dark:hover:text-[#8ab4f8] transition-all cursor-pointer"
              >
                {kw}
              </button>
            ))}
          </div>
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
        <div className="bg-[#e8f0fe] dark:bg-[#174ea6]/20 p-4 sm:p-5 rounded-2xl border border-[var(--google-blue)]/30 flex items-center justify-between flex-wrap gap-3.5 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="text-lg">📥</span>
            <div>
              <div className="text-xs font-bold text-[#202124] dark:text-[#e8eaed]">
                보상 상담 바구니에 판례가 담겼습니다! (<span className="text-[var(--google-blue)] font-extrabold">{basket.length}건</span>)
              </div>
              <div className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed mt-0.5">상담 신청 시 담아둔 판례 목록이 자동으로 전달되어 더욱 정확한 대안 소견을 드립니다.</div>
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
              className="px-3.5 py-2 bg-[var(--google-blue)] hover:bg-[#1557b0] text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
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
          <div className="text-sm font-bold text-[#202124] dark:text-[#e8eaed]">AI 기반 실시간 법제처 판례 분석 중...</div>
          <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] max-w-xs mx-auto leading-relaxed">
            법제처 API를 통해 실시간으로 판례 목록을 수집하여 유사한 보상 분쟁 원문을 수합하고 있습니다.
          </p>
        </div>
      )}

      {/* 에러 및 안내 메시지 */}
      {error && !loading && (
        <div className="bg-white dark:bg-[#202124] rounded-3xl py-12 px-4 text-center border border-gray-100 dark:border-white/5 shadow-sm text-sm font-bold text-[#5f6368] dark:text-[#9aa0a6]">
          {error}
        </div>
      )}

      {/* 검색 결과 목록 */}
      {!loading && results.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-base sm:text-lg font-bold text-[#202124] dark:text-[#e8eaed] border-b border-gray-100 dark:border-white/5 pb-2">
            검색 결과 총 <span className="text-[var(--google-blue)]">{results.length}</span>건
          </h2>

          <div className="space-y-4">
            {results.map((prec) => {
              const isDetailOpen = openDetailId === prec.id;
              const isAdded = basket.some(x => x.id === prec.id);
              
              return (
                <article
                  key={prec.id}
                  className="bg-white dark:bg-[#202124] rounded-[24px] border border-gray-100 dark:border-white/5 shadow-[0_8px_25px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] p-5 sm:p-6 hover:border-[var(--google-blue)] transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* 상단 메타데이터 배지 */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                          {prec.courtName || '법원'}
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-[10px] font-bold">
                          {prec.judgmentDate || '선고일'}
                        </span>
                        {prec.caseType && (
                          <span className="px-2.5 py-1 rounded-md bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 text-[10px] font-bold">
                            {prec.caseType}
                          </span>
                        )}
                      </div>
                      
                      {/* 담기 버튼 */}
                      <button
                        onClick={() => toggleBasket(prec)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                          isAdded 
                            ? 'bg-[var(--google-red)] text-white hover:bg-[#d93025]' 
                            : 'bg-[#e8f0fe] hover:bg-[#d2e3fc] text-[var(--google-blue)]'
                        }`}
                      >
                        {isAdded ? '❌ 바구니에서 제외' : '📥 상담 바구니 담기'}
                      </button>
                    </div>

                    {/* 제목 및 판례 사건번호 (매우 중요) */}
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-[#202124] dark:text-[#e8eaed] leading-snug">
                        {prec.title}
                      </h3>
                      {/* 판례번호 명시적 굵게 노출 적용 */}
                      <div className="text-sm font-extrabold text-[var(--google-blue)] dark:text-[#8ab4f8] mt-1 flex items-center gap-1.5">
                        <span className="text-xs">⚖️ 판례번호:</span> {prec.caseNo}
                      </div>
                    </div>

                    {/* 판결 요지 */}
                    {prec.judgmentSummary && (
                      <div className="bg-gray-50 dark:bg-white/2 p-4 rounded-xl text-xs sm:text-sm text-gray-600 dark:text-[#9aa0a6] leading-relaxed break-all font-medium border border-gray-100/50 dark:border-white/2">
                        <div className="font-bold text-[#202124] dark:text-[#e8eaed] mb-1.5 flex items-center gap-1 text-[11px] text-[var(--google-yellow)]">
                          <span>📝</span> 판결 요약 및 요지
                        </div>
                        {prec.judgmentSummary}
                      </div>
                    )}

                    {/* 판결문 전문 아코디언 */}
                    {prec.caseContent && (
                      <div className="space-y-2 pt-1">
                        <button
                          onClick={() => setOpenDetailId(isDetailOpen ? null : prec.id)}
                          className="w-full flex items-center justify-between p-2.5 bg-gray-50/50 dark:bg-white/2 rounded-xl text-xs font-bold text-[#5f6368] dark:text-zinc-400 hover:text-[var(--google-blue)] transition-colors cursor-pointer border border-transparent hover:border-[var(--google-blue)]/20"
                        >
                          <span className="flex items-center gap-1.5">
                            <span>📜</span>
                            {isDetailOpen ? '공식 판결문 전문 접기' : '공식 판결문 전문 전체 확인하기'}
                          </span>
                          <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isDetailOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                        
                        {isDetailOpen && (
                          <div className="p-4 bg-gray-50/20 dark:bg-white/1 rounded-xl border border-gray-100 dark:border-white/5 animate-in slide-in-from-top-2 duration-200">
                            <pre className="text-xs text-gray-500 dark:text-[#9aa0a6] font-medium leading-relaxed max-h-[350px] overflow-y-auto whitespace-pre-wrap font-sans pr-2">
                              {prec.caseContent}
                            </pre>
                            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-[11px] font-bold">
                              <span className="text-[#9aa0a6]">데이터 출처: 국가법령정보공동활용 API</span>
                              <a
                                href={prec.officialUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--google-blue)] hover:underline flex items-center gap-1"
                              >
                                법제처 공식 사이트에서 보기 (새창) 🔗
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

      {/* 💡 판례 속 쉬운 보상 단어 사전 */}
      <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2 border-l-4 border-[var(--google-yellow)] pl-2.5">
          <span className="text-[var(--google-yellow)] text-lg leading-none">📖</span>
          판례 속 어려운 단어 사전
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {Object.entries(LAW_DICTIONARY).map(([word, desc]) => (
            <div key={word} className="p-3 bg-gray-50/50 dark:bg-white/2 rounded-xl border border-gray-100/50 dark:border-white/2">
              <span className="font-extrabold text-[var(--google-blue)] dark:text-[#8ab4f8] text-[13px]">{word}</span>
              <p className="text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
