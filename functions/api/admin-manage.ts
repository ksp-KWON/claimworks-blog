export async function onRequestDelete(context: any) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const table = url.searchParams.get('table');

    if (!id || !table) {
      return new Response(JSON.stringify({ success: false, message: 'ID and table are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 허용된 테이블만 접근 가능하도록 화이트리스트 검증 (공통 표준 공유코드 보안)
    const ALLOWED_TABLES = ['chat_sessions', 'consultations'];
    if (!ALLOWED_TABLES.includes(table)) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid table name' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ success: false, message: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 채팅 세션 삭제 시 종속된 메시지 먼저 삭제
    if (table === 'chat_sessions') {
      const msgRes = await fetch(`${supabaseUrl}/rest/v1/chat_messages?session_id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
      });
      if (!msgRes.ok) {
        return new Response(JSON.stringify({ success: false, message: 'Failed to delete child messages' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // 대상 레코드 삭제
    const res = await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ success: false, message: `Failed to delete record: ${errText}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPatch(context: any) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const table = url.searchParams.get('table');

    if (!id || !table) {
      return new Response(JSON.stringify({ success: false, message: 'ID and table are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ALLOWED_TABLES = ['chat_sessions', 'consultations'];
    if (!ALLOWED_TABLES.includes(table)) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid table name' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ success: false, message: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/${table}?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ success: false, message: `Failed to update record: ${errText}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
