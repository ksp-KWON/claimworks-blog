'use client';

import { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

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

  // ── 계산 로직 ──
  const maxMonths = Math.max(0, (65 - data.ageAtAccident) * 12);
  
  // 1. 위자료
  let effectiveDisabilityRate = 0;
  if (data.hasDeath) effectiveDisabilityRate = 100;
  else if (data.hasDisability) effectiveDisabilityRate = data.disabilityRate;

  const alimony = Math.max(0, data.alimonyBase * (effectiveDisabilityRate / 100) * (1 - (data.faultRatio / 100) * 0.6));

  // 2. 일실수입
  let lostIncome = 0;
  let H_disability = 0;
  let isDeathDeduction = false;

  if (data.hasDeath) {
    H_disability = getHoffmanForMonths(maxMonths);
    lostIncome = data.income * (2 / 3) * H_disability * (1 - (data.faultRatio / 100));
    isDeathDeduction = true;
  } else if (data.hasDisability) {
    const targetMonths = data.disabilityYears === 0 ? maxMonths : Math.min(maxMonths, data.disabilityYears * 12);
    H_disability = getHoffmanForMonths(targetMonths);
    lostIncome = data.income * (data.disabilityRate / 100) * H_disability * (1 - (data.faultRatio / 100));
  }

  // 3. 휴업손해
  let hospitalLoss = 0;
  if (data.hasInjury && !data.hasDeath) {
    hospitalLoss = data.income * (data.hospitalDays / 30) * (1 - (data.faultRatio / 100));
  }

  // 4. 적극적 손해
  let careCost = 0;
  if (data.hasCare) {
    const careMonths = data.careYears === 0 ? maxMonths : Math.min(maxMonths, data.careYears * 12);
    const H_care = getHoffmanForMonths(careMonths);
    // 보통인부 시중노임단가 공사부문 3,441,360원 기준 일할 (÷22일 = 156,425원)
    const dailyWage = 156425; 
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

  // ── 공유 및 PDF 다운로드 기능 ──
  const exportPDF = async () => {
    if (!resultRef.current) return;
    try {
      const originalBg = resultRef.current.style.backgroundColor;
      resultRef.current.style.backgroundColor = '#ffffff';
      
      const imgData = await toPng(resultRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
      resultRef.current.style.backgroundColor = originalBg;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (resultRef.current.offsetHeight * pdfWidth) / resultRef.current.offsetWidth;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('보상스쿨_배상책임_소송가액명세서.pdf');
    } catch (e: unknown) {
      console.error(e);
      const errorMsg = e instanceof Error ? e.message : String(e);
      alert(`PDF 생성 중 오류가 발생했습니다: ${errorMsg}`);
    }
  };

  const shareResult = () => {
    const text = `보상스쿨 배상책임 소송가액 계산결과\n▶ 예상 총 손해배상액: ${Math.floor(totalAmount).toLocaleString()}원\n\n자세한 내역은 보상스쿨에서 확인해보세요!`;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).Kakao && (window as any).Kakao.isInitialized()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: '보상스쿨 배상책임 소송가액 결과',
          description: `예상 손해배상액: ${Math.floor(totalAmount).toLocaleString()}원\n자세한 산출 명세서를 확인해 보세요!`,
          imageUrl: 'https://claim-works.com/og-image.png',
          link: {
            mobileWebUrl: window.location.href,
            webUrl: window.location.href,
          },
        },
        buttons: [
          {
            title: '계산 결과 보기',
            link: {
              mobileWebUrl: window.location.href,
              webUrl: window.location.href,
            },
          },
        ],
      });
    } else if (navigator.share) {
      navigator.share({
        title: '보상스쿨 소송가액 산출 명세서',
        text: text,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text + '\n' + window.location.href);
      alert('결과가 클립보드에 복사되었습니다. 카카오톡이나 메시지 앱에 붙여넣기 해보세요.');
    }
  };

  // ── 렌더링 ──
  const renderStep = () => {
    switch (activeStep) {
      case 0:
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
              <button onClick={() => handleChange('income', 3441360)} className="w-full py-2 bg-[#FFF3E0] dark:bg-[#EF6C00]/15 text-[#E65100] dark:text-[#FFCC80] text-[12px] font-bold rounded-xl border border-[#FFB74D] hover:bg-[#FFE0B2] dark:hover:bg-[#EF6C00]/25 transition-all">
                📊 보통인부 시중노임단가(공사부문) 자동 적용 (3,441,360원)
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

      case 1:
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

      case 2:
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

      case 3:
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 좌측: 탭 기반 스텝 입력 */}
        <div className="lg:col-span-6 flex flex-col">
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

          <div className="flex-1 bg-white dark:bg-[#202124] rounded-2xl border border-gray-200 dark:border-white/10 p-5 shadow-sm min-h-[400px]">
            {renderStep()}
          </div>

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

        {/* 우측: 결과 명세서 및 버튼 */}
        <div className="lg:col-span-6">
          <div ref={resultRef} className="bg-[#FFF8F0] dark:bg-[#2d2d2d] rounded-3xl p-6 sm:p-8 border border-[#FFE0B2] dark:border-[#EF6C00]/20 shadow-sm sticky top-[100px]">
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-[#EF6C00] rounded-full inline-block shrink-0" />
              법원 소송가액 산출 명세서
            </h3>

            <div className="space-y-4 text-xs sm:text-sm mb-6">
              {alimony > 0 && (
                <div className="flex justify-between items-center pb-2 border-b border-dashed border-[#FFE0B2] dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">정신적 손해 (위자료)</span>
                  <div className="text-right">
                    <span className="font-bold text-gray-900 dark:text-white">{fmt(Math.floor(alimony))} 원</span>
                    <p className="text-[10px] text-gray-400 mt-1">{data.hasDeath ? '사망 장해율 100%' : `장해율 ${data.disabilityRate}%`} (기준 1억)</p>
                  </div>
                </div>
              )}

              {(data.hasInjury && !data.hasDeath) && (
                <div className="flex justify-between items-center pb-2 border-b border-dashed border-[#FFE0B2] dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">휴업손해 (입원 {data.hospitalDays}일)</span>
                  <span className="font-bold text-gray-900 dark:text-white">{fmt(Math.floor(hospitalLoss))} 원</span>
                </div>
              )}

              {(data.hasDisability || data.hasDeath) && (
                <div className="flex justify-between items-center pb-2 border-b border-dashed border-[#FFE0B2] dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">일실수입 ({data.hasDeath ? '사망' : `후유장해 ${data.disabilityRate}%`})</span>
                  <div className="text-right">
                    <span className="font-bold text-gray-900 dark:text-white">{fmt(Math.floor(lostIncome))} 원</span>
                    <p className="text-[10px] text-gray-400 mt-1">호프만계수 {H_disability.toFixed(2)} 적용</p>
                  </div>
                </div>
              )}

              {totalActiveLoss > 0 && (
                <div className="flex justify-between items-center pb-2 border-b border-dashed border-[#FFE0B2] dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">적극적 손해 (치료비, 개호비 등)</span>
                  <span className="font-bold text-gray-900 dark:text-white">{fmt(Math.floor(totalActiveLoss))} 원</span>
                </div>
              )}
              
              {data.faultRatio > 0 && (
                <div className="flex justify-between items-center pt-2 text-[#E65100] font-bold">
                  <span>전체 과실 상계 ({data.faultRatio}%)</span>
                  <span>적용 완료</span>
                </div>
              )}
            </div>

            {/* 최종 합의금 카드: 오렌지색 그라데이션 적용 */}
            <div className="bg-gradient-to-br from-[#EF6C00] to-[#E65100] dark:from-[#E65100] dark:to-[#EF6C00] rounded-2xl p-6 text-white text-center shadow-md relative overflow-hidden transition-all duration-300 hover:shadow-lg">
              <div className="absolute top-0 right-0 opacity-10 transform translate-x-8 -translate-y-8">
                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
              </div>
              <div className="relative z-10">
                <h4 className="text-white/80 font-bold text-xs uppercase tracking-wider mb-1">예상 총 손해배상액</h4>
                <div className="text-3xl sm:text-4xl font-black tracking-tight flex items-center justify-center gap-1">
                  {totalAmount === 0 ? '0' : fmt(Math.floor(totalAmount))}
                  <span className="text-lg font-bold text-white/90">원</span>
                </div>
              </div>
            </div>

            <div className="mt-5 text-[11px] leading-relaxed text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-black/10 p-3.5 rounded-xl border border-[#FFE0B2] dark:border-transparent">
              <span className="font-bold text-[#E65100] inline-block mr-1">⚠️ 참고:</span> 위 결과는 법원 판례 기준(호프만계수)을 단순 적용한 수치입니다. 실제 소송 시 피해자의 구체적 직업, 과실 비율, 개호비 등 수많은 변수에 따라 수백~수천만 원 차이가 발생할 수 있으므로 보상 전문가와의 상담을 적극 권장합니다.
            </div>

            {/* 버튼들 */}
            <div className="mt-5 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={shareResult}
                  className="flex items-center justify-center gap-1.5 py-3 bg-[#FEE500] hover:bg-[#F4DC00] active:scale-[0.98] text-black rounded-xl font-extrabold text-xs sm:text-sm transition-all shadow-sm"
                >
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3C6.477 3 2 6.541 2 10.908c0 2.502 1.432 4.745 3.659 6.13-.314 1.157-1.14 4.183-1.182 4.341-.053.197.075.18.156.126.104-.07 3.324-2.222 4.606-3.084.887.24 1.821.366 2.761.366 5.523 0 10-3.541 10-7.908C22 6.541 17.523 3 12 3z"/></svg>
                  결과 공유하기
                </button>
                <button 
                  onClick={exportPDF}
                  className="flex items-center justify-center gap-1.5 py-3 bg-white hover:bg-gray-50 active:scale-[0.98] border border-gray-200 text-gray-700 rounded-xl font-extrabold text-xs sm:text-sm transition-all shadow-sm dark:bg-[#202124] dark:border-gray-700 dark:text-gray-300 dark:hover:bg-[#303134]"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  PDF 다운로드
                </button>
              </div>
              
              <a 
                href="https://open.kakao.com/o/sWeszp7" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block text-center w-full py-3.5 bg-gray-900 hover:bg-gray-800 active:scale-[0.99] text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-50 rounded-xl font-extrabold text-sm transition-all shadow-md"
              >
                보상스쿨 1:1 무료 상담 신청하기
              </a>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
