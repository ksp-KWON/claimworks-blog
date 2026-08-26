'use client';

import { useState, useRef } from 'react';
import { useCalculatorExport } from "@/hooks/useCalculatorExport";
import AppIcon from '@/components/ui/AppIcon';

export interface LiabilityData {
  ageAtAccident: number;
  faultRatio: number;
  income: number;
  hasInjury: boolean;
  hasDisability: boolean;
  hasDeath: boolean;
  hasCare: boolean;
  hospitalDays: number;
  disabilityRate: number;
  disabilityYears: number;
  carePersons: number;
  careYears: number;
  pastTreatmentCost: number;
  futureTreatmentCost: number;
  applianceCost: number;
  funeralCost: number;
  alimonyBase: number;
}

const initialData: LiabilityData = {
  ageAtAccident: 40,
  faultRatio: 20,
  income: 3441360, 
  hasInjury: true,
  hasDisability: false,
  hasDeath: false,
  hasCare: false,
  hospitalDays: 30,
  disabilityRate: 15,
  disabilityYears: 0,
  carePersons: 1,
  careYears: 1,
  pastTreatmentCost: 0,
  futureTreatmentCost: 0,
  applianceCost: 0,
  funeralCost: 5000000,
  alimonyBase: 100000000, // 대법원 기준 1억
};

function getHoffmanForMonths(months: number) {
  let sum = 0;
  for (let i = 1; i <= months; i++) {
    sum += 1 / (1 + (0.05 / 12) * i);
  }
  return Math.min(sum, 240);
}

export default function LiabilityCalculator() {
  const [data, setData] = useState<LiabilityData>(initialData);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleChange = (field: keyof LiabilityData, value: number | boolean) => {
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

  // ── 대법원 호프만 손해배상 산출 엔진 (PoT Engine) ──
  const calculateResult = () => {
    const maxMonths = Math.max(0, (65 - data.ageAtAccident) * 12);
    let effectiveDisabilityRate = 0;
    if (data.hasDeath) effectiveDisabilityRate = 100;
    else if (data.hasDisability) effectiveDisabilityRate = data.disabilityRate;

    const alimony = Math.max(0, data.alimonyBase * (effectiveDisabilityRate / 100) * (1 - (data.faultRatio / 100) * 0.6));

    let lostIncome = 0;
    let H_disability = 0;

    if (data.hasDeath) {
      H_disability = getHoffmanForMonths(maxMonths);
      lostIncome = data.income * (2 / 3) * H_disability * (1 - (data.faultRatio / 100));
    } else if (data.hasDisability) {
      const targetMonths = data.disabilityYears === 0 ? maxMonths : Math.min(maxMonths, data.disabilityYears * 12);
      H_disability = getHoffmanForMonths(targetMonths);
      lostIncome = data.income * (data.disabilityRate / 100) * H_disability * (1 - (data.faultRatio / 100));
    }

    let hospitalLoss = 0;
    if (data.hasInjury && !data.hasDeath) {
      hospitalLoss = data.income * (data.hospitalDays / 30) * (1 - (data.faultRatio / 100));
    }

    let careCost = 0;
    const dailyWage = 156425; 
    let H_care = 0;
    let careMonths = 0;
    if (data.hasCare) {
      careMonths = data.careYears === 0 ? maxMonths : Math.min(maxMonths, data.careYears * 12);
      H_care = getHoffmanForMonths(careMonths);
      careCost = dailyWage * 30 * data.carePersons * H_care * (1 - (data.faultRatio / 100));
    }

    let finalFuneralCost = 0;
    if (data.hasDeath) finalFuneralCost = data.funeralCost * (1 - (data.faultRatio / 100));

    const treatment = (data.pastTreatmentCost + data.futureTreatmentCost + data.applianceCost) * (1 - (data.faultRatio / 100));
    const totalActiveLoss = treatment + careCost + finalFuneralCost;

    const totalAmount = alimony + lostIncome + hospitalLoss + totalActiveLoss;

    const formulas: string[] = [];
    if (alimony > 0) formulas.push(`위자료: 기준액(${fmt(Math.floor(data.alimonyBase))}원) × 장해율(${effectiveDisabilityRate}%) × [1 - (과실 ${data.faultRatio}% × 0.6)]`);
    if (lostIncome > 0) {
      if (data.hasDeath) formulas.push(`사망 일실수입: (월소득 × 2/3) × H계수(${H_disability.toFixed(4)}) × (1 - 과실 ${data.faultRatio}%)`);
      else formulas.push(`장해 일실수입: 월소득 × 장해율(${data.disabilityRate}%) × H계수(${H_disability.toFixed(4)}) × (1 - 과실 ${data.faultRatio}%)`);
    }
    if (hospitalLoss > 0) formulas.push(`휴업손해: (소득 ÷ 30일) × 입원일수(${data.hospitalDays}일) × (1 - 과실 ${data.faultRatio}%)`);
    if (careCost > 0) formulas.push(`개호비: 일용단가(${fmt(156425)}원) × 30일 × 필요인원(${data.carePersons}명) × H계수(${H_care.toFixed(4)}) × (1 - 과실 ${data.faultRatio}%)`);
    if (finalFuneralCost > 0) formulas.push(`장례비: 장례비용(${fmt(data.funeralCost)}원) × (1 - 과실 ${data.faultRatio}%)`);
    if (treatment > 0) formulas.push(`치료비 등: 추가비용 합계 × (1 - 과실 ${data.faultRatio}%)`);

    return { alimony, effectiveDisabilityRate, lostIncome, H_disability, hospitalLoss, careCost, totalActiveLoss, treatment, finalFuneralCost, totalAmount, formulas };
  };

  const result = calculateResult();
  const { exportPDF, shareResult } = useCalculatorExport(resultRef);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* ── 좌측: 3-Step 구조화 입력 폼 (5열) ── */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          
          {/* STEP 1: 피해 유형 선택 */}
          <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 border border-rose-200/90 dark:border-rose-900/50 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-1.5 py-0.5 rounded">STEP 01</span>
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
                  sub: '휴업손해 및 부상 치료비', 
                  activeClass: 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-xs' 
                },
                { 
                  key: 'hasDisability', 
                  icon: 'crutches' as const, 
                  title: '후유장해', 
                  sub: '미래 일실수입 (노동능력상실)', 
                  activeClass: 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-xs' 
                },
                { 
                  key: 'hasDeath', 
                  icon: 'rose' as const, 
                  title: '사망', 
                  sub: '생계비 공제 일실수입 & 장례비', 
                  activeClass: 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-xs' 
                },
                { 
                  key: 'hasCare', 
                  icon: 'wheelchair' as const, 
                  title: '개호 (간병)', 
                  sub: '중증 피해로 인한 평생 간병비', 
                  activeClass: 'border-rose-500 bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-xs' 
                },
              ].map(item => {
                const isActive = data[item.key as keyof LiabilityData] as boolean;
                return (
                  <button 
                    key={item.key} 
                    onClick={() => handleChange(item.key as keyof LiabilityData, !isActive)} 
                    className={`w-full flex items-center gap-3.5 p-3 rounded-none border transition-all text-left cursor-pointer ${
                      isActive 
                        ? item.activeClass 
                        : 'border-gray-200 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-900/60 hover:bg-gray-100/80 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="shrink-0 flex items-center justify-center">
                      <AppIcon name={item.icon} size={18} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-[13px]">{item.title}</div>
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

          {/* STEP 2: 연령, 소득, 과실비율 */}
          <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 border border-gray-200/90 dark:border-zinc-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">STEP 02</span>
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">기본 조건 (연령·소득·과실)</h3>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">사고 당시 피해자 연령 (만 나이)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={data.ageAtAccident || ''} 
                    onChange={e => handleChange('ageAtAccident', Number(e.target.value))} 
                    className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none py-2.5 pl-3.5 pr-10 text-[14px] font-bold focus:border-rose-500 focus:outline-none transition-all" 
                  />
                  <span className="absolute right-3.5 top-3 text-[12px] text-gray-400 font-bold">세</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5">월 평균 소득</label>
                <div className="relative mb-2">
                  <input 
                    type="text" 
                    inputMode="numeric" 
                    value={data.income ? fmt(data.income) : ''} 
                    onChange={e => handleChange('income', parse(e.target.value))} 
                    className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none py-2.5 pl-3.5 pr-10 text-[14px] font-bold focus:border-rose-500 focus:outline-none transition-all" 
                  />
                  <span className="absolute right-3.5 top-3 text-[12px] text-gray-400 font-bold">원</span>
                </div>
                <button 
                  onClick={() => handleChange('income', 3441360)} 
                  className="w-full py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[11.5px] font-bold rounded-none hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all flex items-center justify-center gap-1.5 border border-rose-200/60 dark:border-rose-800/60 cursor-pointer"
                >
                  <AppIcon name="chart" size={13} />
                  보통인부 시중노임단가 자동 적용 (3,441,360원)
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
                    className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none py-2.5 pl-3.5 pr-10 text-[14px] font-bold focus:border-rose-500 focus:outline-none transition-all" 
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
                          ? 'bg-rose-600 text-white border-rose-600' 
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

          {/* STEP 3: 세부 항목 (장해율, 개호, 치료비) */}
          {(data.hasInjury || data.hasDisability || data.hasDeath || data.hasCare) && (
            <div className="bg-white dark:bg-[#202124] p-5 sm:p-6 border border-gray-200/90 dark:border-zinc-800 shadow-sm space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 px-1.5 py-0.5 rounded">STEP 03</span>
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">세부 손해배상 항목</h3>
                </div>
              </div>
              
              <div className="space-y-4">
                {data.hasInjury && !data.hasDeath && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">입원 일수 (휴업손해)</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={data.hospitalDays === 0 ? '0' : (data.hospitalDays || '')} 
                        onChange={e => handleChange('hospitalDays', Number(e.target.value))} 
                        placeholder="0"
                        className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none py-2 px-3 pr-7 text-[13px] font-bold focus:border-rose-500 focus:outline-none" 
                      />
                      <span className="absolute right-2.5 top-2.5 text-[11px] text-gray-400 font-bold">일</span>
                    </div>
                  </div>
                )}
                
                {data.hasDisability && !data.hasDeath && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">노동능력상실률</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={data.disabilityRate === 0 ? '0' : (data.disabilityRate || '')} 
                          onChange={e => handleChange('disabilityRate', Number(e.target.value))} 
                          placeholder="15"
                          className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none py-2 px-3 pr-7 text-[13px] font-bold focus:border-rose-500 focus:outline-none" 
                        />
                        <span className="absolute right-2.5 top-2.5 text-[11px] text-gray-400 font-bold">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">장해 기간</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={data.disabilityYears === 0 ? '0' : (data.disabilityYears || '')} 
                          onChange={e => handleChange('disabilityYears', Number(e.target.value))} 
                          placeholder="0 (영구)"
                          className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none py-2 px-3 pr-7 text-[13px] font-bold focus:border-rose-500 focus:outline-none" 
                        />
                        <span className="absolute right-2.5 top-2.5 text-[11px] text-gray-400 font-bold">년</span>
                      </div>
                    </div>
                  </div>
                )}

                {data.hasCare && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">필요 개호인</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          step="0.5" 
                          value={data.carePersons === 0 ? '0' : (data.carePersons || '')} 
                          onChange={e => handleChange('carePersons', Number(e.target.value))} 
                          placeholder="1"
                          className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none py-2 px-3 pr-7 text-[13px] font-bold focus:border-rose-500 focus:outline-none" 
                        />
                        <span className="absolute right-2.5 top-2.5 text-[11px] text-gray-400 font-bold">인</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">개호 기간</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={data.careYears === 0 ? '0' : (data.careYears || '')} 
                          onChange={e => handleChange('careYears', Number(e.target.value))} 
                          placeholder="0 (여명)"
                          className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none py-2 px-3 pr-7 text-[13px] font-bold focus:border-rose-500 focus:outline-none" 
                        />
                        <span className="absolute right-2.5 top-2.5 text-[11px] text-gray-400 font-bold">년</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">기왕치료비</label>
                    <input 
                      type="text" 
                      inputMode="numeric" 
                      value={data.pastTreatmentCost ? fmt(data.pastTreatmentCost) : ''} 
                      onChange={e => handleChange('pastTreatmentCost', parse(e.target.value))} 
                      placeholder="0" 
                      className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none py-2 px-3 text-[13px] font-bold focus:border-rose-500 focus:outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">향후치료비</label>
                    <input 
                      type="text" 
                      inputMode="numeric" 
                      value={data.futureTreatmentCost ? fmt(data.futureTreatmentCost) : ''} 
                      onChange={e => handleChange('futureTreatmentCost', parse(e.target.value))} 
                      placeholder="0" 
                      className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-none py-2 px-3 text-[13px] font-bold focus:border-rose-500 focus:outline-none" 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 우측: 실시간 소송가액 명세서 (7열, 스티키 고정) ── */}
        <div className="lg:col-span-7 lg:sticky lg:top-[100px] flex flex-col gap-4">
          <div className="bg-gray-100 dark:bg-zinc-900 px-5 py-3.5 border border-gray-200 dark:border-zinc-800 flex items-center gap-2.5">
            <AppIcon name="scale" size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />
            <div>
              <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">법원 소송 판례 기준 손해액 명세서</h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">대법원 호프만 계수 및 과실상계 적용 예상액입니다.</p>
            </div>
          </div>

          <div ref={resultRef} className="flex flex-col gap-4">
            {/* 최종 손해배상액 챔피언 카드 */}
            <div className="bg-gradient-to-br from-rose-600 to-red-700 dark:from-rose-700 dark:to-red-900 p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
              <div className="relative z-10 flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-none text-[10.5px] font-bold text-white/90 uppercase tracking-wider mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-300 animate-pulse"></span>
                    예상 총 손해배상액 (과실 상계 후 최종액)
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                    <div className="text-4xl sm:text-5xl font-black tracking-tight">
                      {Math.floor(result.totalAmount).toLocaleString()}
                    </div>
                    <div className="text-xl font-bold text-white/90 mb-1">원</div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/20 flex flex-wrap gap-4 text-[12px] font-medium text-white/90">
                  <div><span className="text-white/60 mr-1">피해유형:</span><span className="font-bold">{[data.hasInjury && '부상', data.hasDisability && '장해', data.hasDeath && '사망', data.hasCare && '개호'].filter(Boolean).join(', ') || '선택 없음'}</span></div>
                  <div><span className="text-white/60 mr-1">월소득:</span><span className="font-bold">{data.income.toLocaleString()}원</span></div>
                  <div><span className="text-white/60 mr-1">본인과실:</span><span className="bg-white/25 px-1.5 py-0.5 rounded text-white font-bold">{data.faultRatio}%</span></div>
                </div>
              </div>
            </div>

            {/* 세부 보상 내역서 */}
            <div className="bg-white dark:bg-[#202124] border border-gray-200 dark:border-zinc-800 p-5 sm:p-6 shadow-xs space-y-3">
              <h3 className="text-xs font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5 mb-3">
                <span className="w-1 h-3.5 bg-rose-600 rounded-none"></span> 세부 배상 산출 내역
              </h3>
              
              <div className="space-y-2.5 text-[12.5px] text-gray-600 dark:text-gray-400">
                {result.alimony > 0 && (
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-zinc-800/80">
                    <span>정신적 손해 (위자료)</span>
                    <span className="font-bold text-gray-900 dark:text-white">{Math.floor(result.alimony).toLocaleString()} 원</span>
                  </div>
                )}
                
                {(data.hasInjury && !data.hasDeath) && (
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-zinc-800/80">
                    <span>휴업손해 (입원 {data.hospitalDays}일)</span>
                    <span className="font-bold text-gray-900 dark:text-white">{Math.floor(result.hospitalLoss).toLocaleString()} 원</span>
                  </div>
                )}

                {(data.hasDisability || data.hasDeath) && (
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-zinc-800/80">
                    <span>일실수입 ({data.hasDeath ? '사망' : `장해 ${data.disabilityRate}%`})</span>
                    <span className="font-bold text-gray-900 dark:text-white">{Math.floor(result.lostIncome).toLocaleString()} 원</span>
                  </div>
                )}

                {result.totalActiveLoss > 0 && (
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-zinc-800/80">
                    <span>적극적 손해 (치료비, 개호비 등)</span>
                    <span className="font-bold text-gray-900 dark:text-white">{Math.floor(result.totalActiveLoss).toLocaleString()} 원</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-zinc-700 mt-2">
                  <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">최종 예상 배상액</span>
                  <span className="text-base font-black text-rose-600 dark:text-rose-400">{Math.floor(result.totalAmount).toLocaleString()} 원</span>
                </div>
              </div>

              {/* 산출 계산식 */}
              {result.formulas.length > 0 && (
                <div className="mt-4 bg-gray-50 dark:bg-zinc-900 p-3.5 border border-gray-200/80 dark:border-zinc-800 rounded-none">
                  <h4 className="text-[11.5px] font-bold text-rose-600 dark:text-rose-400 mb-1.5 flex items-center gap-1">
                    <AppIcon name="calculator" size={13} />
                    적용된 판례 산출식 (호프만)
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
            <p>위 결과는 <strong>법원 소송 판례(호프만 계수) 기준</strong> 단순 적용 수치입니다. 실제 소송 시 피해자의 과실 비율, 정년, 개호 등에 따라 달라질 수 있으므로 손해사정 전문가의 상담을 권장합니다.</p>
          </div>

          {/* 상담 및 액션 버튼 그룹 */}
          <div className="flex flex-col gap-2 pt-1">
            <button 
              onClick={() => { document.getElementById('chat-floating-btn')?.click(); }} 
              className="flex items-center justify-center w-full gap-2 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-none font-extrabold text-[14px] transition-all shadow-md shadow-rose-500/20 cursor-pointer" 
              id="liability-calc-chat-btn"
            >
              <AppIcon name="chat" size={18} />
              배상책임 손해액 1:1 무료 상담 신청
            </button>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => shareResult('배상책임', result.totalAmount)} 
                className="flex items-center justify-center gap-1.5 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 hover:border-rose-500 text-gray-700 dark:text-gray-300 rounded-none font-bold text-[12px] transition-all cursor-pointer"
              >
                <AppIcon name="link" size={14} />
                결과 공유하기
              </button>
              <button 
                onClick={() => exportPDF('보상스쿨_배상책임_예상보상금.pdf')} 
                className="flex items-center justify-center gap-1.5 py-2.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 hover:border-rose-500 text-gray-700 dark:text-gray-300 rounded-none font-bold text-[12px] transition-all cursor-pointer"
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
