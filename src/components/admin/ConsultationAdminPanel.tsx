import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Consultation } from '@/lib/supabase';
import ConsultationDetailCard from './ConsultationDetailCard';
import BottomSheet from '@/components/ui/BottomSheet';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumBadge from '@/components/ui/PremiumBadge';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumButton from '@/components/ui/PremiumButton';

interface ConsultationAdminPanelProps {
  isSplitView: boolean;
  onNavigateToManage: () => void;
}

export default function ConsultationAdminPanel({ isSplitView, onNavigateToManage }: ConsultationAdminPanelProps) {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Memo state
  // Memo state
  const [memoText, setMemoText] = useState('');
  async function fetchConsultations() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching consultations:', error);
    } else {
      setConsultations(data || []);
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
          setConsultations(prev => prev.map(c => c.id === payload.new.id ? payload.new as Consultation : c));
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
    const { error } = await supabase
      .from('consultations')
      .update({ status: newStatus })
      .eq('id', id);
    if (error) {
      alert('상태 업데이트 중 오류가 발생했습니다.');
    }
  };

  const deleteConsultation = async (id: string) => {
    if (!window.confirm('정말로 이 접수 내역을 삭제하시겠습니까? (복구 불가)')) return;
    const { error } = await supabase
      .from('consultations')
      .delete()
      .eq('id', id);
    if (error) {
      alert('삭제 중 오류가 발생했습니다.');
    } else {
      if (selectedId === id) setSelectedId(null);
    }
  };

  const handleRowClick = (id: string) => {
    setSelectedId(id);
  };

  const activeConsultation = consultations.find(c => c.id === selectedId);

  const renderAccordionDetail = () => {
    if (!activeConsultation) return null;
    return (
      <div className="bg-[#f8f9fa] dark:bg-zinc-950/50 p-4 md:p-6 shadow-[inset_0_4px_6px_rgba(0,0,0,0.02)] border-b border-gray-100 dark:border-zinc-800 animate-in slide-in-from-top-4 fade-in duration-300 w-full" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <PremiumHeading level={3} showLeftBorder={true} className="mb-0 text-lg font-bold">
            상세 내용
          </PremiumHeading>
          <button onClick={() => setSelectedId(null)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-800 rounded transition-colors" title="닫기">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="bg-white dark:bg-zinc-900 p-4 border border-gray-200 dark:border-zinc-700 rounded-none shadow-sm">
            <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 border-b border-gray-100 dark:border-zinc-800 pb-2">사고 내용</div>
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

          <PremiumButton
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
            variant="primary"
            className="w-full mt-2 !py-3 font-bold text-sm"
          >
            📅 캘린더 일정으로 보내기
          </PremiumButton>
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

  return (
    <div className="flex flex-1 h-full bg-gray-50 dark:bg-zinc-950 overflow-hidden relative">
      
      {/* List Panel */}
      <div className="flex flex-col bg-gray-50 dark:bg-zinc-950 overflow-hidden flex-1 w-full">

        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar p-4 md:p-8">
          {/* 데스크탑 버전 (Table) */}
          <PremiumCard hoverEffect={true} className="hidden md:block p-0 sm:p-0 border-0">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-zinc-800">
              <thead className="bg-slate-100 dark:bg-zinc-800">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-20">상태</th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-36">접수시간</th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-56">이름</th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">문의내용</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-50 dark:divide-zinc-800/50">
              {consultations.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                    아직 접수된 상담 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                consultations.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr 
                      onClick={() => handleRowClick(item.id)}
                      className={`cursor-pointer transition-colors ${selectedId === item.id ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <select
                          value={item.status}
                          onChange={(e) => {
                            if (e.target.value === 'delete') {
                              if (window.confirm('정말 삭제하시겠습니까?')) {
                                deleteConsultation(item.id);
                              }
                            } else {
                              updateStatus(item.id, e.target.value);
                            }
                          }}
                          className={`text-sm font-bold px-3 py-1 outline-none border-0 cursor-pointer shadow-sm ${
                            item.status === '대기' ? 'bg-red-50 text-red-600' :
                            (item.status === '상담완료' || item.status === '상담 완료') ? 'bg-blue-50 text-blue-600' :
                            item.status === '보류' ? 'bg-yellow-50 text-yellow-600' :
                            'bg-gray-50 text-gray-600'
                          }`}
                        >
                          <option value="대기">대기</option>
                          <option value="상담완료">상담 완료</option>
                          <option value="보류">보류</option>
                          <option value="delete" className="text-red-500 font-bold">삭제</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-600 dark:text-gray-400 font-mono">
                        {new Date(item.created_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4 text-sm">
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
                            {item.accident_date}
                          </span>
                          <span className="text-gray-300 dark:text-gray-600 shrink-0">|</span>
                          <span className="text-gray-500 mr-1 font-medium whitespace-nowrap">장소:</span>
                          <span className="truncate w-24 shrink-0" title={item.accident_location || '미상'}>{item.accident_location || '미상'}</span>
                          <span className="text-gray-300 dark:text-gray-600 shrink-0">|</span>
                          <span className="truncate" title={item.diagnosis}>
                            <span className="text-gray-500 mr-1 font-medium">진단:</span>
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
          </PremiumCard>

          {/* 모바일 버전 (Card List) */}
          <div className="md:hidden flex flex-col space-y-3 pb-24 pt-2">
            {consultations.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-500">
                아직 접수된 상담 내역이 없습니다.
              </div>
            ) : (
              consultations.map((item) => (
                <PremiumCard 
                  key={item.id}
                  onClick={() => handleRowClick(item.id)}
                  hoverEffect={true}
                  borderColor={item.status === '대기' ? 'red' : item.status === '보류' ? 'yellow' : (item.status === '상담완료' || item.status === '상담 완료') ? 'blue' : 'default'}
                  className={`flex flex-col gap-4 cursor-pointer overflow-hidden ${selectedId === item.id ? 'ring-2 ring-blue-500/50' : ''}`}
                >
                  <div className="flex justify-between items-center pl-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={item.status}
                        onClick={e => e.stopPropagation()}
                        onChange={(e) => {
                          if (e.target.value === 'delete') {
                            if (window.confirm('정말 삭제하시겠습니까?')) {
                              deleteConsultation(item.id);
                            }
                          } else {
                            updateStatus(item.id, e.target.value);
                          }
                        }}
                        className={`text-sm font-bold px-2.5 py-0.5 outline-none border-0 cursor-pointer shadow-sm ${
                          item.status === '대기' ? 'bg-red-50 text-red-600' :
                          (item.status === '상담완료' || item.status === '상담 완료') ? 'bg-blue-50 text-blue-600' :
                          item.status === '보류' ? 'bg-yellow-50 text-yellow-600' :
                          'bg-gray-50 text-gray-600'
                        }`}
                      >
                        <option value="대기">대기</option>
                        <option value="상담완료">상담 완료</option>
                        <option value="보류">보류</option>
                        <option value="delete" className="text-red-500 font-bold">삭제</option>
                      </select>
                      <span className="text-xs font-medium text-gray-400 font-mono">{new Date(item.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </div>
                  <div className="pl-2">
                    <div className="text-[17px] font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {item.name} <span className="text-[13px] font-medium text-blue-500">{item.phone}</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-zinc-950 p-2.5 rounded-none text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2 mb-1">
                      <PremiumBadge color="blue" className="px-1.5">{item.accident_type}</PremiumBadge>
                      <span className="text-[11px]">일자: {item.accident_date}</span>
                      <span className="text-gray-300 dark:text-gray-600">|</span>
                      <span className="text-[11px] truncate max-w-[100px]" title={item.accident_location || '미상'}>장소: {item.accident_location || '미상'}</span>
                    </div>
                    <div className="line-clamp-1">
                      <span className="text-gray-400 mr-1">진단병명:</span>{item.diagnosis}
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
      </div>
    </div>
  );
}
