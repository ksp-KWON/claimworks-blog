// Cloudflare Pages Function: /api/generate-ai-comment
// 통합 AI 코멘트 모듈 백엔드 (법률센터, 금감원센터, 안심케어 공용)
import { GoogleGenerativeAI } from '@google/generative-ai';

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

    const systemInstruction = `너는 보상스쿨의 10년 차 베테랑 손해사정사야.
${contextPrompt}
반드시 존댓말로 작성하고, 전문 용어를 쉽게 풀어서 콤팩트하게 요약해.
절대 없는 법령이나 사실을 지어내지 마(Hallucination 금지).
[출력 규칙]
1. 마크다운 볼드체(**)나 특수기호는 절대 쓰지 말고 순수 텍스트로만 작성해.
2. 번호(1., 2.)를 매겨서 설명할 경우, 각 번호가 끝날 때마다 반드시 줄바꿈(\\n)을 넣어줘.`;

    // 최신 기술 스택: 구글 공식 SDK 적용 및 지능형 모델 우회(Failover) 시스템 도입
    // 단일 모델(Flash)이 구글 서버 과부하(503)나 할당량 초과(429)로 뻗었을 때를 대비한 가장 스테이블한 근본 해결책
    const genAI = new GoogleGenerativeAI(apiKey);
    const fallbackModels = ['gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-pro-latest'];
    
    let comment = '';
    let lastError: any = null;

    for (const modelName of fallbackModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemInstruction,
        });

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: `분석할 데이터:\n${sourceText}` }] }],
          generationConfig: {
            temperature: 0.3, // 일관성 있고 안정적인 답변 유도
            maxOutputTokens: 800, // 글자 잘림 방지를 위해 충분한 토큰 할당
          }
        });

        comment = result.response.text();
        if (comment) break; // 성공 시 즉시 탈출

      } catch (err: any) {
        console.error(`[Failover] ${modelName} 실패:`, err.message);
        lastError = err;
        // 실패 시 대기 시간 없이 즉각 다음 하위/상위 모델로 우회 (자동글쓰기 gemini-helper 로직 통합)
        continue;
      }
    }

    if (!comment) {
      throw lastError || new Error('All fallback models failed.');
    }

    return new Response(JSON.stringify({ comment }), {
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: any) {
    console.error('AI Comment Error:', error);
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
