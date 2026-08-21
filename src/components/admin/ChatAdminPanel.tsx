'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import type { ChatSession, ChatMessage } from '@/lib/supabase';
import AdminPanelLayout from './AdminPanelLayout';
import { AdminHeaderBar } from './AdminHeader';
import PremiumCard from '@/components/ui/PremiumCard';
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

const MACRO_PHRASES = [
  "안녕하세요, 보상스쿨 손해사정사입니다. 남겨주신 내용을 꼼꼼히 확인하고 답변드리겠습니다.",
  "외근이나 상담 중일 경우 답변이 지연될 수 있으나, 잠시만 기다려주시면 100% 답변드립니다.",
  "보다 정확한 상담을 위해 관련 서류(진단서 등)가 있다면 사진으로 남겨주시겠어요?",
  "말씀하신 내용은 전문적인 검토가 필요합니다. 편하신 시간에 연락처를 남겨주시면 전화드리겠습니다."
];

function playNotificationSound() {
  try {
    const audio = new Audio('/notification.ogg');
    audio.play().catch(e => console.warn('Audio play blocked:', e));
  } catch (e) {
    console.error('Audio initialization error:', e);
  }
}

function showBrowserNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/logo.png' });
  }
}


export default function ChatAdminPanel({ searchQuery = '', sortType = 'date', refreshCounter = 0 }: ChatAdminPanelProps) {
  const [sessions, setSessions] = useState<SessionWithMeta[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
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

  const scrollToBottom = useCallback((smooth = true) => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: smooth ? 'smooth' : 'auto'
        });
      }
    }, 50);
  }, []);


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
        
        // 현재 보고 있는 세션이면 메시지 추가
        if (newMsg.session_id === selectedId) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          scrollToBottom();
        }
        
        // 방문자가 보낸거면 바로 읽음 처리
        if (isFromVisitor) {
          supabase.from('chat_sessions').update({ unread_count: 0 }).eq('id', selectedId).then();
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



  const handleSelectSession = (sid: string) => {
    setSelectedId(sid);
    loadMessages(sid);
  };



  const handleSend = async () => {
    if (!replyText.trim() || !selectedId || isSending) return;
    const sendText = replyText.trim();
    setReplyText('');
    setIsSending(true);

    try {
      const { data: insertedMsg, error: msgErr } = await supabase
        .from('chat_messages')
        .insert([{ session_id: selectedId, sender: 'admin', content: sendText }])
        .select()
        .single();
        
      if (msgErr) throw msgErr;
      
      // 관리자 패널에도 표준화된 낙관적 업데이트(Optimistic UI) 통합 적용 (레이스 컨디션 완벽 차단)
      setMessages(prev => {
        if (prev.some(m => m.id === insertedMsg.id)) return prev;
        return [...prev, insertedMsg];
      });
      scrollToBottom();
      
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
      const res = await fetch(`/api/admin-manage?table=chat_sessions&id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      
      if (!data.success) {
        alert(`상태 업데이트 실패: ${data.message}`);
        return;
      }

      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus as any } : s));
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
      const res = await fetch(`/api/admin-manage?table=chat_sessions&id=${id}`, {
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
        if (item.status === '삭제') return false;
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
    <AdminPanelLayout innerClassName="flex-col md:flex-row gap-2.5 min-w-0">
      {/* 🏝️ 1. 좌측 세션 리스트 카드 아일랜드 */}
      <PremiumCard 
        borderColor="blue" 
        hoverEffect={true} 
        className={`w-full md:w-[320px] lg:w-[360px] shrink-0 min-h-0 h-full !p-0 flex flex-col overflow-hidden ${selectedId ? 'hidden md:flex' : 'flex'}`}
      >
        <AdminHeaderBar 
          title="실시간 상담 채팅" 
          emoji="💬"
          tone="blue"
          rightContent={<span className="text-[11px] text-[var(--google-blue)] dark:text-[#8ab4f8] font-bold bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-none border border-blue-200 dark:border-blue-800">{sortedAndFilteredSessions.length}건</span>} 
        />
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-gray-50/40 dark:bg-zinc-950/40">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-gray-400">채팅 목록 로딩 중...</div>
          ) : sortedAndFilteredSessions.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">조건에 맞는 채팅이 없습니다.</div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-zinc-800/60">
              {sortedAndFilteredSessions.map(sess => {
                const status = sess.status || '대기';
                const isSelected = selectedId === sess.id;
                return (
                  <div
                    key={sess.id}
                    onClick={() => handleSelectSession(sess.id)}
                    className={`w-full text-left p-3 cursor-pointer transition-all duration-200 border-l-[3px] ${
                      isSelected 
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-[var(--google-blue)] shadow-sm' 
                        : 'border-transparent hover:border-blue-300 hover:bg-white dark:hover:bg-zinc-900/80 bg-white dark:bg-[#202124]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex items-center gap-1.5 overflow-hidden w-full">
                        <AdminStatusSelect
                          status={status}
                          onStatusChange={(val) => updateStatus(sess.id, val)}
                          onDelete={() => deleteSession(sess.id)}
                          className="!text-[11px] !px-2 !py-0.2"
                        />
                        <span className="font-extrabold text-xs text-gray-900 dark:text-gray-100 truncate flex-1">
                          {sess.visitor_nickname || '익명 방문자'}
                        </span>
                        <span className="text-[10px] text-gray-400 shrink-0 font-mono font-medium">
                          {new Date(sess.last_message_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <p className={`text-xs truncate flex-1 ${sess.unread_count > 0 && selectedId !== sess.id ? 'font-extrabold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-zinc-400'}`}>
                        {sess.last_content}
                      </p>
                      {sess.unread_count > 0 && selectedId !== sess.id && (
                        <span className="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-none shrink-0 shadow-sm">
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
      </PremiumCard>
      
      {/* 🏝️ 2. 오른쪽: 실시간 채팅 워크스페이스 카드 아일랜드 */}
      <PremiumCard 
        borderColor="blue" 
        hoverEffect={false} 
        className={`flex-1 min-w-0 min-h-0 h-full !p-0 flex flex-col relative bg-gray-50/50 dark:bg-zinc-950/80 ${!selectedId ? 'hidden md:flex' : 'flex'} overflow-hidden`}
      >
        {selectedId && selectedSession ? (
          <>
            {/* 채팅 헤더 */}
            <AdminHeaderBar 
              title={
                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                  <button 
                    onClick={() => setSelectedId(null)}
                    className="md:hidden p-1 -ml-1 mr-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-none transition-colors shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div className="flex items-center gap-2 min-w-0 truncate">
                    <span className="truncate font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white">{selectedSession.visitor_nickname || '익명 방문자'}</span>
                    <span className="text-[10px] text-gray-400 font-mono hidden sm:inline-block shrink-0">ID: {selectedId.split('-')[0]}</span>
                  </div>
                  {selectedSession.status === '대기' && <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-none bg-red-100 text-red-600 border border-red-200 shrink-0">대기중</span>}
                </div>
              }
              rightContent={
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      const title = `[채팅상담] ${selectedSession.visitor_nickname || '익명 고객'}`;
                      const recentMsgs = messages.slice(-3).map(m => `[${m.sender === 'visitor' ? '고객' : '관리자'}] ${m.content}`).join('\n');
                      const contentText = `고객 닉네임: ${selectedSession.visitor_nickname || '익명'}\n세션ID: ${selectedId}\n최근 대화내역:\n${recentMsgs}`;
                      const payload = {
                        title,
                        text: contentText,
                        sourceApp: 'chat',
                        sourceId: selectedId
                      };
                      sessionStorage.setItem('pending_calendar_event', JSON.stringify(payload));
                      window.dispatchEvent(new CustomEvent('navigate-admin-app', { detail: { app: 'calendar' } }));
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-none border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors shadow-sm"
                    title="캘린더 일정으로 등록"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span>일정 등록</span>
                  </button>
                  <PremiumBadge color={selectedSession.status === '상담' ? 'blue' : selectedSession.status === '완료' ? 'green' : 'gray'} className="!px-2 !py-0.5 !text-[10px] rounded-none">
                    {selectedSession.status || '대기'}
                  </PremiumBadge>
                </div>
              }
            />
            
            {/* 메시지 영역 */}
            <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-3 bg-gray-50/60 dark:bg-zinc-950/80 custom-scrollbar">
              {messages.map((msg, index) => {
                const isAdmin = msg.sender === 'admin';
                const showAvatar = index === 0 || messages[index - 1].sender !== msg.sender;
                
                return (
                  <div key={msg.id} className={`w-full flex items-end gap-2 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* 아바타 (방문자일 경우만) */}
                    {!isAdmin && (
                      <div className={`w-7 h-7 rounded-none bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800 ${!showAvatar && 'opacity-0'}`}>
                        <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400">V</span>
                      </div>
                    )}
                    
                    <div className={`max-w-[85%] md:max-w-[75%] min-w-0 flex flex-col ${isAdmin ? 'items-end ml-auto' : 'items-start mr-auto'}`}>
                      {showAvatar && !isAdmin && (
                        <span className="text-[10px] text-gray-500 mb-0.5 ml-0.5 font-bold">{selectedSession.visitor_nickname || '방문자'}</span>
                      )}
                      
                      <div className={`rounded-none px-3.5 py-2.5 shadow-sm max-w-full border ${
                        isAdmin 
                          ? 'bg-[var(--google-blue)] text-white border-blue-600 shadow-blue-500/10' 
                          : 'bg-white dark:bg-[#202124] text-gray-800 dark:text-gray-100 border-gray-200/80 dark:border-zinc-700/80'
                      }`}>
                        <p className="text-xs sm:text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed">{msg.content}</p>
                      </div>
                      <span className={`text-[10px] text-gray-400 mt-1 mx-0.5 font-mono font-medium ${isAdmin ? 'text-right' : 'text-left'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 입력창 (직각 3D 시스템) */}
            <div className="p-3 border-t border-gray-200/80 dark:border-zinc-800 bg-white dark:bg-[#202124] shrink-0 w-full min-w-0">
              <div className="flex flex-col gap-2 relative w-full min-w-0">
                {/* 매크로 UI */}
                <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-0.5">
                  {MACRO_PHRASES.map((phrase, idx) => (
                    <button
                      key={idx}
                      onClick={() => setReplyText(prev => prev + (prev ? '\n' : '') + phrase)}
                      className="shrink-0 px-2 py-0.5 text-[10.5px] font-bold bg-gray-50 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700 rounded-none hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 transition-colors shadow-sm"
                    >
                      매크로 {idx + 1}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 items-end">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="메시지 입력 (Shift+Enter 줄바꿈)..."
                    className="flex-1 min-w-0 resize-none bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-none p-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all custom-scrollbar"
                    rows={2}
                  />

                  <button
                    onClick={handleSend}
                    disabled={!replyText.trim() || isSending}
                    className="h-[58px] px-4 bg-[var(--google-blue)] hover:bg-[#1557b0] disabled:bg-gray-200 dark:disabled:bg-zinc-800 text-white disabled:text-gray-400 rounded-none transition-all shadow-sm font-bold text-xs flex items-center justify-center shrink-0"
                    title="전송"
                  >
                    {isSending ? '전송중' : '전송'}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 dark:bg-zinc-950/80">
            <div className="p-4 bg-white dark:bg-[#202124] border border-gray-200/80 dark:border-zinc-800 rounded-none shadow-sm flex items-center justify-center mb-3">
              <svg className="w-8 h-8 text-blue-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="font-bold text-xs text-gray-500">좌측 목록에서 상담 채팅 세션을 선택해주세요.</p>
          </div>
        )}
      </PremiumCard>
    </AdminPanelLayout>
  );
}
