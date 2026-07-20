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
  // ANALYSIS_START/END 블록 제거 (이미 cleanAnalysisBlock이 안 되었을 때를 대비)
  if (cleanOutput.includes('[ANALYSIS_START]')) {
    cleanOutput = cleanOutput.replace(/\[ANALYSIS_START\][\s\S]*?\[ANALYSIS_END\]/, '').trim();
  }

  // SEO_META 스첨이 있으면 제거 (수동모드 호환성 유지)
  cleanOutput = cleanOutput.replace(/^SEO_META:.*$/m, '').trim();

  const lines = cleanOutput.split('\n');
  let contentStart = 0;
  while (contentStart < lines.length && lines[contentStart].trim() === '') contentStart++;

  let content = lines.slice(contentStart).join('\n').replace(/\[BLOCK-\d+:[^\]]*\]/gi, '').trim();
  // 글로벌 정제 필터링
  content = content.replace(/<calculator type=".*?" \/>/gi, '');
  content = content.replace(/\[이미지 제안:.*?\]/g, '');
  content = content.replace(/\[관련 글 추천\]/g, '');
  
  // 제목 교정
  content = content.replace(/^## #\s+Q\s*:/gm, '### Q :');
  content = content.replace(/^## #\s+/gm, '### ');
  content = content.replace(/^## ## /gm, '## ');

  const summaryMarkerIdx = content.indexOf('[추천 제목 2개]');
  if (summaryMarkerIdx >= 0) {
    const beforeMarker = content.substring(0, summaryMarkerIdx).trimEnd();
    content = beforeMarker.endsWith('---') ? beforeMarker.slice(0, -3).trimEnd() : beforeMarker;
  }

  // H2/H3 제목의 콜론 띄어쓰기 정규화
  content = content.replace(/^(#{1,3}\s[^`\n]*?)(?<!\s):(?!\s)(?!\/\/)/gm, '$1 : ');
  content = content.replace(/^(#{1,3}\s[^`\n]*?)(?<!\s):\s+(?!\/\/)/gm, '$1 : ');

  // CTA 텍스트 자연스러운 교정
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

  return { content };
}

module.exports = {
  yamlSafe,
  parseGeneratedContent
};
