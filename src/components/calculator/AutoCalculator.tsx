'use client';

import { useState, useRef, useEffect } from 'react';
import { useCalculatorExport } from "@/hooks/useCalculatorExport";
import { AutoInsuranceData, initialAutoData, INJURY_ALIMONY_TABLE } from './auto/calculator-types';
import { INJURY_DB } from './auto/injury-db';
import AppIcon from '@/components/ui/AppIcon';

export default function AutoCalculator() {
  const [data, setData] = useState<AutoInsuranceData>(initialAutoData);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleDiagnosis = (id: string) => {
    setData(prev => {
      let newDiagnoses = [...prev.selectedDiagnoses];
      if (newDiagnoses.includes(id)) {
        newDiagnoses = newDiagnoses.filter(d => d !== id);
      } else {
        newDiagnoses.push(id);
      }
      
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
      if (field === 'faultRatio' || field === 'disabilityRate') {
        finalValue = Math.min(100, Math.max(0, value));
      } else {
        finalValue = Math.max(0, value);
      }
    }
    setData(prev => ({ ...prev, [field]: finalValue }));
  };

  const fmt = (val: number | string) => {
    if (!val) return '';
    return Number(val.toString().replace(/,/g, '')).toLocaleString();
  };
  const parse = (val: string) => Math.max(0, Number(val.replace(/[^0-9]/g, '')) || 0);

  // ── 대법원 호프만 계수 연산 (PoT Engine) ──
  const getHoffmanCoefficient = (months: number) => {
    let sum = 0;
    for (let i = 1; i <= months; i++) {
      sum += 1 / (1 + 0.05 * (i / 12));
    }
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
    if (data.hasInjury && lostIncome > 0) {
      formulas.push(`휴업손해: (월소득/30) × ${data.hospitalDays}일 × 85% = ${lostIncome.toLocaleString()}원`);
    }

    const otherDamages = data.hasInjury ? data.outpatientDays * 8000 : 0;
    if (otherDamages > 0) {
      formulas.push(`기타손배금: 통원 ${data.outpatientDays}일 × 8,000원`);
    }

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
  const { exportPDF, shareResult } = useCalculatorExport(resultRef);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* ── 좌측: 3-Step 구조화 입력 폼 (5열) ── */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          
          {/* STEP 1: 피해 유형 선택 */}
          <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 border border-blue-200/90 dark:border-blue-900/50 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">STEP 01</span>
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">피해 유형 선택</h3>
              </div>
              <span className="text-[11px] text-gray-400 font-medium">복수 선택 가능</span>
            </div>
            
            <div className="space-y-2.5">
              {[
                { 
                  key: 'hasInjury', 
                  icon: 'bandaid' as const, 
                  title: '부상 (상해)', 
                  sub: '대인배상 I (입원·통원 치료)', 
                  activeClass: 'border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 shadow-xs' 
                },
                { 
                  key: 'hasDisability', 
                  icon: 'crutches' as const, 
                  title: '후유장해', 
                  sub: '대인배상 II (노동능력상실)', 
                  activeClass: 'border-purple-500 bg-purple-50/80 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 shadow-xs' 
                },
                { 
                  key: 'hasDeath', 
                  icon: 'rose' as const, 
                  title: '사망', 
                  sub: '사망 위자료 및 상실수익액', 
                  activeClass: 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-xs' 
                },
              ].map(item => {
                const isActive = data[item.key as keyof AutoInsuranceData] as boolean;
                return (
                  <button 
                    key={item.key} 
                    onClick={() => handleChange(item.key as keyof AutoInsuranceData, !isActive)} 
                    className={`w-full flex items-center gap-3.5 p-3.5 rounded-none border transition-all text-left cursor-pointer ${
                      isActive 
                        ? item.activeClass 
                        : 'border-gray-200 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-900/60 hover:bg-gray-100/80 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="shrink-0 flex items-center justify-center">
                      <AppIcon name={item.icon} size={20} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-[13.5px]">{item.title}</div>
                      <div className="text-[11px] opacity-75 font-medium truncate">{item.sub}</div>
                    </div>
                    <span className={`w-5 h-5 rounded-none border flex items-center justify-center text-xs font-bold ${isActive ? 'bg-current text-white border-transparent' : 'border-gray-300 dark:border-zinc-700'}`}>
                      {isActive && <AppIcon name="check" size={12} className="text-white" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: 기본 조건 입력 (소득 및 과실) */}
          <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 border border-gray-200/90 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">STEP 02</span>
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">소득 & 과실비율 입력</h3>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">월 소득 / 신고소득</label>
                <div className="relative mb-2">
                  <input 
                    type="text" 
                    inputMode="numeric" 
                    value={data.income ? fmt(data.income) : ''} 
                    onChange={e => handleChange('income', parse(e.target.value))} 
                    placeholder="3,500,000" 
                    className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none py-2.5 pl-3.5 pr-10 text-[14px] font-bold focus:border-blue-500 focus:outline-none transition-all" 
                  />
                  <span className="absolute right-3.5 top-3 text-[12px] text-gray-400 font-bold">원</span>
                </div>
                <button 
                  onClick={() => { handleChange('income', 3284525); handleChange('isIncomeProven', false); }} 
                  className="w-full py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[11.5px] font-bold rounded-none hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all flex items-center justify-center gap-1.5 border border-blue-200/60 dark:border-blue-800/60 cursor-pointer"
                >
                  <AppIcon name="chart" size={13} />
                  도시일용근로자 임금 적용 (3,284,525원)
                </button>
              </div>

              <div className="flex justify-between items-center bg-gray-50 dark:bg-zinc-900 p-3 rounded-none border border-gray-200/80 dark:border-zinc-800">
                <div>
                  <div className="text-[12px] font-bold text-gray-800 dark:text-gray-200">세법상 소득 증빙 가능</div>
                  <div className="text-[10px] text-gray-400">65세 이상일 경우 입증 필수</div>
                </div>
                <button 
                  onClick={() => handleChange('isIncomeProven', !data.isIncomeProven)} 
                  className={`w-10 h-5 rounded-full transition-all relative cursor-pointer ${data.isIncomeProven ? 'bg-blue-600' : 'bg-gray-300 dark:bg-zinc-700'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${data.isIncomeProven ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">피해자 본인 과실 비율</label>
                <div className="relative mb-2">
                  <input 
                    type="number" 
                    min="0" 
                    max="100" 
                    value={data.faultRatio === 0 ? '0' : (data.faultRatio || '')} 
                    onChange={e => handleChange('faultRatio', Number(e.target.value))} 
                    className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none py-2.5 pl-3.5 pr-10 text-[14px] font-bold focus:border-blue-500 focus:outline-none transition-all" 
                  />
                  <span className="absolute right-3.5 top-3 text-[12px] text-gray-400 font-bold">%</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0, 10, 20, 30].map(v => (
                    <button 
                      key={v} 
                      onClick={() => handleChange('faultRatio', v)} 
                      className={`py-1.5 rounded-none text-[11.5px] font-bold border transition-all cursor-pointer ${
                        data.faultRatio === v 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-50'
                      }`}
                    >
                      {v}%
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: 세부 피해 및 치료 내역 */}
          {(data.hasInjury || data.hasDisability || data.hasDeath) && (
            <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 border border-gray-200/90 dark:border-zinc-800 shadow-sm space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">STEP 03</span>
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">세부 치료 & 장해 내역</h3>
                </div>
              </div>
              
              <div className="space-y-5">
                {/* 부상 세부 */}
                {data.hasInjury && (
                  <div className="space-y-3 pb-4 border-b border-gray-100 dark:border-zinc-800 last:border-0">
                    <h4 className="text-[12px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                      <AppIcon name="bandaid" size={14} />
                      상해 진단명 & 치료 일수
                    </h4>
                    
                    <div className="relative" ref={searchRef}>
                      <input 
                        type="text" 
                        value={searchTerm} 
                        onChange={e => { setSearchTerm(e.target.value); setIsSearchFocused(true); }} 
                        onFocus={() => setIsSearchFocused(true)} 
                        placeholder="진단명 검색 (예: 뇌진탕, 염좌, 골절)" 
                        className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none py-2 px-3 text-[12.5px] font-medium focus:border-blue-500 focus:outline-none" 
                      />
                      {isSearchFocused && searchTerm && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none shadow-xl max-h-44 overflow-y-auto">
                          {INJURY_DB.filter(i => i.name.replace(/\s+/g, '').includes(searchTerm.replace(/\s+/g, ''))).map(i => (
                            <div 
                              key={i.id} 
                              onMouseDown={e => { e.preventDefault(); handleToggleDiagnosis(i.id); setSearchTerm(''); setIsSearchFocused(false); }} 
                              className="px-3 py-2 text-[12px] hover:bg-blue-50 dark:hover:bg-zinc-800 cursor-pointer border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center"
                            >
                              <span className="text-gray-800 dark:text-gray-200">{i.name}</span>
                              <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded text-[11px]">{i.grade}급</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {data.selectedDiagnoses.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {INJURY_DB.filter(i => data.selectedDiagnoses.includes(i.id)).map(i => (
                          <div key={i.id} className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-none text-[11px] font-bold">
                            <span>[{i.grade}급] {i.name}</span>
                            <button onClick={() => handleToggleDiagnosis(i.id)} className="hover:text-red-500 cursor-pointer font-normal">✕</button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1">입원 일수</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            value={data.hospitalDays || ''} 
                            onChange={e => handleChange('hospitalDays', Number(e.target.value))} 
                            placeholder="0"
                            className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none py-2 px-3 pr-7 text-[13px] font-bold focus:border-blue-500 focus:outline-none" 
                          />
                          <span className="absolute right-2.5 top-2.5 text-[11px] text-gray-400 font-bold">일</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1">통원 일수</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            value={data.outpatientDays || ''} 
                            onChange={e => handleChange('outpatientDays', Number(e.target.value))} 
                            placeholder="0"
                            className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none py-2 px-3 pr-7 text-[13px] font-bold focus:border-blue-500 focus:outline-none" 
                          />
                          <span className="absolute right-2.5 top-2.5 text-[11px] text-gray-400 font-bold">일</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 후유장해 세부 */}
                {data.hasDisability && (
                  <div className="space-y-3 pb-4 border-b border-gray-100 dark:border-zinc-800 last:border-0">
                    <h4 className="text-[12px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                      <AppIcon name="crutches" size={14} />
                      후유장해율 & 상실 기간
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1">맥브라이드 장해율</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            min="0" 
                            max="100" 
                            value={data.disabilityRate || ''} 
                            onChange={e => handleChange('disabilityRate', Number(e.target.value))} 
                            placeholder="14"
                            className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none py-2 px-3 pr-7 text-[13px] font-bold focus:border-purple-500 focus:outline-none" 
                          />
                          <span className="absolute right-2.5 top-2.5 text-[11px] text-gray-400 font-bold">%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1">장해 인정 기간</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            value={data.disabilityYears || ''} 
                            onChange={e => handleChange('disabilityYears', Number(e.target.value))} 
                            placeholder="0 (영구)"
                            className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none py-2 px-3 pr-7 text-[13px] font-bold focus:border-purple-500 focus:outline-none" 
                          />
                          <span className="absolute right-2.5 top-2.5 text-[11px] text-gray-400 font-bold">년</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 기타 비용 */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">직불 치료비</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        inputMode="numeric" 
                        value={data.directReceipts ? fmt(data.directReceipts) : ''} 
                        onChange={e => handleChange('directReceipts', parse(e.target.value))} 
                        placeholder="0" 
                        className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none py-2 px-3 pr-7 text-[13px] font-bold focus:border-blue-500 focus:outline-none" 
                      />
                      <span className="absolute right-2.5 top-2.5 text-[11px] text-gray-400 font-bold">원</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">향후 치료비</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        inputMode="numeric" 
                        value={data.futureTreatmentCost ? fmt(data.futureTreatmentCost) : ''} 
                        onChange={e => handleChange('futureTreatmentCost', parse(e.target.value))} 
                        placeholder="0" 
                        className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none py-2 px-3 pr-7 text-[13px] font-bold focus:border-blue-500 focus:outline-none" 
                      />
                      <span className="absolute right-2.5 top-2.5 text-[11px] text-gray-400 font-bold">원</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 우측: 실시간 예상 합의금 명세서 (7열, 스티키 고정) ── */}
        <div className="lg:col-span-7 lg:sticky lg:top-[100px] flex flex-col gap-4">
          <div className="bg-gray-100 dark:bg-zinc-900 px-5 py-3.5 border border-gray-200 dark:border-zinc-800 flex items-center gap-2.5">
            <AppIcon name="file-text" size={18} className="text-blue-600 dark:text-blue-400 shrink-0" />
            <div>
              <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">자동차사고 예상 합의금 명세서</h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">입력하신 조건에 따른 약관 기준 예상액입니다.</p>
            </div>
          </div>

          <div ref={resultRef} className="flex flex-col gap-4">
            {/* 최종 합의금 챔피언 카드 */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-900 p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
              <div className="relative z-10 flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-none text-[10.5px] font-bold text-white/90 uppercase tracking-wider mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse"></span>
                    예상 합의금 (과실 상계 후 최종액)
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                    <div className="text-4xl sm:text-5xl font-black tracking-tight">
                      {result.finalTotal.toLocaleString()}
                    </div>
                    <div className="text-xl font-bold text-white/90 mb-1">원</div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/20 flex flex-wrap gap-4 text-[12px] font-medium text-white/90">
                  <div><span className="text-white/60 mr-1">피해유형:</span><span className="font-bold">{[data.hasInjury && '부상', data.hasDisability && '장해', data.hasDeath && '사망'].filter(Boolean).join(', ') || '선택 없음'}</span></div>
                  <div><span className="text-white/60 mr-1">월소득:</span><span className="font-bold">{data.income.toLocaleString()}원</span></div>
                  <div><span className="text-white/60 mr-1">본인과실:</span><span className="bg-white/25 px-1.5 py-0.5 rounded text-white font-bold">{data.faultRatio}%</span></div>
                </div>
              </div>
            </div>

            {/* 세부 보상 내역서 */}
            <div className="bg-white dark:bg-[#202124] border border-gray-200 dark:border-zinc-800 p-5 sm:p-6 shadow-xs space-y-3">
              <h3 className="text-xs font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5 mb-3">
                <span className="w-1 h-3.5 bg-blue-600 rounded-none"></span> 세부 산출 내역
              </h3>
              
              <div className="space-y-2.5 text-[12.5px] text-gray-600 dark:text-gray-400">
                {result.alimony > 0 && (
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-zinc-800/80">
                    <span>{result.appliedAlimonyLabel}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{result.alimony.toLocaleString()} 원</span>
                  </div>
                )}
                
                {data.hasInjury && (
                  <>
                    <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-zinc-800/80">
                      <span>휴업손해 (입원 {data.hospitalDays}일)</span>
                      <span className="font-bold text-gray-900 dark:text-white">{result.lostIncome.toLocaleString()} 원</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-zinc-800/80">
                      <span>기타손배금 (통원 {data.outpatientDays}일)</span>
                      <span className="font-bold text-gray-900 dark:text-white">{result.otherDamages.toLocaleString()} 원</span>
                    </div>
                  </>
                )}
                
                {data.hasDeath && (
                  <>
                    <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-zinc-800/80">
                      <span>사망 장례비</span>
                      <span className="font-bold text-gray-900 dark:text-white">{result.funeralCost.toLocaleString()} 원</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-zinc-800/80">
                      <span>상실수익액 (사망, {data.ageAtAccident}세)</span>
                      <span className="font-bold text-gray-900 dark:text-white">{result.lostEarnings.toLocaleString()} 원</span>
                    </div>
                  </>
                )}
                
                {!data.hasDeath && data.hasDisability && (
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-zinc-800/80">
                    <span>상실수익액 (장해 {data.disabilityRate}%)</span>
                    <span className="font-bold text-gray-900 dark:text-white">{result.lostEarnings.toLocaleString()} 원</span>
                  </div>
                )}

                {(data.directReceipts > 0 || data.futureTreatmentCost > 0) && (
                  <div className="flex flex-col gap-1.5 py-1.5 border-b border-gray-100 dark:border-zinc-800/80">
                    {data.directReceipts > 0 && <div className="flex justify-between"><span>직불 치료비</span><span className="font-bold text-gray-900 dark:text-white">{data.directReceipts.toLocaleString()} 원</span></div>}
                    {data.futureTreatmentCost > 0 && <div className="flex justify-between"><span>향후 치료비</span><span className="font-bold text-gray-900 dark:text-white">{data.futureTreatmentCost.toLocaleString()} 원</span></div>}
                  </div>
                )}

                <div className="flex justify-between items-center py-2 font-medium">
                  <span>과실 상계 전 총액</span>
                  <span className="font-bold text-gray-900 dark:text-white">{result.totalBeforeFault.toLocaleString()} 원</span>
                </div>

                {data.faultRatio > 0 && (
                  <div className="flex justify-between items-center py-1 text-red-500 font-bold">
                    <span>(-) 본인 과실 상계 ({data.faultRatio}%)</span>
                    <span>-{result.faultDeduction.toLocaleString()} 원</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-zinc-700 mt-2">
                  <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">최종 예상 합의금</span>
                  <span className="text-base font-black text-blue-600 dark:text-blue-400">{result.finalTotal.toLocaleString()} 원</span>
                </div>
              </div>

              {/* 산출 계산식 */}
              {result.formulas.length > 0 && (
                <div className="mt-4 bg-gray-50 dark:bg-zinc-900 p-3.5 border border-gray-200/80 dark:border-zinc-800 rounded-none">
                  <h4 className="text-[11.5px] font-bold text-blue-600 dark:text-blue-400 mb-1.5 flex items-center gap-1">
                    <AppIcon name="calculator" size={13} />
                    적용된 실무 산출식
                  </h4>
                  <ul className="list-disc list-inside text-[11px] text-gray-500 dark:text-gray-400 space-y-1 leading-relaxed break-keep">
                    {result.formulas.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* 전문가 조언 알림 배너 */}
          <div className="bg-amber-50 dark:bg-amber-950/30 p-3.5 border border-amber-200 dark:border-amber-800/60 flex gap-2.5 text-[11.5px] leading-relaxed text-amber-900 dark:text-amber-300 font-medium">
            <AppIcon name="shield-alert" size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p>위 결과는 <strong>보험회사 약관 기준</strong> 참고용입니다. 실제 소송 판례 기준(특인) 적용 시 수천만 원 이상 증액될 수 있으므로 합의 전 보상 전문가와 상담하시길 권합니다.</p>
          </div>

          {/* 상담 및 액션 버튼 그룹 */}
          <div className="flex flex-col gap-2 pt-1">
            <button 
              onClick={() => { document.getElementById('chat-floating-btn')?.click(); }} 
              className="flex items-center justify-center w-full gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-none font-extrabold text-[14px] transition-all shadow-md shadow-blue-500/20 cursor-pointer" 
              id="auto-calc-chat-btn"
            >
              <AppIcon name="chat" size={18} />
              손해사정사 1:1 무료 상담 신청
            </button>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => shareResult('자동차사고', result.finalTotal)} 
                className="flex items-center justify-center gap-1.5 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 hover:border-blue-500 text-gray-700 dark:text-gray-300 rounded-none font-bold text-[12px] transition-all cursor-pointer"
              >
                <AppIcon name="link" size={14} />
                결과 공유하기
              </button>
              <button 
                onClick={() => exportPDF('보상스쿨_자동차사고_예상합의금.pdf')} 
                className="flex items-center justify-center gap-1.5 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 hover:border-blue-500 text-gray-700 dark:text-gray-300 rounded-none font-bold text-[12px] transition-all cursor-pointer"
              >
                <AppIcon name="file-text" size={14} />
                PDF 다운로드
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
