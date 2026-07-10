import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useUnreadChatCount() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchUnreadCount = async () => {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('unread_count')
        .gt('unread_count', 0);
      
      if (!error && data && isMounted) {
        const total = data.reduce((acc, curr) => acc + (curr.unread_count || 0), 0);
        setUnreadCount(total);
      }
    };

    fetchUnreadCount();

    // Subscribe to changes in chat_sessions
    const channel = supabase.channel('chat_sessions_unread')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_sessions' },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return unreadCount;
}
