// Cloudflare Pages Function: /api/precedent-summarize (Gemini 기반 판례 실시간 요약 엔진)
export async function onRequest(context: any) {
  try {
    const { request, env } = context;
    
    // CORS 사전 탐색(OPTIONS) 요청 처리
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'POST 메서드만 지원합니다.' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
      });
    }

    const geminiKey = env.GEMINI_API_KEY;
    if (!geminiKey) {
      return new Response(JSON.stringify({ error: '서버에 Gemini API 키가 구성되어 있지 않습니다. Cloudflare 설정에서 GEMINI_API_KEY를 추가해 주세요.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
      });
    }

    const body = await request.json();
    const { title, caseNo, judgmentSummary, caseContent } = body;

    if (!caseNo || (!judgmentSummary && !caseContent)) {
      return new Response(JSON.stringify({ error: '필수 판례 정보(사건번호 및 요약/본문)가 부족합니다.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
      });
    }

    // 판례 내용이 너무 길어 토큰 한도를 초과하지 않도록 앞단 4000자만 잘라 씁니다.
    const contentSnippet = caseContent ? caseContent.substring(0, 4000) : '';

    const prompt = `
당신은 대한민국 최고 수준의 전문 손해사정사이자 법률 조력가입니다.
아래 제공되는 대법원 판결문 내용을 바탕으로, 보상/보험금 청구 분쟁을 겪고 있는 일반 소비자(초보자)를 위해 극도로 쉽고 친절한 요약 해설을 작성해 주세요.

[요구사항]
1. 한자어나 어려운 법률용어는 절대 그냥 쓰지 말고, 괄호 설명이나 쉬운 말로 완전히 대체해 주세요. (예: '기왕증' -> '사고 전 기존 질환(기왕증)', '인과관계' -> '사고와 부상 사이의 직접적인 연관성')
2. 반드시 다음 세 가지 섹션을 구체적으로 나누어 작성하세요:
   - ## 📝 사건의 핵심 (3줄 요약)
     - 이 사건이 어떤 사고로 시작되어 법원까지 오게 되었는지 사실 관계를 초보자 눈높이로 딱 3줄로 요약해 주세요.
   - ## ⚖️ 판결 결과 (누가 왜 이겼나요?)
     - 법원은 최종적으로 누구의 손을 들어주었으며, 그렇게 판단한 가장 결정적인 법리적 이유를 쉬운 비유 등을 곁들여 설명해 주세요.
   - ## 💡 실무적 보상 활용 팁 (내 분쟁에 적용하는 법)
     - 이 판례를 바탕으로, 비슷한 상황(기왕증 삭감, 보험금 지급 거절 등)에 처한 피해자가 보험회사나 공제조합을 상대로 정당한 권리를 지키기 위해 어떻게 행동해야 하는지 실질적이고 구체적인 조언 가이드를 적어주세요.
3. 마크다운 형식으로 작성하고, 기계적인 말투(~에 대해 알아보았습니다, ~하시기 바랍니다 등)는 배제하고 전문적이면서도 따뜻한 전문가 집단의 대화 톤을 끝까지 유지하세요.

[판례 정보]
- 사건명: ${title || '정보 없음'}
- 사건번호: ${caseNo}
- 판결요지: ${judgmentSummary || '본문 참조'}
- 판례내용 요약: ${contentSnippet || '요약 참조'}
`;

    // Gemini API 호출
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
    
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3 } // 요약의 일관성과 정확도를 위해 온도를 낮춤
      })
    });

    if (!geminiRes.ok) {
      const errorData = await geminiRes.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Gemini API 호출 에러 (HTTP ${geminiRes.status})`);
    }

    const data = await geminiRes.json() as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '요약문을 생성하지 못했습니다.';

    return new Response(JSON.stringify({ summary: text }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
