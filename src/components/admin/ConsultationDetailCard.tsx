import React from 'react';

export interface InsuranceItem {
  id: string;
  type: string; // 상대보험회사, 본인장기보험회사 등
  company: string;
  year: string;
  amount: string;
}

export interface ConsultationData {
  category: string;
  diagnosis: string;
  date: string;
  location: string;
  details: string;
  inquiries: string;
  insurances: InsuranceItem[];
  treatmentHistory: string;
  hospitalization: boolean;
  outpatient: boolean;
  surgery: boolean;
  test: boolean;
}

interface Props {
  data: ConsultationData;
  onChange?: (data: ConsultationData) => void;
  readOnly?: boolean;
}

export default function ConsultationDetailCard({ data, onChange, readOnly = true }: Props) {
  
  const updateField = <K extends keyof ConsultationData>(field: K, value: ConsultationData[K]) => {
    if (onChange) {
      onChange({ ...data, [field]: value });
    }
  };

  const addInsurance = () => {
    const newItem: InsuranceItem = { id: Date.now().toString(), type: '상대보험회사', company: '', year: '', amount: '' };
    updateField('insurances', [...data.insurances, newItem]);
  };

  const updateInsurance = (id: string, field: keyof InsuranceItem, value: string) => {
    const updated = data.insurances.map(item => item.id === id ? { ...item, [field]: value } : item);
    updateField('insurances', updated);
  };

  const removeInsurance = (id: string) => {
    const filtered = data.insurances.filter(item => item.id !== id);
    updateField('insurances', filtered);
  };

  const handleTextareaResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  };

  return (
    <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-4">
      {/* 사고 분류 */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500">사고 분류</span>
        {readOnly ? (
          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-xs font-bold rounded-full border border-indigo-200 dark:border-indigo-800">
            {data.category}
          </span>
        ) : (
          <select
            value={data.category}
            onChange={(e) => updateField('category', e.target.value)}
            className="px-2.5 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-xs font-bold rounded-full border border-indigo-200 dark:border-indigo-800 outline-none appearance-none text-center cursor-pointer"
          >
            <option value="교통사고">교통사고</option>
            <option value="근로재해">근로재해</option>
            <option value="배상책임">배상책임</option>
            <option value="기타상해">기타상해</option>
            <option value="질병">질병</option>
          </select>
        )}
      </div>
      
      {/* 진단명 */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500">진단명</span>
        {readOnly ? (
          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{data.diagnosis}</span>
        ) : (
          <input
            type="text"
            value={data.diagnosis}
            onChange={(e) => updateField('diagnosis', e.target.value)}
            placeholder="입력..."
            className="bg-transparent border-none text-right text-sm font-bold text-gray-800 dark:text-gray-200 outline-none w-full ml-4 placeholder:text-gray-300"
          />
        )}
      </div>
      
      {/* 사고일자 */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-500">사고일자</span>
        {readOnly ? (
          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{data.date}</span>
        ) : (
          <input
            type="text"
            value={data.date}
            onChange={(e) => updateField('date', e.target.value)}
            placeholder="YYYY-MM-DD"
            className="bg-transparent border-none text-right text-sm font-bold text-gray-800 dark:text-gray-200 outline-none w-full ml-4 placeholder:text-gray-300"
          />
        )}
      </div>
      
      {/* 사고장소 */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-4">
        <span className="text-xs font-bold text-gray-500">사고장소</span>
        {readOnly ? (
          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{data.location || '-'}</span>
        ) : (
          <input
            type="text"
            value={data.location}
            onChange={(e) => updateField('location', e.target.value)}
            placeholder="입력..."
            className="bg-transparent border-none text-right text-sm font-bold text-gray-800 dark:text-gray-200 outline-none w-full ml-4 placeholder:text-gray-300"
          />
        )}
      </div>
      
      {/* 사고 경위 및 내용 */}
      <div>
        <span className="block text-xs font-bold text-gray-500 mb-2">사고 경위 및 내용</span>
        {readOnly ? (
          <p className="text-sm text-gray-800 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-zinc-950 p-3 rounded-lg border border-gray-100 dark:border-zinc-800 whitespace-pre-wrap">
            {data.details}
          </p>
        ) : (
          <textarea
            value={data.details}
            onChange={(e) => updateField('details', e.target.value)}
            onInput={handleTextareaResize}
            placeholder="상세 내용 입력..."
            className="w-full text-sm text-gray-800 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-zinc-950 p-3 rounded-lg border border-gray-100 dark:border-zinc-800 outline-none resize-none overflow-hidden min-h-[60px]"
          />
        )}
      </div>

      {/* 치료 경위 및 내용 */}
      {(readOnly && data.treatmentHistory) || !readOnly ? (
        <div>
          <span className="block text-xs font-bold text-gray-500 mb-2">치료 경위 및 내용</span>
          {readOnly ? (
            <p className="text-sm text-gray-800 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-zinc-950 p-3 rounded-lg border border-gray-100 dark:border-zinc-800 whitespace-pre-wrap">
              {data.treatmentHistory}
            </p>
          ) : (
            <textarea
              value={data.treatmentHistory}
              onChange={(e) => updateField('treatmentHistory', e.target.value)}
              onInput={handleTextareaResize}
              placeholder="치료 과정 및 현 상태 등..."
              className="w-full text-sm text-gray-800 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-zinc-950 p-3 rounded-lg border border-gray-100 dark:border-zinc-800 outline-none resize-none overflow-hidden min-h-[60px]"
            />
          )}
        </div>
      ) : null}

      {/* 진료 항목 체크박스 */}
      {(readOnly && (data.hospitalization || data.outpatient || data.surgery || data.test)) || !readOnly ? (
        <div>
          <span className="block text-xs font-bold text-gray-500 mb-2">진료 항목</span>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'hospitalization', label: '입원' },
              { id: 'outpatient', label: '통원' },
              { id: 'surgery', label: '수술' },
              { id: 'test', label: '검사' }
            ].map(item => {
              const isChecked = data[item.id as keyof ConsultationData] as boolean;
              if (readOnly && !isChecked) return null;
              
              return (
                <label key={item.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-colors ${readOnly ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' : isChecked ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400 cursor-pointer' : 'bg-white border-gray-200 text-gray-500 dark:bg-zinc-900 dark:border-zinc-700 dark:text-gray-400 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800'}`}>
                  {!readOnly && (
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={isChecked} 
                      onChange={(e) => updateField(item.id as keyof ConsultationData, e.target.checked)} 
                    />
                  )}
                  {item.label}
                </label>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* 가입 보험 */}
      {(readOnly && data.insurances?.length > 0) || !readOnly ? (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500">가입 보험</span>
            {!readOnly && (
              <button onClick={addInsurance} className="text-xs font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                추가
              </button>
            )}
          </div>
          <div className="space-y-2">
            {data.insurances?.map((ins, index) => (
              <div key={ins.id} className="flex flex-col gap-2 p-3 bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 rounded-lg relative group">
                {!readOnly && (
                  <button onClick={() => removeInsurance(ins.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
                
                {readOnly ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 text-[10px] font-bold rounded">{ins.type}</span>
                      <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{ins.company}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>가입년도: {ins.year || '-'}</span>
                      <span>|</span>
                      <span>가입금액: {ins.amount || '-'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 w-full pr-6">
                      <select
                        value={ins.type}
                        onChange={(e) => updateInsurance(ins.id, 'type', e.target.value)}
                        className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-xs rounded px-2 py-1.5 outline-none font-bold"
                      >
                        <option value="상대보험회사">상대보험회사</option>
                        <option value="본인장기보험">본인장기보험</option>
                        <option value="산재/근재">산재/근재</option>
                        <option value="기타보험">기타보험</option>
                      </select>
                      <input
                        type="text"
                        value={ins.company}
                        onChange={(e) => updateInsurance(ins.id, 'company', e.target.value)}
                        placeholder="보험회사명"
                        className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-xs rounded px-2 py-1.5 outline-none font-bold placeholder:font-normal"
                      />
                      <input
                        type="text"
                        value={ins.year}
                        onChange={(e) => updateInsurance(ins.id, 'year', e.target.value)}
                        placeholder="가입년도 (예: 2020)"
                        className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-xs rounded px-2 py-1.5 outline-none"
                      />
                      <input
                        type="text"
                        value={ins.amount}
                        onChange={(e) => updateInsurance(ins.id, 'amount', e.target.value)}
                        placeholder="가입/보장 금액"
                        className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-xs rounded px-2 py-1.5 outline-none"
                      />
                    </div>
                  </>
                )}
              </div>
            ))}
            {!readOnly && data.insurances?.length === 0 && (
              <div className="text-center p-3 text-xs text-gray-400 bg-gray-50 border border-dashed border-gray-200 dark:bg-zinc-900/50 dark:border-zinc-800 rounded-lg">
                등록된 보험 정보가 없습니다. 우측 상단 '추가' 버튼을 눌러주세요.
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* 추가 문의사항 */}
      {(readOnly && data.inquiries) || !readOnly ? (
        <div>
          <span className="block text-xs font-bold text-gray-500 mb-2">추가 문의사항</span>
          {readOnly ? (
            <p className="text-sm text-indigo-800 dark:text-indigo-300 leading-relaxed bg-indigo-50/50 dark:bg-indigo-900/10 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/30 whitespace-pre-wrap">
              {data.inquiries}
            </p>
          ) : (
            <textarea
              value={data.inquiries}
              onChange={(e) => updateField('inquiries', e.target.value)}
              onInput={handleTextareaResize}
              placeholder="문의사항 입력..."
              className="w-full text-sm text-indigo-800 dark:text-indigo-300 leading-relaxed bg-indigo-50/50 dark:bg-indigo-900/10 p-3 rounded-lg border border-indigo-100 dark:border-indigo-900/30 outline-none resize-none overflow-hidden min-h-[60px]"
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
