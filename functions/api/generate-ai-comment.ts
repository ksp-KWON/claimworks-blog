// Cloudflare Pages Function: /api/generate-ai-comment
// 통합 AI 코멘트 모듈 백엔드 (법률센터, 금감원센터, 안심케어 공용)

export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { sourceText, type } = body;

    if (!sourceText) {
      return new Response(JSON.stringify({ error: 'sourceText is required' }), { status: 400 });
    }

    // Cloudflare 환경변수에서 구글 API 키 가져오기
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_KEY is not configured on the server.' }), { status: 500 });
    }

    // 타입에 따른 맞춤형 페르소나 미세조정 (가장 콤팩트한 구조)
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

    const systemInstruction = `너는 보상스쿨의 10년 차 베테랑 손해사정사야.
${contextPrompt}
반드시 존댓말로 작성하고, 전문 용어를 쉽게 풀어서 3~4문장 이내로 콤팩트하게 요약해.
절대 없는 법령이나 사실을 지어내지 마(Hallucination 금지).`;

    // 최신 버전에 자동 대응하기 위한 모델명 수정
    const model = 'gemini-1.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: `분석할 데이터:\n${sourceText}` }]
        }
      ],
      generationConfig: {
        temperature: 0.3, // 일관성 있고 안정적인 답변 유도
        maxOutputTokens: 250,
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to fetch from Gemini API');
    }

    const data = await response.json();
    const comment = data.candidates?.[0]?.content?.parts?.[0]?.text || '코멘트 생성에 실패했습니다.';

    return new Response(JSON.stringify({ comment }), {
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}
