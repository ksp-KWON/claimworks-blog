'use client';

import { useState, useRef, useEffect } from 'react';
import { useCalculatorExport } from "@/hooks/useCalculatorExport";
import { AutoInsuranceData, initialAutoData, INJURY_ALIMONY_TABLE } from './auto/calculator-types';
import { INJURY_DB } from './auto/injury-db';
import AppIcon from '@/components/ui/AppIcon';
import PremiumHeading from '@/components/ui/PremiumHeading';

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
        formulas.push(`부상 위자료: 상해 ${appliedInjuryGrade}급 약관 기준액 적용`);
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
      formulas.push(`기타손해배상금: 통원 ${data.outpatientDays}일 × 8,000원 = ${otherDamages.toLocaleString()}원`);
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
    <div className="w-full space-y-6">
      {/* 1. 타이틀 헤더 */}
      <div className="text-center space-y-2 mb-2">
        <PremiumHeading level={1} gradient="blue" className="justify-center !text-2xl sm:!text-3xl">
          자동차보험 합의금 계산기
        </PremiumHeading>
        <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-xl mx-auto leading-relaxed font-medium">
          대인배상 약관 기준(부상·장해·사망) 및 과실상계를 적용한 실시간 예상 합의금입니다.
        </p>
      </div>

      {/* 2. 🏆 상단 실시간 예상 합의금 챔피언 카드 */}
      <div ref={resultRef} className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-900 p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-xs px-3 py-1.5 text-xs font-extrabold text-white/90 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-blue-300 animate-pulse"></span>
              실시간 예상 합의금 (과실 상계 후 최종액)
            </span>
            <span className="text-xs sm:text-[13px] text-white/80 font-bold">
              본인 과실 {data.faultRatio}% 반영
            </span>
          </div>

          <div className="flex items-end gap-2 mb-5">
            <div className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight drop-shadow-xs">
              {result.finalTotal.toLocaleString()}
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white/90 mb-1">원</div>
          </div>

          <div className="pt-4 border-t border-white/20 flex flex-wrap items-center justify-between text-xs sm:text-sm text-white/90 font-medium gap-3">
            <div>
              <span className="text-white/60 mr-1.5">피해 유형:</span>
              <span className="font-bold text-white">{[data.hasInjury && '부상(치료)', data.hasDisability && '후유장해', data.hasDeath && '사망'].filter(Boolean).join(', ') || '선택 없음'}</span>
            </div>
            <div>
              <span className="text-white/60 mr-1.5">월 소득:</span>
              <span className="font-bold text-white">{data.income.toLocaleString()}원</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 🛠️ 스마트 인터랙티브 입력 카드 (단일 스트림) */}
      <div className="space-y-4">
        
        {/* [섹션 1] 피해 유형 선택 칩 */}
        <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 border border-blue-200/90 dark:border-blue-900/50 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <AppIcon name="bandaid" size={18} className="text-blue-600" />
              1. 발생한 피해 유형 선택
            </h2>
            <span className="text-xs text-gray-400 font-medium">복수 선택 가능</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { key: 'hasInjury', label: '부상 (치료)', sub: '입원·통원 치료비', color: 'blue' },
              { key: 'hasDisability', label: '후유장해', sub: '노동력 상실수익액', color: 'purple' },
              { key: 'hasDeath', label: '사망', sub: '유족 보상 및 장례비', color: 'rose' },
            ].map(item => {
              const isActive = data[item.key as keyof AutoInsuranceData] as boolean;
              return (
                <button
                  key={item.key}
                  onClick={() => handleChange(item.key as keyof AutoInsuranceData, !isActive)}
                  className={`p-3 sm:p-4 text-center border transition-all cursor-pointer ${
                    isActive
                      ? 'border-blue-600 bg-blue-50/90 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-extrabold shadow-xs'
                      : 'border-gray-200 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-900/60 text-gray-700 dark:text-zinc-300 hover:bg-gray-100'
                  }`}
                >
                  <div className="text-xs sm:text-sm font-extrabold">{item.label}</div>
                  <div className="text-[11px] opacity-75 mt-1 font-medium">{item.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* [섹션 2] 기본 정보 (소득 및 과실) */}
        <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 border border-gray-200/90 dark:border-zinc-800 shadow-xs space-y-4">
          <h2 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <AppIcon name="chart" size={18} className="text-blue-600" />
            2. 월 소득 및 피해자 과실 비율
          </h2>

          <div className="space-y-4">
            {/* 소득 입력 & 도시일용 퀵 버튼 */}
            <div>
              <label className="block text-xs sm:text-[13px] font-bold text-gray-700 dark:text-gray-300 mb-1.5">월 소득 (세전 기준)</label>
              <div className="flex gap-2.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={data.income ? fmt(data.income) : ''}
                    onChange={e => handleChange('income', parse(e.target.value))}
                    placeholder="3,500,000"
                    className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 py-2.5 px-3.5 pr-8 text-sm font-bold text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-3 text-xs text-gray-400 font-bold">원</span>
                </div>
                <button
                  onClick={() => { handleChange('income', 3284525); handleChange('isIncomeProven', false); }}
                  className="px-3 py-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 text-xs sm:text-[12.5px] font-extrabold hover:bg-blue-100 transition-colors cursor-pointer shrink-0"
                >
                  도시일용임금 자동 적용 (3,284,525원)
                </button>
              </div>
            </div>

            {/* 과실 비율 퀵 칩 */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs sm:text-[13px] font-bold text-gray-700 dark:text-gray-300">본인 과실 비율</label>
                <span className="text-xs sm:text-sm font-extrabold text-blue-600 dark:text-blue-400">{data.faultRatio}%</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[0, 10, 20, 30, 50].map(v => (
                  <button
                    key={v}
                    onClick={() => handleChange('faultRatio', v)}
                    className={`py-2 text-xs sm:text-[13px] font-extrabold border transition-all cursor-pointer ${
                      data.faultRatio === v
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-100'
                    }`}
                  >
                    {v}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* [섹션 3] 세부 치료 & 장해 내역 */}
        {(data.hasInjury || data.hasDisability || data.hasDeath) && (
          <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 border border-gray-200/90 dark:border-zinc-800 shadow-xs space-y-4 animate-in fade-in duration-200">
            <h2 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <AppIcon name="crutches" size={18} className="text-purple-600" />
              3. 세부 치료 및 장해 상세 입력
            </h2>

            <div className="space-y-4 pt-1">
              {/* 부상 치료 상세 */}
              {data.hasInjury && (
                <div className="space-y-3 pb-4 border-b border-gray-100 dark:border-zinc-800 last:border-0">
                  <div className="relative" ref={searchRef}>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={e => { setSearchTerm(e.target.value); setIsSearchFocused(true); }}
                      onFocus={() => setIsSearchFocused(true)}
                      placeholder="상해 진단명 검색 (예: 뇌진탕, 경추염좌, 십자인대 파열, 골절)"
                      className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 py-2.5 px-3.5 text-xs sm:text-sm font-medium focus:border-blue-500 focus:outline-none"
                    />
                    {isSearchFocused && searchTerm && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-xl max-h-48 overflow-y-auto">
                        {INJURY_DB.filter(i => i.name.replace(/\s+/g, '').includes(searchTerm.replace(/\s+/g, ''))).map(i => (
                          <div
                            key={i.id}
                            onMouseDown={e => { e.preventDefault(); handleToggleDiagnosis(i.id); setSearchTerm(''); setIsSearchFocused(false); }}
                            className="px-4 py-2.5 text-xs sm:text-sm hover:bg-blue-50 dark:hover:bg-zinc-800 cursor-pointer border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center"
                          >
                            <span className="font-medium">{i.name}</span>
                            <span className="font-extrabold text-blue-600 text-xs">[{i.grade}급]</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {data.selectedDiagnoses.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {INJURY_DB.filter(i => data.selectedDiagnoses.includes(i.id)).map(i => (
                        <div key={i.id} className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-1 text-xs font-bold">
                          <span>[{i.grade}급] {i.name}</span>
                          <button onClick={() => handleToggleDiagnosis(i.id)} className="hover:text-red-500 cursor-pointer ml-1">✕</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">입원 일수 (휴업손해)</label>
                      <input
                        type="number"
                        value={data.hospitalDays || ''}
                        onChange={e => handleChange('hospitalDays', Number(e.target.value))}
                        placeholder="0"
                        className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 py-2 px-3 text-sm font-bold text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">통원 일수 (기타손배금)</label>
                      <input
                        type="number"
                        value={data.outpatientDays || ''}
                        onChange={e => handleChange('outpatientDays', Number(e.target.value))}
                        placeholder="0"
                        className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 py-2 px-3 text-sm font-bold text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 후유장해 상세 */}
              {data.hasDisability && (
                <div className="grid grid-cols-2 gap-3 pb-4 border-b border-gray-100 dark:border-zinc-800 last:border-0">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">노동능력상실률 (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={data.disabilityRate || ''}
                      onChange={e => handleChange('disabilityRate', Number(e.target.value))}
                      placeholder="14"
                      className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 py-2 px-3 text-sm font-bold text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">장해 기간 (0=영구)</label>
                    <input
                      type="number"
                      value={data.disabilityYears || ''}
                      onChange={e => handleChange('disabilityYears', Number(e.target.value))}
                      placeholder="0"
                      className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 py-2 px-3 text-sm font-bold text-gray-900 dark:text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* 직불/향후치료비 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">직불 치료비</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={data.directReceipts ? fmt(data.directReceipts) : ''}
                    onChange={e => handleChange('directReceipts', parse(e.target.value))}
                    placeholder="0"
                    className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 py-2 px-3 text-sm font-bold text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">향후 치료비</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={data.futureTreatmentCost ? fmt(data.futureTreatmentCost) : ''}
                    onChange={e => handleChange('futureTreatmentCost', parse(e.target.value))}
                    placeholder="0"
                    className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 py-2 px-3 text-sm font-bold text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. 📋 세부 산출 명세서 (상시 100% 노출) */}
      <div className="bg-white dark:bg-[#202124] border border-gray-200 dark:border-zinc-800 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800 pb-3">
          <AppIcon name="file-text" size={18} className="text-blue-600" />
          <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white">
            세부 손해배상 산출 명세서 & 실무 산정 공식
          </h3>
        </div>

        <div className="space-y-3 text-xs sm:text-[13.5px] text-gray-700 dark:text-gray-300">
          {result.alimony > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-zinc-800/80">
              <span className="font-medium">· {result.appliedAlimonyLabel}</span>
              <span className="font-extrabold text-gray-900 dark:text-white">{result.alimony.toLocaleString()} 원</span>
            </div>
          )}
          {data.hasInjury && (
            <>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-zinc-800/80">
                <span className="font-medium">· 휴업손해 (입원 {data.hospitalDays}일, 85% 반영)</span>
                <span className="font-extrabold text-gray-900 dark:text-white">{result.lostIncome.toLocaleString()} 원</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-zinc-800/80">
                <span className="font-medium">· 기타손해배상금 (통원 {data.outpatientDays}일 × 8,000원)</span>
                <span className="font-extrabold text-gray-900 dark:text-white">{result.otherDamages.toLocaleString()} 원</span>
              </div>
            </>
          )}
          {(data.hasDisability || data.hasDeath) && (
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-zinc-800/80">
              <span className="font-medium">· 상실수익액 ({data.hasDeath ? '사망 일실수입' : `후유장해 ${data.disabilityRate}%`})</span>
              <span className="font-extrabold text-gray-900 dark:text-white">{result.lostEarnings.toLocaleString()} 원</span>
            </div>
          )}
          {(data.directReceipts > 0 || data.futureTreatmentCost > 0) && (
            <div className="flex justify-between py-2 border-b border-gray-100 dark:border-zinc-800/80">
              <span className="font-medium">· 추가 치료비 (직불 {data.directReceipts.toLocaleString()}원 + 향후 {data.futureTreatmentCost.toLocaleString()}원)</span>
              <span className="font-extrabold text-gray-900 dark:text-white">{(data.directReceipts + data.futureTreatmentCost).toLocaleString()} 원</span>
            </div>
          )}
          <div className="flex justify-between py-2 font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-zinc-700">
            <span>과실 상계 전 손해액 총합</span>
            <span>{result.totalBeforeFault.toLocaleString()} 원</span>
          </div>
          {data.faultRatio > 0 && (
            <div className="flex justify-between py-2 text-red-500 font-extrabold">
              <span>(-) 본인 과실 상계 ({data.faultRatio}%)</span>
              <span>-{result.faultDeduction.toLocaleString()} 원</span>
            </div>
          )}
          <div className="flex justify-between py-3 font-black text-sm sm:text-base text-blue-600 dark:text-blue-400 border-t-2 border-blue-600/30 dark:border-blue-400/30">
            <span>최종 예상 합의금</span>
            <span>{result.finalTotal.toLocaleString()} 원</span>
          </div>
        </div>

        {/* 계산 공식 */}
        {result.formulas.length > 0 && (
          <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-900/70 p-3.5">
            <h4 className="text-xs font-extrabold text-blue-600 dark:text-blue-400 mb-1.5 flex items-center gap-1.5">
              <AppIcon name="calculator" size={14} />
              적용된 대인배상 약관 산출식
            </h4>
            <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-400 space-y-1 leading-relaxed">
              {result.formulas.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* 5. 🛡️ 전문가 조언 및 액션 버튼 바 */}
      <div className="bg-amber-50 dark:bg-amber-950/30 p-4 border border-amber-200/80 dark:border-amber-900/40 text-xs sm:text-[13px] leading-relaxed text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
        <AppIcon name="shield-alert" size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <p>위 결과는 <strong>보험회사 대인배상 약관 지급기준</strong> 참고용입니다. 실제 소송 판례 기준(특인) 적용 시 수천만 원 이상 증액될 수 있으므로 조기 합의 전 손해사정 전문가와의 상담을 적극 권장합니다.</p>
      </div>

      <div className="space-y-2.5 pt-1">
        <button
          onClick={() => { document.getElementById('chat-floating-btn')?.click(); }}
          className="flex items-center justify-center w-full gap-2 py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm sm:text-base transition-all shadow-md shadow-blue-500/20 cursor-pointer"
        >
          <AppIcon name="chat" size={20} />
          손해사정사 1:1 무료 상담 신청하기
        </button>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => shareResult('자동차사고', result.finalTotal)}
            className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 hover:border-blue-500 text-gray-800 dark:text-gray-200 font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-xs"
          >
            <AppIcon name="link" size={15} />
            결과 링크 공유
          </button>
          <button
            onClick={() => exportPDF('보상스쿨_자동차사고_예상합의금.pdf')}
            className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 hover:border-blue-500 text-gray-800 dark:text-gray-200 font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-xs"
          >
            <AppIcon name="file-text" size={15} />
            PDF 명세서 다운로드
          </button>
        </div>
      </div>
    </div>
  );
}
