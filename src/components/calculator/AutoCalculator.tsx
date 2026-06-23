'use client';

import { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { AutoInsuranceData, initialAutoData, INJURY_ALIMONY_TABLE } from './auto/calculator-types';
import { INJURY_DB } from './auto/injury-db';

export default function AutoCalculator() {
  const [data, setData] = useState<AutoInsuranceData>(initialAutoData);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setIsSearchFocused(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleDiagnosis = (id: string) => {
    setData(prev => {
      let newDiagnoses = [...prev.selectedDiagnoses];
      if (newDiagnoses.includes(id)) newDiagnoses = newDiagnoses.filter(d => d !== id);
      else newDiagnoses.push(id);
      
      if (newDiagnoses.length > 0) {
        const selected = INJURY_DB.filter(i => newDiagnoses.includes(i.id));
        if (selected.length > 0) {
          const highestGrade = Math.min(...selected.map(i => i.grade));
          const grades2to11 = selected.filter(i => i.grade >= 2 && i.grade <= 11);
          return { ...prev, selectedDiagnoses: newDiagnoses, injuryGrade: highestGrade, hasMultipleInjuries: grades2to11.length >= 2, isAutoGrade: true };
        }
      }
      return { ...prev, selectedDiagnoses: newDiagnoses, isAutoGrade: false, hasMultipleInjuries: false };
    });
  };

  const handleChange = (field: keyof AutoInsuranceData, value: number | boolean) => {
    let finalValue = value;
    if (typeof value === 'number') {
      if (field === 'faultRatio' || field === 'disabilityRate') finalValue = Math.min(100, Math.max(0, value));
      else finalValue = Math.max(0, value);
    }
    setData(prev => ({ ...prev, [field]: finalValue }));
  };



  const fmt = (val: number | string) => {
    if (!val) return '';
    return Number(val.toString().replace(/,/g, '')).toLocaleString();
  };
  const parse = (val: string) => Math.max(0, Number(val.replace(/[^0-9]/g, '')) || 0);

  // ── 계산 로직 ──
  const getHoffmanCoefficient = (months: number) => {
    let sum = 0;
    for (let i = 1; i <= months; i++) sum += 1 / (1 + 0.05 * (i / 12));
    return Math.min(sum, 240);
  };

  const calculateResult = () => {
    const formulas: string[] = [];
    const deathAlimony = data.hasDeath ? (data.ageAtAccident >= 65 ? 50000000 : 80000000) : 0;
    const disabilityAlimony = data.hasDisability ? 80000000 * (data.disabilityRate / 100) * 0.7 : 0;
    const appliedInjuryGrade = (data.hasMultipleInjuries && data.injuryGrade >= 2 && data.injuryGrade <= 11) ? Math.max(1, data.injuryGrade - 1) : data.injuryGrade;
    const injuryAlimony = data.hasInjury ? (INJURY_ALIMONY_TABLE[appliedInjuryGrade] || 150000) : 0;

    const alimony = Math.max(deathAlimony, disabilityAlimony, injuryAlimony, 0);
    let appliedAlimonyLabel = "위자료 (미해당)";
    if (alimony > 0) {
      if (alimony === deathAlimony && data.hasDeath) {
        appliedAlimonyLabel = "사망 위자료";
        formulas.push(`사망 위자료: ${data.ageAtAccident >= 65 ? '65세 이상(5,000만 원)' : '65세 미만(8,000만 원)'}`);
      } else if (alimony === disabilityAlimony && data.hasDisability) {
        appliedAlimonyLabel = `후유장해 위자료 (${data.disabilityRate}%)`;
        formulas.push(`후유장해 위자료: 장해율에 따른 기준액 산출`);
      } else if (alimony === injuryAlimony && data.hasInjury) {
        appliedAlimonyLabel = `부상 위자료 (${appliedInjuryGrade}급)`;
        formulas.push(`부상 위자료: 상해 ${appliedInjuryGrade}급 기준액 적용`);
      }
    }

    const canClaimLostIncome = data.ageAtAccident < 65 || data.isIncomeProven;
    const dailyIncome = data.income / 30;
    const lostIncome = (data.hasInjury && canClaimLostIncome) ? Math.floor(dailyIncome * data.hospitalDays * 0.85) : 0;
    if (data.hasInjury && lostIncome > 0) formulas.push(`휴업손해: (월소득/30) × ${data.hospitalDays}일 × 85% = ${lostIncome.toLocaleString()}원`);

    const otherDamages = data.hasInjury ? data.outpatientDays * 8000 : 0;
    if (otherDamages > 0) formulas.push(`기타손배금: 통원 ${data.outpatientDays}일 × 8,000원`);

    let lostEarnings = 0;
    const DAILY_WORKER_WAGE = 3284525;
    const actualIncome = data.isIncomeProven ? data.income : DAILY_WORKER_WAGE;
    
    let totalMonths = 0;
    if (data.ageAtAccident < 62) totalMonths = Math.max((65 - data.ageAtAccident) * 12, 0);
    else if (data.ageAtAccident < 67) totalMonths = 36;
    else if (data.ageAtAccident < 76) totalMonths = 24;
    else totalMonths = 12;

    const monthsUntil65 = Math.max((65 - data.ageAtAccident) * 12, 0);
    const segment1Months = Math.min(totalMonths, monthsUntil65);
    const segment2Months = totalMonths - segment1Months;
    const hoffman1 = getHoffmanCoefficient(segment1Months);
    const hoffman2 = segment2Months > 0 ? (getHoffmanCoefficient(totalMonths) - hoffman1) : 0;

    if (data.hasDeath) {
      formulas.push(`사망 장례비: 약관 기준 500만 원 기본 적용`);
      if (!(data.ageAtAccident >= 65 && !data.isIncomeProven)) {
        const earning1 = Math.floor(actualIncome * (2/3) * hoffman1);
        const earning2 = Math.floor(DAILY_WORKER_WAGE * (2/3) * hoffman2);
        lostEarnings = earning1 + earning2;
        formulas.push(`사망 상실수익액(생활비 1/3 공제 반영): ${lostEarnings.toLocaleString()}원`);
      }
    } else if (data.hasDisability && data.disabilityRate > 0) {
      const limitedTotalMonths = data.disabilityYears === 0 ? totalMonths : Math.min(data.disabilityYears * 12, totalMonths);
      const limitedSeg1 = Math.min(limitedTotalMonths, segment1Months);
      const limitedSeg2 = limitedTotalMonths - limitedSeg1;
      const h1 = getHoffmanCoefficient(limitedSeg1);
      const h2 = limitedSeg2 > 0 ? (getHoffmanCoefficient(limitedTotalMonths) - h1) : 0;

      if (!(data.ageAtAccident >= 65 && !data.isIncomeProven)) {
        const earning1 = Math.floor(actualIncome * (data.disabilityRate / 100) * h1);
        const earning2 = Math.floor(DAILY_WORKER_WAGE * (data.disabilityRate / 100) * h2);
        lostEarnings = earning1 + earning2;
        formulas.push(`장해 상실수익액(${data.disabilityRate}%): ${lostEarnings.toLocaleString()}원`);
      }
    }

    const funeralCost = data.hasDeath ? 5000000 : 0;
    const totalBeforeFault = alimony + lostIncome + otherDamages + lostEarnings + data.directReceipts + data.futureTreatmentCost + funeralCost;
    const faultDeduction = Math.floor(totalBeforeFault * (data.faultRatio / 100));
    const finalTotal = totalBeforeFault - faultDeduction;

    return { alimony, appliedAlimonyLabel, lostIncome, otherDamages, lostEarnings, funeralCost, totalBeforeFault, faultDeduction, finalTotal, formulas };
  };

  const result = calculateResult();

  const exportPDF = async () => {
    if (!resultRef.current) return;
    try {
      const originalBg = resultRef.current.style.backgroundColor;
      resultRef.current.style.backgroundColor = '#ffffff';
      const imgData = await toPng(resultRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
      resultRef.current.style.backgroundColor = originalBg;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (resultRef.current.offsetHeight * pdfWidth) / resultRef.current.offsetWidth;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('보상스쿨_자동차사고_예상합의금.pdf');
    } catch (e: unknown) {
      alert(`PDF 생성 중 오류가 발생했습니다: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const shareResult = () => {
    const text = `보상스쿨 자동차사고 계산결과\n▶ 예상 합의금: ${result.finalTotal.toLocaleString()}원\n\n자세한 내역은 보상스쿨에서 확인해보세요!`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).Kakao && (window as any).Kakao.isInitialized()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).Kakao.Share.sendDefault({
        objectType: 'feed',
        content: { title: '보상스쿨 합의금 결과', description: `예상 합의금: ${result.finalTotal.toLocaleString()}원`, imageUrl: 'https://claim-works.com/og-image.png', link: { mobileWebUrl: window.location.href, webUrl: window.location.href } },
        buttons: [{ title: '결과 보기', link: { mobileWebUrl: window.location.href, webUrl: window.location.href } }],
      });
    } else if (navigator.share) {
      navigator.share({ title: '보상스쿨 자동차사고 계산결과', text: text, url: window.location.href }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text + '\n' + window.location.href);
      alert('결과가 클립보드에 복사되었습니다.');
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        
        {/* ── 좌측: 입력 폼 (5열) ── */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* 피해 유형 선택 */}
          <div className="bg-white dark:bg-[#202124] rounded-3xl p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-white/5 transition-all">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-[#f8f9fa] dark:bg-[#2d2d2d] flex items-center justify-center text-lg">📋</div>
              <h3 className="text-sm font-extrabold text-[#202124] dark:text-[#e8eaed]">발생한 피해 유형 선택</h3>
            </div>
            <div className="space-y-3">
              {[
                { key: 'hasInjury', emoji: '🩹', title: '부상 (상해)', sub: '대인배상 I', activeClass: 'border-[#1A73E8] bg-[#e8f0fe] dark:bg-[#1A73E8]/15', textActive: 'text-[#1A73E8] dark:text-[#8ab4f8]' },
                { key: 'hasDisability', emoji: '🩼', title: '후유장해', sub: '대인배상 II', activeClass: 'border-[#7C4DFF] bg-[#f3e8ff] dark:bg-[#7C4DFF]/15', textActive: 'text-[#7C4DFF] dark:text-[#ce93d8]' },
                { key: 'hasDeath', emoji: '🕊️', title: '사망', sub: '사망 피해보상', activeClass: 'border-[#d93025] bg-[#fce8e6] dark:bg-[#d93025]/15', textActive: 'text-[#d93025] dark:text-[#f28b82]' },
              ].map(item => {
                const isActive = data[item.key as keyof AutoInsuranceData] as boolean;
                return (
                  <button key={item.key} onClick={() => handleChange(item.key as keyof AutoInsuranceData, !isActive)} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${isActive ? item.activeClass : 'border-transparent bg-[#f8f9fa] dark:bg-[#2d2d2d] hover:bg-gray-50'}`}>
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="flex-1">
                      <div className={`font-black text-[14px] ${isActive ? item.textActive : 'text-[#202124] dark:text-[#e8eaed]'}`}>{item.title}</div>
                      <div className="text-[11px] text-gray-400 font-semibold">{item.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 기본 정보 */}
          <div className="bg-white dark:bg-[#202124] rounded-3xl p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-white/5 transition-all">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-[#f8f9fa] dark:bg-[#2d2d2d] flex items-center justify-center text-lg">👤</div>
              <h3 className="text-sm font-extrabold text-[#202124] dark:text-[#e8eaed]">기본 정보 (소득 및 과실)</h3>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">월 소득 / 신고소득</label>
                <div className="relative mb-2">
                  <input type="text" inputMode="numeric" value={data.income ? fmt(data.income) : ''} onChange={e => handleChange('income', parse(e.target.value))} placeholder="3,500,000" className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border-transparent rounded-xl py-3 pl-4 pr-12 text-[15px] font-black focus:ring-2 focus:ring-[#1A73E8] focus:bg-white focus:outline-none transition-all" />
                  <span className="absolute right-4 top-3.5 text-[13px] text-gray-400 font-bold">원</span>
                </div>
                <button onClick={() => { handleChange('income', 3284525); handleChange('isIncomeProven', false); }} className="w-full py-2 bg-[#e8f0fe] dark:bg-[#1A73E8]/15 text-[#1A73E8] dark:text-[#8ab4f8] text-[12px] font-bold rounded-xl hover:bg-[#d2e3fc] transition-all">📊 도시일용근로자 임금 적용 (3,284,525원)</button>
              </div>
              <div className="flex justify-between items-center bg-[#f8f9fa] dark:bg-[#2d2d2d] p-3.5 rounded-xl">
                <div>
                  <div className="text-[13px] font-bold">세법상 소득 입증 가능 여부</div>
                  <div className="text-[10px] text-gray-400">65세 이상일 경우 입증 필수</div>
                </div>
                <button onClick={() => handleChange('isIncomeProven', !data.isIncomeProven)} className={`w-11 h-6 rounded-full transition-all relative ${data.isIncomeProven ? 'bg-[#1A73E8]' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${data.isIncomeProven ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">본인 과실 비율</label>
                <div className="relative mb-2">
                  <input type="number" min="0" max="100" value={data.faultRatio === 0 ? '0' : (data.faultRatio || '')} onChange={e => handleChange('faultRatio', Number(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border-transparent rounded-xl py-3 pl-4 pr-12 text-[15px] font-black focus:ring-2 focus:ring-[#1A73E8] focus:bg-white focus:outline-none transition-all" />
                  <span className="absolute right-4 top-3.5 text-[13px] text-gray-400 font-bold">%</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0, 10, 20, 30].map(v => <button key={v} onClick={() => handleChange('faultRatio', v)} className={`py-2 rounded-lg text-[12px] font-bold border transition-all ${data.faultRatio === v ? 'bg-[#1A73E8] text-white border-[#1A73E8]' : 'bg-white dark:bg-[#2d2d2d] border-gray-200 dark:border-white/10 text-gray-600'}`}>{v}%</button>)}
                </div>
              </div>
            </div>
          </div>

          {/* 피해 상세 입력 (선택한 피해만 노출) */}
          {(data.hasInjury || data.hasDisability || data.hasDeath) && (
            <div className="bg-white dark:bg-[#202124] rounded-3xl p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-white/5 transition-all animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-full bg-[#f8f9fa] dark:bg-[#2d2d2d] flex items-center justify-center text-lg">🔍</div>
                <h3 className="text-sm font-extrabold text-[#202124] dark:text-[#e8eaed]">상세 입력 내역</h3>
              </div>
              
              <div className="space-y-6">
                {data.hasInjury && (
                  <div className="space-y-4 pb-4 border-b border-gray-100 dark:border-white/10 last:border-0">
                    <h4 className="text-[12px] font-black text-[#1A73E8] flex items-center gap-1.5"><span className="text-lg">🩹</span> 부상 치료 상세</h4>
                    <div className="relative" ref={searchRef}>
                      <input type="text" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setIsSearchFocused(true); }} onFocus={() => setIsSearchFocused(true)} placeholder="진단명 검색 (예: 경추염좌)" className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border-transparent rounded-xl py-2.5 px-4 text-[13px] font-bold focus:ring-2 focus:ring-[#1A73E8]" />
                      {isSearchFocused && searchTerm && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-[#303134] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-44 overflow-y-auto">
                          {INJURY_DB.filter(i => i.name.replace(/\s+/g, '').includes(searchTerm.replace(/\s+/g, ''))).map(i => (
                            <div key={i.id} onMouseDown={e => { e.preventDefault(); handleToggleDiagnosis(i.id); setSearchTerm(''); setIsSearchFocused(false); }} className="px-3 py-2.5 text-[12px] hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-800 flex justify-between">
                              <span>{i.name}</span><span className="font-bold text-[#1A73E8]">{i.grade}급</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {data.selectedDiagnoses.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {INJURY_DB.filter(i => data.selectedDiagnoses.includes(i.id)).map(i => (
                          <div key={i.id} className="flex items-center gap-1 bg-[#e8f0fe] dark:bg-[#1A73E8]/20 text-[#1A73E8] px-2.5 py-1 rounded-full text-[11px] font-bold">
                            <span>[{i.grade}급] {i.name}</span>
                            <button onClick={() => handleToggleDiagnosis(i.id)} className="ml-1 hover:text-red-500">✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1">입원 일수</label>
                        <input type="number" value={data.hospitalDays || ''} onChange={e => handleChange('hospitalDays', Number(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border-transparent rounded-xl py-2.5 px-3 text-[14px] font-bold focus:ring-2 focus:ring-[#1A73E8]" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1">통원 일수</label>
                        <input type="number" value={data.outpatientDays || ''} onChange={e => handleChange('outpatientDays', Number(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border-transparent rounded-xl py-2.5 px-3 text-[14px] font-bold focus:ring-2 focus:ring-[#1A73E8]" />
                      </div>
                    </div>
                  </div>
                )}
                
                {data.hasDisability && (
                  <div className="space-y-4 pb-4 border-b border-gray-100 dark:border-white/10 last:border-0">
                    <h4 className="text-[12px] font-black text-[#7C4DFF] flex items-center gap-1.5"><span className="text-lg">🩼</span> 후유장해 상세</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1">장해율 (%)</label>
                        <input type="number" value={data.disabilityRate || ''} onChange={e => handleChange('disabilityRate', Number(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border-transparent rounded-xl py-2.5 px-3 text-[14px] font-bold focus:ring-2 focus:ring-[#7C4DFF]" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1">장해 기간 (0=영구)</label>
                        <input type="number" value={data.disabilityYears === 0 ? '0' : (data.disabilityYears || '')} onChange={e => handleChange('disabilityYears', Number(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border-transparent rounded-xl py-2.5 px-3 text-[14px] font-bold focus:ring-2 focus:ring-[#7C4DFF]" />
                      </div>
                    </div>
                  </div>
                )}

                {data.hasDeath && (
                  <div className="space-y-4">
                    <h4 className="text-[12px] font-black text-[#d93025] flex items-center gap-1.5"><span className="text-lg">🕊️</span> 사망 상세</h4>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">사고 당시 만 나이</label>
                      <input type="number" value={data.ageAtAccident || ''} onChange={e => handleChange('ageAtAccident', Number(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border-transparent rounded-xl py-2.5 px-3 text-[14px] font-bold focus:ring-2 focus:ring-[#d93025]" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 추가 비용 */}
          <div className="bg-white dark:bg-[#202124] rounded-3xl p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-white/5 transition-all">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-[#f8f9fa] dark:bg-[#2d2d2d] flex items-center justify-center text-lg">💊</div>
              <h3 className="text-sm font-extrabold text-[#202124] dark:text-[#e8eaed]">기타 추가 비용</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">직불 치료비 (개인 지출 영수증)</label>
                <div className="relative">
                  <input type="text" inputMode="numeric" value={data.directReceipts ? fmt(data.directReceipts) : ''} onChange={e => handleChange('directReceipts', parse(e.target.value))} placeholder="0" className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border-transparent rounded-xl py-3 pl-4 pr-12 text-[15px] font-black focus:ring-2 focus:ring-[#34A853] focus:outline-none transition-all" />
                  <span className="absolute right-4 top-3.5 text-[13px] text-gray-400 font-bold">원</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">향후 치료비 (성형, 흉터 제거 등)</label>
                <div className="relative">
                  <input type="text" inputMode="numeric" value={data.futureTreatmentCost ? fmt(data.futureTreatmentCost) : ''} onChange={e => handleChange('futureTreatmentCost', parse(e.target.value))} placeholder="0" className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border-transparent rounded-xl py-3 pl-4 pr-12 text-[15px] font-black focus:ring-2 focus:ring-[#34A853] focus:outline-none transition-all" />
                  <span className="absolute right-4 top-3.5 text-[13px] text-gray-400 font-bold">원</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 우측: 세련된 결과 명세서 패널 (7열, 스티키 고정) ── */}
        <div className="lg:col-span-7 lg:sticky lg:top-[100px] flex flex-col gap-5">
          <div className="bg-[#f8f9fa] dark:bg-[#2d2d2d] rounded-3xl px-6 py-5 border border-gray-100 dark:border-white/5 flex items-center gap-3">
            <span className="text-2xl">📑</span>
            <div>
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white">자동차사고 합의금 명세서</h2>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">입력하신 정보를 바탕으로 산출된 예상 합의금 내역입니다.</p>
            </div>
          </div>

          <div ref={resultRef} className="flex flex-col gap-5">
            {/* 최종 합의금 카드: 멋진 파란색 그라데이션 적용 */}
            <div className="bg-gradient-to-br from-[#1A73E8] to-[#1557b0] dark:from-[#2e7bf2] dark:to-[#1A73E8] rounded-3xl p-8 sm:p-10 text-white shadow-xl shadow-[#1A73E8]/20 relative overflow-hidden transition-all duration-300 hover:scale-[1.01]">
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-xl pointer-events-none transform -translate-x-10 translate-y-10"></div>
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-black/15 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-bold text-white/90 uppercase tracking-widest mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse"></span>
                    예상 합의금 (과실 상계 후)
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                    <div className="text-5xl sm:text-6xl font-black tracking-tight drop-shadow-sm">
                      {result.finalTotal.toLocaleString()}
                    </div>
                    <div className="text-2xl font-bold text-white/90 mb-1.5">원</div>
                  </div>
                </div>
                
                <div className="mt-8 pt-5 border-t border-white/20 flex flex-wrap gap-4 text-[13px] font-semibold text-white/90">
                  <div className="flex items-center gap-1.5"><span className="text-white/60">피해 유형:</span><span>{[data.hasInjury && '부상', data.hasDisability && '장해', data.hasDeath && '사망'].filter(Boolean).join(', ') || '미입력'}</span></div>
                  <div className="flex items-center gap-1.5"><span className="text-white/60">월 소득:</span><span>{data.income.toLocaleString()}원</span></div>
                  <div className="flex items-center gap-1.5"><span className="text-white/60">본인 과실:</span><span className="bg-white/20 px-2 py-0.5 rounded text-white">{data.faultRatio}%</span></div>
                </div>
              </div>
            </div>

            {/* 세부 보상 내역 */}
            <div className="bg-white dark:bg-[#202124] rounded-3xl border border-gray-200 dark:border-white/10 p-7 shadow-sm">
              <h3 className="text-[13px] font-extrabold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2 mb-5">
                <span className="w-1 h-4 bg-[#1A73E8] rounded-full"></span> 세부 보상 내역
              </h3>
              
              <div className="space-y-4 text-[13px] font-medium text-gray-600 dark:text-gray-400">
                {result.alimony > 0 && (
                  <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-white/5">
                    <span>{result.appliedAlimonyLabel} <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded ml-1">최대치</span></span>
                    <span className="font-bold text-[#202124] dark:text-[#e8eaed]">{result.alimony.toLocaleString()} 원</span>
                  </div>
                )}
                
                {data.hasInjury && (
                  <>
                    <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-white/5">
                      <span>휴업손해 (입원 {data.hospitalDays}일)</span>
                      <span className="font-bold text-[#202124] dark:text-[#e8eaed]">{result.lostIncome.toLocaleString()} 원</span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-white/5">
                      <span>기타손배금 (통원 {data.outpatientDays}일)</span>
                      <span className="font-bold text-[#202124] dark:text-[#e8eaed]">{result.otherDamages.toLocaleString()} 원</span>
                    </div>
                  </>
                )}
                
                {data.hasDeath && (
                  <>
                    <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-white/5">
                      <span>사망 장례비</span><span className="font-bold text-[#202124] dark:text-[#e8eaed]">{result.funeralCost.toLocaleString()} 원</span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-white/5">
                      <span>상실수익액 (사망, {data.ageAtAccident}세)</span><span className="font-bold text-[#202124] dark:text-[#e8eaed]">{result.lostEarnings.toLocaleString()} 원</span>
                    </div>
                  </>
                )}
                
                {!data.hasDeath && data.hasDisability && (
                  <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-white/5">
                    <span>상실수익액 (장해 {data.disabilityRate}%)</span><span className="font-bold text-[#202124] dark:text-[#e8eaed]">{result.lostEarnings.toLocaleString()} 원</span>
                  </div>
                )}

                {(data.directReceipts > 0 || data.futureTreatmentCost > 0) && (
                  <div className="flex flex-col gap-2 py-2.5 border-b border-gray-100 dark:border-white/5">
                    {data.directReceipts > 0 && <div className="flex justify-between"><span>직불 치료비</span><span className="font-bold text-[#202124] dark:text-[#e8eaed]">{data.directReceipts.toLocaleString()} 원</span></div>}
                    {data.futureTreatmentCost > 0 && <div className="flex justify-between"><span>향후치료비</span><span className="font-bold text-[#202124] dark:text-[#e8eaed]">{data.futureTreatmentCost.toLocaleString()} 원</span></div>}
                  </div>
                )}

                <div className="flex justify-between items-center py-2.5">
                  <span className="font-semibold">과실 상계 전 총액</span>
                  <span className="font-bold text-[#202124] dark:text-[#e8eaed]">{result.totalBeforeFault.toLocaleString()} 원</span>
                </div>

                {data.faultRatio > 0 && (
                  <div className="flex justify-between items-center pt-2 text-red-500 font-bold">
                    <span>(-) 본인 과실 상계 ({data.faultRatio}%)</span>
                    <span>-{result.faultDeduction.toLocaleString()} 원</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-white/5 mt-1">
                  <span className="text-[15px] font-extrabold text-[#1A73E8]">최종 예상 합의금</span>
                  <span className="text-[18px] font-black text-[#1A73E8]">{result.finalTotal.toLocaleString()} 원</span>
                </div>
              </div>

              {/* 산출 계산식 */}
              {result.formulas.length > 0 && (
                <div className="mt-6 bg-[#f8f9fa] dark:bg-[#2d2d2d] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                  <h4 className="text-[12px] font-extrabold text-[#1A73E8] mb-2 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                    적용된 산출 계산식
                  </h4>
                  <ul className="list-disc list-inside text-[11px] text-gray-500 dark:text-gray-400 space-y-1.5 leading-relaxed break-keep">
                    {result.formulas.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#fce8e6]/80 dark:bg-[#d93025]/10 rounded-2xl p-4 border border-[#d93025]/20 flex gap-3 text-[12px] leading-relaxed text-[#d93025] dark:text-[#f28b82] font-semibold shadow-sm">
            <span className="shrink-0 text-base mt-0.5">⚠️</span>
            <p>위 결과는 <strong>보험회사 약관 기준</strong> 참고용입니다. 실제 소송 기준(특인) 적용 시 수천만 원 이상 증액될 수 있으므로 합의 전 보상 전문가와 상담하세요.</p>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <a href="https://open.kakao.com/o/sWeszp7" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full gap-2 py-4 bg-[#FEE500] hover:bg-[#F4DC00] text-[#000000] rounded-2xl font-bold text-[14px] sm:text-[15px] transition-all shadow-sm hover:shadow-md">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3C6.477 3 2 6.541 2 10.908c0 2.502 1.432 4.745 3.659 6.13-.314 1.157-1.14 4.183-1.182 4.341-.053.197.075.18.156.126.104-.07 3.324-2.222 4.606-3.084.887.24 1.821.366 2.761.366 5.523 0 10-3.541 10-7.908C22 6.541 17.523 3 12 3z"/>
              </svg>
              보상스쿨 1:1 무료 상담 신청하기
            </a>
            
            <div className="grid grid-cols-2 gap-2">
              <button onClick={shareResult} className="flex items-center justify-center gap-1.5 py-3.5 bg-[#f8f9fa] border border-[#dadce0] hover:bg-[#f1f3f4] text-[#1a73e8] dark:bg-[#303134] dark:border-[#5f6368] dark:text-[#8ab4f8] dark:hover:bg-[#3c4043] rounded-xl font-bold text-[13px] transition-all shadow-sm group">
                <svg className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                결과 공유하기
              </button>
              <button onClick={exportPDF} className="flex items-center justify-center gap-1.5 py-3.5 bg-[#f8f9fa] border border-[#dadce0] hover:bg-[#f1f3f4] text-[#202124] dark:bg-[#303134] dark:border-[#5f6368] dark:text-[#e8eaed] dark:hover:bg-[#3c4043] rounded-xl font-bold text-[13px] transition-all shadow-sm group">
                <svg className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                PDF 다운로드
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
