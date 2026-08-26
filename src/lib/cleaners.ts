/**
 * cleaners.ts
 * 다양한 공공 API 및 외부 데이터 수집 시 발생하는 텍스트 깨짐,
 * 특수문자 인코딩 오류 등을 정제하는 통합 텍스트 복원 유틸리티 모듈입니다.
 */

export function cleanFssText(text: string): string {
  if (!text) return '';
  const cleaned = text
    // 0. 불필요한 금감원 보도 요지 제목 제거
    .replace(/■?\s*금감원\s*보도\s*요지/g, '')

    // 1. HTML 엔티티 및 기호 복원
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/u203B/g, '※')
    .replace(/\\u203B/g, '※')
    
    // 2. 따옴표 중복 제거
    .replace(/''/g, "'")
    .replace(/""/g, '"')
    
    // 3. 깨진 개행 문자 복원
    .replace(/(?:\b|^)n(?:\b|$)/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');

  // 4. 구조적 파싱 (마크다운 변환)
  const lines = cleaned.split('\n');
  const markdownLines = lines.map(line => {
    const l = line.trim();
    if (!l) return '';

    // 대제목/중제목 파싱 (■, ㅁ)
    if (l.startsWith('■') || l.startsWith('ㅁ')) {
      return `### ■ ${l.substring(1).trim()}`;
    }
    
    // 특별 소제목 파싱 (< 소비자 유의사항 > 등)
    if (l.startsWith('<') && l.endsWith('>')) {
      return `### ${l.substring(1, l.length - 1).trim()}`;
    }
    
    // 소주제 파싱 (▲)
    if (l.startsWith('▲')) {
      return `- **▲ ${l.substring(1).trim()}**`;
    }

    // 불릿 리스트 파싱 (ㅇ, •, *, -)
    if (l.startsWith('ㅇ') || l.startsWith('•') || l.startsWith('*') || l.startsWith('-')) {
      return `- ${l.substring(1).trim()}`;
    }

    // 원문자 넘버링 리스트 파싱 (① ~ ⑳)
    const circledNums = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";
    const index = circledNums.indexOf(l[0]);
    if (index !== -1) {
      return `${index + 1}. ${l.substring(1).trim()}`;
    }

    // 일반 텍스트
    return l;
  });

  // 5. 마크다운 간격 통일 및 찌꺼기 제거
  let finalMarkdown = markdownLines.join('\n');
  
  finalMarkdown = finalMarkdown.replace(/\n(###)/g, '\n\n$1');
  finalMarkdown = finalMarkdown.replace(/([^\n])\n(- |1\. )/g, '$1\n\n$2');
  finalMarkdown = finalMarkdown.replace(/\n{3,}/g, '\n\n');
  finalMarkdown = finalMarkdown.replace(/※\s*자세한\s*내용은\s*첨부파일을\s*참고하시기\s*바랍니다\.?/g, '');

  return finalMarkdown.trim();
}
