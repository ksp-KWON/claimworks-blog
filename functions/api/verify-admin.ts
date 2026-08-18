export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { password } = body;
    
    const userPw = String(password || '').trim();
    const adminPw = env.ADMIN_PASSWORD ? String(env.ADMIN_PASSWORD).trim() : '991300';

    // 관리자 비밀번호 검증 (환경변수 및 기본값 991300)
    if (userPw === adminPw || userPw === '991300') {
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
