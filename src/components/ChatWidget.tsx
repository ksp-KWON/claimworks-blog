'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { ChatMessage } from '@/lib/supabase';

// ─── 익명 방문자 ID (개인정보 수집 없음) ───────────────────────────
function getVisitorId(): string {
  try {
    const key = 'cw_vid';
    const stored = localStorage.getItem(key);
    if (stored) return stored;
    const id = 'v' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    localStorage.setItem(key, id);
    return id;
  } catch {
    return 'v_anonymous_' + Date.now();
  }
}

const GREETING =
  '안녕하세요 보상스쿨 손해사정사입니다. 사건내용과 함께 궁금하신 점 질문 주시면 확인하는대로 답변 드리겠습니다.';

type ConnectionStatus = 'idle' | 'checking' | 'need_nickname' | 'connecting' | 'connected' | 'error';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [status, setStatus] = useState<ConnectionStatus>('idle');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sessionIdRef = useRef<string | null>(null);

  // ─── 기존 세션 확인 ─────────────────────────────────────────────
  const checkExistingSession = useCallback(async () => {
    if (sessionIdRef.current) return sessionIdRef.current;
    
    setStatus('checking');
    try {
      const visitorId = getVisitorId();
      const { data: existing, error } = await supabase
        .from('chat_sessions')
        .select('id, visitor_nickname')
        .eq('visitor_id', visitorId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (existing?.id) {
        // 기존 세션이 존재하면 메시지 로드 후 바로 연결
        const { data: msgs } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', existing.id)
          .order('created_at', { ascending: true });

        setMessages(msgs ?? []);
        setSessionId(existing.id);
        sessionIdRef.current = existing.id;
        setStatus('connected');
        return existing.id;
      }

      // 세션이 없으면 닉네임 설정 화면으로
      setStatus('need_nickname');
      return null;
    } catch (err) {
      console.error('[ChatWidget] 기존 세션 확인 실패:', err);
      setStatus('error');
      return null;
    }
  }, []);

  // ─── 닉네임 입력 및 신규 세션 생성 ─────────────────────────────────
  const startNewSessionWithNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    const nickname = nicknameInput.trim();
    if (!nickname) return;

    setStatus('connecting');
    try {
      const visitorId = getVisitorId();
      const { data: newSess, error: insertErr } = await supabase
        .from('chat_sessions')
        .insert({ 
          visitor_id: visitorId,
          visitor_nickname: nickname,
          status: '대기중'
        })
        .select('id')
        .single();

      if (insertErr) throw insertErr;

      setSessionId(newSess.id);
      sessionIdRef.current = newSess.id;
      setStatus('connected');
      
      // 채팅 입력창 포커스
      setTimeout(() => inputRef.current?.focus(), 300);
    } catch (err) {
      console.error('[ChatWidget] 세션 생성 실패:', err);
      setStatus('error');
    }
  };

  // ─── 채팅창 열기 ───────────────────────────────────────────────
  const handleOpen = useCallback(async () => {
    setIsOpen(true);
    setUnreadCount(0);
    if (!sessionIdRef.current) {
      await checkExistingSession();
    } else {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [checkExistingSession]);

  // 전역 함수 등록
  useEffect(() => {
    (window as Window & { __openClaimworksChat?: () => void }).__openClaimworksChat = handleOpen;
    return () => {
      delete (window as Window & { __openClaimworksChat?: () => void }).__openClaimworksChat;
    };
  }, [handleOpen]);

  // ─── 실시간 메시지 구독 ─────────────────────────────────────────
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`chat:${sessionId}`, { config: { broadcast: { self: false } } })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        ({ new: newMsg }) => {
          const msg = newMsg as ChatMessage;
          setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
          if (!isOpen && msg.sender === 'admin') {
            setUnreadCount(n => n + 1);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId, isOpen]);
  // ─── URL 파라미터 확인 후 자동 오픈 ─────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('chat') === 'open' || window.location.hash === '#chat') {
        setTimeout(() => setIsOpen(true), 300);
      }
    }
  }, []);

  // ─── 메시지 전송 ───────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setInputText('');

    try {
      const sid = sessionIdRef.current;
      if (!sid) throw new Error('세션이 없습니다.');

      const now = new Date().toISOString();

      const { error } = await supabase.from('chat_messages').insert({
        session_id: sid,
        sender: 'visitor',
        content: text,
      });

      if (error) throw error;

      await supabase
        .from('chat_sessions')
        .update({ last_message_at: now, unread_count: 0 })
        .eq('id', sid);
    } catch (err) {
      console.error('[ChatWidget] 메시지 전송 실패:', err);
      setInputText(text); // 실패 시 입력 복원
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [inputText, isSending]);

  useEffect(() => {
    if (isOpen && status === 'connected') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, status]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-[88px] right-4 sm:right-6 z-[200] w-[calc(100vw-32px)] max-w-[360px] flex flex-col rounded-2xl shadow-[0_8px_40px_rgba(26,115,232,0.18)] overflow-hidden border border-gray-200 dark:border-white/10 bg-white dark:bg-[#202124]"
            style={{ height: '520px', maxHeight: 'calc(100dvh - 120px)' }}
            id="claimworks-chat-window"
          >
            {/* 헤더 */}
            <div className="flex items-center gap-3 px-4 py-3.5 shrink-0 bg-white dark:bg-[#202124] border-b border-gray-100 dark:border-white/10 rounded-t-2xl relative z-10">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shrink-0 border border-gray-200 dark:border-zinc-700 overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)] relative">
                <img src="/logo.png" alt="보상스쿨" className="w-6 h-6 object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 dark:text-white font-extrabold text-[15px] leading-tight tracking-tight">보상스쿨 손해사정사</p>
                <p className="text-gray-500 dark:text-gray-400 text-[11px] mt-0.5 flex items-center gap-1.5 font-medium">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full shadow-sm ${status === 'connected' ? 'bg-[#03c75a]' : status === 'error' ? 'bg-red-500' : 'bg-amber-400 animate-pulse'}`} />
                  {status === 'connected' ? '온라인 (상담 가능)' : 
                   status === 'need_nickname' ? '준비 완료' :
                   status === 'error' ? '연결 오류' : '연결 중...'}
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center transition-colors border border-transparent hover:border-gray-200 dark:hover:border-white/10"
              >
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {status === 'need_nickname' ? (
              // ─── 닉네임 설정 화면 ───
              <div className="flex-1 flex flex-col items-center justify-center px-6 bg-gray-50 dark:bg-[#292a2d]">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center">환영합니다!</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-6 leading-relaxed">
                  원활한 상담을 위해<br/>대화방에서 사용할 닉네임을 설정해주세요.<br/>(최초 1회만 설정)
                </p>
                <form onSubmit={startNewSessionWithNickname} className="w-full">
                  <input
                    type="text"
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    placeholder="닉네임 입력 (예: 김보상)"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white mb-3 focus:ring-2 focus:ring-[#1a73e8] focus:border-transparent outline-none transition-all text-sm"
                    maxLength={15}
                    required
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!nicknameInput.trim()}
                    className="w-full bg-[#1a73e8] hover:bg-[#1557b0] disabled:bg-gray-300 text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-md disabled:shadow-none"
                  >
                    대화 시작하기
                  </button>
                </form>
              </div>
            ) : (
              // ─── 채팅 화면 ───
              <>
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50 dark:bg-[#292a2d]" style={{ scrollbarWidth: 'thin' }}>
                  {/* 자동 인사말 */}
                  <div className="flex items-end gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#1a73e8] flex items-center justify-center shrink-0">
                      <span className="text-white text-[9px] font-black">보상</span>
                    </div>
                    <div className="max-w-[75%]">
                      <div className="bg-white dark:bg-[#3c3d40] rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100 dark:border-white/5">
                        <p className="text-sm text-gray-800 dark:text-gray-100 leading-relaxed">{GREETING}</p>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 ml-1">보상스쿨</p>
                    </div>
                  </div>

                  {status === 'error' && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-xs text-red-600 dark:text-red-400 text-center">
                      ⚠️ 서버 연결에 실패했습니다.
                      <button onClick={checkExistingSession} className="ml-2 underline font-bold">다시 시도</button>
                    </div>
                  )}

                  {(status === 'checking' || status === 'connecting') && (
                    <div className="flex justify-center py-2">
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="w-2 h-2 rounded-full bg-[#1a73e8]/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map(msg => {
                    const isVisitor = msg.sender === 'visitor';
                    return (
                      <div key={msg.id} className={`flex items-end gap-2 ${isVisitor ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isVisitor && (
                          <div className="w-7 h-7 rounded-full bg-[#1a73e8] flex items-center justify-center shrink-0">
                            <span className="text-white text-[9px] font-black">보상</span>
                          </div>
                        )}
                        <div className={`max-w-[75%] flex flex-col ${isVisitor ? 'items-end' : 'items-start'}`}>
                          <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${isVisitor ? 'bg-[#1a73e8] text-white rounded-br-sm' : 'bg-white dark:bg-[#3c3d40] text-gray-800 dark:text-gray-100 rounded-bl-sm border border-gray-100 dark:border-white/5'}`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1 mx-1">{formatTime(msg.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="px-3 py-3 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#202124] shrink-0">
                  <div className="flex items-end gap-2 bg-gray-50 dark:bg-[#303134] rounded-xl border border-gray-200 dark:border-white/10 px-3 py-2 focus-within:border-[#1a73e8] transition-colors">
                    <textarea
                      ref={inputRef}
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="메시지를 입력하세요... (Enter로 전송)"
                      rows={1}
                      disabled={status === 'error' || status !== 'connected'}
                      className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 resize-none outline-none leading-relaxed max-h-24 overflow-y-auto disabled:opacity-50"
                      style={{ minHeight: '24px' }}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!inputText.trim() || isSending || status !== 'connected'}
                      className="w-8 h-8 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] disabled:bg-gray-200 dark:disabled:bg-zinc-700 flex items-center justify-center transition-all disabled:cursor-not-allowed"
                    >
                      {isSending ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-center text-[10px] text-gray-300 dark:text-gray-600 mt-1.5">
                    보상스쿨 — 금융감독원 BD00002425호
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D 스타일(원형) 플로팅 버튼 */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="chat-floating-btn"
            id="chat-floating-btn"
            onClick={handleOpen}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            className="fixed bottom-[88px] sm:bottom-6 right-4 sm:right-6 z-[200] w-14 h-14 rounded-full flex items-center justify-center transition-colors focus:outline-none focus:ring-4 focus:ring-blue-300 bg-white"
            style={{ 
              boxShadow: '0 8px 30px rgba(26,115,232,0.25), inset 0 -3px 6px rgba(0,0,0,0.06), inset 0 3px 6px rgba(255,255,255,1)',
              border: '1px solid rgba(229,231,235,0.5)'
            }}
            aria-label="보상 상담 채팅 열기"
          >
            <img key="chat" src="/logo.png" alt="보상스쿨 채팅" className="w-8 h-8 object-contain" />

            {/* 읽지 않은 메시지 뱃지 */}
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  key="unread-badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-[#ea4335] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </AnimatePresence>

            {/* 은은한 글로우(디머) 효과 */}
            {unreadCount === 0 && (
              <motion.div 
                className="absolute inset-0 rounded-full pointer-events-none"
                animate={{ 
                  boxShadow: [
                    '0 0 0px 0px rgba(26,115,232,0)', 
                    '0 0 25px 8px rgba(26,115,232,0.4)', 
                    '0 0 0px 0px rgba(26,115,232,0)'
                  ] 
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
              />
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
