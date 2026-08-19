'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Consultation, ConsultationProgressLog } from '@/lib/supabase';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumBadge from '@/components/ui/PremiumBadge';
import PremiumButton from '@/components/ui/PremiumButton';
import { AdminStatusSelect } from './AdminStatusSelect';
import AdminPanelLayout from './AdminPanelLayout';
import { AdminTableHeader, AdminHeaderBar } from './AdminHeader';

interface ConsultationAdminPanelProps {
  isSplitView: boolean;
  onNavigateToManage: () => void;
  searchQuery: string;
  sortType: string;
  refreshCounter: number;
}

const STAGE_COLORS: Record<string, { badge: string; text: string; bg: string }> = {
  접수대기: { badge: 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-300 border-gray-200', text: 'text-gray-600', bg: 'bg-gray-50' },
  서류검토: { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-blue-200', text: 'text-blue-600', bg: 'bg-blue-50' },
  현장실사: { badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-amber-200', text: 'text-amber-600', bg: 'bg-amber-50' },
  보험사절충: { badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 border-purple-200', text: 'text-purple-600', bg: 'bg-purple-50' },
  종결완료: { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-emerald-200', text: 'text-emerald-600', bg: 'bg-emerald-50' },
  기타: { badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200', text: 'text-slate-600', bg: 'bg-slate-50' }
};

export default function ConsultationAdminPanel({ onNavigateToManage, searchQuery, sortType, refreshCounter }: ConsultationAdminPanelProps) {
  // 상단 2단 탭: 'list' (접수 목록) | 'ledger' (날짜별 진행대장)
  const [activeTab, setActiveTab] = useState<'list' | 'ledger'>('list');

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [logs, setLogs] = useState<ConsultationProgressLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 진행대장 탭 날짜 필터 (기본값: 오늘)
  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);
  const [ledgerDateFilter, setLedgerDateFilter] = useState<string>(todayStr);
  const [ledgerDateMode, setLedgerDateMode] = useState<'today' | 'all' | 'custom'>('today');

  // 신규 업무일지 작성 폼
  const [logForm, setLogForm] = useState<{
    stage: '접수대기' | '서류검토' | '현장실사' | '보험사절충' | '종결완료' | '기타';
    content: string;
  }>({
    stage: '서류검토',
    content: ''
  });

  // ─── 1. 데이터 로드 (상담 목록 + 진행대장 로그) ───
  const fetchConsultations = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching consultations:', error);
      } else {
        setConsultations((data || []).filter(c => c.status !== '삭제'));
      }

      // 진행대장 로그 로드 (Supabase 또는 로컬 캐시)
      const localLogs = localStorage.getItem('consultation_progress_logs');
      if (localLogs) {
        setLogs(JSON.parse(localLogs));
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConsultations();

    const subscription = supabase
      .channel('public:consultations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consultations' }, payload => {
        if (payload.eventType === 'INSERT') {
          setConsultations(prev => [payload.new as Consultation, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          if ((payload.new as Consultation).status === '삭제') {
            setConsultations(prev => prev.filter(c => c.id !== payload.new.id));
          } else {
            setConsultations(prev => prev.map(c => c.id === payload.new.id ? payload.new as Consultation : c));
          }
        } else if (payload.eventType === 'DELETE') {
          setConsultations(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchConsultations]);

  useEffect(() => {
    if (refreshCounter > 0) {
      fetchConsultations();
    }
  }, [refreshCounter, fetchConsultations]);

  useEffect(() => {
    const pendingId = sessionStorage.getItem('pending_select_id');
    if (pendingId) {
      setSelectedId(pendingId);
      setActiveTab('list');
      onNavigateToManage();
      sessionStorage.removeItem('pending_select_id');
    }
  }, [onNavigateToManage]);

  useEffect(() => {
    const handleCloseDetail = () => {
      setSelectedId(null);
    };
    window.addEventListener('close-consultation-detail', handleCloseDetail);
    return () => {
      window.removeEventListener('close-consultation-detail', handleCloseDetail);
    };
  }, []);

  // ─── 2. 상태 업데이트 (표준 Supabase SDK 직접 호출) ───
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('consultations')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setConsultations(prev => prev.map(c => c.id === id ? { ...c, status: newStatus as Consultation['status'] } : c));
    } catch (err: any) {
      alert(`상태 업데이트 중 오류 발생: ${err.message}`);
    }
  };

  // ─── 3. 삭제 (표준 Supabase SDK 직접 호출) ───
  const deleteConsultation = async (id: string) => {
    if (!window.confirm('정말로 이 접수 내역을 삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase
        .from('consultations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      if (selectedId === id) setSelectedId(null);
      setConsultations(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert(`삭제 중 오류 발생: ${err.message}`);
    }
  };

  // ─── 4. 신규 업무일지(진행로그) 등록 ───
  const handleAddProgressLog = (consultationId: string) => {
    if (!logForm.content.trim()) {
      alert('업무일지 내용을 입력해주세요.');
      return;
    }

    const target = consultations.find(c => c.id === consultationId);
    if (!target) return;

    const now = new Date();
    const curDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const curTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newLog: ConsultationProgressLog = {
      id: Date.now().toString(),
      consultation_id: consultationId,
      client_name: target.name,
      client_phone: target.phone,
      date: curDate,
      time: curTime,
      stage: logForm.stage,
      content: logForm.content,
      created_at: now.toISOString()
    };

    const updated = [newLog, ...logs];
    setLogs(updated);
    localStorage.setItem('consultation_progress_logs', JSON.stringify(updated));
    setLogForm({ stage: '서류검토', content: '' });
  };

  // ─── 5. 진행로그 삭제 ───
  const handleDeleteProgressLog = (logId: string) => {
    if (!window.confirm('이 업무일지 기록을 삭제하시겠습니까?')) return;
    const updated = logs.filter(l => l.id !== logId);
    setLogs(updated);
    localStorage.setItem('consultation_progress_logs', JSON.stringify(updated));
  };

  // ─── 6. 엑셀 CSV 다운로드 ───
  const handleExportCsv = () => {
    if (filteredLedgerLogs.length === 0) {
      alert('내보낼 진행대장 데이터가 없습니다.');
      return;
    }

    const headers = ['일자', '시간', '고객명', '연락처', '진행단계', '업무내용'];
    const rows = filteredLedgerLogs.map(l => [
      l.date,
      l.time || '',
      `"${l.client_name || ''}"`,
      `"${l.client_phone || ''}"`,
      `"${l.stage}"`,
      `"${(l.content || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `보상스쿨_상담진행대장_${ledgerDateMode === 'today' ? todayStr : '전체'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ─── 7. 클립보드 표 복사 ───
  const handleCopyLedgerTable = async () => {
    if (filteredLedgerLogs.length === 0) {
      alert('복사할 진행대장 데이터가 없습니다.');
      return;
    }

    let text = `[보상스쿨 상담진행대장]\n일자\t시간\t고객명\t연락처\t진행단계\t업무내용\n`;
    filteredLedgerLogs.forEach(l => {
      text += `${l.date}\t${l.time || ''}\t${l.client_name || ''}\t${l.client_phone || ''}\t${l.stage}\t${l.content}\n`;
    });

    try {
      await navigator.clipboard.writeText(text);
      alert('✅ 진행대장이 클립보드에 표 형식(탭 구분)으로 복사되었습니다!\n엑셀이나 한글에서 Ctrl+V로 붙여넣으세요.');
    } catch {
      alert('클립보드 복사 실패');
    }
  };

  // 검색 및 정렬 필터
  const sortedAndFilteredConsultations = useMemo(() => {
    return [...consultations]
      .filter(item => {
        const query = searchQuery.toLowerCase();
        const contentMatch = item.content?.toLowerCase().includes(query) || false;
        const inquiryMatch = item.inquiry?.toLowerCase().includes(query) || false;
        const nameMatch = item.name?.toLowerCase().includes(query) || false;
        return nameMatch || contentMatch || inquiryMatch;
      })
      .sort((a, b) => {
        if (sortType === 'date') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        } else {
          return (a.name || '').localeCompare(b.name || '');
        }
      });
  }, [consultations, searchQuery, sortType]);

  // 진행대장 필터링된 로그 목록
  const filteredLedgerLogs = useMemo(() => {
    return logs.filter(l => {
      const matchDate = ledgerDateMode === 'all' ? true : l.date === ledgerDateFilter;
      const matchQuery = !searchQuery || 
        (l.client_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
        (l.content || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.stage.includes(searchQuery);
      return matchDate && matchQuery;
    });
  }, [logs, ledgerDateMode, ledgerDateFilter, searchQuery]);

  const handleRowClick = (id: string) => {
    setSelectedId(prev => prev === id ? null : id);
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const DD = String(d.getDate()).padStart(2, '0');
    const HH = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${MM}.${DD}.${HH}:${mm}`;
  };

  const formatAccidentDate = (dateString: string) => {
    if (!dateString) return '';
    return dateString.replace(/-/g, '.') + '.';
  };

  const activeConsultation = consultations.find(c => c.id === selectedId);
  const activeConsultationLogs = logs.filter(l => l.consultation_id === selectedId);

  // ─── 고객 상세 아코디언 (업무일지 타임라인 포함) ───
  const renderAccordionDetail = () => {
    if (!activeConsultation) return null;
    return (
      <div className="bg-[#f8f9fa] dark:bg-zinc-950/50 p-4 md:p-6 shadow-[inset_0_4px_6px_rgba(0,0,0,0.02)] border-b border-gray-100 dark:border-zinc-800 animate-in slide-in-from-top-4 fade-in duration-300 w-full" onClick={e => e.stopPropagation()}>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* 좌측: 사고 내용 및 문의사항 */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-zinc-900 p-4 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-2 border-b border-gray-100 dark:border-zinc-800 pb-2">
                <div className="text-sm font-bold text-gray-700 dark:text-gray-300">사고 내용</div>
                <button
                  onClick={() => {
                    const title = `[예약접수] ${activeConsultation.name}`;
                    const contentText = `연락처: ${activeConsultation.phone}\n사고유형: ${activeConsultation.accident_type}\n사고일자: ${activeConsultation.accident_date}\n진단명: ${activeConsultation.diagnosis}\n\n내용:\n${activeConsultation.content}\n\n문의사항:\n${activeConsultation.inquiry || '-'}`;
                    const payload = {
                      title,
                      text: contentText,
                      sourceApp: 'consultations',
                      sourceId: activeConsultation.id
                    };
                    sessionStorage.setItem('pending_calendar_event', JSON.stringify(payload));
                    window.dispatchEvent(new CustomEvent('navigate-admin-app', { detail: { app: 'calendar' } }));
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  title="캘린더 일정으로 보내기"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  일정 등록
                </button>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {activeConsultation.content || '내용 없음'}
              </div>
            </div>
            
            <div className="bg-white dark:bg-zinc-900 p-4 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-sm">
              <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 border-b border-gray-100 dark:border-zinc-800 pb-2">문의 사항</div>
              <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {activeConsultation.inquiry || '문의사항 없음'}
              </div>
            </div>
          </div>

          {/* 우측: 실시간 상담진행대장 (업무일지 기록 및 타임라인) */}
          <div className="bg-white dark:bg-zinc-900 p-4 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-zinc-800 pb-2">
              <div className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <span>📑</span>
                <span>사건 진행 타임라인 ({activeConsultationLogs.length}건)</span>
              </div>
            </div>

            {/* 신규 진행로그 작성 폼 */}
            <div className="p-3 bg-gray-50 dark:bg-zinc-950 rounded-xl border border-gray-200 dark:border-zinc-800 space-y-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">진행단계:</span>
                <div className="flex gap-1 flex-wrap">
                  {(['서류검토', '현장실사', '보험사절충', '종결완료', '기타'] as const).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setLogForm(prev => ({ ...prev, stage: st }))}
                      className={`px-2 py-0.5 text-[11px] font-bold rounded transition-all ${
                        logForm.stage === st 
                          ? 'bg-blue-600 text-white shadow-xs' 
                          : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-zinc-700'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={logForm.content}
                  onChange={e => setLogForm(prev => ({ ...prev, content: e.target.value }))}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddProgressLog(activeConsultation.id);
                    }
                  }}
                  placeholder="예: 부산대병원 MRI 판독지 접수 및 기왕증 기여도 0% 반박 완료"
                  className="flex-1 p-2 text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddProgressLog(activeConsultation.id)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shrink-0 shadow-sm"
                >
                  기록
                </button>
              </div>
            </div>

            {/* 타임라인 목록 */}
            <div className="flex-1 overflow-y-auto max-h-56 space-y-2 custom-scrollbar pr-1">
              {activeConsultationLogs.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400">
                  아직 기록된 진행 일지가 없습니다. 상단에서 진행 상황을 기록해 보세요.
                </div>
              ) : (
                activeConsultationLogs.map(l => {
                  const style = STAGE_COLORS[l.stage] || STAGE_COLORS.기타;
                  return (
                    <div key={l.id} className="p-2.5 bg-gray-50/70 dark:bg-zinc-950/70 border border-gray-100 dark:border-zinc-800/80 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded border ${style.badge}`}>
                            {l.stage}
                          </span>
                          <span className="font-mono text-gray-400 text-[11px]">{l.date} {l.time}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteProgressLog(l.id)}
                          className="text-gray-400 hover:text-red-500 p-0.5 text-[10px]"
                          title="삭제"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-gray-800 dark:text-gray-200 leading-relaxed font-medium pl-0.5">
                        {l.content}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 m-4">
        <span className="text-gray-500 text-sm">데이터를 불러오는 중...</span>
      </div>
    );
  }

  const tableColumns = [
    { label: '상태', width: 'w-20' },
    { label: '접수시간', width: 'w-36' },
    { label: '이름', width: 'w-56' },
    { label: '문의내용', align: 'left' as const }
  ];

  return (
    <AdminPanelLayout innerClassName="flex flex-col w-full h-full bg-white dark:bg-[#111111] overflow-hidden min-w-0">
      
      {/* ── 상단 2단 스마트 탭 전환 헤더 (접수 목록 vs 날짜별 진행대장) ── */}
      <div className="p-3 md:px-6 border-b border-gray-200 dark:border-zinc-800 bg-[#f8f9fa] dark:bg-zinc-900 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 bg-gray-200/60 dark:bg-zinc-950 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'list' 
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            📋 접수 목록 ({sortedAndFilteredConsultations.length})
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'ledger' 
                ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            📑 날짜별 진행대장 ({logs.length})
          </button>
        </div>

        {/* 진행대장 탭일 때 내보내기 버튼 */}
        {activeTab === 'ledger' && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyLedgerTable}
              className="px-2.5 py-1 text-xs font-bold bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
            >
              <span>📋</span> 표 복사
            </button>
            <button
              onClick={handleExportCsv}
              className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm"
            >
              <span>📊</span> 엑셀 다운로드
            </button>
          </div>
        )}
      </div>

      {/* ── 메인 콘텐츠 영역 ── */}
      <div className="flex-1 min-h-0 flex flex-col w-full overflow-hidden">
        
        {/* 탭 1: 기존 접수 목록 뷰 */}
        {activeTab === 'list' && (
          <>
            {/* 데스크탑 버전 (Table) */}
            <div className="hidden md:flex flex-1 min-h-0 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-zinc-800">
                  <AdminTableHeader columns={tableColumns} />
                  <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-50 dark:divide-zinc-800/50">
                  {sortedAndFilteredConsultations.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                        {searchQuery ? '검색 결과가 없습니다.' : '아직 접수된 상담 내역이 없습니다.'}
                      </td>
                    </tr>
                  ) : (
                    sortedAndFilteredConsultations.map((item) => (
                      <React.Fragment key={item.id}>
                        <tr 
                          onClick={() => handleRowClick(item.id)}
                          className={`cursor-pointer transition-colors ${selectedId === item.id ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-center" onClick={e => e.stopPropagation()}>
                            <AdminStatusSelect
                              status={item.status}
                              onStatusChange={(val) => updateStatus(item.id, val)}
                              onDelete={() => deleteConsultation(item.id)}
                              className="text-sm px-3 py-1"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600 dark:text-gray-400 font-mono text-center">
                            {formatDateTime(item.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-4 text-sm">
                              <span className="font-bold text-gray-900 dark:text-white w-20 truncate">{item.name}</span>
                              <span className="text-blue-600 dark:text-blue-400 font-medium font-mono">{item.phone}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 max-w-md truncate">
                            <div className="flex items-center gap-3 text-sm text-gray-800 dark:text-gray-300 w-full">
                              <div className="w-20 shrink-0">
                                <PremiumBadge color="blue" className="px-2 whitespace-nowrap">{item.accident_type}</PremiumBadge>
                              </div>
                              <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap shrink-0 w-24 font-mono">
                                {formatAccidentDate(item.accident_date)}
                              </span>
                              <span className="text-gray-300 dark:text-gray-600 shrink-0">|</span>
                              <span className="text-gray-500 font-medium whitespace-nowrap">장소 : </span>
                              <span className="truncate w-24 shrink-0" title={item.accident_location || '미상'}>{item.accident_location || '미상'}</span>
                              <span className="text-gray-300 dark:text-gray-600 shrink-0">|</span>
                              <span className="truncate" title={item.diagnosis}>
                                <span className="text-gray-500 font-medium">진단 : </span>
                                {item.diagnosis}
                              </span>
                            </div>
                          </td>
                        </tr>
                        {selectedId === item.id && (
                          <tr>
                            <td colSpan={4} className="p-0 border-0 bg-[#f8f9fa] dark:bg-zinc-950/50">
                              {renderAccordionDetail()}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 모바일 뷰 */}
            <div className="md:hidden flex-1 overflow-y-auto space-y-3 p-4 bg-gray-50/50 dark:bg-zinc-950/50 custom-scrollbar">
              {sortedAndFilteredConsultations.length === 0 ? (
                  <div className="text-center py-8 text-sm text-gray-500 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
                    {searchQuery ? '검색 결과가 없습니다.' : '아직 접수된 상담 내역이 없습니다.'}
                  </div>
                ) : (
                  sortedAndFilteredConsultations.map((item) => (
                    <PremiumCard 
                      key={item.id}
                      onClick={() => handleRowClick(item.id)}
                      borderColor={item.status === '대기' ? 'red' : item.status === '보류' ? 'yellow' : item.status === '상담' ? 'blue' : (item.status === '완료' || item.status === '상담완료' || item.status === '상담 완료') ? 'green' : 'default'}
                      className={`flex flex-col gap-4 cursor-pointer overflow-hidden ${selectedId === item.id ? 'ring-2 ring-blue-500/50' : ''}`}
                    >
                      <div className="flex justify-between items-center pl-2">
                        <div className="flex items-center gap-2 flex-wrap w-full">
                          <AdminStatusSelect
                            status={item.status}
                            onStatusChange={(val) => updateStatus(item.id, val)}
                            onDelete={() => deleteConsultation(item.id)}
                            className="text-xs px-2.5 py-0.5"
                          />
                          <span className="text-xs font-medium text-gray-400 font-mono shrink-0">{formatDateTime(item.created_at)}</span>
                          <div className="text-[16px] font-bold text-gray-900 dark:text-white flex items-center gap-2 ml-1">
                            {item.name} <span className="text-[13px] font-medium text-blue-500">{item.phone}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-zinc-950 p-2.5 rounded-none text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2 mb-1">
                          <PremiumBadge color="blue" className="px-1.5">{item.accident_type}</PremiumBadge>
                          <span className="text-[11px]">일자 : {formatAccidentDate(item.accident_date)}</span>
                          <span className="text-gray-300 dark:text-gray-600">|</span>
                          <span className="text-[11px] truncate max-w-[100px]" title={item.accident_location || '미상'}>장소 : {item.accident_location || '미상'}</span>
                        </div>
                        <div className="line-clamp-1">
                          <span className="text-gray-400 font-medium">진단병명 : </span>{item.diagnosis}
                        </div>
                      </div>
                      {selectedId === item.id && (
                        <div className="mt-2 w-full">
                          {renderAccordionDetail()}
                        </div>
                      )}
                    </PremiumCard>
                  ))
              )}
            </div>
          </>
        )}

        {/* 탭 2: 날짜별 상담진행대장 뷰 */}
        {activeTab === 'ledger' && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white dark:bg-zinc-950 p-4 md:p-6 space-y-4">
            
            {/* 날짜 선택 필터 바 & KPI 요약 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 bg-[#f8f9fa] dark:bg-zinc-900/60 rounded-2xl border border-gray-200 dark:border-zinc-800">
              
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex bg-white dark:bg-zinc-800 p-1 rounded-xl border border-gray-200 dark:border-zinc-700">
                  <button
                    onClick={() => { setLedgerDateMode('today'); setLedgerDateFilter(todayStr); }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                      ledgerDateMode === 'today' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    오늘 ({todayStr})
                  </button>
                  <button
                    onClick={() => setLedgerDateMode('all')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                      ledgerDateMode === 'all' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    전체 누적
                  </button>
                </div>

                <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-700">
                  <span className="text-xs font-bold text-gray-500">날짜 지정:</span>
                  <input
                    type="date"
                    value={ledgerDateFilter}
                    onChange={e => {
                      setLedgerDateFilter(e.target.value);
                      setLedgerDateMode('custom');
                    }}
                    className="text-xs font-bold bg-transparent text-gray-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              {/* 진행단계별 KPI 카운터 */}
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="text-gray-500">조회 건수: <b className="text-blue-600">{filteredLedgerLogs.length}건</b></span>
                <div className="w-px h-3 bg-gray-300 dark:bg-zinc-700 mx-1" />
                <span className="text-purple-600">절충: {filteredLedgerLogs.filter(l => l.stage === '보험사절충').length}건</span>
                <div className="w-px h-3 bg-gray-300 dark:bg-zinc-700 mx-1" />
                <span className="text-emerald-600">종결: {filteredLedgerLogs.filter(l => l.stage === '종결완료').length}건</span>
              </div>
            </div>

            {/* 진행대장 리스트 (테이블) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar border border-gray-200 dark:border-zinc-800 rounded-xl">
              {filteredLedgerLogs.length === 0 ? (
                <div className="p-12 text-center text-gray-400 space-y-3">
                  <div className="text-3xl">☕</div>
                  <p className="text-sm font-medium">선택한 일자에 등록된 진행대장 기록이 없습니다.</p>
                  <p className="text-xs text-gray-500">
                    [접수 목록] 탭에서 특정 고객의 상세창을 열고 <b>[📑 사건 진행 타임라인]</b>에서 업무를 기록해 보세요.
                  </p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-100 dark:divide-zinc-800 text-left text-xs">
                  <thead className="bg-[#f8f9fa] dark:bg-zinc-900 sticky top-0 z-10">
                    <tr className="text-gray-700 dark:text-gray-300 font-bold border-b border-gray-200 dark:border-zinc-800">
                      <th className="py-3 px-4 w-28">일자 / 시간</th>
                      <th className="py-3 px-4 w-40">고객명 (연락처)</th>
                      <th className="py-3 px-4 w-28">진행단계</th>
                      <th className="py-3 px-4">업무 진행 내용 및 조치사항</th>
                      <th className="py-3 px-4 w-24 text-center">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
                    {filteredLedgerLogs.map(log => {
                      const style = STAGE_COLORS[log.stage] || STAGE_COLORS.기타;
                      return (
                        <tr key={log.id} className="hover:bg-gray-50/70 dark:hover:bg-zinc-900/50 transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-gray-500 whitespace-nowrap">
                            {log.date} <span className="text-gray-400">{log.time}</span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-bold text-gray-900 dark:text-white">{log.client_name || '고객'}</div>
                            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">{log.client_phone || '-'}</div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${style.badge}`}>
                              {log.stage}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-800 dark:text-gray-200 font-medium leading-relaxed">
                            {log.content}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {log.consultation_id && (
                                <button
                                  onClick={() => {
                                    setSelectedId(log.consultation_id!);
                                    setActiveTab('list');
                                  }}
                                  className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded text-[11px] font-bold transition-colors"
                                  title="해당 고객 접수창으로 이동"
                                >
                                  이동
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteProgressLog(log.id)}
                                className="px-1.5 py-1 text-gray-400 hover:text-red-500 text-[11px]"
                                title="삭제"
                              >
                                ✕
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

      </div>
    </AdminPanelLayout>
  );
}
