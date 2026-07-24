'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { ChatMessage } from '@/lib/supabase';

// ─── 익명 방문자 ID 관리 ──────────────────────────────────────────────
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

// ─── 유틸: 시간 포맷 ──────────────────────────────────────────────────
function formatTime(isoString: string) {
  const d = new Date(isoString);
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? '오후' : '오전';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${ampm} ${h}:${m < 10 ? '0' + m : m}`;
}

const GREETING = "안녕하세요! 보상스쿨 실시간 채팅상담입니다.\n궁금하신 점을 남겨주시면 담당자가 빠르고 친절하게 답변해 드립니다.";

const QUICK_ACTIONS = [
  { id: 'connect', label: '👨‍💼 실시간 상담원 연결' },
  { id: 'reserve', label: '📅 예약 상담 신청' }
];

const FAQS = [
  "교통사고 합의금은 어떻게 계산되나요?",
  "실손보험 청구 시 주의할 점이 있나요?",
  "근로중 다쳤는데 산재 처리가 유리한가요?",
];

export default function ChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isNicknameSet, setIsNicknameSet] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  
  // 'idle' | 'checking' | 'connecting' | 'connected' | 'error'
  const [status, setStatus] = useState<'idle' | 'checking' | 'connecting' | 'connected' | 'error'>('idle');
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const channelRef = useRef<any>(null);

  // 1. 닉네임 설정 및 확인
  useEffect(() => {
    const savedNickname = localStorage.getItem('cw_nickname');
    if (savedNickname) {
      setIsNicknameSet(true);
    }
  }, []);

  const handleSetNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicknameInput.trim()) return;
    const name = nicknameInput.trim();
    localStorage.setItem('cw_nickname', name);
    setIsNicknameSet(true);
    
    try {
      setStatus('connecting');
      const vid = getVisitorId();
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert([{ visitor_id: vid, status: '대기', visitor_nickname: name }])
        .select()
        .single();
        
      if (error) throw error;
      setSessionId(data.id);
      setStatus('connected');
      subscribeToMessages(data.id);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  // 2. 기존 세션 확인 및 새 세션 생성
  const checkExistingSession = useCallback(async () => {
    try {
      setStatus('checking');
      const vid = getVisitorId();
      
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('visitor_id', vid)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116: Not Found

      if (data) {
        setSessionId(data.id);
        if (data.unread_count > 0 && !isOpen) {
          setUnreadCount(data.unread_count);
        }
        await loadMessages(data.id);
      } else {
        setStatus('connected'); // 세션이 없으면 첫 메시지를 보낼 때 생성함
      }
    } catch (err) {
      console.error('Session error:', err);
      setStatus('error');
    }
  }, [isOpen]);

  // 2. 메시지 로드
  const loadMessages = async (sid: string) => {
    try {
      setStatus('connecting');
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sid)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      setStatus('connected');
      scrollToBottom();
      subscribeToMessages(sid);
    } catch (err) {
      console.error('Load messages error:', err);
      setStatus('error');
    }
  };

  // 3. 실시간 구독
  const subscribeToMessages = (sid: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`chat_${sid}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${sid}` },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMsg]);
          if (!isOpen && newMsg.sender === 'admin') {
            setUnreadCount((prev) => prev + 1);
          } else if (isOpen && newMsg.sender === 'admin') {
            // 안 읽은 메시지 초기화 로직 (여기서는 단순화)
            supabase.from('chat_sessions').update({ unread_count: 0 }).eq('id', sid).then();
          }
          scrollToBottom();
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  useEffect(() => {
    checkExistingSession();
    
    const handleOpenChat = () => handleOpen();
    window.addEventListener('open-chat', handleOpenChat);
    
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      window.removeEventListener('open-chat', handleOpenChat);
    };
  }, [checkExistingSession]);

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
    if (sessionId) {
      supabase.from('chat_sessions').update({ unread_count: 0 }).eq('id', sessionId).then();
    }
    setTimeout(() => {
      inputRef.current?.focus();
      scrollToBottom();
    }, 100);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // 메시지 전송
  const sendMessage = async (text: string = inputText) => {
    if (!text.trim() || isSending) return;
    const sendText = text.trim();
    setInputText('');
    setIsSending(true);

    try {
      let currentSid = sessionId;
      const vid = getVisitorId();

      // 세션이 없으면 먼저 생성
      if (!currentSid) {
        const { data: sessionData, error: sessionError } = await supabase
          .from('chat_sessions')
          .insert([{ visitor_id: vid, status: '대기', visitor_nickname: localStorage.getItem('cw_nickname') || '익명' }])
          .select()
          .single();
          
        if (sessionError) throw sessionError;
        currentSid = sessionData.id;
        setSessionId(currentSid!);
        subscribeToMessages(currentSid!);
      }

      // 메시지 저장
      const { error: msgError } = await supabase
        .from('chat_messages')
        .insert([{ session_id: currentSid, sender: 'visitor', content: sendText }]);

      if (msgError) throw msgError;
      
      // last_message_at 업데이트
      await supabase.from('chat_sessions').update({ last_message_at: new Date().toISOString() }).eq('id', currentSid);

      scrollToBottom();
    } catch (err) {
      console.error('Send error:', err);
      alert('메시지 전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
      setInputText(sendText); // 복구
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickAction = (actionId: string) => {
    if (actionId === 'reserve') {
      window.location.href = '/consultation';
    } else {
      sendMessage('상담원과 실시간 연결을 요청합니다.');
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }}
            className="fixed bottom-0 sm:bottom-[90px] right-0 sm:right-6 w-full sm:w-[380px] h-[100dvh] sm:h-[600px] max-h-[100dvh] sm:max-h-[85vh] bg-gray-50 dark:bg-[#111111] sm:rounded-2xl shadow-2xl z-[300] flex flex-col overflow-hidden border border-gray-200 dark:border-white/10"
          >
            {/* Header */}
            <div className="bg-white dark:bg-[#202124] border-b border-gray-100 dark:border-white/10 px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/10 bg-white overflow-hidden shadow-sm flex items-center justify-center">
                  <img src="/logo.png" alt="보상스쿨" className="w-full h-full object-contain p-1" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                    보상스쿨
                  </h3>
                  <p className="text-[11px] text-green-500 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    온라인 · 실시간 답변
                  </p>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                aria-label="닫기"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!isNicknameSet ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-[#111111]">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6">
                  <span className="text-[var(--google-blue)] font-black text-2xl">상담</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">실시간 채팅 상담</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">
                  원활한 상담을 위해<br/>닉네임을 먼저 입력해주세요.
                </p>
                <form onSubmit={handleSetNickname} className="w-full max-w-[240px] space-y-3">
                  <input
                    type="text"
                    value={nicknameInput}
                    onChange={e => setNicknameInput(e.target.value)}
                    placeholder="사용하실 닉네임"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#303134] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--google-blue)] transition-all"
                    maxLength={10}
                    required
                  />
                  <button
                    type="submit"
                    disabled={!nicknameInput.trim()}
                    className="w-full bg-[var(--google-blue)] hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-md disabled:shadow-none"
                  >
                    대화 시작하기
                  </button>
                </form>
              </div>
            ) : (
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  
                  {/* Default Welcome Message */}
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-[var(--google-blue)] flex items-center justify-center shrink-0 mt-1 shadow-sm">
                      <span className="text-white text-[11px] font-black">보상</span>
                    </div>
                    <div className="max-w-[85%]">
                      <div className="bg-white dark:bg-[#2a2b2e] border border-gray-100 dark:border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                        <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed break-keep">
                          {GREETING}
                        </p>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 mx-1">보상스쿨</p>
                    </div>
                  </div>

                  {/* Status Display */}
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
                          <div key={i} className="w-2 h-2 rounded-full bg-[var(--google-blue)]/40 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dynamic Messages */}
                  {messages.map(msg => {
                    const isVisitor = msg.sender === 'visitor';
                    return (
                      <div key={msg.id} className={`flex items-end gap-2 ${isVisitor ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isVisitor && (
                          <div className="w-8 h-8 rounded-full bg-[var(--google-blue)] flex items-center justify-center shrink-0 overflow-hidden mb-5">
                            <span className="text-white text-[11px] font-black">보상</span>
                          </div>
                        )}
                        <div className={`max-w-[75%] flex flex-col ${isVisitor ? 'items-end' : 'items-start'}`}>
                          <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                            isVisitor 
                              ? 'bg-[var(--google-blue)] text-white rounded-br-sm' 
                              : 'bg-white dark:bg-[#2a2b2e] text-gray-800 dark:text-gray-200 rounded-bl-sm border border-gray-100 dark:border-white/5'
                          }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1 mx-1">{formatTime(msg.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#202124] shrink-0">
                  <div className="flex items-end gap-2 bg-gray-50 dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-white/10 px-3 py-2.5 focus-within:border-[var(--google-blue)] focus-within:ring-1 focus-within:ring-[var(--google-blue)] transition-all">
                    <textarea
                      ref={inputRef}
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="보상스쿨 챗봇에게 무엇이든 물어보세요..."
                      rows={1}
                      disabled={status === 'error'}
                      className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none outline-none leading-relaxed max-h-24 overflow-y-auto disabled:opacity-50 py-1"
                      style={{ minHeight: '28px' }}
                    />
                    <button
                      onClick={() => sendMessage(inputText)}
                      disabled={!inputText.trim() || isSending || status === 'error'}
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        inputText.trim() && !isSending 
                          ? 'bg-[var(--google-blue)] text-white hover:bg-blue-700 shadow-md' 
                          : 'bg-gray-200 dark:bg-zinc-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {isSending ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="chat-floating-btn"
            id="chat-floating-btn"
            onClick={handleOpen}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-[88px] sm:bottom-6 right-4 sm:right-6 z-[200] w-14 h-14 rounded-full flex items-center justify-center transition-colors focus:outline-none bg-blue-50 focus:ring-4 focus:ring-blue-300"
            style={{ 
              boxShadow: '0 8px 30px rgba(26,115,232,0.25), inset 0 -3px 6px rgba(0,0,0,0.06), inset 0 3px 6px rgba(255,255,255,1)',
              border: '1px solid rgba(229,231,235,0.5)'
            }}
            aria-label="실시간 채팅 열기"
          >
            <svg className="w-7 h-7 text-[#1a73e8]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.48 3 2 6.58 2 11C2 13.56 3.42 15.86 5.6 17.26C5.4 18.06 4.8 19.86 4.8 19.86C4.8 19.86 6.8 19.56 8.6 18.36C9.6 18.76 10.8 19 12 19C17.52 19 22 15.42 22 11C22 6.58 17.52 3 12 3Z"/>
            </svg>

            {/* Red Glow (Dimmer) */}
            <motion.div 
              className="absolute inset-0 rounded-full pointer-events-none"
              animate={{ 
                boxShadow: [
                  '0 0 0px 0px rgba(239,68,68,0)', 
                  '0 0 25px 8px rgba(239,68,68,0.4)', 
                  '0 0 0px 0px rgba(239,68,68,0)'
                ] 
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />

            {/* Unread Badge */}
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  key="unread-badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md border-2 border-white z-10"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
