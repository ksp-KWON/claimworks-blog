/**
 * cleaners.js
 * 다양한 공공 API 및 외부 데이터 수집 시 발생하는 텍스트 깨짐,
 * 특수문자 인코딩 오류 등을 정제하는 통합 텍스트 복원 유틸리티 모듈입니다.
 * CommonJS 형식으로 작성되어 Node.js 스크립트와 Next.js 프론트엔드 양쪽에서 모두 안전하게 호환됩니다.
 */

/**
 * 금감원 API 특유의 깨진 개행(nn) 및 HTML 엔티티를 정제하고,
 * 리스트 기호를 가독성 높은 기호로 포맷팅하여 미려한 줄바꿈을 유지합니다.
 * 
 * @param {string} text 원본 텍스트
 * @returns {string} 정제된 텍스트
 */
function cleanFssText(text) {
  if (!text) return '';
  return text
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
    
    // 2. 따옴표 중복 제거 (예: ''26.6.22. -> '26.6.22.')
    .replace(/''/g, "'")
    .replace(/""/g, '"')
    
    // 3. 깨진 개행 문자 복원 (nn, nnnn 등)
    // 영어 단어 내부의 nn(예: planning, runner)을 파괴하지 않기 위해 전후방 탐색(Lookahead/Lookbehind) 적용
    .replace(/(?<![a-zA-Z])n{2,}(?![a-zA-Z])/g, '\n')
    
    // 4. 문단 기호 정돈 및 가독성 개선 (ㅁ -> ■, ㅇ -> •)
    .replace(/(?:^|\n)\s*ㅁ\s*/g, '\n■ ')
    .replace(/(?:^|\n)\s*ㅇ\s*/g, '\n  • ')
    .replace(/(?:^|\n)\s*\*\s*/g, '\n  - ')
    
    // 5. 불필요한 안내 멘트 정리
    .replace(/※\s*자세한\s*내용은\s*첨부파일을\s*참고하시기\s*바랍니다\.?/g, '')
    
    // 6. 빈 줄 정리 (과도한 줄바꿈 축소)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

module.exports = {
  cleanFssText
};
