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

const GREETING = "안녕하세요! 보상스쿨의 친절한 정보 가이드입니다. 궁금하신 내용을 질문해주시면 자세히 답변해 드릴게요!";

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
  
  // 'idle' | 'checking' | 'connecting' | 'connected' | 'error'
  const [status, setStatus] = useState<'idle' | 'checking' | 'connecting' | 'connected' | 'error'>('idle');
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const channelRef = useRef<any>(null);

  // 1. 기존 세션 확인 및 새 세션 생성
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
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
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
          .insert([{ visitor_id: vid, status: 'active' }])
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

  const handleConnectAgent = () => {
    sendMessage('상담원과 실시간 연결을 요청합니다.');
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }}
            className="fixed bottom-0 sm:bottom-[90px] right-0 sm:right-6 w-full sm:w-[380px] h-[100dvh] sm:h-[600px] max-h-[100dvh] sm:max-h-[85vh] bg-[#BACEE0] sm:rounded-lg shadow-2xl z-[300] flex flex-col overflow-hidden border border-[#BACEE0]"
          >
            {/* Header - Kakao Style */}
            <div className="bg-[#BACEE0] px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[14px] bg-white overflow-hidden shadow-sm flex items-center justify-center">
                  <img src="/logo.png" alt="보상스쿨" className="w-full h-full object-contain p-1" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-[15px] flex items-center gap-1.5 leading-tight">
                    보상스쿨
                  </h3>
                  <p className="text-[12px] text-gray-600 flex items-center gap-1 mt-0.5">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                    2
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-gray-600">
                {/* Search Icon */}
                <button aria-label="검색">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </button>
                {/* Phone Icon -> Connect to agent */}
                <button aria-label="실시간 상담원 연결" onClick={handleConnectAgent} title="실시간 상담원 연결">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </button>
                {/* Video Icon */}
                <button aria-label="화상">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                </button>
                {/* Menu / Close */}
                <button 
                  onClick={handleClose}
                  aria-label="닫기"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* Default Welcome Message */}
              <div className="flex items-start gap-2">
                <div className="w-9 h-9 rounded-[12px] bg-white overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                  <img src="/logo.png" alt="보상스쿨" className="w-full h-full object-contain p-1" />
                </div>
                <div>
                  <p className="text-[12px] text-gray-700 mb-1 ml-1">보상스쿨</p>
                  <div className="bg-white rounded-lg rounded-tl-none px-3 py-2 shadow-sm max-w-[240px]">
                    <p className="text-[13px] text-gray-800 leading-[1.4] break-keep whitespace-pre-wrap">
                      {GREETING}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Display */}
              {status === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-600 text-center mx-auto max-w-fit">
                  ⚠️ 서버 연결에 실패했습니다.
                  <button onClick={checkExistingSession} className="ml-2 underline font-bold">다시 시도</button>
                </div>
              )}

              {/* Dynamic Messages */}
              {messages.map(msg => {
                const isVisitor = msg.sender === 'visitor';
                return (
                  <div key={msg.id} className={`flex items-start gap-2 ${isVisitor ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isVisitor && (
                      <div className="w-9 h-9 rounded-[12px] bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                        <img src="/logo.png" alt="보상스쿨" className="w-full h-full object-contain p-1" />
                      </div>
                    )}
                    <div className={`flex flex-col ${isVisitor ? 'items-end' : 'items-start'}`}>
                      {!isVisitor && <p className="text-[12px] text-gray-700 mb-1 ml-1">보상스쿨</p>}
                      <div className="flex items-end gap-1.5">
                        {isVisitor && <span className="text-[10px] text-gray-500 mb-0.5">{formatTime(msg.created_at)}</span>}
                        <div className={`px-3 py-2 shadow-sm max-w-[240px] ${
                          isVisitor 
                            ? 'bg-[#FEE500] text-[#371D1E] rounded-lg rounded-tr-none' 
                            : 'bg-white text-gray-800 rounded-lg rounded-tl-none'
                        }`}>
                          <p className="text-[13px] leading-[1.4] whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        {!isVisitor && <span className="text-[10px] text-gray-500 mb-0.5">{formatTime(msg.created_at)}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Quick Actions (Kakao style list) */}
              {messages.length === 0 && (
                <div className="flex items-start gap-2 mt-2">
                  <div className="w-9 h-9 shrink-0"></div>
                  <div className="bg-white rounded-lg px-0 py-2 shadow-sm w-[240px]">
                    <div className="px-3 pb-2 border-b border-gray-100">
                      <p className="text-[13px] text-gray-800 font-bold">자주 묻는 질문</p>
                    </div>
                    <div className="flex flex-col divide-y divide-gray-50">
                      {FAQS.map((faq, idx) => (
                        <button
                          key={idx}
                          onClick={() => sendMessage(faq)}
                          className="w-full text-left px-3 py-2 text-[13px] text-[#371D1E] hover:bg-gray-50 transition-colors"
                        >
                          {faq}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white p-3 shrink-0 flex flex-col gap-2">
              <div className="flex gap-2 items-end">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="메시지 입력"
                  rows={2}
                  disabled={status === 'error'}
                  className="flex-1 bg-transparent text-[13px] text-gray-900 placeholder-gray-400 resize-none outline-none leading-[1.4] max-h-[80px] overflow-y-auto disabled:opacity-50"
                />
                <button
                  onClick={() => sendMessage(inputText)}
                  disabled={!inputText.trim() || isSending || status === 'error'}
                  className={`px-4 py-1.5 rounded-sm text-[12px] transition-colors border ${
                    inputText.trim() && !isSending 
                      ? 'bg-[#FEE500] border-[#FEE500] text-[#371D1E] hover:bg-[#fada0a]' 
                      : 'bg-white border-gray-200 text-gray-400'
                  }`}
                >
                  전송
                </button>
              </div>
            </div>
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
            className="fixed bottom-[88px] sm:bottom-6 right-4 sm:right-6 z-[200] w-14 h-14 rounded-full flex items-center justify-center transition-colors focus:outline-none bg-[#FEE500] shadow-xl"
            style={{ 
              boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.06)'
            }}
            aria-label="실시간 채팅 열기"
          >
            <div className="w-7 h-7 flex items-center justify-center text-[#371D1E]">
              {/* Kakao-style Speech Bubble Icon */}
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M12 4C6.48 4 2 7.58 2 12c0 2.45 1.25 4.63 3.23 6.14-.24 1.16-.88 2.8-.93 2.92-.09.22.04.44.27.4.26-.05 1.25-.26 2.97-1.04C8.95 20.8 10.43 21 12 21c5.52 21 10-3.58 10-8s-4.48-8-10-8z"/>
              </svg>
            </div>

            {/* Unread Badge */}
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  key="unread-badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md border-2 border-white"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Red Dimmer / Pulsing Glow */}
            {unreadCount === 0 && (
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
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
