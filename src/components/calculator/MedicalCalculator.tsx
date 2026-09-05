'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useCalculatorExport } from "@/hooks/useCalculatorExport";
import AppIcon from '@/components/ui/AppIcon';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumCard from '@/components/ui/PremiumCard';

export interface MedicalInsuranceData {
  generation: 1 | 2 | 3 | 4 | 5;
  treatmentType: 'inpatient' | 'outpatient';
  clinicType: 'clinic' | 'hospital' | 'general';
  outpatientDays: number;
  coveredCost: number;
  nonCoveredCost: number;
  manualTherapyCost: number;
  injectionCost: number;
  mriCost: number;
}

const initialMedicalData: MedicalInsuranceData = {
  generation: 4,
  treatmentType: 'outpatient',
  clinicType: 'clinic',
  outpatientDays: 1,
  coveredCost: 35000,
  nonCoveredCost: 50000,
  manualTherapyCost: 100000,
  injectionCost: 0,
  mriCost: 0,
};

const GENERATIONS = [
  { id: 1, label: '1세대', period: '~09.09', note: '자기부담금 0% (입원 본인부담금 없음)' },
  { id: 2, label: '2세대', period: '09.10~17.03', note: '자기부담금 10% 또는 20% 표준화' },
  { id: 3, label: '3세대', period: '17.04~21.06', note: '기본형(10~20%) + 3대비급여특약(30%)' },
  { id: 4, label: '4세대', period: '21.07~현재', note: '급여 20%, 비급여 30% 공제 (비급여 차등제)' },
  { id: 5, label: '5세대', period: '개편 예정', note: '중증/비중증 분리 (비급여 본인부담 30~50%)' },
];

const HOSPITAL_TYPES = [
  { id: 'clinic', label: '의원 (동네병원)', deduct: 10000 },
  { id: 'hospital', label: '병원 (중소병원)', deduct: 15000 },
  { id: 'general', label: '상급/종합병원', deduct: 20000 },
];

export default function MedicalCalculator({ hideHeader = false }: { hideHeader?: boolean }) {
  const [data, setData] = useState<MedicalInsuranceData>(initialMedicalData);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleChange = (field: keyof MedicalInsuranceData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const fmt = (val: number | string) => {
    if (!val) return '';
    return Number(val.toString().replace(/,/g, '')).toLocaleString();
  };
  const parse = (val: string) => Math.max(0, Number(val.replace(/[^0-9]/g, '')) || 0);

  // ── [법적 산출 근거] ──
  // 1. 1세대 (구실손, ~2009.09): 금융감독원 표준화 이전 실손의료비 약관 (입원 전액 보상, 외래 5,000원 공제)
  // 2. 2세대 (표준화 실손, 2009.10~2017.03): 실손의료보험 표준약관 (자기부담금 10%/20%, 의원 1만/병원 1.5만/상급종합 2만)
  // 3. 3세대 (착한실손, 2017.04~2021.06): 실손의료보험 표준약관 기본형 및 3대 비급여 특약(도수·주사·MRI 30% 공제)
  // 4. 4세대 (2021.07~현재): 금융감독원 4세대 실손의료보험 표준약관 (급여 20%, 비급여 30% 차등 공제)
  // 5. 5세대 (개편안): 금융위원회 실손보험 개편 방향안 반영
  const calculateResult = () => {
    const formulas: string[] = [];
    const totalCovered = data.coveredCost;
    const totalNormalNonCovered = data.nonCoveredCost;
    const totalSpecialNonCovered = data.manualTherapyCost + data.injectionCost + data.mriCost;
    const days = Math.max(1, data.outpatientDays);

    let coveredPayout = 0;
    let nonCoveredPayout = 0;
    let specialPayout = 0;
    let totalDeduction = 0;

    if (data.generation === 1) {
      if (data.treatmentType === 'inpatient') {
        coveredPayout = totalCovered;
        nonCoveredPayout = totalNormalNonCovered + totalSpecialNonCovered;
        totalDeduction = 0;
        formulas.push(`1세대 입원: 본인부담금 0원 (자기부담금 없는 지급 기준)`);
      } else {
        const deduct = 5000 * days;
        const total = totalCovered + totalNormalNonCovered + totalSpecialNonCovered;
        totalDeduction = Math.min(total, deduct);
        coveredPayout = Math.max(0, total - totalDeduction);
        formulas.push(`1세대 통원: 1일당 5,000원 공제 (${days}일 = ${fmt(deduct)}원)`);
      }
    }
    else if (data.generation === 2) {
      if (data.treatmentType === 'inpatient') {
        coveredPayout = totalCovered * 0.9;
        nonCoveredPayout = (totalNormalNonCovered + totalSpecialNonCovered) * 0.9;
        totalDeduction = (totalCovered + totalNormalNonCovered + totalSpecialNonCovered) * 0.1;
        formulas.push(`2세대 입원: 본인부담 10% 공제 (90% 지급)`);
      } else {
        const hospitalDeduct = (data.clinicType === 'clinic' ? 10000 : data.clinicType === 'hospital' ? 15000 : 20000) * days;
        const pctDeduct = (totalCovered + totalNormalNonCovered + totalSpecialNonCovered) * 0.2;
        totalDeduction = Math.min(totalCovered + totalNormalNonCovered + totalSpecialNonCovered, Math.max(hospitalDeduct, pctDeduct));
        const payout = (totalCovered + totalNormalNonCovered + totalSpecialNonCovered) - totalDeduction;
        coveredPayout = Math.max(0, payout);
        formulas.push(`2세대 통원: MAX(병원별 공제액×${days}일, 총진료비의 20%) 공제`);
      }
    }
    else if (data.generation === 3) {
      if (data.treatmentType === 'inpatient') {
        coveredPayout = totalCovered * 0.9;
        nonCoveredPayout = totalNormalNonCovered * 0.8;
        specialPayout = totalSpecialNonCovered * 0.7;
        totalDeduction = (totalCovered * 0.1) + (totalNormalNonCovered * 0.2) + (totalSpecialNonCovered * 0.3);
        formulas.push(`급여 90%, 일반비급여 80%, 3대비급여특약 70% 각각 지급`);
      } else {
        const minCoveredDeduct = (data.clinicType === 'clinic' ? 10000 : data.clinicType === 'hospital' ? 15000 : 20000) * days;
        const coveredDeduct = Math.max(minCoveredDeduct, (totalCovered + totalNormalNonCovered) * 0.2);
        const basePayout = Math.max(0, (totalCovered + totalNormalNonCovered) - coveredDeduct);
        coveredPayout = (basePayout * (totalCovered / (totalCovered + totalNormalNonCovered || 1)));
        nonCoveredPayout = (basePayout * (totalNormalNonCovered / (totalCovered + totalNormalNonCovered || 1)));
        
        const specialDeduct = Math.max(20000 * days, totalSpecialNonCovered * 0.3);
        specialPayout = Math.max(0, totalSpecialNonCovered - specialDeduct);

        totalDeduction = coveredDeduct + specialDeduct;
        formulas.push(`기본계약 MAX(병원별 공제액, 20%) + 3대비급여 MAX(2만원, 30%) 공제`);
      }
    }
    else if (data.generation === 4) {
      if (data.treatmentType === 'inpatient') {
        coveredPayout = totalCovered * 0.8;
        nonCoveredPayout = totalNormalNonCovered * 0.7;
        specialPayout = totalSpecialNonCovered * 0.7;
        totalDeduction = (totalCovered * 0.2) + (totalNormalNonCovered * 0.3) + (totalSpecialNonCovered * 0.3);
        formulas.push(`급여 20%, 비급여 30% 본인부담금 공제`);
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

  const inputClass = "w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 py-3 px-3.5 text-sm font-bold text-gray-900 dark:text-white rounded-none focus:border-emerald-500 focus:outline-none transition-colors placeholder-gray-400";
  const labelHeaderClass = "flex items-center justify-between mb-2.5";
  const labelTextClass = "text-xs sm:text-[13.5px] font-extrabold text-gray-900 dark:text-gray-100 select-none";
  const labelSubClass = "text-[11px] text-gray-400 dark:text-zinc-500 font-medium select-none";

  return (
    <div className="w-full space-y-6">
      {/* 1. 타이틀 헤더 */}
      {!hideHeader && (
        <div className="text-center space-y-2 mb-2">
          <PremiumHeading level={1} gradient="green" className="justify-center !text-2xl sm:!text-3xl">
            실손의료비 보상 계산기
          </PremiumHeading>
          <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-xl mx-auto leading-relaxed font-medium">
            1세대부터 5세대까지 세대별 약관 및 본인부담금을 공제한 예상 실손 보험금입니다.
          </p>
        </div>
      )}

      {/* 2. 스마트 인터랙티브 입력 카드 (STEP 1, 2, 3) */}
      <div className="space-y-6">
        
        {/* [STEP 1] 실손 가입 세대 5단 칩 */}
        <PremiumCard borderColor="green" hoverEffect={true} watermarkIcon="hospital" className="!p-5 sm:!p-7 overflow-hidden">
          {/* STEP 1 그라데이션 헤더 바 */}
          <div className="-mx-5 -mt-5 sm:-mx-7 sm:-mt-7 px-5 py-3.5 sm:px-7 sm:py-4 bg-gradient-to-r from-emerald-50 via-teal-50/60 to-transparent dark:from-emerald-950/50 dark:via-teal-950/30 dark:to-transparent border-b border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-zinc-800 px-2 py-0.5 border border-emerald-200/80 dark:border-emerald-800/80">STEP 01</span>
              <h2 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                <AppIcon name="hospital" size={16} className="text-emerald-600 dark:text-emerald-400" />
                실손의료비 가입 시기 (세대 선택)
              </h2>
            </div>
            <span className="text-xs text-gray-400 font-medium hidden sm:inline-block">약관 세대별 공제율</span>
          </div>

          <div className="space-y-4 pt-5">
            <div className="grid grid-cols-5 gap-2.5">
              {GENERATIONS.map(gen => {
                const isActive = data.generation === gen.id;
                return (
                  <button
                    key={gen.id}
                    onClick={() => handleChange('generation', gen.id)}
                    className={`py-3 px-1.5 text-center border transition-all cursor-pointer ${
                      isActive
                        ? 'border-emerald-600 bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-extrabold shadow-xs'
                        : 'border-gray-200 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-900/60 text-gray-700 dark:text-zinc-300 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-extrabold">{gen.label}</div>
                    <div className="text-[10px] sm:text-[11px] opacity-75 mt-0.5 truncate">{gen.period}</div>
                  </button>
                );
              })}
            </div>

            <div className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 text-xs sm:text-[13px] font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
              <AppIcon name="shield-check" size={16} className="shrink-0 text-emerald-600" />
              <span>{selectedGen.note}</span>
            </div>
          </div>
        </PremiumCard>

        {/* [STEP 2] 진료 형태 & 병원 규모 */}
        <PremiumCard borderColor="green" hoverEffect={true} watermarkIcon="compass" className="!p-5 sm:!p-7 overflow-hidden">
          {/* STEP 2 그라데이션 헤더 바 */}
          <div className="-mx-5 -mt-5 sm:-mx-7 sm:-mt-7 px-5 py-3.5 sm:px-7 sm:py-4 bg-gradient-to-r from-emerald-50 via-teal-50/60 to-transparent dark:from-emerald-950/50 dark:via-teal-950/30 dark:to-transparent border-b border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-zinc-800 px-2 py-0.5 border border-emerald-200/80 dark:border-emerald-800/80">STEP 02</span>
              <h2 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                <AppIcon name="compass" size={16} className="text-emerald-600 dark:text-emerald-400" />
                진료 형태 및 방문 병원
              </h2>
            </div>
            <span className="text-xs text-gray-400 font-medium hidden sm:inline-block">의원/병원/종합병원 구분</span>
          </div>

          <div className="space-y-6 pt-5">
            {/* 입원/통원 2단 탭 */}
            <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-zinc-900 p-1.5 border border-gray-200/80 dark:border-zinc-800">
              <button
                onClick={() => handleChange('treatmentType', 'inpatient')}
                className={`py-3 text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  data.treatmentType === 'inpatient'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                입원 치료
              </button>
              <button
                onClick={() => handleChange('treatmentType', 'outpatient')}
                className={`py-3 text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
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
              <div className="space-y-4 pt-1 animate-in fade-in duration-150">
                <div className={labelHeaderClass}>
                  <label className={labelTextClass}>통원 일수</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleChange('outpatientDays', Math.max(1, data.outpatientDays - 1))}
                      className="w-9 h-9 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center font-black text-sm hover:bg-gray-200 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-14 text-center text-sm font-black text-gray-900 dark:text-white">{data.outpatientDays}일</span>
                    <button
                      onClick={() => handleChange('outpatientDays', data.outpatientDays + 1)}
                      className="w-9 h-9 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center font-black text-sm hover:bg-gray-200 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {HOSPITAL_TYPES.map(ht => {
                    const isActive = data.clinicType === ht.id;
                    return (
                      <button
                        key={ht.id}
                        onClick={() => handleChange('clinicType', ht.id)}
                        className={`p-3 text-center border transition-all cursor-pointer ${
                          isActive
                            ? 'border-emerald-600 bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-extrabold'
                            : 'border-gray-200 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-900/60 text-gray-700 dark:text-zinc-300 hover:bg-gray-100'
                        }`}
                      >
                        <div className="text-xs sm:text-[12.5px] leading-tight font-bold">{ht.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </PremiumCard>

        {/* [STEP 3] 발생 진료비 입력 */}
        <PremiumCard borderColor="green" hoverEffect={true} watermarkIcon="file-text" className="!p-5 sm:!p-7 overflow-hidden">
          {/* STEP 3 그라데이션 헤더 바 */}
          <div className="-mx-5 -mt-5 sm:-mx-7 sm:-mt-7 px-5 py-3.5 sm:px-7 sm:py-4 bg-gradient-to-r from-emerald-50 via-teal-50/60 to-transparent dark:from-emerald-950/50 dark:via-teal-950/30 dark:to-transparent border-b border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-zinc-800 px-2 py-0.5 border border-emerald-200/80 dark:border-emerald-800/80">STEP 03</span>
              <h2 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                <AppIcon name="file-text" size={16} className="text-emerald-600 dark:text-emerald-400" />
                병원 영수증 발생 금액 입력
              </h2>
            </div>
            <span className="text-xs text-gray-400 font-medium hidden sm:inline-block">급여·비급여 분리 산정</span>
          </div>

          <div className="space-y-6 pt-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className={labelHeaderClass}>
                  <label className={labelTextClass}>급여 (본인부담금)</label>
                  <span className={labelSubClass}>영수증 급여란</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={data.coveredCost ? fmt(data.coveredCost) : ''}
                    onChange={e => handleChange('coveredCost', parse(e.target.value))}
                    placeholder="0"
                    className={`${inputClass} pr-7`}
                  />
                  <span className="absolute right-3.5 top-3.5 text-xs text-gray-400 font-bold">원</span>
                </div>
              </div>
              <div>
                <div className={labelHeaderClass}>
                  <label className={labelTextClass}>비급여 (일반)</label>
                  <span className={labelSubClass}>영수증 비급여란</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={data.nonCoveredCost ? fmt(data.nonCoveredCost) : ''}
                    onChange={e => handleChange('nonCoveredCost', parse(e.target.value))}
                    placeholder="0"
                    className={`${inputClass} pr-7`}
                  />
                  <span className="absolute right-3.5 top-3.5 text-xs text-gray-400 font-bold">원</span>
                </div>
              </div>
            </div>

            {/* 3~5세대 3대 비급여 특약 */}
            {data.generation >= 3 && (
              <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 space-y-3">
                <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400">3대 비급여 특약 (해당 시 입력)</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs text-gray-700 dark:text-gray-300 font-bold">도수/체외충격파</label>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={data.manualTherapyCost ? fmt(data.manualTherapyCost) : ''}
                      onChange={e => handleChange('manualTherapyCost', parse(e.target.value))}
                      placeholder="0"
                      className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 py-2.5 px-3 text-xs sm:text-sm font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs text-gray-700 dark:text-gray-300 font-bold">비급여 주사료</label>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={data.injectionCost ? fmt(data.injectionCost) : ''}
                      onChange={e => handleChange('injectionCost', parse(e.target.value))}
                      placeholder="0"
                      className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 py-2.5 px-3 text-xs sm:text-sm font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs text-gray-700 dark:text-gray-300 font-bold">비급여 MRI/MRA</label>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={data.mriCost ? fmt(data.mriCost) : ''}
                      onChange={e => handleChange('mriCost', parse(e.target.value))}
                      placeholder="0"
                      className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 py-2.5 px-3 text-xs sm:text-sm font-bold focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </PremiumCard>
      </div>

      {/* 3. 세부 공제 내역 명세서 (상시 100% 노출) */}
      <PremiumCard borderColor="green" hoverEffect={true} watermarkIcon="file-text" className="!p-5 sm:!p-7 overflow-hidden">
        {/* 명세서 그라데이션 헤더 바 */}
        <div className="-mx-5 -mt-5 sm:-mx-7 sm:-mt-7 px-5 py-3.5 sm:px-7 sm:py-4 bg-gradient-to-r from-emerald-50 via-teal-50/60 to-transparent dark:from-emerald-950/50 dark:via-teal-950/30 dark:to-transparent border-b border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AppIcon name="file-text" size={16} className="text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white">
              세부 손해액 산출 명세서 & 실손 약관 공식
            </h3>
          </div>
          <span className="text-xs text-gray-400 font-medium hidden sm:inline-block">실손 약관 기준 실시간 연산</span>
        </div>

        <div className="space-y-3 pt-5 text-xs sm:text-[13.5px] text-gray-700 dark:text-gray-300">
          <div className="flex justify-between py-2.5 border-b border-gray-100 dark:border-zinc-800/80">
            <span className="font-medium">· 급여 진료비 지급액 ({data.coveredCost.toLocaleString()}원 중)</span>
            <span className="font-extrabold text-gray-900 dark:text-white">{result.coveredPayout.toLocaleString()} 원</span>
          </div>
          <div className="flex justify-between py-2.5 border-b border-gray-100 dark:border-zinc-800/80">
            <span className="font-medium">· 일반 비급여 지급액 ({data.nonCoveredCost.toLocaleString()}원 중)</span>
            <span className="font-extrabold text-gray-900 dark:text-white">{result.nonCoveredPayout.toLocaleString()} 원</span>
          </div>
          {(data.manualTherapyCost > 0 || data.injectionCost > 0 || data.mriCost > 0) && (
            <div className="flex justify-between py-2.5 border-b border-gray-100 dark:border-zinc-800/80">
              <span className="font-medium">· 3대 비급여 특약 지급액 ({(data.manualTherapyCost + data.injectionCost + data.mriCost).toLocaleString()}원 중)</span>
              <span className="font-extrabold text-gray-900 dark:text-white">{result.specialPayout.toLocaleString()} 원</span>
            </div>
          )}
          <div className="flex justify-between py-2.5 font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-zinc-700">
            <span>총 발생 병원비</span>
            <span>{result.totalCost.toLocaleString()} 원</span>
          </div>
          <div className="flex justify-between py-2.5 text-red-500 font-extrabold">
            <span>(-) 본인 부담 공제 총액</span>
            <span>-{result.totalDeduction.toLocaleString()} 원</span>
          </div>
        </div>

        {/* 계산 공식 */}
        {result.formulas.length > 0 && (
          <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 bg-emerald-50/40 dark:bg-emerald-950/20 p-4">
            <h4 className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1.5">
              <AppIcon name="calculator" size={14} />
              적용된 실손 세대별 공제 공식
            </h4>
            <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-400 space-y-1 leading-relaxed">
              {result.formulas.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        )}
      </PremiumCard>

      {/* 4. [최하단 배치] 최종 예상 실손 보험금 챔피언 카드 */}
      <div ref={resultRef} className="bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-900 p-6 sm:p-8 text-white shadow-lg relative overflow-hidden transition-transform duration-200 hover:scale-[1.005]">
        <div className="relative z-10 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-xs px-3 py-1.5 text-xs font-extrabold text-white/90 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
              최종 예상 실손 수령액 ({selectedGen.label} 적용)
            </span>
            <span className="text-xs sm:text-[13px] text-white/80 font-bold">
              보장률 {result.coveragePct}%
            </span>
          </div>

          <div className="flex items-end gap-2 mb-5">
            <div className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight drop-shadow-xs">
              {result.totalPayout.toLocaleString()}
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white/90 mb-1">원</div>
          </div>

          <div className="pt-4 border-t border-white/20 flex flex-wrap items-center justify-between text-xs sm:text-sm text-white/90 font-medium gap-3">
            <div>
              <span className="text-white/60 mr-1.5">진료 유형:</span>
              <span className="font-bold text-white">{data.treatmentType === 'inpatient' ? '입원 치료' : `외래 통원 (${data.outpatientDays}일)`}</span>
            </div>
            <div>
              <span className="text-white/60 mr-1.5">총 본인부담금 공제:</span>
              <span className="font-bold text-white">{result.totalDeduction.toLocaleString()}원</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. 법적 면책 안내 및 전문가 상담 안내 */}
      <div className="bg-amber-50 dark:bg-amber-950/30 p-4 border border-amber-200/80 dark:border-amber-900/40 text-xs sm:text-[13px] leading-relaxed text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
        <AppIcon name="shield-alert" size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <p>
          이 계산 결과는 약관 지급기준과 법원 판례를 참고하여 산출한 예상 추정치로, 실제 지급되는 보험금과 다를 수 있습니다. 과실 비율, 개별 특약, 의무기록 등 세부 사항에 따라 정확한 손해사정 결과는 달라지므로, 청구 전 정밀한 산정이 필요하시다면 보상스쿨 손해사정사에게 편하게 문의해 주세요.
        </p>
      </div>

      <div className="space-y-3 pt-1">
        <Link
          href="/consultation"
          className="flex items-center justify-center w-full gap-2 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm sm:text-base transition-all shadow-md shadow-emerald-500/20 text-center cursor-pointer"
        >
          <AppIcon name="chat" size={20} />
          <span>실손의료비 부지급·삭감 1:1 무료 상담 신청하기</span>
        </Link>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => shareResult('실손의료비', result.totalPayout)}
            className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 hover:border-emerald-500 text-gray-800 dark:text-gray-200 font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-xs"
          >
            <AppIcon name="link" size={15} />
            결과 링크 공유
          </button>
          <button
            onClick={() => exportPDF('보상스쿨_실손의료비_예상보상금.pdf')}
            className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 hover:border-emerald-500 text-gray-800 dark:text-gray-200 font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-xs"
          >
            <AppIcon name="file-text" size={15} />
            PDF 명세서 다운로드
          </button>
        </div>
      </div>
    </div>
  );
}
