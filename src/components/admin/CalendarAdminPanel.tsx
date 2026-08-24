'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { AdminCalendarEvent } from '@/lib/supabase';
import AdminPanelLayout from './AdminPanelLayout';
import { AdminHeaderBar } from './AdminHeader';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumButton from '@/components/ui/PremiumButton';
import AppIcon from '@/components/ui/AppIcon';

export interface ClaimsProgressEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  tag?: string; // 통화, 서류, 병원, 절충, 종결, 일반
  text: string;
}

export interface ClaimsLedgerData {
  // 1. 기본 인적 및 접수 정보
  phone?: string;
  inflowPath?: string; // 홈페이지, 1:1채팅, 블로그, 전화, 지인소개
  birthDate?: string;
  gender?: '남' | '여';
  incomeNote?: string;
  
  // 2. 사고 및 보험 정보
  accidentDate?: string;
  accidentType?: string; // 교통사고, 산재사고, 안전사고, 질병사고, 기타
  insuranceCompany?: string;
  faultRatio?: string; // 0:100, 차대차, 차대인, 차대이륜차
  hasDashcam?: boolean;
  hasPhotos?: boolean;
  insuranceTypes?: string[]; // 대인, 자상, 배책, 장기
  
  // 3. 의료 및 치료 정보
  diagnosis?: string;
  hasPreExisting?: boolean;
  preExistingNote?: string;
  hasHospitalization?: boolean;
  hospitalizationPeriod?: string;
  
  // 4. 날짜별 상담일지 & 진행사항
  progressLogs?: ClaimsProgressEntry[];
  
  // 기타/호환 필드
  text?: string;
  time?: string;
  category?: '상담' | '실사' | '미팅' | '기타';
  sourceApp?: 'consultations' | 'chat';
  sourceId?: string;
}

interface ExtendedCalendarEvent extends AdminCalendarEvent {
  time?: string;
  category?: '상담' | '실사' | '미팅' | '기타';
  sourceApp?: 'consultations' | 'chat';
  sourceId?: string;
  ledger?: ClaimsLedgerData;
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

const TAG_STYLES: Record<string, string> = {
  통화: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
  서류: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400',
  병원: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400',
  절충: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400',
  종결: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
  일반: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-zinc-800 dark:text-gray-300'
};

export default function CalendarAdminPanel({ searchQuery = '', refreshCounter = 0 }: CalendarAdminPanelProps) {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => {
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }, [today]);

  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0 ~ 11
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [events, setEvents] = useState<ExtendedCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mobileTab, setMobileTab] = useState<'calendar' | 'ledger'>('calendar');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [expandedLedgerIds, setExpandedLedgerIds] = useState<Record<string, boolean>>({});
  const [inlineLogInputs, setInlineLogInputs] = useState<Record<string, { tag: string; text: string }>>({});
  const [editingLogState, setEditingLogState] = useState<{ eventId: string; logId: string; tag: string; date: string; time: string; text: string } | null>(null);

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [modalForm, setModalForm] = useState<{
    date: string;
    time: string;
    title: string;
    category: '상담' | '실사' | '미팅' | '기타';
    ledger: ClaimsLedgerData;
  }>({
    date: selectedDate,
    time: '14:00',
    title: '',
    category: '상담',
    ledger: {
      phone: '',
      inflowPath: '홈페이지',
      accidentType: '교통사고',
      hasPreExisting: false,
      hasHospitalization: false,
      progressLogs: []
    }
  });

  // ─── 1. 데이터 로드 & 파싱 (서버 API 통신) ───
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin-manage?table=admin_calendar_events');
      const json = await res.json();
      
      if (json.success && Array.isArray(json.data)) {
        const parsed = json.data.map((d: any) => {
          let extra: any = {};
          try {
            if (d.content && (d.content.startsWith('{') || d.content.startsWith('['))) {
              extra = JSON.parse(d.content);
            }
          } catch {
            // Ignored
          }

          // 구버전 평문 text 호환 파싱
          const ledgerData: ClaimsLedgerData = extra.ledger || {
            phone: extra.phone || '',
            inflowPath: extra.inflowPath || '홈페이지',
            accidentType: extra.accidentType || '교통사고',
            accidentDate: extra.accidentDate || '',
            insuranceCompany: extra.insuranceCompany || '',
            faultRatio: extra.faultRatio || '',
            diagnosis: extra.diagnosis || '',
            hasPreExisting: extra.hasPreExisting || false,
            preExistingNote: extra.preExistingNote || '',
            hasHospitalization: extra.hasHospitalization || false,
            hospitalizationPeriod: extra.hospitalizationPeriod || '',
            incomeNote: extra.incomeNote || '',
            progressLogs: extra.progressLogs || [],
            text: extra.text !== undefined ? extra.text : d.content
          };

          return {
            id: String(d.id),
            date: d.date,
            title: d.title,
            content: typeof d.content === 'string' ? d.content : JSON.stringify(d.content),
            time: extra.time || ledgerData.time || '10:00',
            category: extra.category || ledgerData.category || '상담',
            sourceApp: extra.sourceApp || ledgerData.sourceApp,
            sourceId: extra.sourceId || ledgerData.sourceId,
            ledger: ledgerData,
            created_at: d.created_at
          };
        });
        setEvents(parsed);
        localStorage.setItem('local_calendar_events', JSON.stringify(parsed));
      }
    } catch (err) {
      console.error('Fetch error:', err);
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

  // ─── 2. 상담/채팅에서 넘어온 pending_calendar_event 자동 연동 ───
  useEffect(() => {
    const pending = sessionStorage.getItem('pending_calendar_event');
    if (pending) {
      try {
        const payload = JSON.parse(pending);
        sessionStorage.removeItem('pending_calendar_event');

        // payload 내용에서 필드 자동 추출
        const rawText = payload.text || '';
        const phoneMatch = rawText.match(/연락처:\s*([0-9-]+)/);
        const accidentTypeMatch = rawText.match(/사고유형:\s*([^\n]+)/);
        const accidentDateMatch = rawText.match(/사고일자:\s*([0-9.-]+)/);
        const diagnosisMatch = rawText.match(/진단명:\s*([^\n]+)/);

        setModalForm({
          date: selectedDate,
          time: '14:00',
          title: payload.title || '',
          category: '상담',
          ledger: {
            phone: phoneMatch ? phoneMatch[1].trim() : '',
            inflowPath: payload.sourceApp === 'chat' ? '1:1채팅' : '홈페이지',
            accidentType: accidentTypeMatch ? accidentTypeMatch[1].trim() : '교통사고',
            accidentDate: accidentDateMatch ? accidentDateMatch[1].trim() : '',
            diagnosis: diagnosisMatch ? diagnosisMatch[1].trim() : '',
            hasPreExisting: false,
            hasHospitalization: false,
            text: rawText,
            sourceApp: payload.sourceApp,
            sourceId: payload.sourceId,
            progressLogs: [
              {
                id: Date.now().toString(),
                date: selectedDate,
                time: '14:00',
                tag: '일반',
                text: '최초 상담 접수 등록 완료.'
              }
            ]
          }
        });
        setEditingEventId(null);
        setIsModalOpen(true);
      } catch {
        sessionStorage.removeItem('pending_calendar_event');
      }
    }
  }, [selectedDate]);

  // 달력 날짜 그리드 계산
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

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

    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        dateStr: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        dayNum: d,
        isCurrentMonth: true
      });
    }

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
    setSelectedDate(todayStr);
  };

  // ─── 3. 대장 데이터 저장 (생성 / 수정 / 다음 업무일로 이동) ───
  const handleSaveEvent = async () => {
    if (!modalForm.title.trim()) {
      alert('일정 제목(고객명)을 입력해주세요.');
      return;
    }

    const fullPayload = {
      text: modalForm.ledger.text || '',
      time: modalForm.time,
      category: modalForm.category,
      sourceApp: modalForm.ledger.sourceApp,
      sourceId: modalForm.ledger.sourceId,
      ledger: modalForm.ledger
    };

    const eventPayload = {
      date: modalForm.date,
      title: modalForm.title,
      content: JSON.stringify(fullPayload)
    };

    try {
      if (editingEventId) {
        const res = await fetch(`/api/admin-manage?table=admin_calendar_events&id=${encodeURIComponent(editingEventId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: modalForm.date,
            title: modalForm.title,
            content: JSON.stringify(fullPayload)
          })
        });
        const json = await res.json();
        if (!json.success) alert('저장 실패: ' + (json.message || '오류 발생'));
      } else {
        const res = await fetch('/api/admin-manage?table=admin_calendar_events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: modalForm.date,
            title: modalForm.title,
            content: JSON.stringify(fullPayload)
          })
        });
        const json = await res.json();
        if (!json.success) alert('등록 실패: ' + (json.message || '오류 발생'));
      }
    } catch (err: any) {
      console.warn('API save warning:', err);
    }

    setIsModalOpen(false);
    fetchEvents();
  };

  // ─── 4. 인라인 업무일지 추가 (가로바 구분 누적) ───
  const handleAddInlineLog = async (eventItem: ExtendedCalendarEvent) => {
    const inputState = inlineLogInputs[eventItem.id] || { tag: '통화', text: '' };
    if (!inputState.text.trim()) {
      alert('진행사항 메모를 입력해주세요.');
      return;
    }

    const now = new Date();
    const curTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newEntry: ClaimsProgressEntry = {
      id: Date.now().toString(),
      date: todayStr,
      time: curTime,
      tag: inputState.tag || '통화',
      text: inputState.text.trim()
    };

    const currentLedger = eventItem.ledger || {};
    const updatedLogs = [...(currentLedger.progressLogs || []), newEntry];
    const updatedLedger: ClaimsLedgerData = {
      ...currentLedger,
      progressLogs: updatedLogs
    };

    const fullPayload = {
      text: updatedLedger.text || eventItem.content,
      time: eventItem.time || '10:00',
      category: eventItem.category || '상담',
      sourceApp: eventItem.sourceApp,
      sourceId: eventItem.sourceId,
      ledger: updatedLedger
    };

    // 1) State & LocalStorage 즉시 업데이트 (0ms 지연)
    setEvents(prev => {
      const next = prev.map(e => {
        if (String(e.id) === String(eventItem.id)) {
          return {
            ...e,
            ledger: updatedLedger,
            content: JSON.stringify(fullPayload)
          };
        }
        return e;
      });
      localStorage.setItem('local_calendar_events', JSON.stringify(next));
      return next;
    });

    // 2) 입력창 초기화
    setInlineLogInputs(prev => ({
      ...prev,
      [eventItem.id]: { tag: '통화', text: '' }
    }));

    // 3) 서버 API 영구 저장
    try {
      await fetch(`/api/admin-manage?table=admin_calendar_events&id=${encodeURIComponent(eventItem.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: JSON.stringify(fullPayload)
        })
      });
    } catch (err) {
      console.warn('API log update error:', err);
    }
  };

  // ─── 5. 인라인 업무일지 삭제 ───
  const handleDeleteInlineLog = async (eventItem: ExtendedCalendarEvent, logId: string) => {
    if (!window.confirm('이 진행일지 기록을 삭제하시겠습니까?')) return;

    const currentLedger = eventItem.ledger || {};
    const updatedLogs = (currentLedger.progressLogs || []).filter(l => l.id !== logId);
    const updatedLedger: ClaimsLedgerData = {
      ...currentLedger,
      progressLogs: updatedLogs
    };

    const fullPayload = {
      text: updatedLedger.text || eventItem.content,
      time: eventItem.time || '10:00',
      category: eventItem.category || '상담',
      sourceApp: eventItem.sourceApp,
      sourceId: eventItem.sourceId,
      ledger: updatedLedger
    };

    setEvents(prev => {
      const next = prev.map(e => String(e.id) === String(eventItem.id) ? { ...e, ledger: updatedLedger, content: JSON.stringify(fullPayload) } : e);
      localStorage.setItem('local_calendar_events', JSON.stringify(next));
      return next;
    });

    try {
      await fetch(`/api/admin-manage?table=admin_calendar_events&id=${encodeURIComponent(eventItem.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: JSON.stringify(fullPayload)
        })
      });
    } catch (err) {
      console.warn('API log delete error:', err);
    }
  };

  // ─── 5-B. 인라인 업무일지 수정 저장 ───
  const handleUpdateInlineLog = async (eventItem: ExtendedCalendarEvent, logId: string, newTag: string, newText: string) => {
    if (!newText.trim()) return;

    const currentLedger = eventItem.ledger || {};
    const updatedLogs = (currentLedger.progressLogs || []).map(l => {
      if (l.id === logId) {
        return { ...l, tag: newTag, text: newText.trim() };
      }
      return l;
    });

    const updatedLedger: ClaimsLedgerData = {
      ...currentLedger,
      progressLogs: updatedLogs
    };

    const fullPayload = {
      text: updatedLedger.text || eventItem.content,
      time: eventItem.time || '10:00',
      category: eventItem.category || '상담',
      sourceApp: eventItem.sourceApp,
      sourceId: eventItem.sourceId,
      ledger: updatedLedger
    };

    setEvents(prev => {
      const next = prev.map(e => String(e.id) === String(eventItem.id) ? { ...e, ledger: updatedLedger, content: JSON.stringify(fullPayload) } : e);
      localStorage.setItem('local_calendar_events', JSON.stringify(next));
      return next;
    });

    setEditingLogState(null);

    try {
      await fetch(`/api/admin-manage?table=admin_calendar_events&id=${encodeURIComponent(eventItem.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: JSON.stringify(fullPayload)
        })
      });
    } catch (err) {
      console.warn('API log update error:', err);
    }
  };

  // ─── 6. 일정 카드 영구 삭제 (서버 API 통신) ───
  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('정말 이 손해사정 일정을 영구 삭제하시겠습니까?')) return;
    
    // 1) React State 및 로컬스토리지에서 즉시 삭제 (화면 반응속도 0ms)
    setEvents(prev => {
      const next = prev.filter(e => String(e.id) !== String(id));
      localStorage.setItem('local_calendar_events', JSON.stringify(next));
      return next;
    });

    // 2) 서버 API를 통해 DB에서 영구 삭제
    try {
      const res = await fetch(`/api/admin-manage?table=admin_calendar_events&id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (!json.success) {
        console.warn('Delete notice:', json.message);
      }
    } catch (err) {
      console.error('Delete API error:', err);
    }

    // 3) 최신 목록 재동기화
    fetchEvents();
  };

  // 단일 통합 대장 렌더러 (데스크톱 & 모바일 100% 공통 사용)
  const renderLedgerContent = () => (
    <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden bg-gray-50/50 dark:bg-zinc-950/80">
      <AdminHeaderBar 
        icon={<AppIcon name="file-text" size={16} className="text-[var(--google-blue)] dark:text-[#8ab4f8]" />}
        tone="blue"
        title={
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-xs sm:text-sm text-[var(--google-blue)] dark:text-[#8ab4f8]">
              {selectedDate} 대장 ({selectedDateEvents.length}건)
            </span>
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
                ledger: {
                  phone: '',
                  inflowPath: '홈페이지',
                  accidentType: '교통사고',
                  hasPreExisting: false,
                  hasHospitalization: false,
                  progressLogs: []
                }
              });
              setEditingEventId(null);
              setIsModalOpen(true);
            }}
            className="px-2.5 py-1 text-[11px] font-bold bg-[var(--google-blue)] hover:bg-blue-700 text-white rounded-none transition-all shadow-sm flex items-center gap-1"
          >
            <AppIcon name="plus" size={12} /> 신규 등록
          </button>
        }
      />

      {/* 대장 카드 목록: 내부 독립 스크롤 */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-4 space-y-4 custom-scrollbar">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">대장 데이터를 불러오는 중...</div>
        ) : selectedDateEvents.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-3 flex flex-col items-center">
            <AppIcon name="coffee" size={32} className="text-gray-300 dark:text-zinc-700" />
            <p className="text-xs font-medium leading-relaxed">
              이 날짜에 등록된 손해사정 대장이 없습니다.<br/>
              상단의 <b>[+ 신규 등록]</b> 버튼을 눌러보세요.
            </p>
          </div>
        ) : (
          selectedDateEvents.map(ev => {
            const style = CATEGORY_COLORS[ev.category || '상담'] || CATEGORY_COLORS.상담;
            const ledger = ev.ledger || {};
            const isExpanded = !!expandedLedgerIds[ev.id];
            const logInput = inlineLogInputs[ev.id] || { tag: '통화', text: '' };

            return (
              <div
                key={ev.id}
                className="bg-white dark:bg-[#202124] border border-gray-200/80 dark:border-zinc-800 rounded-none p-3.5 shadow-sm space-y-2.5"
              >
                {/* 카드 상단: 상태, 시간, 버튼 */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-none border ${style.badge}`}>
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
                          ledger: {
                            ...ledger,
                            sourceApp: ev.sourceApp,
                            sourceId: ev.sourceId
                          }
                        });
                        setIsModalOpen(true);
                      }}
                      className="text-xs text-gray-500 hover:text-blue-600 px-1.5 py-0.5 font-bold flex items-center gap-1 rounded-none hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-transparent hover:border-blue-200"
                      title="대장 수정 / 날짜 이동"
                    >
                      <AppIcon name="edit" size={12} />
                      <span>수정</span>
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(ev.id)}
                      className="text-xs text-gray-400 hover:text-red-500 p-1 rounded-none hover:bg-red-50 dark:hover:bg-red-950/40"
                      title="삭제"
                    >
                      <AppIcon name="trash" size={13} />
                    </button>
                  </div>
                </div>

                {/* 고객명 및 핵심 요약 */}
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900 dark:text-white leading-snug">
                    {ev.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 dark:text-gray-300">
                    {ledger.phone && (
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <AppIcon name="phone" size={12} /> {ledger.phone}
                      </span>
                    )}
                    {ledger.accidentType && (
                      <span className="px-1.5 py-0.2 bg-gray-100 dark:bg-zinc-800 rounded-none text-[10.5px] font-bold">
                        {ledger.accidentType}
                      </span>
                    )}
                    {ledger.diagnosis && (
                      <span className="truncate text-gray-500 text-[11px]">
                        진단: {ledger.diagnosis}
                      </span>
                    )}
                  </div>
                </div>

                {/* 실무 대장 상세 아코디언 토글 버튼 */}
                <button
                  onClick={() => setExpandedLedgerIds(prev => ({ ...prev, [ev.id]: !prev[ev.id] }))}
                  className="w-full py-1 px-2.5 bg-gray-50 dark:bg-zinc-950 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-none border border-gray-200/80 dark:border-zinc-800 flex items-center justify-between transition-colors shadow-2xs"
                >
                  <span className="flex items-center gap-1.5"><AppIcon name="file-text" size={12} /> 실무 대장 상세 정보</span>
                  <span>{isExpanded ? '▲ 접기' : '▼ 펼치기'}</span>
                </button>

                {/* 실무 대장 상세 필드 (펼쳤을 때) */}
                {isExpanded && (
                  <div className="p-3 bg-gray-50/80 dark:bg-zinc-900/60 rounded-none border border-gray-200/70 dark:border-zinc-800 space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-gray-600 dark:text-gray-300">
                      <div><span className="text-gray-400">유입경로:</span> <b className="text-gray-800 dark:text-gray-200">{ledger.inflowPath || '-'}</b></div>
                      <div><span className="text-gray-400">생년월일/성별:</span> <b className="text-gray-800 dark:text-gray-200">{ledger.birthDate || '-'}{ledger.gender ? ` (${ledger.gender})` : ''}</b></div>
                      <div><span className="text-gray-400">사고일자:</span> <b className="text-gray-800 dark:text-gray-200">{ledger.accidentDate || '-'}</b></div>
                      <div><span className="text-gray-400">사고유형:</span> <b className="text-gray-800 dark:text-gray-200">{ledger.accidentType || '-'}</b></div>
                      <div><span className="text-gray-400">입원/통원:</span> <b className="text-gray-800 dark:text-gray-200">{ledger.hasHospitalization ? `입원 (${ledger.hospitalizationPeriod || ''})` : '통원/무'}</b></div>
                      <div><span className="text-gray-400">기왕증여부:</span> <b className="text-gray-800 dark:text-gray-200">{ledger.hasPreExisting ? `유 (${ledger.preExistingNote || ''})` : '무'}</b></div>
                      {ledger.faultRatio && <div><span className="text-gray-400">과실비율:</span> <b className="text-blue-600 dark:text-blue-400">{ledger.faultRatio}</b></div>}
                      {ledger.incomeNote && <div><span className="text-gray-400">소득사항:</span> <b className="text-gray-800 dark:text-gray-200">{ledger.incomeNote}</b></div>}
                      {ledger.insuranceCompany && <div className="col-span-2"><span className="text-gray-400">보험회사:</span> <b className="text-gray-800 dark:text-gray-200">{ledger.insuranceCompany}</b></div>}
                    </div>

                    {ledger.text && (
                      <div className="p-2 bg-white dark:bg-zinc-950 rounded-none border border-gray-200/50 dark:border-zinc-800 text-gray-700 dark:text-gray-300 leading-relaxed">
                        <div className="text-[10.5px] font-bold text-gray-400 mb-0.5">상담 및 접수 내용</div>
                        {ledger.text}
                      </div>
                    )}
                  </div>
                )}

                {/* 진행사항 업무일지 목록 (히스토리) */}
                {ledger.progressLogs && ledger.progressLogs.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-bold text-gray-500 flex items-center justify-between">
                      <span>진행사항 히스토리 ({ledger.progressLogs.length}건)</span>
                    </div>
                    <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {ledger.progressLogs.map(log => {
                        const isEditingThis = editingLogState?.eventId === ev.id && editingLogState?.logId === log.id;

                        if (isEditingThis) {
                          return (
                            <div key={log.id} className="p-2 bg-blue-50/80 dark:bg-blue-950/40 rounded-none border border-blue-200 dark:border-blue-800 space-y-1.5">
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={editingLogState.tag}
                                  onChange={e => setEditingLogState(prev => prev ? { ...prev, tag: e.target.value } : null)}
                                  className="p-1 bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-700 text-[10px] font-bold rounded-none outline-none"
                                >
                                  <option value="통화">통화</option>
                                  <option value="면담">면담</option>
                                  <option value="서류">서류</option>
                                  <option value="병원">병원</option>
                                  <option value="절충">절충</option>
                                  <option value="종결">종결</option>
                                </select>
                                <span className="font-mono text-[10px] text-gray-400">{log.date} {log.time}</span>
                              </div>
                              <input
                                type="text"
                                value={editingLogState.text}
                                onChange={e => setEditingLogState(prev => prev ? { ...prev, text: e.target.value } : null)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleUpdateInlineLog(ev, log.id, editingLogState.tag, editingLogState.text);
                                  }
                                }}
                                className="w-full p-1.5 text-xs bg-white dark:bg-zinc-900 border border-blue-300 dark:border-blue-600 rounded-none outline-none"
                                autoFocus
                              />
                              <div className="flex justify-end gap-1">
                                <button
                                  onClick={() => setEditingLogState(null)}
                                  className="px-2 py-0.5 text-[10px] font-bold bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-none"
                                >
                                  취소
                                </button>
                                <button
                                  onClick={() => handleUpdateInlineLog(ev, log.id, editingLogState.tag, editingLogState.text)}
                                  className="px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-none shadow-2xs hover:bg-blue-700"
                                >
                                  저장
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={log.id}
                            className="text-[11px] p-2 bg-gray-50 dark:bg-zinc-900 rounded-none border border-gray-200/60 dark:border-zinc-800 flex items-start justify-between gap-1.5 group/log"
                          >
                            <div className="space-y-0.5 flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 font-mono text-[10px] text-gray-400">
                                <span className="font-bold text-blue-600 dark:text-blue-400 px-1 bg-blue-50 dark:bg-blue-900/30 rounded-none">
                                  {log.tag || '일반'}
                                </span>
                                <span>{log.date} {log.time}</span>
                              </div>
                              <p className="text-gray-800 dark:text-gray-200 break-keep leading-tight font-medium">
                                {log.text}
                              </p>
                            </div>
                            <div className="flex flex-col items-center justify-center gap-0.5 shrink-0 ml-1 opacity-80 group-hover/log:opacity-100">
                              <button
                                onClick={() => setEditingLogState({
                                  eventId: ev.id,
                                  logId: log.id,
                                  tag: log.tag || '통화',
                                  date: log.date || new Date().toISOString().split('T')[0],
                                  time: log.time || '10:00',
                                  text: log.text
                                })}
                                className="p-1 text-gray-400 hover:text-blue-600 rounded-none hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                                title="일지 수정"
                              >
                                <AppIcon name="edit" size={11} />
                              </button>
                              <button
                                onClick={() => handleDeleteInlineLog(ev, log.id)}
                                className="p-1 text-gray-300 hover:text-red-500 rounded-none hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                title="일지 삭제"
                              >
                                <AppIcon name="trash" size={11} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 신규 진행사항 인라인 빠른 작성 칸 */}
                <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 flex items-center gap-1.5">
                  <select
                    value={logInput.tag}
                    onChange={e => setInlineLogInputs(prev => ({
                      ...prev,
                      [ev.id]: { ...(prev[ev.id] || { text: '' }), tag: e.target.value }
                    }))}
                    className="p-1.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-[11px] font-bold rounded-none outline-none shrink-0"
                  >
                    <option value="통화">통화</option>
                    <option value="면담">면담</option>
                    <option value="서류">서류</option>
                    <option value="병원">병원</option>
                    <option value="절충">절충</option>
                    <option value="종결">종결</option>
                  </select>

                  <input
                    type="text"
                    placeholder="새 진행사항 메모 후 엔터..."
                    value={logInput.text}
                    onChange={e => setInlineLogInputs(prev => ({
                      ...prev,
                      [ev.id]: { ...(prev[ev.id] || { tag: '통화' }), text: e.target.value }
                    }))}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddInlineLog(ev);
                      }
                    }}
                    className="flex-1 p-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-xs rounded-none outline-none focus:border-blue-500 min-w-0"
                  />

                  <button
                    onClick={() => handleAddInlineLog(ev)}
                    className="px-2.5 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold rounded-none hover:bg-black transition-colors shrink-0"
                  >
                    기록
                  </button>
                </div>

                {/* 원본 접수/채팅 바로가기 링크 */}
                {ev.sourceApp && (
                  <button
                    onClick={() => handleJumpToSource(ev)}
                    className="w-full py-1 px-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-none transition-colors flex items-center justify-center gap-1.5 border border-blue-200 dark:border-blue-800"
                  >
                    <AppIcon name="link" size={12} />
                    <span>{ev.sourceApp === 'consultations' ? '원본 상담 접수내역 보기' : '채팅방 바로가기'}</span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

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
      const matchesSearch = !searchQuery || 
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (e.ledger?.phone || '').includes(searchQuery) ||
        (e.ledger?.diagnosis || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.content || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDate && matchesSearch;
    }).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [events, selectedDate, searchQuery]);

  return (
    <AdminPanelLayout innerClassName="flex-col md:flex-row gap-2.5 min-w-0 h-full">
      {/* 모바일 전용 뷰 전환 세그먼트 탭 (100% 풀스크린 전환) */}
      <div className="md:hidden flex bg-gray-200/80 dark:bg-zinc-800 p-1 rounded-none gap-1 shrink-0">
        <button
          onClick={() => setMobileTab('calendar')}
          className={`flex-1 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'calendar'
              ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          <AppIcon name="calendar" size={14} />
          <span>월간 달력</span>
        </button>
        <button
          onClick={() => setMobileTab('ledger')}
          className={`flex-1 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'ledger'
              ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          <AppIcon name="file-text" size={14} />
          <span>실무 대장 ({selectedDateEvents.length}건)</span>
        </button>
      </div>

      {/* ── 🏝️ 1. 월간 캘린더 그리드 카드 아일랜드 (모바일: 100% 풀스크린) ── */}
      <PremiumCard borderColor="blue" hoverEffect={false} className={`${mobileTab === 'calendar' ? 'flex' : 'hidden'} md:flex flex-1 min-w-0 min-h-0 flex-col !p-0 overflow-hidden bg-white dark:bg-zinc-950`}>
        <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-y-auto custom-scrollbar">
          {/* 캘린더 네비게이션 헤더 (CommonBox 스타일) */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-50/80 to-transparent dark:from-blue-900/20 dark:to-transparent border-b border-blue-100/80 dark:border-blue-900/30 flex items-center justify-between shrink-0 sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              <AppIcon name="calendar" size={16} className="text-[var(--google-blue)] dark:text-[#8ab4f8]" />
              <h2 className="text-xs sm:text-sm font-extrabold text-[var(--google-blue)] dark:text-[#8ab4f8] flex items-center gap-1.5">
                <span>{currentYear}년 {currentMonth + 1}월</span>
              </h2>
              <button
                onClick={handleGoToday}
                className="px-2 py-0.5 text-[11px] font-bold bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 rounded-none border border-blue-200 dark:border-blue-800 hover:bg-blue-50 transition-colors shadow-2xs"
              >
                오늘
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="w-7 h-7 rounded-none flex items-center justify-center bg-white dark:bg-zinc-800 border border-blue-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-zinc-700 transition-colors shadow-2xs text-xs"
                title="이전 달"
              >
                <AppIcon name="chevron-left" size={12} />
              </button>
              <button
                onClick={handleNextMonth}
                className="w-7 h-7 rounded-none flex items-center justify-center bg-white dark:bg-zinc-800 border border-blue-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-zinc-700 transition-colors shadow-2xs text-xs"
                title="다음 달"
              >
                <AppIcon name="chevron-right" size={12} />
              </button>
            </div>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b border-gray-200/80 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-900/50 text-center py-1.5 text-xs font-bold">
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
                  onClick={() => {
                    setSelectedDate(day.dateStr);
                    setMobileTab('ledger');
                  }}
                  className={`min-h-[85px] md:min-h-[100px] p-1.5 md:p-2 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected 
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500 ring-inset z-10' 
                      : 'hover:bg-white dark:hover:bg-zinc-900 bg-white/60 dark:bg-zinc-950/60'
                  } ${!day.isCurrentMonth ? 'opacity-35' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs md:text-sm font-bold w-5 h-5 flex items-center justify-center rounded-none ${
                      isToday 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : isSunday 
                          ? 'text-red-500' 
                          : isSaturday 
                            ? 'text-blue-500' 
                            : 'text-gray-800 dark:text-gray-200'
                    }`}>
                      {day.dayNum}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-900/30 px-1 rounded-none border border-blue-200 dark:border-blue-800">
                        {dayEvents.length}건
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map(ev => {
                      const style = CATEGORY_COLORS[ev.category || '상담'] || CATEGORY_COLORS.상담;
                      return (
                        <div
                          key={ev.id}
                          className={`text-[10px] md:text-[10.5px] font-medium truncate px-1.5 py-0.5 rounded-none border ${style.badge} flex items-center gap-1 shadow-2xs`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-none ${style.dot} shrink-0`}></span>
                          <span className="truncate font-bold">{ev.title}</span>
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
      </PremiumCard>

      {/* ── 🏝️ 2. 선택 일자 손해사정 실무 대장 카드 아일랜드 (모바일: 100% 풀스크린 / 데스크톱: 우측 2열) ── */}
      <PremiumCard borderColor="blue" hoverEffect={false} className={`${mobileTab === 'ledger' ? 'flex' : 'hidden'} md:flex flex-1 md:flex-initial w-full md:w-[380px] lg:w-[440px] shrink-0 min-h-0 flex-col !p-0 overflow-hidden bg-gray-50/50 dark:bg-zinc-950/80`}>
        {renderLedgerContent()}
      </PremiumCard>

      {/* ── 손해사정 실무 대장 등록 / 수정 모달 (z-[110] 최상단 레이어 보장) ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-[#202124] rounded-none max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-gray-200 dark:border-zinc-800 space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <AppIcon name="file-text" size={16} className="text-blue-600" />
                <span>{editingEventId ? '손해사정 대장 수정 / 다음 예정일 이동' : '신규 손해사정 대장 등록'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* 1. 기본 일정 및 고객명 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">고객명 / 대장 제목 *</label>
                  <input
                    type="text"
                    value={modalForm.title}
                    onChange={e => setModalForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="예: [예약접수] 박선미"
                    className="w-full p-2 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-none text-xs font-bold text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">전화번호</label>
                  <input
                    type="text"
                    value={modalForm.ledger.phone || ''}
                    onChange={e => setModalForm(prev => ({ ...prev, ledger: { ...prev.ledger, phone: e.target.value } }))}
                    placeholder="010-0000-0000"
                    className="w-full p-2 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-none text-xs font-mono text-gray-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* 2. 업무예정일(캘린더 날짜) 및 시간 */}
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-none border border-blue-100 dark:border-blue-900/40 grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-blue-900 dark:text-blue-300 mb-1 flex items-center gap-1.5">
                    <AppIcon name="calendar" size={13} />
                    업무 예정일 (캘린더 등록일)
                  </label>
                  <input
                    type="date"
                    value={modalForm.date}
                    onChange={e => setModalForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full p-2 bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-800 rounded-none text-xs font-bold text-gray-900 dark:text-white outline-none"
                  />
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 block">
                    * 날짜를 바꾸면 해당 일자 캘린더로 카드가 이동합니다.
                  </span>
                </div>
                <div>
                  <label className="block font-bold text-blue-900 dark:text-blue-300 mb-1">시간</label>
                  <input
                    type="time"
                    value={modalForm.time}
                    onChange={e => setModalForm(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full p-2 bg-white dark:bg-zinc-900 border border-blue-200 dark:border-blue-800 rounded-none text-xs font-mono text-gray-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* 3. 사고 및 보험 정보 */}
              <div className="p-3 bg-gray-50 dark:bg-zinc-950 rounded-none border border-gray-200 dark:border-zinc-800 space-y-2.5">
                <div className="font-bold text-gray-800 dark:text-gray-200 text-xs flex items-center gap-1.5">
                  <AppIcon name="car" size={14} className="text-blue-600" />
                  사고 및 보험 정보
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-gray-500 text-[11px] mb-1">사고유형</label>
                    <select
                      value={modalForm.ledger.accidentType || '교통사고'}
                      onChange={e => setModalForm(prev => ({ ...prev, ledger: { ...prev.ledger, accidentType: e.target.value } }))}
                      className="w-full p-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none text-xs font-bold"
                    >
                      <option value="교통사고">교통사고</option>
                      <option value="산재사고">산재사고</option>
                      <option value="안전사고">안전·배책사고</option>
                      <option value="질병사고">질병·실손사고</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-500 text-[11px] mb-1">사고일자</label>
                    <input
                      type="date"
                      value={modalForm.ledger.accidentDate || ''}
                      onChange={e => setModalForm(prev => ({ ...prev, ledger: { ...prev.ledger, accidentDate: e.target.value } }))}
                      className="w-full p-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-500 text-[11px] mb-1">상대 보험회사</label>
                    <input
                      type="text"
                      value={modalForm.ledger.insuranceCompany || ''}
                      onChange={e => setModalForm(prev => ({ ...prev, ledger: { ...prev.ledger, insuranceCompany: e.target.value } }))}
                      placeholder="예: 현대해상, 삼성화재"
                      className="w-full p-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none text-xs"
                    />
                  </div>
                </div>

                {/* 과실비율 및 세부 메모 */}
                <div>
                  <label className="block text-gray-500 text-[11px] mb-1">과실비율 / 사고형태 메모</label>
                  <input
                    type="text"
                    value={modalForm.ledger.faultRatio || ''}
                    onChange={e => setModalForm(prev => ({ ...prev, ledger: { ...prev.ledger, faultRatio: e.target.value } }))}
                    placeholder="예: 0:100 차대차, 블랙박스 영상 확보 완료"
                    className="w-full p-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none text-xs"
                  />
                </div>
              </div>

              {/* 4. 의료 및 병력 정보 */}
              <div className="p-3 bg-gray-50 dark:bg-zinc-950 rounded-none border border-gray-200 dark:border-zinc-800 space-y-2.5">
                <div className="font-bold text-gray-800 dark:text-gray-200 text-xs flex items-center gap-1.5">
                  <AppIcon name="hospital" size={14} className="text-green-600" />
                  의료 및 치료 정보
                </div>
                
                <div>
                  <label className="block text-gray-500 text-[11px] mb-1">진단병명</label>
                  <input
                    type="text"
                    value={modalForm.ledger.diagnosis || ''}
                    onChange={e => setModalForm(prev => ({ ...prev, ledger: { ...prev.ledger, diagnosis: e.target.value } }))}
                    placeholder="예: 비골신경마비, 요추 4-5번 추간판탈출증"
                    className="w-full p-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none text-xs"
                  />
                </div>

                {/* 기왕병력 유/무 토글 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-500 text-[11px] mb-1">기왕병력 (기여도 분쟁)</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setModalForm(prev => ({ ...prev, ledger: { ...prev.ledger, hasPreExisting: false } }))}
                        className={`flex-1 py-1.5 rounded-none font-bold border transition-colors ${
                          !modalForm.ledger.hasPreExisting ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-zinc-900 text-gray-600 border-gray-200 dark:border-zinc-700'
                        }`}
                      >
                        무 (없음)
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalForm(prev => ({ ...prev, ledger: { ...prev.ledger, hasPreExisting: true } }))}
                        className={`flex-1 py-1.5 rounded-none font-bold border transition-colors ${
                          modalForm.ledger.hasPreExisting ? 'bg-amber-600 text-white border-amber-600' : 'bg-white dark:bg-zinc-900 text-gray-600 border-gray-200 dark:border-zinc-700'
                        }`}
                      >
                        유 (있음)
                      </button>
                    </div>
                  </div>

                  {modalForm.ledger.hasPreExisting && (
                    <div>
                      <label className="block text-gray-500 text-[11px] mb-1">기왕증 세부 메모</label>
                      <input
                        type="text"
                        value={modalForm.ledger.preExistingNote || ''}
                        onChange={e => setModalForm(prev => ({ ...prev, ledger: { ...prev.ledger, preExistingNote: e.target.value } }))}
                        placeholder="예: 2018년 디스크 시술 이력 있음"
                        className="w-full p-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none text-xs"
                      />
                    </div>
                  )}
                </div>

                {/* 입원치료 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-500 text-[11px] mb-1">입원치료 여부</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setModalForm(prev => ({ ...prev, ledger: { ...prev.ledger, hasHospitalization: false } }))}
                        className={`flex-1 py-1.5 rounded-none font-bold border transition-colors ${
                          !modalForm.ledger.hasHospitalization ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-zinc-900 text-gray-600 border-gray-200 dark:border-zinc-700'
                        }`}
                      >
                        통원치료만 (입원 무)
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalForm(prev => ({ ...prev, ledger: { ...prev.ledger, hasHospitalization: true } }))}
                        className={`flex-1 py-1.5 rounded-none font-bold border transition-colors ${
                          modalForm.ledger.hasHospitalization ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-zinc-900 text-gray-600 border-gray-200 dark:border-zinc-700'
                        }`}
                      >
                        입원치료 있음
                      </button>
                    </div>
                  </div>

                  {modalForm.ledger.hasHospitalization && (
                    <div>
                      <label className="block text-gray-500 text-[11px] mb-1">입원기간 / 일수</label>
                      <input
                        type="text"
                        value={modalForm.ledger.hospitalizationPeriod || ''}
                        onChange={e => setModalForm(prev => ({ ...prev, ledger: { ...prev.ledger, hospitalizationPeriod: e.target.value } }))}
                        placeholder="예: 2024.10.06 ~ 10.20 (14일간)"
                        className="w-full p-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 5. 소득사항 / 직업 */}
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">소득사항 / 직업 (휴업손해 산정용)</label>
                <input
                  type="text"
                  value={modalForm.ledger.incomeNote || ''}
                  onChange={e => setModalForm(prev => ({ ...prev, ledger: { ...prev.ledger, incomeNote: e.target.value } }))}
                  placeholder="예: 급여소득자 월 350만 원 (원천징수 영수증 확보)"
                  className="w-full p-2 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-700 rounded-none text-xs"
                />
              </div>

            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
              <PremiumButton
                onClick={() => setIsModalOpen(false)}
                variant="secondary"
                className="flex-1 !py-2.5 !text-xs !rounded-none"
              >
                취소
              </PremiumButton>
              <PremiumButton
                onClick={handleSaveEvent}
                variant="primary"
                className="flex-1 !py-2.5 !text-xs !rounded-none shadow-md"
              >
                {editingEventId ? '대장 수정 / 예정일 이동 완료' : '대장 등록'}
              </PremiumButton>
            </div>
          </div>
        </div>
      )}
    </AdminPanelLayout>
  );
}
