// Cloudflare Pages Function: /functions/api/precedent.ts
// 공유 코어 서비스 모듈을 사용하여 중복 코드 없이 에지 서버리스 환경에서 구동됩니다.

import { searchAndFetchPrecedents } from '../../src/lib/precedent-service';

export async function onRequest(context: any) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: '검색어를 입력해 주세요.' }), 
        {
          status: 400,
          headers: { 
            'Content-Type': 'application/json;charset=UTF-8',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }

    // Cloudflare Pages에 바인딩된 환경변수 로드
    const LAW_API_KEY = env.LAW_API_KEY || 'ksp78';

    // 공유 코어 서비스 모듈 호출
    const data = await searchAndFetchPrecedents(query, LAW_API_KEY);

    return new Response(
      JSON.stringify({
        success: true,
        data
      }), 
      {
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message || '서버 내부 오류가 발생했습니다.' }), 
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
