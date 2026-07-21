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
    
    // 2. 따옴표 중복 제거 (예: ''26.6.22. -> '26.6.22.')
    .replace(/''/g, "'")
    .replace(/""/g, '"')
    
    // 3. 깨진 개행 문자 복원 (nn, nnnn 등)
    .replace(/(?<![a-zA-Z])n{2,}(?![a-zA-Z])/g, '\n')
    // 구두점이나 기호 뒤에 붙어있는 단독 n 처리 (잘못된 개행)
    .replace(/([가-힣>\]\)\.\!\?\,])n(?=\s|-|①|②|③|④|⑤|■|▲|$)/g, '$1\n')
    
    // 4. 문단 기호 정돈 및 가독성 개선 (ㅁ -> ■, ㅇ -> •)
    .replace(/(?:^|\n)\s*ㅁ\s*/g, '\n\n■ ')
    .replace(/(?:^|\n)\s*■\s*/g, '\n\n■ ')
    .replace(/(?:^|\n)\s*ㅇ\s*/g, '\n  • ')
    .replace(/(?:^|\n)\s*\*\s*/g, '\n  - ')
    
    // 5. 특정 기호(▲, ①~⑳) 앞 줄바꿈
    .replace(/(?<!\n)\s*▲/g, '\n▲ ')
    .replace(/(?<!\n)\s*([①-⑳])/g, '\n$1 ')
    
    // 6. 소제목 및 번호(01, 02 등) 앞 줄바꿈
    .replace(/(?<!\n)\s*(<[^>]+>)\s*/g, '\n\n$1\n')
    .replace(/(?:^|\n)\s*([0-9]{2}\s+[가-힣])/g, '\n\n$1')
    .replace(/(?<!\n)\s*예시\)/g, '\n\n예시) ')
    
    // 7. 불필요한 안내 멘트 정리
    .replace(/※\s*자세한\s*내용은\s*첨부파일을\s*참고하시기\s*바랍니다\.?/g, '')
    
    // 8. 빈 줄 정리 (과도한 줄바꿈 및 공백 축소)
    .replace(/\n(?:\s*\n)+/g, '\n\n') // 여러 빈 줄을 단 하나의 빈 줄로 강제 압축
    .trim();
}

module.exports = {
  cleanFssText
};
