/**
 * gemini-helper.js
 * 제미나이 API 호출 공통 유틸리티 (429/500 에러 백오프 재시도 및 모델 폴백 지원)
 */

'use strict';

const sleep = ms => new Promise(r => setTimeout(r, ms));

// 모델별 실제 허용 최대 출력 토큰 (보수적 설정 — 공식 API 한도보다 약간 낮게 잡아 안전 마진 확보)
const GEMINI_MODELS = [
  { name: 'gemini-pro-latest',       maxTokens: 32768 },
  { name: 'gemini-flash-latest',     maxTokens: 32768 },
  { name: 'gemini-flash-lite-latest',maxTokens: 16384 },
];



/**
 * Gemini API를 호출합니다.
 * @param {string} prompt - 보낼 프롬프트
 * @param {object|null} schema - JSON 출력용 스키마
 * @returns {Promise<any>} 응답 텍스트 또는 파싱된 JSON
 */
async function callGemini(prompt, schema = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.length < 10) {
    throw new Error('GEMINI_API_KEY가 등록되지 않았거나 유효하지 않습니다. GitHub Secrets 또는 .env.local 설정을 확인해 주세요.');
  }

  // 기본 generationConfig — maxOutputTokens는 모델별로 루프 안에서 설정
  const baseGenerationConfig = {
    temperature: schema ? 0.2 : 0.75, // 기획/주제 추출: 정확도 위주 | 본문 생성: 창의성 위주
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
    
    let res;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90초 타임아웃

    // 모델 사양별 지능형 분량 권장사항 텍스트 동적 계산 (Self-Adaptive Token-Aware)
    const safetyLimitChar = Math.floor(maxTokens / 3.0); // 한글 1글자당 3토큰 안전 마진 기준
    const minRecommended = Math.floor(safetyLimitChar * 0.45);
    const maxRecommended = Math.floor(safetyLimitChar * 0.85);
    const minNoSpace = Math.floor(minRecommended * 0.7);
    const maxNoSpace = Math.floor(maxRecommended * 0.7);

    const modelCapacityText = `할당된 인공지능 모델 용량 스펙 (최대 출력 ${maxTokens.toLocaleString()} 토큰) | 권장량: 현재 할당된 인공지능의 하드웨어적 출력 허용량을 고려하여, 1회 생성 한계치인 한글 약 ${safetyLimitChar.toLocaleString()}자 내에서 끊김 및 품질 저하를 방지하기 위한 최적 작성 분량은 **공백 포함 약 ${minRecommended.toLocaleString()}자 ~ ${maxRecommended.toLocaleString()}자 (공백 제외 약 ${minNoSpace.toLocaleString()}자 ~ ${maxNoSpace.toLocaleString()}자)** 입니다. 무작정 분량을 늘리는 사족 반복을 지양하고, 이 동적 용량 설계 기준 안에서 핵심 전문성(의학/법률 디테일 및 판례 법리)을 최대한 깊이 있고 짜임새 있게 전개하십시오.`;

    const finalizedPrompt = prompt.replace(/\{\{TARGET_MODEL_CAPACITY\}\}/g, modelCapacityText);

    try {
      console.log(`  [API] 모델 '${model}' 호출 중... (maxOutputTokens: ${generationConfig.maxOutputTokens})`);
      res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ contents: [{ parts: [{ text: finalizedPrompt }] }], generationConfig }),
        signal:  controller.signal
      });
    } catch (networkErr) {
      console.error(`  [실패] '${model}' 네트워크 오류: ${networkErr.message.slice(0, 60)}. 다음 모델로 전환.`);
      continue modelLoop;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      // 응답 스트림 소모하여 리소스 해제
      await res.text().catch(() => '');
      console.error(`  [실패] '${model}' HTTP 오류 ${res.status}. 다음 모델로 전환.`);
      continue modelLoop;
    }

    let data;
    try {
      data = await res.json();
    } catch (jsonErr) {
      console.error(`  [실패] '${model}' 응답 JSON 파싱 오류. 다음 모델로 전환.`);
      continue modelLoop;
    }

    const candidate = data?.candidates?.[0];
    const finishReason = candidate?.finishReason ?? 'UNKNOWN';
    const text = (candidate?.content?.parts ?? []).map(p => p.text ?? '').join('');
    
    if (!text) {
      // finishReason 을 로그에 포함해 원인 파악 용이하게
      console.error(`  [실패] '${model}' 빈 응답 수신 (finishReason: ${finishReason}). 다음 모델로 전환.`);
      // MAX_TOKENS 인 경우 해당 모델의 한계이므로 계속 시도할 의미 없음 — 다음 모델로
      continue modelLoop;
    }
    
    if (schema) {
      try {
        return JSON.parse(text.trim());
      } catch (e) {
        console.error(`  [실패] '${model}' 스키마 JSON 파싱 최종 실패. 다음 모델로 전환.`);
        continue modelLoop;
      }
    }
    return text;
  }
  throw new Error('모든 제미나이 모델이 응답하지 않았습니다. 잠시 후 다시 실행해 주세요.');
}

module.exports = {
  callGemini,
  GEMINI_MODELS
};
