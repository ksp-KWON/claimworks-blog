function isAuthorized(request: Request, env: any): boolean {
  const authHeader = request.headers.get('Authorization') || '';
  const customKey = request.headers.get('X-Admin-Key') || '';
  const token = (authHeader.replace(/^Bearer\s+/i, '') || customKey).trim();
  const adminPw = (env.ADMIN_PASSWORD || '').trim();

  // 환경변수가 없거나 토큰이 불일치하면 즉시 거부
  if (!adminPw || !token || token !== adminPw) {
    return false;
  }
  return true;
}

export async function onRequestGet(context: any) {
  try {
    const { request, env } = context;

    if (!isAuthorized(request, env)) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized: Admin authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const table = url.searchParams.get('table');

    if (!table) {
      return new Response(JSON.stringify({ success: false, message: 'Table is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ALLOWED_TABLES = ['chat_sessions', 'consultations', 'admin_calendar_events'];
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

    const orderQuery = table === 'admin_calendar_events' ? 'order=date.asc' : 'order=created_at.desc';
    const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&${orderQuery}`, {
      method: 'GET',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ success: true, data: [] }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify({ success: true, data: data || [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: true, data: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestPost(context: any) {
  try {
    const { request, env } = context;

    if (!isAuthorized(request, env)) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized: Admin authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const table = url.searchParams.get('table');

    if (!table) {
      return new Response(JSON.stringify({ success: false, message: 'Table is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ALLOWED_TABLES = ['chat_sessions', 'consultations', 'admin_calendar_events'];
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

    const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ success: false, message: `Failed to create record: ${errText}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify({ success: true, data: data?.[0] || data }), {
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

    if (!isAuthorized(request, env)) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized: Admin authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const table = url.searchParams.get('table');

    if (!id || !table) {
      return new Response(JSON.stringify({ success: false, message: 'ID and table are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ALLOWED_TABLES = ['chat_sessions', 'consultations', 'admin_calendar_events'];
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
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ success: false, message: `Failed to update record: ${errText}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify({ success: true, data: data?.[0] || data }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestDelete(context: any) {
  try {
    const { request, env } = context;

    if (!isAuthorized(request, env)) {
      return new Response(JSON.stringify({ success: false, message: 'Unauthorized: Admin authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const table = url.searchParams.get('table');

    if (!id || !table) {
      return new Response(JSON.stringify({ success: false, message: 'ID and table are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ALLOWED_TABLES = ['chat_sessions', 'consultations', 'admin_calendar_events'];
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
      await fetch(`${supabaseUrl}/rest/v1/chat_messages?session_id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
      });
    }

    // 대상 레코드 삭제 (Service Role Key로 RLS 우회하여 영구 삭제)
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

    return new Response(JSON.stringify({ success: true, deletedId: id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
