/**
 * precedent-pool.js
 * 판례 및 분쟁조정 결정례 풀(Pool) 관리 및 자가 검증 모듈
 * 
 * [헌법 원칙]
 * 1. 약속이 아닌 코드로 강제하는 2중 자가 검증 (Self-Validation Gate)
 *    - source, caseNumber, courtName 필수 필드가 없는 항목은 소비 단계에서 자동 스킵
 * 2. 500건 초과 시 자동 모니터링 알림
 * 3. 콤팩트 스키마 및 사용 여부(used) 마킹
 */

'use strict';

const fs = require('fs');
const path = require('path');

const POOL_PATH = path.resolve(__dirname, '../data/precedent-pool.json');

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

  // 500건 모니터링 알림
  if (pool.length >= 500) {
    console.warn(`\n🔔 [판례 풀 모니터링] 총 ${pool.length}건 적재됨 — 향후 DB(D1/Supabase) 이관 검토를 권장합니다.`);
  }

  // 1차 검증: 공식 source 및 필수 필드를 온전히 갖춘 미사용 항목 필터링
  const validItems = pool.filter(item => {
    if (item.used === true) return false;
    if (!item.caseNumber || !item.courtName) return false;
    if (!item.source || (!item.source.includes('law.go.kr') && !item.source.includes('fss-dispute'))) {
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
      fs.writeFileSync(POOL_PATH, JSON.stringify(pool, null, 2), 'utf8');
      console.log(`    💾 [판례 풀 갱신] 사건 [${selected.caseNumber}] 사용 완료 마킹 (남은 미사용: ${validItems.length - 1}건)`);
    }
  };
}

module.exports = { getVerifiedPrecedent, POOL_PATH };
