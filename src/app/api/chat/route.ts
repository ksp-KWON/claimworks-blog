import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    
    // 1. Delete messages first to prevent FK constraint errors
    const { error: msgError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', id);
      
    if (msgError) {
      console.error('Failed to delete chat messages:', msgError);
      return NextResponse.json({ success: false, message: msgError.message }, { status: 500 });
    }

    // 2. Delete the session
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete chat session:', error);
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Chat delete API error:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
