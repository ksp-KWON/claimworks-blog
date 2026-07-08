'use client';

import React, { useState, useEffect } from 'react';
import { supabase, AdminCalendarEvent } from '@/lib/supabase';

type ViewMode = 'day' | 'week' | 'month' | 'year' | 'agenda';

export default function CalendarAdminPanel() {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<AdminCalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AdminCalendarEvent | null>(null);
  
  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('admin_calendar_events')
      .select('*')
      .order('date', { ascending: true })
      .order('created_at', { ascending: true });
      
    if (data && !error) {
      setEvents(data);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const formatDateString = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else if (viewMode === 'day') d.setDate(d.getDate() - 1);
    else if (viewMode === 'year') d.setFullYear(d.getFullYear() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else if (viewMode === 'day') d.setDate(d.getDate() + 1);
    else if (viewMode === 'year') d.setFullYear(d.getFullYear() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setSelectedEvent(null);
    setIsEditing(true);
    setFormTitle('');
    setFormContent('');
  };

  const handleEventClick = (e: React.MouseEvent, event: AdminCalendarEvent) => {
    e.stopPropagation();
    setSelectedDate(event.date);
    setSelectedEvent(event);
    setIsEditing(false);
    setFormTitle(event.title);
    setFormContent(event.content || '');
  };

  const handleCreateNew = () => {
    if (!selectedDate) {
      setSelectedDate(formatDateString(new Date()));
    }
    setSelectedEvent(null);
    setIsEditing(true);
    setFormTitle('');
    setFormContent('');
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !selectedDate) {
      alert('제목을 입력해주세요.');
      return;
    }
    setIsLoading(true);
    
    if (selectedEvent) {
      const { error } = await supabase
        .from('admin_calendar_events')
        .update({ title: formTitle, content: formContent })
        .eq('id', selectedEvent.id);
        
      if (!error) {
        setIsEditing(false);
        fetchEvents();
      } else {
        console.error('Update error:', error);
        alert(`수정에 실패했습니다: ${error.message}`);
      }
    } else {
      const { error } = await supabase
        .from('admin_calendar_events')
        .insert([{ date: selectedDate, title: formTitle, content: formContent }]);
        
      if (!error) {
        setIsEditing(false);
        fetchEvents();
      } else {
        console.error('Insert error:', error);
        alert(`추가에 실패했습니다: ${error.message}`);
      }
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    
    setIsLoading(true);
    const { error } = await supabase
      .from('admin_calendar_events')
      .delete()
      .eq('id', selectedEvent.id);
      
    if (!error) {
      setSelectedEvent(null);
      setFormTitle('');
      setFormContent('');
      fetchEvents();
    } else {
      console.error('Delete error:', error);
      alert(`삭제에 실패했습니다: ${error.message}`);
    }
    setIsLoading(false);
  };

  // --- Views ---

  // 1. Month View
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const padding = Array.from({ length: firstDay }, (_, i) => null);

    return (
      <div className="flex-1 flex flex-col h-full min-h-0 bg-white dark:bg-zinc-950">
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900">
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <div key={d} className={`py-2 text-center text-xs font-bold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}>
              {d}
            </div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 grid-rows-5 lg:grid-rows-6 auto-rows-fr min-h-0">
          {padding.map((_, i) => (
            <div key={`pad-${i}`} className="border-r border-b border-gray-100 dark:border-zinc-800/50 bg-gray-50/50 dark:bg-zinc-900/20"></div>
          ))}
          {days.map(d => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.date === dateStr);
            const isToday = dateStr === formatDateString(new Date());
            const isSelected = dateStr === selectedDate;
            const weekDay = new Date(year, month, d).getDay();
            
            return (
              <div 
                key={d} 
                onClick={() => handleDateClick(dateStr)}
                className={`border-r border-b border-gray-100 dark:border-zinc-800/50 p-1 flex flex-col cursor-pointer transition-colors group
                  ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'}
                `}
              >
                <div className="flex justify-between items-start mb-1 px-1">
                  <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full
                    ${isToday ? 'bg-blue-500 text-white' : 
                      weekDay === 0 ? 'text-red-500' : 
                      weekDay === 6 ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'}
                  `}>
                    {d}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                  {dayEvents.map(ev => (
                    <div 
                      key={ev.id} 
                      onClick={(e) => handleEventClick(e, ev)}
                      className={`text-xs px-1.5 py-0.5 rounded truncate border ${
                        selectedEvent?.id === ev.id 
                          ? 'bg-blue-500 text-white border-blue-600' 
                          : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-700'
                      }`}
                    >
                      {ev.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 2. Week View
  const renderWeekView = () => {
    // Find Sunday of the current week
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day;
    const startOfWeek = new Date(d.setDate(diff));
    
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const dd = new Date(startOfWeek);
      dd.setDate(dd.getDate() + i);
      return dd;
    });

    return (
      <div className="flex-1 flex flex-col h-full min-h-0 bg-white dark:bg-zinc-950 overflow-x-auto">
        <div className="flex-1 flex min-w-[800px]">
          {weekDays.map((date, i) => {
            const dateStr = formatDateString(date);
            const dayEvents = events.filter(e => e.date === dateStr);
            const isToday = dateStr === formatDateString(new Date());
            const isSelected = dateStr === selectedDate;
            const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
            
            return (
              <div key={dateStr} className={`flex-1 border-r border-gray-200 dark:border-zinc-800 flex flex-col
                ${isSelected ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}
              `}>
                <div className="p-3 border-b border-gray-200 dark:border-zinc-800 text-center bg-gray-50 dark:bg-zinc-900">
                  <div className={`text-xs font-bold mb-1 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}>
                    {dayNames[i]}
                  </div>
                  <div className={`text-lg font-bold inline-flex w-8 h-8 items-center justify-center rounded-full
                    ${isToday ? 'bg-blue-500 text-white' : 'text-gray-900 dark:text-white'}
                  `}>
                    {date.getDate()}
                  </div>
                </div>
                <div 
                  className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar cursor-pointer hover:bg-gray-50/50 dark:hover:bg-zinc-900/30"
                  onClick={() => handleDateClick(dateStr)}
                >
                  {dayEvents.map(ev => (
                    <div 
                      key={ev.id} 
                      onClick={(e) => handleEventClick(e, ev)}
                      className={`p-2 rounded-lg border text-sm shadow-sm ${
                        selectedEvent?.id === ev.id 
                          ? 'bg-blue-500 text-white border-blue-600' 
                          : 'bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-zinc-700 hover:border-blue-300'
                      }`}
                    >
                      <div className="font-bold mb-1">{ev.title}</div>
                      {ev.content && <div className="text-xs opacity-80 line-clamp-2">{ev.content}</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 3. Day View
  const renderDayView = () => {
    const dateStr = formatDateString(currentDate);
    const dayEvents = events.filter(e => e.date === dateStr);
    const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    
    return (
      <div className="flex-1 flex flex-col min-h-0 p-6 bg-white dark:bg-zinc-950 overflow-y-auto custom-scrollbar">
        <div className="mb-6 pb-4 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {currentDate.getDate()}일 <span className="text-xl text-gray-500 font-normal">{dayNames[currentDate.getDay()]}</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</p>
        </div>
        
        <div className="flex-1">
          {dayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <svg className="w-12 h-12 mb-3 text-gray-200 dark:text-zinc-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <p>이 날짜에 등록된 일정이 없습니다.</p>
              <button onClick={() => handleDateClick(dateStr)} className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-bold">
                + 새 일정 추가하기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dayEvents.map(ev => (
                <div 
                  key={ev.id} 
                  onClick={(e) => handleEventClick(e, ev)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                    selectedEvent?.id === ev.id 
                      ? 'bg-blue-500 text-white border-blue-600 shadow-lg scale-[1.02]' 
                      : 'bg-white dark:bg-zinc-900 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-zinc-800 hover:border-blue-300'
                  }`}
                >
                  <div className="font-bold text-lg mb-2">{ev.title}</div>
                  {ev.content && <div className="text-sm opacity-80 whitespace-pre-wrap">{ev.content}</div>}
                </div>
              ))}
              <div 
                onClick={() => handleDateClick(dateStr)}
                className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/50 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 transition-colors min-h-[120px]"
              >
                <span className="text-2xl mb-1">+</span>
                <span className="text-sm font-bold">일정 추가</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 4. Year View
  const renderYearView = () => {
    const year = currentDate.getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => i);
    
    return (
      <div className="flex-1 min-h-0 p-6 overflow-y-auto custom-scrollbar bg-white dark:bg-zinc-950">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {months.map(month => {
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
            const padding = Array.from({ length: firstDay }, (_, i) => null);
            
            return (
              <div key={month} className="border border-gray-200 dark:border-zinc-800 rounded-xl p-4 bg-white dark:bg-zinc-900 shadow-sm">
                <div className="text-center font-bold text-lg mb-3 text-gray-800 dark:text-gray-200">{month + 1}월</div>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-gray-400 mb-2">
                  <div className="text-red-400">일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div className="text-blue-400">토</div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {padding.map((_, i) => <div key={`p-${i}`} />)}
                  {days.map(d => {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const hasEvent = events.some(e => e.date === dateStr);
                    const isToday = dateStr === formatDateString(new Date());
                    return (
                      <div 
                        key={d} 
                        onClick={() => {
                          setCurrentDate(new Date(year, month, d));
                          setViewMode('day');
                        }}
                        className={`w-7 h-7 mx-auto flex items-center justify-center rounded-full cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 relative
                          ${isToday ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-700 dark:text-gray-300'}
                        `}
                      >
                        {d}
                        {hasEvent && <div className="absolute bottom-0.5 w-1 h-1 bg-blue-500 rounded-full"></div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 5. Agenda View
  const renderAgendaView = () => {
    // Only show events from today onwards, sorted by date
    const todayStr = formatDateString(new Date());
    const upcoming = events.filter(e => e.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date));
    
    // Group by date
    const grouped = upcoming.reduce((acc, ev) => {
      if (!acc[ev.date]) acc[ev.date] = [];
      acc[ev.date].push(ev);
      return acc;
    }, {} as Record<string, AdminCalendarEvent[]>);

    return (
      <div className="flex-1 min-h-0 p-6 overflow-y-auto custom-scrollbar bg-gray-50 dark:bg-zinc-950">
        <div className="max-w-3xl mx-auto space-y-8">
          {Object.keys(grouped).length === 0 ? (
            <div className="text-center py-20 text-gray-500">예정된 다가오는 일정이 없습니다.</div>
          ) : (
            Object.keys(grouped).map(dateStr => {
              const d = new Date(dateStr);
              const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
              const isToday = dateStr === todayStr;
              
              return (
                <div key={dateStr} className="flex gap-6">
                  <div className="w-24 shrink-0 text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400">{d.getMonth() + 1}월</div>
                    <div className={`text-3xl font-light ${isToday ? 'text-blue-500 font-bold' : 'text-gray-900 dark:text-white'}`}>{d.getDate()}</div>
                    <div className="text-xs text-gray-400 mt-1">{dayNames[d.getDay()]}요일</div>
                  </div>
                  <div className="flex-1 space-y-3 pt-1">
                    {grouped[dateStr].map(ev => (
                      <div 
                        key={ev.id}
                        onClick={(e) => {
                          setCurrentDate(new Date(ev.date));
                          handleEventClick(e, ev);
                        }}
                        className={`p-4 rounded-xl border bg-white dark:bg-zinc-900 shadow-sm cursor-pointer hover:border-blue-300 transition-colors ${
                          selectedEvent?.id === ev.id ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200 dark:border-zinc-800'
                        }`}
                      >
                        <div className="font-bold text-gray-900 dark:text-white">{ev.title}</div>
                        {ev.content && <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{ev.content}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const getHeaderText = () => {
    if (viewMode === 'year') return `${currentDate.getFullYear()}년`;
    if (viewMode === 'month') return `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`;
    if (viewMode === 'week') {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - start.getDay());
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.getMonth() + 1}월 ${start.getDate()}일 - ${end.getMonth() + 1}월 ${end.getDate()}일`;
    }
    if (viewMode === 'day') return `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월 ${currentDate.getDate()}일`;
    if (viewMode === 'agenda') return `전체 일정 목록`;
    return '';
  };

  return (
    <div className="flex h-full w-full bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      
      {/* 캘린더 메인 영역 */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        
        {/* 상단 툴바 */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            {viewMode !== 'agenda' && (
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 rounded-lg p-1 shrink-0">
                <button onClick={handlePrev} className="p-1.5 rounded-md text-gray-600 hover:bg-white dark:text-gray-300 dark:hover:bg-zinc-700 shadow-sm transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button onClick={handleToday} className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-white dark:text-gray-200 dark:hover:bg-zinc-700 rounded-md shadow-sm transition-colors">
                  오늘
                </button>
                <button onClick={handleNext} className="p-1.5 rounded-md text-gray-600 hover:bg-white dark:text-gray-300 dark:hover:bg-zinc-700 shadow-sm transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
              {getHeaderText()}
            </h2>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto overflow-x-auto custom-scrollbar pb-2 sm:pb-0">
            <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-lg p-1 shrink-0">
              {[
                { id: 'day', label: '일' },
                { id: 'week', label: '주' },
                { id: 'month', label: '월' },
                { id: 'year', label: '연도' },
                { id: 'agenda', label: '목록' }
              ].map(view => (
                <button
                  key={view.id}
                  onClick={() => setViewMode(view.id as ViewMode)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === view.id 
                      ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </div>
            <button 
              onClick={handleCreateNew}
              className="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-bold text-sm shadow-sm flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
              새 일정
            </button>
          </div>
        </div>

        {/* 뷰 렌더링 영역 */}
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'year' && renderYearView()}
        {viewMode === 'agenda' && renderAgendaView()}
      </div>

      {/* 우측 사이드바 (일정 추가/수정) - 선택되었을 때만 렌더링 */}
      {(selectedEvent || isEditing) && (
        <div className="w-80 shrink-0 border-l border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 flex flex-col h-full animate-in slide-in-from-right-8 duration-200">
          <div className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center shrink-0">
            <h3 className="font-bold text-gray-800 dark:text-gray-200">
              {isEditing ? '일정 작성' : '일정 상세'}
            </h3>
            <button 
              onClick={() => {
                setSelectedEvent(null);
                setIsEditing(false);
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4">
            {isEditing || !selectedEvent ? (
              // --- Edit Mode ---
              <div className="flex flex-col gap-4 h-full">
                <div className="flex flex-col gap-1.5 shrink-0">
                  <label className="text-xs font-bold text-gray-500">날짜</label>
                  <input 
                    type="date" 
                    value={selectedDate || ''}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <label className="text-xs font-bold text-gray-500">제목</label>
                  <input 
                    type="text" 
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="일정 제목"
                    className="w-full p-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5 flex-1 min-h-[200px]">
                  <label className="text-xs font-bold text-gray-500">상세 내용</label>
                  <textarea 
                    value={formContent}
                    onChange={e => setFormContent(e.target.value)}
                    placeholder="내용을 입력하세요..."
                    className="w-full p-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none flex-1 custom-scrollbar"
                  />
                </div>
                
                <div className="flex gap-2 mt-auto pt-4 shrink-0">
                  {selectedEvent && (
                    <button 
                      onClick={() => {
                        setIsEditing(false);
                        setFormTitle(selectedEvent.title);
                        setFormContent(selectedEvent.content || '');
                      }}
                      className="flex-1 py-2 bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-zinc-600 transition-colors font-bold text-sm"
                    >
                      취소
                    </button>
                  )}
                  <button 
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-bold text-sm disabled:opacity-50"
                  >
                    {isLoading ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>
            ) : (
              // --- View Mode ---
              <div className="flex flex-col h-full">
                <div className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1 shrink-0">{selectedEvent.date}</div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4 shrink-0">{selectedEvent.title}</h4>
                
                <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-3 min-h-[150px] text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap flex-1 overflow-y-auto custom-scrollbar">
                  {selectedEvent.content || <span className="text-gray-400 italic">내용 없음</span>}
                </div>
                
                <div className="flex gap-2 mt-auto pt-6 shrink-0">
                  <button 
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="flex-1 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 transition-colors font-bold text-sm disabled:opacity-50"
                  >
                    삭제
                  </button>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex-1 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 transition-colors font-bold text-sm"
                  >
                    수정
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
    </div>
  );
}
