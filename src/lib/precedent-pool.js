/**
 * precedent-pool.js
 * 판례 및 금융분쟁조정 결정례 풀(Pool) 전사 단일 관리 및 2중 자가 검증 모듈
 * 
 * [헌법 6대 슬로건: 표준 · 범용 · 콤팩트 · 통합 · 공유 · 공통]
 * 1. 단일 진실의 원천 (SSOT):
 *    - 백엔드(Node.js)와 프론트엔드(Browser)가 오직 'public/data/precedent-pool.json' 하나만 공유.
 *    - 중복 복사본 및 동기화 지연 원천 박멸.
 * 2. 2중 자가 검증 게이트 (Self-Validation Guardrail):
 *    - source 도장('law.go.kr' 또는 'fss-dispute'), 정식 사건번호(숫자 필수), 법원명 결측치 기계적 배제.
 * 3. 사전 예방적 스키마 유효성 검증:
 *    - 비정상 데이터 주입 시 저장을 거부하는 선제적 방어.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// 전사 단일 풀 경로 (Next.js public 디렉토리)
const POOL_PATH = path.resolve(process.cwd(), 'public/data/precedent-pool.json');

// 판례 검색 시 흔하게 등장하여 오탐을 일으키는 범용 불용어 목록
const STOP_WORDS = new Set([
  '보험', '사고', '청구', '지급', '기준', '분쟁', '손해', '면책', '인정', '대상', '여부', '관련', '사례'
]);

/**
 * 풀에서 검증된 미사용 판례/분조위 1건 조회
 * @param {string} [keyword] - 검색 키워드 (선택)
 * @returns {object|null} - 연관 선례가 있으면 객체 반환, 없으면 null 반환 (억지 매칭 금지)
 */
function getVerifiedPrecedent(keyword = '') {
  if (!fs.existsSync(POOL_PATH)) return null;

  let pool = [];
  try {
    pool = JSON.parse(fs.readFileSync(POOL_PATH, 'utf8'));
  } catch {
    return null;
  }

  // 1차 검증: 공식 source, 정식 사건번호(숫자 포함), 필수 필드를 온전히 갖춘 미사용 항목 필터링
  const validItems = pool.filter(item => {
    if (item.used === true) return false;
    if (!item.caseNumber || !/\d/.test(item.caseNumber) || !item.courtName) return false;
    if (!item.source || (!item.source.includes('law.go.kr') && !item.source.includes('fss-dispute') && !item.source.includes('fss-official'))) {
      return false; // 공식 출처 도장이 없는 임의 데이터는 기계적으로 거부
    }
    return true;
  });

  if (validItems.length === 0) return null;

  // 2단계: 지능형 토큰 스코어링 검색 (Token Scoring Search)
  let selected = null;
  let highestScore = 0;

  if (keyword) {
    // 불용어를 제외한 2글자 이상의 핵심 키워드 토큰 추출
    const tokens = keyword
      .replace(/[\(\)\[\]·,]/g, ' ')
      .split(/\s+/)
      .map(t => t.trim())
      .filter(t => t.length >= 2 && !STOP_WORDS.has(t));

    if (tokens.length > 0) {
      for (const item of validItems) {
        let score = 0;
        const caseName = item.caseName || '';
        const summary = item.summary || '';
        const targetKw = item.targetKeyword || '';

        for (const token of tokens) {
          if (caseName.includes(token)) score += 5;     // 안건명 일치 시 최고 가중치
          if (targetKw.includes(token)) score += 3;    // 타겟 키워드 일치 시
          if (summary.includes(token)) score += 1;     // 요약문 일치 시
        }

        if (score > highestScore) {
          highestScore = score;
          selected = item;
        }
      }
    }
  }

  // 🚨 선제적 예방 원칙: 핵심 토큰이 최소 1개 이상 유의미하게 일치(스코어 4 이상)할 때만 채택.
  // 무관한 주제(스코어 미달)인데도 억지로 validItems[0]을 쥐어주는 코드 영구 폐기!
  if (highestScore < 4) {
    selected = null;
  }

  if (!selected) {
    return null; // 연관 선례가 없으면 정직하게 null 반환
  }

  return {
    item: selected,
    markAsUsed: () => {
      selected.used = true;
      selected.usedAt = new Date().toISOString();
      savePool(pool);
      console.log(`    💾 [판례 풀 갱신] 사건 [${selected.caseNumber}] 사용 완료 마킹 (남은 미사용: ${validItems.length - 1}건)`);
    }
  };
}

/**
 * 풀 안전 저장 (선제적 스키마 검증)
 * @param {Array} pool - 판례 배열
 */
function savePool(pool) {
  if (!Array.isArray(pool)) {
    throw new Error('판례 풀은 반드시 배열이어야 합니다.');
  }

  // 사전 예방: 사건번호에 숫자가 반드시 포함되고 요약문이 충실한 유효 항목만 보존
  const sanitized = pool.filter(item => 
    item && 
    item.caseNumber && 
    /\d/.test(item.caseNumber) && 
    item.courtName &&
    item.summary &&
    item.summary.length >= 30
  );
  const jsonStr = JSON.stringify(sanitized, null, 2);

  const dir = path.dirname(POOL_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(POOL_PATH, jsonStr, 'utf8');
}

module.exports = { getVerifiedPrecedent, POOL_PATH, savePool };
