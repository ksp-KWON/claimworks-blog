import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Consultation } from '@/lib/supabase';
import ConsultationDetailCard from './ConsultationDetailCard';

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
    <div className="flex flex-1 h-full bg-white dark:bg-zinc-950 overflow-hidden relative">
      
      {/* List Panel */}
      <div className="flex flex-col bg-white dark:bg-zinc-900 overflow-hidden flex-1 w-full">
        <div className="h-14 px-4 sm:px-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center shrink-0 shadow-sm z-10 w-full">
          <div className="flex items-center gap-3">
            <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">예약상담 접수함</h2>
            <span className="text-[10px] md:text-xs text-gray-400 font-medium hidden sm:inline">홈페이지를 통해 접수된 고객 상담 요청 내역입니다.</span>
          </div>
          <div className="flex gap-2 shrink-0">
            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded-full border border-blue-100 dark:border-blue-800">
              총 {consultations.length}건
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar p-0">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800">
            <thead className="bg-gray-50 dark:bg-zinc-950 sticky top-0 z-10 shadow-sm">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">상태</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">접수일</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">고객명 / 연락처</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사고 개요</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">관리</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-800">
              {consultations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                    아직 접수된 상담 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                consultations.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => handleRowClick(item.id)}
                    className={`cursor-pointer transition-colors ${selectedId === item.id && isSplitView ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <select
                        value={item.status}
                        onChange={(e) => updateStatus(item.id, e.target.value)}
                        className={`text-xs font-bold rounded-md px-2 py-1 outline-none border-0 cursor-pointer shadow-sm ${
                          item.status === '대기' ? 'bg-red-100 text-red-800' :
                          item.status === '보류' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <option value="대기">대기</option>
                        <option value="상담완료">상담완료</option>
                        <option value="보류">보류</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(item.created_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute:'2-digit' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{item.name}</div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 font-medium">{item.phone}</div>
                      {item.birth_date && <div className="text-[10px] text-gray-400 mt-1">생년월일: {item.birth_date}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded border border-blue-200 dark:border-blue-800">
                          {item.accident_type}
                        </span>
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                          {item.diagnosis}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        <span className="font-semibold text-gray-800 dark:text-gray-300 mr-1">[{item.accident_date}]</span>
                        {item.content}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={() => deleteConsultation(item.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
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
        </div>
      </div>

      {/* Details Modal */}
      {selectedId && activeConsultation && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-opacity" 
          onClick={() => setSelectedId(null)}
        >
          <div 
            className="bg-gray-50 dark:bg-zinc-950 w-full max-w-3xl max-h-[90vh] sm:max-h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden border border-gray-200 dark:border-zinc-700 animate-in fade-in zoom-in-95 duration-200" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-16 px-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 flex items-center justify-between shadow-sm z-10 w-full">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                접수 항목 상세정보
              </h3>
              <button onClick={() => setSelectedId(null)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <div className="space-y-6">
                
                {/* Customer Info Card */}
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-zinc-800">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl shadow-inner">
                      {activeConsultation.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">{activeConsultation.name}</div>
                      <div className="text-sm text-blue-600 dark:text-blue-400 font-mono mt-1">{activeConsultation.phone}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="block text-xs text-gray-500 mb-1">생년월일</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{activeConsultation.birth_date || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-500 mb-1">접수일시</span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{new Date(activeConsultation.created_at).toLocaleString('ko-KR')}</span>
                    </div>
                  </div>
                </div>

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
                  className="w-full mt-2 py-3 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-bold rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-sm border border-blue-200 dark:border-blue-800 shadow-sm"
                >
                  📅 캘린더 일정으로 보내기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
