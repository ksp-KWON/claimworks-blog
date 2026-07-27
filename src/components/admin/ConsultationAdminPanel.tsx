import React, { useEffect, useState, useMemo } from 'react';
import { supabase, Consultation } from '@/lib/supabase';
import ConsultationDetailCard from './ConsultationDetailCard';
import BottomSheet from '@/components/ui/BottomSheet';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumBadge from '@/components/ui/PremiumBadge';
import { AdminStatusSelect } from './AdminStatusSelect';
import AdminPanelLayout from './AdminPanelLayout';
import { AdminTableHeader } from './AdminHeader';

interface ConsultationAdminPanelProps {
  isSplitView: boolean;
  onNavigateToManage: () => void;
  searchQuery: string;
  sortType: string;
  refreshCounter: number;
}

export default function ConsultationAdminPanel({ isSplitView, onNavigateToManage, searchQuery, sortType, refreshCounter }: ConsultationAdminPanelProps) {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const [memoText, setMemoText] = useState('');

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
  async function fetchConsultations() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching consultations:', error);
    } else {
      setConsultations((data || []).filter(c => c.status !== '삭제'));
    }
    setIsLoading(false);
  }

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
  }, []);

  useEffect(() => {
    if (refreshCounter > 0) {
      fetchConsultations();
    }
  }, [refreshCounter]);

  useEffect(() => {
    const pendingId = sessionStorage.getItem('pending_select_id');
    if (pendingId) {
      setSelectedId(pendingId);
      onNavigateToManage();
      sessionStorage.removeItem('pending_select_id');
    }
  }, [onNavigateToManage]);



  useEffect(() => {
    // Wait, we don't have a customer_memo field in consultations table right now!
    // I should use inquiry as a memo or add customer_memo. The user said: "항목관리 (채팅영역 우측의 고객정보 나오게 만들어줘)". So we should probably just use the right panel to show details.
  }, [selectedId, consultations]);

  useEffect(() => {
    const handleCloseDetail = () => {
      setSelectedId(null);
    };
    window.addEventListener('close-consultation-detail', handleCloseDetail);
    return () => {
      window.removeEventListener('close-consultation-detail', handleCloseDetail);
    };
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin-manage?table=consultations&id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      
      if (!data.success) {
        alert(`상태 업데이트 실패: ${data.message}`);
        return;
      }
      setConsultations(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    } catch (err: any) {
      alert(`상태 업데이트 중 오류 발생: ${err.message}`);
    }
  };

  const deleteConsultation = async (id: string) => {
    if (!window.confirm('정말로 이 접수 내역을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin-manage?table=consultations&id=${id}`, {
        method: 'DELETE'
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

  const renderAccordionDetail = () => {
    if (!activeConsultation) return null;
    return (
      <div className="bg-[#f8f9fa] dark:bg-zinc-950/50 p-4 md:p-6 shadow-[inset_0_4px_6px_rgba(0,0,0,0.02)] border-b border-gray-100 dark:border-zinc-800 animate-in slide-in-from-top-4 fade-in duration-300 w-full" onClick={e => e.stopPropagation()}>

        
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-zinc-900 p-4 border border-gray-200 dark:border-zinc-700 rounded-none shadow-sm">
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
          
          <div className="bg-white dark:bg-zinc-900 p-4 border border-gray-200 dark:border-zinc-700 rounded-none shadow-sm">
            <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 border-b border-gray-100 dark:border-zinc-800 pb-2">문의 사항</div>
            <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {activeConsultation.inquiry || '문의사항 없음'}
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
    <AdminPanelLayout innerClassName="flex flex-col w-full h-full bg-white dark:bg-[#111111]">
      <div className="flex-1 min-h-0 flex flex-col w-full">
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
      </div>
    </AdminPanelLayout>
  );
}
