import React, { useEffect, useState, useMemo } from 'react';
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
  
  const [memoText, setMemoText] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState<'date' | 'alpha'>('date');

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
    if (!window.confirm('정말로 이 접수 내역을 삭제하시겠습니까? (목록에서 삭제 처리됩니다)')) return;
    const { error } = await supabase
      .from('consultations')
      .update({ status: '삭제' })
      .eq('id', id);
    if (error) {
      alert('삭제 중 오류가 발생했습니다.');
    } else {
      if (selectedId === id) setSelectedId(null);
      setConsultations(prev => prev.filter(c => c.id !== id));
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

  return (
    <div className="flex flex-col flex-1 h-full bg-gray-50 dark:bg-zinc-950 overflow-hidden relative">
      
      <div className="h-14 px-4 sm:px-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center shrink-0 shadow-sm z-10 w-full overflow-x-auto">
        <div className="flex items-center gap-3 shrink-0">
          <PremiumHeading level={2} className="!text-lg !mb-0 flex items-center gap-2">
            💬 상담 접수 관리
          </PremiumHeading>
          <span className="text-[10px] md:text-xs text-gray-400 font-medium hidden sm:inline">홈페이지를 통해 접수된 고객 상담 내역을 확인하고 상태를 변경합니다.</span>
        </div>
          
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <div className="relative hidden sm:block">
            <input
              type="text"
              placeholder="이름, 내용 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm bg-gray-50 dark:bg-zinc-950 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-[160px] md:w-[220px] transition-all font-medium"
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          
          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value as 'date' | 'alpha')}
            className="px-3 py-1.5 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium hidden sm:block"
          >
            <option value="date">최신순</option>
            <option value="alpha">가나다순</option>
          </select>

          <PremiumButton 
            onClick={fetchConsultations} 
            disabled={isLoading} 
            variant="secondary"
            className="!p-2"
            title="새로고침"
          >
            <svg className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-500' : 'text-gray-600 dark:text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </PremiumButton>
        </div>
      </div>

      {/* List Panel */}
      <div className="flex flex-col bg-gray-50 dark:bg-zinc-950 overflow-hidden flex-1 w-full">

        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar p-4 md:p-8">
          {/* 데스크탑 버전 (카드형 리스트) */}
          <div className="hidden md:flex flex-col space-y-3 pb-8">
            {/* 헤더 */}
            <div className="flex px-6 py-3.5 bg-white dark:bg-zinc-800 rounded-xl text-sm font-bold text-gray-500 shadow-sm border border-gray-200 dark:border-zinc-700">
              <div className="w-24 text-center uppercase tracking-wider">상태</div>
              <div className="w-36 text-center uppercase tracking-wider">접수시간</div>
              <div className="w-48 text-center uppercase tracking-wider">상담자 정보</div>
              <div className="flex-1 text-center uppercase tracking-wider">주요 내용</div>
            </div>

            {/* 목록 */}
            {sortedAndFilteredConsultations.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
                {searchQuery ? '검색 결과가 없습니다.' : '아직 접수된 상담 내역이 없습니다.'}
              </div>
            ) : (
              sortedAndFilteredConsultations.map((item) => (
                <PremiumCard 
                  key={item.id} 
                  className={`p-0 overflow-hidden transition-colors group cursor-pointer ${selectedId === item.id ? 'border-blue-400 bg-blue-50/10' : 'hover:border-blue-300'}`}
                  onClick={() => handleRowClick(item.id)}
                >
                  <div className="flex items-center px-6 py-4">
                    <div className="w-24 flex items-center justify-center" onClick={e => e.stopPropagation()}>
                      <select
                        value={item.status === '상담완료' || item.status === '상담 완료' ? '완료' : item.status}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'delete') {
                            e.target.value = item.status;
                            deleteConsultation(item.id);
                          } else {
                            updateStatus(item.id, val);
                          }
                        }}
                        className={`text-sm font-bold px-3 py-1 outline-none border-0 cursor-pointer shadow-sm rounded-lg ${
                          item.status === '대기' ? 'bg-red-50 text-red-600' :
                          item.status === '상담' ? 'bg-blue-50 text-blue-600' :
                          (item.status === '완료' || item.status === '상담완료' || item.status === '상담 완료') ? 'bg-green-50 text-green-600' :
                          item.status === '보류' ? 'bg-yellow-50 text-yellow-600' :
                          'bg-gray-50 text-gray-600'
                        }`}
                      >
                        <option value="대기" className="text-gray-900 bg-white font-medium">대기</option>
                        <option value="상담" className="text-gray-900 bg-white font-medium">상담</option>
                        <option value="완료" className="text-gray-900 bg-white font-medium">완료</option>
                        <option value="보류" className="text-gray-900 bg-white font-medium">보류</option>
                        <option value="delete" className="text-red-600 bg-white font-bold">삭제</option>
                      </select>
                    </div>
                    
                    <div className="w-36 text-center">
                      <span className="text-sm font-mono text-gray-600 dark:text-gray-400 font-medium">
                        {formatDateTime(item.created_at)}
                      </span>
                    </div>

                    <div className="w-48 text-center px-2">
                      <div className="flex items-center justify-center gap-3 text-sm">
                        <span className="font-bold text-gray-900 dark:text-white truncate max-w-[80px]">{item.name}</span>
                        <span className="text-blue-600 dark:text-blue-400 font-medium font-mono whitespace-nowrap">{item.phone}</span>
                      </div>
                    </div>

                    <div className="flex-1 px-4 min-w-0">
                      <div className="flex items-center gap-3 text-sm text-gray-800 dark:text-gray-300 w-full">
                        <div className="shrink-0">
                          <PremiumBadge color="blue" className="px-2 whitespace-nowrap">{item.accident_type}</PremiumBadge>
                        </div>
                        <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap shrink-0 w-24 font-mono">
                          {formatAccidentDate(item.accident_date)}
                        </span>
                        <span className="text-gray-300 dark:text-gray-600 shrink-0">|</span>
                        <span className="text-gray-500 font-medium whitespace-nowrap">장소: </span>
                        <span className="truncate w-24 shrink-0" title={item.accident_location || '미상'}>{item.accident_location || '미상'}</span>
                        <span className="text-gray-300 dark:text-gray-600 shrink-0">|</span>
                        <span className="truncate min-w-0 flex-1" title={item.diagnosis}>
                          <span className="text-gray-500 font-medium">진단: </span>
                          {item.diagnosis}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Accordion Detail Component */}
                  {selectedId === item.id && (
                    <div className="border-t border-gray-100 dark:border-zinc-800 bg-[#f8f9fa] dark:bg-zinc-950/50" onClick={e => e.stopPropagation()}>
                      {renderAccordionDetail()}
                    </div>
                  )}
                </PremiumCard>
              ))
            )}
          </div>

          {/* 모바일 뷰 */}
          <div className="md:hidden space-y-3 mt-4">
            
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <select
                value={sortType}
                onChange={(e) => setSortType(e.target.value as 'date' | 'alpha')}
                className="px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="date">최신순</option>
                <option value="alpha">가나다순</option>
              </select>
            </div>

            {sortedAndFilteredConsultations.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-500 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
                {searchQuery ? '검색 결과가 없습니다.' : '아직 접수된 상담 내역이 없습니다.'}
              </div>
            ) : (
              sortedAndFilteredConsultations.map((item) => (
                <PremiumCard 
                  key={item.id}
                  onClick={() => handleRowClick(item.id)}
                  hoverEffect={true}
                  borderColor={item.status === '대기' ? 'red' : item.status === '보류' ? 'yellow' : item.status === '상담' ? 'blue' : (item.status === '완료' || item.status === '상담완료' || item.status === '상담 완료') ? 'green' : 'default'}
                  className={`flex flex-col gap-4 cursor-pointer overflow-hidden ${selectedId === item.id ? 'ring-2 ring-blue-500/50' : ''}`}
                >
                  <div className="flex justify-between items-center pl-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={item.status === '상담완료' || item.status === '상담 완료' ? '완료' : item.status}
                        onClick={e => e.stopPropagation()}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'delete') {
                            e.target.value = item.status; // revert visual selection temporarily
                            deleteConsultation(item.id);
                          } else {
                            updateStatus(item.id, val);
                          }
                        }}
                        className={`text-sm font-bold px-2.5 py-0.5 outline-none border-0 cursor-pointer shadow-sm ${
                          item.status === '대기' ? 'bg-red-50 text-red-600' :
                          item.status === '상담' ? 'bg-blue-50 text-blue-600' :
                          (item.status === '완료' || item.status === '상담완료' || item.status === '상담 완료') ? 'bg-green-50 text-green-600' :
                          item.status === '보류' ? 'bg-yellow-50 text-yellow-600' :
                          'bg-gray-50 text-gray-600'
                        }`}
                      >
                        <option value="대기" className="text-gray-900 bg-white font-medium">대기</option>
                        <option value="상담" className="text-gray-900 bg-white font-medium">상담</option>
                        <option value="완료" className="text-gray-900 bg-white font-medium">완료</option>
                        <option value="보류" className="text-gray-900 bg-white font-medium">보류</option>
                        <option value="delete" className="text-red-600 bg-white font-bold">삭제</option>
                      </select>
                      <span className="text-xs font-medium text-gray-400 font-mono">{formatDateTime(item.created_at)}</span>
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
      </div>
    </div>
  );
}
