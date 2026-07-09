'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { ChatSession, ChatMessage } from '@/lib/supabase';

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
  
  // Memo State
  const [memoText, setMemoText] = useState('');
  const [isSavingMemo, setIsSavingMemo] = useState(false);

  // Filters & Sorting State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'전체' | '대기' | '진행중' | '보류' | '완료' | '차단'>('전체');
  const [sortBy, setSortBy] = useState<'최근 대화순' | '오래된 대화순'>('최근 대화순');
  const [readFilter, setReadFilter] = useState<'전체' | '읽음' | '안읽음'>('전체');
  
  // Menu State
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
      setMemoText(activeSession.customer_memo || '');
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
    const { error } = await supabase
      .from('chat_sessions')
      .update({ customer_memo: memoText })
      .eq('id', selectedId);
    setIsSavingMemo(false);
    if (!error) {
      setSessions(prev => prev.map(s => s.id === selectedId ? { ...s, customer_memo: memoText } : s));
    }
  };

  const changeStatus = async (newStatus: string) => {
    if (!selectedId) return;
    const { error } = await supabase.from('chat_sessions').update({ status: newStatus }).eq('id', selectedId);
    if (!error) {
      setSessions(prev => prev.map(s => s.id === selectedId ? { ...s, status: newStatus } : s));
    } else {
      console.error('Status update error:', error);
      alert(`상태 변경 실패: ${error.message}`);
    }
    setIsMenuOpen(false);
  };

  const deleteSession = async () => {
    if (!selectedId) return;
    if (!window.confirm('정말 이 채팅방을 나가고 삭제하시겠습니까? (이 작업은 되돌릴 수 없습니다)')) return;
    const { error } = await supabase.from('chat_sessions').delete().eq('id', selectedId);
    if (!error) {
      setSessions(prev => prev.filter(s => s.id !== selectedId));
      setSelectedId(null);
    } else {
      console.error('Delete error:', error);
      alert(`삭제 실패: ${error.message}`);
    }
    setIsMenuOpen(false);
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
    <div className="flex flex-1 h-full bg-white dark:bg-zinc-950 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-800 overflow-hidden">
      
      {/* 1단: 세션 목록 (좌측) */}
      <div className="w-[320px] flex flex-col border-r border-gray-200 dark:border-zinc-800 shrink-0 bg-gray-50 dark:bg-zinc-900/50">
        
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
                  className={`flex flex-col items-center justify-center py-2 px-3 min-w-[60px] border-b-2 transition-colors ${
                    isActive ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <span className="text-[13px]">{tab}</span>
                  <span className="text-[11px] mt-0.5">{count}</span>
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
      <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 relative">
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
            <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900 flex justify-between items-center shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {visitorLabel(activeSession)}
                  </h3>
                </div>
              </div>
              
              {/* 상단 액션 메뉴 */}
              <div className="relative">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`text-sm font-bold px-3 py-1.5 rounded-md transition-colors border ${getStatusColor(activeSession!.status || '대기')}`}
                  >
                    {activeSession!.status || '대기'}
                  </button>
                  <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                  </button>
                </div>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 py-1 z-20 overflow-hidden">
                    <button onClick={() => changeStatus('진행중')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200">진행중으로 변경</button>
                    <button onClick={() => changeStatus('보류')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200">보류하기</button>
                    <button onClick={() => changeStatus('완료')} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200">완료하기</button>
                    <div className="border-t border-gray-100 dark:border-zinc-700 my-1"></div>
                    <button onClick={deleteSession} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400">삭제하기</button>
                  </div>
                )}
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

      {/* 3단: 오른쪽 패널 (항목관리 모드일 때만 표시) */}
      {selectedId && activeSession && activeApp === 'chat-manage' && (
        <div className="w-[320px] bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 flex flex-col shrink-0">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 shrink-0 bg-gray-50 dark:bg-zinc-950">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">고객 정보</h3>
          </div>
          <div className="p-4 flex flex-col gap-6 overflow-y-auto custom-scrollbar flex-1">
            
            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">닉네임/ID</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{visitorLabel(activeSession)}</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-gray-500">최초 접속일</span>
              <span className="text-sm text-gray-800 dark:text-gray-200">{new Date(activeSession.created_at).toLocaleString('ko-KR')}</span>
            </div>
            
            <button
              onClick={() => {
                const title = `[채팅] ${visitorLabel(activeSession)}`;
                const contentText = `최근 대화내용:\n${activeSession.last_content || '내용 없음'}\n\n고객 메모:\n${memoText}`;
                const payload = {
                  title,
                  text: contentText,
                  sourceApp: 'chat-list',
                  sourceId: activeSession.id
                };
                sessionStorage.setItem('pending_calendar_event', JSON.stringify(payload));
                window.dispatchEvent(new CustomEvent('navigate-admin-app', { detail: { app: 'calendar' } }));
              }}
              className="w-full py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-bold rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-sm border border-blue-200 dark:border-blue-800"
            >
              📅 캘린더 일정으로 보내기
            </button>

            <hr className="border-gray-200 dark:border-zinc-800" />

            <div className="flex flex-col gap-2 flex-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">📝 관리자 전용 고객 메모</span>
                <button 
                  onClick={saveMemo}
                  disabled={isSavingMemo}
                  className="text-[10px] bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded transition-colors border border-gray-200 dark:border-zinc-700"
                >
                  {isSavingMemo ? '저장 중...' : '저장'}
                </button>
              </div>
              <textarea
                value={memoText}
                onChange={e => setMemoText(e.target.value)}
                placeholder="이 고객과의 상담에서 기억해야 할 내용을 자유롭게 메모하세요. (고객에게는 보이지 않습니다)"
                className="flex-1 min-h-[200px] w-full bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-3 text-sm text-gray-800 dark:text-gray-200 resize-none outline-none focus:border-yellow-400 transition-colors custom-scrollbar"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
