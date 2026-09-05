'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Consultation } from '@/lib/supabase';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumBadge from '@/components/ui/PremiumBadge';
import AppIcon from '@/components/ui/AppIcon';
import { AdminStatusSelect } from './AdminStatusSelect';
import AdminPanelLayout from './AdminPanelLayout';
import { AdminTableHeader } from './AdminHeader';
import { formatAdminDateTime, formatAdminDate } from '@/lib/admin-utils';
import { getAdminAuthHeader } from '@/lib/admin-auth';

interface ConsultationAdminPanelProps {
  isSplitView: boolean;
  onNavigateToManage: () => void;
  searchQuery: string;
  sortType: string;
  refreshCounter: number;
}

export default function ConsultationAdminPanel({ onNavigateToManage, searchQuery, sortType, refreshCounter }: ConsultationAdminPanelProps) {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

  const fetchConsultations = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. 보안된 관리자 엔드포인트(/api/admin-manage) 우선 조회
      const authHeader = getAdminAuthHeader();
      if (Object.keys(authHeader).length > 0) {
        try {
          const res = await fetch('/api/admin-manage?table=consultations', {
            headers: authHeader,
          });
          if (res.ok) {
            const json = await res.json();
            if (json.success && Array.isArray(json.data)) {
              setConsultations(json.data.filter((c: any) => c.status !== '삭제'));
              return;
            }
          }
        } catch {
          // 백엔드 실패 시 Supabase 직접 조회로 fallback
        }
      }

      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching consultations:', error);
      } else {
        setConsultations((data || []).filter(c => c.status !== '삭제'));
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

  // 상태 업데이트 (/api/admin-manage 표준 엔드포인트)
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin-manage?table=consultations&id=${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...getAdminAuthHeader(),
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!data.success) {
        alert(`상태 업데이트 실패: ${data.message}`);
        return;
      }
      setConsultations(prev => prev.map(c => c.id === id ? { ...c, status: newStatus as Consultation['status'] } : c));
    } catch (err: any) {
      alert(`상태 업데이트 중 오류 발생: ${err.message}`);
    }
  };

  // 삭제 (/api/admin-manage 표준 엔드포인트)
  const deleteConsultation = async (id: string) => {
    if (!window.confirm('정말로 이 접수 내역을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin-manage?table=consultations&id=${id}`, {
        method: 'DELETE',
        headers: getAdminAuthHeader(),
      });
      const data = await res.json();
      if (!data.success) {
        alert(`삭제 실패: ${data.message}`);
        return;
      }
      if (selectedId === id) setSelectedId(null);
      setConsultations(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert(`삭제 중 오류 발생: ${err.message}`);
    }
  };

  const handleRowClick = (id: string) => {
    setSelectedId(prev => prev === id ? null : id);
  };

  const activeConsultation = consultations.find(c => c.id === selectedId);

  const renderAccordionDetail = () => {
    if (!activeConsultation) return null;
    return (
      <div className="bg-gradient-to-b from-blue-50/30 to-transparent dark:from-blue-950/20 dark:to-transparent p-3 sm:p-4 border-b border-gray-200/80 dark:border-zinc-800 animate-in slide-in-from-top-2 fade-in duration-200 w-full space-y-3" onClick={e => e.stopPropagation()}>
        {/* 사전 분석 핵심 지표 바 (생년월일 / 월 소득) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white dark:bg-zinc-900 p-2.5 border border-gray-200/80 dark:border-zinc-800 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 font-bold">생년월일:</span>
            <span className="font-extrabold text-gray-900 dark:text-white font-mono">{activeConsultation.birth_date || '미입력'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 font-bold">월 소득:</span>
            <span className="font-extrabold text-blue-600 dark:text-blue-400 font-mono">{activeConsultation.income ? `${activeConsultation.income}원` : '미입력'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 font-bold">사고일자:</span>
            <span className="font-bold text-gray-900 dark:text-white font-mono">{activeConsultation.accident_date || '미상'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400 font-bold">사고장소:</span>
            <span className="font-bold text-gray-900 dark:text-white truncate" title={activeConsultation.accident_location}>{activeConsultation.accident_location || '미상'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
          <div className="bg-white dark:bg-[#202124] border border-blue-200/80 dark:border-blue-900/50 rounded-none shadow-sm flex flex-col justify-between overflow-hidden">
            <div>
              <div className="px-4 py-2.5 bg-gradient-to-r from-blue-50/80 to-transparent dark:from-blue-900/20 dark:to-transparent border-b border-blue-100 dark:border-blue-900/30 flex justify-between items-center">
                <span className="text-xs font-extrabold text-[var(--google-blue)] dark:text-[#8ab4f8] flex items-center gap-1.5">
                  <AppIcon name="car" size={14} className="text-[var(--google-blue)]" />
                  <span>사고 경위 및 진단 상세</span>
                </span>
                <button
                  onClick={() => {
                    const title = `[예약접수] ${activeConsultation.name}`;
                    const contentText = `연락처: ${activeConsultation.phone}\n생년월일: ${activeConsultation.birth_date || '-'}\n월소득: ${activeConsultation.income || '-'}\n사고유형: ${activeConsultation.accident_type}\n사고일자: ${activeConsultation.accident_date}\n사고장소: ${activeConsultation.accident_location}\n진단명: ${activeConsultation.diagnosis}\n\n내용:\n${activeConsultation.content}\n\n문의사항:\n${activeConsultation.inquiry || '-'}`;
                    const payload = {
                      title,
                      text: contentText,
                      sourceApp: 'consultations',
                      sourceId: activeConsultation.id
                    };
                    sessionStorage.setItem('pending_calendar_event', JSON.stringify(payload));
                    window.dispatchEvent(new CustomEvent('navigate-admin-app', { detail: { app: 'calendar' } }));
                  }}
                  className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-none border border-blue-200 dark:border-blue-800 hover:bg-blue-50 transition-colors shadow-2xs cursor-pointer"
                  title="캘린더 일정으로 보내기"
                >
                  <AppIcon name="calendar" size={12} />
                  <span>일정 등록</span>
                </button>
              </div>
              <div className="p-4 text-xs text-gray-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed space-y-2">
                <div>
                  <strong className="text-gray-900 dark:text-white block mb-1">진단 병명: {activeConsultation.diagnosis}</strong>
                </div>
                <div>{activeConsultation.content || '등록된 상세 내용이 없습니다.'}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-[#202124] border border-purple-200/80 dark:border-purple-900/50 rounded-none shadow-sm flex flex-col justify-between overflow-hidden">
            <div>
              <div className="px-4 py-2.5 bg-gradient-to-r from-purple-50/80 to-transparent dark:from-purple-900/20 dark:to-transparent border-b border-purple-100 dark:border-purple-900/30 flex justify-between items-center">
                <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <AppIcon name="chat" size={14} className="text-purple-600" />
                  <span>고객 문의 및 요청사항</span>
                </span>
              </div>
              <div className="p-4 text-xs text-gray-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                {activeConsultation.inquiry || '별도 문의사항이 없습니다.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#202124] rounded-none border border-gray-200/80 dark:border-zinc-800 m-2">
        <span className="text-gray-500 text-xs font-bold">상담 내역 로딩 중...</span>
      </div>
    );
  }

  const tableColumns = [
    { label: '상태', width: 'w-24' },
    { label: '접수시간', width: 'w-36' },
    { label: '고객 정보', width: 'w-60' },
    { label: '사고 및 문의 내용', align: 'left' as const }
  ];

  const totalCount = sortedAndFilteredConsultations.length;
  const waitCount = sortedAndFilteredConsultations.filter(c => (c.status || '대기').includes('대기') || (c.status || '').includes('미확인')).length;
  const consultCount = sortedAndFilteredConsultations.filter(c => (c.status || '').includes('상담') || (c.status || '').includes('진행')).length;
  const doneCount = sortedAndFilteredConsultations.filter(c => (c.status || '').includes('완료') || (c.status || '').includes('종결')).length;

  return (
    <AdminPanelLayout innerClassName="space-y-2.5">
      <PremiumCard borderColor="blue" hoverEffect={true} watermarkIcon="file-text" className="!p-3 shrink-0 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <AppIcon name="file-text" size={16} className="text-[var(--google-blue)] dark:text-[#8ab4f8]" />
          <span className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white">
            실시간 상담 접수 현황
          </span>
          <span className="text-[10px] text-gray-400 font-mono hidden sm:inline-block">
            최신순 정렬
          </span>
        </div>

        {/* 상태별 카운트 배지 그룹 */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-none border border-gray-200/80 dark:border-zinc-700">
            <span className="text-gray-500 dark:text-zinc-400 font-medium text-[11px]">전체</span>
            <span className="font-mono font-extrabold text-gray-900 dark:text-white">{totalCount}</span>
          </div>

          <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-none border border-red-200 dark:border-red-800">
            <span className="text-red-600 dark:text-red-400 font-bold text-[11px]">대기</span>
            <span className="font-mono font-extrabold text-red-600 dark:text-red-400">{waitCount}</span>
          </div>

          <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-none border border-blue-200 dark:border-blue-800">
            <span className="text-blue-600 dark:text-blue-400 font-bold text-[11px]">상담중</span>
            <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400">{consultCount}</span>
          </div>

          <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-none border border-emerald-200 dark:border-emerald-800">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">완료</span>
            <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">{doneCount}</span>
          </div>
        </div>
      </PremiumCard>

      {/* 🏝️ 2. 메인 데이터 테이블 카드 아일랜드 */}
      <PremiumCard borderColor="blue" hoverEffect={false} className="flex-1 min-h-0 !p-0 flex flex-col overflow-hidden">
        {/* 데스크탑 버전 (Table) */}
        <div className="hidden md:flex flex-1 min-h-0 flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-200/80 dark:divide-zinc-800">
              <AdminTableHeader columns={tableColumns} />
              <tbody className="bg-white dark:bg-[#202124] divide-y divide-gray-100 dark:divide-zinc-800/60">
              {sortedAndFilteredConsultations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center text-xs text-gray-400">
                    {searchQuery ? '검색 결과가 없습니다.' : '아직 접수된 상담 내역이 없습니다.'}
                  </td>
                </tr>
              ) : (
                sortedAndFilteredConsultations.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr 
                      onClick={() => handleRowClick(item.id)}
                      className={`cursor-pointer transition-all duration-200 group border-l-2 ${selectedId === item.id ? 'bg-blue-50/70 dark:bg-blue-950/40 border-[var(--google-blue)]' : 'border-transparent hover:border-[var(--google-blue)] hover:bg-blue-50/40 dark:hover:bg-blue-950/20'}`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-center" onClick={e => e.stopPropagation()}>
                        <AdminStatusSelect
                          status={item.status}
                          onStatusChange={(val) => updateStatus(item.id, val)}
                          onDelete={() => deleteConsultation(item.id)}
                          className="!text-xs !px-2.5 !py-0.5"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs font-mono font-medium text-gray-500 dark:text-zinc-400 text-center">
                        {formatAdminDateTime(item.created_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <div className="flex flex-col items-center justify-center gap-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-gray-900 dark:text-white max-w-[100px] truncate">{item.name}</span>
                            <span className="text-[var(--google-blue)] dark:text-[#8ab4f8] font-bold font-mono bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-none border border-blue-200 dark:border-blue-800/50">{item.phone}</span>
                          </div>
                          {(item.birth_date || item.income) && (
                            <div className="flex items-center gap-1.5 text-[10.5px] text-gray-500 dark:text-zinc-400 font-mono">
                              {item.birth_date && <span>{item.birth_date}</span>}
                              {item.birth_date && item.income && <span>·</span>}
                              {item.income && <span className="text-emerald-600 dark:text-emerald-400 font-bold">{item.income}원</span>}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-md truncate">
                        <div className="flex items-center gap-2.5 text-xs text-gray-800 dark:text-zinc-200 w-full">
                          <div className="shrink-0">
                            <PremiumBadge color="blue" className="!px-2 !py-0.5 !text-[11px] rounded-none whitespace-nowrap">{item.accident_type}</PremiumBadge>
                          </div>
                          <span className="text-gray-500 dark:text-zinc-400 whitespace-nowrap shrink-0 font-mono text-[11px]">
                            {formatAdminDate(item.accident_date)}
                          </span>
                          <span className="text-gray-300 dark:text-zinc-700 shrink-0">|</span>
                          <span className="text-gray-500 dark:text-zinc-400 font-bold whitespace-nowrap">장소:</span>
                          <span className="truncate max-w-[120px] shrink-0 font-medium" title={item.accident_location || '미상'}>{item.accident_location || '미상'}</span>
                          <span className="text-gray-300 dark:text-zinc-700 shrink-0">|</span>
                          <span className="truncate" title={item.diagnosis}>
                            <span className="text-gray-500 dark:text-zinc-400 font-bold">진단:</span> {item.diagnosis}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {selectedId === item.id && (
                      <tr>
                        <td colSpan={4} className="p-0 border-0">
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

        {/* 모바일 뷰 (3D 직각 카드형) */}
        <div className="md:hidden flex-1 overflow-y-auto space-y-2.5 p-3 custom-scrollbar bg-gray-50 dark:bg-zinc-950">
          {sortedAndFilteredConsultations.length === 0 ? (
              <div className="text-center py-10 text-xs text-gray-400 bg-white dark:bg-[#202124] border border-gray-200/80 dark:border-zinc-800 rounded-none">
                {searchQuery ? '검색 결과가 없습니다.' : '아직 접수된 상담 내역이 없습니다.'}
              </div>
            ) : (
              sortedAndFilteredConsultations.map((item) => (
                <PremiumCard 
                  key={item.id}
                  onClick={() => handleRowClick(item.id)}
                  borderColor={item.status === '대기' ? 'red' : item.status === '보류' ? 'yellow' : item.status === '상담' ? 'blue' : (item.status === '완료' || item.status === '상담완료' || item.status === '상담 완료') ? 'green' : 'default'}
                  className={`flex flex-col gap-2.5 cursor-pointer !p-3 rounded-none ${selectedId === item.id ? 'ring-1 ring-blue-500/50' : ''}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 flex-wrap w-full">
                      <AdminStatusSelect
                        status={item.status}
                        onStatusChange={(val) => updateStatus(item.id, val)}
                        onDelete={() => deleteConsultation(item.id)}
                        className="!text-xs !px-2 !py-0.5"
                      />
                      <span className="text-[11px] font-medium text-gray-400 font-mono shrink-0">{formatAdminDateTime(item.created_at)}</span>
                      <div className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5 ml-auto">
                        {item.name} <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">{item.phone}</span>
                        {(item.birth_date || item.income) && (
                          <span className="text-[10px] text-gray-400 font-mono font-normal">
                            ({item.birth_date ? `${item.birth_date}` : ''}{item.birth_date && item.income ? ' / ' : ''}{item.income ? `${item.income}원` : ''})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-zinc-950/80 p-2 border border-gray-100 dark:border-zinc-800 rounded-none text-xs text-gray-700 dark:text-zinc-300">
                    <div className="flex items-center gap-2 mb-1">
                      <PremiumBadge color="blue" className="!px-1.5 !py-0.2 !text-[10px] rounded-none">{item.accident_type}</PremiumBadge>
                      <span className="text-[11px] font-mono">일자 : {formatAdminDate(item.accident_date)}</span>
                      <span className="text-gray-300 dark:text-zinc-700">|</span>
                      <span className="text-[11px] truncate max-w-[100px]" title={item.accident_location || '미상'}>장소 : {item.accident_location || '미상'}</span>
                    </div>
                    <div className="truncate text-[11.5px]">
                      <span className="text-gray-400 font-bold">진단: </span>{item.diagnosis}
                    </div>
                  </div>
                  {selectedId === item.id && (
                    <div className="mt-1 w-full">
                      {renderAccordionDetail()}
                    </div>
                  )}
                </PremiumCard>
              ))
          )}
        </div>
      </PremiumCard>
    </AdminPanelLayout>
  );
}
