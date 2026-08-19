'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
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

export default function ChatWidget() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isNicknameSet, setIsNicknameSet] = useState(false);
  
  // 접수 폼 상태
  const [nicknameInput, setNicknameInput] = useState('');
  const [accidentType, setAccidentType] = useState('자동차 사고');
  const [inquiryText, setInquiryText] = useState('');
  
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

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // 실시간 구독
  const subscribeToMessages = useCallback((sid: string) => {
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
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          if (!isOpen && newMsg.sender === 'admin') {
            setUnreadCount((prev) => prev + 1);
          } else if (isOpen && newMsg.sender === 'admin') {
            // 안 읽은 메시지 초기화
            supabase.from('chat_sessions').update({ unread_count: 0 }).eq('id', sid).then();
          }
          scrollToBottom();
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, [isOpen]);

  // 메시지 로드
  const loadMessages = useCallback(async (sid: string) => {
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
  }, [subscribeToMessages]);

  // 기존 세션 확인 및 새 세션 생성
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
  }, [isOpen, loadMessages]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setUnreadCount(0);
    if (sessionId) {
      supabase.from('chat_sessions').update({ unread_count: 0 }).eq('id', sessionId).then();
    }
    setTimeout(() => {
      inputRef.current?.focus();
      scrollToBottom();
    }, 100);
  }, [sessionId]);

  const handleClose = () => {
    setIsOpen(false);
    if (searchParams?.get('chat') === 'open') {
      router.replace(pathname, { scroll: false });
    }
  };

  const hasAutoOpened = useRef(false);

  useEffect(() => {
    if (searchParams?.get('chat') === 'open' && !hasAutoOpened.current) {
      hasAutoOpened.current = true;
      handleOpen();
    }
    checkExistingSession();
    
    const handleOpenChat = () => handleOpen();
    window.addEventListener('open-chat', handleOpenChat);
    
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      window.removeEventListener('open-chat', handleOpenChat);
    };
  }, [checkExistingSession, handleOpen, searchParams]);

  const handleSetNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicknameInput.trim() || !inquiryText.trim()) return;
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
      
      const formattedMessage = `[상담 접수 정보]\n이름: ${name}\n사고 종류: ${accidentType}\n문의 내용: ${inquiryText.trim()}`;
      
      const { data: insertedMsg, error: msgErr } = await supabase
        .from('chat_messages')
        .insert([{ session_id: data.id, sender: 'visitor', content: formattedMessage }])
        .select()
        .single();
        
      if (msgErr) console.error('Visitor msg error:', msgErr);
        
      const systemMessage = "접수가 완료되었습니다. 담당 손해사정사가 배정되어 내용을 검토 중이며 약 3~5분 내로 정확한 답변을 드릴 예정입니다.";
      const { data: sysMsg, error: sysErr } = await supabase
        .from('chat_messages')
        .insert([{ session_id: data.id, sender: 'system', content: systemMessage }])
        .select()
        .single();
        
      if (sysErr) console.error('System msg error:', sysErr);
        
      setStatus('connected');
      subscribeToMessages(data.id);
      
      const newMessages = [];
      if (insertedMsg) newMessages.push(insertedMsg);
      if (sysMsg) {
        newMessages.push(sysMsg);
      } else {
        newMessages.push({
          id: 'local-sys-' + crypto.randomUUID(),
          session_id: data.id,
          sender: 'system',
          content: systemMessage,
          created_at: new Date().toISOString()
        } as ChatMessage);
      }
      
      setMessages(newMessages);
      scrollToBottom();
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
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
          .insert([{ visitor_id: vid, status: '대기', visitor_nickname: localStorage.getItem('cw_nickname') || '익명' }])
          .select()
          .single();
          
        if (sessionError) throw sessionError;
        currentSid = sessionData.id;
        setSessionId(currentSid!);
        subscribeToMessages(currentSid!);
      }

      const { data: insertedMsg, error: msgError } = await supabase
        .from('chat_messages')
        .insert([{ session_id: currentSid, sender: 'visitor', content: sendText }])
        .select()
        .single();

      if (msgError) throw msgError;

      setMessages((prev) => {
        if (prev.some((m) => m.id === insertedMsg.id)) return prev;
        return [...prev, insertedMsg];
      });
      
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
  
  const hasAdminReplied = messages.some(m => m.sender === 'admin');

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.98, transition: { duration: 0.2 } }}
            className="fixed bottom-0 sm:bottom-[80px] right-0 sm:right-6 w-full sm:w-[390px] h-[100dvh] sm:h-[640px] max-h-[100dvh] sm:max-h-[85vh] bg-gray-50 dark:bg-[#121214] sm:rounded-none shadow-2xl z-[300] flex flex-col overflow-hidden border border-gray-300 dark:border-zinc-800"
          >
            {/* Header (Square Family Look) */}
            <div className="bg-white dark:bg-[#1a1a1c] border-b border-gray-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-none border border-gray-200 dark:border-zinc-700 bg-white overflow-hidden flex items-center justify-center p-1 shadow-sm">
                  <img src="/logo.png" alt="보상스쿨" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                    보상스쿨 빠른 접수처
                  </h3>
                  <p className="text-[11px] text-green-600 dark:text-green-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-none bg-green-500 animate-pulse inline-block"></span>
                    담당자 상시 대기중
                  </p>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                aria-label="닫기"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Compact Status Indicator (Header Attached, Ultra-Slim 26px) */}
            {isNicknameSet && (
              <div className="bg-blue-50/90 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/30 px-4 py-1.5 flex items-center justify-between text-[11px] shrink-0">
                <div className="flex items-center gap-1 font-bold text-blue-700 dark:text-blue-400">
                  <span className="w-1.5 h-1.5 rounded-none bg-blue-600 dark:bg-blue-400 inline-block"></span>
                  접수 완료
                </div>
                <div className="h-px bg-blue-200 dark:bg-blue-800/60 w-8"></div>
                <div className={`flex items-center gap-1 font-bold ${!hasAdminReplied ? 'text-blue-700 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-none ${!hasAdminReplied ? 'bg-amber-500 animate-pulse' : 'bg-gray-300 dark:bg-zinc-700'} inline-block`}></span>
                  검토 중
                </div>
                <div className="h-px bg-blue-200 dark:bg-blue-800/60 w-8"></div>
                <div className={`flex items-center gap-1 font-bold ${hasAdminReplied ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  <span className={`w-1.5 h-1.5 rounded-none ${hasAdminReplied ? 'bg-green-500' : 'bg-gray-300 dark:bg-zinc-700'} inline-block`}></span>
                  {hasAdminReplied ? '답변 완료' : '답변 대기'}
                </div>
              </div>
            )}

            {!isNicknameSet ? (
              <div className="flex-1 flex flex-col items-center justify-start overflow-y-auto p-6 bg-gray-50 dark:bg-[#121214]">
                <div className="w-14 h-14 rounded-none bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-zinc-700 shadow-sm flex items-center justify-center mb-4 mt-2 shrink-0">
                  <span className="text-[var(--google-blue)] font-black text-xl">상담</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1.5">실시간 빠른 상담 접수</h3>
                <p className="text-[12px] text-gray-500 dark:text-gray-400 text-center mb-5 break-keep">
                  신속하고 정확한 검토를 위해<br/>아래 3가지 항목을 작성해 주세요.
                </p>
                
                <form onSubmit={handleSetNickname} className="w-full max-w-[310px] space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">성함 / 닉네임</label>
                    <input
                      type="text"
                      value={nicknameInput}
                      onChange={e => setNicknameInput(e.target.value)}
                      placeholder="예: 홍길동"
                      className="w-full px-3.5 py-2.5 rounded-none border border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#1e1e22] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[var(--google-blue)] transition-all text-sm"
                      maxLength={10}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">사고 종류</label>
                    <div className="relative">
                      <select
                        value={accidentType}
                        onChange={e => setAccidentType(e.target.value)}
                        className="w-full pl-3.5 pr-9 py-2.5 appearance-none rounded-none border border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#1e1e22] text-gray-900 dark:text-white focus:outline-none focus:border-[var(--google-blue)] transition-all text-sm cursor-pointer"
                      >
                        <option value="자동차 사고">🚗 자동차 사고</option>
                        <option value="실손/질병/상해">🏥 실손/질병/상해</option>
                        <option value="배상책임/산재">⚖️ 배상책임/산재</option>
                        <option value="기타">기타</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">간단한 문의 내용</label>
                    <textarea
                      value={inquiryText}
                      onChange={e => setInquiryText(e.target.value)}
                      placeholder="예: 후방추돌 2주 진단 합의금 문의"
                      className="w-full px-3.5 py-2.5 rounded-none border border-gray-300 dark:border-zinc-700 bg-white dark:bg-[#1e1e22] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-[var(--google-blue)] transition-all text-sm resize-none"
                      rows={3}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!nicknameInput.trim() || !inquiryText.trim()}
                    className="w-full bg-[var(--google-blue)] hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-zinc-800 text-white font-bold py-3 rounded-none text-sm transition-colors shadow-sm disabled:shadow-none mt-1"
                  >
                    상담 접수 완료하기
                  </button>
                </form>
              </div>
            ) : (
              <>
                {/* Messages Area (Maximized Space) */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                  
                  {/* Status Error Display */}
                  {status === 'error' && (
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-none p-2.5 text-xs text-red-600 dark:text-red-400 text-center">
                      ⚠️ 서버 연결에 실패했습니다.
                      <button onClick={checkExistingSession} className="ml-2 underline font-bold">다시 시도</button>
                    </div>
                  )}
                  
                  {(status === 'checking' || status === 'connecting') && (
                    <div className="flex justify-center py-2">
                      <div className="flex gap-1.5">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="w-1.5 h-1.5 rounded-none bg-[var(--google-blue)]/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dynamic Messages (Unified Professional Theme) */}
                  {messages.map(msg => {
                    const isVisitor = msg.sender === 'visitor';
                    const isSystem = msg.sender === 'system';
                    
                    return (
                      <div key={msg.id} className={`flex items-end gap-2 ${isVisitor ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isVisitor && (
                          <div className="w-7 h-7 rounded-none bg-white dark:bg-[#1e1e22] border border-gray-200 dark:border-zinc-700 flex items-center justify-center shrink-0 overflow-hidden mb-4 shadow-sm p-0.5">
                            <img src="/logo.png" alt="보상스쿨" className="w-full h-full object-contain" />
                          </div>
                        )}
                        <div className={`max-w-[85%] flex flex-col ${isVisitor ? 'items-end' : 'items-start'}`}>
                          <div className={`rounded-none px-3.5 py-2.5 shadow-sm text-sm leading-relaxed whitespace-pre-wrap border ${
                            isVisitor 
                              ? 'bg-[var(--google-blue)] text-white border-[var(--google-blue)]' 
                              : isSystem
                                ? 'bg-white dark:bg-[#1a1a1c] text-gray-800 dark:text-gray-100 border-gray-200 dark:border-zinc-800'
                                : 'bg-white dark:bg-[#1e1e22] text-gray-800 dark:text-gray-100 border-gray-200 dark:border-zinc-700'
                          }`}>
                            <p>{msg.content}</p>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1 mx-0.5">{formatTime(msg.created_at)}</p>
                        </div>
                      </div>
                    );
                  })}

                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Action Chips (Always Pinned Above Input) */}
                <div className="px-3 pt-2 pb-1 bg-white dark:bg-[#1a1a1c] border-t border-gray-200 dark:border-zinc-800 shrink-0">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button 
                      onClick={() => router.push('/calculator')}
                      className="flex items-center justify-center gap-1.5 bg-gray-50 dark:bg-[#141416] hover:bg-blue-50 dark:hover:bg-blue-950/40 py-2 rounded-none border border-gray-200 dark:border-zinc-700 transition-colors group"
                    >
                      <span className="text-xs">🧮</span>
                      <span className="text-[11.5px] font-bold text-[var(--google-blue)] dark:text-blue-400">예상 합의금 계산기</span>
                    </button>
                    
                    <button 
                      onClick={() => router.push('/consultation')}
                      className="flex items-center justify-center gap-1.5 bg-gray-50 dark:bg-[#141416] hover:bg-gray-100 dark:hover:bg-zinc-800 py-2 rounded-none border border-gray-200 dark:border-zinc-700 transition-colors group"
                    >
                      <span className="text-xs">📞</span>
                      <span className="text-[11.5px] font-bold text-gray-700 dark:text-gray-300">예약상담 신청하기</span>
                    </button>
                  </div>
                </div>

                {/* Input Area (Square Family Look) */}
                <div className="p-3 bg-white dark:bg-[#1a1a1c] shrink-0 border-t border-gray-100 dark:border-zinc-900">
                  <div className="flex items-end gap-2 bg-gray-50 dark:bg-[#121214] rounded-none border border-gray-300 dark:border-zinc-700 px-3 py-2 focus-within:border-[var(--google-blue)] transition-all">
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
                      className={`w-8 h-8 rounded-none flex items-center justify-center shrink-0 transition-all ${
                        inputText.trim() && !isSending 
                          ? 'bg-[var(--google-blue)] text-white hover:bg-blue-700 shadow-sm' 
                          : 'bg-gray-200 dark:bg-zinc-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {isSending ? (
                        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-none animate-spin" />
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

      {/* Floating Button (Square Family Look with Glow) */}
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
            className="fixed bottom-[88px] sm:bottom-6 right-4 sm:right-6 z-[200] w-14 h-14 rounded-none flex items-center justify-center transition-colors focus:outline-none bg-white dark:bg-[#1a1a1c] border-2 border-[var(--google-blue)] shadow-xl"
            aria-label="실시간 채팅 열기"
          >
            <svg className="w-7 h-7 text-[var(--google-blue)]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.48 3 2 6.58 2 11C2 13.56 3.42 15.86 5.6 17.26C5.4 18.06 4.8 19.86 4.8 19.86C4.8 19.86 6.8 19.56 8.6 18.36C9.6 18.76 10.8 19 12 19C17.52 19 22 15.42 22 11C22 6.58 17.52 3 12 3Z"/>
            </svg>

            {/* Red Glow (Dimmer) */}
            <motion.div 
              className="absolute inset-0 rounded-none pointer-events-none"
              animate={{ 
                boxShadow: [
                  '0 0 0px 0px rgba(26,115,232,0)', 
                  '0 0 20px 4px rgba(26,115,232,0.35)', 
                  '0 0 0px 0px rgba(26,115,232,0)'
                ] 
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />

            {/* Unread Badge (Square Chip) */}
            <AnimatePresence>
              {unreadCount > 0 && (
                <motion.span
                  key="unread-badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1.5 -right-1.5 min-w-5 h-5 bg-red-600 text-white text-[10px] font-black rounded-none flex items-center justify-center px-1 shadow-md border border-white dark:border-zinc-900 z-10"
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
