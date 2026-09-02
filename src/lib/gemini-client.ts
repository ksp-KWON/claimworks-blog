/**
 * gemini-client.ts
 * 브라우저 및 Cloudflare Pages Function 환경용 Gemini API 클라이언트
 *
 * [핵심 설계] 3단계 무중단 릴레이 & 최신 Google AI Studio 공식 Alias 완벽 지원
 * — models.list API를 통해 사용 가능한 최신 모델들을 실시간 자동 탐색 (Dynamic Discovery)
 * — Flash-Lite(기획/키워드 추출) + Flash(심층 본문 집필) 2단계 최적 분업
 * — 429(할당량) / 404(구버전 중단) 발생 시 0.1초 만에 차순위 모델로 무중단 릴레이
 */

// ── 모델 계열 패턴 정의 (순수 텍스트 모델만 정밀 필터링) ──────────────
const isPureTextModel = (name: string) => !/image|tts|audio|customtools|robotics|embedding/i.test(name);

const MODEL_TIERS = [
  {
    tier: 'flash' as const,
    // "flash"가 있고 "lite"가 없는 모델 = 풀사이즈 Flash 계열
    match: (name: string) => /gemini/i.test(name) && /flash/i.test(name) && !/lite/i.test(name) && isPureTextModel(name),
    maxTokensFallback: 65536,
  },
  {
    tier: 'lite' as const,
    // "flash"와 "lite"가 모두 포함된 모델 = Flash-Lite 계열
    match: (name: string) => /gemini/i.test(name) && /flash/i.test(name) && /lite/i.test(name) && isPureTextModel(name),
    maxTokensFallback: 32768,
  },
  {
    tier: 'pro' as const,
    // "pro" 계열 (비상 대타)
    match: (name: string) => /gemini/i.test(name) && /pro/i.test(name) && !/lite/i.test(name) && isPureTextModel(name),
    maxTokensFallback: 65536,
  },
];

// 버전 파싱 (내림차순 정렬용) — "gemini-3.7-flash" → [3, 7]
function parseVersion(name: string): [number, number] {
  if (/latest/i.test(name)) return [999, 999]; // latest alias는 최우선(1순위)
  const m = name.match(/(\d+)\.(\d+)/);
  return m ? [parseInt(m[1], 10), parseInt(m[2], 10)] : [0, 0];
}

function compareDesc(a: { name: string }, b: { name: string }) {
  const [aMaj, aMin] = parseVersion(a.name);
  const [bMaj, bMin] = parseVersion(b.name);
  return bMaj !== aMaj ? bMaj - aMaj : bMin - aMin;
}

// ── 내장 기본값 폴백 (탐색 실패 시 안전망) ───────────────────────────
const FALLBACK_MODELS = [
  { name: 'gemini-2.5-flash',      maxTokens: 65536, tier: 'flash' as const },
  { name: 'gemini-2.0-flash',      maxTokens: 65536, tier: 'flash' as const },
  { name: 'gemini-1.5-flash',      maxTokens: 65536, tier: 'flash' as const },
  { name: 'gemini-2.5-flash-lite', maxTokens: 32768, tier: 'lite' as const },
  { name: 'gemini-2.0-flash-lite', maxTokens: 32768, tier: 'lite' as const },
  { name: 'gemini-1.5-flash-lite', maxTokens: 32768, tier: 'lite' as const },
  { name: 'gemini-2.5-pro',        maxTokens: 65536, tier: 'pro' as const },
];

let _cachedModels: typeof FALLBACK_MODELS | null = null;

export async function discoverGeminiModels(apiKey: string): Promise<typeof FALLBACK_MODELS> {
  if (_cachedModels && _cachedModels.length > 0) return _cachedModels;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?pageSize=100&key=${apiKey}`
    );
    if (!res.ok) throw new Error(`models.list HTTP ${res.status}`);
    const data = await res.json();

    const allModels: { name: string; maxTokens: number | null }[] = (data.models ?? [])
      .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: any) => ({
        name: m.name.replace('models/', ''),
        maxTokens: m.outputTokenLimit ?? null,
      }));

    const resultModels: typeof FALLBACK_MODELS = [];

    // 각 계열(tier)별로 정렬하여 모든 유효한 후보를 큐에 보존
    for (const { tier, match, maxTokensFallback } of MODEL_TIERS) {
      const candidates = allModels
        .filter(m => match(m.name) && !/experimental/i.test(m.name))
        .sort(compareDesc);

      for (const cand of candidates) {
        resultModels.push({
          name: cand.name,
          maxTokens: cand.maxTokens ?? maxTokensFallback,
          tier,
        });
      }
    }

    if (resultModels.length > 0) {
      _cachedModels = resultModels;
      return resultModels;
    }
  } catch (err: any) {
    console.warn('[gemini-client] 모델 탐색 실패, 내장 기본 릴레이 사용:', err.message);
  }

  _cachedModels = FALLBACK_MODELS;
  return FALLBACK_MODELS;
}

// ── 재시도 설정 ───────────────────────────────────────────────────────
const RETRY_ON = [500, 503, 529];
const MAX_RETRIES = 1;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export interface GeminiCallOptions {
  maxOutputTokens?: number;
  temperature?: number;
  schema?: any;                         // JSON 구조화 출력 스키마
  tierLimit?: ('pro'|'flash'|'lite')[]; // 선호 계열 지정 (예: ['lite', 'flash'])
}

export async function callGeminiClient(
  apiKey: string,
  prompt: string,
  options: GeminiCallOptions = {}
): Promise<string> {
  if (!apiKey || apiKey.length < 10) throw new Error('Gemini API 키가 없습니다.');

  const allDiscovered = await discoverGeminiModels(apiKey);
  
  // 요청된 tierLimit에 따라 우선순위 모델 리스트 구성 (우선 선호 계열 ➔ 기타 계열 순)
  let prioritizedModels = allDiscovered;
  if (options.tierLimit && options.tierLimit.length > 0) {
    const preferred = allDiscovered.filter(m => options.tierLimit!.includes(m.tier));
    const backup = allDiscovered.filter(m => !options.tierLimit!.includes(m.tier));
    prioritizedModels = [...preferred, ...backup];
  }

  const baseConfig: Record<string, any> = {
    temperature: options.temperature ?? (options.schema ? 0.2 : 0.75),
  };
  if (options.schema) {
    baseConfig.responseMimeType = 'application/json';
    baseConfig.responseSchema   = options.schema;
  }

  let lastErrorMessage = '';

  for (const { name: model, maxTokens } of prioritizedModels) {
    const generationConfig = {
      ...baseConfig,
      maxOutputTokens: options.maxOutputTokens ?? (options.schema ? Math.min(4096, maxTokens) : maxTokens),
    };

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
          }
        );

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errText = errData.error?.message || (await res.text().catch(() => ''));
          lastErrorMessage = `[${model}] ${res.status}: ${errText}`;

          // 429(할당량) 또는 404(모델 중단) → 지체 없이 다음 차선책 모델로 즉시 바통 터치
          if (res.status === 429 || res.status === 404) {
            break;
          }

          // 일시적 서버 장애(500, 503) 시 1회 재시도
          if (RETRY_ON.includes(res.status) && attempt < MAX_RETRIES) {
            await sleep(1500);
            continue;
          }
          break; // 다음 모델로
        }

        const data = await res.json();
        if (data.error) throw new Error(data.error.message);

        const candidate = data.candidates?.[0];
        const finishReason = candidate?.finishReason;

        // Google 공식 표준: 정상 완료('STOP')가 아니면(예: 'MAX_TOKENS', 'SAFETY') 미완결로 판정하고 릴레이 전환
        if (finishReason && finishReason !== 'STOP') {
          lastErrorMessage = `[${model}] 생성 미완결 (finishReason: ${finishReason})`;
          if (attempt < MAX_RETRIES) { await sleep(1500); continue; }
          break; // 다음 모델로 바통 터치
        }

        const text = (candidate?.content?.parts ?? [])
          .map((p: any) => p.text ?? '')
          .join('');

        if (!text) {
          if (attempt < MAX_RETRIES) { await sleep(1500); continue; }
          break;
        }

        if (options.schema) {
          try { 
            return JSON.parse(text.trim()); 
          } catch {
            if (attempt < MAX_RETRIES) { await sleep(1500); continue; }
            break;
          }
        }
        return text;

      } catch (err: any) {
        lastErrorMessage = `[${model}] ${err.message}`;
        if (attempt < MAX_RETRIES) { await sleep(1500); continue; }
        break; // 다음 모델로 바통 터치
      }
    }
  }

  throw new Error(`모든 Gemini 모델 통신에 실패했습니다. (마지막 에러: ${lastErrorMessage})`);
}
