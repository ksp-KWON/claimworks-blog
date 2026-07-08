export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const { password } = body;
    
    // 단순 비밀번호 검증
    if (password === env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ success: false, message: '비밀번호가 일치하지 않습니다.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ success: false, message: 'Server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
