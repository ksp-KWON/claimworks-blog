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

const NEWS_QUERIES = [
  '보험금 지급거절 분쟁',
  '손해사정 교통사고 보상',
  '실손보험 산재 후유장해',
];

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

function yamlSafe(str: string) {
  return String(str || '').replace(/"/g, "'").replace(/\n/g, ' ').trim();
}

function parseGeneratedContent(rawOutput: string) {
  let cleanOutput = rawOutput;
  if (cleanOutput.includes('[ANALYSIS_START]')) {
    cleanOutput = cleanOutput.replace(/\[ANALYSIS_START\][\s\S]*?\[ANALYSIS_END\]/, '').trim();
  }

  const lines = cleanOutput.split('\n');
  let summary = '';
  let contentStart = 0;

  if (lines[0] && lines[0].startsWith('SEO_META:')) {
    summary = yamlSafe(lines[0].replace('SEO_META:', '').trim());
    contentStart = 1;
    while (contentStart < lines.length && lines[contentStart].trim() === '') contentStart++;
  }

  let content = lines.slice(contentStart).join('\n').replace(/\[BLOCK-\d+:[^\]]*\]/gi, '').trim();

  if (!summary) {
    summary = content.replace(/[#*`>[\]!]/g, '').replace(/\s+/g, ' ').trim().slice(0, 140);
  }

  summary = summary.replace(/^\[(.*)\]$/, '$1').trim();
  if (summary.length > 158) summary = summary.slice(0, 155) + '...';

  content = content.replace(/<calculator type=".*?" \/>/gi, '');
  content = content.replace(/\[이미지 제안:.*?\]/g, '');
  content = content.replace(/\[관련 글 추천\]/g, '');
  
  content = content.replace(/^## #\s+Q\s*:/gm, '### Q :');
  content = content.replace(/^## #\s+/gm, '### ');
  content = content.replace(/^## ## /gm, '## ');

  const summaryMarkerIdx = content.indexOf('[추천 제목 2개]');
  if (summaryMarkerIdx >= 0) {
    const beforeMarker = content.substring(0, summaryMarkerIdx).trimEnd();
    content = beforeMarker.endsWith('---') ? beforeMarker.slice(0, -3).trimEnd() : beforeMarker;
  }

  content = content.replace(/^(#{1,3}\s[^`\n]*?)(?<!\s):(?!\s)(?!\/\/)/gm, '$1 : ');
  content = content.replace(/^(#{1,3}\s[^`\n]*?)(?<!\s):\s+(?!\/\/)/gm, '$1 : ');

  content = content.replace(/<blue>보상스쿨에 문의하세요<\/blue>를 통해/g, '전문가의 조력을 통해');
  content = content.replace(/<blue>보상스쿨에 문의하세요<\/blue>는/g, '전문가와의 상담은');
  content = content.replace(/<blue>보상스쿨에 문의하세요<\/blue>와 같은/g, '보상스쿨과 같은');
  content = content.replace(/언제든 <blue>보상스쿨에 문의하세요<\/blue>\./g, '언제든 전문가와 상의하십시오.');
  content = content.replace(/<blue>보상스쿨에 문의하세요\.<\/blue>/g, '전문가와 상의하십시오.');
  content = content.replace(/<blue>보상스쿨에 문의하세요<\/blue>\./g, '전문가와 상의하십시오.');
  content = content.replace(/\*\s*<blue>보상스쿨에 문의하세요<\/blue>\s*:/g, '* 전문가와의 상담 :');
  content = content.replace(/언제든 보상스쿨에 문의하세요\./g, '언제든 전문가와 상의하십시오.');
  content = content.replace(/보상스쿨의 전문 상담 채널을 통해 현재 상황을 진단받아 보시기 바랍니다\.\s*전문가와 상의하십시오\./g, '보상스쿨의 전문 상담 채널을 통해 현재 상황을 진단받아 보시기 바랍니다.');

  content = content.replace(/\n\s*\n\s*\n/g, '\n\n').trim();

  return { summary, content };
}

function buildMarkdownFrontmatter(topic: any, summary: string, content: string) {
  const kstDate = new Date(Date.now() + 9 * 3600 * 1000).toISOString().split('T')[0];
  const tagsStr = (topic.tags || []).map((t: string) => `"${yamlSafe(t)}"`).join(', ');

  let fm = `---
title: "${yamlSafe(topic.title)}"
slug: "${topic.slug || ''}"
date: "${kstDate}"
updatedAt: "${kstDate}"
summary: "${summary}"
category: "${yamlSafe(topic.category)}"
regionCategory: ""
specialtyCategory: "${yamlSafe(topic.specialtyCategory)}"
tags: [${tagsStr}]
---

`;
  return fm + content;
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
      if (keywords.length === 0) throw new Error('추출된 키워드가 없습니다.');
    } catch (e) {
      console.warn('Keyword extraction failed', e);
      throw new Error('뉴스 키워드 추출에 실패했습니다. 프롬프트나 API 응답을 확인하세요.');
    }
  } else {
    throw new Error('오늘자 관련 뉴스가 없어 키워드를 추출할 수 없습니다.');
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
  const existingPostsArr: any[] = [];
  const existingSlugs = '- (없음)'; 
  const trendTitle = rankedKeywords.find(k => k.searchKeyword === finalKeyword)?.newsTitle || '없음';

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
  
  const { summary, content } = parseGeneratedContent(generated);
  const finalContent = buildMarkdownFrontmatter(topic, summary, content);
  
  onProgress('완료! 에디터에서 내용을 확인하세요.');
  return finalContent;
}
