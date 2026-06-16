'use client';

import { useState } from 'react';

// ── 데이터 타입 및 초기값 ──
export interface LiabilityData {
  ageAtAccident: number;
  faultRatio: number;
  income: number;
  
  hospitalDays: number;
  disabilityRate: number; // 0~100
  disabilityYears: number; // 0 = 영구
  
  pastTreatmentCost: number;
  futureTreatmentCost: number;

  alimonyBase: number;
}

const initialData: LiabilityData = {
  ageAtAccident: 40,
  faultRatio: 20,
  income: 3284525, // 기본값: 시중노임단가
  
  hospitalDays: 30,
  disabilityRate: 15,
  disabilityYears: 0,
  
  pastTreatmentCost: 0,
  futureTreatmentCost: 5000000,

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

export default function LiabilityCalculator() {
  const [data, setData] = useState<LiabilityData>(initialData);

  const handleChange = (field: keyof LiabilityData, value: number) => {
    let finalValue = Math.max(0, value);
    if (field === 'faultRatio' || field === 'disabilityRate') {
      finalValue = Math.min(100, finalValue);
    }
    setData(prev => ({ ...prev, [field]: finalValue }));
  };

  const addValue = (field: keyof LiabilityData, addAmount: number) => {
    setData(prev => ({ ...prev, [field]: prev[field] + addAmount }));
  };

  const fmt = (val: number | string) => {
    if (!val) return '';
    return Number(val.toString().replace(/,/g, '')).toLocaleString();
  };
  const parse = (val: string) => Math.max(0, Number(val.replace(/[^0-9]/g, '')) || 0);

  // ── 계산 로직 ──
  // 가동연한 65세까지 남은 개월 수
  const maxMonths = Math.max(0, (65 - data.ageAtAccident) * 12);
  // 장해 인정 개월 수
  const targetMonths = data.disabilityYears === 0 ? maxMonths : Math.min(maxMonths, data.disabilityYears * 12);
  const H_disability = getHoffmanForMonths(targetMonths);

  // 1. 위자료 (1억 × 장해율 × [1 - 과실×0.6])
  const alimony = Math.max(0, data.alimonyBase * (data.disabilityRate / 100) * (1 - (data.faultRatio / 100) * 0.6));

  // 2. 휴업손해 (소득 × (입원일수/30) × (1 - 과실))
  const hospitalLoss = Math.max(0, data.income * (data.hospitalDays / 30) * (1 - (data.faultRatio / 100)));

  // 3. 일실수입 (소득 × 장해율 × 호프만계수 × (1 - 과실))
  // ※ 원래 엄밀하게는 입원기간 호프만 공제가 필요하나 편의상 단순 합산
  const lostIncome = Math.max(0, data.income * (data.disabilityRate / 100) * H_disability * (1 - (data.faultRatio / 100)));

  // 4. 치료비 등 적극적 손해
  const treatment = Math.max(0, (data.pastTreatmentCost + data.futureTreatmentCost) * (1 - (data.faultRatio / 100)));

  // 5. 총계
  const totalAmount = alimony + hospitalLoss + lostIncome + treatment;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full max-w-7xl mx-auto">
      {/* ── 좌측: 입력 폼 ── */}
      <div className="lg:col-span-7 flex flex-col space-y-6 bg-white dark:bg-[#202124] rounded-2xl border border-gray-200 dark:border-white/10 p-5 lg:p-7 shadow-sm relative z-10">
        
        {/* 피해자 기본 정보 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider mb-2">사고 당시 연령 (만 나이)</label>
            <div className="relative">
              <input type="number" value={data.ageAtAccident || ''} onChange={e => handleChange('ageAtAccident', Number(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-4 pr-8 text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] focus:ring-2 focus:ring-[#7C4DFF] focus:outline-none transition-all" />
              <span className="absolute right-4 top-3.5 text-[13px] text-gray-400">세</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 ml-1">만 65세 (가동연한) 기준 연산</p>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider mb-2">본인 과실 비율</label>
            <div className="relative">
              <input type="number" min="0" max="100" value={data.faultRatio === 0 ? '0' : (data.faultRatio || '')} onChange={e => handleChange('faultRatio', Number(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-4 pr-8 text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] focus:ring-2 focus:ring-[#7C4DFF] focus:outline-none transition-all" />
              <span className="absolute right-4 top-3.5 text-[13px] text-gray-400">%</span>
            </div>
            <div className="grid grid-cols-4 gap-1 mt-1.5">
              {[0, 10, 20, 30].map(v => (
                <button key={v} onClick={() => handleChange('faultRatio', v)} className={`py-1.5 rounded-lg text-[11px] font-bold transition-all border ${data.faultRatio === v ? 'bg-[#7C4DFF] text-white border-[#7C4DFF]' : 'bg-[#f8f9fa] dark:bg-[#2d2d2d] border-gray-200 dark:border-white/10 text-gray-500 hover:border-[#7C4DFF]/50'}`}>{v}%</button>
              ))}
            </div>
          </div>
        </div>

        <hr className="border-gray-100 dark:border-white/5" />

        {/* 소득 정보 */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <label className="block text-[11px] font-bold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider">월 평균 소득</label>
          </div>
          <div className="relative mb-2">
            <input type="text" inputMode="numeric" value={data.income ? fmt(data.income) : ''} onChange={e => handleChange('income', parse(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-4 pr-12 text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] focus:ring-2 focus:ring-[#7C4DFF] focus:outline-none transition-all" />
            <span className="absolute right-4 top-3.5 text-[13px] text-gray-400 font-semibold">원</span>
          </div>
          <button onClick={() => handleChange('income', 3284525)} className="w-full py-2 bg-[#f3e8ff] dark:bg-[#7C4DFF]/15 text-[#7C4DFF] dark:text-[#ce93d8] text-[12px] font-bold rounded-xl border border-[#7C4DFF]/20 hover:bg-[#e9d5ff] dark:hover:bg-[#7C4DFF]/25 transition-all">
            📊 시중노임단가(도시일용근로자) 자동 적용 (3,284,525원)
          </button>
        </div>

        <hr className="border-gray-100 dark:border-white/5" />

        {/* 장해 및 입원 정보 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider mb-2">노동능력상실률 (장해율)</label>
              <div className="relative">
                <input type="number" value={data.disabilityRate === 0 ? '0' : (data.disabilityRate || '')} onChange={e => handleChange('disabilityRate', Number(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-4 pr-8 text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] focus:ring-2 focus:ring-[#7C4DFF] focus:outline-none transition-all" />
                <span className="absolute right-4 top-3.5 text-[13px] text-gray-400">%</span>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider mb-2">장해 인정 기간 (0=영구)</label>
              <div className="relative">
                <input type="number" value={data.disabilityYears === 0 ? '0' : (data.disabilityYears || '')} onChange={e => handleChange('disabilityYears', Number(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-4 pr-8 text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] focus:ring-2 focus:ring-[#7C4DFF] focus:outline-none transition-all" />
                <span className="absolute right-4 top-3.5 text-[13px] text-gray-400">년</span>
              </div>
              <div className="grid grid-cols-3 gap-1 mt-1.5">
                {[1, 3, 0].map((v, idx) => (
                  <button key={idx} onClick={() => handleChange('disabilityYears', v)} className={`py-1.5 rounded-lg text-[11px] font-bold border transition-all ${data.disabilityYears === v ? 'bg-[#7C4DFF] text-white border-[#7C4DFF]' : 'bg-[#f8f9fa] dark:bg-[#2d2d2d] border-gray-200 dark:border-white/10 text-gray-500 hover:border-[#7C4DFF]/50'}`}>{v === 0 ? '영구장해' : `${v}년 한시`}</button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider mb-2">입원 일수 (휴업손해)</label>
            <div className="relative mb-2">
              <input type="number" value={data.hospitalDays === 0 ? '0' : (data.hospitalDays || '')} onChange={e => handleChange('hospitalDays', Number(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-4 pr-8 text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] focus:ring-2 focus:ring-[#7C4DFF] focus:outline-none transition-all" />
              <span className="absolute right-4 top-3.5 text-[13px] text-gray-400">일</span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {[10, 30, 90].map(v => (
                <button key={v} onClick={() => handleChange('hospitalDays', v)} className="py-1.5 bg-[#f8f9fa] dark:bg-[#2d2d2d] border border-gray-200 dark:border-white/10 rounded-lg text-[11px] font-bold text-gray-500 hover:bg-[#f3e8ff] hover:text-[#7C4DFF] transition-all">{v}일</button>
              ))}
            </div>
          </div>
        </div>

        <hr className="border-gray-100 dark:border-white/5" />

        {/* 적극적 손해 (치료비) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider mb-2">기왕치료비 (이미 쓴 돈)</label>
            <div className="relative">
              <input type="text" inputMode="numeric" value={data.pastTreatmentCost ? fmt(data.pastTreatmentCost) : ''} onChange={e => handleChange('pastTreatmentCost', parse(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-4 pr-8 text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] focus:ring-2 focus:ring-[#7C4DFF] focus:outline-none transition-all" />
              <span className="absolute right-4 top-3.5 text-[13px] text-gray-400 font-semibold">원</span>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#5f6368] dark:text-[#9aa0a6] uppercase tracking-wider mb-2">향후치료비 (수술/성형 등)</label>
            <div className="relative">
              <input type="text" inputMode="numeric" value={data.futureTreatmentCost ? fmt(data.futureTreatmentCost) : ''} onChange={e => handleChange('futureTreatmentCost', parse(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-4 pr-8 text-[15px] font-bold text-[#202124] dark:text-[#e8eaed] focus:ring-2 focus:ring-[#7C4DFF] focus:outline-none transition-all" />
              <span className="absolute right-4 top-3.5 text-[13px] text-gray-400 font-semibold">원</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── 우측: 결과 패널 ── */}
      <div className="lg:col-span-5 relative z-20">
        <div className="sticky top-[100px] bg-gradient-to-br from-[#7C4DFF] to-[#651FFF] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-[#7C4DFF]/20 flex flex-col h-full min-h-[400px] overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <h2 className="text-sm font-bold text-white/80 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            법원 소송가액 예상 산출
          </h2>

          <div className="flex-1 space-y-4 mb-8">
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[13px] text-white/80 font-medium">정신적 손해 (위자료)</span>
                <span className="font-bold text-[15px]">{fmt(Math.floor(alimony))}원</span>
              </div>
              <p className="text-[10px] text-white/60">기준 1억 × {data.disabilityRate}% × 과실상계</p>
            </div>

            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[13px] text-white/80 font-medium">휴업손해 (입원기간)</span>
                <span className="font-bold text-[15px]">{fmt(Math.floor(hospitalLoss))}원</span>
              </div>
              <p className="text-[10px] text-white/60">소득 × {data.hospitalDays}일치 × 과실상계</p>
            </div>

            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[13px] text-white/80 font-medium">일실수입 (후유장해)</span>
                <span className="font-bold text-[15px]">{fmt(Math.floor(lostIncome))}원</span>
              </div>
              <p className="text-[10px] text-white/60">소득 × {data.disabilityRate}% × 호프만계수({H_disability.toFixed(2)}) × 과실상계</p>
            </div>

            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[13px] text-white/80 font-medium">적극적 손해 (치료비)</span>
                <span className="font-bold text-[15px]">{fmt(Math.floor(treatment))}원</span>
              </div>
              <p className="text-[10px] text-white/60">기왕/향후치료비 합계 × 과실상계</p>
            </div>
          </div>

          <div className="mt-auto bg-white text-[#7C4DFF] rounded-2xl p-5 shadow-lg relative z-10">
            <p className="text-[12px] font-bold text-gray-500 mb-1">예상 총 손해배상액</p>
            <div className="flex items-end justify-between">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {totalAmount === 0 ? '0' : fmt(Math.floor(totalAmount))}
              </span>
              <span className="text-lg font-bold mb-1">원</span>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 flex gap-2">
              <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-md">과실비율 {data.faultRatio}%</span>
              <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-md">호프만계수 {H_disability.toFixed(2)} 적용</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
