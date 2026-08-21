import { callGeminiAPI } from './admin-api';
import { 
  getRandomAngle, 
  getTopicPlanningPrompt, 
  getPrecedentPlanningPrompt, 
  getManualPlanningPrompt, 
  buildArticlePrompt, 
  getQueryGenerationPrompt,
  getKeywordExtractionPrompt,
  getHealingPrompt,
  TOPIC_SCHEMA,
  CONTENT_SCHEMA
} from './prompt-rules';
import { stringifyMarkdown } from './markdown-utils';

function parseGeneratedContent(text: string) {
  try {
    const parsed = typeof text === 'string' ? JSON.parse(text) : text;
    if (parsed && parsed.markdownContent) {
      return { content: parsed.markdownContent, thoughtProcess: parsed.thoughtProcess };
    }
  } catch (e) {
    // JSON 파싱 실패 시 기존 마크다운 필터링 폴백
  }
  const content = text.replace(/^```(markdown)?/im, '').replace(/```$/im, '').trim();
  return { content, thoughtProcess: '' };
}

async function fetchProxy(action: string, payload: any = {}) {
  const res = await fetch('/api/ai-pipeline/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload })
  });
  if (!res.ok) throw new Error(`Proxy error: ${res.status}`);
  return res.json();
}

function safeJsonParse(jsonStr: string, fallback: any = null) {
  try {
    const match = jsonStr.match(/```(?:json)?\n([\s\S]*?)\n```/) || jsonStr.match(/{[\s\S]*}/);
    const extracted = match ? match[0].replace(/```json/g, '').replace(/```/g, '') : jsonStr;
    return JSON.parse(extracted);
  } catch (e) {
    if (fallback !== null) return fallback;
    throw new Error('JSON 파싱 실패');
  }
}

function buildPostFrontmatter(topic: any, content: string, precedentDetail: any = null) {
  let summary = (topic.summary || '').replace(/"/g, "'").replace(/\n/g, ' ').trim();
  if (!summary) {
    summary = content.replace(/[#*`>[\]!]/g, '').replace(/\s+/g, ' ').trim().slice(0, 140);
  }
  if (summary.length > 158) summary = summary.slice(0, 155) + '...';
  
  const kstDate = new Date(Date.now() + 9 * 3600 * 1000).toISOString().split('T')[0];
  const frontmatterData: any = {
    title: topic.title || '새 문서',
    slug: topic.slug || '',
    date: kstDate,
    updatedAt: kstDate,
    summary: summary,
    category: topic.category || '기타',
    regionCategory: "",
    specialtyCategory: topic.specialtyCategory || '',
    tags: topic.tags || [],
    published: true
  };
  
  if (precedentDetail && precedentDetail.caseNo) {
    frontmatterData.caseNumber = precedentDetail.caseNo;
  }
  return stringifyMarkdown(frontmatterData, content);
}

export async function runAutoGenerationWorkflow(
  type: 'precedent' | 'trend',
  geminiKey: string,
  onProgress: (msg: string) => void,
  targetCategory: string = '보상/보험/손해사정'
) {
  onProgress(`1/6: [${targetCategory}] 최신 트렌드 뉴스 검색어 자율 생성 중...`);
  let existingPostsArr: any[] = [];
  try {
    const res = await fetch('/api/posts?admin=true');
    existingPostsArr = await res.json();
  } catch(e) {}
  
  const recentPosts = existingPostsArr.slice(0, 15);
  const existingSlugs = recentPosts.length > 0 ? recentPosts.map(p => p.slug).join(', ') : '- (없음)';
  const existingTitles = recentPosts.length > 0 ? recentPosts.map(p => p.title).join(', ') : '- (없음)';

  const queryGenPrompt = getQueryGenerationPrompt(targetCategory, existingTitles);
  let dynamicQueries: string[] = [targetCategory]; 
  
  try {
    const qStr = await callGeminiAPI(geminiKey, queryGenPrompt, 'keyword-extraction', undefined, ['lite', 'flash']);
    const qParsed = safeJsonParse(qStr, { queries: [] });
    if (qParsed.queries && qParsed.queries.length > 0) {
      dynamicQueries = qParsed.queries;
    }
  } catch (e) {
    console.warn('Dynamic query generation failed', e);
  }

  onProgress(`2/6: 동적 검색어로 뉴스 수집 중... (${dynamicQueries.join(', ')})`);
  let headlines: string[] = [];
  try {
    const { data } = await fetchProxy('rss', { queries: dynamicQueries });
    headlines = data || [];
  } catch (e) {
    console.warn('RSS fetch failed', e);
  }

  onProgress(`3/6: [${targetCategory}] 핵심 키워드를 추출 중...`);
  let keywords: { searchKeyword: string, newsTitle: string }[] = [];
  if (headlines.length > 0) {
    const prompt = getKeywordExtractionPrompt(targetCategory, existingTitles, headlines);
    try {
      const schemaStr = await callGeminiAPI(geminiKey, prompt, 'keyword-extraction', undefined, ['lite', 'flash']);
      const parsed = safeJsonParse(schemaStr, { candidates: [] });
      keywords = parsed.candidates || [];
      if (keywords.length === 0) throw new Error('추출된 키워드가 없습니다.');
    } catch (e) {
      throw new Error('뉴스 키워드 추출에 실패했습니다.');
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
    } catch {}
  }

  if (type === 'precedent' && !precedentDetail) {
    onProgress('4.5/6: 판례 검색 실패. AI 자가 치유 진행 중...');
    const healingPrompt = getHealingPrompt(keywords.map(k => k.searchKeyword).join(', '));
    try {
      const hStr = await callGeminiAPI(geminiKey, healingPrompt, 'keyword-extraction', undefined, ['lite', 'flash']);
      const hParsed = safeJsonParse(hStr, { keywords: [] });
      
      for (const fw of (hParsed.keywords || [])) {
        try {
          const { data } = await fetchProxy('law', { keyword: fw });
          if (data) {
            precedentDetail = data;
            finalKeyword = fw;
            break;
          }
        } catch {}
      }
    } catch(e) {}
  }

  if (type === 'precedent' && !precedentDetail) {
    throw new Error('현재 트렌드에 부합하는 대법원 판례를 찾지 못했습니다.');
  }

  onProgress('5/6: 블로그 포스팅 기획 및 설계 중...');
  const angle = getRandomAngle();
  const trendTitle = keywords.find(k => k.searchKeyword === finalKeyword)?.newsTitle || '없음';

  let topicPlanStr = '';
  try {
    const planPrompt = (type === 'precedent' && precedentDetail)
      ? getPrecedentPlanningPrompt(precedentDetail, existingSlugs, targetCategory)
      : getTopicPlanningPrompt(finalKeyword, trendTitle, existingSlugs, targetCategory);
      
    topicPlanStr = await callGeminiAPI(geminiKey, planPrompt, 'keyword-extraction', TOPIC_SCHEMA, ['lite', 'flash']);
  } catch(e: any) {
    throw new Error('기획안 도출에 실패했습니다: ' + e.message);
  }
  
  const topic = safeJsonParse(topicPlanStr);

  onProgress('6/6: AI가 심층 전문 칼럼을 작성 중입니다. (약 30초 소요)...');
  const prompt = buildArticlePrompt(topic, angle, existingPostsArr, type === 'precedent' ? precedentDetail : null);
  
  const generated = await callGeminiAPI(geminiKey, prompt, 'auto-generate', CONTENT_SCHEMA, ['flash', 'pro']);
  const { content, thoughtProcess } = parseGeneratedContent(generated);
  if (thoughtProcess) {
    onProgress(`🧠 [사고 과정] : ${thoughtProcess.substring(0, 150)}...`);
  }
  
  const finalContent = buildPostFrontmatter(topic, content, type === 'precedent' ? precedentDetail : null);
  
  onProgress('완료! 에디터에서 내용을 확인하세요.');
  return finalContent;
}

export async function runManualGenerationWorkflow(
  mode: 'manual-preserve' | 'manual-expand' | 'manual-naver' | 'naver-expand' | 'semi-auto' | 'semi-auto-naver',
  aiInput: string,
  geminiKey: string,
  onProgress: (msg: string) => void
) {
  if (!geminiKey) throw new Error('Gemini API 키가 없습니다.');
  
  onProgress('1/3: 기존 글 목록 분석 중...');
  let existingSlugs = "- (없음)";
  let existingPostsArr: any[] = [];
  try {
    const res = await fetch('/api/posts?admin=true');
    const posts = await res.json();
    if (posts && posts.length > 0) {
      existingPostsArr = posts;
      existingSlugs = posts.map((p: any) => p.slug).join(', ');
    }
  } catch (e) {}

  onProgress('2/3: 사용자 원문 기반 SEO 기획안 도출 중...');
  let topicPlanStr = '';
  try {
    const planPrompt = getManualPlanningPrompt(aiInput, existingSlugs);
    topicPlanStr = await callGeminiAPI(geminiKey, planPrompt, 'keyword-extraction', TOPIC_SCHEMA, ['lite', 'flash']);
  } catch (e: any) {
    throw new Error('기획안 도출에 실패했습니다: ' + e.message);
  }

  const topic = safeJsonParse(topicPlanStr);

  onProgress('3/3: 전문 칼럼 창작 중 (약 30초 소요)...');
  const generated = await callGeminiAPI(geminiKey, aiInput, mode, CONTENT_SCHEMA, ['flash', 'pro']);
  const { content, thoughtProcess } = parseGeneratedContent(generated);
  if (thoughtProcess) {
    onProgress(`🧠 [사고 과정] : ${thoughtProcess.substring(0, 150)}...`);
  }
  
  const finalContent = buildPostFrontmatter(topic, content);
  
  onProgress('완료! 에디터에서 내용을 확인하세요.');
  return finalContent;
}
