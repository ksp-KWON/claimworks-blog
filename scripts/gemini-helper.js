/**
 * gemini-helper.js
 * 제미나이 API 호출 공통 유틸리티 (지능형 429 에러 백오프 및 빠른 우회 지원)
 */

'use strict';

const sleep = ms => new Promise(r => setTimeout(r, ms));
const { calculateModelCapacity } = require('../src/lib/prompt-rules.js');

// 모델별 실제 허용 최대 출력 토큰 (보수적 설정 — 공식 API 한도보다 약간 낮게 잡아 안전 마진 확보)
const GEMINI_MODELS = [
  { name: 'gemini-pro-latest',       maxTokens: 32768 },
  { name: 'gemini-flash-latest',     maxTokens: 32768 },
  { name: 'gemini-flash-lite-latest',maxTokens: 16384 },
];

// 재시도 설정
const RETRY_CONFIG = {
  maxRetries: 2,          // 모델당 최대 재시도 횟수
  retryOn: [429, 500, 503, 529], // 재시도할 HTTP 상태 코드
};

/**
 * Gemini API를 호출합니다.
 * @param {string} prompt - 보낼 프롬프트
 * @param {object|null} schema - JSON 출력용 스키마
 * @returns {Promise<any>} 응답 텍스트 또는 파싱된 JSON
 */
async function callGemini(prompt, schema = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.length < 10) {
    throw new Error('GEMINI_API_KEY가 등록되지 않았거나 유효하지 않습니다.');
  }

  const baseGenerationConfig = {
    temperature: schema ? 0.2 : 0.75,
  };
  if (schema) {
    baseGenerationConfig.responseMimeType = 'application/json';
    baseGenerationConfig.responseSchema = schema;
  }

  modelLoop: for (const { name: model, maxTokens } of GEMINI_MODELS) {
    const generationConfig = {
      ...baseGenerationConfig,
      maxOutputTokens: schema ? Math.min(4096, maxTokens) : maxTokens,
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const modelCapacityText = calculateModelCapacity(maxTokens);
    const finalizedPrompt = prompt.replace(/\{\{TARGET_MODEL_CAPACITY\}\}/g, modelCapacityText);

    // ── 지능형 재시도 루프 ─────────
    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      let res;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90초 타임아웃

      try {
        console.log(`  [API] 모델 '${model}' 호출 중... (시도: ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1}, maxTokens: ${generationConfig.maxOutputTokens})`);
        res = await fetch(url, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ contents: [{ parts: [{ text: finalizedPrompt }] }], generationConfig }),
          signal:  controller.signal
        });
      } catch (networkErr) {
        console.error(`  [실패] '${model}' 네트워크 오류: ${networkErr.message.slice(0, 60)}.`);
        if (attempt < RETRY_CONFIG.maxRetries) {
          await sleep(5000); // 단순 네트워크 오류는 5초 후 재시도
          continue; 
        }
        continue modelLoop;
      } finally {
        clearTimeout(timeoutId);
      }

      // ── 에러 파싱 및 지능형 대응 (Fast Failover & Exponential Backoff) ──
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        
        // 1. Quota Exceeded (할당량 초과) -> 대기 없이 즉각 우회
        if (res.status === 429 && errorText.toLowerCase().includes('quota')) {
          console.error(`  [에러 분석] '${model}' 하루 할당량(Quota) 초과. 대기 없이 즉각 하위 모델로 우회합니다.`);
          continue modelLoop; // 내부 루프 파괴하고 다음 모델로
        }

        const shouldRetry = RETRY_CONFIG.retryOn.includes(res.status) && attempt < RETRY_CONFIG.maxRetries;
        if (!shouldRetry) {
          console.error(`  [실패] '${model}' HTTP 오류 ${res.status}. 다음 모델로 전환합니다.`);
          continue modelLoop;
        }

        // 2. Retry-After 헤더 존중
        const retryAfter = res.headers.get('retry-after');
        let delaySec = 0;
        
        if (retryAfter && !isNaN(parseInt(retryAfter, 10))) {
           delaySec = parseInt(retryAfter, 10);
           console.error(`  [헤더 감지] '${model}' 서버 지시(Retry-After): ${delaySec}초 대기 후 재시도...`);
        } else {
           // 3. 지수 백오프 (Exponential Backoff + Jitter)
           const base = 10;
           const jitter = Math.floor(Math.random() * 3) + 1; // 1~3초 지터
           delaySec = (base * Math.pow(2, attempt)) + jitter; // 0차: 10+a, 1차: 20+a
           console.error(`  [지수 백오프] '${model}' HTTP ${res.status} (Rate Limit). ${delaySec}초 대기 후 재시도...`);
        }
        
        await sleep(delaySec * 1000);
        continue; // 현재 모델 재시도
      }

      // ── 정상 응답 처리 ──
      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        console.error(`  [실패] '${model}' 응답 JSON 파싱 오류.`);
        if (attempt < RETRY_CONFIG.maxRetries) {
          await sleep(2000);
          continue;
        }
        continue modelLoop;
      }

      const candidate = data?.candidates?.[0];
      const finishReason = candidate?.finishReason ?? 'UNKNOWN';
      const text = (candidate?.content?.parts ?? []).map(p => p.text ?? '').join('');

      if (!text) {
        console.error(`  [실패] '${model}' 빈 응답 수신 (finishReason: ${finishReason}).`);
        if (attempt < RETRY_CONFIG.maxRetries) {
          await sleep(2000);
          continue;
        }
        continue modelLoop;
      }

      if (schema) {
        try {
          return JSON.parse(text.trim());
        } catch (e) {
          console.error(`  [실패] '${model}' 스키마 JSON 파싱 최종 실패.`);
          if (attempt < RETRY_CONFIG.maxRetries) {
            await sleep(2000);
            continue;
          }
          continue modelLoop;
        }
      }
      return text;
    }
    // 재시도 루프 끝 — 다음 모델로
  }
  throw new Error('모든 제미나이 모델이 응답하지 않았습니다. 잠시 후 다시 실행해 주세요.');
}

module.exports = {
  callGemini,
  GEMINI_MODELS
};
