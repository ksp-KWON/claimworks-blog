'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ChatSession, ChatMessage } from '@/lib/supabase';

interface SessionWithMeta extends ChatSession {
  last_content?: string;
}

export default function ChatAdminPanel() {
  const [sessions, setSessions] = useState<SessionWithMeta[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: sessionsData, error: sessionErr } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('last_message_at', { ascending: false });
        
      if (sessionErr) throw sessionErr;

      // 각 세션별 마지막 메시지 가져오기 (가벼운 버전을 위해 병렬 호출)
      const sessionsWithMeta = await Promise.all((sessionsData || []).map(async (sess) => {
        const { data: lastMsg } = await supabase
          .from('chat_messages')
          .select('content')
          .eq('session_id', sess.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        return {
          ...sess,
          last_content: lastMsg ? lastMsg.content : '메시지가 없습니다.'
        };
      }));

      setSessions(sessionsWithMeta);
    } catch (err) {
      console.error('Fetch sessions err:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMessages = async (sid: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sid)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      setMessages(data || []);
      scrollToBottom();

      // 안 읽은 메시지 초기화
      await supabase.from('chat_sessions').update({ unread_count: 0 }).eq('id', sid);
      
      // 세션 목록 갱신
      setSessions(prev => prev.map(s => s.id === sid ? { ...s, unread_count: 0 } : s));

    } catch (err) {
      console.error('Load messages err:', err);
    }
  };

  const subscribeToGlobalChanges = useCallback(() => {
    const channel = supabase
      .channel('admin_global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, (payload) => {
        // 새 메시지가 오면
        const newMsg = payload.new as ChatMessage;
        
        // 현재 보고 있는 세션이면 메시지 리스트에 추가
        if (selectedId === newMsg.session_id) {
          setMessages(prev => [...prev, newMsg]);
          scrollToBottom();
          // 관리자가 아니면(방문자가 보낸거면) 바로 읽음 처리
          if (newMsg.sender === 'visitor') {
            supabase.from('chat_sessions').update({ unread_count: 0 }).eq('id', selectedId).then();
          }
        }
        
        // 세션 목록 갱신 (마지막 메시지 및 unread_count 업데이트)
        setSessions(prev => {
          let found = false;
          let updated = prev.map(s => {
            if (s.id === newMsg.session_id) {
              found = true;
              return {
                ...s,
                last_content: newMsg.content,
                last_message_at: newMsg.created_at,
                unread_count: (newMsg.sender === 'visitor' && selectedId !== newMsg.session_id) ? (s.unread_count || 0) + 1 : s.unread_count
              };
            }
            return s;
          });
          if (!found) {
            // 새 세션이면 새로고침을 트리거하거나 새로 추가
            fetchSessions();
          }
          return updated.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId, fetchSessions]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    const unsubscribe = subscribeToGlobalChanges();
    return () => unsubscribe();
  }, [subscribeToGlobalChanges]);

  const handleSelectSession = (sid: string) => {
    setSelectedId(sid);
    loadMessages(sid);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async () => {
    if (!replyText.trim() || !selectedId || isSending) return;
    const sendText = replyText.trim();
    setReplyText('');
    setIsSending(true);

    try {
      const { error: msgErr } = await supabase
        .from('chat_messages')
        .insert([{ session_id: selectedId, sender: 'admin', content: sendText }]);
        
      if (msgErr) throw msgErr;
      
      // last_message_at 업데이트 & unread_count (방문자 화면 뱃지용, 세션에는 관리자가 보낼 땐 1 올릴 수 있음)
      // 여기서는 방문자가 볼 unread를 위해 세션 업데이트
      const sess = sessions.find(s => s.id === selectedId);
      await supabase.from('chat_sessions').update({ 
        last_message_at: new Date().toISOString(),
        unread_count: (sess?.unread_count || 0) + 1
      }).eq('id', selectedId);

    } catch (err) {
      console.error('Send error:', err);
      setReplyText(sendText);
      alert('메시지 전송 실패');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-white dark:bg-[#111111]">
      {/* 왼쪽: 세션 리스트 */}
      <div className="w-1/3 min-w-[280px] max-w-[350px] border-r border-gray-200 dark:border-white/10 flex flex-col h-full bg-gray-50 dark:bg-[#1a1a1a]">
        <div className="p-4 border-b border-gray-200 dark:border-white/10 shrink-0 bg-white dark:bg-[#202124] flex justify-between items-center">
          <h2 className="font-bold text-gray-800 dark:text-white">채팅 목록</h2>
          <button onClick={fetchSessions} className="text-gray-400 hover:text-blue-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-gray-500">로딩 중...</div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">진행 중인 채팅이 없습니다.</div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-white/5">
              {sessions.map(sess => (
                <button
                  key={sess.id}
                  onClick={() => handleSelectSession(sess.id)}
                  className={`w-full text-left p-4 transition-colors ${selectedId === sess.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                      {sess.visitor_nickname || '익명 방문자'}
                    </span>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {new Date(sess.last_message_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">
                      {sess.last_content}
                    </p>
                    {sess.unread_count > 0 && selectedId !== sess.id && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                        {sess.unread_count}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 오른쪽: 채팅 화면 */}
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-[#111111]">
        {selectedId ? (
          <>
            {/* 채팅 헤더 */}
            <div className="p-4 border-b border-gray-200 dark:border-white/10 shrink-0 bg-white dark:bg-[#202124] flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white">
                  {sessions.find(s => s.id === selectedId)?.visitor_nickname || '익명 방문자'}
                </h3>
                <p className="text-xs text-gray-400">Session ID: {selectedId.slice(0,8)}...</p>
              </div>
            </div>
            
            {/* 메시지 영역 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-[#111111]">
              {messages.map(msg => {
                const isAdmin = msg.sender === 'admin';
                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`max-w-[75%] flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                      <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                        isAdmin 
                          ? 'bg-blue-600 text-white rounded-br-sm' 
                          : 'bg-white dark:bg-[#2a2b2e] text-gray-800 dark:text-gray-200 rounded-bl-sm border border-gray-200 dark:border-white/5'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 mx-1">
                        {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* 입력창 */}
            <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#202124] shrink-0">
              <div className="flex gap-2">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="메시지를 입력하세요 (Shift+Enter로 줄바꿈)"
                  className="flex-1 resize-none bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500"
                  rows={2}
                />
                <button
                  onClick={handleSend}
                  disabled={!replyText.trim() || isSending}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-zinc-700 text-white font-bold rounded-xl transition-colors"
                >
                  {isSending ? '전송중' : '전송'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50 dark:bg-[#111111]">
            <svg className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>좌측 목록에서 채팅 세션을 선택해주세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
