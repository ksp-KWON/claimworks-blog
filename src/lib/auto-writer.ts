import { callGeminiAPI } from './admin-api';
import {
  STRICT_RULES,
  getRandomAngle,
  getTopicPlanningPrompt,
  getPrecedentPlanningPrompt,
  buildBlogPrompt,
  buildPrecedentPrompt,
  TOPIC_SCHEMA
} from './prompt-rules';
import { parseGeneratedContent } from './content-parser';
import { stringifyMarkdown } from './markdown-utils';

// Removed hardcoded NEWS_QUERIES
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

// ─── 공용 모듈 (content-parser)에서 자동 처리 ───

export async function runAutoGenerationWorkflow(
  type: 'precedent' | 'trend',
  geminiKey: string,
  onProgress: (msg: string) => void
) {
  onProgress('1/6: 최신 트렌드 뉴스 검색어 자율 생성 중...');
  let existingPostsArr: any[] = [];
  try {
    const res = await fetch('/api/posts?admin=true');
    existingPostsArr = await res.json();
  } catch(e) {
    console.warn('Failed to fetch existing posts', e);
  }
  const recentPosts = existingPostsArr.slice(0, 15);
  const existingSlugs = recentPosts.length > 0 ? recentPosts.map(p => p.slug).join(', ') : '- (없음)';
  const existingTitles = recentPosts.length > 0 ? recentPosts.map(p => p.title).join(', ') : '- (없음)';

  const queryGenPrompt = `
당신은 대한민국 최고의 손해사정 블로그 편집장입니다.
최근 블로그에 아래와 같은 주제의 글들이 발행되었습니다.
[최근 발행 글]
${existingTitles}

이 주제들과 겹치지 않는, 오늘 구글 뉴스에서 탐색해 볼 만한 새롭고 실질적인 보상/보험/손해사정 관련 검색어 3개를 창작하세요.
(예: "요양병원 배상책임", "음주운전 면책금", "백내장 수술 실손")
반드시 아래 JSON 형식으로만 출력하세요.
{"queries": ["검색어1", "검색어2", "검색어3"]}
`;

  let dynamicQueries: string[] = ['보험금 분쟁']; // 최후의 보루
  try {
    const qStr = await callGeminiAPI(geminiKey, queryGenPrompt, 'keyword-extraction');
    const qMatch = qStr.match(/```(?:json)?\n([\s\S]*?)\n```/) || qStr.match(/{[\s\S]*}/);
    const qParsed = JSON.parse(qMatch ? qMatch[0].replace(/```json/g, '').replace(/```/g, '') : qStr);
    if (qParsed.queries && qParsed.queries.length > 0) {
      dynamicQueries = qParsed.queries;
    }
  } catch (e) {
    console.warn('Dynamic query generation failed, using fallback', e);
  }

  onProgress(`2/6: 동적 검색어로 최신 트렌드 뉴스 수집 중... (${dynamicQueries.join(', ')})`);
  let headlines: string[] = [];
  try {
    const { data } = await fetchProxy('rss', { queries: dynamicQueries });
    headlines = data || [];
  } catch (e) {
    console.warn('RSS fetch failed', e);
  }

  onProgress('3/6: AI가 손해사정 핵심 키워드를 추출 중...');
  let keywords: { searchKeyword: string, newsTitle: string }[] = [];
  if (headlines.length > 0) {
    const prompt = `당신은 대한민국 최고의 손해사정 블로그 수석 편집장입니다.
아래 뉴스 헤드라인 목록에서 손해사정(교통사고·산재·질병·배상책임·보험금 분쟁)과
직접 연관된 이슈를 분석하여, 법제처 판례 API 검색에 활용할 구체적인 키워드를 추출하세요.

[최근 발행 글 (이 주제들과 겹치는 키워드는 피할 것!)]
${existingTitles}

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
      if (keywords.length === 0) throw new Error('추출된 키워드가 없습니다.');
    } catch (e) {
      console.warn('Keyword extraction failed', e);
      throw new Error('뉴스 키워드 추출에 실패했습니다. 프롬프트나 API 응답을 확인하세요.');
    }
  } else {
    throw new Error('오늘자 관련 뉴스가 없어 키워드를 추출할 수 없습니다.');
  }

  onProgress('4/6: 법제처 최신 판례 매칭 중...');
  let precedentDetail = null;
  let finalKeyword = keywords[0]?.searchKeyword;
  
  for (const kw of keywords.slice(0, 5)) {
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

  // 🔴 근본 해결: 하드코딩 완전 제거 및 AI 자가 치유(Self-Healing) 유기적 탐색
  if (type === 'precedent' && !precedentDetail) {
    onProgress('4.5/6: 상세 키워드 판례 검색 실패. AI 자가 치유(거시적 법률 용어 유추) 진행 중...');
    const healingPrompt = `
뉴스에서 추출된 키워드 "${keywords.map(k => k.searchKeyword).join(', ')}" 로 대법원 판례를 찾지 못했습니다.
이 사건들의 맥락에 적용할 수 있는 더 상위 개념의 보편적인 법률 용어(예: "안전배려의무", "인과관계", "설명의무", "면책사유" 등) 3가지를 제안하세요.
반드시 아래 JSON 형식으로만 출력하세요.
{"keywords": ["용어1", "용어2", "용어3"]}
`;
    try {
      const hStr = await callGeminiAPI(geminiKey, healingPrompt, 'keyword-extraction');
      const hMatch = hStr.match(/```(?:json)?\n([\s\S]*?)\n```/) || hStr.match(/{[\s\S]*}/);
      const hParsed = JSON.parse(hMatch ? hMatch[0].replace(/```json/g, '').replace(/```/g, '') : hStr);
      const healKeys = hParsed.keywords || [];
      
      for (const fw of healKeys) {
        try {
          const { data } = await fetchProxy('law', { keyword: fw });
          if (data) {
            precedentDetail = data;
            finalKeyword = fw;
            break;
          }
        } catch (e) {
          console.warn('Law API healing fallback failed for ' + fw);
        }
      }
    } catch(e) {
      console.warn('AI Healing failed', e);
    }
  }

  // AI 자가치유로도 판례를 못 찾으면, 하드코딩으로 덮어쓰지 않고 떳떳하게 실패 처리(Fail-Fast)
  if (type === 'precedent' && !precedentDetail) {
    throw new Error('현재 뉴스 트렌드에 부합하는 대법원 판례를 찾지 못했습니다. 다른 시간대에 다시 시도해주세요.');
  }

  if (!precedentDetail) {
    console.warn(`[AutoWriter] No precedent found for any of the keywords. Using first keyword: ${finalKeyword}`);
  }

  onProgress('5/6: 블로그 포스팅 기획 및 설계 중...');
  const angle = getRandomAngle();
  const trendTitle = keywords.find(k => k.searchKeyword === finalKeyword)?.newsTitle || '없음';

  let topicPlanStr = '';
  try {
    const planPrompt = (type === 'precedent' && precedentDetail)
      ? getPrecedentPlanningPrompt(precedentDetail, existingSlugs)
      : getTopicPlanningPrompt(finalKeyword, trendTitle, existingSlugs);
      
    topicPlanStr = await callGeminiAPI(geminiKey, planPrompt, 'keyword-extraction', TOPIC_SCHEMA);
  } catch(e: any) {
    throw new Error('기획안 도출에 실패했습니다: ' + e.message);
  }
  
  let topic;
  try {
    const match = topicPlanStr.match(/```(?:json)?\n([\s\S]*?)\n```/) || topicPlanStr.match(/{[\s\S]*}/);
    const jsonStr = match ? match[0].replace(/```json/g, '').replace(/```/g, '') : topicPlanStr;
    topic = JSON.parse(jsonStr);
  } catch(e) {
    throw new Error('기획안 JSON 파싱 실패');
  }

  onProgress('6/6: AI가 심층 전문 칼럼을 작성 중입니다. (약 30초 소요)...');
  
  let prompt = '';
  if (type === 'precedent' && precedentDetail) {
    prompt = buildPrecedentPrompt(precedentDetail, topic, angle, existingPostsArr);
  } else {
    prompt = buildBlogPrompt(topic, angle, existingPostsArr);
  }

  const generated = await callGeminiAPI(geminiKey, prompt, 'auto-generate');
  
  const { content } = parseGeneratedContent(generated);
  
  // summary는 TOPIC_SCHEMA 구조화 출력(JSON)에서 100% 신뢰도로 추출
  // - topic.summary: Gemini가 기획 단계(5단계)에서 이미 JSON으로 생성한 SEO 요약문
  // - fallback: 요약문 누락 시 본문 앞부분 140자 사용
  let summary = (topic.summary || '').replace(/"/g, "'").replace(/\n/g, ' ').trim();
  if (!summary) {
    summary = content.replace(/[#*`>[\]!]/g, '').replace(/\s+/g, ' ').trim().slice(0, 140);
  }
  if (summary.length > 158) summary = summary.slice(0, 155) + '...';
  
  const kstDate = new Date(Date.now() + 9 * 3600 * 1000).toISOString().split('T')[0];
  const frontmatterData: any = {
    title: topic.title,
    slug: topic.slug || '',
    date: kstDate,
    updatedAt: kstDate,
    summary: summary,
    category: topic.category,
    regionCategory: "",
    specialtyCategory: topic.specialtyCategory || '',
    tags: topic.tags || [],
    published: true
  };
  
  if (precedentDetail && precedentDetail.caseNo) {
    frontmatterData.caseNumber = precedentDetail.caseNo;
  }
  
  const finalContent = stringifyMarkdown(frontmatterData, content);
  
  onProgress('완료! 에디터에서 내용을 확인하세요.');
  return finalContent;
}
