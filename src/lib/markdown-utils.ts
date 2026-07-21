import matter from 'gray-matter';

/**
 * 표준 마크다운 파서 - 어떤 형태의 프론트매터나 특수문자, 줄바꿈(CRLF/LF)도 안전하게 파싱합니다.
 */
export function parseMarkdown(rawContent: string) {
  try {
    // 1. 노이즈 제거 (마크다운 코드블록 마커 등)
    const cleanRaw = rawContent.replace(/^```(?:markdown|md)?\s*\n/i, '').replace(/\n```\s*$/, '').trim();
    
    // 2. gray-matter를 통해 100% 안전하게 파싱
    const { data, content } = matter(cleanRaw);
    
    return { data, content: content.trim() };
  } catch (e) {
    console.error('마크다운 파싱 에러:', e);
    return { data: {}, content: rawContent };
  }
}

/**
 * 표준 마크다운 생성기 - 템플릿 문자열 조합 없이 객체를 안전하게 YAML 프론트매터로 변환합니다.
 */
export function stringifyMarkdown(data: Record<string, any>, content: string) {
  try {
    // 데이터 중 null/undefined 정리
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([k, v]) => v != null && v !== '')
    );
    
    return matter.stringify(content, cleanData);
  } catch (e) {
    console.error('마크다운 생성 에러:', e);
    // 에러시 원본이라도 리턴
    return content;
  }
}
