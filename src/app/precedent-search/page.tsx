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



// 🧭 상황별 검색 마법사 템플릿
const SITUATION_TEMPLATES = [
  { 
    title: '🛡️ 보험사 기왕증 삭감 주장', 
    desc: '사고 이전 병력을 핑계로 합의금을 깎으려 할 때', 
    query: '보험사 기왕증 공제 과실상계 대법원' 
  },
  { 
    title: '🤕 척추/사지 골절 후유장해', 
    desc: '압박골절 등 후유증 평가를 거절하거나 삭감할 때', 
    query: '추간판탈출증 압박골절 후유장해 보험금 지급 거절' 
  },
  { 
    title: '🏥 백내장/도수치료 실비 거절', 
    desc: '실손의료비 부지급 면책 사유를 들이밀 때', 
    query: '백내장 도수치료 실손의료비 면책 약관' 
  },
  { 
    title: '🎗️ 자살/재해 사망보험금 분쟁', 
    desc: '자살 등 고의사고를 이유로 재해 사망금을 안 줄 때', 
    query: '자살 재해사망보험금 고의사고 면책 예외 우울증' 
  },
  { 
    title: '🚗 교통사고 과실비율 & 소득', 
    desc: '과실비율 억울함 및 일실수입 산정 분쟁 시', 
    query: '교통사고 후유장해 일실수입 맥브라이드 노동능력상실률' 
  },
  { 
    title: '🏢 배상책임 및 의료 과실', 
    desc: '시설물 사고나 병원 과실 등 배상책임 분쟁 시', 
    query: '영업배상책임 의료과실 신체장해 손해배상액 산정' 
  }
];

// 📖 핵심 보상 실무 단어 사전 데이터
const LAW_DICTIONARY = [
  {
    term: '기왕증 (기존 질환)',
    desc: '사고 발생 이전에 피해자가 이미 가지고 있던 질병이나 체질적 요인입니다.',
    tip: '보험사는 사고와 상관없는 기존 질환이라며 합의금을 크게 삭감하려 하므로, 의학적 자료를 근거로 한 기왕증 관여도(기여율) 평가를 철저히 검토해야 합니다.'
  },
  {
    term: '일실수입 (소득 손실액)',
    desc: '사고로 장해를 입어 미래에 벌지 못하게 된 소득의 감소 예상분입니다.',
    tip: '세금 신고 소득뿐만 아니라 무직자, 주부, 학생도 일용근로자 기준 소득으로 정당하게 청구할 수 있으므로 법적 기준의 정확한 계산이 중요합니다.'
  },
  {
    term: '맥브라이드 후유장해',
    desc: '노동능력 상실률을 평가할 때 법원과 보험업계가 표준으로 삼는 전 세계적인 의학 기준표입니다.',
    tip: '주치의가 써준 후유장해진단서에 맥브라이드 방식에 따른 구체적 장해율과 한시/영구 여부가 올바르게 명시되어야 보험금 지급이 거절되지 않습니다.'
  },
  {
    term: '상당인과관계',
    desc: '사고라는 유발 원인과 부상/사망이라는 결과 사이에 인정되는 합리적인 인과고리입니다.',
    tip: '보험사가 지급 거절 시 가장 흔히 주장하는 논리입니다. 사고 당시 정황 자료와 의학적 인과관계 소견서 및 유사 판례를 통해 이를 역입증해야 합니다.'
  },
  {
    term: '설명의무 위반 (약관 무효화)',
    desc: '보험에 가입할 당시 보험사 측이 중요 약관 내용이나 면책 사항을 자세히 설명하지 않은 법적 과실입니다.',
    tip: '보험사가 어려운 약관 조항을 근거로 보험금 부지급을 내세울 때, 가입 당시 설명의무 위반을 규명하면 해당 약관 규정 자체를 무효화시킬 수 있습니다.'
  },
  {
    term: '소비자 손해사정사 선임권',
    desc: '보험사가 배정하는 조사 법인 대신 소비자가 직접 독립 손해사정사를 지정하여 청구조사를 맡길 수 있는 법적 권리입니다.',
    tip: '보험 청구 접수 후 일정 기한 내에 선임 의사를 서면 통보하면, 보험사 부담 비용으로 객관적이고 공정한 독립 조사를 받을 수 있습니다.'
  }
];

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

  // 수집된 정적 판례 데이터베이스 (CORS 및 IP 차단을 원천 방지하기 위한 100% 로컬 검색 엔진)
  const [precedentsDb, setPrecedentsDb] = useState<Precedent[]>([]);

  // 자가진단 선택 체크 상태 추적용
  const [checklistState, setChecklistState] = useState<Record<string, boolean[]>>({});

  // 로컬스토리지 로드 및 블로그 포스트 정적 DB 로드
  useEffect(() => {
    const saved = localStorage.getItem('recent_prec_searches');
    if (saved) setRecentSearches(JSON.parse(saved));

    const savedBasket = localStorage.getItem('prec_basket');
    if (savedBasket) setBasket(JSON.parse(savedBasket));

    // prebuild 단계에서 public/data/posts-data.json에 저장된 포스트 데이터 불러오기
    fetch('/data/posts-data.json')
      .then(res => res.json())
      .then(data => setBlogPosts(data))
      .catch(err => console.warn('블로그 포스트 연동 로드 실패:', err));

    // 수집 완료된 정적 판례 데이터베이스 불러오기
    fetch('/data/precedents-db.json')
      .then(res => res.json())
      .then(data => setPrecedentsDb(data))
      .catch(err => console.warn('정적 판례 데이터베이스 로드 실패:', err));
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

    try {
      // 1. 이미 로드된 정적 DB 확보 (혹시 모를 미로드 대비 지연 로드 지원)
      let db = precedentsDb;
      if (db.length === 0) {
        const res = await fetch('/data/precedents-db.json');
        if (res.ok) {
          db = await res.json();
          setPrecedentsDb(db);
        }
      }

      if (db.length === 0) {
        setError('판례 데이터베이스를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
        setLoading(false);
        return;
      }

      // 2. 다중 키워드 매칭 및 가중치 기반 클라이언트 검색 구현 (의미/키워드 통합)
      // 검색어를 공백 단위로 쪼개어 개별 키워드 복합 매칭을 지원합니다.
      const keywords = trimmedQuery.toLowerCase().split(/\s+/).filter(Boolean);
      
      const scoredResults = db.map(prec => {
        let score = 0;
        const titleLower = prec.title.toLowerCase();
        const caseNoLower = prec.caseNo.toLowerCase();
        const summaryLower = prec.judgmentSummary.toLowerCase();
        const contentLower = prec.caseContent.toLowerCase();

        keywords.forEach(kw => {
          // 중요 정보 노출 영역별 차등 가중치 적용
          if (titleLower.includes(kw)) score += 15;        // 제목 일치 가중치
          if (caseNoLower.includes(kw)) score += 10;       // 사건번호 일치 가중치
          if (summaryLower.includes(kw)) score += 3;       // 판결요지 일치 가중치
          if (contentLower.includes(kw)) score += 1;       // 판결본문 일치 가중치
        });

        return { prec, score };
      }).filter(item => item.score > 0);

      // 점수가 높은 순으로 내림차순 정렬 후 상위 5건만 결과로 제공
      scoredResults.sort((a, b) => b.score - a.score);
      const topResults = scoredResults.slice(0, 5).map(item => item.prec);

      setResults(topResults);
      if (topResults.length === 0) {
        setError('입력하신 조건과 일치하는 판례 데이터를 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error(err);
      setError('검색 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
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

  // 1분 자가진단 체크박스 토글
  const handleChecklistChange = (precId: string, index: number) => {
    const current = checklistState[precId] || [false, false, false, false];
    const next = [...current];
    next[index] = !next[index];
    setChecklistState({
      ...checklistState,
      [precId]: next
    });
  };

  // 자가진단 조건 부합 개수 계산
  const getCheckedCount = (precId: string) => {
    const current = checklistState[precId] || [false, false, false, false];
    return current.filter(Boolean).length;
  };

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

      {/* 🧭 상황별 검색 마법사 (원클릭 퀵 검색) */}
      <div className="space-y-3 bg-gray-50/50 dark:bg-white/1 p-5 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
        <h2 className="text-xs font-extrabold text-[#5f6368] dark:text-[#9aa0a6] flex items-center gap-1.5 uppercase tracking-wider mb-1">
          <span>🧭</span>
          해당하는 보상 분쟁 상황을 선택해 보세요 (원클릭 자동 완성)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {SITUATION_TEMPLATES.map((tpl) => (
            <button
              key={tpl.title}
              onClick={() => handleSearch(tpl.query)}
              className="flex flex-col text-left p-3.5 rounded-xl bg-white dark:bg-[#202124] hover:bg-[#e8f0fe]/20 dark:hover:bg-[#174ea6]/10 border border-gray-200/60 dark:border-white/5 hover:border-[var(--google-blue)] dark:hover:border-[#8ab4f8] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
            >
              <span className="text-xs font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-blue)] dark:group-hover:text-[#8ab4f8] transition-colors leading-tight">
                {tpl.title}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 line-clamp-1 leading-snug">
                {tpl.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

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
              <p>법제처 API는 승인된 서버 IP에서만 조회가 가능합니다. 현재 대표님 컴퓨터(로컬 환경)의 임시 공인 IP 주소가 법제처 API 신청서에 적어둔 IP와 일치하지 않거나, 배포서버의 유동 IP가 차단되어 그렇습니다.</p>
              <p className="font-bold text-[10px] text-gray-400">네이버에 &quot;내 IP&quot;를 검색하여 나온 주소를 법제처 오픈API 관리자 화면 마이페이지에 등록해 주시면 정상 가동됩니다.</p>
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
              
              // 체크박스 배열 상태 (없으면 기본값 전부 false)
              const currentChecks = checklistState[prec.id] || [false, false, false, false];
              const checkedCount = getCheckedCount(prec.id);

              // 🔗 보상스쿨 블로그 내 관련 분석글 가져오기
              const relatedPosts = getRelatedBlogPosts(prec);
              
              return (
                <article
                  key={prec.id}
                  className="bg-white dark:bg-[#202124] rounded-[24px] border border-gray-100 dark:border-white/5 shadow-[0_8px_25px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] p-5 sm:p-6 hover:border-[var(--google-blue)]/50 dark:hover:border-[#8ab4f8]/50 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* 상단 메타데이터 배지 */}
                    <div className="flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="px-2.5 py-1 rounded-md bg-[#e8f0fe] dark:bg-[#174ea6]/20 text-[var(--google-blue)] dark:text-[#8ab4f8] text-[10px] font-bold">
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                          isAdded 
                            ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm' 
                            : 'bg-[#e8f0fe] hover:bg-[#d2e3fc] text-[var(--google-blue)] dark:bg-[#174ea6]/20 dark:hover:bg-[#174ea6]/30 dark:text-[#8ab4f8]'
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
                      {/* 판례번호 명시적 굵게 노출 */}
                      <div className="text-sm font-extrabold text-[var(--google-blue)] dark:text-[#8ab4f8] mt-1 flex items-center gap-1.5">
                        <span className="text-xs">⚖️ 공식 판례번호:</span> {prec.caseNo}
                      </div>
                    </div>

                    {/* 판결 요지 */}
                    {prec.judgmentSummary && (
                      <div className="bg-gray-50 dark:bg-white/2 p-4 rounded-xl text-xs sm:text-sm text-gray-600 dark:text-[#9aa0a6] leading-relaxed break-all font-medium border border-gray-100/50 dark:border-white/2">
                        <div className="font-bold text-[#202124] dark:text-[#e8eaed] mb-1.5 flex items-center gap-1 text-[11px] text-[var(--google-blue)] dark:text-[#8ab4f8]">
                          <span>📝</span> 판시사항 및 판결 요지
                        </div>
                        {prec.judgmentSummary}
                      </div>
                    )}

                    {/* 🛡️ 1분 자가진단 체크리스트와 상담 연동 */}
                    <div className="p-4 bg-[#e8f0fe]/10 dark:bg-[#174ea6]/5 rounded-xl border border-[#d2e3fc]/20 dark:border-[#174ea6]/10 space-y-3">
                      <div className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                        <span className="flex items-center gap-1">🛡️ 내 사례 대조 진단 체크리스트</span>
                        {checkedCount > 0 && (
                          <span className="text-[var(--google-blue)] dark:text-[#8ab4f8] font-extrabold text-[10px]">
                            {checkedCount} / 4개 조건 충족
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-medium text-gray-600 dark:text-[#9aa0a6]">
                        {[
                          '사고 경위가 이 판례와 비슷합니다. (예: 교통사고, 낙상 등)',
                          '진단서 부상 부위가 본 판례와 같습니다. (예: 척추, 암, 신경 등)',
                          '보험사에서도 비슷한 핑계(기왕증 등)로 삭감을 요구하고 있습니다.',
                          '부상 및 질환 발생 또는 청구일로부터 3년이 경과하지 않았습니다.'
                        ].map((chkText, index) => (
                          <label key={index} className="flex items-start gap-2.5 cursor-pointer select-none py-0.5 hover:text-[#202124] dark:hover:text-white transition-colors">
                            <input
                              type="checkbox"
                              checked={currentChecks[index] || false}
                              onChange={() => handleChecklistChange(prec.id, index)}
                              className="rounded border-gray-300 text-[var(--google-blue)] focus:ring-[var(--google-blue)] mt-0.5 shrink-0"
                            />
                            <span>{chkText}</span>
                          </label>
                        ))}
                      </div>
                      {checkedCount >= 3 && (
                        <div className="text-[10px] text-[var(--google-blue)] dark:text-[#8ab4f8] font-bold bg-[#e8f0fe]/60 dark:bg-[#174ea6]/20 p-2 rounded-lg border border-[#d2e3fc]/30 dark:border-[#174ea6]/30 flex items-center justify-between animate-in fade-in duration-200">
                          <span>🎯 3개 이상의 조건이 충족되었습니다. 본 대법원 판례를 보상금 청구 논리로 응용할 수 있으니 손해사정사 상담을 신청해 보세요!</span>
                          <button
                            onClick={() => {
                              if (!isAdded) toggleBasket(prec);
                            }}
                            className="bg-[var(--google-blue)] hover:bg-[#174ea6] text-white text-[9px] font-extrabold px-2 py-1 rounded shrink-0 cursor-pointer"
                          >
                            바구니 담기
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 🔗 [NEW] 보상스쿨 블로그 내 유사 보상 분석 칼럼 연동 */}
                    {relatedPosts.length > 0 && (
                      <div className="border-t border-dashed border-gray-200 dark:border-white/10 pt-3">
                        <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-1">
                          📚 이 판례와 관련이 있는 보상스쿨의 전문 실무 칼럼:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {relatedPosts.map((post: any) => (
                            <Link
                              key={post.slug}
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-2.5 rounded-lg border border-gray-150 dark:border-white/5 bg-gray-50/50 dark:bg-white/1 hover:bg-[#e8f0fe]/10 dark:hover:bg-[#174ea6]/10 hover:border-[#8ab4f8]/30 transition-all text-xs font-bold text-gray-800 dark:text-gray-200"
                            >
                              <span className="truncate pr-2">{post.title}</span>
                              <span className="text-[10px] text-[var(--google-blue)] dark:text-[#8ab4f8] shrink-0 font-medium hover:underline flex items-center gap-0.5">
                                실무 해설 읽기 🔗
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 판결문 전문 아코디언 */}
                    {prec.caseContent && (
                      <div className="space-y-2 pt-1">
                        <button
                          onClick={() => setOpenDetailId(isDetailOpen ? null : prec.id)}
                          className="w-full flex items-center justify-between p-2.5 bg-gray-50/50 dark:bg-white/2 rounded-xl text-xs font-bold text-[#5f6368] dark:text-zinc-400 hover:text-[var(--google-blue)] dark:hover:text-[#8ab4f8] transition-colors cursor-pointer border border-transparent hover:border-[var(--google-blue)]/20"
                        >
                          <span className="flex items-center gap-1.5">
                            <span>📜</span>
                            {isDetailOpen ? '법제처 공식 판결문 전문 접기' : '법제처 공식 판결문 전문 전체 확인하기'}
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
                                className="text-[var(--google-blue)] dark:text-[#8ab4f8] hover:underline flex items-center gap-1"
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

      {/* 📖 보상 분쟁 핵심 용어 및 대응 팁 사전 */}
      <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2 border-l-4 border-[var(--google-blue)] pl-2.5">
          <span className="text-[var(--google-blue)] text-lg leading-none">📖</span>
          알아두면 절대 손해 안 보는 보상 핵심 단어 사전
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {LAW_DICTIONARY.map((item) => (
            <div 
              key={item.term} 
              className="p-4 bg-gray-50/40 dark:bg-white/1 rounded-2xl border border-gray-150/60 dark:border-white/5 hover:border-[var(--google-blue)]/30 hover:bg-[#e8f0fe]/5 dark:hover:bg-[#174ea6]/5 transition-all duration-200 text-xs flex flex-col justify-between"
            >
              <div>
                <span className="font-extrabold text-[var(--google-blue)] dark:text-[#8ab4f8] text-[13px]">{item.term}</span>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mt-1.5 font-medium">{item.desc}</p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-dashed border-gray-200 dark:border-white/10 text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
                <strong className="text-[var(--google-blue)] dark:text-[#8ab4f8] font-bold block mb-0.5">💡 손해사정 대응 팁:</strong>
                {item.tip}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
