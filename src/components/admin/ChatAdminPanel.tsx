'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ChatSession, ChatMessage } from '@/lib/supabase';
import ConsultationDetailCard from './ConsultationDetailCard';

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
  
  // Memo & Form State
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSavingMemo, setIsSavingMemo] = useState(false);
  const [formData, setFormData] = useState({
    category: '근로재해',
    diagnosis: '',
    date: '',
    location: '',
    details: '',
    inquiries: '',
    insurances: [] as any[],
    treatmentHistory: '',
    hospitalization: false,
    outpatient: false,
    surgery: false,
    test: false,
  });

  // Filters & Sorting State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'전체' | '대기' | '진행중' | '보류' | '완료' | '차단'>('전체');
  const [sortBy, setSortBy] = useState<'최근 대화순' | '오래된 대화순'>('최근 대화순');
  const [readFilter, setReadFilter] = useState<'전체' | '읽음' | '안읽음'>('전체');
  
  // Menu State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showMemoModal, setShowMemoModal] = useState(false);

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

  useEffect(() => {
    const pendingId = sessionStorage.getItem('pending_select_id');
    if (pendingId) {
      setSelectedId(pendingId);
      sessionStorage.removeItem('pending_select_id');
    }
  }, []);

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
      const memo = activeSession.customer_memo || '';
      try {
        if (memo.trim().startsWith('{') && memo.includes('"category"')) {
          setFormData(JSON.parse(memo));
        } else {
          // 구버전 텍스트 메모가 있으면 '추가문의' 칸으로 마이그레이션
          setFormData({ 
            category: '근로재해', 
            diagnosis: '', 
            date: '', 
            location: '', 
            details: '', 
            inquiries: memo,
            insurances: [] as any[],
            treatmentHistory: '',
            hospitalization: false,
            outpatient: false,
            surgery: false,
            test: false
          });
        }
      } catch (e) {
        setFormData(prev => ({ ...prev, inquiries: memo }));
      }
      setIsEditMode(false); // 로드 시 기본은 보기 모드
    }
  }, [selectedId, loadMessages]);

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
      // Admin response changes status to 진행중 automatically if it was 대기
      const currentSession = sessions.find(s => s.id === selectedId);
      const updates: any = { last_message_at: new Date().toISOString() };
      if (currentSession && (!currentSession.status || currentSession.status === '대기')) {
        updates.status = '진행중';
      }
      
      await supabase
        .from('chat_sessions')
        .update(updates)
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
    const contentToSave = JSON.stringify(formData);
    const { error } = await supabase
      .from('chat_sessions')
      .update({ customer_memo: contentToSave })
      .eq('id', selectedId);
    setIsSavingMemo(false);
    if (!error) {
      setSessions(prev => prev.map(s => s.id === selectedId ? { ...s, customer_memo: contentToSave } : s));
      setIsEditMode(false); // 저장 완료 시 보기 모드로 전환
      alert('상담 내역이 저장되었습니다.');
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

  // Derived filtered sessions
  const filteredSessions = sessions.filter(session => {
    const status = session.status || '대기';
    
    // 1. Tab Filter
    if (activeTab !== '전체') {
      if (activeTab === '대기' && status !== '대기') return false;
      if (activeTab === '진행중' && status !== '진행중') return false;
      if (activeTab === '보류' && status !== '보류') return false;
      if (activeTab === '완료' && status !== '완료') return false;
      if (activeTab === '차단' && status !== '차단') return false;
    } else {
      // In '전체' tab, we might want to hide blocked or just show all. Let's show all.
    }

    // 2. Read Filter
    if (readFilter === '안읽음' && (session.unread_count || 0) === 0) return false;
    if (readFilter === '읽음' && (session.unread_count || 0) > 0) return false;

    // 3. Search Filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchesNickname = visitorLabel(session).toLowerCase().includes(term);
      const matchesContent = (session.last_content || '').toLowerCase().includes(term);
      if (!matchesNickname && !matchesContent) return false;
    }

    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.last_message_at).getTime();
    const dateB = new Date(b.last_message_at).getTime();
    if (sortBy === '최근 대화순') return dateB - dateA;
    return dateA - dateB;
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case '진행중': return 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      case '완료': return 'text-gray-500 bg-gray-100 dark:bg-zinc-800 dark:text-gray-400 border-gray-200 dark:border-zinc-700';
      case '보류': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case '차단': return 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      default: return 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800'; // 대기
    }
  };

  return (
    <div className="flex flex-1 h-full bg-white dark:bg-zinc-950 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden relative">
      
      {/* 1단: 세션 목록 (좌측) */}
      <div className={`w-full md:w-[320px] flex-col border-r border-gray-200 dark:border-zinc-800 shrink-0 bg-gray-50 dark:bg-zinc-900/50 absolute md:relative inset-0 z-10 md:z-auto transition-transform ${selectedId ? 'hidden md:flex' : 'flex'}`}>
        
        {/* 검색 및 상단 탭 */}
        <div className="flex flex-col border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="p-3">
            <div className="relative">
              <input 
                type="text" 
                placeholder="대화내용, 닉네임 검색" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-gray-100 dark:bg-zinc-800 border-transparent rounded-lg text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                </button>
              )}
            </div>
          </div>
          
          <div className="flex px-2 pb-0 overflow-x-auto custom-scrollbar">
            {['전체', '대기', '진행중', '보류', '완료'].map((tab) => {
              const count = tab === '전체' ? sessions.length : sessions.filter(s => (s.status || '대기') === tab).length;
              const isActive = activeTab === tab;
              return (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex items-center gap-1.5 py-3 px-3 min-w-[60px] border-b-2 transition-colors ${
                    isActive ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <span className="text-[13px]">{tab}</span>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-zinc-800'}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 필터 및 정렬 컨트롤 */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-zinc-900/50 border-b border-gray-200 dark:border-zinc-800 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent outline-none cursor-pointer hover:text-gray-900 dark:hover:text-white"
            >
              <option value="최근 대화순">최근 대화순 ↓</option>
              <option value="오래된 대화순">오래된 대화순 ↑</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <select 
              value={readFilter} 
              onChange={e => setReadFilter(e.target.value as any)}
              className="bg-transparent outline-none cursor-pointer hover:text-gray-900 dark:hover:text-white"
            >
              <option value="전체">읽음여부: 전체</option>
              <option value="읽음">읽음</option>
              <option value="안읽음">안읽음</option>
            </select>
          </div>
        </div>
        
        {/* 리스트 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {isLoading ? (
            <div className="text-center py-10 text-xs text-gray-400">불러오는 중...</div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-10 text-xs text-gray-400">조건에 맞는 대화 내역이 없습니다.</div>
          ) : (
            <div className="flex flex-col gap-1">
              {filteredSessions.map(session => {
                const isSelected = session.id === selectedId;
                const hasUnread = (session.unread_count ?? 0) > 0;
                const status = session.status || '대기';
                
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
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className={`text-sm font-bold truncate ${hasUnread ? 'text-blue-700 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>
                          {visitorLabel(session)}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getStatusColor(status)} shrink-0`}>
                          {status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
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
      <div className={`flex-1 flex-col bg-white dark:bg-zinc-950 relative ${selectedId ? 'flex' : 'hidden md:flex'}`}>
        {!selectedId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-zinc-600">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <p className="font-medium">대화방을 선택해주세요</p>
          </div>
        ) : !activeSession ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            데이터를 불러오는 중입니다...
          </div>
        ) : (
          <>
            <div className="px-4 py-3 md:px-6 md:py-4 border-b border-gray-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900 flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center gap-2 md:gap-3">
                <button onClick={() => setSelectedId(null)} className="md:hidden p-1 -ml-1 text-gray-500 hover:text-gray-900 dark:hover:text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {visitorLabel(activeSession)}
                  </h3>
                  <p className="text-[10px] md:text-xs text-gray-400 mt-0.5">
                    최초 접속일: {new Date(activeSession.created_at).toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowMemoModal(true)}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold border border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400 shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  상담신청양식
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-zinc-950/50 custom-scrollbar" onClick={() => setIsMenuOpen(false)}>
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
                  placeholder={activeSession?.status === '차단' ? "차단된 대화입니다." : "메시지를 입력하세요... (Enter로 전송, Shift+Enter로 줄바꿈)"}
                  disabled={activeSession?.status === '차단'}
                  rows={3}
                  className="flex-1 text-sm p-2 bg-transparent resize-none outline-none custom-scrollbar disabled:opacity-50"
                />
                <button
                  onClick={sendReply}
                  disabled={!replyText.trim() || isSending || activeSession?.status === '차단'}
                  className="self-end px-5 py-3 bg-[#03c75a] hover:bg-[#02b351] disabled:bg-gray-300 dark:disabled:bg-zinc-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                >
                  <span>전송</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 공통 팝업 상담신청양식 (모달) */}
      {showMemoModal && selectedId && activeSession && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 md:p-6" onClick={() => setShowMemoModal(false)}>
          <div className="w-full max-w-3xl h-full max-h-[90vh] bg-white dark:bg-zinc-900 rounded-2xl flex flex-col shadow-2xl animate-fade-in-up overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 flex flex-wrap gap-2 justify-between items-center shrink-0 bg-gray-50 dark:bg-zinc-950">
              <h3 className="font-bold text-gray-900 dark:text-white mr-auto flex items-center gap-2">
                <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
                기본 정보 및 사고 내용 입력
              </h3>
              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`text-xs px-3 py-1.5 rounded transition-colors border font-bold ${isEditMode ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-700 dark:hover:bg-zinc-700'}`}
                >
                  {isEditMode ? '입력취소' : '수정'}
                </button>
                <button 
                  onClick={saveMemo}
                  disabled={isSavingMemo || !isEditMode}
                  className={`text-xs px-3 py-1.5 rounded transition-colors border font-bold ${!isEditMode ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200 dark:bg-zinc-800 dark:text-gray-500 dark:border-zinc-700' : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400'}`}
                >
                  {isSavingMemo ? '저장중...' : '저장'}
                </button>
                <button
                  onClick={() => {
                    const title = `[채팅] ${visitorLabel(activeSession)}`;
                    const insText = formData.insurances.map(i => `- ${i.type}: ${i.company} (${i.year} / ${i.amount})`).join('\n');
                    const parsedContent = `[상담양식]\n사고 분류: ${formData.category}\n진단명: ${formData.diagnosis}\n사고일자: ${formData.date}\n사고장소: ${formData.location}\n사고경위: ${formData.details}\n치료경위: ${formData.treatmentHistory}\n가입보험:\n${insText || '없음'}\n추가문의: ${formData.inquiries}`;
                    const contentText = `최근 대화내용:\n${activeSession.last_content || '내용 없음'}\n\n${parsedContent}`;
                    const payload = { title, text: contentText, sourceApp: 'chat-list', sourceId: activeSession.id };
                    sessionStorage.setItem('pending_calendar_event', JSON.stringify(payload));
                    window.dispatchEvent(new CustomEvent('navigate-admin-app', { detail: { app: 'calendar' } }));
                  }}
                  className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 px-3 py-1.5 rounded transition-colors font-bold whitespace-nowrap dark:bg-zinc-800 dark:border-zinc-600 dark:text-gray-300 dark:hover:bg-zinc-700"
                >
                  캘린더보내기
                </button>
                <button onClick={() => setShowMemoModal(false)} className="text-xs bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50 px-3 py-1.5 rounded font-bold ml-1">
                  닫기
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white dark:bg-zinc-950">
              <ConsultationDetailCard 
                data={formData} 
                onChange={setFormData} 
                readOnly={!isEditMode} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
