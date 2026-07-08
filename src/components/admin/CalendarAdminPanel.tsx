'use client';

import React, { useState, useEffect } from 'react';
import { supabase, AdminCalendarEvent } from '@/lib/supabase';

export default function CalendarAdminPanel() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<AdminCalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AdminCalendarEvent | null>(null);
  
  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
  const totalDaysInMonth = lastDayOfMonth.getDate();
  
  const daysInMonth = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: startingDayOfWeek }, (_, i) => null);

  const fetchEvents = async () => {
    // Fetch events for the current month roughly
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
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const formatDateString = (d: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
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
      // default to today
      const today = new Date();
      setSelectedDate(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
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
      // Update
      const { error } = await supabase
        .from('admin_calendar_events')
        .update({ title: formTitle, content: formContent })
        .eq('id', selectedEvent.id);
        
      if (!error) {
        alert('수정되었습니다.');
        setIsEditing(false);
        fetchEvents();
      } else {
        alert('수정에 실패했습니다.');
      }
    } else {
      // Insert
      const { error } = await supabase
        .from('admin_calendar_events')
        .insert([{ date: selectedDate, title: formTitle, content: formContent }]);
        
      if (!error) {
        alert('추가되었습니다.');
        setIsEditing(false);
        fetchEvents();
      } else {
        alert('추가에 실패했습니다.');
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
      alert('삭제되었습니다.');
      setSelectedEvent(null);
      setFormTitle('');
      setFormContent('');
      fetchEvents();
    } else {
      alert('삭제에 실패했습니다.');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-gray-50 dark:bg-zinc-950">
      {/* 달력 영역 */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-y-auto">
        <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm z-10 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {year}년 {month + 1}월
            </h2>
            <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
              <button onClick={handlePrevMonth} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-300 transition-colors shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-zinc-700 rounded-md transition-colors shadow-sm">
                오늘
              </button>
              <button onClick={handleNextMonth} className="p-1.5 rounded-md hover:bg-white dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-300 transition-colors shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
          <button 
            onClick={handleCreateNew}
            className="hidden sm:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            새 일정
          </button>
        </div>

        <div className="p-6">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
              <div key={day} className={`text-center text-sm font-bold py-2 ${idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}`}>
                {day}
              </div>
            ))}
          </div>

          {/* 달력 그리드 */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            {paddingDays.map((_, i) => (
              <div key={`padding-${i}`} className="bg-gray-50 dark:bg-zinc-900/50 min-h-[100px] sm:min-h-[120px] p-2" />
            ))}
            
            {daysInMonth.map(day => {
              const dateStr = formatDateString(day);
              const dayEvents = events.filter(e => e.date === dateStr);
              const isToday = dateStr === formatDateString(new Date().getDate()) && month === new Date().getMonth() && year === new Date().getFullYear();
              const isSelected = selectedDate === dateStr;
              
              const dayOfWeek = new Date(year, month, day).getDay();
              const isSunday = dayOfWeek === 0;
              const isSaturday = dayOfWeek === 6;

              return (
                <div 
                  key={day}
                  onClick={() => handleDateClick(dateStr)}
                  className={`bg-white dark:bg-zinc-900 min-h-[100px] sm:min-h-[120px] p-2 cursor-pointer transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-900/10 flex flex-col gap-1 relative group
                    ${isSelected ? 'ring-2 ring-inset ring-blue-500 dark:ring-blue-400 bg-blue-50/30 dark:bg-blue-900/20' : ''}
                  `}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full
                      ${isToday ? 'bg-blue-600 text-white' : ''}
                      ${!isToday && isSunday ? 'text-red-500' : ''}
                      ${!isToday && isSaturday ? 'text-blue-500' : ''}
                      ${!isToday && !isSunday && !isSaturday ? 'text-gray-700 dark:text-gray-300' : ''}
                    `}>
                      {day}
                    </span>
                    <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition-opacity p-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    </button>
                  </div>
                  
                  <div className="flex flex-col gap-1 mt-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                    {dayEvents.map(event => (
                      <div 
                        key={event.id}
                        onClick={(e) => handleEventClick(e, event)}
                        className={`text-xs px-2 py-1.5 rounded-md truncate font-medium border
                          ${selectedEvent?.id === event.id 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                            : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
                          } transition-all`}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 우측 패널 */}
      <div className="w-full lg:w-96 flex flex-col border-l border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
        <div className="p-6 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            일정 상세내용
          </h3>
          {selectedDate && (
            <span className="text-sm font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-md">
              {selectedDate}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
              <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <p className="text-gray-500 font-medium">달력에서 날짜를 선택하거나<br/>일정을 클릭해주세요.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full animate-in fade-in duration-200">
              {isEditing ? (
                <div className="flex flex-col gap-4 flex-1">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">일정 제목</label>
                    <input 
                      type="text" 
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="제목을 입력하세요"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold"
                    />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">상세 내용 (선택)</label>
                    <textarea 
                      value={formContent}
                      onChange={(e) => setFormContent(e.target.value)}
                      placeholder="메모나 상세 내용을 입력하세요"
                      className="w-full flex-1 min-h-[200px] px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none leading-relaxed"
                    />
                  </div>
                </div>
              ) : selectedEvent ? (
                <div className="flex flex-col gap-6 flex-1">
                  <div>
                    <h4 className="text-xl font-black text-gray-900 dark:text-white mb-2">{selectedEvent.title}</h4>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {new Date(selectedEvent.created_at).toLocaleString()} 등록
                    </p>
                  </div>
                  
                  {selectedEvent.content && (
                    <div className="flex-1 bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-5 border border-gray-100 dark:border-zinc-800">
                      <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed text-sm">
                        {selectedEvent.content}
                      </p>
                    </div>
                  )}
                  {!selectedEvent.content && (
                    <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-xl">
                      <p className="text-gray-400 text-sm">작성된 내용이 없습니다.</p>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Actions */}
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-zinc-800 flex items-center gap-3 shrink-0">
                {isEditing ? (
                  <>
                    <button 
                      onClick={() => {
                        if (selectedEvent) {
                          setIsEditing(false);
                          setFormTitle(selectedEvent.title);
                          setFormContent(selectedEvent.content || '');
                        } else {
                          setSelectedDate(null);
                        }
                      }}
                      className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700 rounded-xl transition-colors"
                    >
                      취소
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={isLoading}
                      className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      {isLoading ? '저장 중...' : '저장하기'}
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={handleDelete}
                      disabled={isLoading}
                      className="flex-1 py-3 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-xl transition-colors disabled:opacity-50"
                    >
                      삭제
                    </button>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="flex-1 py-3 text-sm font-bold text-gray-900 bg-gray-100 hover:bg-gray-200 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200 rounded-xl transition-colors shadow-sm"
                    >
                      수정
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
