/**
 * gemini-helper.js
 * Gemini API 호출 공통 유틸리티
 *
 * [핵심 설계] 모델 자동 탐색 (Dynamic Discovery)
 * — 스크립트 시작 시 Gemini models.list API를 호출하여
 *   현재 실제로 사용 가능한 최신 Stable 모델을 계열별로 자동 선택합니다.
 * — 모델이 업그레이드되어도 코드·환경변수 수정 없이 자동 반영됩니다.
 * — 존재하지 않는 모델명으로 404 에러가 발생하는 문제를 근본적으로 해결합니다.
 */

'use strict';

const { sleep } = require('./pipeline-utils.js');
const { calculateModelCapacity } = require('../src/lib/prompt-rules.js');

// ── 모델 계열 정의 ────────────────────────────────────────────────────────────
// 각 계열에 해당하는 이름 패턴을 우선순위 순서로 정의합니다.
// 새로운 Gemini 4.x, 5.x 등이 출시되어도 패턴으로 자동 인식합니다.
const MODEL_TIERS = [
  {
    tier: 'pro',
    // "flash"나 "lite"가 포함되지 않는 gemini 모델 = Pro 계열
    match: name => /gemini/i.test(name) && /pro/i.test(name) && !/lite/i.test(name),
    maxTokensFallback: 32768,
  },
  {
    tier: 'flash',
    // "flash"는 있으나 "lite"는 없는 모델 = Flash 계열
    match: name => /gemini/i.test(name) && /flash/i.test(name) && !/lite/i.test(name),
    maxTokensFallback: 32768,
  },
  {
    tier: 'lite',
    // "flash"와 "lite" 모두 포함 = Flash-Lite 계열
    match: name => /gemini/i.test(name) && /flash/i.test(name) && /lite/i.test(name),
    maxTokensFallback: 16384,
  },
];

// ── 재시도 설정 ───────────────────────────────────────────────────────────────
const RETRY_CONFIG = {
  maxRetries: 2,
  retryOn: [429, 500, 503, 529],
};

// ── 버전 파싱: 모델명에서 숫자 버전 추출 (정렬용) ─────────────────────────────
// 예) "gemini-2.5-flash" → [2, 5, 0], "gemini-2.0-flash-lite" → [2, 0, 0]
function parseVersion(modelName) {
  const match = modelName.match(/(\d+)\.(\d+)/);
  if (!match) return [0, 0];
  return [parseInt(match[1], 10), parseInt(match[2], 10)];
}

function compareVersionsDesc(a, b) {
  const [aMaj, aMin] = parseVersion(a.name);
  const [bMaj, bMin] = parseVersion(b.name);
  return bMaj !== aMaj ? bMaj - aMaj : bMin - aMin;
}

// ── Stable 모델 필터 ──────────────────────────────────────────────────────────
// preview, exp(erimental), latest 접미사가 없는 모델 = Stable GA 채널
function isStable(modelName) {
  return !/preview|exp(erimental)?|latest/i.test(modelName);
}

// ── [핵심] 사용 가능한 최신 모델 자동 탐색 ────────────────────────────────────
let _discoveredModels = null; // 프로세스 내 1회만 탐색 (메모이제이션)

async function discoverModels() {
  if (_discoveredModels) return _discoveredModels;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.length < 10) {
    throw new Error('GEMINI_API_KEY가 등록되지 않았거나 유효하지 않습니다.');
  }

  console.log('  [모델 탐색] Gemini API에서 최신 사용 가능 모델을 자동 탐색 중...');

  let allModels = [];
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?pageSize=100&key=${apiKey}`,
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (!res.ok) throw new Error(`models.list HTTP ${res.status}`);
    const data = await res.json();
    allModels = (data.models ?? [])
      // generateContent를 지원하는 모델만 필터
      .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      // 모델 ID만 추출 ("models/gemini-2.5-pro" → "gemini-2.5-pro")
      .map(m => ({ name: m.name.replace('models/', ''), maxTokens: m.outputTokenLimit ?? null }));
  } catch (err) {
    console.warn(`  [경고] 모델 탐색 실패 (${err.message}). 내장 기본값으로 폴백합니다.`);
    // 탐색 실패 시 안전한 하드코딩 기본값으로 폴백
    _discoveredModels = [
      { name: 'gemini-2.5-pro',       maxTokens: 32768 },
      { name: 'gemini-2.5-flash',     maxTokens: 32768 },
      { name: 'gemini-2.0-flash-lite', maxTokens: 16384 },
    ];
    return _discoveredModels;
  }

  // 계열별로 최신 Stable 모델 1개씩 선택
  const selected = [];
  for (const { tier, match, maxTokensFallback } of MODEL_TIERS) {
    const candidates = allModels
      .filter(m => match(m.name) && isStable(m.name))
      .sort(compareVersionsDesc);

    if (candidates.length > 0) {
      const best = candidates[0];
      selected.push({
        name: best.name,
        maxTokens: best.maxTokens ?? maxTokensFallback,
        tier,
      });
      console.log(`  [탐색 완료] ${tier.padEnd(5)} → ${best.name} (maxTokens: ${best.maxTokens ?? maxTokensFallback})`);
    } else {
      console.warn(`  [경고] '${tier}' 계열 Stable 모델을 찾지 못했습니다. 해당 계열을 건너뜁니다.`);
    }
  }

  if (selected.length === 0) {
    throw new Error('사용 가능한 Gemini Stable 모델을 하나도 찾지 못했습니다.');
  }

  _discoveredModels = selected;
  return _discoveredModels;
}

// ── Gemini API 호출 (모델 자동 탐색 + 지능형 폴백) ───────────────────────────
/**
 * @param {string} prompt - 보낼 프롬프트
 * @param {object|null} schema - JSON 출력용 스키마 (null이면 텍스트 반환)
 * @returns {Promise<string|object>} 응답 텍스트 또는 파싱된 JSON
 */
async function callGemini(prompt, schema = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.length < 10) {
    throw new Error('GEMINI_API_KEY가 등록되지 않았거나 유효하지 않습니다.');
  }

  const models = await discoverModels();

  const baseConfig = { temperature: schema ? 0.2 : 0.75 };
  if (schema) {
    baseConfig.responseMimeType = 'application/json';
    baseConfig.responseSchema   = schema;
  }

  modelLoop: for (const { name: model, maxTokens } of models) {
    const generationConfig = {
      ...baseConfig,
      maxOutputTokens: schema ? Math.min(4096, maxTokens) : maxTokens,
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const capacityText   = calculateModelCapacity(maxTokens);
    const finalizedPrompt = prompt.replace(/\{\{TARGET_MODEL_CAPACITY\}\}/g, capacityText);

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 90000);
      let res;

      try {
        console.log(`  [API] ${model} 호출 중... (시도: ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}, maxTokens: ${generationConfig.maxOutputTokens})`);
        res = await fetch(url, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ contents: [{ parts: [{ text: finalizedPrompt }] }], generationConfig }),
          signal:  controller.signal,
        });
      } catch (networkErr) {
        console.error(`  [실패] ${model} 네트워크 오류: ${networkErr.message.slice(0, 60)}.`);
        if (attempt < RETRY_CONFIG.maxRetries) { await sleep(5000); continue; }
        continue modelLoop;
      } finally {
        clearTimeout(timeoutId);
      }

      // ── 에러 처리 ───────────────────────────────────────────────────────────
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');

        // 할당량 초과 → 즉각 다음 모델로
        if (res.status === 429 && errorText.toLowerCase().includes('quota')) {
          console.error(`  [할당량 초과] ${model} — 즉각 다음 계열로 전환합니다.`);
          continue modelLoop;
        }

        const shouldRetry = RETRY_CONFIG.retryOn.includes(res.status) && attempt < RETRY_CONFIG.maxRetries;
        if (!shouldRetry) {
          console.error(`  [실패] ${model} HTTP ${res.status} — 다음 계열로 전환합니다.`);
          continue modelLoop;
        }

        // Retry-After 헤더 우선, 없으면 지수 백오프
        const retryAfter = res.headers.get('retry-after');
        let delaySec;
        if (retryAfter && !isNaN(parseInt(retryAfter, 10))) {
          delaySec = parseInt(retryAfter, 10);
          console.error(`  [재시도] ${model} — 서버 지시 ${delaySec}초 대기 후 재시도...`);
        } else {
          const base   = res.status >= 500 ? 5 : 10;
          const jitter = Math.floor(Math.random() * 3) + 1;
          delaySec     = base * Math.pow(2, attempt) + jitter;
          const type   = res.status >= 500 ? '서버 과부하' : '트래픽 제한';
          console.error(`  [백오프] ${model} HTTP ${res.status} (${type}) — ${delaySec}초 대기...`);
        }
        await sleep(delaySec * 1000);
        continue;
      }

      // ── 정상 응답 처리 ───────────────────────────────────────────────────────
      let data;
      try {
        data = await res.json();
      } catch {
        console.error(`  [실패] ${model} JSON 파싱 오류.`);
        if (attempt < RETRY_CONFIG.maxRetries) { await sleep(2000); continue; }
        continue modelLoop;
      }

      const candidate    = data?.candidates?.[0];
      const finishReason = candidate?.finishReason ?? 'UNKNOWN';
      const text         = (candidate?.content?.parts ?? []).map(p => p.text ?? '').join('');

      if (!text) {
        console.error(`  [실패] ${model} 빈 응답 (finishReason: ${finishReason}).`);
        if (attempt < RETRY_CONFIG.maxRetries) { await sleep(2000); continue; }
        continue modelLoop;
      }

      if (schema) {
        try {
          return JSON.parse(text.trim());
        } catch {
          console.error(`  [실패] ${model} JSON 스키마 파싱 실패.`);
          if (attempt < RETRY_CONFIG.maxRetries) { await sleep(2000); continue; }
          continue modelLoop;
        }
      }
      return text;
    }
  }

  throw new Error('모든 Gemini 모델이 응답하지 않았습니다. 잠시 후 다시 실행해 주세요.');
}

module.exports = { callGemini, discoverModels };
