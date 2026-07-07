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
  
  // Memo State
  const [memoText, setMemoText] = useState('');
  const [isSavingMemo, setIsSavingMemo] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('last_message_at', { ascending: false });
    setSessions(data ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    const channel = supabase
      .channel('admin:sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_sessions' }, () => {
        loadSessions();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadSessions]);

  const loadMessages = useCallback(async (sid: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sid)
      .order('created_at', { ascending: true });
    setMessages(data ?? []);
    await supabase.from('chat_sessions').update({ unread_count: 0 }).eq('id', sid);
    setSessions((prev) => prev.map((s) => s.id === sid ? { ...s, unread_count: 0 } : s));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    loadMessages(selectedId);
    
    // Load Memo for selected session
    const activeSession = sessions.find(s => s.id === selectedId);
    if (activeSession) {
      setMemoText(activeSession.customer_memo || '');
    }
  }, [selectedId, loadMessages]); // sessions is intentionally omitted to avoid overwriting typed memo text on every tick

  useEffect(() => {
    if (!selectedId) return;
    const channel = supabase
      .channel(`admin:chat:${selectedId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${selectedId}`,
      }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedId]);

  useEffect(() => {
    const channel = supabase
      .channel('admin:new_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        const msg = payload.new as ChatMessage;
        if (msg.sender === 'visitor' && msg.session_id !== selectedId) {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === msg.session_id
                ? { ...s, unread_count: (s.unread_count ?? 0) + 1, last_message_at: msg.created_at, last_content: msg.content }
                : s
            )
          );
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendReply = async () => {
    const text = replyText.trim();
    if (!text || !selectedId || isSending) return;
    setIsSending(true);
    setReplyText('');
    try {
      await supabase.from('chat_messages').insert({
        session_id: selectedId,
        sender: 'admin',
        content: text,
      });
      await supabase
        .from('chat_sessions')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedId);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendReply();
    }
  };

  const saveMemo = async () => {
    if (!selectedId) return;
    setIsSavingMemo(true);
    const { error } = await supabase
      .from('chat_sessions')
      .update({ customer_memo: memoText })
      .eq('id', selectedId);
    setIsSavingMemo(false);
    if (!error) {
      setSessions(prev => prev.map(s => s.id === selectedId ? { ...s, customer_memo: memoText } : s));
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const visitorLabel = (session: SessionWithMeta) => {
    if (session.visitor_nickname) return session.visitor_nickname;
    return '익명 방문자 #' + session.visitor_id.slice(-6).toUpperCase();
  };

  const activeSession = sessions.find(s => s.id === selectedId);

  return (
    <div className="flex flex-1 h-full bg-white dark:bg-zinc-950 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
      
      {/* 1단: 세션 목록 (좌측) */}
      <div className="w-[320px] flex flex-col border-r border-gray-200 dark:border-zinc-800 shrink-0 bg-gray-50 dark:bg-zinc-900/50">
        <div className="px-4 py-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center justify-between">
            대화 목록
            <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs">{sessions.length}</span>
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {isLoading ? (
            <div className="text-center py-10 text-xs text-gray-400">불러오는 중...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-10 text-xs text-gray-400">대화 내역이 없습니다.</div>
          ) : (
            <div className="flex flex-col gap-1">
              {sessions.map(session => {
                const isSelected = session.id === selectedId;
                const hasUnread = (session.unread_count ?? 0) > 0;
                return (
                  <button
                    key={session.id}
                    onClick={() => setSelectedId(session.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        : 'bg-transparent border border-transparent hover:bg-white dark:hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-sm font-bold truncate pr-2 ${hasUnread ? 'text-blue-700 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
                        {visitorLabel(session)}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {hasUnread && (
                          <span className="w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                            {session.unread_count}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400">{formatTime(session.last_message_at)}</span>
                      </div>
                    </div>
                    {session.last_content && (
                      <p className="text-xs text-gray-500 truncate">{session.last_content}</p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2단: 대화창 (중앙) */}
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 relative">
        {selectedId ? (
          <>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900 flex justify-between items-center shadow-sm z-10">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                {visitorLabel(activeSession!)}
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-zinc-950/50 custom-scrollbar">
              {messages.map((msg) => {
                const isVisitor = msg.sender === 'visitor';
                return (
                  <div key={msg.id} className={`flex ${isVisitor ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                      isVisitor
                        ? 'bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-zinc-700 rounded-tl-none'
                        : 'bg-[#03c75a] text-white rounded-tr-none'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${isVisitor ? 'text-gray-400' : 'text-green-100'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="p-4 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 shrink-0">
              <div className="flex gap-2 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-xl p-2 focus-within:border-[#03c75a] focus-within:ring-1 focus-within:ring-[#03c75a] transition-all">
                <textarea
                  ref={inputRef}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="메시지를 입력하세요... (Enter로 전송, Shift+Enter로 줄바꿈)"
                  rows={3}
                  className="flex-1 text-sm p-2 bg-transparent resize-none outline-none custom-scrollbar"
                />
                <button
                  onClick={sendReply}
                  disabled={!replyText.trim() || isSending}
                  className="self-end px-5 py-3 bg-[#03c75a] hover:bg-[#02b351] disabled:bg-gray-300 dark:disabled:bg-zinc-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                >
                  <span>전송</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <svg className="w-16 h-16 mb-4 text-gray-200 dark:text-zinc-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <p>좌측에서 대화를 선택해주세요.</p>
          </div>
        )}
      </div>

      {/* 3단: 고객 정보 및 메모장 (우측) */}
      {selectedId && activeSession && (
        <div className="w-[300px] border-l border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col shrink-0">
          <div className="px-4 py-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-950">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">고객 정보</h3>
          </div>
          <div className="p-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar flex-1">
            
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">닉네임/ID</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{visitorLabel(activeSession)}</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">최초 접속일</span>
              <span className="text-sm text-gray-800 dark:text-gray-200">{new Date(activeSession.created_at).toLocaleString('ko-KR')}</span>
            </div>

            <hr className="border-gray-200 dark:border-zinc-800" />

            <div className="flex flex-col gap-2 flex-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">📝 관리자 전용 고객 메모</span>
                <button 
                  onClick={saveMemo}
                  disabled={isSavingMemo}
                  className="text-[10px] bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded transition-colors border border-gray-200 dark:border-zinc-700"
                >
                  {isSavingMemo ? '저장 중...' : '저장'}
                </button>
              </div>
              <textarea
                value={memoText}
                onChange={e => setMemoText(e.target.value)}
                placeholder="이 고객과의 상담에서 기억해야 할 내용을 자유롭게 메모하세요. (고객에게는 보이지 않습니다)"
                className="flex-1 min-h-[200px] w-full bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-3 text-sm text-gray-800 dark:text-gray-200 resize-none outline-none focus:border-yellow-400 transition-colors custom-scrollbar"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
