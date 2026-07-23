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
  return `${ampm} ${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m}`;
}

const GREETING = "안녕하세요! 보상스쿨의 친절한 정보 가이드입니다.\n궁금하신 내용을 질문해주시면 자세히 답변해 드릴게요!";

export default function ChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // 기능 상태
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
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
        setStatus('connected');
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
    setIsSearching(false);
    setIsMenuOpen(false);
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
          .insert([{ visitor_id: vid, status: 'active', visitor_nickname: '방문자' }])
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
      setInputText(sendText);
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

  // 표시할 메시지 필터링
  const displayMessages = isSearching && searchQuery.trim() !== ''
    ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }}
            className="fixed bottom-0 sm:bottom-[90px] right-0 sm:right-6 w-full sm:w-[380px] h-[100dvh] sm:h-[620px] max-h-[100dvh] sm:max-h-[85vh] bg-[#BACEE0] sm:rounded-md shadow-2xl z-[300] flex flex-col overflow-hidden border border-gray-300 font-sans"
          >
            {/* Windows Title Bar (Minimize, Maximize, Close) */}
            <div className="bg-[#BACEE0] flex justify-end items-center px-1 py-1 h-[28px] shrink-0 border-b border-black/5">
              <button onClick={handleClose} className="w-8 h-full flex items-center justify-center hover:bg-black/10 transition-colors text-gray-700" title="최소화">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16"><path d="M2 7.5h12v1H2z"/></svg>
              </button>
              <button className="w-8 h-full flex items-center justify-center hover:bg-black/10 transition-colors text-gray-700" title="최대화">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 16 16"><rect x="2.5" y="2.5" width="11" height="11" strokeWidth="1"/></svg>
              </button>
              <button onClick={handleClose} className="w-8 h-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors text-gray-700" title="닫기">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 16 16"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M3 3l10 10M13 3L3 13"/></svg>
              </button>
            </div>

            {/* Header - Kakao Profile & Tools */}
            <div className="bg-[#BACEE0] px-4 py-3 flex items-center justify-between shrink-0 relative">
              <div className="flex items-center gap-3">
                <div className="w-[42px] h-[42px] rounded-[14px] bg-white overflow-hidden shadow-sm flex items-center justify-center shrink-0">
                  <img src="/logo.png" alt="보상스쿨" className="w-full h-full object-contain p-1" />
                </div>
                <div>
                  <h3 className="font-bold text-[#333333] text-[15px] flex items-center gap-1.5 leading-tight">
                    보상스쿨
                  </h3>
                  <div className="text-[12px] text-gray-600 flex items-center gap-1 mt-0.5">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                    2
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3.5 text-gray-700">
                {/* Search Icon */}
                <button aria-label="검색" onClick={() => setIsSearching(!isSearching)}>
                  <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </button>
                {/* Phone Icon -> Call */}
                <a href="tel:01092842955" aria-label="전화 연결" title="전화 연결" className="hover:text-black">
                  <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </a>
                {/* SMS Icon -> Send SMS */}
                <a href="sms:01092842955" aria-label="문자 메시지" title="문자 메시지" className="hover:text-black">
                  <svg className="w-[20px] h-[20px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                </a>
                {/* Menu / Hamburger */}
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="메뉴"
                  className="hover:text-black"
                >
                  <svg className="w-[22px] h-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>

              {/* Hamburger Menu Popup */}
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute top-14 right-4 bg-white shadow-lg rounded-md border border-gray-200 py-1 w-40 z-50"
                  >
                    <button 
                      onClick={() => {
                        sendMessage("예약 상담 신청합니다.");
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-[13px] text-gray-800 hover:bg-gray-100 transition-colors"
                    >
                      예약 상담 신청
                    </button>
                    <a 
                      href="tel:01092842955"
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full text-left px-4 py-2 text-[13px] text-gray-800 hover:bg-gray-100 transition-colors"
                    >
                      전화 상담 연결
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Search Bar (Overlay) */}
            <AnimatePresence>
              {isSearching && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-white border-b border-gray-200 px-3 py-2 flex items-center gap-2 overflow-hidden shrink-0"
                >
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="채팅방 검색" 
                    className="flex-1 bg-gray-100 rounded-sm px-2 py-1 text-[13px] outline-none"
                    autoFocus
                  />
                  <button onClick={() => { setIsSearching(false); setSearchQuery(''); }} className="text-[12px] text-gray-500 hover:text-black">
                    취소
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" onClick={() => setIsMenuOpen(false)}>
              
              {/* Default Welcome Message */}
              {!isSearching && (
                <div className="flex items-start gap-2">
                  <div className="w-[40px] h-[40px] rounded-[14px] bg-white overflow-hidden shrink-0 flex items-center justify-center shadow-sm border border-black/5">
                    <img src="/logo.png" alt="보상스쿨" className="w-full h-full object-contain p-1" />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-[12px] text-gray-700 mb-1 ml-1 font-medium">보상스쿨</p>
                    <div className="flex items-end gap-1.5">
                      <div className="bg-white rounded-lg rounded-tl-sm px-3 py-2 shadow-sm max-w-[240px] border border-black/5">
                        <p className="text-[13px] text-[#111111] leading-[1.5] break-keep whitespace-pre-wrap font-medium">
                          {GREETING}
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-500 mb-0.5 shrink-0 select-none">
                        {formatTime(new Date().toISOString())}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Display */}
              {status === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs text-red-600 text-center mx-auto max-w-fit">
                  ⚠️ 서버 연결에 실패했습니다.
                  <button onClick={checkExistingSession} className="ml-2 underline font-bold">다시 시도</button>
                </div>
              )}

              {/* Dynamic Messages */}
              {displayMessages.map((msg, index) => {
                const isVisitor = msg.sender === 'visitor';
                const showTime = true; // In a real app, logic to group times could be here.
                return (
                  <div key={msg.id} className={`flex items-start gap-2 ${isVisitor ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isVisitor && (
                      <div className="w-[40px] h-[40px] rounded-[14px] bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-sm border border-black/5">
                        <img src="/logo.png" alt="보상스쿨" className="w-full h-full object-contain p-1" />
                      </div>
                    )}
                    <div className={`flex flex-col ${isVisitor ? 'items-end' : 'items-start'}`}>
                      {!isVisitor && <p className="text-[12px] text-gray-700 mb-1 ml-1 font-medium">보상스쿨</p>}
                      <div className={`flex items-end gap-1.5 ${isVisitor ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`px-3 py-2 shadow-sm max-w-[240px] border border-black/5 ${
                          isVisitor 
                            ? 'bg-[#FEE500] text-[#333333] rounded-lg rounded-tr-sm' 
                            : 'bg-white text-[#111111] rounded-lg rounded-tl-sm'
                        }`}>
                          <p className="text-[13px] leading-[1.5] whitespace-pre-wrap font-medium">{msg.content}</p>
                        </div>
                        {showTime && (
                          <span className="text-[10px] text-gray-500 mb-0.5 shrink-0 select-none">
                            {formatTime(msg.created_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white p-3 shrink-0 flex flex-col gap-2">
              <div className="flex gap-2 items-end h-full">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="메시지 입력"
                  rows={2}
                  disabled={status === 'error'}
                  className="flex-1 bg-transparent text-[14px] text-gray-900 placeholder-gray-400 resize-none outline-none leading-[1.4] max-h-[80px] overflow-y-auto disabled:opacity-50"
                  style={{ minHeight: '44px' }}
                />
                <button
                  onClick={() => sendMessage(inputText)}
                  disabled={!inputText.trim() || isSending || status === 'error'}
                  className={`px-4 py-[6px] rounded-[3px] text-[12px] transition-colors border shadow-sm font-medium h-[32px] mb-1 shrink-0 ${
                    inputText.trim() && !isSending 
                      ? 'bg-[#FEE500] border-[#FEE500] text-[#333333] hover:bg-[#F9E000]' 
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
            {/* Kakao-style Speech Bubble Icon (Solid perfect vector) */}
            <div className="w-[26px] h-[26px] flex items-center justify-center text-[#371D1E] mr-0.5 mt-0.5">
              <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
                <path d="M50,11C23.5,11,2,28.5,2,50c0,13.7,8.6,25.8,21.8,32.4c-0.8,3.1-3,11.2-3.1,11.7c-0.3,1.3,0.5,1.5,1.2,1c0.9-0.6,11.7-8.1,16.2-11.2c3.8,0.7,7.8,1.1,11.9,1.1c26.5,0,48-17.5,48-39S76.5,11,50,11z"/>
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
