import { callGeminiAPI } from './admin-api';
import {
  STRICT_RULES,
  getRandomAngle,
  getBlogRole,
  getBlogSkeleton,
  getBlogFrontmatter,
} from './prompt-rules';

const NEWS_QUERIES = [
  '보험금 지급거절 분쟁',
  '손해사정 교통사고 보상',
  '실손보험 산재 후유장해',
];

const BACKUP_KEYWORDS = [
  '사망보험금', '자살보험금', '암진단비', '뇌출혈', '급성심근경색',
  '실손의료비', '소비자선임권', '교통사고 과실비율', '교통사고 위자료', '휴업손해',
  '장해진단', '영업배상책임', '의료사고', '근재보험', '산재보험',
  '장해평가', '면책보험금', '보험금 지급거절', '척추 압박골절 후유장해', '십자인대 파열',
  '회전근개 파열', '추간판탈출증 디스크', '고지의무 위반', '통지의무 위반', '일상생활배상책임',
  '체육시설 사고 배상책임', '도로 관리 하자 배상책임', '스키장 사고 배상책임',
  '개 물림 사고 배상책임', '자전거 교통사고', '보행자 무단횡단 사고',
  '음주운전 면책 동의', '무면허 사고 면책', '뺑소니 사고 보상', '산재 유족급여',
  '산재 요양급여 기각', '소음성 난청 산재', '출퇴근길 사고 산재',
  '뇌경색 진단비 면책', '허혈성심장질환 진단비', '만성 신부전 장해등급',
  '대퇴골 경부 골절 후유장해', '고액암 지급거절', '경계성종양 암진단비',
  '제자리암 소액암 지급', '요추 골절 후유장해', '외상성 뇌손상 인지장해',
  '골반 골절 장해평가', '오토바이 사고 과실비율', '전동킥보드 사고 배상'
].sort(() => Math.random() - 0.5);

// Helper to call our Next.js proxy for CORS-restricted APIs
async function fetchProxy(action: string, payload: any = {}) {
  const res = await fetch('/api/ai-pipeline/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload })
  });
  if (!res.ok) throw new Error(`Proxy error: ${res.status}`);
  return res.json();
}

export async function runAutoGenerationWorkflow(
  type: 'all' | 'precedent' | 'trend',
  geminiKey: string,
  onProgress: (msg: string) => void
) {
  onProgress('1/6: 최신 트렌드 뉴스 수집 중...');
  let headlines: string[] = [];
  try {
    const { data } = await fetchProxy('rss', { queries: NEWS_QUERIES });
    headlines = data || [];
  } catch (e) {
    console.warn('RSS fetch failed', e);
  }

  onProgress('2/6: AI가 손해사정 핵심 키워드를 추출 중...');
  let keywords: { searchKeyword: string, newsTitle: string }[] = [];
  if (headlines.length > 0) {
    const prompt = `당신은 대한민국 최고의 손해사정 블로그 수석 편집장입니다.
아래 뉴스 헤드라인 목록에서 손해사정(교통사고·산재·질병·배상책임·보험금 분쟁)과
직접 연관된 이슈를 분석하여, 법제처 판례 API 검색에 활용할 구체적인 키워드를 추출하세요.

[헤드라인 목록]
${headlines.slice(0, 50).map((t, i) => `${i + 1}. ${t}`).join('\n')}

아래와 같은 JSON 형식으로만 응답하세요. 백틱이나 마크다운 없이 순수 JSON만 출력하세요.
{"candidates": [{"newsTitle": "기사원문", "searchKeyword": "검색용키워드"}]}`;

    try {
      const schemaStr = await callGeminiAPI(geminiKey, prompt, 'keyword-extraction');
      const match = schemaStr.match(/```(?:json)?\n([\s\S]*?)\n```/) || schemaStr.match(/{[\s\S]*}/);
      const jsonStr = match ? match[0].replace(/```json/g, '').replace(/```/g, '') : schemaStr;
      const parsed = JSON.parse(jsonStr);
      keywords = parsed.candidates || [];
    } catch (e) {
      console.warn('Keyword extraction failed', e);
      keywords = [...BACKUP_KEYWORDS].sort(() => Math.random() - 0.5).map(k => ({ searchKeyword: k, newsTitle: '' }));
    }
  } else {
    keywords = [...BACKUP_KEYWORDS].sort(() => Math.random() - 0.5).map(k => ({ searchKeyword: k, newsTitle: '' }));
  }

  onProgress('3/6: 네이버 데이터랩에서 키워드 수요 검증 중...');
  let rankedKeywords = keywords;
  try {
    const { data } = await fetchProxy('naver', { candidates: keywords });
    if (data && data.length > 0) rankedKeywords = data;
  } catch (e) {
    console.warn('Naver API failed', e);
  }

  onProgress('4/6: 법제처 최신 판례 매칭 중...');
  let precedentDetail = null;
  let finalKeyword = rankedKeywords[0]?.searchKeyword || '사망보험금';
  
  for (const kw of rankedKeywords.slice(0, 5)) {
    try {
      const { data } = await fetchProxy('law', { keyword: kw.searchKeyword });
      if (data) {
        precedentDetail = data;
        finalKeyword = kw.searchKeyword;
        break;
      }
    } catch (e) {
      console.warn('Law API failed for ' + kw.searchKeyword);
    }
  }

  onProgress('5/6: 블로그 포스팅 기획 및 설계 중...');
  const angle = getRandomAngle();
  const existingPostsList = '- (없음)'; // In client side, we could pass titles if fetched

  onProgress('6/6: AI가 심층 전문 칼럼을 작성 중입니다. (약 30초 소요)...');
  
  const currentDate = new Date().toISOString().split('T')[0];
  let prompt = '';
  if (type === 'precedent' && precedentDetail) {
    prompt = `
${getBlogRole()}
# Objective
다음 판례 데이터를 바탕으로 전문가 수준의 심층 법률 칼럼을 작성하세요.
주제 키워드: ${finalKeyword}
사건번호: ${precedentDetail.caseNo}
판결요지: ${precedentDetail.judgmentSummary}
판례내용: ${precedentDetail.caseContent}

# 🚨 STRICT WRITING RULES
${STRICT_RULES}

${getBlogFrontmatter('판례 분석 기반 칼럼 제목', currentDate)}
${getBlogSkeleton(angle, '<calculator type="medical" />', existingPostsList)}
`;
  } else {
    prompt = `
${getBlogRole()}
# Objective
다음 키워드와 트렌드를 바탕으로 독자를 끌어들이는 전문 손해사정 칼럼을 작성하세요.
주제 키워드: ${finalKeyword}

# 🚨 STRICT WRITING RULES
${STRICT_RULES}

${getBlogFrontmatter('트렌드 기반 매력적인 칼럼 제목', currentDate)}
${getBlogSkeleton(angle, '<calculator type="auto" />', existingPostsList)}
`;
  }

  const generated = await callGeminiAPI(geminiKey, prompt, 'auto-generate');
  
  onProgress('완료! 에디터에서 내용을 확인하세요.');
  return generated;
}
