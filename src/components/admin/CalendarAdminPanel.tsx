'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { AdminCalendarEvent } from '@/lib/supabase';
import AdminPanelLayout from './AdminPanelLayout';
import { AdminHeaderBar } from './AdminHeader';
import PremiumButton from '@/components/ui/PremiumButton';

interface ExtendedCalendarEvent extends AdminCalendarEvent {
  time?: string;
  category?: '상담' | '실사' | '미팅' | '기타';
  sourceApp?: 'consultations' | 'chat';
  sourceId?: string;
}

interface CalendarAdminPanelProps {
  searchQuery?: string;
  sortType?: string;
  refreshCounter?: number;
}

const CATEGORY_COLORS: Record<string, { badge: string; dot: string; bg: string }> = {
  상담: { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200', dot: 'bg-blue-500', bg: 'hover:bg-blue-50/50' },
  실사: { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200', dot: 'bg-emerald-500', bg: 'hover:bg-emerald-50/50' },
  미팅: { badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 border-purple-200', dot: 'bg-purple-500', bg: 'hover:bg-purple-50/50' },
  기타: { badge: 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300 border-gray-200', dot: 'bg-gray-400', bg: 'hover:bg-gray-50/50' }
};

export default function CalendarAdminPanel({ searchQuery = '', refreshCounter = 0 }: CalendarAdminPanelProps) {
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0 ~ 11
  const [selectedDate, setSelectedDate] = useState<string>(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  );

  const [events, setEvents] = useState<ExtendedCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [modalForm, setModalForm] = useState<{
    date: string;
    time: string;
    title: string;
    category: '상담' | '실사' | '미팅' | '기타';
    content: string;
    sourceApp?: 'consultations' | 'chat';
    sourceId?: string;
  }>({
    date: selectedDate,
    time: '14:00',
    title: '',
    category: '상담',
    content: ''
  });

  // Supabase 또는 로컬 캐시에서 일정 데이터 로드
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_calendar_events')
        .select('*')
        .order('date', { ascending: true });

      if (error || !data || data.length === 0) {
        // 테이블 미생성, 에러, 또는 Supabase가 비어있을 때 로컬스토리지 폴백
        const local = localStorage.getItem('local_calendar_events');
        if (local) {
          try {
            setEvents(JSON.parse(local));
          } catch {
            setEvents([]);
          }
        } else {
          setEvents([]);
        }
      } else if (data && data.length > 0) {
        const parsed = data.map((d: any) => {
          let extra: any = {};
          try {
            if (d.content && d.content.startsWith('{')) {
              extra = JSON.parse(d.content);
            }
          } catch {
            // Ignored
          }
          return {
            id: d.id,
            date: d.date,
            title: d.title,
            content: extra.text !== undefined ? extra.text : d.content,
            time: extra.time || '10:00',
            category: extra.category || '상담',
            sourceApp: extra.sourceApp,
            sourceId: extra.sourceId,
            created_at: d.created_at
          };
        });
        setEvents(parsed);
        localStorage.setItem('local_calendar_events', JSON.stringify(parsed));
      }
    } catch {
      const local = localStorage.getItem('local_calendar_events');
      if (local) {
        try {
          setEvents(JSON.parse(local));
        } catch {
          setEvents([]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, refreshCounter]);

  // 상담/채팅에서 넘어온 pending_calendar_event 확인 및 모달 자동 열기
  useEffect(() => {
    const pending = sessionStorage.getItem('pending_calendar_event');
    if (pending) {
      try {
        const payload = JSON.parse(pending);
        sessionStorage.removeItem('pending_calendar_event');
        setModalForm({
          date: selectedDate,
          time: '14:00',
          title: payload.title || '',
          category: '상담',
          content: payload.text || '',
          sourceApp: payload.sourceApp,
          sourceId: payload.sourceId
        });
        setEditingEventId(null);
        setIsModalOpen(true);
      } catch {
        sessionStorage.removeItem('pending_calendar_event');
      }
    }
  }, [selectedDate]);

  // 달력 날짜 계산 (월간 그리드)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0(일) ~ 6(토)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // 이전 달 날짜 채우기
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevM = currentMonth === 0 ? 12 : currentMonth;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      days.push({
        dateStr: `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        dayNum: d,
        isCurrentMonth: false
      });
    }

    // 이번 달 날짜
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        dateStr: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        dayNum: d,
        isCurrentMonth: true
      });
    }

    // 다음 달 날짜 채우기 (총 35 or 42 그리드 맞춤)
    const remaining = 42 - days.length;
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        const nextM = currentMonth === 11 ? 1 : currentMonth + 2;
        const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
        days.push({
          dateStr: `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
          dayNum: d,
          isCurrentMonth: false
        });
      }
    }

    return days;
  }, [currentYear, currentMonth]);

  // 이전달 / 다음달 / 오늘 이동
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleGoToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
  };

  // 일정 저장 (생성 or 수정)
  const handleSaveEvent = async () => {
    if (!modalForm.title.trim()) {
      alert('일정 제목을 입력해주세요.');
      return;
    }

    const eventPayload = {
      date: modalForm.date,
      title: modalForm.title,
      content: JSON.stringify({
        text: modalForm.content,
        time: modalForm.time,
        category: modalForm.category,
        sourceApp: modalForm.sourceApp,
        sourceId: modalForm.sourceId
      })
    };

    let generatedId = editingEventId;

    try {
      if (editingEventId) {
        // 수정
        await supabase.from('admin_calendar_events').update(eventPayload).eq('id', editingEventId);
      } else {
        // 신규 추가
        const { data } = await supabase.from('admin_calendar_events').insert([eventPayload]).select();
        if (data && data[0]?.id) {
          generatedId = data[0].id;
        }
      }
    } catch (err) {
      console.warn('Supabase save note:', err);
    }

    // 로컬 스토리지 & State 즉시 동기화
    setEvents(prev => {
      let next = [...prev];
      if (editingEventId) {
        const idx = next.findIndex(e => e.id === editingEventId);
        if (idx >= 0) {
          next[idx] = {
            ...next[idx],
            date: modalForm.date,
            title: modalForm.title,
            time: modalForm.time,
            category: modalForm.category,
            content: modalForm.content
          };
        }
      } else {
        next.push({
          id: generatedId || Date.now().toString(),
          date: modalForm.date,
          title: modalForm.title,
          time: modalForm.time,
          category: modalForm.category,
          content: modalForm.content,
          sourceApp: modalForm.sourceApp,
          sourceId: modalForm.sourceId,
          created_at: new Date().toISOString()
        });
      }
      localStorage.setItem('local_calendar_events', JSON.stringify(next));
      return next;
    });

    setIsModalOpen(false);
    fetchEvents();
  };

  // 일정 삭제
  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('정말 이 일정을 삭제하시겠습니까?')) return;
    
    // 1) React State 및 로컬스토리지에서 즉시 삭제 (반응속도 0ms)
    setEvents(prev => {
      const next = prev.filter(e => e.id !== id);
      localStorage.setItem('local_calendar_events', JSON.stringify(next));
      return next;
    });

    // 2) Supabase 테이블에서도 삭제 시도
    try {
      await supabase.from('admin_calendar_events').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete error:', err);
    }
  };

  // 특정 일정 클릭하여 원본 상담/채팅으로 점프
  const handleJumpToSource = (event: ExtendedCalendarEvent) => {
    if (event.sourceApp === 'consultations' && event.sourceId) {
      sessionStorage.setItem('pending_select_id', event.sourceId);
      window.dispatchEvent(new CustomEvent('navigate-admin-app', { detail: { app: 'consult-manage' } }));
    } else if (event.sourceApp === 'chat' && event.sourceId) {
      window.dispatchEvent(new CustomEvent('navigate-admin-app', { detail: { app: 'chat-manage' } }));
    }
  };

  // 선택된 날짜의 일정 목록 (검색어 필터 포함)
  const selectedDateEvents = useMemo(() => {
    return events.filter(e => {
      const matchesDate = e.date === selectedDate;
      const matchesSearch = !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase()) || (e.content || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDate && matchesSearch;
    }).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [events, selectedDate, searchQuery]);

  // 오늘 날짜 문자열
  const todayStr = useMemo(() => `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`, [today]);

  return (
    <AdminPanelLayout innerClassName="flex flex-col md:flex-row w-full h-full bg-white dark:bg-[#111111] overflow-hidden min-w-0">
      
      {/* ── 좌측/상단: 월간 캘린더 그리드 ── */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col border-b md:border-b-0 md:border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-y-auto custom-scrollbar">
        
        {/* 캘린더 네비게이션 헤더 */}
        <div className="p-4 md:p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-950 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>📅</span>
              <span>{currentYear}년 {currentMonth + 1}월</span>
            </h2>
            <button
              onClick={handleGoToday}
              className="px-2.5 py-1 text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors"
            >
              오늘
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              title="이전 달"
            >
              ◀
            </button>
            <button
              onClick={handleNextMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 dark:border-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
              title="다음 달"
            >
              ▶
            </button>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 text-center py-2 text-xs font-bold">
          <span className="text-red-500">일</span>
          <span className="text-gray-700 dark:text-gray-300">월</span>
          <span className="text-gray-700 dark:text-gray-300">화</span>
          <span className="text-gray-700 dark:text-gray-300">수</span>
          <span className="text-gray-700 dark:text-gray-300">목</span>
          <span className="text-gray-700 dark:text-gray-300">금</span>
          <span className="text-blue-500">토</span>
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 flex-1 min-h-[360px] divide-x divide-y divide-gray-100 dark:divide-zinc-800/80 bg-gray-50/30 dark:bg-zinc-950">
          {calendarDays.map((day, idx) => {
            const dayEvents = events.filter(e => e.date === day.dateStr);
            const isSelected = selectedDate === day.dateStr;
            const isToday = todayStr === day.dateStr;
            const isSunday = idx % 7 === 0;
            const isSaturday = idx % 7 === 6;

            return (
              <div
                key={day.dateStr}
                onClick={() => setSelectedDate(day.dateStr)}
                className={`min-h-[85px] md:min-h-[105px] p-1.5 md:p-2 cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected 
                    ? 'bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500 ring-inset z-10' 
                    : 'hover:bg-white dark:hover:bg-zinc-900 bg-white/60 dark:bg-zinc-950/60'
                } ${!day.isCurrentMonth ? 'opacity-35' : ''}`}
              >
                {/* 일자 번호 */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs md:text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday 
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30' 
                      : isSunday 
                        ? 'text-red-500' 
                        : isSaturday 
                          ? 'text-blue-500' 
                          : 'text-gray-800 dark:text-gray-200'
                  }`}>
                    {day.dayNum}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] font-bold text-gray-400 font-mono">
                      {dayEvents.length}건
                    </span>
                  )}
                </div>

                {/* 일정 뱃지 목록 (최대 2개 표시) */}
                <div className="space-y-1 mt-1 overflow-hidden">
                  {dayEvents.slice(0, 2).map(ev => {
                    const style = CATEGORY_COLORS[ev.category || '상담'] || CATEGORY_COLORS.상담;
                    return (
                      <div
                        key={ev.id}
                        className={`text-[10px] md:text-[11px] font-medium truncate px-1.5 py-0.5 rounded border ${style.badge} flex items-center gap-1`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot} shrink-0`}></span>
                        <span className="truncate">{ev.title}</span>
                      </div>
                    );
                  })}
                  {dayEvents.length > 2 && (
                    <div className="text-[9px] font-bold text-gray-400 text-right pr-1">
                      +{dayEvents.length - 2}건 더보기
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 우측: 선택된 날짜의 일정 상세 및 등록 패널 ── */}
      <div className="w-full md:w-[340px] lg:w-[380px] shrink-0 min-h-0 flex flex-col bg-[#f8f9fa] dark:bg-zinc-900/60 overflow-hidden">
        
        <AdminHeaderBar 
          title={
            <div className="flex items-center gap-2">
              <span>📋</span>
              <span className="font-bold text-[15px] text-gray-900 dark:text-white">{selectedDate} 일정</span>
            </div>
          }
          rightContent={
            <button
              onClick={() => {
                setModalForm({
                  date: selectedDate,
                  time: '14:00',
                  title: '',
                  category: '상담',
                  content: ''
                });
                setEditingEventId(null);
                setIsModalOpen(true);
              }}
              className="px-2.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm flex items-center gap-1"
            >
              <span>➕</span> 일정 추가
            </button>
          }
        />

        {/* 일정 리스트 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-gray-400">일정을 불러오는 중...</div>
          ) : selectedDateEvents.length === 0 ? (
            <div className="p-12 text-center text-gray-400 space-y-3">
              <div className="text-3xl">☕</div>
              <p className="text-xs font-medium leading-relaxed">
                이 날짜에 등록된 일정이 없습니다.<br/>
                상단의 <b>[+ 일정 추가]</b> 버튼을 눌러보세요.
              </p>
            </div>
          ) : (
            selectedDateEvents.map(ev => {
              const style = CATEGORY_COLORS[ev.category || '상담'] || CATEGORY_COLORS.상담;
              return (
                <div
                  key={ev.id}
                  className="p-3.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${style.badge}`}>
                        {ev.category || '상담'}
                      </span>
                      <span className="text-xs font-mono font-bold text-gray-500">
                        {ev.time || '10:00'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingEventId(ev.id);
                          setModalForm({
                            date: ev.date,
                            time: ev.time || '10:00',
                            title: ev.title,
                            category: ev.category || '상담',
                            content: ev.content || '',
                            sourceApp: ev.sourceApp,
                            sourceId: ev.sourceId
                          });
                          setIsModalOpen(true);
                        }}
                        className="text-xs text-gray-400 hover:text-blue-600 p-1"
                        title="수정"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="text-xs text-gray-400 hover:text-red-500 p-1"
                        title="삭제"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-snug">
                    {ev.title}
                  </h3>

                  {ev.content && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed bg-gray-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-gray-100 dark:border-zinc-800/60 max-h-32 overflow-y-auto custom-scrollbar">
                      {ev.content}
                    </p>
                  )}

                  {/* 원본 상담/채팅 바로가기 링크 */}
                  {ev.sourceApp && (
                    <button
                      onClick={() => handleJumpToSource(ev)}
                      className="w-full mt-1 py-1.5 px-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <span>🔗</span>
                      <span>{ev.sourceApp === 'consultations' ? '원본 상담 접수내역 보기' : '채팅방 바로가기'}</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── 일정 등록/수정 모달 ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-zinc-800 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {editingEventId ? '✏️ 일정 수정' : '➕ 새 일정 등록'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">일정 제목 *</label>
                <input
                  type="text"
                  value={modalForm.title}
                  onChange={e => setModalForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="예: [상담] 김철수 고객 후유장해 면담"
                  className="w-full p-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">날짜</label>
                  <input
                    type="date"
                    value={modalForm.date}
                    onChange={e => setModalForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full p-2 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs text-gray-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">시간</label>
                  <input
                    type="time"
                    value={modalForm.time}
                    onChange={e => setModalForm(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full p-2 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs text-gray-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">일정 구분</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['상담', '실사', '미팅', '기타'] as const).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setModalForm(prev => ({ ...prev, category: cat }))}
                      className={`py-1.5 rounded-lg font-bold border transition-all ${
                        modalForm.category === cat 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                          : 'bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-zinc-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">상세 내용 및 고객 정보</label>
                <textarea
                  value={modalForm.content}
                  onChange={e => setModalForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="상담 메모, 연락처, 장소 등을 자유롭게 입력하세요."
                  rows={4}
                  className="w-full p-2.5 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none custom-scrollbar"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <PremiumButton
                onClick={() => setIsModalOpen(false)}
                variant="secondary"
                className="flex-1 !py-2.5 !text-xs !rounded-xl"
              >
                취소
              </PremiumButton>
              <PremiumButton
                onClick={handleSaveEvent}
                variant="primary"
                className="flex-1 !py-2.5 !text-xs !rounded-xl shadow-md"
              >
                {editingEventId ? '수정 완료' : '일정 저장'}
              </PremiumButton>
            </div>
          </div>
        </div>
      )}
    </AdminPanelLayout>
  );
}
