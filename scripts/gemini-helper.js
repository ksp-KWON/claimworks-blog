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
  'gemini-flash-lite-latest',
  'gemini-2.5-flash',
  'gemini-2.0-flash'
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
    
    // 모델당 최대 3회 시도
    for (let attempt = 1; attempt <= 3; attempt++) {
      let res;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90초 타임아웃

      try {
        console.log(`  [API] 모델 '${model}' 호출 중... (시도 ${attempt}/3)`);
        res = await fetch(url, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
          signal:  controller.signal
        });
      } catch (networkErr) {
        if (attempt < 3) {
          const wait = 3000 * attempt;
          console.warn(`  [네트워크 오류] ${networkErr.message.slice(0, 60)}. ${wait / 1000}초 후 재시도...`);
          await sleep(wait);
          continue;
        }
        console.error(`  [실패] '${model}' 네트워크 오류 3회. 다음 모델로 전환.`);
        continue modelLoop;
      } finally {
        clearTimeout(timeoutId);
      }

      if (!res.ok) {
        // 응답 스트림 소모하여 리소스 해제
        await res.text().catch(() => '');

        if (res.status === 429) {
          if (attempt === 1) {
            // 한도 초기화(1분)를 위해 65초간 대기 후 딱 1회만 더 재시도
            console.warn(`  [429 한도 초과] 분당 요청 한도 도달. 65초 대기 후 재시도합니다...`);
            await sleep(65000);
            continue;
          } else {
            console.error(`  [실패] '${model}' 65초 대기 후에도 429 재발생. 백업 모델로 즉시 전환.`);
            continue modelLoop;
          }
        }
        
        if (res.status >= 500) {
          if (attempt < 3) {
            const wait = 3000 * attempt;
            console.warn(`  [${res.status} 서버 오류] ${wait / 1000}초 후 재시도...`);
            await sleep(wait);
            continue;
          }
          console.error(`  [실패] '${model}' 서버 오류 3회. 다음 모델로 전환.`);
          continue modelLoop;
        }
        
        // 400, 404 등 재시도가 의미 없는 HTTP 에러는 즉시 다음 모델로 전환
        console.error(`  [HTTP ${res.status} 오류] 다음 모델로 즉시 폴백.`);
        continue modelLoop;
      }

      const data = await res.json();
      const text = (data?.candidates?.[0]?.content?.parts ?? []).map(p => p.text ?? '').join('');
      
      if (!text) {
        if (attempt < 3) {
          console.warn(`  [빈 응답] 3초 후 재시도...`);
          await sleep(3000);
          continue;
        }
        continue modelLoop;
      }
      
      if (schema) {
        try {
          return JSON.parse(text.trim());
        } catch (e) {
          if (attempt < 3) {
            console.warn(`  [JSON 파싱 실패] 3초 후 재시도...`);
            await sleep(3000);
            continue;
          }
          console.error(`  [실패] '${model}' JSON 파싱 오류. 다음 모델로 전환.`);
          continue modelLoop;
        }
      }
      return text;
    }
  }
  throw new Error('모든 제미나이 모델이 응답하지 않았습니다. 잠시 후 다시 실행해 주세요.');
}

module.exports = {
  callGemini,
  GEMINI_MODELS
};
