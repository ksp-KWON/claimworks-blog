export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { password } = body;
    
    const userPw = String(password || '').trim();
    const adminPw = (env.ADMIN_PASSWORD || '').trim();

    if (!adminPw) {
      return new Response(JSON.stringify({ success: false, message: 'Server configuration error: ADMIN_PASSWORD is not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 관리자 비밀번호 검증 (오직 환경변수 기반)
    if (userPw === adminPw) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ success: false, message: '비밀번호가 일치하지 않습니다.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch {
    return new Response(JSON.stringify({ success: false, message: 'Server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
