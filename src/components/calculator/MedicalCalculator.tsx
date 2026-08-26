'use client';

import { useState, useRef } from 'react';
import { useCalculatorExport } from "@/hooks/useCalculatorExport";
import AppIcon from '@/components/ui/AppIcon';
import PremiumHeading from '@/components/ui/PremiumHeading';

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
  { id: 1, label: '1세대', period: '~2009.8', note: '입원 100% 보상 / 통원 5천원 공제' },
  { id: 2, label: '2세대', period: '2009.10~2017.3', note: '급여·비급여 10% 공제' },
  { id: 3, label: '3세대', period: '2017.4~2021.6', note: '기본 10~20%, 3대비급여 30%' },
  { id: 4, label: '4세대', period: '2021.7~2026.4', note: '급여 20%, 비급여 30%' },
  { id: 5, label: '5세대', period: '2026.5~', note: '급여 20%, 비급여 30%, 비중증 50%' },
];

const HOSPITAL_TYPES = [
  { id: 'clinic', label: '의원·클리닉 (1만원 공제)' },
  { id: 'hospital', label: '병원급 (1.5만원 공제)' },
  { id: 'general', label: '종합·대학병원 (2만원 공제)' },
] as const;

export default function MedicalCalculator() {
  const [data, setData] = useState<MedicalInsuranceData>(initialMedicalData);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
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
    <div className="w-full space-y-5">
      {/* 1. 타이틀 헤더 */}
      <div className="text-center space-y-1.5 mb-2">
        <PremiumHeading level={1} gradient="green" className="justify-center !text-2xl sm:!text-3xl">
          실손의료비 보상 계산기
        </PremiumHeading>
        <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] max-w-lg mx-auto leading-relaxed">
          1세대부터 5세대까지 세대별 약관 및 본인부담금을 공제한 예상 실손 보험금입니다.
        </p>
      </div>

      {/* 2. 🏆 상단 실시간 예상 실손금 챔피언 카드 */}
      <div ref={resultRef} className="bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-900 p-6 sm:p-7 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-xs px-2.5 py-1 text-[11px] font-bold text-white/90 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
              실시간 예상 실손 보험금 (추정 수령액)
            </span>
            <span className="text-[11px] text-white/70 font-medium">
              보장 비율 {result.coveragePct}%
            </span>
          </div>

          <div className="flex items-end gap-2 mb-4">
            <div className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-xs">
              {result.totalPayout.toLocaleString()}
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white/90 mb-1">원</div>
          </div>

          <div className="pt-3 border-t border-white/20 flex flex-wrap items-center justify-between text-xs text-white/80 font-medium gap-2">
            <div>
              <span className="text-white/60 mr-1">가입세대:</span>
              <span className="font-bold text-white">{data.generation}세대 실손</span>
            </div>
            <div>
              <span className="text-white/60 mr-1">진료형태:</span>
              <span className="font-bold text-white">{data.treatmentType === 'inpatient' ? '입원 치료' : `외래 통원 (${data.outpatientDays}일)`}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 🛠️ 스마트 인터랙티브 입력 카드 (단일 스트림) */}
      <div className="space-y-4">
        
        {/* [섹션 1] 실손 가입 세대 5단 칩 */}
        <div className="bg-white dark:bg-[#202124] p-4 sm:p-5 border border-emerald-200/90 dark:border-emerald-900/50 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <AppIcon name="hospital" size={14} className="text-emerald-600" />
              1. 실손의료비 가입 시기 (세대 선택)
            </h2>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {GENERATIONS.map(gen => {
              const isActive = data.generation === gen.id;
              return (
                <button
                  key={gen.id}
                  onClick={() => handleChange('generation', gen.id)}
                  className={`py-2 px-1 text-center border transition-all cursor-pointer ${
                    isActive
                      ? 'border-emerald-600 bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-extrabold shadow-xs'
                      : 'border-gray-200 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-900/60 text-gray-600 dark:text-zinc-400 hover:bg-gray-100'
                  }`}
                >
                  <div className="text-xs font-bold">{gen.label}</div>
                  <div className="text-[9.5px] opacity-70 truncate">{gen.period}</div>
                </button>
              );
            })}
          </div>

          <div className="p-2 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/50 text-[11px] font-medium text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
            <AppIcon name="shield-check" size={13} className="shrink-0 text-emerald-600" />
            <span>{selectedGen.note}</span>
          </div>
        </div>

        {/* [섹션 2] 진료 형태 & 병원 규모 */}
        <div className="bg-white dark:bg-[#202124] p-4 sm:p-5 border border-gray-200/90 dark:border-zinc-800 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <AppIcon name="compass" size={14} className="text-emerald-600" />
            2. 진료 형태 및 방문 병원
          </h2>

          <div className="space-y-3">
            {/* 입원/통원 2단 탭 */}
            <div className="grid grid-cols-2 gap-1.5 bg-gray-100 dark:bg-zinc-900 p-1 border border-gray-200/80 dark:border-zinc-800">
              <button
                onClick={() => handleChange('treatmentType', 'inpatient')}
                className={`py-2 text-xs font-bold transition-all cursor-pointer ${
                  data.treatmentType === 'inpatient'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                입원 치료
              </button>
              <button
                onClick={() => handleChange('treatmentType', 'outpatient')}
                className={`py-2 text-xs font-bold transition-all cursor-pointer ${
                  data.treatmentType === 'outpatient'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                외래 통원
              </button>
            </div>

            {/* 통원 시 일수 및 병원 선택 */}
            {data.treatmentType === 'outpatient' && (
              <div className="space-y-2.5 pt-1 animate-in fade-in duration-150">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] font-medium text-gray-500">통원 일수</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleChange('outpatientDays', Math.max(1, data.outpatientDays - 1))}
                      className="w-8 h-8 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs hover:bg-gray-200 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-12 text-center text-xs font-black">{data.outpatientDays}일</span>
                    <button
                      onClick={() => handleChange('outpatientDays', data.outpatientDays + 1)}
                      className="w-8 h-8 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-xs hover:bg-gray-200 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {HOSPITAL_TYPES.map(ht => {
                    const isActive = data.clinicType === ht.id;
                    return (
                      <button
                        key={ht.id}
                        onClick={() => handleChange('clinicType', ht.id)}
                        className={`p-2 text-center border transition-all cursor-pointer ${
                          isActive
                            ? 'border-emerald-600 bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-bold'
                            : 'border-gray-200 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-900/60 text-gray-600 dark:text-zinc-400 hover:bg-gray-100'
                        }`}
                      >
                        <div className="text-[11px] leading-tight">{ht.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* [섹션 3] 발생 진료비 입력 */}
        <div className="bg-white dark:bg-[#202124] p-4 sm:p-5 border border-gray-200/90 dark:border-zinc-800 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <AppIcon name="file-text" size={14} className="text-emerald-600" />
            3. 병원 영수증 발생 금액 입력
          </h2>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10.5px] text-gray-500 mb-1">급여 (본인부담금)</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={data.coveredCost ? fmt(data.coveredCost) : ''}
                    onChange={e => handleChange('coveredCost', parse(e.target.value))}
                    placeholder="0"
                    className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 py-1.5 px-2.5 pr-6 text-xs font-bold focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-2 top-2 text-[10.5px] text-gray-400">원</span>
                </div>
              </div>
              <div>
                <label className="block text-[10.5px] text-gray-500 mb-1">비급여 (일반)</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={data.nonCoveredCost ? fmt(data.nonCoveredCost) : ''}
                    onChange={e => handleChange('nonCoveredCost', parse(e.target.value))}
                    placeholder="0"
                    className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 py-1.5 px-2.5 pr-6 text-xs font-bold focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="absolute right-2 top-2 text-[10.5px] text-gray-400">원</span>
                </div>
              </div>
            </div>

            {/* 3~5세대 3대 비급여 특약 */}
            {data.generation >= 3 && (
              <div className="pt-2 border-t border-gray-100 dark:border-zinc-800 space-y-2">
                <span className="text-[10.5px] font-bold text-rose-600 dark:text-rose-400">3대 비급여 특약 (해당 시 입력)</span>
                <div className="grid grid-cols-3 gap-1.5">
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">도수/체외충격파</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={data.manualTherapyCost ? fmt(data.manualTherapyCost) : ''}
                      onChange={e => handleChange('manualTherapyCost', parse(e.target.value))}
                      placeholder="0"
                      className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 py-1 px-2 text-[11px] font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">비급여 주사료</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={data.injectionCost ? fmt(data.injectionCost) : ''}
                      onChange={e => handleChange('injectionCost', parse(e.target.value))}
                      placeholder="0"
                      className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 py-1 px-2 text-[11px] font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 mb-0.5">비급여 MRI/MRA</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={data.mriCost ? fmt(data.mriCost) : ''}
                      onChange={e => handleChange('mriCost', parse(e.target.value))}
                      placeholder="0"
                      className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 py-1 px-2 text-[11px] font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. 📋 접이식 세부 산출 명세서 아코디언 */}
      <div className="bg-white dark:bg-[#202124] border border-gray-200 dark:border-zinc-800 shadow-xs overflow-hidden">
        <button
          onClick={() => setIsDetailOpen(!isDetailOpen)}
          className="w-full flex items-center justify-between p-4 bg-gray-50/80 dark:bg-zinc-900/80 hover:bg-gray-100 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <AppIcon name="file-text" size={16} className="text-emerald-600" />
            <span className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white">
              세부 공제 내역 및 약관 공식 {isDetailOpen ? '접기' : '확인하기'}
            </span>
          </div>
          <span className="text-xs text-gray-400 font-bold">
            {isDetailOpen ? '▲' : '▼'}
          </span>
        </button>

        {isDetailOpen && (
          <div className="p-4 sm:p-5 space-y-3 text-xs border-t border-gray-100 dark:border-zinc-800 animate-in fade-in duration-150">
            <div className="space-y-2 text-gray-600 dark:text-gray-300">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-zinc-800">
                <span>· 총 발생 의료비</span>
                <span className="font-bold text-gray-900 dark:text-white">{result.totalCost.toLocaleString()} 원</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-zinc-800 text-rose-600 dark:text-rose-400">
                <span>· (-) 자기부담금 공제 합계</span>
                <span className="font-bold">-{result.totalDeduction.toLocaleString()} 원</span>
              </div>
              <div className="py-0.5 space-y-1 text-[11.5px] opacity-80 pl-2">
                <div className="flex justify-between"><span>- 급여 지급액</span><span>{result.coveredPayout.toLocaleString()} 원</span></div>
                <div className="flex justify-between"><span>- 비급여 지급액</span><span>{result.nonCoveredPayout.toLocaleString()} 원</span></div>
                {data.generation >= 3 && (
                  <div className="flex justify-between"><span>- 3대 비급여 지급액</span><span>{result.specialPayout.toLocaleString()} 원</span></div>
                )}
              </div>
              <div className="flex justify-between py-1.5 font-extrabold text-emerald-600 dark:text-emerald-400 border-t border-gray-200 dark:border-zinc-700">
                <span>최종 예상 실손금</span>
                <span>{result.totalPayout.toLocaleString()} 원</span>
              </div>
            </div>

            {/* 계산 공식 */}
            {result.formulas.length > 0 && (
              <div className="pt-2 border-t border-gray-100 dark:border-zinc-800">
                <h4 className="text-[11px] font-bold text-emerald-600 mb-1">적용된 세대별 공제 공식</h4>
                <ul className="list-disc list-inside text-[10.5px] text-gray-500 space-y-0.5">
                  {result.formulas.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. 🛡️ 전문가 조언 및 액션 버튼 바 */}
      <div className="bg-amber-50 dark:bg-amber-950/30 p-3 border border-amber-200/80 dark:border-amber-900/40 text-[11px] leading-relaxed text-amber-900 dark:text-amber-300 flex items-start gap-2">
        <AppIcon name="shield-alert" size={14} className="text-amber-600 shrink-0 mt-0.5" />
        <p>위 결과는 <strong>단순 약관 산출 추정치</strong>입니다. 비례보상, 면책 질환, 연간 보상한도 등에 따라 실제 지급액이 달라질 수 있습니다.</p>
      </div>

      <div className="space-y-2 pt-1">
        <button
          onClick={() => { document.getElementById('chat-floating-btn')?.click(); }}
          className="flex items-center justify-center w-full gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
        >
          <AppIcon name="chat" size={18} />
          실손 부지급 1:1 무료 상담 신청
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => shareResult('실손의료비', result.totalPayout)}
            className="flex items-center justify-center gap-1.5 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 hover:border-emerald-500 text-gray-700 dark:text-gray-300 font-bold text-xs transition-colors cursor-pointer"
          >
            <AppIcon name="link" size={13} />
            결과 공유하기
          </button>
          <button
            onClick={() => exportPDF('보상스쿨_실손의료비_계산결과.pdf')}
            className="flex items-center justify-center gap-1.5 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 hover:border-emerald-500 text-gray-700 dark:text-gray-300 font-bold text-xs transition-colors cursor-pointer"
          >
            <AppIcon name="file-text" size={13} />
            PDF 다운로드
          </button>
        </div>
      </div>
    </div>
  );
}
