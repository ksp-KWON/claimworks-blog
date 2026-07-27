'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { ChatSession, ChatMessage } from '@/lib/supabase';
import AdminPanelLayout from './AdminPanelLayout';
import { AdminHeaderBar } from './AdminHeader';
import PremiumBadge from '@/components/ui/PremiumBadge';
import { AdminStatusSelect } from './AdminStatusSelect';

interface SessionWithMeta extends ChatSession {
  last_content?: string;
}

interface ChatAdminPanelProps {
  searchQuery?: string;
  sortType?: string;
  refreshCounter?: number;
}

export default function ChatAdminPanel({ searchQuery = '', sortType = 'date', refreshCounter = 0 }: ChatAdminPanelProps) {
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

      // 각 세션별 마지막 메시지 가져오기
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

  useEffect(() => {
    if (refreshCounter > 0) {
      fetchSessions();
    }
  }, [refreshCounter, fetchSessions]);

  // Load messages and mark as read
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
        if (payload.eventType !== 'INSERT') return;
        
        const newMsg = payload.new as ChatMessage;
        const isFromVisitor = newMsg.sender === 'visitor';
        
        // 현재 보고 있는 세션이면 메시지 리스트에 추가
        if (selectedId === newMsg.session_id) {
          setMessages(prev => [...prev, newMsg]);
          scrollToBottom();
          // 방문자가 보낸거면 바로 읽음 처리
          if (isFromVisitor) {
            supabase.from('chat_sessions').update({ unread_count: 0 }).eq('id', selectedId).then();
          }
        }
        
        // 세션 목록 갱신 및 알림 발생
        setSessions(prev => {
          const exists = prev.find(s => s.id === newMsg.session_id);
          if (exists) {
            if (isFromVisitor && selectedId !== newMsg.session_id) {
              playNotificationSound();
              showBrowserNotification('새로운 메시지 도착', newMsg.content || '채팅 메시지가 왔습니다.');
            }
            return prev.map(s => s.id === exists.id ? { 
              ...s, 
              last_content: newMsg.content,
              last_message_at: newMsg.created_at, 
              unread_count: (isFromVisitor && selectedId !== newMsg.session_id) ? (s.unread_count || 0) + 1 : s.unread_count 
            } : s).sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
          } else {
            // 새 세션인 경우 다시 fetch
            fetchSessions();
            if (isFromVisitor) {
              playNotificationSound();
              showBrowserNotification('새로운 상담 채팅 시작', newMsg.content || '새 채팅방이 열렸습니다.');
            }
            return prev;
          }
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

  // 알림 권한 요청 및 사운드 초기화
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.ogg');
      audio.play().catch(e => console.warn('Audio play blocked:', e));
    } catch (e) {
      console.error('Audio initialization error:', e);
    }
  };

  const showBrowserNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/logo.png' });
    }
  };

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

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/chat?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      
      if (!data.success) {
        alert(`상태 업데이트 실패: ${data.message}`);
        return;
      }

      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
      if (newStatus === '삭제' && selectedId === id) {
        setSelectedId(null);
      }
    } catch (err: any) {
      alert(`상태 업데이트 중 오류 발생: ${err.message}`);
    }
  };

  const deleteSession = async (id: string) => {
    if (!window.confirm('정말로 이 채팅 세션을 삭제하시겠습니까? (관련 메시지도 함께 DB에서 완전 삭제됩니다)')) {
        return;
    }
    
    try {
      const res = await fetch(`/api/chat?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (!data.success) {
        alert(`세션 삭제 실패: ${data.message}`);
        return;
      }
      
      if (selectedId === id) setSelectedId(null);
      setSessions(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert(`삭제 중 오류 발생: ${err.message}`);
    }
  };


  const sortedAndFilteredSessions = useMemo(() => {
    return [...sessions]
      .filter(item => {
        if (item.status === '삭제') return false; // 삭제 상태 숨김
        const query = searchQuery.toLowerCase();
        const nicknameMatch = item.visitor_nickname?.toLowerCase().includes(query) || false;
        const contentMatch = item.last_content?.toLowerCase().includes(query) || false;
        return nicknameMatch || contentMatch;
      })
      .sort((a, b) => {
        if (sortType === 'date') {
          return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
        } else {
          return (a.visitor_nickname || '').localeCompare(b.visitor_nickname || '');
        }
      });
  }, [sessions, searchQuery, sortType]);

  const selectedSession = sessions.find(s => s.id === selectedId);

  return (
    <AdminPanelLayout innerClassName="flex flex-col md:flex-row w-full h-full bg-white dark:bg-[#111111]">
      
      {/* 왼쪽: 세션 리스트 (모바일에서는 선택된 세션이 없을 때만 표시) */}
      <div className={`w-full md:w-1/3 md:min-w-[320px] md:max-w-[400px] flex-1 md:flex-none min-h-0 flex flex-col border-r-0 md:border-r border-gray-200 dark:border-zinc-800 ${selectedId ? 'hidden md:flex' : 'flex'}`}>
        <AdminHeaderBar 
          title="채팅 목록" 
          rightContent={<span className="text-xs text-gray-500 font-medium bg-gray-200/50 dark:bg-zinc-800 px-2 py-1 rounded-full">{sortedAndFilteredSessions.length}건</span>} 
        />
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/50 dark:bg-zinc-950/50">
              {isLoading ? (
                <div className="p-8 text-center text-sm text-gray-500 font-medium">로딩 중...</div>
              ) : sortedAndFilteredSessions.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500 font-medium">조건에 맞는 채팅이 없습니다.</div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {sortedAndFilteredSessions.map(sess => {
                    const status = sess.status || '대기';
                    return (
                      <div
                        key={sess.id}
                        onClick={() => handleSelectSession(sess.id)}
                        className={`w-full text-left p-4 cursor-pointer transition-all duration-200 group ${selectedId === sess.id ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'hover:bg-white dark:hover:bg-zinc-900 bg-white dark:bg-zinc-900/50'}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2 overflow-hidden w-full">
                            <AdminStatusSelect
                              status={status}
                              onStatusChange={(val) => updateStatus(sess.id, val)}
                              onDelete={() => deleteSession(sess.id)}
                              className="text-xs px-2 py-0.5 rounded"
                            />
                            <span className="font-bold text-[15px] text-gray-900 dark:text-gray-100 truncate flex-1">
                              {sess.visitor_nickname || '익명 방문자'}
                            </span>
                            <span className="text-[11px] text-gray-400 shrink-0 font-mono font-medium group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                              {new Date(sess.last_message_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center gap-3">
                          <p className={`text-sm truncate flex-1 ${sess.unread_count > 0 && selectedId !== sess.id ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 font-medium'}`}>
                            {sess.last_content}
                          </p>
                          {sess.unread_count > 0 && selectedId !== sess.id && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 shadow-sm shadow-red-500/20">
                              {sess.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          
          {/* 오른쪽: 채팅 화면 (모바일에서는 선택된 세션이 있을 때만 표시) */}
          <div className={`flex-1 min-h-0 flex flex-col relative bg-[#f8f9fa] dark:bg-zinc-950/80 ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
            {selectedId && selectedSession ? (
              <>
                {/* 채팅 헤더 */}
                <AdminHeaderBar 
                  title={
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setSelectedId(null)}
                        className="md:hidden p-1.5 -ml-1.5 mr-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="truncate">{selectedSession.visitor_nickname || '익명 방문자'}</span>
                        <span className="text-[10px] text-gray-400 font-mono font-medium hidden sm:inline-block">ID: {selectedId.split('-')[0]}</span>
                      </div>
                      {selectedSession.status === '대기' && <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-red-100 text-red-600">대기중</span>}
                    </div>
                  }
                  rightContent={
                    <div className="flex items-center gap-2">
                      <PremiumBadge color={selectedSession.status === '상담' ? 'blue' : selectedSession.status === '완료' ? 'green' : 'gray'} className="px-2 py-0.5 text-[10px]">
                        {selectedSession.status || '대기'}
                      </PremiumBadge>
                    </div>
                  }
                />
                
                {/* 메시지 영역 */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#f8f9fa] dark:bg-zinc-950/80 custom-scrollbar">
                  {messages.map((msg, index) => {
                    const isAdmin = msg.sender === 'admin';
                    const showAvatar = index === 0 || messages[index - 1].sender !== msg.sender;
                    
                    return (
                      <div key={msg.id} className={`flex items-end gap-3 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* 아바타 (방문자일 경우만) */}
                        {!isAdmin && (
                          <div className={`w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0 ${!showAvatar && 'opacity-0'}`}>
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">V</span>
                          </div>
                        )}
                        
                        <div className={`max-w-[70%] flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                          {showAvatar && !isAdmin && (
                            <span className="text-xs text-gray-500 mb-1 ml-1">{selectedSession.visitor_nickname || '방문자'}</span>
                          )}
                          
                          <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                            isAdmin 
                              ? 'bg-blue-600 text-white rounded-br-sm shadow-blue-600/20' 
                              : 'bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100 rounded-bl-sm border border-gray-100 dark:border-zinc-700/50'
                          }`}>
                            <p className="text-[15px] whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          </div>
                          <span className={`text-[11px] text-gray-400 mt-1.5 mx-1 font-mono font-medium ${isAdmin ? 'text-right' : 'text-left'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* 입력창 */}
                <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
                  <div className="flex gap-3 relative">
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
                      className="flex-1 resize-none bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-xl p-3.5 pr-14 text-[15px] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-600/50 transition-all custom-scrollbar"
                      rows={2}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!replyText.trim() || isSending}
                      className="absolute right-3 bottom-3 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 dark:disabled:bg-zinc-800 text-white disabled:text-gray-400 rounded-lg transition-all shadow-sm disabled:shadow-none flex items-center justify-center"
                      title="전송"
                    >
                      {isSending ? (
                        <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      ) : (
                        <svg className="w-5 h-5 translate-x-px -translate-y-px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-[#f8f9fa] dark:bg-zinc-950/80">
                <div className="w-20 h-20 rounded-full bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-blue-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="font-medium text-gray-500">좌측 목록에서 채팅 세션을 선택해주세요.</p>
              </div>
            )}
          </div>
    </AdminPanelLayout>
  );
}
