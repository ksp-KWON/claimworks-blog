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
import { generateSemanticSlug } from './slug-utils';

function parseGeneratedContent(text: string) {
  if (!text) return { content: '', thoughtProcess: '', title: '' };

  // 1. 직접 JSON 객체이거나 순수 JSON 문자열인 경우
  try {
    const parsed = typeof text === 'string' ? JSON.parse(text) : text;
    if (parsed && (parsed.markdownContent || parsed.content)) {
      return { 
        content: (parsed.markdownContent || parsed.content || '').trim(), 
        thoughtProcess: parsed.thoughtProcess || '',
        title: (parsed.title || '').trim()
      };
    }
  } catch (e) {}

  // 2. 텍스트 내에 JSON 코드블록이 포함된 경우
  try {
    const match = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*"(?:markdownContent|content)"[\s\S]*\}/);
    if (match) {
      const jsonCandidate = match[1] || match[0];
      const parsed = JSON.parse(jsonCandidate);
      if (parsed && (parsed.markdownContent || parsed.content)) {
        return { 
          content: (parsed.markdownContent || parsed.content || '').trim(), 
          thoughtProcess: parsed.thoughtProcess || '',
          title: (parsed.title || '').trim()
        };
      }
    }
  } catch (e) {}

  // 3. 마크다운 첫 줄에 # 제목 또는 Title: 등이 적혀있는 경우 추출
  let extractedTitle = '';
  const titleMatch = text.match(/^#\s+(.+)$/m) || text.match(/^(?:Title|제목)\s*:\s*(.+)$/im);
  if (titleMatch) {
    extractedTitle = titleMatch[1].trim();
  }

  // 4. 백틱(```markdown) 코드블록 래핑 및 thoughtProcess 잔재 제거
  let content = text
    .replace(/^```(?:markdown)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .replace(/^(?:thoughtProcess|사고\s*과정|생각의\s*사슬)[\s\S]*?(?=\n##|\n#)/i, '')
    .replace(/^#\s+.+\n+/, '') // 최상단 H1 제목이 본문에 있으면 분리
    .trim();

  return { content, thoughtProcess: '', title: extractedTitle };
}

function safeJsonParse(jsonStr: string, fallback: any = null) {
  try {
    const match = jsonStr.match(/```(?:json)?\s*\n([\s\S]*?)\n```/) || jsonStr.match(/\{[\s\S]*\}/);
    const extracted = match ? (match[1] || match[0]).replace(/```json/g, '').replace(/```/g, '') : jsonStr;
    return JSON.parse(extracted.trim());
  } catch (e) {
    if (fallback !== null) return fallback;
    throw new Error('JSON 파싱 실패');
  }
}

function buildPostFrontmatter(topic: any, content: string, generatedTitle?: string) {
  let finalTitle = (generatedTitle || topic.title || '').replace(/"/g, "'").replace(/\n/g, ' ').trim();
  if (!finalTitle || finalTitle === '새 문서') {
    finalTitle = topic.keyword ? `${topic.keyword} 핵심 쟁점 및 보상 가이드` : '손해사정 실무 가이드';
  }

  let summary = (topic.summary || '').replace(/"/g, "'").replace(/\n/g, ' ').trim();
  if (!summary) {
    summary = content.replace(/[#*`>[\]!]/g, '').replace(/\s+/g, ' ').trim().slice(0, 140);
  }
  if (summary.length > 158) summary = summary.slice(0, 155) + '...';
  
  const kstDate = new Date(Date.now() + 9 * 3600 * 1000).toISOString().split('T')[0];
  const frontmatterData: any = {
    title: finalTitle,
    slug: generateSemanticSlug(finalTitle, topic.slug),
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

  onProgress(`3/5: [${targetCategory}] 블로그 포스팅 기획 및 매력적 제목 설계 중...`);
  const angle = getRandomAngle();
  let topicPlanStr = '';
  try {
    const planPrompt = getTopicPlanningPrompt(dynamicKeyword, dynamicTitle, existingSlugs, targetCategory);
    topicPlanStr = await callGeminiAPI(geminiKey, planPrompt, 'keyword-extraction', TOPIC_SCHEMA, ['lite', 'flash']);
  } catch(e: any) {
    throw new Error('기획안 도출에 실패했습니다: ' + e.message);
  }
  
  const topic = safeJsonParse(topicPlanStr);

  // ⚖️ 판례 카테고리 또는 precedent 모드 시 판례 풀 연동
  let precedentData: any = null;
  if (type === 'precedent' || targetCategory.includes('판례')) {
    try {
      const poolRes = await fetch('/data/precedent-pool.json');
      if (poolRes.ok) {
        const pool = await poolRes.json();
        const valid = pool.filter((p: any) => !p.used && p.caseNumber && p.courtName);
        if (valid.length > 0) {
          const rawTokens = (topic.title + ' ' + dynamicKeyword)
            .replace(/[\(\)\[\]·,]/g, ' ')
            .split(/\s+/)
            .map((t: string) => t.trim())
            .filter((t: string) => t.length >= 2);

          let bestMatch = valid[0];
          let maxScore = 0;

          for (const item of valid) {
            let score = 0;
            const cName = item.caseName || '';
            const sText = item.summary || '';
            for (const tk of rawTokens) {
              if (cName.includes(tk)) score += 3;
              if (sText.includes(tk)) score += 1;
            }
            if (score > maxScore) {
              maxScore = score;
              bestMatch = item;
            }
          }

          precedentData = {
            id: bestMatch.id,
            caseNo: bestMatch.caseNumber,
            caseName: bestMatch.caseName,
            judgmentSummary: bestMatch.summary,
            courtName: bestMatch.courtName
          };
          topic.caseNumber = bestMatch.caseNumber;
          onProgress(`⚖️ [판례 풀 확보] 실존 분조위 결정문 주입: [${bestMatch.courtName}] ${bestMatch.caseNumber} - ${bestMatch.caseName.substring(0, 35)}`);
        }
      }
    } catch (e) {
      console.warn('Precedent pool fetch fallback:', e);
    }
  }

  onProgress('4/5: AI가 단일 헌법 뼈대에 맞추어 전문 칼럼 및 제목을 집필 중입니다 (약 20초 소요)...');
  const prompt = buildArticlePrompt(topic, angle, existingPostsArr, precedentData);
  
  const generated = await callGeminiAPI(geminiKey, prompt, 'auto-generate', CONTENT_SCHEMA, ['flash', 'pro']);
  const { content, thoughtProcess, title: generatedTitle } = parseGeneratedContent(generated);
  if (thoughtProcess) {
    onProgress(`🧠 [사고 과정] : ${thoughtProcess.substring(0, 150)}...`);
  }
  
  onProgress('5/5: 최종 마크다운 및 제목 메타데이터 정규화 완료!');
  const finalContent = buildPostFrontmatter(topic, content, generatedTitle);
  
  onProgress('완료! 에디터에서 내용을 확인하세요.');
  return finalContent;
}

export async function runManualGenerationWorkflow(
  mode: 'manual-preserve' | 'manual-expand' | 'manual-naver' | 'naver-expand' | 'semi-auto' | 'semi-auto-naver',
  aiInput: string,
  geminiKey: string,
  onProgress: (msg: string) => void,
  currentMeta?: any
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

  const currentCategory = currentMeta?.category || '보상가이드';
  const currentTitle = currentMeta?.title || '';
  const isNaver = mode.includes('naver');

  onProgress(`2/3: 사용자 원문 기반 ${isNaver ? '네이버 D.I.A.+' : '구글 E-E-A-T'} 기획안 및 최적 제목 도출 중...`);
  let topicPlanStr = '';
  try {
    const planPrompt = getManualPlanningPrompt(currentTitle, aiInput, existingSlugs, currentCategory, isNaver);
    topicPlanStr = await callGeminiAPI(geminiKey, planPrompt, 'keyword-extraction', TOPIC_SCHEMA, ['lite', 'flash']);
  } catch (e: any) {
    throw new Error('기획안 도출에 실패했습니다: ' + e.message);
  }

  const topic = safeJsonParse(topicPlanStr);

  onProgress('3/3: 전문 칼럼 및 제목 창작 중 (약 25초 소요)...');
  const generated = await callGeminiAPI(geminiKey, aiInput, mode, CONTENT_SCHEMA, ['flash', 'pro'], topic);
  const { content, thoughtProcess, title: generatedTitle } = parseGeneratedContent(generated);
  if (thoughtProcess) {
    onProgress(`🧠 [사고 과정] : ${thoughtProcess.substring(0, 150)}...`);
  }
  
  const finalContent = buildPostFrontmatter(topic, content, generatedTitle);
  
  onProgress('완료! 에디터에서 내용을 확인하세요.');
  return finalContent;
}
