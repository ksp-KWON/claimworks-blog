export async function onRequestDelete(context: any) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ success: false, message: 'ID is required' }), {
        status: 400,
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

    // 1. Delete messages first
    const msgRes = await fetch(`${supabaseUrl}/rest/v1/chat_messages?session_id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
    });

    if (!msgRes.ok) {
      const msgErr = await msgRes.text();
      return new Response(JSON.stringify({ success: false, message: `Failed to delete messages: ${msgErr}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Delete the session
    const sessRes = await fetch(`${supabaseUrl}/rest/v1/chat_sessions?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
    });

    if (!sessRes.ok) {
      const sessErr = await sessRes.text();
      return new Response(JSON.stringify({ success: false, message: `Failed to delete session: ${sessErr}` }), {
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

    if (!id) {
      return new Response(JSON.stringify({ success: false, message: 'ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { status } = body;

    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ success: false, message: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sessRes = await fetch(`${supabaseUrl}/rest/v1/chat_sessions?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ status })
    });

    if (!sessRes.ok) {
      const sessErr = await sessRes.text();
      return new Response(JSON.stringify({ success: false, message: `Failed to update session: ${sessErr}` }), {
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
