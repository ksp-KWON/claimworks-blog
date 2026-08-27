/**
 * gemini-helper.js
 * Gemini API 호출 공통 유틸리티 (백엔드 / GitHub Actions용)
 *
 * [핵심 설계] 3단계 무중단 릴레이 & 최신 Google AI Studio 공식 Alias 완벽 지원
 * — models.list API를 호출하여 현재 실제로 사용 가능한 최신 모델들을 실시간 자동 탐색
 * — Lite(기획/키워드) + Flash(전문 칼럼 집필) 2단계 최적 분업
 * — 429(할당량) / 404(구버전 중단) 발생 시 지체 없이 차순위 모델로 릴레이 전환
 */

'use strict';

const { sleep } = require('./pipeline-utils.js');

// ── 모델 계열 정의 ────────────────────────────────────────────────────────────
const MODEL_TIERS = [
  {
    tier: 'flash',
    match: name => /gemini/i.test(name) && /flash/i.test(name) && !/lite/i.test(name),
    maxTokensFallback: 32768,
  },
  {
    tier: 'lite',
    match: name => /gemini/i.test(name) && /flash/i.test(name) && /lite/i.test(name),
    maxTokensFallback: 16384,
  },
  {
    tier: 'pro',
    match: name => /gemini/i.test(name) && /pro/i.test(name) && !/lite/i.test(name),
    maxTokensFallback: 32768,
  },
];

// ── 재시도 설정 ───────────────────────────────────────────────────────────────
const RETRY_CONFIG = {
  maxRetries: 1,
  retryOn: [500, 503, 529],
};

// ── 버전 파싱: 모델명에서 숫자 버전 추출 (정렬용) ─────────────────────────────
function parseVersion(modelName) {
  if (/latest/i.test(modelName)) return [999, 999]; // latest alias는 최우선
  const match = modelName.match(/(\d+)\.(\d+)/);
  if (!match) return [0, 0];
  return [parseInt(match[1], 10), parseInt(match[2], 10)];
}

function compareVersionsDesc(a, b) {
  const [aMaj, aMin] = parseVersion(a.name);
  const [bMaj, bMin] = parseVersion(b.name);
  return bMaj !== aMaj ? bMaj - aMaj : bMin - aMin;
}

// ── 내장 기본값 폴백 (탐색 실패 시 안전망) ───────────────────────────────────
const FALLBACK_MODELS = [
  { name: 'gemini-flash-latest',   maxTokens: 32768, tier: 'flash' },
  { name: 'gemini-3.6-flash',      maxTokens: 32768, tier: 'flash' },
  { name: 'gemini-3.5-flash',      maxTokens: 32768, tier: 'flash' },
  { name: 'gemini-2.5-flash',      maxTokens: 32768, tier: 'flash' },
  { name: 'gemini-flash-lite-latest', maxTokens: 16384, tier: 'lite' },
  { name: 'gemini-3.5-flash-lite', maxTokens: 16384, tier: 'lite' },
  { name: 'gemini-3.1-flash-lite', maxTokens: 16384, tier: 'lite' },
  { name: 'gemini-pro-latest',     maxTokens: 32768, tier: 'pro' },
];

let _discoveredModels = null;

async function discoverModels() {
  if (_discoveredModels && _discoveredModels.length > 0) return _discoveredModels;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.length < 10) {
    throw new Error('GEMINI_API_KEY가 등록되지 않았거나 유효하지 않습니다.');
  }

  console.log('  [모델 탐색] Gemini API에서 최신 사용 가능 모델을 자동 탐색 중...');

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?pageSize=100&key=${apiKey}`,
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (!res.ok) throw new Error(`models.list HTTP ${res.status}`);
    const data = await res.json();
    
    const allModels = (data.models ?? [])
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      .map(m => ({ name: m.name.replace('models/', ''), maxTokens: m.outputTokenLimit ?? null }));

    const selected = [];
    for (const { tier, match, maxTokensFallback } of MODEL_TIERS) {
      const candidates = allModels
        .filter(m => match(m.name) && !/experimental/i.test(m.name))
        .sort(compareVersionsDesc);

      for (const cand of candidates) {
        selected.push({
          name: cand.name,
          maxTokens: cand.maxTokens ?? maxTokensFallback,
          tier,
        });
      }
    }

    if (selected.length > 0) {
      _discoveredModels = selected;
      console.log(`  [탐색 완료] 총 ${selected.length}개 유효 모델 릴레이 큐 등록 완료.`);
      return _discoveredModels;
    }
  } catch (err) {
    console.warn(`  [경고] 모델 탐색 실패 (${err.message}). 내장 기본 릴레이로 폴백합니다.`);
  }

  _discoveredModels = FALLBACK_MODELS;
  return _discoveredModels;
}

/**
 * @param {string} prompt - 보낼 프롬프트
 * @param {object|null} schema - JSON 출력용 스키마
 * @param {string} targetTier - 'auto' (flash 우선), 'lite' (lite 우선), 'flash' (flash 우선)
 * @returns {Promise<string|object>}
 */
async function callGemini(prompt, schema = null, targetTier = 'auto') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.length < 10) {
    throw new Error('GEMINI_API_KEY가 등록되지 않았거나 유효하지 않습니다.');
  }

  const allModels = await discoverModels();
  
  // 타겟 티어 우선 정렬
  let prioritizedModels = allModels;
  if (targetTier === 'lite') {
    const preferred = allModels.filter(m => m.tier === 'lite');
    const backup = allModels.filter(m => m.tier !== 'lite');
    prioritizedModels = [...preferred, ...backup];
  } else if (targetTier === 'flash') {
    const preferred = allModels.filter(m => m.tier === 'flash');
    const backup = allModels.filter(m => m.tier !== 'flash');
    prioritizedModels = [...preferred, ...backup];
  }

  const baseConfig = { temperature: schema ? 0.2 : 0.75 };
  if (schema) {
    baseConfig.responseMimeType = 'application/json';
    baseConfig.responseSchema   = schema;
  }

  let lastError = '';

  modelLoop: for (const { name: model, maxTokens } of prioritizedModels) {
    const generationConfig = {
      ...baseConfig,
      maxOutputTokens: maxTokens,
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 90000);
      let res;

      try {
        console.log(`  [API] ${model} 호출 중... (시도: ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1})`);
        res = await fetch(url, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
          signal:  controller.signal,
        });
      } catch (networkErr) {
        lastError = `[${model}] 네트워크 에러: ${networkErr.message}`;
        console.error(`  [실패] ${model} 네트워크 오류: ${networkErr.message.slice(0, 60)}.`);
        if (attempt < RETRY_CONFIG.maxRetries) { await sleep(2000); continue; }
        continue modelLoop;
      } finally {
        clearTimeout(timeoutId);
      }

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        lastError = `[${model}] HTTP ${res.status}: ${errorText.slice(0, 100)}`;

        // 429(할당량) 또는 404(모델 중단) → 1초 쿨다운 후 다음 차선책 모델로 즉시 바통 터치
        if (res.status === 429 || res.status === 404) {
          console.warn(`  [전환] ${model} 상태 ${res.status} — 쿨다운 후 다음 차선책 모델로 릴레이 전환합니다.`);
          await sleep(1000);
          continue modelLoop;
        }

        const shouldRetry = RETRY_CONFIG.retryOn.includes(res.status) && attempt < RETRY_CONFIG.maxRetries;
        if (!shouldRetry) {
          console.warn(`  [전환] ${model} HTTP ${res.status} — 다음 모델로 전환합니다.`);
          continue modelLoop;
        }

        await sleep(2000);
        continue;
      }

      let data;
      try {
        data = await res.json();
      } catch {
        lastError = `[${model}] JSON 파싱 오류`;
        if (attempt < RETRY_CONFIG.maxRetries) { await sleep(1500); continue; }
        continue modelLoop;
      }

      const candidate    = data?.candidates?.[0];
      const text         = (candidate?.content?.parts ?? []).map(p => p.text ?? '').join('');

      if (!text) {
        lastError = `[${model}] 빈 응답 수신`;
        if (attempt < RETRY_CONFIG.maxRetries) { await sleep(1500); continue; }
        continue modelLoop;
      }

      if (schema) {
        try {
          return JSON.parse(text.trim());
        } catch {
          lastError = `[${model}] JSON 스키마 파싱 오류`;
          if (attempt < RETRY_CONFIG.maxRetries) { await sleep(1500); continue; }
          continue modelLoop;
        }
      }
      return text;
    }
  }

  throw new Error(`모든 Gemini 모델 통신에 실패했습니다. (마지막 에러: ${lastError})`);
}

module.exports = { callGemini, discoverModels };
