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
      
      const { data: insertedMsg } = await supabase
        .from('chat_messages')
        .insert([{ session_id: data.id, sender: 'visitor', content: formattedMessage }])
        .select()
        .single();
        
      const systemMessage = "접수가 완료되었습니다! 담당자가 배정되어 내용을 검토 중이며, 약 5~10분 내로 정확한 답변을 드릴 예정입니다.";
      const { data: sysMsg } = await supabase
        .from('chat_messages')
        .insert([{ session_id: data.id, sender: 'system', content: systemMessage }])
        .select()
        .single();
        
      setStatus('connected');
      subscribeToMessages(data.id);
      
      if (insertedMsg && sysMsg) {
        setMessages([insertedMsg, sysMsg]);
      }
      scrollToBottom();
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
    if (searchParams?.get('chat') === 'open') {
      router.replace(pathname, { scroll: false });
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
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
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }}
            className="fixed bottom-0 sm:bottom-[90px] right-0 sm:right-6 w-full sm:w-[380px] h-[100dvh] sm:h-[650px] max-h-[100dvh] sm:max-h-[85vh] bg-gray-50 dark:bg-[#111111] sm:rounded-2xl shadow-2xl z-[300] flex flex-col overflow-hidden border border-gray-200 dark:border-white/10"
          >
            {/* Header */}
            <div className="bg-white dark:bg-[#202124] border-b border-gray-100 dark:border-white/10 px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-gray-200 dark:border-white/10 bg-white overflow-hidden shadow-sm flex items-center justify-center">
                  <img src="/logo.png" alt="보상스쿨" className="w-full h-full object-contain p-1" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                    보상스쿨 빠른 접수처
                  </h3>
                  <p className="text-[11px] text-green-500 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    담당자 상시 대기중
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
              <div className="flex-1 flex flex-col items-center justify-start overflow-y-auto p-6 bg-gray-50 dark:bg-[#111111]">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 mt-2 shrink-0">
                  <span className="text-[var(--google-blue)] font-black text-2xl">상담</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">실시간 빠른 상담 접수</h3>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 text-center mb-6 break-keep">
                  신속하고 정확한 상담을 위해<br/>아래 3가지 항목만 작성해주세요.
                </p>
                
                <form onSubmit={handleSetNickname} className="w-full max-w-[300px] space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">성함 / 닉네임</label>
                    <input
                      type="text"
                      value={nicknameInput}
                      onChange={e => setNicknameInput(e.target.value)}
                      placeholder="예: 홍길동"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#303134] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--google-blue)] transition-all text-sm"
                      maxLength={10}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">사고 종류</label>
                    <div className="relative">
                      <select
                        value={accidentType}
                        onChange={e => setAccidentType(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 appearance-none rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#303134] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--google-blue)] transition-all text-sm cursor-pointer"
                      >
                        <option value="자동차 사고">🚗 자동차 사고</option>
                        <option value="실손/질병/상해">🏥 실손/질병/상해</option>
                        <option value="배상책임/산재">⚖️ 배상책임/산재</option>
                        <option value="기타">기타</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">간단한 문의 내용</label>
                    <textarea
                      value={inquiryText}
                      onChange={e => setInquiryText(e.target.value)}
                      placeholder="예: 후방추돌 2주 진단 합의금 문의"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#303134] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--google-blue)] transition-all text-sm resize-none"
                      rows={3}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!nicknameInput.trim() || !inquiryText.trim()}
                    className="w-full bg-[var(--google-blue)] hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl text-sm transition-colors shadow-md disabled:shadow-none mt-2"
                  >
                    상담 접수 완료하기
                  </button>
                </form>
              </div>
            ) : (
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  
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

                  {/* Status Bar for Waiting */}
                  {messages.length > 0 && !hasAdminReplied && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl px-4 py-3 flex items-center justify-between text-xs mb-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                      <div className="flex flex-col items-center flex-1">
                        <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold mb-1 text-[10px]">✓</div>
                        <span className="text-blue-700 dark:text-blue-400 font-bold">접수 완료</span>
                      </div>
                      <div className="h-px bg-blue-200 dark:bg-blue-800/50 flex-1 mx-1"></div>
                      <div className="flex flex-col items-center flex-1">
                        <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold mb-1 text-[10px] animate-pulse">⏳</div>
                        <span className="text-blue-700 dark:text-blue-400 font-bold">검토 중</span>
                      </div>
                      <div className="h-px bg-blue-200 dark:bg-blue-800/50 flex-1 mx-1"></div>
                      <div className="flex flex-col items-center flex-1">
                        <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center font-bold mb-1 text-[10px]">💬</div>
                        <span className="text-gray-500 dark:text-gray-400 font-bold text-center">답변 대기</span>
                      </div>
                    </div>
                  )}

                  {/* Dynamic Messages */}
                  {messages.map(msg => {
                    const isVisitor = msg.sender === 'visitor';
                    const isSystem = msg.sender === 'system';
                    
                    return (
                      <div key={msg.id} className={`flex items-end gap-2 ${isVisitor ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isVisitor && (
                          <div className="w-8 h-8 rounded-full bg-white border border-gray-200 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden mb-5 shadow-sm p-1">
                            <img src="/logo.png" alt="보상스쿨" className="w-full h-full object-contain" />
                          </div>
                        )}
                        <div className={`max-w-[85%] flex flex-col ${isVisitor ? 'items-end' : 'items-start'}`}>
                          <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                            isVisitor 
                              ? 'bg-[var(--google-blue)] text-white rounded-br-sm' 
                              : isSystem
                                ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-900 dark:text-orange-100 rounded-bl-sm border border-orange-200 dark:border-orange-800/30'
                                : 'bg-white dark:bg-[#2a2b2e] text-gray-800 dark:text-gray-200 rounded-bl-sm border border-gray-100 dark:border-white/5'
                          }`}>
                            {isSystem && <div className="text-[11px] font-bold text-orange-600 dark:text-orange-400 mb-1">시스템 안내</div>}
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          {!isSystem && <p className="text-[10px] text-gray-400 mt-1 mx-1">{formatTime(msg.created_at)}</p>}
                        </div>
                      </div>
                    );
                  })}

                  {/* Two-Track Action Cards (Shown during wait) */}
                  {messages.length > 0 && !hasAdminReplied && (
                    <div className="mt-6 mb-2 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="bg-white dark:bg-[#2a2b2e] border border-blue-100 dark:border-blue-800/30 p-4 rounded-2xl shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[var(--google-blue)]" />
                        <h4 className="text-[13px] font-bold text-gray-900 dark:text-white mb-3">
                          담당자 배정 및 검토에 시간이 소요됩니다.<br/>아래 메뉴를 이용해 보세요!
                        </h4>
                        <div className="space-y-2.5">
                          <button 
                            onClick={() => window.location.href='/calculator/auto'}
                            className="w-full text-left bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 p-3.5 rounded-xl transition-colors border border-blue-100 dark:border-blue-800/50 flex items-center gap-3 group"
                          >
                            <span className="text-2xl group-hover:scale-110 transition-transform">🎁</span>
                            <div>
                              <div className="text-[13px] font-bold text-[var(--google-blue)] dark:text-blue-400">내 진짜 보상금 시뮬레이션 해보기</div>
                              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">기다리시는 동안 정밀 계산기를 이용해보세요</div>
                            </div>
                          </button>
                          
                          <button 
                            onClick={() => window.location.href='/consultation'}
                            className="w-full text-left bg-gray-50 dark:bg-[#303134] hover:bg-gray-100 dark:hover:bg-[#3c3d40] p-3.5 rounded-xl transition-colors border border-gray-200 dark:border-white/10 flex items-center gap-3 group"
                          >
                            <span className="text-2xl group-hover:scale-110 transition-transform">📅</span>
                            <div>
                              <div className="text-[13px] font-bold text-gray-700 dark:text-gray-300">기다리기 힘드신가요? 예약상담 신청하기</div>
                              <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">접수된 내용은 저장되며 이탈 없이 전화로 답변해드립니다</div>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

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
