'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useCalculatorExport } from "@/hooks/useCalculatorExport";
import AppIcon from '@/components/ui/AppIcon';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumCard from '@/components/ui/PremiumCard';

export interface LiabilityData {
  ageAtAccident: number;
  income: number;
  faultRatio: number;
  hasInjury: boolean;
  hospitalDays: number;
  hasDisability: boolean;
  disabilityRate: number;
  disabilityYears: number;
  hasDeath: boolean;
  hasCare: boolean;
  carePersons: number;
  careYears: number;
  pastTreatmentCost: number;
  futureTreatmentCost: number;
}

const initialData: LiabilityData = {
  ageAtAccident: 42,
  income: 3800000,
  faultRatio: 20,
  hasInjury: true,
  hospitalDays: 30,
  hasDisability: true,
  disabilityRate: 15,
  disabilityYears: 0, // 0 = 65세 영구
  hasDeath: false,
  hasCare: false,
  carePersons: 1,
  careYears: 0,
  pastTreatmentCost: 3500000,
  futureTreatmentCost: 2000000,
};

// ── 판례 기준 호프만 계수 계산기 (월 단리 5/12% 할인) ──
function getHoffmanCoeff(months: number): number {
  let coeff = 0;
  for (let m = 1; m <= months; m++) {
    coeff += 1 / (1 + (0.05 / 12) * m);
  }
  return Math.min(240, coeff);
}

export default function LiabilityCalculator() {
  const [data, setData] = useState<LiabilityData>(initialData);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleChange = (field: keyof LiabilityData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const fmt = (val: number | string) => {
    if (!val) return '';
    return Number(val.toString().replace(/,/g, '')).toLocaleString();
  };
  const parse = (val: string) => Math.max(0, Number(val.replace(/[^0-9]/g, '')) || 0);

  // ── 판례 기준 손해배상 산출 엔진 (PoT Engine) ──
  const calculateResult = () => {
    const formulas: string[] = [];
    const maxWorkAge = 65;
    const remainingYears = Math.max(0, maxWorkAge - data.ageAtAccident);
    const remainingMonths = remainingYears * 12;

    // 1. 위자료 (법원 판례 기준 기준액 1억원 산정)
    let alimony = 0;
    if (data.hasDeath) {
      alimony = 100000000 * (1 - (data.faultRatio / 100) * 0.6);
      formulas.push(`사망 위자료: 기준액 1억 × (1 - 과실비율×0.6)`);
    } else if (data.hasDisability) {
      const rate = data.disabilityRate / 100;
      alimony = 100000000 * rate * (1 - (data.faultRatio / 100) * 0.6);
      formulas.push(`후유장해 위자료: 기준액 1억 × 장해율(${data.disabilityRate}%) × (1 - 과실×0.6)`);
    } else if (data.hasInjury) {
      alimony = Math.min(5000000, 1000000 + (data.hospitalDays * 50000));
      formulas.push(`부상 위자료: 입원일수 및 상해급수 판례 준용`);
    }

    // 2. 휴업손해 (입원기간 100% 인정)
    let hospitalLoss = 0;
    if (data.hasInjury && data.hospitalDays > 0 && !data.hasDeath) {
      const dailyIncome = data.income / 30;
      hospitalLoss = dailyIncome * data.hospitalDays;
      formulas.push(`휴업손해: 월소득(${fmt(data.income)}원) ÷ 30일 × ${data.hospitalDays}일`);
    }

    // 3. 일실수입 (사망 or 장해)
    let lostIncome = 0;
    if (data.hasDeath) {
      const livingCostDeduct = 1 / 3; // 생계비 1/3 공제
      const coeff = getHoffmanCoeff(remainingMonths);
      lostIncome = data.income * (1 - livingCostDeduct) * coeff;
      formulas.push(`사망 일실수입: 월소득 × 2/3(생계비공제) × 호프만계수(${coeff.toFixed(2)})`);
    } else if (data.hasDisability && data.disabilityRate > 0) {
      const months = data.disabilityYears > 0 ? data.disabilityYears * 12 : remainingMonths;
      const coeff = getHoffmanCoeff(months);
      lostIncome = data.income * (data.disabilityRate / 100) * coeff;
      formulas.push(`장해 일실수입: 월소득 × 장해율(${data.disabilityRate}%) × 호프만계수(${coeff.toFixed(2)})`);
    }

    // 4. 개호비 (간병비)
    let careCost = 0;
    if (data.hasCare && data.carePersons > 0) {
      const dailyNurseWage = 150000; // 일용 보통인부/간병인 판례 노임
      const monthlyCare = dailyNurseWage * 30 * data.carePersons;
      const careMonths = data.careYears > 0 ? data.careYears * 12 : Math.max(12, (80 - data.ageAtAccident) * 12);
      const coeff = getHoffmanCoeff(careMonths);
      careCost = monthlyCare * coeff;
      formulas.push(`개호비: 1일 ${data.carePersons}인(${fmt(dailyNurseWage)}원/일) × 호프만계수(${coeff.toFixed(2)})`);
    }

    // 5. 치료비
    const treatment = data.pastTreatmentCost + data.futureTreatmentCost;

    // 과실상계
    const subTotal = alimony + hospitalLoss + lostIncome + careCost + treatment;
    const faultDeduction = (hospitalLoss + lostIncome + careCost + treatment) * (data.faultRatio / 100);
    const totalAmount = Math.max(0, subTotal - faultDeduction);

    return {
      alimony,
      hospitalLoss,
      lostIncome,
      careCost,
      treatment,
      subTotal,
      faultDeduction,
      totalAmount,
      formulas
    };
  };

  const result = calculateResult();
  const { exportPDF, shareResult } = useCalculatorExport(resultRef);

  const inputClass = "w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 py-3 px-3.5 text-sm font-bold text-gray-900 dark:text-white rounded-none focus:border-rose-500 focus:outline-none transition-colors placeholder-gray-400";
  const labelHeaderClass = "flex items-center justify-between mb-2.5";
  const labelTextClass = "text-xs sm:text-[13.5px] font-extrabold text-gray-900 dark:text-gray-100 select-none";
  const labelSubClass = "text-[11px] text-gray-400 dark:text-zinc-500 font-medium select-none";

  return (
    <div className="w-full space-y-6">
      {/* 1. 타이틀 헤더 */}
      <div className="text-center space-y-2 mb-2">
        <PremiumHeading level={1} gradient="red" className="justify-center !text-2xl sm:!text-3xl">
          배상책임 소송가액 계산기
        </PremiumHeading>
        <p className="text-xs sm:text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-xl mx-auto leading-relaxed font-medium">
          법원 손해배상 판례 기준(호프만계수)을 적용한 위자료, 일실수입, 개호비 산출 도구입니다.
        </p>
      </div>

      {/* 2. 🛠️ 스마트 인터랙티브 입력 카드 (STEP 1, 2, 3) */}
      <div className="space-y-6">
        
        {/* [STEP 1] 피해 유형 선택 4단 칩 */}
        <PremiumCard borderColor="red" hoverEffect={true} watermarkIcon="scale" className="!p-5 sm:!p-7 overflow-hidden">
          {/* STEP 1 그라데이션 헤더 바 */}
          <div className="-mx-5 -mt-5 sm:-mx-7 sm:-mt-7 px-5 py-3.5 sm:px-7 sm:py-4 bg-gradient-to-r from-rose-50 via-red-50/60 to-transparent dark:from-rose-950/50 dark:via-red-950/30 dark:to-transparent border-b border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 bg-white dark:bg-zinc-800 px-2 py-0.5 border border-rose-200/80 dark:border-rose-800/80">STEP 01</span>
              <h2 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                <AppIcon name="scale" size={16} className="text-rose-600 dark:text-rose-400" />
                발생한 피해 유형 선택
              </h2>
            </div>
            <span className="text-xs text-gray-400 font-medium hidden sm:inline-block">복수 선택 가능</span>
          </div>

          <div className="space-y-4 pt-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { key: 'hasInjury', label: '부상 (상해)', sub: '치료비·휴업손해' },
                { key: 'hasDisability', label: '후유장해', sub: '미래 일실수입' },
                { key: 'hasDeath', label: '사망', sub: '유족 배상 및 장례비' },
                { key: 'hasCare', label: '개호 (간병)', sub: '평생 전문 간병비' },
              ].map(item => {
                const isActive = data[item.key as keyof LiabilityData] as boolean;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleChange(item.key as keyof LiabilityData, !isActive)}
                    className={`p-3.5 text-center border transition-all cursor-pointer ${
                      isActive
                        ? 'border-rose-600 bg-rose-50/90 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-extrabold shadow-xs'
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
        </PremiumCard>

        {/* [STEP 2] 연령, 소득, 과실비율 */}
        <PremiumCard borderColor="red" hoverEffect={true} watermarkIcon="chart" className="!p-5 sm:!p-7 overflow-hidden">
          {/* STEP 2 그라데이션 헤더 바 */}
          <div className="-mx-5 -mt-5 sm:-mx-7 sm:-mt-7 px-5 py-3.5 sm:px-7 sm:py-4 bg-gradient-to-r from-rose-50 via-red-50/60 to-transparent dark:from-rose-950/50 dark:via-red-950/30 dark:to-transparent border-b border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 bg-white dark:bg-zinc-800 px-2 py-0.5 border border-rose-200/80 dark:border-rose-800/80">STEP 02</span>
              <h2 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                <AppIcon name="chart" size={16} className="text-rose-600 dark:text-rose-400" />
                사고 당시 연령 & 소득 & 과실비율
              </h2>
            </div>
            <span className="text-xs text-gray-400 font-medium hidden sm:inline-block">소송가액 산정 기초</span>
          </div>

          <div className="space-y-6 pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className={labelHeaderClass}>
                  <label className={labelTextClass}>피해자 연령 (만 나이)</label>
                  <span className={labelSubClass}>가동연한(65세)</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={data.ageAtAccident || ''}
                    onChange={e => handleChange('ageAtAccident', Number(e.target.value))}
                    className={`${inputClass} pr-7`}
                  />
                  <span className="absolute right-3.5 top-3.5 text-xs text-gray-400 font-bold">세</span>
                </div>
              </div>
              <div>
                <div className={labelHeaderClass}>
                  <label className={labelTextClass}>월 평균 소득</label>
                  <span className={labelSubClass}>세전 실질소득</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={data.income ? fmt(data.income) : ''}
                    onChange={e => handleChange('income', parse(e.target.value))}
                    className={`${inputClass} pr-7`}
                  />
                  <span className="absolute right-3.5 top-3.5 text-xs text-gray-400 font-bold">원</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleChange('income', 3441360)}
              className="w-full py-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/80 text-xs sm:text-[12.5px] font-extrabold hover:bg-rose-100 transition-colors cursor-pointer"
            >
              보통인부 시중노임단가 자동 적용 (3,441,360원)
            </button>

            {/* 과실 비율 퀵 칩 */}
            <div>
              <div className={labelHeaderClass}>
                <label className={labelTextClass}>본인 과실 비율</label>
                <span className="text-xs sm:text-sm font-extrabold text-rose-600 dark:text-rose-400">{data.faultRatio}%</span>
              </div>
              <div className="grid grid-cols-5 gap-2.5">
                {[0, 10, 20, 30, 50].map(v => (
                  <button
                    key={v}
                    onClick={() => handleChange('faultRatio', v)}
                    className={`py-2.5 text-xs sm:text-[13px] font-extrabold border transition-all cursor-pointer ${
                      data.faultRatio === v
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-100'
                    }`}
                  >
                    {v}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </PremiumCard>

        {/* [STEP 3] 세부 손해배상 항목 */}
        {(data.hasInjury || data.hasDisability || data.hasDeath || data.hasCare) && (
          <PremiumCard borderColor="rose" hoverEffect={true} watermarkIcon="crutches" className="!p-5 sm:!p-7 overflow-hidden animate-in fade-in duration-200">
            {/* STEP 3 그라데이션 헤더 바 */}
            <div className="-mx-5 -mt-5 sm:-mx-7 sm:-mt-7 px-5 py-3.5 sm:px-7 sm:py-4 bg-gradient-to-r from-rose-50 via-amber-50/60 to-transparent dark:from-rose-950/50 dark:via-amber-950/30 dark:to-transparent border-b border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 bg-white dark:bg-zinc-800 px-2 py-0.5 border border-rose-200/80 dark:border-rose-800/80">STEP 03</span>
                <h2 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <AppIcon name="crutches" size={16} className="text-rose-600 dark:text-rose-400" />
                  세부 손해배상 항목 상세 입력
                </h2>
              </div>
              <span className="text-xs text-gray-400 font-medium hidden sm:inline-block">소송 판례 호프만 산출</span>
            </div>

            <div className="space-y-6 pt-5">
              {data.hasInjury && !data.hasDeath && (
                <div>
                  <div className={labelHeaderClass}>
                    <label className={labelTextClass}>입원 일수 (휴업손해)</label>
                    <span className={labelSubClass}>100% 실질 손해액</span>
                  </div>
                  <input
                    type="number"
                    value={data.hospitalDays === 0 ? '0' : (data.hospitalDays || '')}
                    onChange={e => handleChange('hospitalDays', Number(e.target.value))}
                    placeholder="30"
                    className={inputClass}
                  />
                </div>
              )}

              {data.hasDisability && !data.hasDeath && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className={labelHeaderClass}>
                      <label className={labelTextClass}>노동능력상실률 (%)</label>
                      <span className="text-[11px] text-rose-600 font-bold">맥브라이드 기준</span>
                    </div>
                    <input
                      type="number"
                      value={data.disabilityRate === 0 ? '0' : (data.disabilityRate || '')}
                      onChange={e => handleChange('disabilityRate', Number(e.target.value))}
                      placeholder="15"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <div className={labelHeaderClass}>
                      <label className={labelTextClass}>장해 기간 (0=영구)</label>
                      <span className={labelSubClass}>호프만 적용</span>
                    </div>
                    <input
                      type="number"
                      value={data.disabilityYears === 0 ? '0' : (data.disabilityYears || '')}
                      onChange={e => handleChange('disabilityYears', Number(e.target.value))}
                      placeholder="0"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              {data.hasCare && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className={labelHeaderClass}>
                      <label className={labelTextClass}>필요 개호인 (명)</label>
                      <span className={labelSubClass}>1일 필요 간병인원</span>
                    </div>
                    <input
                      type="number"
                      step="0.5"
                      value={data.carePersons === 0 ? '0' : (data.carePersons || '')}
                      onChange={e => handleChange('carePersons', Number(e.target.value))}
                      placeholder="1"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <div className={labelHeaderClass}>
                      <label className={labelTextClass}>개호 기간 (0=여명)</label>
                      <span className={labelSubClass}>평생 간병 기간</span>
                    </div>
                    <input
                      type="number"
                      value={data.careYears === 0 ? '0' : (data.careYears || '')}
                      onChange={e => handleChange('careYears', Number(e.target.value))}
                      placeholder="0"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              {/* 기왕/향후 치료비 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className={labelHeaderClass}>
                    <label className={labelTextClass}>기왕 치료비 (병원비)</label>
                    <span className={labelSubClass}>실제 지출 치료비</span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={data.pastTreatmentCost ? fmt(data.pastTreatmentCost) : ''}
                    onChange={e => handleChange('pastTreatmentCost', parse(e.target.value))}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
                <div>
                  <div className={labelHeaderClass}>
                    <label className={labelTextClass}>향후 치료비 (수술/성형)</label>
                    <span className={labelSubClass}>추정 향후 수술비</span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={data.futureTreatmentCost ? fmt(data.futureTreatmentCost) : ''}
                    onChange={e => handleChange('futureTreatmentCost', parse(e.target.value))}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </PremiumCard>
        )}
      </div>

      {/* 3. 📋 세부 손해배상 산출 명세서 (상시 100% 노출) */}
      <PremiumCard borderColor="red" hoverEffect={true} watermarkIcon="file-text" className="!p-5 sm:!p-7 overflow-hidden">
        {/* 명세서 그라데이션 헤더 바 */}
        <div className="-mx-5 -mt-5 sm:-mx-7 sm:-mt-7 px-5 py-3.5 sm:px-7 sm:py-4 bg-gradient-to-r from-rose-50 via-red-50/60 to-transparent dark:from-rose-950/50 dark:via-red-950/30 dark:to-transparent border-b border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AppIcon name="file-text" size={16} className="text-rose-600 dark:text-rose-400" />
            <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white">
              세부 손해배상 산출 명세서 & 호프만 법리 공식
            </h3>
          </div>
          <span className="text-xs text-gray-400 font-medium hidden sm:inline-block">법원 판례 기준 실시간 연산</span>
        </div>

        <div className="space-y-3 pt-5 text-xs sm:text-[13.5px] text-gray-700 dark:text-gray-300">
          {result.alimony > 0 && (
            <div className="flex justify-between py-2.5 border-b border-gray-100 dark:border-zinc-800/80">
              <span className="font-medium">· 정신적 손해 (위자료)</span>
              <span className="font-extrabold text-gray-900 dark:text-white">{Math.floor(result.alimony).toLocaleString()} 원</span>
            </div>
          )}
          {data.hasInjury && !data.hasDeath && (
            <div className="flex justify-between py-2.5 border-b border-gray-100 dark:border-zinc-800/80">
              <span className="font-medium">· 휴업손해 (입원 {data.hospitalDays}일)</span>
              <span className="font-extrabold text-gray-900 dark:text-white">{Math.floor(result.hospitalLoss).toLocaleString()} 원</span>
            </div>
          )}
          {(data.hasDisability || data.hasDeath) && (
            <div className="flex justify-between py-2.5 border-b border-gray-100 dark:border-zinc-800/80">
              <span className="font-medium">· 일실수입 ({data.hasDeath ? '사망 상실수익액' : `후유장해 ${data.disabilityRate}%`})</span>
              <span className="font-extrabold text-gray-900 dark:text-white">{Math.floor(result.lostIncome).toLocaleString()} 원</span>
            </div>
          )}
          {result.careCost > 0 && (
            <div className="flex justify-between py-2.5 border-b border-gray-100 dark:border-zinc-800/80">
              <span className="font-medium">· 개호비 (간병비용 합계)</span>
              <span className="font-extrabold text-gray-900 dark:text-white">{Math.floor(result.careCost).toLocaleString()} 원</span>
            </div>
          )}
          {result.treatment > 0 && (
            <div className="flex justify-between py-2.5 border-b border-gray-100 dark:border-zinc-800/80">
              <span className="font-medium">· 적극적 손해 (기왕/향후 치료비)</span>
              <span className="font-extrabold text-gray-900 dark:text-white">{Math.floor(result.treatment).toLocaleString()} 원</span>
            </div>
          )}
          <div className="flex justify-between py-2.5 font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-zinc-700">
            <span>과실 상계 전 손해액 총합</span>
            <span>{Math.floor(result.totalAmount / (1 - (data.faultRatio / 100) || 1)).toLocaleString()} 원</span>
          </div>
          <div className="flex justify-between py-2.5 text-rose-600 dark:text-rose-400 font-extrabold">
            <span>(-) 본인 과실 상계액 ({data.faultRatio}%)</span>
            <span>-{Math.floor(result.faultDeduction).toLocaleString()} 원</span>
          </div>
        </div>

        {/* 계산 공식 */}
        {result.formulas.length > 0 && (
          <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-900/70 p-4">
            <h4 className="text-xs font-extrabold text-rose-600 dark:text-rose-400 mb-1.5 flex items-center gap-1.5">
              <AppIcon name="calculator" size={14} />
              적용된 법원 손해배상 산정 공식
            </h4>
            <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-400 space-y-1 leading-relaxed">
              {result.formulas.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
        )}
      </PremiumCard>

      {/* 4. 🏆 [최하단 배치] 최종 예상 배상청구액 챔피언 카드 */}
      <div ref={resultRef} className="bg-gradient-to-br from-rose-600 to-red-700 dark:from-rose-700 dark:to-red-900 p-6 sm:p-8 text-white shadow-lg relative overflow-hidden transition-transform duration-200 hover:scale-[1.005]">
        <div className="relative z-10 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-xs px-3 py-1.5 text-xs font-extrabold text-white/90 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-rose-300 animate-pulse"></span>
              법원 판례 기준 예상 손해배상액 (호프만 단리)
            </span>
            <span className="text-xs sm:text-[13px] text-white/80 font-bold">
              본인과실 {data.faultRatio}% 적용
            </span>
          </div>

          <div className="flex items-end gap-2 mb-5">
            <div className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight drop-shadow-xs">
              {Math.floor(result.totalAmount).toLocaleString()}
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white/90 mb-1">원</div>
          </div>

          <div className="pt-4 border-t border-white/20 flex flex-wrap items-center justify-between text-xs sm:text-sm text-white/90 font-medium gap-3">
            <div>
              <span className="text-white/60 mr-1.5">적용 소득:</span>
              <span className="font-bold text-white">{data.income.toLocaleString()}원/월</span>
            </div>
            <div>
              <span className="text-white/60 mr-1.5">호프만 가동연한:</span>
              <span className="font-bold text-white">{Math.max(0, 65 - data.ageAtAccident)}년 잔여</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. 🛡️ 전문가 조언 및 액션 버튼 바 */}
      <div className="bg-amber-50 dark:bg-amber-950/30 p-4 border border-amber-200/80 dark:border-amber-900/40 text-xs sm:text-[13px] leading-relaxed text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
        <AppIcon name="shield-alert" size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <p>위 결과는 <strong>법원 손해배상 소송 판례(호프만 단리 수식)</strong> 기준 산출액입니다. 상대방 보험사의 자체 지급기준(라이프니츠 계수 등)보다 판례 기준이 통상 20~40% 높게 산정될 수 있습니다.</p>
      </div>

      <div className="space-y-3 pt-1">
        <Link
          href="/consultation"
          className="flex items-center justify-center w-full gap-2 py-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm sm:text-base transition-all shadow-md shadow-rose-500/20 text-center cursor-pointer"
        >
          <AppIcon name="chat" size={20} />
          <span>배상책임 손해배상청구 1:1 무료 상담 신청하기</span>
        </Link>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => shareResult('배상책임', result.totalAmount)}
            className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 hover:border-rose-500 text-gray-800 dark:text-gray-200 font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-xs"
          >
            <AppIcon name="link" size={15} />
            결과 링크 공유
          </button>
          <button
            onClick={() => exportPDF('보상스쿨_배상책임_예상보상금.pdf')}
            className="flex items-center justify-center gap-2 py-3 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 hover:border-rose-500 text-gray-800 dark:text-gray-200 font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-xs"
          >
            <AppIcon name="file-text" size={15} />
            PDF 명세서 다운로드
          </button>
        </div>
      </div>
    </div>
  );
}
