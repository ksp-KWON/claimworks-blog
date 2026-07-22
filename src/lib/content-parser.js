/**
 * content-parser.js
 * 블로그 자동글쓰기 텍스트 파싱 및 프론트매터(Frontmatter) 조립 코어
 * (브라우저와 Node.js 환경 모두에서 작동 가능한 순수 함수 모음)
 */

function yamlSafe(str) {
  return String(str || '').replace(/"/g, "'").replace(/\n/g, ' ').trim();
}

function parseGeneratedContent(rawOutput) {
  let cleanOutput = rawOutput;
  
  // 1. 기획안(Analysis) 블록 강제 제거 (AI 오타 대비 강력한 정규식)
  cleanOutput = cleanOutput.replace(/\[ANALYSIS_START\][\s\S]*?\[ANAL[A-Z_]*END\]\s*/g, '');
  
  // 2. AI가 자체적으로 출력해버린 프론트매터(---) 찌꺼기 1회 제거
  cleanOutput = cleanOutput.replace(/^---[\s\S]*?---\n/, '');

  // 3. 수동모드 호환성 (SEO_META 스니펫)
  cleanOutput = cleanOutput.replace(/^SEO_META:.*$/gm, '').trim();

  const lines = cleanOutput.split('\n');
  let contentStart = 0;
  while (contentStart < lines.length && lines[contentStart].trim() === '') contentStart++;

  let content = lines.slice(contentStart).join('\n').trim();

  // 4. 불필요한 AI 환각(Hallucination) 텍스트 및 메타 블록 일괄 제거 (프론트엔드로 넘어가기 전 처리)
  content = content.replace(/\[BLOCKS?-\d+[^\]]*\]/gi, '');
  content = content.replace(/<calculator type=".*?" \/>/gi, '');
  content = content.replace(/\[이미지 제안:.*?\]/g, '');
  content = content.replace(/\[관련 글 추천\]/g, '');
  content = content.replace(/\[[^\]]*(?:카카오|상담)[^\]]*\]\([^)]*\)/g, ''); // 상담 유도 링크 일괄 삭제
  
  // 5. 마크다운 포맷팅 교정
  // AI가 불필요하게 감싸는 코드블록(```) 강제 해제
  content = content.replace(/```[a-z]*\n([\s\S]*?)\n```/gi, '$1\n');
  // 4칸 이상 들여쓰기로 인한 <pre> 렌더링 방지 (2칸으로 축소)
  content = content.replace(/^( {4,})([└\-*])/gm, '  $2');
  // 제목 교정 (잘못된 띄어쓰기나 구조 정규화)
  content = content.replace(/^## #\s+Q\s*:/gm, '### Q :');
  content = content.replace(/^## #\s+/gm, '### ');
  content = content.replace(/^## ## /gm, '## ');
  
  // 6. H2/H3 제목의 콜론 띄어쓰기 정규화
  content = content.replace(/^(#{1,3}\s[^`\n]*?)(?<!\s):(?!\s)(?!\/\/)/gm, '$1 : ');
  content = content.replace(/^(#{1,3}\s[^`\n]*?)(?<!\s):\s+(?!\/\/)/gm, '$1 : ');

  // 7. 남은 잔재(추천 제목 등) 제거
  const summaryMarkerIdx = content.indexOf('[추천 제목 2개]');
  if (summaryMarkerIdx >= 0) {
    const beforeMarker = content.substring(0, summaryMarkerIdx).trimEnd();
    content = beforeMarker.endsWith('---') ? beforeMarker.slice(0, -3).trimEnd() : beforeMarker;
  }

  // 8. 레거시 보상스쿨 상담 유도 텍스트 정제
  const legacyPhrases = [
    [/<blue>보상스쿨에 문의하세요<\/blue>를 통해/g, '전문가의 조력을 통해'],
    [/<blue>보상스쿨에 문의하세요<\/blue>는/g, '전문가와의 상담은'],
    [/<blue>보상스쿨에 문의하세요<\/blue>와 같은/g, '보상스쿨과 같은'],
    [/언제든 <blue>보상스쿨에 문의하세요<\/blue>\./g, '언제든 전문가와 상의하십시오.'],
    [/<blue>보상스쿨에 문의하세요\.<\/blue>/g, '전문가와 상의하십시오.'],
    [/<blue>보상스쿨에 문의하세요<\/blue>\./g, '전문가와 상의하십시오.'],
    [/\*\s*<blue>보상스쿨에 문의하세요<\/blue>\s*:/g, '* 전문가와의 상담 :'],
    [/언제든 보상스쿨에 문의하세요\./g, '언제든 전문가와 상의하십시오.'],
    [/보상스쿨의 전문 상담 채널을 통해 현재 상황을 진단받아 보시기 바랍니다\.\s*전문가와 상의하십시오\./g, '보상스쿨의 전문 상담 채널을 통해 현재 상황을 진단받아 보시기 바랍니다.']
  ];
  legacyPhrases.forEach(([pattern, replacement]) => {
    content = content.replace(pattern, replacement);
  });

  content = content.replace(/\n\s*\n\s*\n/g, '\n\n').trim();

  return { summary: '', content };
}

function buildMarkdownFrontmatter(topic, summary, content, additionalFrontmatter = {}) {
  const dateStr = new Date().toISOString();
  const safeTitle = yamlSafe(topic.title);
  const safeSummary = yamlSafe(summary || topic.summary || '');
  const safeCategory = yamlSafe(topic.category);
  const safeSlug = topic.slug;
  const safeCalcType = topic.calculatorType || 'auto';
  
  let tagsStr = '';
  if (Array.isArray(topic.tags)) {
    tagsStr = `\ntags:\n${topic.tags.map(t => `  - ${yamlSafe(t)}`).join('\n')}`;
  } else if (typeof topic.tags === 'string') {
    tagsStr = `\ntags:\n  - ${yamlSafe(topic.tags)}`;
  }

  let addFm = '';
  if (additionalFrontmatter) {
    for (const [k, v] of Object.entries(additionalFrontmatter)) {
      addFm += `\n${k}: ${yamlSafe(v)}`;
    }
  }

  return `---
title: "${safeTitle}"
summary: "${safeSummary}"
date: "${dateStr}"
category: "${safeCategory}"${tagsStr}${addFm}
slug: "${safeSlug}"
calculatorType: "${safeCalcType}"
---

${content}
`;
}

module.exports = {
  yamlSafe,
  parseGeneratedContent,
  buildMarkdownFrontmatter
};
