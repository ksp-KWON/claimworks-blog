'use client';

import { useState, useRef } from 'react';
import { useCalculatorExport } from "@/hooks/useCalculatorExport";

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
  { id: 1, label: '1세대 실손', period: '~2009년 8월', color: '#1A73E8', note: '입원 전액 보상 / 통원 5천원 공제' },
  { id: 2, label: '2세대 실손', period: '2009년 10월 ~ 2017년 3월', color: '#34A853', note: '급여/비급여 통합 자기부담금 10% 공제' },
  { id: 3, label: '3세대 실손', period: '2017년 4월 ~ 2021년 6월', color: '#f29900', note: '기본형 10~20%, 3대 비급여 특약 30% 공제' },
  { id: 4, label: '4세대 실손', period: '2021년 7월 ~ 2026년 4월', color: '#d93025', note: '급여 20%, 비급여 30%, 3대 비급여 특약 30% 공제' },
  { id: 5, label: '5세대 실손', period: '2026년 5월 ~ 현재', color: '#8e24aa', note: '급여 20%, 비급여 30%, 비중증(도수 등) 50% 공제' },
];

const HOSPITAL_TYPES = [
  { id: 'clinic', label: '의원·클리닉', emoji: '🏥', desc: '동네 병의원, 보건소, 한의원' },
  { id: 'hospital', label: '일반 병원', emoji: '🏨', desc: '입원 30병상 이상 병원급' },
  { id: 'general', label: '상급·종합병원', emoji: '🏫', desc: '대학병원, 대형 상급종합병원' },
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

  // ── 계산 로직 (기존 ExpertMedicalForm + MedicalCalculatorResult 통합) ──
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
        totalDeduction = Math.max(totalCost * 0.1, deductPerDay * days); // 10%와 병원규모별 공제 중 큰 금액 (간소화)
        // 실제 2세대는 통상 병원규모별 최소공제와 10%~20% 비교이지만, 대략적으로 적용
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
      {/* 5:7 비율로 명세서 영역 고정 배치 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">

        {/* ── 좌측: 세련된 입력 폼 (5열) ── */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* 1. 가입 세대 선택 */}
          <div className="bg-white dark:bg-[#202124] rounded-none p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-white/5 transition-all">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-[#f8f9fa] dark:bg-[#2d2d2d] flex items-center justify-center text-lg">📅</div>
              <h3 className="text-sm font-extrabold text-[#202124] dark:text-[#e8eaed]">실손의료비 가입 세대</h3>
            </div>
            <div className="flex flex-col gap-3">
              {GENERATIONS.map(gen => {
                const isActive = data.generation === gen.id;
                return (
                  <button
                    key={gen.id}
                    onClick={() => handleChange('generation', gen.id)}
                    className={`relative w-full flex flex-col p-4 rounded-none border-2 text-left transition-all duration-300 overflow-hidden group ${
                      isActive
                        ? 'border-current shadow-md scale-[1.02]'
                        : 'border-transparent bg-[#f8f9fa] dark:bg-[#2d2d2d] hover:bg-gray-50 dark:hover:bg-[#303134]'
                    }`}
                    style={isActive ? { borderColor: gen.color, backgroundColor: `${gen.color}08`, color: gen.color } : {}}
                  >
                    {isActive && <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: gen.color }} />}
                    <div className="flex justify-between items-center w-full mb-1">
                      <span className={`font-black text-base ${isActive ? '' : 'text-[#202124] dark:text-[#e8eaed]'}`}>{gen.label}</span>
                      {isActive && <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                    </div>
                    <span className={`text-xs font-semibold ${isActive ? 'opacity-80' : 'text-gray-500 dark:text-gray-400'}`}>{gen.period}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 p-4 rounded-none text-xs font-bold leading-relaxed border" style={{ backgroundColor: `${selectedGen.color}0A`, color: selectedGen.color, borderColor: `${selectedGen.color}20` }}>
              <span className="mr-1">💡</span> {selectedGen.note}
            </div>
          </div>

          {/* 2. 진료 형태 및 병원 규모 */}
          <div className="bg-white dark:bg-[#202124] rounded-none p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-white/5 transition-all">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-[#f8f9fa] dark:bg-[#2d2d2d] flex items-center justify-center text-lg">🏥</div>
              <h3 className="text-sm font-extrabold text-[#202124] dark:text-[#e8eaed]">진료 형태 및 병원 규모</h3>
            </div>
            
            {/* 입원/통원 토글 */}
            <div className="flex bg-[#f8f9fa] dark:bg-[#2d2d2d] p-1.5 rounded-none mb-5">
              <button onClick={() => handleChange('treatmentType', 'inpatient')} className={`flex-1 py-3 rounded-none text-sm font-bold transition-all ${data.treatmentType === 'inpatient' ? 'bg-white dark:bg-[#202124] text-[#34A853] shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'}`}>입원 치료</button>
              <button onClick={() => handleChange('treatmentType', 'outpatient')} className={`flex-1 py-3 rounded-none text-sm font-bold transition-all ${data.treatmentType === 'outpatient' ? 'bg-white dark:bg-[#202124] text-[#34A853] shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400'}`}>통원 (외래)</button>
            </div>

            {/* 통원일 경우 일수 및 병원규모 */}
            {data.treatmentType === 'outpatient' && (
              <div className="space-y-5 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">통원(방문) 일수</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleChange('outpatientDays', Math.max(1, data.outpatientDays - 1))} className="w-12 h-12 bg-[#f8f9fa] dark:bg-[#2d2d2d] rounded-none flex items-center justify-center font-bold text-gray-600 hover:bg-gray-200">-</button>
                    <div className="relative flex-1">
                      <input type="number" value={data.outpatientDays || ''} onChange={e => handleChange('outpatientDays', Math.max(1, Number(e.target.value)))} className="w-full text-center bg-[#f8f9fa] dark:bg-[#2d2d2d] border-transparent focus:border-[#34A853] rounded-none h-12 font-black text-lg focus:ring-0" />
                      <span className="absolute right-4 top-3.5 text-sm font-bold text-gray-400">일</span>
                    </div>
                    <button onClick={() => handleChange('outpatientDays', data.outpatientDays + 1)} className="w-12 h-12 bg-[#f8f9fa] dark:bg-[#2d2d2d] rounded-none flex items-center justify-center font-bold text-gray-600 hover:bg-gray-200">+</button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">방문 병원 규모 (최소공제기준 적용)</label>
                  <div className="flex flex-col gap-2.5">
                    {HOSPITAL_TYPES.map(ht => {
                      const isActive = data.clinicType === ht.id;
                      return (
                        <button key={ht.id} onClick={() => handleChange('clinicType', ht.id)} className={`flex items-center gap-4 p-3.5 rounded-none border-2 transition-all duration-300 ${isActive ? 'border-[#34A853] bg-[#e6f4ea] dark:bg-[#34A853]/10 text-[#34A853] dark:text-[#81c995] shadow-sm' : 'border-transparent bg-[#f8f9fa] dark:bg-[#2d2d2d] text-gray-500 hover:bg-gray-50 dark:hover:bg-[#303134]'}`}>
                          <span className="text-2xl filter drop-shadow-sm">{ht.emoji}</span>
                          <div className="text-left">
                            <div className={`font-black text-[13px] ${isActive ? '' : 'text-[#202124] dark:text-gray-200'}`}>{ht.label}</div>
                            <div className={`text-[10px] font-semibold mt-0.5 ${isActive ? 'opacity-80' : 'text-gray-400'}`}>{ht.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. 발생 진료비 (급여/비급여 분리) */}
          <div className="bg-white dark:bg-[#202124] rounded-none p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-white/5 transition-all">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-[#f8f9fa] dark:bg-[#2d2d2d] flex items-center justify-center text-lg">💳</div>
              <h3 className="text-sm font-extrabold text-[#202124] dark:text-[#e8eaed]">기본 발생 진료비 (환자 부담 총액)</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">급여 (본인부담금)</label>
                <div className="relative">
                  <input type="text" inputMode="numeric" value={data.coveredCost ? fmt(data.coveredCost) : ''} onChange={e => handleChange('coveredCost', parse(e.target.value))} placeholder="0" className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border border-gray-200 dark:border-white/10 rounded-none py-3.5 pl-5 pr-14 text-lg text-[#202124] dark:text-[#e8eaed] font-black focus:ring-2 focus:ring-[#34A853] focus:bg-white dark:focus:bg-[#202124] focus:outline-none transition-all shadow-inner" />
                  <span className="absolute right-5 top-[14px] text-sm text-gray-400 font-bold">원</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">비급여 (일반 비급여)</label>
                <div className="relative">
                  <input type="text" inputMode="numeric" value={data.nonCoveredCost ? fmt(data.nonCoveredCost) : ''} onChange={e => handleChange('nonCoveredCost', parse(e.target.value))} placeholder="0" className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border border-gray-200 dark:border-white/10 rounded-none py-3.5 pl-5 pr-14 text-lg text-[#202124] dark:text-[#e8eaed] font-black focus:ring-2 focus:ring-[#34A853] focus:bg-white dark:focus:bg-[#202124] focus:outline-none transition-all shadow-inner" />
                  <span className="absolute right-5 top-[14px] text-sm text-gray-400 font-bold">원</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. 3대 비급여 특약 (3~5세대) */}
          {(data.generation >= 3) && (
            <div className="bg-[#fce8e6]/30 dark:bg-[#d93025]/5 rounded-none p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-red-100 dark:border-red-900/20 transition-all animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center text-lg">💉</div>
                <h3 className="text-sm font-extrabold text-[#d93025] dark:text-red-400">3대 비급여 특약 병원비{data.generation === 5 && ' (비중증)'}</h3>
              </div>
              <p className="text-[10px] text-red-400 dark:text-red-500 font-semibold mb-5 pl-11">※ 위의 일반 비급여와 중복 입력하지 마세요.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-red-800/60 dark:text-red-200/50 mb-1.5">도수치료 / 체외충격파</label>
                  <div className="relative">
                    <input type="text" inputMode="numeric" value={data.manualTherapyCost ? fmt(data.manualTherapyCost) : ''} onChange={e => handleChange('manualTherapyCost', parse(e.target.value))} placeholder="0" className="w-full bg-white dark:bg-[#202124] border border-red-100 dark:border-red-900/30 rounded-none py-3 pl-4 pr-12 text-base text-[#d93025] dark:text-red-400 font-black focus:ring-2 focus:ring-[#d93025] focus:outline-none transition-all" />
                    <span className="absolute right-4 top-3 text-xs text-red-300 font-bold">원</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-red-800/60 dark:text-red-200/50 mb-1.5">비급여 주사료</label>
                  <div className="relative">
                    <input type="text" inputMode="numeric" value={data.injectionCost ? fmt(data.injectionCost) : ''} onChange={e => handleChange('injectionCost', parse(e.target.value))} placeholder="0" className="w-full bg-white dark:bg-[#202124] border border-red-100 dark:border-red-900/30 rounded-none py-3 pl-4 pr-12 text-base text-[#d93025] dark:text-red-400 font-black focus:ring-2 focus:ring-[#d93025] focus:outline-none transition-all" />
                    <span className="absolute right-4 top-3 text-xs text-red-300 font-bold">원</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-red-800/60 dark:text-red-200/50 mb-1.5">비급여 MRI / MRA</label>
                  <div className="relative">
                    <input type="text" inputMode="numeric" value={data.mriCost ? fmt(data.mriCost) : ''} onChange={e => handleChange('mriCost', parse(e.target.value))} placeholder="0" className="w-full bg-white dark:bg-[#202124] border border-red-100 dark:border-red-900/30 rounded-none py-3 pl-4 pr-12 text-base text-[#d93025] dark:text-red-400 font-black focus:ring-2 focus:ring-[#d93025] focus:outline-none transition-all" />
                    <span className="absolute right-4 top-3 text-xs text-red-300 font-bold">원</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ── 우측: 세련된 결과 명세서 패널 (7열, 스티키 고정) ── */}
        <div className="lg:col-span-7 lg:sticky lg:top-[100px] flex flex-col gap-5">
          
          <div className="bg-[#f8f9fa] dark:bg-[#2d2d2d] rounded-none px-6 py-5 border border-gray-100 dark:border-white/5 flex items-center gap-3">
            <span className="text-2xl">📑</span>
            <div>
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white">전문가용 산출 명세서</h2>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">입력하신 3대 비급여 특약까지 포함된 정밀 산출 내역입니다.</p>
            </div>
          </div>

          <div ref={resultRef} className="flex flex-col gap-5">
            {/* 최종 수령액 카드 (넓게 표시) */}
            <div className="bg-gradient-to-br from-[#34A853] to-[#137333] dark:from-[#137333] dark:to-[#34A853] rounded-none p-8 sm:p-10 text-white shadow-xl shadow-[#34A853]/20 relative overflow-hidden transition-all duration-300 hover:scale-[1.01]">
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-xl pointer-events-none transform -translate-x-10 translate-y-10"></div>
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-black/15 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-bold text-white/90 uppercase tracking-widest mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse"></span>
                    예상 수령액 (추정치)
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                    <div className="text-5xl sm:text-6xl font-black tracking-tight drop-shadow-sm">
                      {result.totalPayout.toLocaleString()}
                    </div>
                    <div className="text-2xl font-bold text-white/90 mb-1.5">원</div>
                  </div>
                </div>
                
                <div className="mt-8 pt-5 border-t border-white/20 flex flex-wrap gap-4 text-[13px] font-semibold text-white/90">
                  <div className="flex items-center gap-1.5"><span className="text-white/60">가입 세대:</span><span>{data.generation}세대</span></div>
                  <div className="flex items-center gap-1.5"><span className="text-white/60">진료 형태:</span><span>{data.treatmentType === 'inpatient' ? '입원' : '통원'}</span></div>
                  <div className="flex items-center gap-1.5"><span className="text-white/60">보장 비율:</span><span className="bg-white/20 px-2 py-0.5 rounded text-white">{result.coveragePct}%</span></div>
                </div>
              </div>
            </div>

            {/* 세부 공제 및 보상 내역 */}
            <div className="bg-white dark:bg-[#202124] rounded-none border border-gray-200 dark:border-white/10 p-7 shadow-sm">
              <h3 className="text-[13px] font-extrabold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2 mb-5">
                <span className="w-1 h-4 bg-[#34A853] rounded-full"></span> 세부 공제 및 지급 내역
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-white/5">
                  <span className="text-[14px] font-semibold text-gray-500 dark:text-gray-400">총 발생 진료비</span>
                  <span className="text-[15px] font-black text-[#202124] dark:text-[#e8eaed]">{result.totalCost.toLocaleString()} 원</span>
                </div>
                
                <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-white/5">
                  <div>
                    <span className="text-[14px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">자기부담금 (공제액 합계)</span>
                    <span className="text-[11px] text-gray-400 bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded-none">항목별 최소공제 및 비율공제 합산</span>
                  </div>
                  <span className="text-[15px] font-black text-[#d93025] bg-[#fce8e6] dark:bg-[#d93025]/10 px-3 py-1 rounded-none">
                    - {result.totalDeduction.toLocaleString()} 원
                  </span>
                </div>
                
                {/* 항목별 지급액 디테일 */}
                <div className="py-2.5 space-y-2 text-[12px] font-medium text-gray-500 dark:text-gray-400">
                  <div className="flex justify-between"><span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-gray-300"></span>급여 지급액</span><span>{result.coveredPayout.toLocaleString()} 원</span></div>
                  <div className="flex justify-between"><span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-gray-300"></span>비급여 지급액</span><span>{result.nonCoveredPayout.toLocaleString()} 원</span></div>
                  {(data.generation >= 3) && (
                    <div className="flex justify-between text-red-500 dark:text-red-400"><span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-red-300"></span>{data.generation === 5 ? '비중증(3대특약) 지급액' : '3대 특약 지급액'}</span><span>{result.specialPayout.toLocaleString()} 원</span></div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-white/5 mt-1">
                  <span className="text-[15px] font-extrabold text-[#34A853]">최종 예상 지급액</span>
                  <span className="text-[18px] font-black text-[#34A853]">{result.totalPayout.toLocaleString()} 원</span>
                </div>
              </div>

              {/* 산출 계산식 */}
              <div className="mt-6 bg-[#f8f9fa] dark:bg-[#2d2d2d] rounded-none p-4 border border-gray-100 dark:border-white/5">
                <h4 className="text-[12px] font-extrabold text-[#34A853] mb-2 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                  적용된 산출 계산식
                </h4>
                <ul className="list-disc list-inside text-[11px] text-gray-500 dark:text-gray-400 space-y-1.5 leading-relaxed break-keep">
                  {result.formulas.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>

              {/* 보장율 프로그레스 바 */}
              <div className="mt-8 pt-6 border-t border-dashed border-gray-200 dark:border-white/10">
                <div className="flex justify-between text-[12px] font-extrabold text-gray-500 dark:text-gray-400 mb-2">
                  <span>실제 보상 비율 (총 진료비 대비)</span>
                  <span style={{ color: selectedGen.color }}>{result.coveragePct}%</span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
                  <div className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden" style={{ width: `${result.coveragePct}%`, backgroundColor: selectedGen.color }}>
                    <div className="absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 animate-[shimmer_2s_infinite]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#fce8e6]/80 dark:bg-[#d93025]/10 rounded-none p-4 border border-[#d93025]/20 flex gap-3 text-[12px] leading-relaxed text-[#d93025] dark:text-[#f28b82] font-semibold shadow-sm">
            <span className="shrink-0 text-base mt-0.5">⚠️</span>
            <p>위 결과는 <strong>단순 계산 추정치</strong>입니다. 실제 보상 시에는 비례보상, 면책상병 여부, 연간 보상한도 초과 등에 따라 지급액이 달라질 수 있습니다.</p>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <a href="https://open.kakao.com/o/sWeszp7" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full gap-2 py-4 bg-[#FEE500] hover:bg-[#F4DC00] text-[#000000] rounded-none font-bold text-[14px] sm:text-[15px] transition-all shadow-sm hover:shadow-md">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3C6.477 3 2 6.541 2 10.908c0 2.502 1.432 4.745 3.659 6.13-.314 1.157-1.14 4.183-1.182 4.341-.053.197.075.18.156.126.104-.07 3.324-2.222 4.606-3.084.887.24 1.821.366 2.761.366 5.523 0 10-3.541 10-7.908C22 6.541 17.523 3 12 3z"/>
              </svg>
              보상스쿨 1:1 무료 상담 신청하기
            </a>
            
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => shareResult('실손의료비', result.totalPayout)} className="flex items-center justify-center gap-1.5 py-3.5 bg-[#f8f9fa] border border-[#dadce0] hover:bg-[#f1f3f4] text-[#1a73e8] dark:bg-[#303134] dark:border-[#5f6368] dark:text-[#8ab4f8] dark:hover:bg-[#3c4043] rounded-none font-bold text-[13px] transition-all shadow-sm group">
                <svg className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                결과 공유하기
              </button>
              <button onClick={() => exportPDF('보상스쿨_실손의료비_계산결과.pdf')} className="flex items-center justify-center gap-1.5 py-3.5 bg-[#f8f9fa] border border-[#dadce0] hover:bg-[#f1f3f4] text-[#202124] dark:bg-[#303134] dark:border-[#5f6368] dark:text-[#e8eaed] dark:hover:bg-[#3c4043] rounded-none font-bold text-[13px] transition-all shadow-sm group">
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
