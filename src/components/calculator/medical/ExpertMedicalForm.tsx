'use client';

import { useState } from 'react';
import { MedicalInsuranceData, initialMedicalData } from './medical-calculator-types';
import MedicalCalculatorResult from './MedicalCalculatorResult';

export default function ExpertMedicalForm() {
  const [data, setData] = useState<MedicalInsuranceData>(initialMedicalData);

  const handleChange = (field: keyof MedicalInsuranceData, value: number | string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (val: number | string) => {
    if (!val) return '';
    return Number(val.toString().replace(/,/g, '')).toLocaleString();
  };
  const parseCurrency = (val: string) => Math.max(0, Number(val.replace(/[^0-9]/g, '')) || 0);

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* 2단 그리드 레이아웃: 데스크톱에서는 5:7 구조로 좌우 배치, 모바일에서는 상하 배치 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* 좌측: 입력 폼 영역 (5열) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* 가입 정보 입력 */}
          <section className="bg-white dark:bg-[#202124] p-6 rounded-2xl border border-gray-200/80 dark:border-white/5 shadow-sm">
            <h3 className="font-extrabold text-base mb-5 text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-1 h-4 bg-green-600 rounded-full inline-block" />
              가입 기본 정보
            </h3>
            
            <div className="space-y-5">
              {/* 가입 시기 (세대) 선택: 드롭다운 대신 세련된 4단 세그먼트 버튼으로 전면 변경 */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 mb-2.5">
                  실손보험 가입 시기 (세대 구분)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
                  {[
                    { val: 1, label: '1세대', desc: '09년 8월 이전' },
                    { val: 2, label: '2세대', desc: '09.8 ~ 17.3' },
                    { val: 3, label: '3세대', desc: '17.4 ~ 21.6' },
                    { val: 4, label: '4세대', desc: '21년 7월 이후' }
                  ].map(gen => (
                    <button
                      key={gen.val}
                      onClick={() => handleChange('generation', gen.val)}
                      type="button"
                      className={`p-3 rounded-xl border text-center transition-all ${data.generation === gen.val ? 'border-green-600 bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-400 font-bold shadow-sm' : 'border-gray-200 bg-white dark:bg-[#303134] dark:border-transparent text-gray-600 dark:text-gray-300 hover:border-green-300'}`}
                    >
                      <div className="text-xs sm:text-sm">{gen.label}</div>
                      <div className="text-[10px] opacity-75 mt-0.5">{gen.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 진료 형태 선택: 드롭다운 대신 2단 탭으로 변경 */}
              <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">진료 형태</label>
                  <div className="flex bg-gray-100 dark:bg-[#303134] p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => handleChange('treatmentType', 'inpatient')}
                      className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${data.treatmentType === 'inpatient' ? 'bg-white dark:bg-[#202124] text-green-600 dark:text-green-400 shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    >
                      입원 치료
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('treatmentType', 'outpatient')}
                      className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${data.treatmentType === 'outpatient' ? 'bg-white dark:bg-[#202124] text-green-600 dark:text-green-400 shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    >
                      통원 (외래)
                    </button>
                  </div>
                </div>

                {data.treatmentType === 'outpatient' && (
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">통원(방문) 일수</label>
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <input 
                          type="number" 
                          inputMode="numeric"
                          value={data.outpatientDays || 1} 
                          onChange={e => handleChange('outpatientDays', Math.max(1, Number(e.target.value)))} 
                          className="w-full bg-[#f8f9fa] dark:bg-[#303134] border border-gray-200 dark:border-gray-700 rounded-xl py-2 pl-4 pr-8 text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-green-500 focus:bg-white dark:focus:bg-[#202124] focus:outline-none transition-all text-xs" 
                          min="1" 
                        />
                        <span className="absolute right-4 top-2.5 text-xs text-gray-400">일</span>
                      </div>
                      <button type="button" onClick={() => handleChange('outpatientDays', Math.max(1, data.outpatientDays - 1))} className="w-10 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 text-xs">-</button>
                      <button type="button" onClick={() => handleChange('outpatientDays', data.outpatientDays + 1)} className="w-10 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 text-xs">+</button>
                    </div>
                  </div>
                )}
              </div>

              {/* 병원 규모 선택 */}
              {data.treatmentType === 'outpatient' && data.generation > 1 && (
                <div className="mt-2">
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">병원 규모 (최소 공제기준)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: 'clinic', label: '의원', desc: '1만 원 공제' },
                      { type: 'hospital', label: '병원', desc: '1.5만 원 공제' },
                      { type: 'general', label: '종합병원', desc: '2만 원 공제' }
                    ].map(clinic => (
                      <button
                        key={clinic.type}
                        type="button"
                        onClick={() => handleChange('clinicType', clinic.type)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${data.clinicType === clinic.type ? 'border-green-600 bg-green-50/50 dark:bg-green-950/20 text-green-700 dark:text-green-400 font-bold shadow-sm' : 'border-gray-200 bg-white dark:bg-[#303134] dark:border-transparent text-gray-600 dark:text-gray-300 hover:border-green-300'}`}
                      >
                        <div className="text-xs sm:text-sm">{clinic.label}</div>
                        <div className="text-[10px] opacity-75 mt-0.5 break-keep">{clinic.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 기본 병원비 영수증 입력 */}
          <section className="bg-white dark:bg-[#202124] p-6 rounded-2xl border border-gray-200/80 dark:border-white/5 shadow-sm">
            <h3 className="font-extrabold text-base mb-4 text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-1 h-4 bg-green-600 rounded-full inline-block" />
              기본 병원비 영수증 정보
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">급여 (본인부담금 총액)</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={data.coveredCost ? formatCurrency(data.coveredCost) : ''}
                    onChange={e => handleChange('coveredCost', parseCurrency(e.target.value))}
                    placeholder="0"
                    className="w-full bg-[#f8f9fa] dark:bg-[#303134] border border-gray-200 dark:border-gray-700 rounded-xl py-3 pl-4 pr-10 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:bg-white dark:focus:bg-[#202124] focus:outline-none transition-all font-bold text-sm"
                  />
                  <span className="absolute right-4 top-3 text-sm text-gray-400 dark:text-gray-500 font-medium">원</span>
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">비급여 (본인부담금 총액)</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={data.nonCoveredCost ? formatCurrency(data.nonCoveredCost) : ''}
                    onChange={e => handleChange('nonCoveredCost', parseCurrency(e.target.value))}
                    placeholder="0"
                    className="w-full bg-[#f8f9fa] dark:bg-[#303134] border border-gray-200 dark:border-gray-700 rounded-xl py-3 pl-4 pr-10 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:bg-white dark:focus:bg-[#202124] focus:outline-none transition-all font-bold text-sm"
                  />
                  <span className="absolute right-4 top-3 text-sm text-gray-400 dark:text-gray-500 font-medium">원</span>
                </div>
              </div>
            </div>
          </section>

          {/* 3대 비급여 입력 (3, 4세대 전용) */}
          {(data.generation === 3 || data.generation === 4) && (
            <section className="bg-white dark:bg-[#202124] p-6 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm">
              <h3 className="font-extrabold text-base mb-1 text-red-700 dark:text-red-400 flex items-center gap-2">
                <span className="w-1 h-4 bg-red-600 rounded-full inline-block" />
                3대 비급여 특약 병원비
              </h3>
              <p className="text-[11px] text-red-500 dark:text-red-400 mb-4 font-semibold">※ 위의 기본 비급여 금액과 중복입력하지 마세요.</p>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">도수치료/체외충격파</label>
                  <div className="relative">
                    <input type="text" inputMode="numeric" value={data.manualTherapyCost ? formatCurrency(data.manualTherapyCost) : ''} onChange={e => handleChange('manualTherapyCost', parseCurrency(e.target.value))} placeholder="0" className="w-full bg-[#f8f9fa] dark:bg-[#303134] border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pl-3 pr-8 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:bg-white dark:focus:bg-[#202124] focus:outline-none transition-all font-bold text-xs" />
                    <span className="absolute right-3 top-2.5 text-xs text-gray-400">원</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">비급여 주사료</label>
                  <div className="relative">
                    <input type="text" inputMode="numeric" value={data.injectionCost ? formatCurrency(data.injectionCost) : ''} onChange={e => handleChange('injectionCost', parseCurrency(e.target.value))} placeholder="0" className="w-full bg-[#f8f9fa] dark:bg-[#303134] border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pl-3 pr-8 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:bg-white dark:focus:bg-[#202124] focus:outline-none transition-all font-bold text-xs" />
                    <span className="absolute right-3 top-2.5 text-xs text-gray-400">원</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">비급여 MRI/MRA</label>
                  <div className="relative">
                    <input type="text" inputMode="numeric" value={data.mriCost ? formatCurrency(data.mriCost) : ''} onChange={e => handleChange('mriCost', parseCurrency(e.target.value))} placeholder="0" className="w-full bg-[#f8f9fa] dark:bg-[#303134] border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 pl-3 pr-8 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:bg-white dark:focus:bg-[#202124] focus:outline-none transition-all font-bold text-xs" />
                    <span className="absolute right-3 top-2.5 text-xs text-gray-400">원</span>
                  </div>
                </div>
              </div>
            </section>
          )}

        </div>

        {/* 우측: 결과 영역 (7열) - 데스크톱에서 스티키(Sticky)하게 고정 */}
        <div className="lg:col-span-7 lg:sticky lg:top-6 lg:self-start">
          <MedicalCalculatorResult data={data} />
        </div>

      </div>
    </div>
  );
}
