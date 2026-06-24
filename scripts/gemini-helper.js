/**
 * gemini-helper.js
 * 제미나이 API 호출 공통 유틸리티 (429/500 에러 백오프 재시도 및 모델 폴백 지원)
 */

'use strict';

const sleep = ms => new Promise(r => setTimeout(r, ms));

// gemini-pro-latest -> gemini-3.1-pro-preview
// gemini-flash-latest -> gemini-3.5-flash
// gemini-flash-lite-latest -> gemini-3.1-flash-lite
const GEMINI_MODELS = [
  'gemini-pro-latest',
  'gemini-flash-latest',
  'gemini-flash-lite-latest'
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

  const generationConfig = {
    temperature: schema ? 0.2 : 0.75, // 기획/주제 추출 등 스키마가 있으면 정확도 위주, 본문은 창의성 위주
    maxOutputTokens: schema ? 4096 : 65536,
  };
  if (schema) {
    generationConfig.responseMimeType = 'application/json';
    generationConfig.responseSchema = schema;
  }

  modelLoop: for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    let res;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90초 타임아웃

    try {
      console.log(`  [API] 모델 '${model}' 호출 중...`);
      res = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
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

    const text = (data?.candidates?.[0]?.content?.parts ?? []).map(p => p.text ?? '').join('');
    
    if (!text) {
      console.error(`  [실패] '${model}' 빈 응답 수신. 다음 모델로 전환.`);
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
