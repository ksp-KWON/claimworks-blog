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

const GREETING = "안녕하세요! 보상스쿨 실시간 채팅상담입니다.\n궁금하신 점을 남겨주시면 담당자가 빠르고 친절하게 답변해 드립니다.";

export default function ChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const [status, setStatus] = useState<'idle' | 'checking' | 'connecting' | 'connected' | 'error'>('idle');
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const channelRef = useRef<any>(null);

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

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setSessionId(data.id);
        if (data.unread_count > 0 && !isOpen) setUnreadCount(data.unread_count);
        await loadMessages(data.id);
      } else {
        setStatus('connected');
      }
    } catch (err) {
      console.error('Session error:', err);
      setStatus('error');
    }
  }, [isOpen]);

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

  const subscribeToMessages = (sid: string) => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const channel = supabase
      .channel(`chat_${sid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${sid}` }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        setMessages((prev) => [...prev, newMsg]);
        if (!isOpen && newMsg.sender === 'admin') {
          setUnreadCount((prev) => prev + 1);
        } else if (isOpen && newMsg.sender === 'admin') {
          supabase.from('chat_sessions').update({ unread_count: 0 }).eq('id', sid).then();
        }
        scrollToBottom();
      }).subscribe();
    channelRef.current = channel;
  };

  useEffect(() => {
    checkExistingSession();
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [checkExistingSession]);

  const handleOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
    if (sessionId) supabase.from('chat_sessions').update({ unread_count: 0 }).eq('id', sessionId).then();
    setTimeout(() => { inputRef.current?.focus(); scrollToBottom(); }, 100);
  };

  const handleClose = () => setIsOpen(false);

  const scrollToBottom = () => {
    setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
  };

  const sendMessage = async (text: string = inputText) => {
    if (!text.trim() || isSending) return;
    const sendText = text.trim();
    setInputText('');
    setIsSending(true);

    try {
      let currentSid = sessionId;
      const vid = getVisitorId();
      if (!currentSid) {
        const { data: sessionData, error: sessionError } = await supabase
          .from('chat_sessions')
          .insert([{ visitor_id: vid, status: 'active', visitor_nickname: '방문자' }])
          .select().single();
        if (sessionError) throw sessionError;
        currentSid = sessionData.id;
        setSessionId(currentSid!);
        subscribeToMessages(currentSid!);
      }
      const { error: msgError } = await supabase
        .from('chat_messages')
        .insert([{ session_id: currentSid, sender: 'visitor', content: sendText }]);
      if (msgError) throw msgError;
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

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }}
            className="fixed bottom-0 sm:bottom-24 right-0 sm:right-6 w-full sm:w-[380px] h-[100dvh] sm:h-[650px] max-h-[100dvh] sm:max-h-[80vh] bg-[#F8F9FA] sm:rounded-2xl shadow-2xl z-[300] flex flex-col overflow-hidden font-sans border border-gray-100"
          >
            {/* Modern Premium Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-4 flex items-center justify-between shrink-0 shadow-sm relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-inner overflow-hidden shrink-0">
                  <img src="/logo.png" alt="보상스쿨" className="w-[85%] h-[85%] object-contain" />
                </div>
                <div className="flex flex-col">
                  <h3 className="font-bold text-white text-[16px] tracking-tight leading-tight">
                    보상스쿨 실시간 상담
                  </h3>
                  <div className="text-[12px] text-slate-300 flex items-center gap-1.5 mt-0.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    보상 전문가 대기 중
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <a href="tel:01092842955" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors" title="전화 상담">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </a>
                <button onClick={handleClose} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors" title="닫기">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#F8F9FA]">
              
              {/* Welcome Message */}
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-white overflow-hidden shrink-0 flex items-center justify-center border border-gray-100 shadow-sm">
                  <img src="/logo.png" alt="보상스쿨" className="w-[80%] h-[80%] object-contain" />
                </div>
                <div className="flex flex-col items-start max-w-[80%]">
                  <p className="text-[12px] text-gray-500 mb-1 ml-1 font-medium">보상스쿨</p>
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm border border-gray-100">
                    <p className="text-[14px] text-gray-800 leading-[1.6] whitespace-pre-wrap tracking-tight">
                      {GREETING}
                    </p>
                  </div>
                  <span className="text-[11px] text-gray-400 mt-1 ml-1 select-none">
                    {formatTime(new Date().toISOString())}
                  </span>
                </div>
              </div>

              {status === 'error' && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600 text-center mx-auto w-full max-w-[90%] shadow-sm">
                  서버 연결이 불안정합니다.
                  <button onClick={checkExistingSession} className="ml-2 underline font-bold">재연결</button>
                </div>
              )}

              {/* Dynamic Messages */}
              {messages.map((msg, index) => {
                const isVisitor = msg.sender === 'visitor';
                return (
                  <div key={msg.id} className={`flex items-start gap-3 ${isVisitor ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isVisitor && (
                      <div className="w-9 h-9 rounded-full bg-white overflow-hidden shrink-0 flex items-center justify-center border border-gray-100 shadow-sm">
                        <img src="/logo.png" alt="보상스쿨" className="w-[80%] h-[80%] object-contain" />
                      </div>
                    )}
                    <div className={`flex flex-col ${isVisitor ? 'items-end' : 'items-start'} max-w-[80%]`}>
                      {!isVisitor && <p className="text-[12px] text-gray-500 mb-1 ml-1 font-medium">보상스쿨</p>}
                      <div className={`px-4 py-2.5 shadow-sm border ${
                        isVisitor 
                          ? 'bg-[#FEE500] border-[#FEE500] text-[#111111] rounded-2xl rounded-tr-sm' 
                          : 'bg-white border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm'
                      }`}>
                        <p className="text-[14px] leading-[1.6] whitespace-pre-wrap tracking-tight">{msg.content}</p>
                      </div>
                      <span className="text-[11px] text-gray-400 mt-1 mx-1 select-none">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Modern Input Area */}
            <div className="bg-white p-4 shrink-0 border-t border-gray-100 flex items-end gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-400 transition-all">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="상담 내용을 입력해주세요..."
                  rows={1}
                  disabled={status === 'error'}
                  className="w-full bg-transparent text-[14px] text-gray-900 placeholder-gray-400 resize-none outline-none leading-[1.5] max-h-[120px] overflow-y-auto px-4 py-3 disabled:opacity-50"
                  style={{ minHeight: '48px' }}
                />
              </div>
              <button
                onClick={() => sendMessage(inputText)}
                disabled={!inputText.trim() || isSending || status === 'error'}
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  inputText.trim() && !isSending 
                    ? 'bg-slate-800 text-white hover:bg-slate-700 shadow-md transform hover:scale-105 active:scale-95' 
                    : 'bg-gray-100 text-gray-400'
                }`}
                aria-label="전송"
              >
                <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button (Kakao Identical Icon) */}
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
            className="fixed bottom-[88px] sm:bottom-8 right-5 sm:right-8 z-[200] w-[60px] h-[60px] rounded-full flex items-center justify-center transition-colors focus:outline-none bg-[#FEE500] shadow-2xl border border-black/5"
            aria-label="실시간 채팅 열기"
          >
            <div className="w-[32px] h-[32px] flex items-center justify-center text-[#371D1E] mt-0.5">
              <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full">
                <path d="M50,11C23.5,11,2,28.5,2,50c0,13.7,8.6,25.8,21.8,32.4c-0.8,3.1-3,11.2-3.1,11.7c-0.3,1.3,0.5,1.5,1.2,1c0.9-0.6,11.7-8.1,16.2-11.2c3.8,0.7,7.8,1.1,11.9,1.1c26.5,0,48-17.5,48-39S76.5,11,50,11z"/>
              </svg>
            </div>
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  key="unread-badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-md border-2 border-white"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
            {unreadCount === 0 && (
              <motion.div 
                className="absolute inset-0 rounded-full pointer-events-none"
                animate={{ boxShadow: ['0 0 0px 0px rgba(254,229,0,0)', '0 0 25px 8px rgba(254,229,0,0.5)', '0 0 0px 0px rgba(254,229,0,0)'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
