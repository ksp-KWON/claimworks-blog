/**
 * precedent-pool.js
 * 판례 및 금융분쟁조정 결정례 풀(Pool) 전사 단일 관리 및 2중 자가 검증 모듈
 * 
 * [헌법 6대 슬로건: 표준 · 범용 · 콤팩트 · 통합 · 공유 · 공통]
 * 1. 단일 진실의 원천 (SSOT):
 *    - 백엔드(Node.js)와 프론트엔드(Browser)가 오직 'public/data/precedent-pool.json' 하나만 공유.
 *    - 중복 복사본 및 동기화 지연 원천 박멸.
 * 2. 2중 자가 검증 게이트 (Self-Validation Guardrail):
 *    - source 도장('law.go.kr' 또는 'fss-dispute'), 사건번호, 법원명 결측치 기계적 배제.
 * 3. 사전 예방적 스키마 유효성 검증:
 *    - 비정상 데이터 주입 시 저장을 거부하는 선제적 방어.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// 전사 단일 풀 경로 (Next.js public 디렉토리)
const POOL_PATH = path.resolve(process.cwd(), 'public/data/precedent-pool.json');

/**
 * 풀에서 검증된 미사용 판례/분조위 1건 조회
 * @param {string} [keyword] - 검색 키워드 (선택)
 * @returns {object|null}
 */
function getVerifiedPrecedent(keyword = '') {
  if (!fs.existsSync(POOL_PATH)) return null;

  let pool = [];
  try {
    pool = JSON.parse(fs.readFileSync(POOL_PATH, 'utf8'));
  } catch {
    return null;
  }

  // 1차 검증: 공식 source 및 필수 필드를 온전히 갖춘 미사용 항목 필터링
  const validItems = pool.filter(item => {
    if (item.used === true) return false;
    if (!item.caseNumber || !item.courtName) return false;
    if (!item.source || (!item.source.includes('law.go.kr') && !item.source.includes('fss-dispute') && !item.source.includes('fss-official'))) {
      return false; // 공식 출처 도장이 없는 임의 데이터는 기계적으로 거부
    }
    return true;
  });

  if (validItems.length === 0) return null;

  // 키워드 매칭 우선 탐색
  let selected = null;
  if (keyword) {
    const cleanKw = keyword.replace(/\s+/g, '');
    selected = validItems.find(item => {
      const target = (item.caseName + (item.summary || '') + (item.targetKeyword || '')).replace(/\s+/g, '');
      return target.includes(cleanKw);
    });
  }

  // 매칭 항목이 없으면 미사용 첫 번째 항목 선택
  if (!selected) {
    selected = validItems[0];
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

  // 사전 예방: 유효 항목만 보존
  const sanitized = pool.filter(item => item && item.caseNumber && item.courtName);
  const jsonStr = JSON.stringify(sanitized, null, 2);

  const dir = path.dirname(POOL_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(POOL_PATH, jsonStr, 'utf8');
}

module.exports = { getVerifiedPrecedent, POOL_PATH, savePool };
