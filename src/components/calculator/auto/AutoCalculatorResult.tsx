'use client';

import { AutoInsuranceData, INJURY_ALIMONY_TABLE } from './calculator-types';
import { useRef } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

interface Props {
  data: AutoInsuranceData;
}

export default function AutoCalculatorResult({ data }: Props) {
  const resultRef = useRef<HTMLDivElement>(null);

  // 간단한 약관/호프만계수 시연용 계산 로직 (실제 실무 로직은 매우 복잡하므로 시연용 추정치만 산출)
  
  const formulas: string[] = [];

  // 호프만 계수 산출 함수 (월 5/12% 단리 할인 방식 누적합, 판례 한도 240)
  const getHoffmanCoefficient = (months: number) => {
    let sum = 0;
    for (let i = 1; i <= months; i++) {
      sum += 1 / (1 + 0.05 * (i / 12));
    }
    return Math.min(sum, 240);
  };

  // 1. 위자료 (부상, 장해, 사망 중 가장 큰 금액 적용이 원칙)
  const deathAlimony = data.hasDeath ? (data.ageAtAccident >= 65 ? 50000000 : 80000000) : 0;
  const disabilityAlimony = data.hasDisability ? 80000000 * (data.disabilityRate / 100) * 0.7 : 0; // 대략적 산식
  
  // 병급 적용된 상해 급수 계산
  const appliedInjuryGrade = (data.hasMultipleInjuries && data.injuryGrade >= 2 && data.injuryGrade <= 11) ? Math.max(1, data.injuryGrade - 1) : data.injuryGrade;
  const injuryAlimony = data.hasInjury ? (INJURY_ALIMONY_TABLE[appliedInjuryGrade] || 150000) : 0;

  // 세 가지 위자료 중 최대값 하나만 적용
  const alimony = Math.max(deathAlimony, disabilityAlimony, injuryAlimony, 0);

  // 어떤 위자료가 적용되었는지 판별 (명세서 표시용)
  let appliedAlimonyLabel = "위자료 (미해당)";
  if (alimony > 0) {
    if (alimony === deathAlimony && data.hasDeath) {
      appliedAlimonyLabel = "사망 위자료";
      formulas.push(`사망 위자료: ${data.ageAtAccident >= 65 ? '65세 이상(5,000만 원)' : '65세 미만(8,000만 원)'}`);
    } else if (alimony === disabilityAlimony && data.hasDisability) {
      appliedAlimonyLabel = `후유장해 위자료 (${data.disabilityRate}%)`;
      formulas.push(`후유장해 위자료: 장해율에 따른 기준액 산출`);
    } else if (alimony === injuryAlimony && data.hasInjury) {
      appliedAlimonyLabel = `부상 위자료 (${appliedInjuryGrade}급)`;
      if (data.hasMultipleInjuries && data.injuryGrade >= 2 && data.injuryGrade <= 11) {
        if (data.isAutoGrade) {
          formulas.push(`부상 위자료: 다중 진단 병급 규정이 자동 적용되어 ${data.injuryGrade}급에서 1급 상향된 ${appliedInjuryGrade}급 기준액`);
        } else {
          formulas.push(`부상 위자료: ${data.injuryGrade}급에서 병급(상향) 적용된 ${appliedInjuryGrade}급 기준액`);
        }
      } else {
        if (data.isAutoGrade) {
          formulas.push(`부상 위자료: 선택된 진단명 중 최고 급수인 ${appliedInjuryGrade}급 기준액 자동 적용`);
        } else {
          formulas.push(`부상 위자료: 상해 ${appliedInjuryGrade}급 기준액 적용`);
        }
      }
    }
  }

  // 2. 휴업손해 (입원일수 * 일소득 * 85%)
  const canClaimLostIncome = data.ageAtAccident < 65 || data.isIncomeProven;
  const dailyIncome = data.income / 30;
  const lostIncome = (data.hasInjury && canClaimLostIncome) ? Math.floor(dailyIncome * data.hospitalDays * 0.85) : 0;
  
  if (data.hasInjury) {
    if (!canClaimLostIncome && data.hospitalDays > 0) {
      formulas.push(`휴업손해: 65세 이상 및 소득 미입증으로 휴업일수 산정 배제 (0원)`);
    } else if (lostIncome > 0) {
      formulas.push(`휴업손해: (월소득/30) × ${data.hospitalDays}일 × 85% = ${lostIncome.toLocaleString()}원`);
    }
  }

  // 3. 기타손배금 (통원일수 * 8000원)
  const otherDamages = data.hasInjury ? data.outpatientDays * 8000 : 0;
  if (otherDamages > 0) formulas.push(`기타손배금: 통원 ${data.outpatientDays}일 × 8,000원 = ${otherDamages.toLocaleString()}원`);

  // 4. 상실수익액 (소득 * 장해율 * 호프만계수)
  let lostEarnings = 0;
  const DAILY_WORKER_WAGE = 3284525;
  const actualIncome = data.isIncomeProven ? data.income : DAILY_WORKER_WAGE;
  
  // 62세 이상 취업가능월수 규칙 적용
  let totalMonths = 0;
  if (data.ageAtAccident < 62) {
    totalMonths = Math.max((65 - data.ageAtAccident) * 12, 0);
  } else if (data.ageAtAccident < 67) {
    totalMonths = 36;
  } else if (data.ageAtAccident < 76) {
    totalMonths = 24;
  } else {
    totalMonths = 12;
  }

  const monthsUntil65 = Math.max((65 - data.ageAtAccident) * 12, 0);
  const segment1Months = Math.min(totalMonths, monthsUntil65);
  const segment2Months = totalMonths - segment1Months;
  
  const hoffman1 = getHoffmanCoefficient(segment1Months);
  const hoffman2 = segment2Months > 0 ? (getHoffmanCoefficient(totalMonths) - hoffman1) : 0;

  if (data.hasDeath) {
    formulas.push(`사망 장례비: 약관 기준 500만 원 기본 적용`);
    
    if (data.ageAtAccident >= 65 && !data.isIncomeProven) {
      formulas.push(`사망 상실수익액: 65세 이상 및 소득 미입증으로 상실수익액 인정 배제 (0원)`);
    } else {
      const earning1 = Math.floor(actualIncome * (2/3) * hoffman1);
      const earning2 = Math.floor(DAILY_WORKER_WAGE * (2/3) * hoffman2);
      lostEarnings = earning1 + earning2;
      
      let formulaText = `사망 상실수익액(생활비 1/3 공제 반영): `;
      if (segment1Months > 0) formulaText += `[${segment1Months}개월분: 소득 × 2/3 × 호프만(${hoffman1.toFixed(4)})]`;
      if (segment2Months > 0) formulaText += `${segment1Months > 0 ? ' + ' : ''}[정년후 ${segment2Months}개월분: 일용임금 × 2/3 × 호프만(${hoffman2.toFixed(4)})]`;
      formulaText += ` = ${lostEarnings.toLocaleString()}원`;
      formulas.push(formulaText);
    }
  } else if (data.hasDisability && data.disabilityRate > 0) {
    const limitedTotalMonths = data.disabilityYears === 0 ? totalMonths : Math.min(data.disabilityYears * 12, totalMonths);
    const limitedSeg1 = Math.min(limitedTotalMonths, segment1Months);
    const limitedSeg2 = limitedTotalMonths - limitedSeg1;
    
    const h1 = getHoffmanCoefficient(limitedSeg1);
    const h2 = limitedSeg2 > 0 ? (getHoffmanCoefficient(limitedTotalMonths) - h1) : 0;

    if (data.ageAtAccident >= 65 && !data.isIncomeProven) {
      formulas.push(`장해 상실수익액: 65세 이상 및 소득 미입증으로 상실수익액 인정 배제 (0원)`);
    } else {
      const earning1 = Math.floor(actualIncome * (data.disabilityRate / 100) * h1);
      const earning2 = Math.floor(DAILY_WORKER_WAGE * (data.disabilityRate / 100) * h2);
      lostEarnings = earning1 + earning2;
      
      let formulaText = `장해 상실수익액(${data.disabilityRate}%): `;
      if (limitedSeg1 > 0) formulaText += `[${limitedSeg1}개월분: 소득 × 장해율 × 호프만(${h1.toFixed(4)})]`;
      if (limitedSeg2 > 0) formulaText += `${limitedSeg1 > 0 ? ' + ' : ''}[정년후 ${limitedSeg2}개월분: 일용임금 × 장해율 × 호프만(${h2.toFixed(4)})]`;
      formulaText += ` = ${lostEarnings.toLocaleString()}원`;
      formulas.push(formulaText);
    }
  }

  // 5. 합의 조율 항목, 실제 지출 및 장례비
  const directReceipts = data.directReceipts;
  const futureTreatmentCost = data.futureTreatmentCost;
  const funeralCost = data.hasDeath ? 5000000 : 0; // 약관상 장례비 500만원

  // 총 합계 (과실 상계 전)
  const totalBeforeFault = alimony + lostIncome + otherDamages + lostEarnings + directReceipts + futureTreatmentCost + funeralCost;
  
  // 과실 상계 (직불영수증 등 제외 복잡한 상계가 있지만 여기서는 전체 단순 상계)
  const finalTotal = Math.floor(totalBeforeFault * ((100 - data.faultRatio) / 100));

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
      pdf.save('보상스쿨_교통사고_합의금명세서.pdf');
    } catch (e: unknown) {
      console.error(e);
      const errorMsg = e instanceof Error ? e.message : String(e);
      alert(`PDF 생성 중 오류가 발생했습니다: ${errorMsg}`);
    }
  };

  const shareResult = () => {
    const text = `보상스쿨 교통사고 합의금 계산결과\n▶ 추정 합의금: ${finalTotal.toLocaleString()}원\n\n자세한 내역은 보상스쿨에서 확인해보세요!`;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof window !== 'undefined' && (window as any).Kakao && (window as any).Kakao.isInitialized()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: '보상스쿨 자동차사고 합의금 산출 결과',
          description: `예상 합의금: ${finalTotal.toLocaleString()}원\n자세한 보상 명세서를 확인해 보세요!`,
          imageUrl: 'https://claim-works.com/og-image.png',
          link: {
            mobileWebUrl: window.location.href,
            webUrl: window.location.href,
          },
        },
        buttons: [
          {
            title: '합의금 결과 보기',
            link: {
              mobileWebUrl: window.location.href,
              webUrl: window.location.href,
            },
          },
        ],
      });
    } else if (navigator.share) {
      navigator.share({
        title: '보상스쿨 합의금 산출 명세서',
        text: text,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text + '\n' + window.location.href);
      alert('결과가 클립보드에 복사되었습니다. 카카오톡이나 메시지 앱에 붙여넣기 해보세요.');
    }
  };

  return (
    <div ref={resultRef} className="bg-[#f8faff] dark:bg-[#1e2736]/30 rounded-3xl p-6 sm:p-8 border border-blue-100/70 dark:border-blue-900/20 shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
      <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <span className="w-1.5 h-5 bg-blue-600 rounded-full inline-block shrink-0" />
        산출 명세서 (추정치)
      </h3>

      <div className="space-y-4 text-xs sm:text-sm mb-6">
        {alimony > 0 && (
          <div className="flex justify-between items-center pb-2 border-b border-dashed border-gray-200 dark:border-gray-800">
            <span className="text-gray-600 dark:text-gray-400 font-medium">
              {appliedAlimonyLabel} 
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded ml-1.5">최대치 적용</span>
            </span>
            <span className="font-bold text-gray-900 dark:text-white">{alimony.toLocaleString()} 원</span>
          </div>
        )}
        
        {data.hasInjury && (
          <>
            <div className="flex justify-between items-center pb-2 border-b border-dashed border-gray-200 dark:border-gray-800">
              <span className="text-gray-600 dark:text-gray-400 font-medium">휴업손해 (입원 {data.hospitalDays}일)</span>
              <span className="font-bold text-gray-900 dark:text-white">{lostIncome.toLocaleString()} 원</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-dashed border-gray-200 dark:border-gray-800">
              <span className="text-gray-600 dark:text-gray-400 font-medium">기타손배금 (통원 {data.outpatientDays}일)</span>
              <span className="font-bold text-gray-900 dark:text-white">{otherDamages.toLocaleString()} 원</span>
            </div>
          </>
        )}
        
        {data.hasDeath && (
          <>
            <div className="flex justify-between items-center pb-2 border-b border-dashed border-gray-200 dark:border-gray-800">
              <span className="text-gray-600 dark:text-gray-400 font-medium">사망 장례비</span>
              <span className="font-bold text-gray-900 dark:text-white">{funeralCost.toLocaleString()} 원</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-dashed border-gray-200 dark:border-gray-800">
              <span className="text-gray-600 dark:text-gray-400 font-medium">상실수익액 (사망, 만 {data.ageAtAccident}세)</span>
              <span className="font-bold text-gray-900 dark:text-white">{lostEarnings.toLocaleString()} 원</span>
            </div>
          </>
        )}
        
        {!data.hasDeath && data.hasDisability && (
          <div className="flex justify-between items-center pb-2 border-b border-dashed border-gray-200 dark:border-gray-800">
            <span className="text-gray-600 dark:text-gray-400 font-medium">상실수익액 (장해 {data.disabilityRate}%)</span>
            <span className="font-bold text-gray-900 dark:text-white">{lostEarnings.toLocaleString()} 원</span>
          </div>
        )}

        {(data.directReceipts > 0 || data.futureTreatmentCost > 0) && (
          <div className="flex flex-col gap-2 pb-2">
            {data.directReceipts > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 font-medium">직불 치료비 (영수증)</span>
                <span className="font-bold text-gray-900 dark:text-white">{directReceipts.toLocaleString()} 원</span>
              </div>
            )}
            {data.futureTreatmentCost > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 font-medium">향후치료비 추정액</span>
                <span className="font-bold text-gray-900 dark:text-white">{futureTreatmentCost.toLocaleString()} 원</span>
              </div>
            )}
          </div>
        )}

        {data.faultRatio > 0 && (
          <div className="flex justify-between items-center pt-2 text-red-500 font-bold">
            <span>과실 상계 ({data.faultRatio}%)</span>
            <span>-{Math.floor(totalBeforeFault * (data.faultRatio / 100)).toLocaleString()} 원</span>
          </div>
        )}

        {formulas.length > 0 && (
          <div className="bg-[#f8faff] dark:bg-[#2d2d2d] rounded-2xl p-4 border border-blue-100 dark:border-white/5 mt-5">
            <h4 className="text-[12px] font-extrabold text-[#1A73E8] mb-2 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
              적용된 산출 계산식
            </h4>
            <ul className="list-disc list-inside text-[11px] text-gray-600 dark:text-gray-400 space-y-1.5 leading-relaxed break-keep">
              {formulas.map((formula, idx) => (
                <li key={idx}>{formula}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 최종 합의금 카드: 멋진 파란색 그라데이션 적용 */}
      <div className="bg-gradient-to-br from-[#1A73E8] to-[#1557b0] dark:from-[#2e7bf2] dark:to-[#1A73E8] rounded-2xl p-6 text-white text-center shadow-md relative overflow-hidden transition-all duration-300 hover:shadow-lg">
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-8 -translate-y-8">
          <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
        </div>
        <div className="relative z-10">
          <h4 className="text-white/80 font-bold text-xs uppercase tracking-wider mb-1">최종 합의금 (추정치)</h4>
          <div className="text-3xl sm:text-4xl font-black tracking-tight flex items-center justify-center gap-1">
            {finalTotal.toLocaleString()}
            <span className="text-lg font-bold text-white/90">원</span>
          </div>
        </div>
      </div>

      <div className="mt-5 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400 bg-white/60 dark:bg-black/10 p-3.5 rounded-xl border border-gray-100 dark:border-transparent">
        <span className="font-bold text-red-500 inline-block mr-1">⚠️ 참고:</span> 위 결과는 보험회사 약관 기준을 적용한 참고용 수치입니다. 실제 피해자의 직업, 입원 기간에 따른 치료비 상계 및 법원 소송 기준(특인) 적용 여부에 따라 수백만 원에서 수천만 원까지 증액될 수 있으므로 섣불리 합의서에 서명하지 마시고 보상 전문가와 상담하세요.
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
  );
}
