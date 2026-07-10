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
  const { labels, toggleLabelActive, addLabel, deleteLabel, updateLabel, reorderLabels } = useCalendarLabels();
  
  // Label Manager State
  const [isLabelManagerOpen, setIsLabelManagerOpen] = useState(false);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [editLabelName, setEditLabelName] = useState('');
  const [editLabelColor, setEditLabelColor] = useState('');
  
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#4285f4');
  
  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formLabelId, setFormLabelId] = useState('');
  const [formSourceApp, setFormSourceApp] = useState('');
  const [formSourceId, setFormSourceId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

    // Listen for custom events from MobileAdminNav
    const handleOpenLabelManager = () => {
      setIsLabelManagerOpen(true);
      setIsEditing(false);
      setSelectedEvent(null);
    };
    
    const handleOpenNewEvent = () => {
      setSelectedDate(formatDateString(new Date()));
      setIsEditing(true);
      setFormTitle('');
      setFormContent('');
      setFormLabelId('');
      setFormSourceApp('');
      setFormSourceId('');
      setSelectedEvent(null);
      setIsLabelManagerOpen(false);
    };

    const handleChangeViewMode = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.viewMode) {
        setViewMode(customEvent.detail.viewMode);
      }
    };

    window.addEventListener('open-label-manager', handleOpenLabelManager);
    window.addEventListener('open-new-event', handleOpenNewEvent);
    window.addEventListener('change-view-mode', handleChangeViewMode);
    
    return () => {
      window.removeEventListener('open-label-manager', handleOpenLabelManager);
      window.removeEventListener('open-new-event', handleOpenNewEvent);
      window.removeEventListener('change-view-mode', handleChangeViewMode);
    };
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
      const { labelId, text } = parseContent(ev.content);
      
      // Label filter
      let labelMatch = true;
      if (labelId) {
        const label = labels.find(l => l.id === labelId);
        if (label) labelMatch = label.active;
      }
      
      // Search filter
      let searchMatch = true;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        searchMatch = ev.title.toLowerCase().includes(q) || text.toLowerCase().includes(q);
      }
      
      return labelMatch && searchMatch;
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
    setIsLabelManagerOpen(false);
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
    setIsLabelManagerOpen(false);
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
    setIsLabelManagerOpen(false);
  };

  const handleAddLabel = () => {
    if (!newLabelName.trim()) return;
    addLabel(newLabelName.trim(), newLabelColor);
    setNewLabelName('');
    // Pick next random color
    const colors = ['#4285f4', '#fbbc04', '#ea4335', '#34a853', '#8e24aa', '#f06292', '#00acc1'];
    setNewLabelColor(colors[Math.floor(Math.random() * colors.length)]);
  };

  const saveEditLabel = () => {
    if (editingLabelId && editLabelName.trim()) {
      updateLabel(editingLabelId, editLabelName.trim(), editLabelColor);
      setEditingLabelId(null);
    }
  };

  const moveLabel = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newLabels = [...labels];
      [newLabels[index - 1], newLabels[index]] = [newLabels[index], newLabels[index - 1]];
      reorderLabels(newLabels);
    } else if (direction === 'down' && index < labels.length - 1) {
      const newLabels = [...labels];
      [newLabels[index + 1], newLabels[index]] = [newLabels[index], newLabels[index + 1]];
      reorderLabels(newLabels);
    }
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
        <div 
          className="flex-1 grid grid-cols-7 auto-rows-fr min-h-0"
          style={{ gridTemplateRows: `repeat(${Math.ceil((padding.length + days.length) / 7)}, minmax(0, 1fr))` }}
        >
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
        <div className="flex-1 flex min-w-0">
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
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2 sm:p-4 bg-gray-50 dark:bg-zinc-950">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-4 max-w-7xl mx-auto">
          {months.map(month => {
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
            const padding = Array.from({ length: firstDay }, (_, i) => null);
            
            return (
              <div key={month} className="border border-gray-200 dark:border-zinc-800 rounded-xl p-3 sm:p-4 bg-white dark:bg-zinc-900 shadow-sm flex flex-col transition-shadow hover:shadow-md">
                <div className="text-center font-black text-sm sm:text-base mb-2 sm:mb-3 text-gray-800 dark:text-gray-200">{month + 1}월</div>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] sm:text-xs font-bold text-gray-400 mb-1 sm:mb-2">
                  <div className="text-red-400">일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div className="text-blue-400">토</div>
                </div>
                <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-xs sm:text-sm">
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
                        className={`aspect-square sm:w-7 sm:h-7 mx-auto flex items-center justify-center rounded-full cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 relative transition-colors
                          ${isToday ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-700 dark:text-gray-300'}
                        `}
                      >
                        {d}
                        {hasEvent && <div className="absolute bottom-1 sm:bottom-0.5 w-1 h-1 bg-blue-500 rounded-full shadow-sm"></div>}
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
    <div className="flex flex-1 h-full w-full bg-white dark:bg-zinc-950 rounded-lg border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden min-h-0">
      
      {/* 캘린더 메인 영역 */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        
        {/* 상단 툴바 */}
        <div className="h-14 shrink-0 bg-white/90 dark:bg-[#121212]/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/10 flex items-center justify-between px-3 sm:px-4 z-20 w-full relative">
          
          {/* Left: 오늘, <, >, Date */}
          <div className="flex items-center gap-4 shrink-0">
            {viewMode !== 'agenda' && (
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <button onClick={handleToday} className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full border border-gray-300 dark:border-zinc-700 transition-colors">
                  오늘
                </button>
                <div className="flex items-center gap-0.5 sm:gap-1 text-gray-600 dark:text-gray-400">
                  <button onClick={handlePrev} className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <button onClick={handleNext} className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            )}
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate ml-1">
              {getHeaderText()}
            </h2>
          </div>

          {/* Right: Search, View Mode Dropdown */}
          <div className="flex items-center gap-2 shrink-0 ml-4 relative">
            
            {/* Search Toggle */}
            <div className="relative flex items-center">
              {isSearchOpen ? (
                <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-lg px-3 py-1.5 w-40 sm:w-64 border border-gray-200 dark:border-zinc-700 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input 
                    type="text" 
                    placeholder="검색" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-gray-900 dark:text-white text-sm w-full placeholder-gray-500 dark:placeholder-gray-400"
                    autoFocus
                  />
                  <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-2 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ) : (
                <button onClick={() => setIsSearchOpen(true)} className="p-1.5 sm:p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 transition-colors">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </button>
              )}
            </div>

            {/* View Mode Dropdown */}
            <div className="relative hidden md:block">
              <button 
                onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg border border-gray-300 dark:border-zinc-700 transition-colors"
              >
                <span>
                  {{ day: '일', week: '주', month: '월', year: '연도', agenda: '일정' }[viewMode]}
                </span>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
              </button>
              
              {isViewDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsViewDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-32 sm:w-40 bg-white dark:bg-[#28292c] border border-gray-200 dark:border-[#3c4043] rounded-lg shadow-xl z-50 py-2">
                    {[
                      { id: 'day', label: '일', key: 'D' },
                      { id: 'week', label: '주', key: 'W' },
                      { id: 'month', label: '월', key: 'M' },
                      { id: 'year', label: '연도', key: 'Y' },
                      { id: 'agenda', label: '일정', key: 'A' }
                    ].map(view => (
                      <button
                        key={view.id}
                        onClick={() => { setViewMode(view.id as ViewMode); setIsViewDropdownOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-[#3c4043] transition-colors ${viewMode === view.id ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-[#303134] font-bold' : 'text-gray-700 dark:text-[#e8eaed]'}`}
                      >
                        <span>{view.label}</span>
                        <span className="text-gray-400 dark:text-[#9aa0a6] text-[10px] sm:text-xs font-bold">{view.key}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>
        </div>

        {/* 뷰 렌더링 영역 */}
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'day' && renderDayView()}
        {viewMode === 'year' && renderYearView()}
        {viewMode === 'agenda' && renderAgendaView()}

        {/* Mobile FAB (Floating Action Button) */}
        <button 
          onClick={handleCreateNew}
          className="md:hidden fixed right-4 bottom-20 z-40 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(37,99,235,0.4)] active:scale-95 transition-transform"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>

      {/* 우측 사이드바 (일정 추가/수정 또는 라벨 관리) */}
      {(selectedEvent || isEditing || isLabelManagerOpen) && (
        <div className="w-full md:w-1/2 shrink-0 border-l border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 flex flex-col h-full animate-in slide-in-from-right-8 duration-200">
          <div className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center shrink-0 shadow-sm z-10">
            <h3 className="font-bold text-gray-800 dark:text-gray-200">
              {isLabelManagerOpen ? '라벨 관리' : (isEditing ? '일정 작성' : '일정 상세')}
            </h3>
            <button 
              onClick={() => {
                setSelectedEvent(null);
                setIsEditing(false);
                setIsLabelManagerOpen(false);
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4">
            {isLabelManagerOpen ? (
              // --- Label Manager UI ---
              <div className="flex flex-col gap-6 h-full">
                {/* 새 라벨 추가 */}
                <div className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-4 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">새 라벨 추가</h4>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color" 
                      value={newLabelColor}
                      onChange={(e) => setNewLabelColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer shrink-0 border-0 p-0"
                    />
                    <input 
                      type="text" 
                      value={newLabelName}
                      onChange={(e) => setNewLabelName(e.target.value)}
                      placeholder="라벨 이름 입력"
                      className="flex-1 p-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
                    />
                    <button 
                      onClick={handleAddLabel}
                      disabled={!newLabelName.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors font-bold text-sm shrink-0"
                    >
                      추가
                    </button>
                  </div>
                </div>

                {/* 라벨 목록 */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-sm">
                  <div className="sticky top-0 bg-gray-50 dark:bg-zinc-900/90 backdrop-blur border-b border-gray-200 dark:border-zinc-700 p-3 z-10">
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">기존 라벨 목록</h4>
                  </div>
                  <div className="flex flex-col divide-y divide-gray-100 dark:divide-zinc-700/50">
                    {labels.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                        등록된 라벨이 없습니다.
                      </div>
                    ) : (
                      labels.map((label, index) => (
                        <div key={label.id} className="flex items-center justify-between p-3 group hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
                          {editingLabelId === label.id ? (
                            <div className="flex items-center gap-2 flex-1 w-full mr-2">
                              <input 
                                type="color" 
                                value={editLabelColor}
                                onChange={(e) => setEditLabelColor(e.target.value)}
                                className="w-6 h-6 rounded cursor-pointer shrink-0 border-0 p-0"
                              />
                              <input 
                                type="text"
                                value={editLabelName}
                                onChange={(e) => setEditLabelName(e.target.value)}
                                className="flex-1 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-600 text-gray-900 dark:text-white px-2 py-1 rounded text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEditLabel();
                                  if (e.key === 'Escape') setEditingLabelId(null);
                                }}
                              />
                              <button onClick={saveEditLabel} className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-bold shrink-0 shadow-sm transition-colors">저장</button>
                              <button onClick={() => setEditingLabelId(null)} className="px-2 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-300 rounded text-xs font-bold shrink-0 transition-colors">취소</button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-3">
                                <span className="w-4 h-4 rounded-full shadow-sm border border-black/10 dark:border-white/10" style={{ backgroundColor: label.color }}></span>
                                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{label.name}</span>
                              </div>
                              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <div className="flex flex-col mr-2">
                                  <button onClick={() => moveLabel(index, 'up')} disabled={index === 0} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 disabled:hover:text-gray-400" title="위로"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 15l7-7 7 7" /></svg></button>
                                  <button onClick={() => moveLabel(index, 'down')} disabled={index === labels.length - 1} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 disabled:hover:text-gray-400" title="아래로"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg></button>
                                </div>
                                <button onClick={() => { setEditingLabelId(label.id); setEditLabelName(label.name); setEditLabelColor(label.color); }} className="p-1.5 text-gray-500 hover:text-blue-500 bg-gray-100 hover:bg-blue-50 dark:bg-zinc-700 dark:hover:bg-zinc-600 rounded transition-colors" title="수정">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                <button onClick={() => { if(window.confirm('이 라벨을 삭제하시겠습니까?')) deleteLabel(label.id); }} className="p-1.5 text-gray-500 hover:text-red-500 bg-gray-100 hover:bg-red-50 dark:bg-zinc-700 dark:hover:bg-zinc-600 rounded transition-colors" title="삭제">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : isEditing || !selectedEvent ? (
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
