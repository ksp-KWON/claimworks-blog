import { callGeminiAPI } from './admin-api';
import { 
  getRandomAngle, 
  getTopicPlanningPrompt, 
  getManualPlanningPrompt, 
  buildArticlePrompt, 
  getQueryGenerationPrompt,
  getKeywordExtractionPrompt,
  getNovelTopicPrompt,
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

function buildPostFrontmatter(topic: any, content: string) {
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
  
  if (topic.caseNumber) {
    frontmatterData.caseNumber = topic.caseNumber;
  }
  return stringifyMarkdown(frontmatterData, content);
}

export async function runAutoGenerationWorkflow(
  type: 'precedent' | 'trend',
  geminiKey: string,
  onProgress: (msg: string) => void,
  targetCategory: string = '보상가이드'
) {
  onProgress(`1/5: [${targetCategory}] 최근 30일 발행 글 분석 중...`);
  let existingPostsArr: any[] = [];
  try {
    const res = await fetch('/api/posts?admin=true');
    if (res.ok) existingPostsArr = await res.json();
  } catch(e) {}
  
  const recentPosts = existingPostsArr.slice(0, 50);
  const existingSlugs = recentPosts.length > 0 ? recentPosts.map(p => p.slug).join(', ') : '- (없음)';
  const existingTitles = recentPosts.length > 0 ? recentPosts.map(p => `[${p.category || '일반'}] ${p.title}`).join('\n') : '- (없음)';

  onProgress(`2/5: [${targetCategory}] 트렌드 키워드 및 미개척 주제 도출 중...`);
  const queryGenPrompt = getQueryGenerationPrompt(targetCategory, existingTitles);
  let dynamicKeyword = `${targetCategory} 권익 구제 실무`;
  let dynamicTitle = `${targetCategory} 손해사정 핵심 쟁점`;
  
  try {
    const qStr = await callGeminiAPI(geminiKey, queryGenPrompt, 'keyword-extraction', undefined, ['lite', 'flash']);
    const qParsed = safeJsonParse(qStr, { queries: [] });
    if (qParsed.queries && qParsed.queries.length > 0) {
      dynamicKeyword = qParsed.queries[0];
      dynamicTitle = qParsed.queries.slice(0, 2).join(' / ');
    }
  } catch (e) {
    console.warn('Keyword generation fallback to novel topic', e);
    const novelPrompt = getNovelTopicPrompt(targetCategory, existingTitles);
    try {
      const nStr = await callGeminiAPI(geminiKey, novelPrompt, 'keyword-extraction', undefined, ['flash']);
      const nParsed = safeJsonParse(nStr);
      if (nParsed.keyword) {
        dynamicKeyword = nParsed.keyword;
        dynamicTitle = nParsed.newsTitle || `${dynamicKeyword} 실무 쟁점`;
      }
    } catch {}
  }

  onProgress(`3/5: [${targetCategory}] 블로그 포스팅 기획 및 설계 중...`);
  const angle = getRandomAngle();
  let topicPlanStr = '';
  try {
    const planPrompt = getTopicPlanningPrompt(dynamicKeyword, dynamicTitle, existingSlugs, targetCategory);
    topicPlanStr = await callGeminiAPI(geminiKey, planPrompt, 'keyword-extraction', TOPIC_SCHEMA, ['lite', 'flash']);
  } catch(e: any) {
    throw new Error('기획안 도출에 실패했습니다: ' + e.message);
  }
  
  const topic = safeJsonParse(topicPlanStr);

  onProgress('4/5: AI가 단일 헌법 뼈대에 맞추어 전문 칼럼을 집필 중입니다 (약 20초 소요)...');
  const prompt = buildArticlePrompt(topic, angle, existingPostsArr);
  
  const generated = await callGeminiAPI(geminiKey, prompt, 'auto-generate', CONTENT_SCHEMA, ['flash', 'pro']);
  const { content, thoughtProcess } = parseGeneratedContent(generated);
  if (thoughtProcess) {
    onProgress(`🧠 [사고 과정] : ${thoughtProcess.substring(0, 150)}...`);
  }
  
  onProgress('5/5: 최종 마크다운 및 메타데이터 정규화 완료!');
  const finalContent = buildPostFrontmatter(topic, content);
  
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
