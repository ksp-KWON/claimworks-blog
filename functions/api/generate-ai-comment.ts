// Cloudflare Pages Function: /api/generate-ai-comment
// 통합 AI 코멘트 모듈 백엔드 (법률센터, 금감원센터, 안심케어, 교통사고지점 공용)
//
// [핵심 설계] 모델 자동 탐색 (Dynamic Discovery)
// — @google/generative-ai SDK 제거 (Cloudflare 환경 호환성 확보)
// — models.list API로 최신 Stable 모델을 계열별 자동 선택
// — 탐색 실패 시 안전한 기본값으로 폴백

// ── 모델 계열 패턴 (gemini-client.ts 와 동일 로직) ────────────────────────
const MODEL_TIERS = [
  { tier: 'lite',  match: (n: string) => /gemini/i.test(n) && /flash/i.test(n) && /lite/i.test(n),  fallbackMax: 16384 },
  { tier: 'flash', match: (n: string) => /gemini/i.test(n) && /flash/i.test(n) && !/lite/i.test(n), fallbackMax: 32768 },
  { tier: 'pro',   match: (n: string) => /gemini/i.test(n) && /pro/i.test(n)   && !/lite/i.test(n), fallbackMax: 32768 },
];

const FALLBACK_MODELS = [
  { name: 'gemini-2.0-flash-lite', maxTokens: 16384 },
  { name: 'gemini-2.5-flash',      maxTokens: 32768 },
  { name: 'gemini-2.5-pro',        maxTokens: 32768 },
];

function isStable(name: string) {
  return !/preview|experimental|latest/i.test(name);
}

function parseVersion(name: string): [number, number] {
  const m = name.match(/(\d+)\.(\d+)/);
  return m ? [+m[1], +m[2]] : [0, 0];
}

// AI 코멘트 전용 탐색: Lite → Flash → Pro 순서 (비용 효율 우선)
async function discoverModels(apiKey: string) {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=100&key=${apiKey}`);
    if (!res.ok) throw new Error('list failed');
    const data: any = await res.json();
    const all = (data.models ?? [])
      .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: any) => ({ name: m.name.replace('models/', ''), maxTokens: m.outputTokenLimit ?? null }));

    const selected = [];
    for (const { tier, match, fallbackMax } of MODEL_TIERS) {
      const candidates = all.filter((m: any) => match(m.name) && isStable(m.name))
        .sort((a: any, b: any) => {
          const [aMaj, aMin] = parseVersion(a.name), [bMaj, bMin] = parseVersion(b.name);
          return bMaj !== aMaj ? bMaj - aMaj : bMin - aMin;
        });
      if (candidates.length > 0) {
        selected.push({ name: candidates[0].name, maxTokens: candidates[0].maxTokens ?? fallbackMax });
      }
    }
    return selected.length > 0 ? selected : FALLBACK_MODELS;
  } catch {
    return FALLBACK_MODELS;
  }
}

export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { sourceText, type } = body;

    if (!sourceText) {
      return new Response(JSON.stringify({ error: 'sourceText is required' }), { status: 400 });
    }

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured on the server.' }), { status: 500 });
    }

    // 타입에 따른 맞춤형 페르소나 미세조정
    let contextPrompt = '';
    switch (type) {
      case 'precedent':
        contextPrompt = '이 데이터는 법원 판례입니다. 소비자가 이 판례를 활용해 보험금 청구 시 유리한 방어 논리로 쓸 수 있는 팁이나 주의점을 짚어주세요.';
        break;
      case 'fss':
        contextPrompt = '이 데이터는 금융감독원 보도자료/소비자경보입니다. 소비자가 금융 분쟁이나 민원 제기 시 조심해야 할 점과 대처 요령을 짚어주세요.';
        break;
      case 'traffic':
        contextPrompt = '이 데이터는 교통사고 위험 지역 및 병원 데이터입니다. 해당 지역에서 교통사고 발생 시 합의나 치료 과정에서 손해를 보지 않는 실무 팁을 짚어주세요.';
        break;
      default:
        contextPrompt = '이 데이터를 바탕으로 보험 소비자에게 유용한 보상 실무 팁을 짚어주세요.';
    }

    const prompt = `너는 보상스쿨의 전문 손해사정사야. 인사말(안녕하세요 등)은 절대 생략하고 곧바로 본론부터 말해.
${contextPrompt}
반드시 존댓말로 작성하고, 전문 용어를 쉽게 풀어서 콤팩트하게 요약해.
절대 없는 법령이나 사실을 지어내지 마(Hallucination 금지).

[출력 규칙 (생각의 사슬 헌법)]
반드시 아래 JSON 스키마를 엄격히 준수하여 응답하십시오. 일반 텍스트나 마크다운 블록(\`\`\`json)으로 감싸지 말고 오직 순수 JSON 객체만 출력하십시오.
{
  "thoughtProcess": "응답을 작성하기 전, 주어진 데이터에 대한 법리적/의학적 쟁점 분석, 기획, 그리고 손해사정 전략 등 논리적인 사고 과정을 먼저 서술하십시오. (일시적인 땜방이 아닌 근본 원인 파악 필수)",
  "comment": "사용자에게 보여질 최종 코멘트 본문. 아래 세부 규칙을 엄수할 것:\\n1. 마크다운 볼드체(**)나 특수기호 절대 금지, 순수 텍스트 위주로 작성.\\n2. 번호(1., 2.) 나열 시 끝날 때마다 반드시 줄바꿈(\\n) 포함.\\n3. 첫 문장 고정 형식 -> 판례: '문의하신 판례는 [핵심 인사이트 요약]이라는 중요한 기준을 제시하고 있습니다.' / 기타: '문의하신 데이터는 [핵심 요약]이라는 중요한 기준을 제시하고 있습니다.'"
}

분석할 데이터:
${sourceText}`;

    // ── [핵심] 자동 탐색으로 최신 Stable 모델 사용 (Lite→Flash→Pro 순서) ──
    const models = await discoverModels(apiKey);
    let comment = '';
    let lastError: any = null;

    for (const { name: modelName, maxTokens } of models) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature:      0.3,
                maxOutputTokens:  Math.min(1024, maxTokens),
                responseMimeType: "application/json"
              },
            }),
          }
        );

        if (!res.ok) {
          const errBody: any = await res.json().catch(() => ({}));
          // 할당량 초과는 즉각 다음 계열로
          if (res.status === 429) { lastError = new Error('quota'); continue; }
          // 503/500 은 skip
          if (res.status >= 500) { lastError = new Error(`HTTP ${res.status}`); continue; }
          throw new Error(errBody?.error?.message || `HTTP ${res.status}`);
        }

        const data: any = await res.json();
        const text = (data.candidates?.[0]?.content?.parts ?? []).map((p: any) => p.text ?? '').join('');
        
        if (text) {
          try {
            // 마크다운 잔재(```json 등) 제거
            const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanText);
            
            console.log(`[AI 사고 과정 (thoughtProcess)]:\n${parsed.thoughtProcess}`);
            
            if (parsed.comment) {
              comment = parsed.comment;
              break;
            }
          } catch (parseErr) {
            console.warn('[JSON 파싱 실패, Fallback 평문 처리]', parseErr);
            comment = text;
            break;
          }
        }

      } catch (err: any) {
        console.error(`[Failover] ${modelName} 실패:`, err.message);
        lastError = err;
      }
    }

    if (!comment) {
      throw lastError || new Error('All fallback models failed.');
    }

    return new Response(JSON.stringify({ comment }), {
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error: any) {
    console.error('AI Comment Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
