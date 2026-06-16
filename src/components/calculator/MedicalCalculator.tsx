'use client';

import { useState } from 'react';

// ── 세대별 공제 계산 로직 ──
function calcResult(generation: number, hospitalType: number, medicalBill: number) {
  let deductible = 0;
  let coverageRate = 1;

  if (generation === 1) {
    deductible = 5000;
    coverageRate = 1.0;
    deductible = Math.min(deductible, medicalBill);
    return { deductible, returnAmount: Math.max(0, medicalBill - deductible), coverageRate };
  }

  const baseDeductible = hospitalType === 1 ? 10000 : hospitalType === 2 ? 15000 : 20000;

  if (generation === 2) {
    coverageRate = 0.9;
    const ratioDeductible = medicalBill * 0.1;
    deductible = Math.max(baseDeductible, ratioDeductible);
  } else if (generation === 3) {
    coverageRate = 0.85;
    const ratioDeductible = medicalBill * 0.15;
    deductible = Math.max(baseDeductible, ratioDeductible);
  } else {
    coverageRate = 0.75;
    const ratioDeductible = medicalBill * 0.25;
    deductible = Math.max(baseDeductible, ratioDeductible);
  }

  return { deductible, returnAmount: Math.max(0, medicalBill - deductible), coverageRate };
}

const GENERATIONS = [
  { id: 1, label: '1세대 실손', period: '~2009년 8월', color: '#1A73E8', note: '입원/통원 본인부담금 5천원 공제 후 100% 보장' },
  { id: 2, label: '2세대 실손', period: '2009년 10월 ~ 2017년 3월', color: '#34A853', note: '급여/비급여 자기부담금 10% 공제 후 90% 보장' },
  { id: 3, label: '3세대 실손', period: '2017년 4월 ~ 2021년 6월', color: '#f29900', note: '기본형 급여 90%, 비급여 특약 80% 보장' },
  { id: 4, label: '4세대 실손', period: '2021년 7월 ~ 현재', color: '#d93025', note: '급여 80%, 비급여 70% 보장 (비급여 차등제)' },
];

const HOSPITAL_TYPES = [
  { id: 1, label: '의원·클리닉', emoji: '🏥', desc: '동네 병의원, 보건소, 한의원' },
  { id: 2, label: '일반 병원', emoji: '🏨', desc: '입원 30병상 이상 병원급' },
  { id: 3, label: '상급·종합병원', emoji: '🏫', desc: '대학병원, 대형 상급종합병원' },
];

export default function MedicalCalculator() {
  const [generation, setGeneration] = useState(1);
  const [hospitalType, setHospitalType] = useState(1);
  const [medicalBill, setMedicalBill] = useState(100000);

  const fmt = (val: number | string) => {
    if (!val) return '';
    return Number(val.toString().replace(/,/g, '')).toLocaleString();
  };
  const parse = (val: string) => Math.max(0, Number(val.replace(/[^0-9]/g, '')) || 0);

  const { deductible, returnAmount, coverageRate } = calcResult(generation, hospitalType, medicalBill);
  const coveragePct = Math.round(coverageRate * 100);
  const selectedGen = GENERATIONS.find(g => g.id === generation)!;

  return (
    <div className="w-full">
      {/* 컨테이너 비율 변경: 5:7 비율로 명세서 영역 확대 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">

        {/* ── 좌측: 입력 패널 (세련된 UI 적용) ── */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* 1. 가입 세대 선택 */}
          <div className="bg-white dark:bg-[#202124] rounded-3xl p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-white/5 transition-all">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-[#f8f9fa] dark:bg-[#2d2d2d] flex items-center justify-center text-lg">📅</div>
              <h3 className="text-sm font-extrabold text-[#202124] dark:text-[#e8eaed]">실손의료비 가입 세대</h3>
            </div>
            <div className="flex flex-col gap-3">
              {GENERATIONS.map(gen => {
                const isActive = generation === gen.id;
                return (
                  <button
                    key={gen.id}
                    onClick={() => setGeneration(gen.id)}
                    className={`relative w-full flex flex-col p-4 rounded-2xl border-2 text-left transition-all duration-300 overflow-hidden group ${
                      isActive
                        ? 'border-current shadow-md scale-[1.02]'
                        : 'border-transparent bg-[#f8f9fa] dark:bg-[#2d2d2d] hover:bg-gray-50 dark:hover:bg-[#303134]'
                    }`}
                    style={isActive ? { borderColor: gen.color, backgroundColor: `${gen.color}08`, color: gen.color } : {}}
                  >
                    {isActive && (
                      <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: gen.color }} />
                    )}
                    <div className="flex justify-between items-center w-full mb-1">
                      <span className={`font-black text-base ${isActive ? '' : 'text-[#202124] dark:text-[#e8eaed]'}`}>{gen.label}</span>
                      {isActive && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      )}
                    </div>
                    <span className={`text-xs font-semibold ${isActive ? 'opacity-80' : 'text-gray-500 dark:text-gray-400'}`}>{gen.period}</span>
                  </button>
                );
              })}
            </div>
            
            {/* 세대별 특징 툴팁 */}
            <div className="mt-5 p-4 rounded-2xl text-xs font-bold leading-relaxed border" style={{ backgroundColor: `${selectedGen.color}0A`, color: selectedGen.color, borderColor: `${selectedGen.color}20` }}>
              <span className="mr-1">💡</span> {selectedGen.note}
            </div>
          </div>

          {/* 2. 병원 규모 선택 */}
          <div className="bg-white dark:bg-[#202124] rounded-3xl p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-white/5 transition-all">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-[#f8f9fa] dark:bg-[#2d2d2d] flex items-center justify-center text-lg">🏥</div>
              <h3 className="text-sm font-extrabold text-[#202124] dark:text-[#e8eaed]">방문 병원 규모</h3>
            </div>
            <div className="flex flex-col gap-2.5">
              {HOSPITAL_TYPES.map(ht => {
                const isActive = hospitalType === ht.id;
                return (
                  <button
                    key={ht.id}
                    onClick={() => setHospitalType(ht.id)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 ${
                      isActive
                        ? 'border-[#34A853] bg-[#e6f4ea] dark:bg-[#34A853]/10 text-[#34A853] dark:text-[#81c995] shadow-sm'
                        : 'border-transparent bg-[#f8f9fa] dark:bg-[#2d2d2d] text-gray-500 hover:bg-gray-50 dark:hover:bg-[#303134]'
                    }`}
                  >
                    <span className="text-3xl filter drop-shadow-sm">{ht.emoji}</span>
                    <div className="text-left">
                      <div className={`font-black text-[14px] ${isActive ? '' : 'text-[#202124] dark:text-gray-200'}`}>{ht.label}</div>
                      <div className={`text-[11px] font-semibold mt-0.5 ${isActive ? 'opacity-80' : 'text-gray-400'}`}>{ht.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. 진료비 입력 */}
          <div className="bg-white dark:bg-[#202124] rounded-3xl p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-white/5 transition-all">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-[#f8f9fa] dark:bg-[#2d2d2d] flex items-center justify-center text-lg">💳</div>
              <h3 className="text-sm font-extrabold text-[#202124] dark:text-[#e8eaed]">발생 진료비 (환자 부담 총액)</h3>
            </div>
            <div className="relative mb-4">
              <input
                type="text"
                inputMode="numeric"
                value={medicalBill ? fmt(medicalBill) : ''}
                onChange={e => setMedicalBill(parse(e.target.value))}
                placeholder="100,000"
                className="w-full bg-[#f8f9fa] dark:bg-[#2d2d2d] border border-gray-200 dark:border-white/10 rounded-2xl py-4 pl-5 pr-14 text-xl text-[#202124] dark:text-[#e8eaed] font-black focus:ring-2 focus:ring-[#34A853] focus:bg-white dark:focus:bg-[#202124] focus:outline-none transition-all shadow-inner"
              />
              <span className="absolute right-5 top-[18px] text-sm text-gray-400 font-bold">원</span>
            </div>
            
            {/* 금액 퀵 버튼 */}
            <div className="flex flex-wrap gap-2">
              {[50000, 100000, 300000, 500000].map(v => (
                <button key={v} onClick={() => setMedicalBill(v)}
                  className={`flex-1 min-w-[70px] py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    medicalBill === v
                      ? 'bg-[#34A853] text-white border-[#34A853] shadow-md'
                      : 'bg-white dark:bg-[#202124] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-[#34A853] hover:text-[#34A853]'
                  }`}>
                  {v >= 10000 ? `${v / 10000}만` : `${v.toLocaleString()}`}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* ── 우측: 결과 패널 (명세서 폭 확대) ── */}
        <div className="lg:col-span-7 sticky top-[100px] flex flex-col gap-5">
          
          {/* 타이틀 헤더 */}
          <div className="bg-[#f8f9fa] dark:bg-[#2d2d2d] rounded-3xl px-6 py-5 border border-gray-100 dark:border-white/5 flex items-center gap-3">
            <span className="text-2xl">📑</span>
            <div>
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white">실손의료비 산출 명세서</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">선택하신 조건에 따른 예상 보상 내역입니다.</p>
            </div>
          </div>

          {/* 최종 수령액 카드 (넓게 표시) */}
          <div className="bg-gradient-to-br from-[#34A853] to-[#137333] dark:from-[#137333] dark:to-[#34A853] rounded-3xl p-8 sm:p-10 text-white shadow-xl shadow-[#34A853]/20 relative overflow-hidden transition-all duration-300 hover:scale-[1.01]">
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
                    {Math.round(returnAmount).toLocaleString()}
                  </div>
                  <div className="text-2xl font-bold text-white/90 mb-1.5">원</div>
                </div>
              </div>
              
              <div className="mt-8 pt-5 border-t border-white/20 flex flex-wrap gap-4 text-[13px] font-semibold text-white/90">
                <div className="flex items-center gap-1.5">
                  <span className="text-white/60">가입 세대:</span>
                  <span>{generation}세대</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-white/60">방문 병원:</span>
                  <span>{HOSPITAL_TYPES.find(h => h.id === hospitalType)?.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-white/60">보장 비율:</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded text-white">{coveragePct}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 산출 명세 상세 (넓은 폭 활용) */}
          <div className="bg-white dark:bg-[#202124] rounded-3xl border border-gray-200 dark:border-white/10 p-7 shadow-sm">
            <h3 className="text-[13px] font-extrabold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2 mb-5">
              <span className="w-1 h-4 bg-[#34A853] rounded-full"></span> 세부 공제 내역
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-white/5">
                <span className="text-[14px] font-semibold text-gray-500 dark:text-gray-400">총 발생 진료비</span>
                <span className="text-[15px] font-black text-[#202124] dark:text-[#e8eaed]">{medicalBill.toLocaleString()} 원</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-white/5">
                <div>
                  <span className="text-[14px] font-semibold text-gray-500 dark:text-gray-400 block mb-1">자기부담금 (공제액)</span>
                  <span className="text-[11px] text-gray-400 bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded-md">약관에 따른 최소 공제금액 또는 비율 적용</span>
                </div>
                <span className="text-[15px] font-black text-[#d93025] bg-[#fce8e6] dark:bg-[#d93025]/10 px-3 py-1 rounded-lg">
                  - {Math.round(deductible).toLocaleString()} 원
                </span>
              </div>
              
              <div className="flex justify-between items-center pt-3 mt-1">
                <span className="text-[15px] font-extrabold text-[#34A853]">최종 예상 보상액</span>
                <span className="text-[18px] font-black text-[#34A853]">{Math.round(returnAmount).toLocaleString()} 원</span>
              </div>
            </div>

            {/* 보장율 프로그레스 바 */}
            <div className="mt-8 pt-6 border-t border-dashed border-gray-200 dark:border-white/10">
              <div className="flex justify-between text-[12px] font-extrabold text-gray-500 dark:text-gray-400 mb-2">
                <span>실제 보상 비율 (총 진료비 대비)</span>
                <span style={{ color: selectedGen.color }}>{coveragePct}%</span>
              </div>
              <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                  style={{ width: `${coveragePct}%`, backgroundColor: selectedGen.color }}
                >
                  <div className="absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>
            </div>
          </div>

          {/* 주의사항 & CTA */}
          <div className="flex flex-col gap-3 mt-2">
            <div className="bg-[#fce8e6]/80 dark:bg-[#d93025]/10 rounded-2xl p-4 border border-[#d93025]/20 flex gap-3 text-[12px] leading-relaxed text-[#d93025] dark:text-[#f28b82] font-semibold shadow-sm">
              <span className="shrink-0 text-base mt-0.5">⚠️</span>
              <p>위 결과는 <strong>단순 계산 추정치</strong>입니다. 실제 보상 시에는 급여/비급여 구성 비율, 비급여 특약 가입 여부, 1일 보상 한도 초과 등에 따라 지급액이 달라질 수 있습니다.</p>
            </div>

            <a
              href="https://open.kakao.com/o/sWeszp7"
              target="_blank"
              rel="noopener noreferrer"
              className="group block text-center w-full py-4.5 bg-[#202124] hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-[#202124] rounded-2xl font-extrabold text-[15px] transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5"
            >
              <span className="inline-block transform group-hover:scale-110 transition-transform mr-1">💬</span> 
              보상스쿨 1:1 무료 상담 신청하기
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
