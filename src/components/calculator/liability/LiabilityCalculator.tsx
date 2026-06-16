'use client';

import { useState, useRef } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

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
  alimonyBase: 100000000, // 1억
};

function getHoffmanForMonths(months: number) {
  let sum = 0;
  for (let i = 1; i <= months; i++) sum += 1 / (1 + (0.05 / 12) * i);
  return Math.min(sum, 240);
}

export default function LiabilityCalculator() {
  const [data, setData] = useState<LiabilityData>(initialData);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleChange = (field: keyof LiabilityData, value: number | boolean) => {
    let finalValue = value;
    if (typeof value === 'number') {
      if (field === 'faultRatio' || field === 'disabilityRate') finalValue = Math.min(100, Math.max(0, value));
      else finalValue = Math.max(0, value);
    }
    setData(prev => ({ ...prev, [field]: finalValue }));
  };

  const fmt = (val: number | string) => {
    if (!val) return '';
    return Number(val.toString().replace(/,/g, '')).toLocaleString();
  };
  const parse = (val: string) => Math.max(0, Number(val.replace(/[^0-9]/g, '')) || 0);

  // ── 계산 로직 ──
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
    if (alimony > 0) formulas.push(`위자료: 기준액(${fmt(Math.floor(data.alimonyBase))}원) × 장해율(${effectiveDisabilityRate}%) × [1 - (과실비율 ${data.faultRatio}% × 0.6)]`);
    if (lostIncome > 0) {
      if (data.hasDeath) formulas.push(`사망 일실수입: (소득 × 2/3) × H계수(${H_disability.toFixed(4)}) × (1 - 과실비율 ${data.faultRatio}%)`);
      else formulas.push(`장해 일실수입: 소득 × 장해율(${data.disabilityRate}%) × H계수(${H_disability.toFixed(4)}) × (1 - 과실비율 ${data.faultRatio}%)`);
    }
    if (hospitalLoss > 0) formulas.push(`휴업손해: (소득 ÷ 30일) × 입원일수(${data.hospitalDays}일) × (1 - 과실비율 ${data.faultRatio}%)`);
    if (careCost > 0) formulas.push(`개호비: 일용단가(${fmt(156425)}원) × 30일 × 필요인원(${data.carePersons}명) × H계수(${H_care.toFixed(4)}) × (1 - 과실비율 ${data.faultRatio}%)`);
    if (finalFuneralCost > 0) formulas.push(`장례비: 장례비용(${fmt(data.funeralCost)}원) × (1 - 과실비율 ${data.faultRatio}%)`);
    if (treatment > 0) formulas.push(`치료비 등: 추가비용 합계 × (1 - 과실비율 ${data.faultRatio}%)`);

    return { alimony, effectiveDisabilityRate, lostIncome, H_disability, hospitalLoss, careCost, totalActiveLoss, treatment, finalFuneralCost, totalAmount, formulas };
  };

  const result = calculateResult();

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
      alert(`PDF 생성 중 오류가 발생했습니다: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const shareResult = () => {
    const text = `보상스쿨 배상책임 소송가액 결과\n▶ 예상 손해배상액: ${Math.floor(result.totalAmount).toLocaleString()}원\n\n자세한 내역은 보상스쿨에서 확인해보세요!`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).Kakao && (window as any).Kakao.isInitialized()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).Kakao.Share.sendDefault({
        objectType: 'feed',
        content: { title: '보상스쿨 배상책임 결과', description: `예상 손해배상액: ${Math.floor(result.totalAmount).toLocaleString()}원`, imageUrl: 'https://claim-works.com/og-image.png', link: { mobileWebUrl: window.location.href, webUrl: window.location.href } },
        buttons: [{ title: '결과 보기', link: { mobileWebUrl: window.location.href, webUrl: window.location.href } }],
      });
    } else if (navigator.share) {
      navigator.share({ title: '보상스쿨 배상책임 결과', text: text, url: window.location.href }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text + '\n' + window.location.href);
      alert('결과가 클립보드에 복사되었습니다.');
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        
        {/* ── 좌측: 입력 폼 (5열) ── */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* 피해 유형 선택 */}
          <div className="bg-white dark:bg-[#202124] rounded-3xl p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-white/5 transition-all">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-[#f8f9fa] dark:bg-[#2d2d2d] flex items-center justify-center text-lg">📋</div>
              <h3 className="text-sm font-extrabold text-[#202124] dark:text-[#e8eaed]">발생한 피해 유형 선택</h3>
            </div>
            <div className="space-y-3">
              {[
                { key: 'hasInjury', emoji: '🩹', title: '부상 (상해)', sub: '휴업손해 및 위자료', activeClass: 'border-[#d93025] bg-[#fce8e6] dark:bg-[#d93025]/15', textActive: 'text-[#c5221f] dark:text-[#f28b82]' },
                { key: 'hasDisability', emoji: '🩼', title: '후유장해', sub: '미래 일실수입 (상실수익)', activeClass: 'border-[#d93025] bg-[#fce8e6] dark:bg-[#d93025]/15', textActive: 'text-[#c5221f] dark:text-[#f28b82]' },
                { key: 'hasDeath', emoji: '🕊️', title: '사망', sub: '생계비 공제 일실수입 및 장례비', activeClass: 'border-[#d93025] bg-[#fce8e6] dark:bg-[#d93025]/15', textActive: 'text-[#c5221f] dark:text-[#f28b82]' },
                { key: 'hasCare', emoji: '👨‍🦽', title: '개호 (간병)', sub: '중증장해로 인한 개호비', activeClass: 'border-[#d93025] bg-[#fce8e6] dark:bg-[#d93025]/15', textActive: 'text-[#c5221f] dark:text-[#f28b82]' },
              ].map(item => {
                const isActive = data[item.key as keyof LiabilityData] as boolean;
                return (
                  <button key={item.key} onClick={() => handleChange(item.key as keyof LiabilityData, !isActive)} className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${isActive ? item.activeClass : 'border-transparent bg-[#f8f9fa] dark:bg-[#2d2d2d] hover:bg-gray-50'}`}>
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="flex-1">
                      <div className={`font-black text-[14px] ${isActive ? item.textActive : 'text-[#202124] dark:text-[#e8eaed]'}`}>{item.title}</div>
                      <div className="text-[11px] text-gray-400 font-semibold">{item.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 기본 정보 */}
          <div className="bg-white dark:bg-[#202124] rounded-3xl p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-white/5 transition-all">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-[#f8f9fa] dark:bg-[#2d2d2d] flex items-center justify-center text-lg">👤</div>
              <h3 className="text-sm font-extrabold text-[#202124] dark:text-[#e8eaed]">기본 정보</h3>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">사고 당시 연령 (만 나이)</label>
                <div className="relative mb-2">
                  <input type="number" value={data.ageAtAccident || ''} onChange={e => handleChange('ageAtAccident', Number(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border-transparent rounded-xl py-3 pl-4 pr-12 text-[15px] font-black focus:ring-2 focus:ring-[#d93025] focus:outline-none transition-all" />
                  <span className="absolute right-4 top-3.5 text-[13px] text-gray-400 font-bold">세</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">월 평균 소득</label>
                <div className="relative mb-2">
                  <input type="text" inputMode="numeric" value={data.income ? fmt(data.income) : ''} onChange={e => handleChange('income', parse(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border-transparent rounded-xl py-3 pl-4 pr-12 text-[15px] font-black focus:ring-2 focus:ring-[#d93025] focus:outline-none transition-all" />
                  <span className="absolute right-4 top-3.5 text-[13px] text-gray-400 font-bold">원</span>
                </div>
                <button onClick={() => handleChange('income', 3441360)} className="w-full py-2 bg-[#fce8e6] dark:bg-[#d93025]/15 text-[#c5221f] dark:text-[#f28b82] text-[12px] font-bold rounded-xl hover:bg-[#fad2cf] transition-all">📊 보통인부 시중노임단가 자동 적용 (3,441,360원)</button>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">본인 과실 비율</label>
                <div className="relative mb-2">
                  <input type="number" min="0" max="100" value={data.faultRatio === 0 ? '0' : (data.faultRatio || '')} onChange={e => handleChange('faultRatio', Number(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border-transparent rounded-xl py-3 pl-4 pr-12 text-[15px] font-black focus:ring-2 focus:ring-[#d93025] focus:outline-none transition-all" />
                  <span className="absolute right-4 top-3.5 text-[13px] text-gray-400 font-bold">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 피해 상세 입력 (선택한 피해만 노출) */}
          {(data.hasInjury || data.hasDisability || data.hasDeath || data.hasCare) && (
            <div className="bg-white dark:bg-[#202124] rounded-3xl p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-white/5 transition-all animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-full bg-[#f8f9fa] dark:bg-[#2d2d2d] flex items-center justify-center text-lg">🔍</div>
                <h3 className="text-sm font-extrabold text-[#202124] dark:text-[#e8eaed]">상세 입력 내역</h3>
              </div>
              
              <div className="space-y-6">
                {data.hasInjury && !data.hasDeath && (
                  <div className="space-y-4 pb-4 border-b border-gray-100 dark:border-white/10 last:border-0">
                    <h4 className="text-[12px] font-black text-[#c5221f] flex items-center gap-1.5"><span className="text-lg">🩹</span> 부상 치료 상세</h4>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">입원 일수</label>
                      <input type="number" value={data.hospitalDays === 0 ? '0' : (data.hospitalDays || '')} onChange={e => handleChange('hospitalDays', Number(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border-transparent rounded-xl py-2.5 px-3 text-[14px] font-bold focus:ring-2 focus:ring-[#d93025]" />
                    </div>
                  </div>
                )}
                
                {data.hasDisability && !data.hasDeath && (
                  <div className="space-y-4 pb-4 border-b border-gray-100 dark:border-white/10 last:border-0">
                    <h4 className="text-[12px] font-black text-[#c5221f] flex items-center gap-1.5"><span className="text-lg">🩼</span> 후유장해 상세</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1">노동능력상실률 (%)</label>
                        <input type="number" value={data.disabilityRate === 0 ? '0' : (data.disabilityRate || '')} onChange={e => handleChange('disabilityRate', Number(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border-transparent rounded-xl py-2.5 px-3 text-[14px] font-bold focus:ring-2 focus:ring-[#d93025]" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1">장해 기간 (0=영구)</label>
                        <input type="number" value={data.disabilityYears === 0 ? '0' : (data.disabilityYears || '')} onChange={e => handleChange('disabilityYears', Number(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border-transparent rounded-xl py-2.5 px-3 text-[14px] font-bold focus:ring-2 focus:ring-[#d93025]" />
                      </div>
                    </div>
                  </div>
                )}

                {data.hasCare && (
                  <div className="space-y-4 pb-4 border-b border-gray-100 dark:border-white/10 last:border-0">
                    <h4 className="text-[12px] font-black text-[#c5221f] flex items-center gap-1.5"><span className="text-lg">👨‍🦽</span> 개호(간병) 상세</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1">일일 필요 개호인 (명)</label>
                        <input type="number" step="0.5" value={data.carePersons === 0 ? '0' : (data.carePersons || '')} onChange={e => handleChange('carePersons', Number(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border-transparent rounded-xl py-2.5 px-3 text-[14px] font-bold focus:ring-2 focus:ring-[#d93025]" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 mb-1">개호 기간 (0=영구)</label>
                        <input type="number" value={data.careYears === 0 ? '0' : (data.careYears || '')} onChange={e => handleChange('careYears', Number(e.target.value))} className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border-transparent rounded-xl py-2.5 px-3 text-[14px] font-bold focus:ring-2 focus:ring-[#d93025]" />
                      </div>
                    </div>
                  </div>
                )}

                {data.hasDeath && (
                  <div className="bg-[#fce8e6] dark:bg-[#d93025]/10 border border-[#f28b82]/50 rounded-xl p-4 text-center">
                    <span className="text-2xl mb-1 block">🕊️</span>
                    <p className="text-[12px] font-bold text-[#c5221f] dark:text-[#f28b82]">사망 사고 산정 기준 자동 적용</p>
                    <p className="text-[11px] text-[#ea4335] dark:text-[#f28b82] mt-1">일실수입에서 생계비(1/3) 공제 / 위자료 장해율 100% 적용</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 추가 비용 */}
          <div className="bg-white dark:bg-[#202124] rounded-3xl p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-white/5 transition-all">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-[#f8f9fa] dark:bg-[#2d2d2d] flex items-center justify-center text-lg">💊</div>
              <h3 className="text-sm font-extrabold text-[#202124] dark:text-[#e8eaed]">기타 추가 비용</h3>
            </div>
            <div className="space-y-4">
              {[
                { field: 'pastTreatmentCost' as const, label: '기왕치료비 (실제 지출 병원비)' },
                { field: 'futureTreatmentCost' as const, label: '향후치료비 (성형, 흉터, 수술 등)' },
                { field: 'applianceCost' as const, label: '보조구 비용 (휠체어, 의수족 등)' },
              ].map(({ field, label }) => (
                <div key={field}>
                  <label className="block text-xs font-bold text-gray-500 mb-2">{label}</label>
                  <div className="relative">
                    <input type="text" inputMode="numeric" value={data[field] ? fmt(data[field] as number) : ''} onChange={e => handleChange(field, parse(e.target.value))} placeholder="0" className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border-transparent rounded-xl py-3 pl-4 pr-12 text-[15px] font-black focus:ring-2 focus:ring-[#d93025] focus:outline-none transition-all" />
                    <span className="absolute right-4 top-3.5 text-[13px] text-gray-400 font-bold">원</span>
                  </div>
                </div>
              ))}
              {data.hasDeath && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-[#c5221f] mb-2">장례비</label>
                  <div className="relative">
                    <input type="text" inputMode="numeric" value={data.funeralCost ? fmt(data.funeralCost) : ''} onChange={e => handleChange('funeralCost', parse(e.target.value))} className="w-full bg-[#fce8e6] dark:bg-[#d93025]/10 border-transparent rounded-xl py-3 pl-4 pr-12 text-[15px] font-black text-[#c5221f] focus:ring-2 focus:ring-[#d93025] focus:outline-none transition-all" />
                    <span className="absolute right-4 top-3.5 text-[13px] text-[#ea4335] font-bold">원</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 우측: 세련된 결과 명세서 패널 (7열, 스티키 고정) ── */}
        <div className="lg:col-span-7 lg:sticky lg:top-[100px] flex flex-col gap-5">
          <div className="bg-[#f8f9fa] dark:bg-[#2d2d2d] rounded-3xl px-6 py-5 border border-gray-100 dark:border-white/5 flex items-center gap-3">
            <span className="text-2xl">📑</span>
            <div>
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white">법원 소송가액 명세서</h2>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">입력하신 정보를 바탕으로 산출된 예상 손해배상액입니다.</p>
            </div>
          </div>

          <div ref={resultRef} className="flex flex-col gap-5">
            {/* 최종 합의금 카드: 빨간색 그라데이션 적용 */}
            <div className="bg-gradient-to-br from-[#e84135] to-[#c5221f] dark:from-[#c5221f] dark:to-[#e84135] rounded-3xl p-8 sm:p-10 text-white shadow-xl shadow-[#d93025]/20 relative overflow-hidden transition-all duration-300 hover:scale-[1.01]">
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-xl pointer-events-none transform -translate-x-10 translate-y-10"></div>
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-black/15 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-bold text-white/90 uppercase tracking-widest mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-300 animate-pulse"></span>
                    예상 총 손해배상액 (과실 상계 후)
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                    <div className="text-5xl sm:text-6xl font-black tracking-tight drop-shadow-sm">
                      {Math.floor(result.totalAmount).toLocaleString()}
                    </div>
                    <div className="text-2xl font-bold text-white/90 mb-1.5">원</div>
                  </div>
                </div>
                
                <div className="mt-8 pt-5 border-t border-white/20 flex flex-wrap gap-4 text-[13px] font-semibold text-white/90">
                  <div className="flex items-center gap-1.5"><span className="text-white/60">피해 유형:</span><span>{[data.hasInjury && '부상', data.hasDisability && '장해', data.hasDeath && '사망', data.hasCare && '개호'].filter(Boolean).join(', ') || '미입력'}</span></div>
                  <div className="flex items-center gap-1.5"><span className="text-white/60">월 소득:</span><span>{data.income.toLocaleString()}원</span></div>
                  <div className="flex items-center gap-1.5"><span className="text-white/60">본인 과실:</span><span className="bg-white/20 px-2 py-0.5 rounded text-white">{data.faultRatio}%</span></div>
                </div>
              </div>
            </div>

            {/* 세부 보상 내역 */}
            <div className="bg-white dark:bg-[#202124] rounded-3xl border border-gray-200 dark:border-white/10 p-7 shadow-sm">
              <h3 className="text-[13px] font-extrabold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2 mb-5">
                <span className="w-1 h-4 bg-[#d93025] rounded-full"></span> 세부 보상 내역
              </h3>
              
              <div className="space-y-4 text-[13px] font-medium text-gray-600 dark:text-gray-400">
                {result.alimony > 0 && (
                  <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-white/5">
                    <span>정신적 손해 (위자료) <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded ml-1">{result.effectiveDisabilityRate}%</span></span>
                    <span className="font-bold text-[#202124] dark:text-[#e8eaed]">{Math.floor(result.alimony).toLocaleString()} 원</span>
                  </div>
                )}
                
                {(data.hasInjury && !data.hasDeath) && (
                  <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-white/5">
                    <span>휴업손해 (입원 {data.hospitalDays}일)</span>
                    <span className="font-bold text-[#202124] dark:text-[#e8eaed]">{Math.floor(result.hospitalLoss).toLocaleString()} 원</span>
                  </div>
                )}

                {(data.hasDisability || data.hasDeath) && (
                  <div className="flex justify-between items-center py-2.5 border-b border-gray-100 dark:border-white/5">
                    <span>일실수입 ({data.hasDeath ? '사망' : `장해 ${data.disabilityRate}%`}) <span className="text-[10px] text-gray-400">H계수 {result.H_disability.toFixed(2)}</span></span>
                    <span className="font-bold text-[#202124] dark:text-[#e8eaed]">{Math.floor(result.lostIncome).toLocaleString()} 원</span>
                  </div>
                )}

                {result.totalActiveLoss > 0 && (
                  <div className="flex flex-col gap-2 py-2.5 border-b border-gray-100 dark:border-white/5">
                    <div className="flex justify-between items-center">
                      <span>적극적 손해 (치료비, 개호비 등)</span>
                      <span className="font-bold text-[#202124] dark:text-[#e8eaed]">{Math.floor(result.totalActiveLoss).toLocaleString()} 원</span>
                    </div>
                  </div>
                )}
                
                {data.faultRatio > 0 && (
                  <div className="flex justify-between items-center pt-2 text-[#c5221f] font-bold">
                    <span>전체 과실 상계 ({data.faultRatio}%)</span>
                    <span>적용 완료</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-white/5 mt-1">
                  <span className="text-[15px] font-extrabold text-[#d93025]">최종 예상 배상액</span>
                  <span className="text-[18px] font-black text-[#d93025]">{Math.floor(result.totalAmount).toLocaleString()} 원</span>
                </div>
              </div>

              {/* 산출 계산식 */}
              {result.formulas.length > 0 && (
                <div className="mt-6 bg-[#f8f9fa] dark:bg-[#2d2d2d] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                  <h4 className="text-[12px] font-extrabold text-[#d93025] mb-2 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                    적용된 산출 계산식
                  </h4>
                  <ul className="list-disc list-inside text-[11px] text-gray-500 dark:text-gray-400 space-y-1.5 leading-relaxed break-keep">
                    {result.formulas.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#fce8e6]/80 dark:bg-[#d93025]/10 rounded-2xl p-4 border border-[#f28b82]/50 flex gap-3 text-[12px] leading-relaxed text-[#c5221f] dark:text-[#f28b82] font-semibold shadow-sm">
            <span className="shrink-0 text-base mt-0.5">⚠️</span>
            <p>위 결과는 <strong>법원 소송 판례(호프만계수) 기준</strong> 단순 적용 수치입니다. 실제 소송 시 피해자의 구체적 직업, 과실 비율, 개호 등에 따라 크게 달라질 수 있으므로 보상 전문가와의 상담을 적극 권장합니다.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button onClick={shareResult} className="flex items-center justify-center gap-1.5 py-3.5 bg-[#FEE500] hover:bg-[#F4DC00] text-black rounded-xl font-extrabold text-[13px] transition-all shadow-sm">결과 공유하기</button>
            <button onClick={exportPDF} className="flex items-center justify-center gap-1.5 py-3.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 dark:bg-[#202124] dark:border-gray-700 dark:text-gray-300 dark:hover:bg-[#303134] rounded-xl font-extrabold text-[13px] transition-all shadow-sm">PDF 다운로드</button>
          </div>
          
          <a href="https://open.kakao.com/o/sWeszp7" target="_blank" rel="noopener noreferrer" className="block text-center w-full py-4 bg-gray-900 hover:bg-black text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 rounded-2xl font-extrabold text-[14px] transition-all shadow-md">
            보상스쿨 1:1 무료 상담 신청하기
          </a>

        </div>
      </div>
    </div>
  );
}
