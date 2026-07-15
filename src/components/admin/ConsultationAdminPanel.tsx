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
        {/* Header Section */}
        <div className="shrink-0 px-4 md:px-8 py-5 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-between">
          <PremiumHeading level={2} showLeftBorder={true} className="mb-0 text-xl font-bold">
            상담 접수 관리
          </PremiumHeading>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar p-4 md:p-8">
          {/* 데스크탑 버전 (Table) */}
          <PremiumCard className="hidden md:block p-0 sm:p-0 rounded-[24px]">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-zinc-800">
              <thead className="bg-gray-50/50 dark:bg-zinc-950/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-20">상태</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-32">접수시간</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-40">이름</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">문의내용</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-16">관리</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-50 dark:divide-zinc-800/50">
              {consultations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                    아직 접수된 상담 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                consultations.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => handleRowClick(item.id)}
                    className={`cursor-pointer transition-colors ${selectedId === item.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <select
                        value={item.status}
                        onChange={(e) => updateStatus(item.id, e.target.value)}
                        className={`text-[12px] font-bold rounded-full px-3 py-1 outline-none border-0 cursor-pointer shadow-sm ${
                          item.status === '대기' ? 'bg-red-50 text-red-600' :
                          item.status === '보류' ? 'bg-yellow-50 text-yellow-600' :
                          'bg-gray-50 text-gray-600'
                        }`}
                      >
                        <option value="대기">대기</option>
                        <option value="상담완료">상담완료</option>
                        <option value="보류">보류</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-500 dark:text-gray-400">
                      {new Date(item.created_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">{item.name}</div>
                      <div className="text-[12px] text-blue-600 dark:text-blue-400 font-medium">{item.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <PremiumBadge color="blue" className="rounded-full px-2">{item.accident_type}</PremiumBadge>
                        <span className="text-[12px] text-gray-500 dark:text-gray-400 flex items-center gap-1 font-medium">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          {item.accident_date}
                        </span>
                      </div>
                      <div className="text-[13px] font-medium text-gray-800 dark:text-gray-300 line-clamp-1" title={item.diagnosis}>
                        <span className="text-gray-400 mr-1.5">진단병명:</span>{item.diagnosis}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={() => deleteConsultation(item.id)}
                        className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="삭제"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </td>
                  </tr>
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
                  borderColor={item.status === '대기' ? 'red' : item.status === '보류' ? 'yellow' : 'default'}
                  className={`!rounded-[20px] flex flex-col gap-4 cursor-pointer overflow-hidden ${selectedId === item.id ? 'ring-2 ring-blue-500/50' : ''}`}
                >
                  <div className="flex justify-between items-center pl-2">
                    <div className="flex items-center gap-2">
                      <PremiumBadge color={item.status === '대기' ? 'red' : item.status === '보류' ? 'yellow' : 'gray'} className="rounded-full px-2.5">
                        {item.status}
                      </PremiumBadge>
                      <span className="text-xs font-medium text-gray-400">{new Date(item.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteConsultation(item.id); }}
                      className="text-red-400 p-1.5 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                  <div className="pl-2">
                    <div className="text-[17px] font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {item.name} <span className="text-[13px] font-medium text-blue-500">{item.phone}</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-zinc-950 p-2.5 rounded-lg text-xs text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2 mb-1">
                      <PremiumBadge color="blue" className="rounded px-1.5">{item.accident_type}</PremiumBadge>
                      <span className="text-[11px]">일자: {item.accident_date}</span>
                    </div>
                    <div className="line-clamp-1">
                      <span className="text-gray-400 mr-1">진단병명:</span>{item.diagnosis}
                    </div>
                  </div>
                </PremiumCard>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Details Modal (Desktop) */}
      {selectedId && activeConsultation && (
        <div 
          className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm transition-opacity" 
          onClick={() => setSelectedId(null)}
        >
          <div 
            className="bg-[#f8f9fa] dark:bg-zinc-950 w-full max-w-3xl max-h-[90vh] sm:max-h-[85vh] rounded-[24px] flex flex-col shadow-2xl overflow-hidden border border-gray-100 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-16 px-6 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 flex items-center justify-between shadow-sm z-10 w-full">
              <PremiumHeading level={3} showLeftBorder={true} className="mb-0 text-lg font-bold">
                접수 상세내용
              </PremiumHeading>
              <button onClick={() => setSelectedId(null)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-50 hover:bg-gray-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <div className="space-y-6">
                
                {/* Customer Info Card */}
                <PremiumCard className="!rounded-[20px] shadow-[0_2px_15px_rgba(0,0,0,0.03)] flex flex-col gap-3">
                  <div className="flex items-baseline justify-between pb-3 border-b border-gray-50 dark:border-zinc-800">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{activeConsultation.name}</div>
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400 font-mono">{activeConsultation.phone}</div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-[13px]">
                    <div>
                      <span className="text-gray-500 mr-2">생년월일</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{activeConsultation.birth_date || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 mr-2">접수일시</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{new Date(activeConsultation.created_at).toLocaleString('ko-KR')}</span>
                    </div>
                  </div>
                </PremiumCard>

                <ConsultationDetailCard 
                  data={{
                    category: activeConsultation.accident_type,
                    diagnosis: activeConsultation.diagnosis,
                    date: activeConsultation.accident_date,
                    location: activeConsultation.accident_location || '',
                    details: activeConsultation.content,
                    inquiries: activeConsultation.inquiry || '',
                    insurances: [],
                    treatmentHistory: '',
                    hospitalization: false,
                    outpatient: false,
                    surgery: false,
                    test: false,
                  }} 
                  readOnly={true} 
                />

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
                  className="w-full mt-2 !rounded-xl !py-3 font-bold text-sm"
                >
                  📅 캘린더 일정으로 보내기
                </PremiumButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details BottomSheet (Mobile) */}
      <BottomSheet 
        isOpen={!!selectedId && !!activeConsultation} 
        onClose={() => setSelectedId(null)}
        showBackdrop={true}
        maxHeight="max-h-[90vh]"
        bottomOffset="bottom-[64px]"
        padding="p-0 pb-10"
      >
        {activeConsultation && (
          <div className="w-full flex flex-col px-5 pt-2">
            <div className="flex items-center gap-3 mb-5 px-1">
              <PremiumHeading level={3} showLeftBorder={true} className="mb-0 text-xl font-bold">
                접수 상세내용
              </PremiumHeading>
            </div>

            {/* Customer Info Card */}
            <PremiumCard className="!rounded-[20px] shadow-[0_2px_15px_rgba(0,0,0,0.03)] mb-5 flex flex-col gap-3 p-5">
              <div className="flex items-baseline justify-between pb-3 border-b border-gray-50 dark:border-zinc-800">
                <div className="text-lg font-bold text-gray-900 dark:text-white">{activeConsultation.name}</div>
                <div className="text-sm font-medium text-blue-600 dark:text-blue-400 font-mono">{activeConsultation.phone}</div>
              </div>
              
              <div className="flex items-center gap-4 text-[13px] flex-wrap">
                <div>
                  <span className="text-gray-500 mr-2">생년월일</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{activeConsultation.birth_date || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-500 mr-2">접수일시</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{new Date(activeConsultation.created_at).toLocaleString('ko-KR')}</span>
                </div>
              </div>
            </PremiumCard>

            <ConsultationDetailCard 
              data={{
                category: activeConsultation.accident_type,
                diagnosis: activeConsultation.diagnosis,
                date: activeConsultation.accident_date,
                location: activeConsultation.accident_location || '',
                details: activeConsultation.content,
                inquiries: activeConsultation.inquiry || '',
                insurances: [],
                treatmentHistory: '',
                hospitalization: false,
                outpatient: false,
                surgery: false,
                test: false,
              }} 
              readOnly={true} 
            />

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
              className="w-full mt-4 !rounded-xl !py-3 font-bold text-sm"
            >
              📅 캘린더 일정으로 보내기
            </PremiumButton>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
