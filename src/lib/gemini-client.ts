/**
 * gemini-client.ts
 * 브라우저 및 Cloudflare Pages Function 환경용 Gemini API 클라이언트
 *
 * [핵심 설계] 모델 자동 탐색 (Dynamic Discovery) — scripts/gemini-helper.js 와 동일 전략
 * — models.list API를 호출하여 실제로 사용 가능한 최신 Stable 모델을 계열별로 자동 선택
 * — 새 Gemini 버전 출시 시 코드 변경 없이 자동 반영
 * — 탐색 실패 시 내장 기본값 폴백
 */

// ── 모델 계열 패턴 정의 (Node.js gemini-helper.js 와 동일한 로직) ─────────────
const MODEL_TIERS = [
  {
    tier: 'pro' as const,
    match: (name: string) => /gemini/i.test(name) && /pro/i.test(name) && !/lite/i.test(name),
    maxTokensFallback: 32768,
  },
  {
    tier: 'flash' as const,
    match: (name: string) => /gemini/i.test(name) && /flash/i.test(name) && !/lite/i.test(name),
    maxTokensFallback: 32768,
  },
  {
    tier: 'lite' as const,
    match: (name: string) => /gemini/i.test(name) && /flash/i.test(name) && /lite/i.test(name),
    maxTokensFallback: 16384,
  },
];

// Stable 채널 필터: preview / exp(erimental) / latest 접미사 없는 것
function isStable(name: string): boolean {
  return !/preview|experimental|latest/i.test(name);
}

// 버전 비교 (내림차순) — "gemini-2.5-pro" → [2, 5]
function parseVersion(name: string): [number, number] {
  const m = name.match(/(\d+)\.(\d+)/);
  return m ? [parseInt(m[1], 10), parseInt(m[2], 10)] : [0, 0];
}

function compareDesc(a: { name: string }, b: { name: string }) {
  const [aMaj, aMin] = parseVersion(a.name);
  const [bMaj, bMin] = parseVersion(b.name);
  return bMaj !== aMaj ? bMaj - aMaj : bMin - aMin;
}

// ── 내장 기본값 (탐색 실패 시 폴백) ─────────────────────────────────────────
const FALLBACK_MODELS = [
  { name: 'gemini-2.5-pro',        maxTokens: 32768, tier: 'pro'   as const },
  { name: 'gemini-2.5-flash',      maxTokens: 32768, tier: 'flash' as const },
  { name: 'gemini-2.0-flash-lite', maxTokens: 16384, tier: 'lite'  as const },
];

// ── 세션 내 캐시 (동일 세션에서는 탐색 1회만) ────────────────────────────────
let _cachedModels: typeof FALLBACK_MODELS | null = null;

export async function discoverGeminiModels(apiKey: string): Promise<typeof FALLBACK_MODELS> {
  if (_cachedModels) return _cachedModels;

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

    const selected: typeof FALLBACK_MODELS = [];
    for (const { tier, match, maxTokensFallback } of MODEL_TIERS) {
      const candidates = allModels
        .filter(m => match(m.name) && isStable(m.name))
        .sort(compareDesc);
      if (candidates.length > 0) {
        const best = candidates[0];
        selected.push({ name: best.name, maxTokens: best.maxTokens ?? maxTokensFallback, tier });
      }
    }

    if (selected.length > 0) {
      _cachedModels = selected;
      return selected;
    }
  } catch (err) {
    console.warn('[gemini-client] 모델 탐색 실패, 기본값 사용:', err);
  }

  _cachedModels = FALLBACK_MODELS;
  return FALLBACK_MODELS;
}

// ── 재시도 설정 ───────────────────────────────────────────────────────────────
const RETRY_ON = [429, 500, 503, 529];
const MAX_RETRIES = 2;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── 범용 Gemini 호출 함수 (자동 탐색 + 지능형 폴백) ─────────────────────────
export interface GeminiCallOptions {
  maxOutputTokens?: number;
  temperature?: number;
  schema?: any;                    // JSON 구조화 출력 스키마
  tierLimit?: ('pro'|'flash'|'lite')[];  // 특정 계열만 사용 (기본: 전체)
}

export async function callGeminiClient(
  apiKey: string,
  prompt: string,
  options: GeminiCallOptions = {}
): Promise<string> {
  if (!apiKey || apiKey.length < 10) throw new Error('Gemini API 키가 없습니다.');

  const models = await discoverGeminiModels(apiKey);
  const tierFilter = options.tierLimit;
  const activeModels = tierFilter ? models.filter(m => tierFilter.includes(m.tier)) : models;

  const baseConfig: Record<string, any> = {
    temperature: options.temperature ?? (options.schema ? 0.2 : 0.75),
  };
  if (options.schema) {
    baseConfig.responseMimeType = 'application/json';
    baseConfig.responseSchema   = options.schema;
  }

  for (const { name: model, maxTokens } of activeModels) {
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
          const errText = await res.text().catch(() => '');
          // 할당량 초과 → 즉각 다음 계열
          if (res.status === 429 && errText.toLowerCase().includes('quota')) break;
          // 재시도 가능한 에러
          if (RETRY_ON.includes(res.status) && attempt < MAX_RETRIES) {
            const retryAfter = res.headers?.get?.('retry-after');
            const delaySec   = retryAfter && !isNaN(+retryAfter) ? +retryAfter
                             : (res.status >= 500 ? 5 : 10) * Math.pow(2, attempt) + Math.random() * 3;
            await sleep(delaySec * 1000);
            continue;
          }
          break; // 복구 불가 에러 → 다음 모델
        }

        const data = await res.json();
        if (data.error) throw new Error(data.error.message);

        const text = (data.candidates?.[0]?.content?.parts ?? [])
          .map((p: any) => p.text ?? '')
          .join('');

        if (!text) {
          if (attempt < MAX_RETRIES) { await sleep(2000); continue; }
          break;
        }

        if (options.schema) {
          try { return JSON.parse(text.trim()); }
          catch {
            if (attempt < MAX_RETRIES) { await sleep(2000); continue; }
            break;
          }
        }
        return text;

      } catch (err: any) {
        if (attempt < MAX_RETRIES) { await sleep(3000); continue; }
        break; // 다음 모델로
      }
    }
  }

  throw new Error('모든 Gemini 모델이 응답하지 않았습니다. 잠시 후 다시 시도해 주세요.');
}
