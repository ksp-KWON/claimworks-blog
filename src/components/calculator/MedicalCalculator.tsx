'use client';

import { useState, useRef } from 'react';
import { useCalculatorExport } from "@/hooks/useCalculatorExport";
import AppIcon from '@/components/ui/AppIcon';

// ── 데이터 타입 정의 ──
export type MedicalInsuranceData = {
  generation: number;
  treatmentType: 'inpatient' | 'outpatient';
  outpatientDays: number;
  clinicType: 'clinic' | 'hospital' | 'general';
  coveredCost: number;
  nonCoveredCost: number;
  manualTherapyCost: number;
  injectionCost: number;
  mriCost: number;
};

const initialMedicalData: MedicalInsuranceData = {
  generation: 1,
  treatmentType: 'outpatient',
  outpatientDays: 1,
  clinicType: 'clinic',
  coveredCost: 0,
  nonCoveredCost: 0,
  manualTherapyCost: 0,
  injectionCost: 0,
  mriCost: 0,
};

// ── 상수 정의 ──
const CLINIC_DEDUCTION = { clinic: 10000, hospital: 15000, general: 20000 };

const GENERATIONS = [
  { id: 1, label: '1세대 실손', period: '~2009년 8월', color: '#1A73E8', note: '입원 전액(100%) 보상 / 통원 5천원 공제' },
  { id: 2, label: '2세대 실손', period: '2009년 10월 ~ 2017년 3월', color: '#137333', note: '급여/비급여 통합 자기부담금 10% 공제' },
  { id: 3, label: '3세대 실손', period: '2017년 4월 ~ 2021년 6월', color: '#f29900', note: '기본형 10~20%, 3대 비급여 특약 30% 공제' },
  { id: 4, label: '4세대 실손', period: '2021년 7월 ~ 2026년 4월', color: '#d93025', note: '급여 20%, 비급여 30%, 3대 비급여 특약 30% 공제' },
  { id: 5, label: '5세대 실손', period: '2026년 5월 ~ 현재', color: '#7C4DFF', note: '급여 20%, 비급여 30%, 비중증(도수 등) 50% 공제' },
];

const HOSPITAL_TYPES = [
  { id: 'clinic', label: '의원·클리닉', desc: '동네 병의원, 한의원 (1만 원 공제)' },
  { id: 'hospital', label: '일반 병원', desc: '30병상 이상 병원급 (1.5만 원 공제)' },
  { id: 'general', label: '상급·종합병원', desc: '대학병원, 대형 상급종합 (2만 원 공제)' },
] as const;

export default function MedicalCalculator() {
  const [data, setData] = useState<MedicalInsuranceData>(initialMedicalData);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleChange = (field: keyof MedicalInsuranceData, value: number | string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const fmt = (val: number | string) => {
    if (!val) return '';
    return Number(val.toString().replace(/,/g, '')).toLocaleString();
  };
  const parse = (val: string) => Math.max(0, Number(val.replace(/[^0-9]/g, '')) || 0);

  // ── 계산 로직 (PoT 실손 연산 엔진) ──
  const calculateResult = () => {
    let coveredPayout = 0;
    let nonCoveredPayout = 0;
    let specialPayout = 0;
    let totalDeduction = 0;

    const totalCovered = data.coveredCost || 0;
    const totalNormalNonCovered = data.nonCoveredCost || 0;
    const totalSpecialNonCovered = (data.manualTherapyCost || 0) + (data.injectionCost || 0) + (data.mriCost || 0);
    
    const days = data.treatmentType === 'outpatient' ? Math.max(1, data.outpatientDays || 1) : 1;
    const formulas: string[] = [];

    if (data.generation === 1) {
      if (data.treatmentType === 'inpatient') {
        coveredPayout = totalCovered;
        nonCoveredPayout = totalNormalNonCovered;
        specialPayout = totalSpecialNonCovered;
        totalDeduction = 0;
        formulas.push(`입원 의료비 전액(100%) 보상`);
      } else {
        const totalCost = totalCovered + totalNormalNonCovered + totalSpecialNonCovered;
        totalDeduction = Math.min(totalCost, 5000 * days);
        const payout = totalCost - totalDeduction;
        coveredPayout = payout * (totalCovered / (totalCost || 1));
        nonCoveredPayout = payout * (totalNormalNonCovered / (totalCost || 1));
        specialPayout = payout * (totalSpecialNonCovered / (totalCost || 1));
        formulas.push(`통원 공제: 5,000원 × ${days}일 = ${(5000 * days).toLocaleString()}원 차감`);
      }
    } 
    else if (data.generation === 2) {
      if (data.treatmentType === 'inpatient') {
        coveredPayout = totalCovered * 0.9;
        nonCoveredPayout = totalNormalNonCovered * 0.9;
        specialPayout = totalSpecialNonCovered * 0.9;
        totalDeduction = (totalCovered + totalNormalNonCovered + totalSpecialNonCovered) * 0.1;
        formulas.push(`입원 공제: 총 의료비의 10% 차감`);
      } else {
        const totalCost = totalCovered + totalNormalNonCovered + totalSpecialNonCovered;
        const deductPerDay = CLINIC_DEDUCTION[data.clinicType];
        totalDeduction = Math.max(totalCost * 0.1, deductPerDay * days);
        const payout = Math.max(0, totalCost - totalDeduction);
        coveredPayout = payout * (totalCovered / (totalCost || 1));
        nonCoveredPayout = payout * (totalNormalNonCovered / (totalCost || 1));
        specialPayout = payout * (totalSpecialNonCovered / (totalCost || 1));
        formulas.push(`통원 공제: 병원별 최소공제(${deductPerDay.toLocaleString()}원) 또는 10% 중 큰 금액 적용`);
      }
    }
    else if (data.generation === 3) {
      if (data.treatmentType === 'inpatient') {
        coveredPayout = totalCovered * 0.9;
        nonCoveredPayout = totalNormalNonCovered * 0.8;
        specialPayout = totalSpecialNonCovered * 0.7;
        totalDeduction = (totalCovered * 0.1) + (totalNormalNonCovered * 0.2) + (totalSpecialNonCovered * 0.3);
        formulas.push(`급여 10%, 일반비급여 20%, 3대비급여 30% 각각 공제`);
      } else {
        const minDeduct = CLINIC_DEDUCTION[data.clinicType] * days;
        const normalCost = totalCovered + totalNormalNonCovered;
        const normalDeduct = Math.max(minDeduct, (totalCovered * 0.1) + (totalNormalNonCovered * 0.2));
        const actualNormalPayout = Math.max(0, normalCost - normalDeduct);
        coveredPayout = actualNormalPayout * (totalCovered / (normalCost || 1));
        nonCoveredPayout = actualNormalPayout * (totalNormalNonCovered / (normalCost || 1));
        if (normalCost > 0) formulas.push(`기본 통원 공제: MAX(의료비의 10~20%, 최소공제금액×${days}일)`);

        const specialDeduct = Math.max(20000 * days, totalSpecialNonCovered * 0.3);
        specialPayout = Math.max(0, totalSpecialNonCovered - specialDeduct);
        if (totalSpecialNonCovered > 0) formulas.push(`3대 비급여 공제: MAX(30%, 2만원×${days}일)`);

        totalDeduction = (normalCost + totalSpecialNonCovered) - (actualNormalPayout + specialPayout);
      }
    }
    else if (data.generation === 4) {
      if (data.treatmentType === 'inpatient') {
        coveredPayout = totalCovered * 0.8;
        nonCoveredPayout = totalNormalNonCovered * 0.7;
        specialPayout = totalSpecialNonCovered * 0.7;
        totalDeduction = (totalCovered * 0.2) + (totalNormalNonCovered * 0.3) + (totalSpecialNonCovered * 0.3);
        formulas.push(`급여 20%, 비급여 30%, 3대비급여 30% 각각 공제`);
      } else {
        const minCoveredDeduct = (data.clinicType === 'general' ? 20000 : 10000) * days;
        const coveredDeduct = Math.max(minCoveredDeduct, totalCovered * 0.2);
        coveredPayout = Math.max(0, totalCovered - coveredDeduct);
        if (totalCovered > 0) formulas.push(`급여 통원 공제: MAX(20%, 최소공제금액×${days}일)`);

        const nonCoveredDeduct = Math.max(30000 * days, totalNormalNonCovered * 0.3);
        nonCoveredPayout = Math.max(0, totalNormalNonCovered - nonCoveredDeduct);
        if (totalNormalNonCovered > 0) formulas.push(`일반 비급여 공제: MAX(30%, 3만원×${days}일)`);

        const specialDeduct = Math.max(30000 * days, totalSpecialNonCovered * 0.3);
        specialPayout = Math.max(0, totalSpecialNonCovered - specialDeduct);
        if (totalSpecialNonCovered > 0) formulas.push(`3대 비급여 공제: MAX(30%, 3만원×${days}일)`);

        const totalCost = totalCovered + totalNormalNonCovered + totalSpecialNonCovered;
        totalDeduction = totalCost - (coveredPayout + nonCoveredPayout + specialPayout);
      }
    }
    else if (data.generation === 5) {
      if (data.treatmentType === 'inpatient') {
        coveredPayout = totalCovered * 0.8;
        nonCoveredPayout = totalNormalNonCovered * 0.7;
        specialPayout = totalSpecialNonCovered * 0.5;
        totalDeduction = (totalCovered * 0.2) + (totalNormalNonCovered * 0.3) + (totalSpecialNonCovered * 0.5);
        formulas.push(`급여 20%, 비급여 30%, 비중증(3대특약 등) 50% 각각 공제`);
      } else {
        const minCoveredDeduct = (data.clinicType === 'general' ? 20000 : 10000) * days;
        const coveredDeduct = Math.max(minCoveredDeduct, totalCovered * 0.2);
        coveredPayout = Math.max(0, totalCovered - coveredDeduct);
        if (totalCovered > 0) formulas.push(`급여 통원 공제: MAX(20%, 최소공제금액×${days}일)`);

        const nonCoveredDeduct = Math.max(30000 * days, totalNormalNonCovered * 0.3);
        nonCoveredPayout = Math.max(0, totalNormalNonCovered - nonCoveredDeduct);
        if (totalNormalNonCovered > 0) formulas.push(`일반 비급여 공제: MAX(30%, 3만원×${days}일)`);

        const specialDeduct = Math.max(30000 * days, totalSpecialNonCovered * 0.5);
        specialPayout = Math.max(0, totalSpecialNonCovered - specialDeduct);
        if (totalSpecialNonCovered > 0) formulas.push(`비중증(3대특약) 공제: MAX(50%, 3만원×${days}일)`);

        const totalCost = totalCovered + totalNormalNonCovered + totalSpecialNonCovered;
        totalDeduction = totalCost - (coveredPayout + nonCoveredPayout + specialPayout);
      }
    }

    const totalPayout = coveredPayout + nonCoveredPayout + specialPayout;
    const totalCost = totalCovered + totalNormalNonCovered + totalSpecialNonCovered;
    const coveragePct = totalCost > 0 ? Math.round((totalPayout / totalCost) * 100) : 0;

    return {
      coveredPayout: Math.floor(coveredPayout),
      nonCoveredPayout: Math.floor(nonCoveredPayout),
      specialPayout: Math.floor(specialPayout),
      totalPayout: Math.floor(totalPayout),
      totalDeduction: Math.floor(totalDeduction),
      totalCost,
      coveragePct,
      formulas
    };
  };

  const result = calculateResult();
  const selectedGen = GENERATIONS.find(g => g.id === data.generation)!;
  const { exportPDF, shareResult } = useCalculatorExport(resultRef);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

        {/* ── 좌측: 3-Step 구조화 입력 폼 (5열) ── */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          
          {/* STEP 1: 가입 세대 선택 */}
          <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 border border-emerald-200/90 dark:border-emerald-900/50 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">STEP 01</span>
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">실손의료비 가입 세대</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {GENERATIONS.map(gen => {
                const isActive = data.generation === gen.id;
                return (
                  <button
                    key={gen.id}
                    onClick={() => handleChange('generation', gen.id)}
                    className={`flex flex-col p-3 rounded-none border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 shadow-xs font-bold'
                        : 'border-gray-200 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-900/60 hover:bg-gray-100/80 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full mb-0.5">
                      <span className="font-extrabold text-[13px]">{gen.label}</span>
                      {isActive && <AppIcon name="check" size={12} className="text-emerald-600 dark:text-emerald-400" />}
                    </div>
                    <span className="text-[11px] opacity-75">{gen.period}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/50 text-[11.5px] font-medium text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
              <AppIcon name="shield-check" size={14} className="shrink-0 text-emerald-600" />
              <span>{selectedGen.note}</span>
            </div>
          </div>

          {/* STEP 2: 진료 형태 및 병원 규모 */}
          <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 border border-gray-200/90 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">STEP 02</span>
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">진료 형태 & 병원 규모</h3>
              </div>
            </div>
            
            {/* 입원/통원 2단 탭 */}
            <div className="grid grid-cols-2 gap-1.5 bg-gray-100 dark:bg-zinc-900 p-1 rounded-none border border-gray-200/80 dark:border-zinc-800">
              <button 
                onClick={() => handleChange('treatmentType', 'inpatient')} 
                className={`py-2 rounded-none text-xs font-bold transition-all cursor-pointer ${
                  data.treatmentType === 'inpatient' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                입원 치료
              </button>
              <button 
                onClick={() => handleChange('treatmentType', 'outpatient')} 
                className={`py-2 rounded-none text-xs font-bold transition-all cursor-pointer ${
                  data.treatmentType === 'outpatient' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                통원 (외래 진료)
              </button>
            </div>

            {/* 통원 시 일수 및 병원규모 */}
            {data.treatmentType === 'outpatient' && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-150">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">통원(방문) 일수</label>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleChange('outpatientDays', Math.max(1, data.outpatientDays - 1))} 
                      className="w-10 h-10 bg-gray-100 dark:bg-zinc-800 rounded-none flex items-center justify-center font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 cursor-pointer"
                    >
                      -
                    </button>
                    <div className="relative flex-1">
                      <input 
                        type="number" 
                        value={data.outpatientDays || ''} 
                        onChange={e => handleChange('outpatientDays', Math.max(1, Number(e.target.value)))} 
                        className="w-full text-center bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none h-10 font-bold text-sm focus:border-emerald-500 focus:outline-none" 
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-400">일</span>
                    </div>
                    <button 
                      onClick={() => handleChange('outpatientDays', data.outpatientDays + 1)} 
                      className="w-10 h-10 bg-gray-100 dark:bg-zinc-800 rounded-none flex items-center justify-center font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">방문 병원 규모</label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {HOSPITAL_TYPES.map(ht => {
                      const isActive = data.clinicType === ht.id;
                      return (
                        <button 
                          key={ht.id} 
                          onClick={() => handleChange('clinicType', ht.id)} 
                          className={`flex items-center justify-between p-2.5 rounded-none border transition-all text-left cursor-pointer ${
                            isActive 
                              ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold' 
                              : 'border-gray-200 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-900/60 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          <div className="text-xs">
                            <span className="font-extrabold mr-1">{ht.label}</span>
                            <span className="opacity-70 text-[11px]">({ht.desc})</span>
                          </div>
                          {isActive && <AppIcon name="check" size={12} className="text-emerald-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: 발생 진료비 입력 */}
          <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 border border-gray-200/90 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">STEP 03</span>
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">진료비 영수증 금액 입력</h3>
              </div>
            </div>
            
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">급여 (본인부담금)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    inputMode="numeric" 
                    value={data.coveredCost ? fmt(data.coveredCost) : ''} 
                    onChange={e => handleChange('coveredCost', parse(e.target.value))} 
                    placeholder="0" 
                    className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none py-2.5 pl-3.5 pr-10 text-[14px] font-bold focus:border-emerald-500 focus:outline-none transition-all" 
                  />
                  <span className="absolute right-3.5 top-3 text-[12px] text-gray-400 font-bold">원</span>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">비급여 (일반 비급여)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    inputMode="numeric" 
                    value={data.nonCoveredCost ? fmt(data.nonCoveredCost) : ''} 
                    onChange={e => handleChange('nonCoveredCost', parse(e.target.value))} 
                    placeholder="0" 
                    className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none py-2.5 pl-3.5 pr-10 text-[14px] font-bold focus:border-emerald-500 focus:outline-none transition-all" 
                  />
                  <span className="absolute right-3.5 top-3 text-[12px] text-gray-400 font-bold">원</span>
                </div>
              </div>

              {/* 3~5세대 3대 비급여 특약 */}
              {data.generation >= 3 && (
                <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded">특약</span>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">3대 비급여 특약 병원비</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">도수/체외충격파</label>
                      <input 
                        type="text" 
                        inputMode="numeric" 
                        value={data.manualTherapyCost ? fmt(data.manualTherapyCost) : ''} 
                        onChange={e => handleChange('manualTherapyCost', parse(e.target.value))} 
                        placeholder="0" 
                        className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none py-2 px-2.5 text-[12px] font-bold focus:border-emerald-500 focus:outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">비급여 주사료</label>
                      <input 
                        type="text" 
                        inputMode="numeric" 
                        value={data.injectionCost ? fmt(data.injectionCost) : ''} 
                        onChange={e => handleChange('injectionCost', parse(e.target.value))} 
                        placeholder="0" 
                        className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none py-2 px-2.5 text-[12px] font-bold focus:border-emerald-500 focus:outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-gray-500 mb-1">비급여 MRI/MRA</label>
                      <input 
                        type="text" 
                        inputMode="numeric" 
                        value={data.mriCost ? fmt(data.mriCost) : ''} 
                        onChange={e => handleChange('mriCost', parse(e.target.value))} 
                        placeholder="0" 
                        className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none py-2 px-2.5 text-[12px] font-bold focus:border-emerald-500 focus:outline-none" 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ── 우측: 실시간 실손 보상금 명세서 (7열, 스티키 고정) ── */}
        <div className="lg:col-span-7 lg:sticky lg:top-[100px] flex flex-col gap-4">
          
          <div className="bg-gray-100 dark:bg-zinc-900 px-5 py-3.5 border border-gray-200 dark:border-zinc-800 flex items-center gap-2.5">
            <AppIcon name="hospital" size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">실손의료비 예상 산출 명세서</h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">입력하신 세대별 약관 및 본인부담금 공제 후 예상액입니다.</p>
            </div>
          </div>

          <div ref={resultRef} className="flex flex-col gap-4">
            {/* 최종 수령액 챔피언 카드 */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-900 p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
              <div className="relative z-10 flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-none text-[10.5px] font-bold text-white/90 uppercase tracking-wider mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                    예상 실손 보험금 (공제 후 수령액)
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                    <div className="text-4xl sm:text-5xl font-black tracking-tight">
                      {result.totalPayout.toLocaleString()}
                    </div>
                    <div className="text-xl font-bold text-white/90 mb-1">원</div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/20 flex flex-wrap gap-4 text-[12px] font-medium text-white/90">
                  <div><span className="text-white/60 mr-1">가입세대:</span><span className="font-bold">{data.generation}세대 실손</span></div>
                  <div><span className="text-white/60 mr-1">진료구분:</span><span className="font-bold">{data.treatmentType === 'inpatient' ? '입원' : `통원(${data.outpatientDays}일)`}</span></div>
                  <div><span className="text-white/60 mr-1">보장비율:</span><span className="bg-white/25 px-1.5 py-0.5 rounded text-white font-bold">{result.coveragePct}%</span></div>
                </div>
              </div>
            </div>

            {/* 세부 공제 및 지급 내역서 */}
            <div className="bg-white dark:bg-[#202124] border border-gray-200 dark:border-zinc-800 p-5 sm:p-6 shadow-xs space-y-3">
              <h3 className="text-xs font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5 mb-3">
                <span className="w-1 h-3.5 bg-emerald-600 rounded-none"></span> 세부 공제 및 산정 내역
              </h3>
              
              <div className="space-y-2.5 text-[12.5px] text-gray-600 dark:text-gray-400">
                <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-zinc-800/80">
                  <span>총 발생 의료비</span>
                  <span className="font-bold text-gray-900 dark:text-white">{result.totalCost.toLocaleString()} 원</span>
                </div>
                
                <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-zinc-800/80 text-rose-600 dark:text-rose-400">
                  <span>(-) 자기부담금 공제 합계</span>
                  <span className="font-bold">-{result.totalDeduction.toLocaleString()} 원</span>
                </div>
                
                <div className="py-1 space-y-1.5 text-[12px] opacity-80">
                  <div className="flex justify-between"><span>· 급여 지급액</span><span>{result.coveredPayout.toLocaleString()} 원</span></div>
                  <div className="flex justify-between"><span>· 비급여 지급액</span><span>{result.nonCoveredPayout.toLocaleString()} 원</span></div>
                  {data.generation >= 3 && (
                    <div className="flex justify-between"><span>· 3대 비급여 특약 지급액</span><span>{result.specialPayout.toLocaleString()} 원</span></div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-zinc-700 mt-2">
                  <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">최종 예상 실손금</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{result.totalPayout.toLocaleString()} 원</span>
                </div>
              </div>

              {/* 산출 계산식 */}
              {result.formulas.length > 0 && (
                <div className="mt-4 bg-gray-50 dark:bg-zinc-900 p-3.5 border border-gray-200/80 dark:border-zinc-800 rounded-none">
                  <h4 className="text-[11.5px] font-bold text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1">
                    <AppIcon name="calculator" size={13} />
                    적용된 세대별 공제 공식
                  </h4>
                  <ul className="list-disc list-inside text-[11px] text-gray-500 dark:text-gray-400 space-y-1 leading-relaxed break-keep">
                    {result.formulas.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* 알림 배너 */}
          <div className="bg-amber-50 dark:bg-amber-950/30 p-3.5 border border-amber-200 dark:border-amber-800/60 flex gap-2.5 text-[11.5px] leading-relaxed text-amber-900 dark:text-amber-300 font-medium">
            <AppIcon name="shield-alert" size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p>위 결과는 <strong>단순 약관 산출 추정치</strong>입니다. 비례보상, 면책 질환, 연간 통원 한도(180회/연간 5천만 원) 등에 따라 실제 지급액이 달라질 수 있습니다.</p>
          </div>

          {/* 상담 및 액션 버튼 그룹 */}
          <div className="flex flex-col gap-2 pt-1">
            <button 
              onClick={() => { document.getElementById('chat-floating-btn')?.click(); }} 
              className="flex items-center justify-center w-full gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none font-extrabold text-[14px] transition-all shadow-md shadow-emerald-500/20 cursor-pointer" 
              id="medical-calc-chat-btn"
            >
              <AppIcon name="chat" size={18} />
              실손 부지급 1:1 무료 상담 신청
            </button>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => shareResult('실손의료비', result.totalPayout)} 
                className="flex items-center justify-center gap-1.5 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 hover:border-emerald-500 text-gray-700 dark:text-gray-300 rounded-none font-bold text-[12px] transition-all cursor-pointer"
              >
                <AppIcon name="link" size={14} />
                결과 공유하기
              </button>
              <button 
                onClick={() => exportPDF('보상스쿨_실손의료비_계산결과.pdf')} 
                className="flex items-center justify-center gap-1.5 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 hover:border-emerald-500 text-gray-700 dark:text-gray-300 rounded-none font-bold text-[12px] transition-all cursor-pointer"
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
