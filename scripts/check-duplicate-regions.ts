/**
 * scripts/check-duplicate-regions.ts
 * 전국 250개 시·군·구 지역 페이지 본문 중복 방지 및 자카드 유사도 자동 검증 게이트
 * 
 * [검증 기준]
 * 1. 250개 전 지역 본문 텍스트 생성 무결성
 * 2. 지역명/사법기관/병원명 마스킹 후 순수 본문 SHA-256 해시 충돌 0건
 * 3. 단어 단위 자카드 유사도(Jaccard Similarity) 임계치: 최대 60% 이하 유지
 * 4. 위반 시 process.exit(1)로 CI/CD 및 커밋 원천 차단
 */

import crypto from 'crypto';
import { REGIONS_DATA } from '../src/lib/constants';
import { getRegionContent } from '../src/lib/region-content';

interface RegionTextEntry {
  sido: string;
  gugun: string;
  fullKey: string;
  archetype: string;
  rawText: string;
  normalizedText: string;
  hash: string;
  words: Set<string>;
}

// 1. 단어 토큰화 헬퍼 (불용어 및 공백 제거)
function tokenize(text: string): Set<string> {
  const words = text
    .replace(/[^\w가-힣\s]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length >= 2);
  return new Set(words);
}

// 2. 자카드 유사도 계산 (단어 집합 기준: 교집합 크기 / 합집합 크기)
function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersectionCount = 0;
  for (const word of setA) {
    if (setB.has(word)) {
      intersectionCount++;
    }
  }

  const unionSize = setA.size + setB.size - intersectionCount;
  return unionSize === 0 ? 0 : (intersectionCount / unionSize) * 100;
}

export function runDuplicateCheck(): { passed: boolean; maxSimilarity: number; totalRegions: number } {
  console.log('🔍 [지역 페이지 중복 검증 게이트] 전국 시군구 본문 품질 검사 시작...\n');

  const entries: RegionTextEntry[] = [];
  const archetypeCounts: Record<string, number> = {
    TERTIARY_HUB: 0,
    SPINE_JOINT_REHAB: 0,
    INDUSTRIAL_TRAUMA: 0,
    COMMUNITY_PRIMARY: 0,
  };

  // 1. 250개 전 지역 본문 생성 및 정규화
  for (const region of REGIONS_DATA) {
    for (const district of region.districts) {
      const content = getRegionContent(region.name, district);
      archetypeCounts[content.archetype] = (archetypeCounts[content.archetype] || 0) + 1;

      // 전체 텍스트 결합 (요약 박스 + 메인 가이드 제목/문단 + 전문가 팁 + 관할 안내)
      const rawText = [
        ...content.summaryBox,
        content.mainGuideTitle,
        ...content.guideParagraphs,
        content.specialtyAdviceTitle,
        content.specialtyAdviceContent,
        content.courtActionGuide,
      ].join(' ');

      // 지역 고유 변수 마스킹 (단순 변수 갈아끼우기 방지)
      let normalizedText = rawText
        .replaceAll(region.name, '[SIDO]')
        .replaceAll(district, '[GUGUN]')
        .replaceAll(content.jurisdiction.court, '[COURT]')
        .replaceAll(content.jurisdiction.prosecution, '[PROSECUTION]')
        .replaceAll(content.jurisdiction.highCourt, '[HIGHCOURT]');

      content.hospitalStat.majorHospitals.forEach(h => {
        if (h.name) {
          normalizedText = normalizedText.replaceAll(h.name, '[HOSPITAL]');
        }
      });

      const hash = crypto.createHash('sha256').update(normalizedText).digest('hex');
      const words = tokenize(normalizedText);

      entries.push({
        sido: region.name,
        gugun: district,
        fullKey: `${region.name} ${district}`,
        archetype: content.archetype,
        rawText,
        normalizedText,
        hash,
        words,
      });
    }
  }

  console.log(`📊 [전수 집계 완료] 총 ${entries.length}개 시·군·구 분석`);
  console.log(`   - 상급종합 및 다학제 중증의료형 (TERTIARY_HUB)   : ${archetypeCounts.TERTIARY_HUB}개`);
  console.log(`   - 척추·관절 및 교통사고 재활형 (SPINE_JOINT_REHAB): ${archetypeCounts.SPINE_JOINT_REHAB}개`);
  console.log(`   - 산업재해 및 급성 외상 집중형 (INDUSTRIAL_TRAUMA): ${archetypeCounts.INDUSTRIAL_TRAUMA}개`);
  console.log(`   - 지역밀착 1차 케어 거점형 (COMMUNITY_PRIMARY)  : ${archetypeCounts.COMMUNITY_PRIMARY}개\n`);

  // 2. SHA-256 해시 충돌 검사 (마스킹 후 텍스트 기준)
  console.log('🔒 [게이트 1] 변수 제거 순수 본문 SHA-256 해시 충돌 전수 검사 진행...');
  const hashLookup = new Map<string, RegionTextEntry>();
  for (const entry of entries) {
    if (hashLookup.has(entry.hash)) {
      const prev = hashLookup.get(entry.hash)!;
      console.error(`\n❌ [차단] SHA-256 해시 충돌 감지! 단순 템플릿 복제 의심:`);
      console.error(`   - 지역 A: ${prev.fullKey} (${prev.archetype})`);
      console.error(`   - 지역 B: ${entry.fullKey} (${entry.archetype})`);
      console.error(`   - 해시값: ${entry.hash}`);
      process.exit(1);
    }
    hashLookup.set(entry.hash, entry);
  }
  console.log(`   ✅ 해시 충돌 0건 통과! (250개 전 지역 순수 본문 100% 비동일)\n`);

  // 3. 자카드 단어 유사도 전수 검사 (임계치: 60%)
  console.log('📐 [게이트 2] 자카드 단어 유사도(Jaccard Similarity ≤ 60%) 전수 검사 진행...');
  const SIMILARITY_THRESHOLD = 60.0;
  let maxSimilarity = 0;
  let worstPair = { r1: '', r2: '', sim: 0 };

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const e1 = entries[i];
      const e2 = entries[j];

      // 동일 시도 내 인접 구군이거나 동일 아키텍처인 경우 중점 검사
      const similarity = calculateJaccardSimilarity(e1.words, e2.words);

      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        worstPair = { r1: e1.fullKey, r2: e2.fullKey, sim: similarity };
      }

      if (similarity > SIMILARITY_THRESHOLD) {
        console.error(`\n❌ [차단] 자카드 단어 유사도 임계치(${SIMILARITY_THRESHOLD}%) 초과 감지!`);
        console.error(`   - 지역 A: ${e1.fullKey} (${e1.archetype})`);
        console.error(`   - 지역 B: ${e2.fullKey} (${e2.archetype})`);
        console.error(`   - 측정 유사도: ${similarity.toFixed(2)}% (허용치: ${SIMILARITY_THRESHOLD}%)`);

        const commonWords = [...e1.words].filter(w => e2.words.has(w));
        console.error(`   - 공통 단어 수: ${commonWords.length}개 / 합집합: ${e1.words.size + e2.words.size - commonWords.length}개`);
        console.error(`   - 공통 단어 샘플:`, commonWords.slice(0, 30).join(', '));
        process.exit(1);
      }
    }
  }

  console.log(`   ✅ 자카드 유사도 상한 게이트 통과!`);
  console.log(`   - 전사 최고 유사도 쌍: [${worstPair.r1}] vs [${worstPair.r2}] (${worstPair.sim.toFixed(2)}%)`);
  console.log(`   - 전사 모든 지역 쌍이 허용 기준(60%) 이하를 엄격히 만족합니다.\n`);

  console.log('🎉 [검증 완료] 전국 250개 시·군·구 고유 콘텐츠 검증 100% 통과 (exit code 0)\n');
  return { passed: true, maxSimilarity, totalRegions: entries.length };
}

// 직접 실행 시 구동
if (require.main === module || process.argv[1]?.includes('check-duplicate-regions')) {
  runDuplicateCheck();
}
