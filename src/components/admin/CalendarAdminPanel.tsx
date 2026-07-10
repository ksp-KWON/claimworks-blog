'use client';

import React, { useState, useEffect } from 'react';
import { supabase, AdminCalendarEvent } from '@/lib/supabase';
import { useCalendarLabels } from './useCalendarLabels';

type ViewMode = 'day' | 'week' | 'month' | 'year' | 'agenda';

export default function CalendarAdminPanel() {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<AdminCalendarEvent[]>([]);
  const [holidays, setHolidays] = useState<{date: string; localName: string}[]>([]);
  
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AdminCalendarEvent | null>(null);
  
  // Linkable Data State
  const [chatSessions, setChatSessions] = useState<{id: string; visitor_name: string; created_at: string; last_message_at: string}[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);

  // Labels hook
  const { labels } = useCalendarLabels();
  
  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formLabelId, setFormLabelId] = useState('');
  const [formSourceApp, setFormSourceApp] = useState('');
  const [formSourceId, setFormSourceId] = useState('');
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

  useEffect(() => {
    const fetchLinkableData = async () => {
      const { data: chats } = await supabase.from('chat_sessions').select('id, visitor_name, created_at, last_message_at').order('last_message_at', { ascending: false }).limit(50);
      if (chats) setChatSessions(chats);

      const { data: cons } = await supabase.from('consultations').select('*').order('created_at', { ascending: false }).limit(50);
      if (cons) setConsultations(cons);
    };
    fetchLinkableData();
  }, []);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${currentDate.getFullYear()}/KR`);
        if (res.ok) {
          const data = await res.json();
          setHolidays(data.map((h: any) => ({ date: h.date, localName: h.localName })));
        }
      } catch (e) {
        console.error('Failed to fetch holidays', e);
      }
    };
    fetchHolidays();
  }, [currentDate.getFullYear()]);

  const formatDateString = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    const pendingStr = sessionStorage.getItem('pending_calendar_event');
    if (pendingStr && labels.length > 0) {
      sessionStorage.removeItem('pending_calendar_event');
      try {
        const parsed = JSON.parse(pendingStr);
        let targetLabelId = '';
        if (parsed.sourceApp === 'chat-list') {
          const chatLabel = labels.find(l => l.name.includes('채팅'));
          if (chatLabel) targetLabelId = chatLabel.id;
        } else if (parsed.sourceApp === 'consultations') {
          const consultLabel = labels.find(l => l.name.includes('예약') || l.name.includes('접수'));
          if (consultLabel) targetLabelId = consultLabel.id;
        }
        
        setSelectedDate(formatDateString(new Date()));
        setSelectedEvent(null);
        setIsEditing(true);
        setFormTitle(parsed.title || '');
        setFormContent(parsed.text || '');
        setFormLabelId(targetLabelId);
        setFormSourceApp(parsed.sourceApp || '');
        setFormSourceId(parsed.sourceId || '');
      } catch (e) {
        console.error('Failed to parse pending event', e);
      }
    }
  }, [labels]);

  const parseContent = (content?: string) => {
    if (!content) return { text: '', labelId: '', sourceApp: '', sourceId: '' };
    try {
      const parsed = JSON.parse(content);
      if (parsed.text !== undefined) return parsed as { text: string; labelId: string; sourceApp?: string; sourceId?: string };
      return { text: content, labelId: '', sourceApp: '', sourceId: '' };
    } catch {
      return { text: content, labelId: '', sourceApp: '', sourceId: '' };
    }
  };

  const getFilteredEvents = () => {
    return events.filter(ev => {
      const { labelId } = parseContent(ev.content);
      if (!labelId) return true; // No label -> always show
      const label = labels.find(l => l.id === labelId);
      return label ? label.active : true;
    });
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
    setFormLabelId('');
    setFormSourceApp('');
    setFormSourceId('');
  };

  const handleEventClick = (e: React.MouseEvent, event: AdminCalendarEvent) => {
    e.stopPropagation();
    setSelectedDate(event.date);
    setSelectedEvent(event);
    setIsEditing(false);
    setFormTitle(event.title);
    const { text, labelId, sourceApp, sourceId } = parseContent(event.content);
    setFormContent(text);
    setFormLabelId(labelId);
    setFormSourceApp(sourceApp || '');
    setFormSourceId(sourceId || '');
  };

  const handleCreateNew = () => {
    if (!selectedDate) {
      setSelectedDate(formatDateString(new Date()));
    }
    setSelectedEvent(null);
    setIsEditing(true);
    setFormTitle('');
    setFormContent('');
    setFormLabelId('');
    setFormSourceApp('');
    setFormSourceId('');
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !selectedDate) {
      alert('제목을 입력해주세요.');
      return;
    }
    setIsLoading(true);
    
    const contentToSave = JSON.stringify({ 
      text: formContent, 
      labelId: formLabelId,
      sourceApp: formSourceApp,
      sourceId: formSourceId
    });
    
    if (selectedEvent) {
      const { error } = await supabase
        .from('admin_calendar_events')
        .update({ date: selectedDate, title: formTitle, content: contentToSave })
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
        .insert([{ date: selectedDate, title: formTitle, content: contentToSave }]);
        
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
      setFormLabelId('');
      setFormSourceApp('');
      setFormSourceId('');
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
            const dayEvents = getFilteredEvents().filter(e => e.date === dateStr);
            const isToday = dateStr === formatDateString(new Date());
            const holiday = holidays.find(h => h.date === dateStr);
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
                      (weekDay === 0 || holiday) ? 'text-red-500' : 
                      weekDay === 6 ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'}
                  `}>
                    {d}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                  {holiday && (
                    <div className="text-xs px-1.5 py-0.5 rounded truncate bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold">
                      {holiday.localName}
                    </div>
                  )}
                  {dayEvents.map(ev => {
                    const { labelId } = parseContent(ev.content);
                    const label = labels.find(l => l.id === labelId);
                    const labelColor = label ? label.color : '#3b82f6';
                    
                    return (
                      <div 
                        key={ev.id} 
                        onClick={(e) => handleEventClick(e, ev)}
                        className={`text-xs px-1.5 py-0.5 rounded truncate border text-white ${
                          selectedEvent?.id === ev.id 
                            ? 'ring-2 ring-black dark:ring-white opacity-100' 
                            : 'opacity-90 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: labelColor, borderColor: labelColor }}
                      >
                        {ev.title}
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
            const dayEvents = getFilteredEvents().filter(e => e.date === dateStr);
            const isToday = dateStr === formatDateString(new Date());
            const holiday = holidays.find(h => h.date === dateStr);
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
                  {holiday && <div className="text-[10px] font-bold text-red-500 mt-1 truncate">{holiday.localName}</div>}
                </div>
                <div 
                  className="flex-1 overflow-y-auto custom-scrollbar p-1 space-y-1"
                  onClick={() => handleDateClick(dateStr)}
                >
                  {dayEvents.map(ev => {
                    const { labelId } = parseContent(ev.content);
                    const label = labels.find(l => l.id === labelId);
                    const labelColor = label ? label.color : '#3b82f6';
                    
                    return (
                      <div 
                        key={ev.id} 
                        onClick={(e) => handleEventClick(e, ev)}
                        className={`text-xs px-2 py-1.5 rounded border text-white ${
                          selectedEvent?.id === ev.id 
                            ? 'ring-2 ring-black dark:ring-white opacity-100' 
                            : 'opacity-90 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: labelColor, borderColor: labelColor }}
                      >
                        <div className="font-bold truncate">{ev.title}</div>
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

  // 3. Day View
  const renderDayView = () => {
    const dateStr = formatDateString(currentDate);
    const dayEvents = getFilteredEvents().filter(e => e.date === dateStr);
    const isToday = dateStr === formatDateString(new Date());
    const holiday = holidays.find(h => h.date === dateStr);
    const dayName = ['일', '월', '화', '수', '목', '금', '토'][currentDate.getDay()];
    
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950">
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 text-center bg-gray-50 dark:bg-zinc-900">
          <div className={`text-sm font-bold mb-1 ${currentDate.getDay() === 0 ? 'text-red-500' : currentDate.getDay() === 6 ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}>
            {dayName}요일
          </div>
          <div className={`text-3xl font-black ${isToday ? 'text-blue-500' : 'text-gray-800 dark:text-gray-100'}`}>
            {currentDate.getDate()}
          </div>
          {holiday && (
            <div className="mt-2 text-sm font-bold text-red-500">
              {holiday.localName}
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          {dayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <p>일정이 없습니다.</p>
              <button onClick={() => handleDateClick(dateStr)} className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-bold">
                + 새 일정 추가하기
              </button>
            </div>
          ) : (
            dayEvents.map(ev => {
              const { text, labelId } = parseContent(ev.content);
              const label = labels.find(l => l.id === labelId);
              const labelColor = label ? label.color : '#3b82f6';
              
              return (
                <div 
                  key={ev.id} 
                  onClick={(e) => handleEventClick(e, ev)}
                  className={`p-3 rounded-lg border text-white ${
                    selectedEvent?.id === ev.id 
                      ? 'ring-2 ring-black dark:ring-white opacity-100' 
                      : 'opacity-90 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: labelColor, borderColor: labelColor }}
                >
                  <div className="font-bold text-base mb-1">{ev.title}</div>
                  {text && <div className="text-sm opacity-90 line-clamp-2">{text}</div>}
                </div>
              );
            })
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
      <div className="flex-1 min-h-0 p-1.5 sm:p-3 overflow-hidden bg-white dark:bg-zinc-950 flex flex-col">
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1 lg:gap-3 flex-1 min-h-0">
          {months.map(month => {
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
            const padding = Array.from({ length: firstDay }, (_, i) => null);
            
            return (
              <div key={month} className="border border-gray-200 dark:border-zinc-800 rounded-lg p-1 sm:p-2 bg-white dark:bg-zinc-900 shadow-sm flex flex-col justify-center min-h-0">
                <div className="text-center font-bold text-[10px] sm:text-sm mb-0.5 sm:mb-1 text-gray-800 dark:text-gray-200">{month + 1}월</div>
                <div className="grid grid-cols-7 gap-0 text-center text-[7px] sm:text-[9px] text-gray-400 mb-0.5 sm:mb-1">
                  <div className="text-red-400">일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div className="text-blue-400">토</div>
                </div>
                <div className="grid grid-cols-7 gap-0 text-center text-[8px] sm:text-xs">
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
                        className={`w-3.5 h-3.5 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-[8px] lg:text-xs mx-auto flex items-center justify-center rounded-full cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 relative
                          ${isToday ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-700 dark:text-gray-300'}
                        `}
                      >
                        {d}
                        {hasEvent && <div className="absolute bottom-0 w-0.5 h-0.5 sm:w-1 sm:h-1 bg-blue-500 rounded-full"></div>}
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
    const upcomingEvents = getFilteredEvents()
      .filter(e => e.date >= formatDateString(currentDate))
      .slice(0, 50);

    return (
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-gray-50 dark:bg-zinc-950">
        <div className="max-w-3xl mx-auto space-y-4">
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-20 text-gray-500 dark:text-gray-400">
              예정된 일정이 없습니다.
            </div>
          ) : (
            upcomingEvents.map(ev => {
              const { text, labelId } = parseContent(ev.content);
              const label = labels.find(l => l.id === labelId);
              
              return (
                <div 
                  key={ev.id}
                  onClick={(e) => handleEventClick(e, ev)}
                  className={`flex gap-4 p-4 rounded-xl border bg-white dark:bg-zinc-900 cursor-pointer transition-shadow hover:shadow-md ${
                    selectedEvent?.id === ev.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 dark:border-zinc-800'
                  }`}
                >
                  <div className="w-24 shrink-0 flex flex-col items-center justify-center text-center border-r border-gray-100 dark:border-zinc-800 pr-4">
                    <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{ev.date.substring(0, 7)}</span>
                    <span className="text-2xl font-black text-gray-800 dark:text-gray-100">{ev.date.substring(8, 10)}</span>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-1">
                      {label && (
                        <span 
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                          style={{ backgroundColor: label.color }}
                        >
                          {label.name}
                        </span>
                      )}
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white truncate">{ev.title}</h4>
                    </div>
                    {text && <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{text}</p>}
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
                <div className="flex flex-col gap-1.5 shrink-0">
                  <label className="text-xs font-bold text-gray-500">라벨</label>
                  <select
                    value={formLabelId}
                    onChange={e => setFormLabelId(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">라벨 없음</option>
                    {labels.map(label => (
                      <option key={label.id} value={label.id}>
                        {label.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <label className="text-xs font-bold text-gray-500">연결된 접수/채팅 (선택)</label>
                  <div className="flex gap-2">
                    <select
                      value={formSourceApp === 'consultations' ? formSourceId : ''}
                      onChange={e => {
                        if (e.target.value) {
                          setFormSourceApp('consultations');
                          setFormSourceId(e.target.value);
                          const cons = consultations.find(c => c.id === e.target.value);
                          if (cons) {
                            if (!formTitle) setFormTitle(`${cons.name} 고객 접수건`);
                            if (!formContent) {
                              setFormContent(`이름: ${cons.name}\n연락처: ${cons.phone || ''}\n사고일자: ${cons.accident_date || ''}\n진단명: ${cons.diagnosis || ''}\n\n[상담내용]\n${cons.inquiry || ''}`);
                            }
                          }
                        } else if (formSourceApp === 'consultations') {
                          setFormSourceApp('');
                          setFormSourceId('');
                        }
                      }}
                      className="flex-1 p-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">접수 내역 선택안함</option>
                      {consultations.map(c => (
                        <option key={c.id} value={c.id}>
                          [접수] {c.name} ({new Date(c.created_at).toLocaleDateString()})
                        </option>
                      ))}
                    </select>

                    <select
                      value={formSourceApp === 'chat-list' ? formSourceId : ''}
                      onChange={e => {
                        if (e.target.value) {
                          setFormSourceApp('chat-list');
                          setFormSourceId(e.target.value);
                          const chat = chatSessions.find(c => c.id === e.target.value);
                          if (chat && !formTitle) setFormTitle(`${chat.visitor_name} 고객 채팅건`);
                        } else if (formSourceApp === 'chat-list') {
                          setFormSourceApp('');
                          setFormSourceId('');
                        }
                      }}
                      className="flex-1 p-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">채팅 내역 선택안함</option>
                      {chatSessions.map(c => (
                        <option key={c.id} value={c.id}>
                          [채팅] {c.visitor_name} ({new Date(c.last_message_at || c.created_at).toLocaleDateString()})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 flex-1 min-h-[200px]">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-500">상세 내용</label>
                    <button 
                      onClick={() => setFormContent(prev => prev + (prev ? '\n\n' : '') + '이름: \n연락처: \n사고일자: \n진단명: \n\n[상담내용]\n- ')}
                      className="text-[10px] bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded font-bold transition-colors"
                    >
                      📝 상담 질문표 양식 삽입
                    </button>
                  </div>
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
                        const { text, labelId } = parseContent(selectedEvent.content);
                        setFormContent(text);
                        setFormLabelId(labelId);
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
                <div className="flex justify-between items-start mb-4 shrink-0">
                  <div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">{selectedEvent.date}</div>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const { labelId } = parseContent(selectedEvent.content);
                        const label = labels.find(l => l.id === labelId);
                        return label ? (
                          <span 
                            className="px-2 py-0.5 rounded text-[10px] font-bold text-white shrink-0"
                            style={{ backgroundColor: label.color }}
                          >
                            {label.name}
                          </span>
                        ) : null;
                      })()}
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white">{selectedEvent.title}</h4>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-3 min-h-[150px] text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap flex-1 overflow-y-auto custom-scrollbar">
                  {parseContent(selectedEvent.content).text || <span className="text-gray-400 italic">내용 없음</span>}
                </div>
                
                {(() => {
                  const { sourceApp, sourceId } = parseContent(selectedEvent.content);
                  if (!sourceApp) return null;
                  
                  return (
                    <button
                      onClick={() => {
                        if (sourceId) {
                          sessionStorage.setItem('pending_select_id', sourceId);
                        }
                        window.dispatchEvent(new CustomEvent('navigate-admin-app', { detail: { app: sourceApp } }));
                      }}
                      className="mt-4 w-full py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 font-bold rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 text-sm border border-indigo-200 dark:border-indigo-800"
                    >
                      🔗 {sourceApp === 'chat-list' ? '원본 채팅 보기' : '원본 예약접수 보기'}
                    </button>
                  );
                })()}
                
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
