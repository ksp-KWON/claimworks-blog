'use client';

import { useState } from 'react';

// ── 데이터 타입 및 초기값 ──
export interface LiabilityData {
  ageAtAccident: number;
  faultRatio: number;
  income: number;
  
  // 피해 유형
  hasInjury: boolean;
  hasDisability: boolean;
  hasDeath: boolean;
  hasCare: boolean; // 개호(간병) 여부

  // 상세 입력
  hospitalDays: number;
  disabilityRate: number; // 0~100
  disabilityYears: number; // 0 = 영구
  carePersons: number; // 일일 필요 개호인 수
  careYears: number; // 개호 필요 기간 (년)

  // 추가 비용
  pastTreatmentCost: number;
  futureTreatmentCost: number;
  applianceCost: number; // 보조구 비용
  funeralCost: number; // 장례비

  alimonyBase: number;
}

const initialData: LiabilityData = {
  ageAtAccident: 40,
  faultRatio: 20,
  income: 3284525, 
  
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

  alimonyBase: 100000000, // 1억
};

// 호프만 계수 산출 (대법원 판례상 한도 240)
function getHoffmanForMonths(months: number) {
  let sum = 0;
  for (let i = 1; i <= months; i++) {
    sum += 1 / (1 + (0.05 / 12) * i);
  }
  return Math.min(sum, 240);
}

// ── 탭 정의 ──
const STEPS = [
  { id: 'base',     label: '기본 정보',   icon: '👤' },
  { id: 'damage',   label: '피해 유형',   icon: '📋' },
  { id: 'detail',   label: '상세 입력',   icon: '🔍' },
  { id: 'expense',  label: '추가 비용',   icon: '💊' },
];

export default function LiabilityCalculator() {
  const [data, setData] = useState<LiabilityData>(initialData);
  const [activeStep, setActiveStep] = useState(0);

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

  const addValue = (field: keyof LiabilityData, addAmount: number) => {
    setData(prev => ({ ...prev, [field]: Number(prev[field]) + addAmount }));
  };

  const fmt = (val: number | string) => {
    if (!val) return '';
    return Number(val.toString().replace(/,/g, '')).toLocaleString();
  };
  const parse = (val: string) => Math.max(0, Number(val.replace(/[^0-9]/g, '')) || 0);

  // ── 계산 로직 ──
  // 가동연한 65세까지 남은 개월 수
  const maxMonths = Math.max(0, (65 - data.ageAtAccident) * 12);
  
  // 1. 위자료
  let effectiveDisabilityRate = 0;
  if (data.hasDeath) effectiveDisabilityRate = 100;
  else if (data.hasDisability) effectiveDisabilityRate = data.disabilityRate;

  const alimony = Math.max(0, data.alimonyBase * (effectiveDisabilityRate / 100) * (1 - (data.faultRatio / 100) * 0.6));

  // 2. 일실수입 (사망 or 장해)
  let lostIncome = 0;
  let H_disability = 0;
  let isDeathDeduction = false;

  if (data.hasDeath) {
    // 사망 일실수입: (소득 - 1/3 생계비) * 가동연한 H계수
    H_disability = getHoffmanForMonths(maxMonths);
    lostIncome = data.income * (2 / 3) * H_disability * (1 - (data.faultRatio / 100));
    isDeathDeduction = true;
  } else if (data.hasDisability) {
    // 장해 일실수입: 소득 * 장해율 * 장해기간 H계수
    const targetMonths = data.disabilityYears === 0 ? maxMonths : Math.min(maxMonths, data.disabilityYears * 12);
    H_disability = getHoffmanForMonths(targetMonths);
    lostIncome = data.income * (data.disabilityRate / 100) * H_disability * (1 - (data.faultRatio / 100));
  }

  // 3. 휴업손해 (부상)
  let hospitalLoss = 0;
  if (data.hasInjury && !data.hasDeath) {
    hospitalLoss = data.income * (data.hospitalDays / 30) * (1 - (data.faultRatio / 100));
  }

  // 4. 적극적 손해 (치료비, 개호비, 장례비, 보조구)
  let careCost = 0;
  if (data.hasCare) {
    const careMonths = data.careYears === 0 ? maxMonths : Math.min(maxMonths, data.careYears * 12);
    const H_care = getHoffmanForMonths(careMonths);
    // 보통인부 일당 약 16만 원 적용 (여기서는 시중노임단가 일할 149,296원으로 계산)
    const dailyWage = 149296; 
    careCost = dailyWage * 30 * data.carePersons * H_care * (1 - (data.faultRatio / 100));
  }

  let finalFuneralCost = 0;
  if (data.hasDeath) {
    finalFuneralCost = data.funeralCost * (1 - (data.faultRatio / 100));
  }

  const treatment = (data.pastTreatmentCost + data.futureTreatmentCost + data.applianceCost) * (1 - (data.faultRatio / 100));
  const totalActiveLoss = treatment + careCost + finalFuneralCost;

  // 총계
  const totalAmount = alimony + lostIncome + hospitalLoss + totalActiveLoss;

  // ── 렌더링 ──
  const renderStep = () => {
    switch (activeStep) {
      case 0: // 기본 정보
        return (
          <div className="space-y-5 h-full animate-in fade-in duration-300">
            <div>
              <label className="block text-[11px] font-bold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider mb-2">사고 당시 연령 (만 나이)</label>
              <div className="relative mb-2">
                <input type="number" value={data.ageAtAccident || ''} onChange={e => handleChange('ageAtAccident', Number(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-4 pr-8 text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] focus:ring-2 focus:ring-[#EF6C00] focus:outline-none transition-all" />
                <span className="absolute right-4 top-3.5 text-[13px] text-gray-400">세</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[30, 40, 50, 60].map(v => (
                  <button key={v} onClick={() => handleChange('ageAtAccident', v)} className={`py-1.5 rounded-lg text-[11px] font-bold border transition-all ${data.ageAtAccident === v ? 'bg-[#EF6C00] text-white border-[#EF6C00]' : 'bg-[#f8f9fa] dark:bg-[#2d2d2d] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-[#EF6C00]/50'}`}>{v}세</button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider mb-2">월 평균 소득</label>
              <div className="relative mb-2">
                <input type="text" inputMode="numeric" value={data.income ? fmt(data.income) : ''} onChange={e => handleChange('income', parse(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-4 pr-12 text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] focus:ring-2 focus:ring-[#EF6C00] focus:outline-none transition-all" />
                <span className="absolute right-4 top-3.5 text-[13px] text-gray-400 font-semibold">원</span>
              </div>
              <button onClick={() => handleChange('income', 3284525)} className="w-full py-2 bg-[#FFF3E0] dark:bg-[#EF6C00]/15 text-[#E65100] dark:text-[#FFCC80] text-[12px] font-bold rounded-xl border border-[#FFB74D] hover:bg-[#FFE0B2] dark:hover:bg-[#EF6C00]/25 transition-all">
                📊 시중노임단가 자동 적용 (3,284,525원)
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider mb-2">본인 과실 비율</label>
              <div className="relative mb-2">
                <input type="number" min="0" max="100" value={data.faultRatio === 0 ? '0' : (data.faultRatio || '')} onChange={e => handleChange('faultRatio', Number(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-4 pr-8 text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] focus:ring-2 focus:ring-[#EF6C00] focus:outline-none transition-all" />
                <span className="absolute right-4 top-3.5 text-[13px] text-gray-400">%</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[0, 10, 20, 30].map(v => (
                  <button key={v} onClick={() => handleChange('faultRatio', v)} className={`py-2 rounded-lg text-[12px] font-bold transition-all border ${data.faultRatio === v ? 'bg-[#EF6C00] text-white border-[#EF6C00] shadow-sm' : 'bg-white dark:bg-[#2d2d2d] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-[#EF6C00]/50'}`}>{v}%</button>
                ))}
              </div>
            </div>
          </div>
        );

      case 1: // 피해 유형
        return (
          <div className="space-y-4 h-full animate-in fade-in duration-300">
            <label className="block text-[11px] font-bold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider mb-3">피해 유형 (복수 선택 가능)</label>
            {[
              { key: 'hasInjury',    emoji: '🩹', title: '부상 (상해)',   sub: '휴업손해 및 위자료 발생' },
              { key: 'hasDisability',emoji: '🩼', title: '후유장해',      sub: '일실수입 (미래 상실수익) 발생' },
              { key: 'hasDeath',     emoji: '🕊️', title: '사망',         sub: '생계비 공제 일실수입 및 장례비' },
              { key: 'hasCare',      emoji: '👨‍🦽', title: '개호 (간병)',   sub: '중증장해로 인한 개호비 발생' },
            ].map(item => {
              const isActive = data[item.key as keyof LiabilityData] as boolean;
              return (
                <button
                  key={item.key}
                  onClick={() => handleChange(item.key as keyof LiabilityData, !isActive)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${isActive ? 'border-[#EF6C00] bg-[#FFF3E0] dark:bg-[#EF6C00]/15' : 'border-gray-200 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#2d2d2d] hover:border-gray-300'}`}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <div className="flex-1">
                    <div className={`font-bold text-[14px] ${isActive ? 'text-[#E65100] dark:text-[#FFCC80]' : 'text-[#202124] dark:text-[#e8eaed]'}`}>{item.title}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{item.sub}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isActive ? 'bg-[#EF6C00] border-[#EF6C00]' : 'border-gray-300 dark:border-gray-600'}`}>
                    {isActive && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                  </div>
                </button>
              );
            })}
          </div>
        );

      case 2: // 상세 입력
        return (
          <div className="space-y-6 h-full overflow-y-auto pr-1 animate-in fade-in duration-300" style={{ maxHeight: '420px' }}>
            {data.hasInjury && !data.hasDeath && (
              <div className="bg-white dark:bg-[#2d2d2d] border border-gray-100 dark:border-white/10 rounded-2xl p-4">
                <label className="block text-[11px] font-bold text-[#E65100] dark:text-[#FFCC80] uppercase tracking-wider mb-3">🩹 부상 상세 (휴업손해)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">입원 일수</label>
                    <div className="relative mb-1.5">
                      <input type="number" value={data.hospitalDays === 0 ? '0' : (data.hospitalDays || '')} onChange={e => handleChange('hospitalDays', Number(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#202124] border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-3 pr-8 text-[14px] font-bold focus:ring-2 focus:ring-[#EF6C00] focus:outline-none transition-all" />
                      <span className="absolute right-3 top-3 text-[11px] text-gray-400">일</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">자주 쓰는 값</label>
                    <div className="grid grid-cols-3 gap-1 h-[42px]">
                      {[10, 30, 90].map(v => (
                        <button key={v} onClick={() => handleChange('hospitalDays', v)} className="py-1.5 bg-[#f8f9fa] dark:bg-[#202124] border border-gray-200 dark:border-white/10 rounded-lg text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:bg-[#FFF3E0] hover:text-[#EF6C00] hover:border-[#FFB74D] transition-all">{v}일</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {data.hasDisability && !data.hasDeath && (
              <div className="bg-white dark:bg-[#2d2d2d] border border-gray-100 dark:border-white/10 rounded-2xl p-4">
                <label className="block text-[11px] font-bold text-[#E65100] dark:text-[#FFCC80] uppercase tracking-wider mb-3">🩼 후유장해 상세 (일실수입)</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">노동능력상실률</label>
                    <div className="relative mb-1.5">
                      <input type="number" value={data.disabilityRate === 0 ? '0' : (data.disabilityRate || '')} onChange={e => handleChange('disabilityRate', Number(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#202124] border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-3 pr-8 text-[14px] font-bold focus:ring-2 focus:ring-[#EF6C00] focus:outline-none transition-all" />
                      <span className="absolute right-3 top-3 text-[11px] text-gray-400">%</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">장해 기간 (0=영구)</label>
                    <div className="relative mb-1.5">
                      <input type="number" value={data.disabilityYears === 0 ? '0' : (data.disabilityYears || '')} onChange={e => handleChange('disabilityYears', Number(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#202124] border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-3 pr-8 text-[14px] font-bold focus:ring-2 focus:ring-[#EF6C00] focus:outline-none transition-all" />
                      <span className="absolute right-3 top-3 text-[11px] text-gray-400">년</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {data.hasCare && (
              <div className="bg-white dark:bg-[#2d2d2d] border border-[#FFB74D] dark:border-white/10 rounded-2xl p-4">
                <label className="block text-[11px] font-bold text-[#E65100] dark:text-[#FFCC80] uppercase tracking-wider mb-3">👨‍🦽 개호(간병) 상세</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">일일 필요 개호인</label>
                    <div className="relative mb-1.5">
                      <input type="number" step="0.5" value={data.carePersons === 0 ? '0' : (data.carePersons || '')} onChange={e => handleChange('carePersons', Number(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#202124] border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-3 pr-8 text-[14px] font-bold focus:ring-2 focus:ring-[#EF6C00] focus:outline-none transition-all" />
                      <span className="absolute right-3 top-3 text-[11px] text-gray-400">명</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5">개호 기간 (0=영구)</label>
                    <div className="relative mb-1.5">
                      <input type="number" value={data.careYears === 0 ? '0' : (data.careYears || '')} onChange={e => handleChange('careYears', Number(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#202124] border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-3 pr-8 text-[14px] font-bold focus:ring-2 focus:ring-[#EF6C00] focus:outline-none transition-all" />
                      <span className="absolute right-3 top-3 text-[11px] text-gray-400">년</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {data.hasDeath && (
              <div className="bg-[#FFF3E0] dark:bg-[#EF6C00]/10 border border-[#FFB74D]/50 rounded-2xl p-4 text-center">
                <span className="text-3xl mb-2 block">🕊️</span>
                <p className="text-[13px] font-bold text-[#E65100] dark:text-[#FFCC80] mb-1">사망 사고 산정 기준 자동 적용</p>
                <p className="text-[11px] text-[#F57C00] dark:text-[#FFB74D]">일실수입에서 생계비(1/3)가 자동으로 공제되며,<br/>위자료는 장해율 100% 기준으로 산출됩니다.</p>
              </div>
            )}

            {!data.hasInjury && !data.hasDisability && !data.hasDeath && !data.hasCare && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-4xl mb-3">📋</span>
                <p className="text-[13px] text-gray-500 dark:text-gray-400">피해 유형 탭에서 항목을 먼저 선택해 주세요.</p>
              </div>
            )}
          </div>
        );

      case 3: // 추가 비용
        return (
          <div className="space-y-4 h-full animate-in fade-in duration-300 overflow-y-auto" style={{ maxHeight: '420px' }}>
            {[
              { field: 'pastTreatmentCost' as const, label: '기왕치료비 (실제 지출 병원비)', icon: '🧾' },
              { field: 'futureTreatmentCost' as const, label: '향후치료비 (성형, 흉터, 수술 등)', icon: '💉' },
              { field: 'applianceCost' as const, label: '보조구 비용 (휠체어, 의수족 등)', icon: '🦽' },
            ].map(({ field, label, icon }) => (
              <div key={field}>
                <label className="block text-[11px] font-bold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider mb-1.5">{icon} {label}</label>
                <div className="relative">
                  <input type="text" inputMode="numeric" value={data[field] ? fmt(data[field] as number) : ''} onChange={e => handleChange(field, parse(e.target.value))} placeholder="0" className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border border-gray-200 dark:border-white/10 rounded-xl py-2.5 pl-4 pr-12 text-[14px] font-bold focus:ring-2 focus:ring-[#EF6C00] focus:outline-none transition-all" />
                  <span className="absolute right-4 top-3 text-[12px] text-gray-400 font-semibold">원</span>
                </div>
              </div>
            ))}
            
            {data.hasDeath && (
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-[#E65100] dark:text-[#FFCC80] uppercase tracking-wider mb-1.5">⚰️ 장례비</label>
                <div className="relative">
                  <input type="text" inputMode="numeric" value={data.funeralCost ? fmt(data.funeralCost) : ''} onChange={e => handleChange('funeralCost', parse(e.target.value))} placeholder="5,000,000" className="w-full bg-[#FFF3E0] dark:bg-[#EF6C00]/10 border border-[#FFB74D] rounded-xl py-2.5 pl-4 pr-12 text-[14px] font-bold text-[#E65100] dark:text-[#FFCC80] focus:ring-2 focus:ring-[#EF6C00] focus:outline-none transition-all" />
                  <span className="absolute right-4 top-3 text-[12px] text-[#F57C00] font-semibold">원</span>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {/* ── 2단 그리드 (좌: 입력, 우: 결과) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* 좌측: 탭 기반 스텝 입력 */}
        <div className="lg:col-span-6 flex flex-col">
          {/* 탭 네비 */}
          <div className="flex gap-1.5 mb-4 bg-[#f8f9fa] dark:bg-[#2d2d2d] p-1.5 rounded-2xl border border-gray-200 dark:border-white/8">
            {STEPS.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(idx)}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl text-center transition-all ${
                  activeStep === idx
                    ? 'bg-white dark:bg-[#202124] shadow-sm text-[#E65100] dark:text-[#FFCC80] font-bold border border-gray-200/60 dark:border-[#EF6C00]/50'
                    : 'text-gray-500 dark:text-gray-400 hover:text-[#202124] dark:hover:text-white'
                }`}
              >
                <span className="text-base leading-none mb-0.5">{step.icon}</span>
                <span className="text-[10px] font-semibold leading-tight break-keep">{step.label}</span>
              </button>
            ))}
          </div>

          {/* 탭 콘텐츠 */}
          <div className="flex-1 bg-white dark:bg-[#202124] rounded-2xl border border-gray-200 dark:border-white/10 p-5 shadow-sm min-h-[400px]">
            {renderStep()}
          </div>

          {/* 이전/다음 네비 버튼 */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setActiveStep(s => Math.max(s - 1, 0))}
              disabled={activeStep === 0}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-[13px] font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              ← 이전
            </button>
            <button
              onClick={() => setActiveStep(s => Math.min(s + 1, STEPS.length - 1))}
              disabled={activeStep === STEPS.length - 1}
              className="flex-1 py-2.5 rounded-xl bg-[#EF6C00] text-white text-[13px] font-bold hover:bg-[#E65100] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              다음 →
            </button>
          </div>
        </div>

        {/* 우측: 결과 패널 */}
        <div className="lg:col-span-6 relative">
          <div className="sticky top-[100px] bg-gradient-to-br from-[#EF6C00] to-[#E65100] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-[#EF6C00]/20 flex flex-col h-full min-h-[450px] overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/15 rounded-full blur-3xl pointer-events-none"></div>
            
            <h2 className="text-sm font-bold text-white/90 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
              법원 소송가액 예상 산출
            </h2>

            <div className="flex-1 space-y-3 mb-6">
              <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-md border border-white/5">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[12px] text-white/80 font-medium">정신적 손해 (위자료)</span>
                  <span className="font-bold text-[14px]">{fmt(Math.floor(alimony))}원</span>
                </div>
                <p className="text-[10px] text-white/50">{data.hasDeath ? '사망 장해율 100%' : `장해율 ${data.disabilityRate}%`} 적용 (기준 1억)</p>
              </div>

              {(data.hasInjury && !data.hasDeath) && (
                <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-md border border-white/5">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[12px] text-white/80 font-medium">휴업손해 (입원기간)</span>
                    <span className="font-bold text-[14px]">{fmt(Math.floor(hospitalLoss))}원</span>
                  </div>
                  <p className="text-[10px] text-white/50">입원 {data.hospitalDays}일</p>
                </div>
              )}

              {(data.hasDisability || data.hasDeath) && (
                <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-md border border-white/5">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[12px] text-white/80 font-medium">일실수입 ({data.hasDeath ? '사망' : '후유장해'})</span>
                    <span className="font-bold text-[14px]">{fmt(Math.floor(lostIncome))}원</span>
                  </div>
                  <p className="text-[10px] text-white/50">
                    {isDeathDeduction && '생계비 1/3 공제, '}호프만계수 {H_disability.toFixed(2)} 적용
                  </p>
                </div>
              )}

              <div className="bg-white/10 rounded-2xl p-3 backdrop-blur-md border border-white/5">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[12px] text-white/80 font-medium">적극적 손해</span>
                  <span className="font-bold text-[14px]">{fmt(Math.floor(totalActiveLoss))}원</span>
                </div>
                <p className="text-[10px] text-white/50 flex flex-wrap gap-1 mt-1">
                  {treatment > 0 && <span>치료비 {fmt(Math.floor(treatment))}원</span>}
                  {careCost > 0 && <span>간병비 {fmt(Math.floor(careCost))}원</span>}
                  {finalFuneralCost > 0 && <span>장례비 {fmt(Math.floor(finalFuneralCost))}원</span>}
                </p>
              </div>
            </div>

            <div className="mt-auto bg-white text-[#E65100] rounded-2xl p-5 shadow-lg relative z-10">
              <p className="text-[11px] font-bold text-gray-500 mb-1">예상 총 손해배상액</p>
              <div className="flex items-end justify-between">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  {totalAmount === 0 ? '0' : fmt(Math.floor(totalAmount))}
                </span>
                <span className="text-lg font-bold mb-1">원</span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                <span className="text-[10px] text-gray-500 bg-[#FFF3E0] px-2 py-1 rounded-md border border-[#FFCC80]/50">과실비율 {data.faultRatio}% 반영</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
