import React, { useState } from 'react';

export interface InsuranceItem {
  id: string;
  type: string;
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
  const [activeTab, setActiveTab] = useState<'basic' | 'details' | 'insurance'>('basic');
  
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

  const Label = ({ children, required = false }: { children: React.ReactNode, required?: boolean }) => (
    <span className="flex items-center gap-2 text-[13px] font-bold text-gray-800 dark:text-gray-200 mb-2.5">
      <div className="w-1 h-3.5 bg-blue-500 rounded-full"></div>
      <span>
        {children} {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
    </span>
  );

  const boxClass = "w-full text-sm text-gray-800 dark:text-gray-200 bg-gray-50/50 dark:bg-zinc-900 p-4 rounded-xl border border-gray-100 dark:border-zinc-800 min-h-[50px] flex items-center";
  const inputClass = "w-full text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-200 dark:border-zinc-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400 shadow-[0_2px_10px_rgba(0,0,0,0.02)]";
  const textareaClass = "w-full text-sm text-gray-800 dark:text-gray-200 leading-relaxed bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-200 dark:border-zinc-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none overflow-hidden min-h-[100px] placeholder:text-gray-400 shadow-[0_2px_10px_rgba(0,0,0,0.02)]";

  return (
    <div className="w-full flex flex-col h-full">
      {/* 탭 네비게이션 */}
      <div className="flex bg-gray-50 p-1.5 rounded-2xl dark:bg-zinc-900 mb-6 shrink-0 overflow-x-auto custom-scrollbar gap-1 border border-gray-100 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('basic')}
          className={`flex-1 py-2.5 text-[13px] font-bold rounded-xl transition-all whitespace-nowrap px-4 ${activeTab === 'basic' ? 'bg-white shadow-sm text-blue-600 dark:text-blue-400 dark:bg-zinc-800' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          기본 정보
        </button>
        <button
          onClick={() => setActiveTab('details')}
          className={`flex-1 py-2.5 text-[13px] font-bold rounded-xl transition-all whitespace-nowrap px-4 ${activeTab === 'details' ? 'bg-white shadow-sm text-blue-600 dark:text-blue-400 dark:bg-zinc-800' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          사고 내용
        </button>
        <button
          onClick={() => setActiveTab('insurance')}
          className={`flex-1 py-2.5 text-[13px] font-bold rounded-xl transition-all whitespace-nowrap px-4 flex items-center justify-center gap-1.5 ${activeTab === 'insurance' ? 'bg-white shadow-sm text-blue-600 dark:text-blue-400 dark:bg-zinc-800' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
          가입 보험
          {data.insurances?.length > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${activeTab === 'insurance' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
              {data.insurances.length}
            </span>
          )}
        </button>
      </div>

      {/* 탭 콘텐츠 영역 (스크롤 가능) */}
      <div className="space-y-6 pb-6 w-full">
        {/* 1. 기본 정보 탭 */}
        {activeTab === 'basic' && (
          <div className="space-y-6 animate-fade-in">
            {/* 사고원인 */}
            <div>
              <Label required>사고원인</Label>
              {readOnly ? (
                <div className={boxClass}>{data.category}</div>
              ) : (
                <select
                  value={data.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className={inputClass + " appearance-none cursor-pointer"}
                >
                  <option value="교통사고">교통사고</option>
                  <option value="근로재해">근로재해</option>
                  <option value="배상책임">배상책임</option>
                  <option value="기타상해">기타상해</option>
                  <option value="질병">질병</option>
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 사고일자 */}
              <div>
                <Label required>사고일자</Label>
                {readOnly ? (
                  <div className={boxClass}>{data.date}</div>
                ) : (
                  <input
                    type="text"
                    value={data.date}
                    onChange={(e) => updateField('date', e.target.value)}
                    placeholder="연도-월-일"
                    className={inputClass}
                  />
                )}
              </div>
              
              {/* 사고장소 */}
              <div>
                <Label required>사고장소</Label>
                {readOnly ? (
                  <div className={boxClass}>{data.location || '-'}</div>
                ) : (
                  <input
                    type="text"
                    value={data.location}
                    onChange={(e) => updateField('location', e.target.value)}
                    placeholder="예: 서울 강남구 역삼동 교차로"
                    className={inputClass}
                  />
                )}
              </div>
            </div>
            
            {/* 진단병명 */}
            <div>
              <Label required>진단병명</Label>
              {readOnly ? (
                <div className={boxClass}>{data.diagnosis}</div>
              ) : (
                <input
                  type="text"
                  value={data.diagnosis}
                  onChange={(e) => updateField('diagnosis', e.target.value)}
                  placeholder="예: 우측 십자인대 파열, 요추 4-5번 디스크"
                  className={inputClass}
                />
              )}
            </div>
          </div>
        )}

        {/* 2. 사고 내용 탭 */}
        {activeTab === 'details' && (
          <div className="space-y-6 animate-fade-in">
            {/* 사고내용 */}
            <div>
              <div className="mb-2">
                <Label required>사고내용</Label>
                <span className="text-[11px] text-gray-500">사고가 발생한 경위를 육하원칙에 따라 자세히 적어주시면 더 정확한 상담이 가능합니다.</span>
              </div>
              {readOnly ? (
                <div className={`${boxClass} !items-start whitespace-pre-wrap min-h-[100px]`}>
                  {data.details}
                </div>
              ) : (
                <textarea
                  value={data.details}
                  onChange={(e) => updateField('details', e.target.value)}
                  onInput={handleTextareaResize}
                  placeholder="자전거를 타고 횡단보도를 건너던 중 우회전하던 차량과 충돌하였습니다..."
                  className={textareaClass}
                />
              )}
            </div>

            {/* 치료 경위 및 내용 */}
            {(readOnly && data.treatmentHistory) || !readOnly ? (
              <div>
                <Label>치료 경위 및 내용</Label>
                {readOnly ? (
                  <div className={`${boxClass} !items-start whitespace-pre-wrap`}>
                    {data.treatmentHistory}
                  </div>
                ) : (
                  <textarea
                    value={data.treatmentHistory}
                    onChange={(e) => updateField('treatmentHistory', e.target.value)}
                    onInput={handleTextareaResize}
                    placeholder="치료 과정 및 현 상태 등..."
                    className={textareaClass}
                  />
                )}
              </div>
            ) : null}

            {/* 문의사항 */}
            {(readOnly && data.inquiries) || !readOnly ? (
              <div>
                <Label>문의사항 <span className="text-gray-400 font-normal">(선택)</span></Label>
                {readOnly ? (
                  <div className={`${boxClass} !items-start whitespace-pre-wrap`}>
                    {data.inquiries}
                  </div>
                ) : (
                  <textarea
                    value={data.inquiries}
                    onChange={(e) => updateField('inquiries', e.target.value)}
                    onInput={handleTextareaResize}
                    placeholder="가장 궁금하신 점이나 특별히 원하시는 보상 처리 방향이 있다면 적어주세요."
                    className={textareaClass}
                  />
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* 3. 가입 보험 탭 */}
        {activeTab === 'insurance' && (
          <div className="space-y-6 animate-fade-in">
            {/* 가입 보험 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>가입 내역 ({data.insurances?.length || 0}건)</Label>
                {!readOnly && (
                  <button onClick={addInsurance} className="text-xs font-bold text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    추가
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {data.insurances?.map((ins) => (
                  <div key={ins.id} className="flex flex-col gap-2 p-4 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-lg relative group">
                    {!readOnly && (
                      <button onClick={() => removeInsurance(ins.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    )}
                    
                    {readOnly ? (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 text-[10px] font-bold rounded shrink-0">{ins.type}</span>
                          <span className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{ins.year || '-'}년도 가입, {ins.company || '-'} {ins.amount || '-'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full pr-6">
                        <select
                          value={ins.type}
                          onChange={(e) => updateInsurance(ins.id, 'type', e.target.value)}
                          className={inputClass + " py-2"}
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
                          className={inputClass + " py-2"}
                        />
                        <input
                          type="text"
                          value={ins.year}
                          onChange={(e) => updateInsurance(ins.id, 'year', e.target.value)}
                          placeholder="가입년도 (예: 2020)"
                          className={inputClass + " py-2"}
                        />
                        <input
                          type="text"
                          value={ins.amount}
                          onChange={(e) => updateInsurance(ins.id, 'amount', e.target.value)}
                          placeholder="가입/보장 금액"
                          className={inputClass + " py-2"}
                        />
                      </div>
                    )}
                  </div>
                ))}
                {(data.insurances?.length === 0 || !data.insurances) && (
                  <div className="text-center p-6 text-sm text-gray-400 bg-gray-50 border border-dashed border-gray-200 dark:bg-zinc-900/50 dark:border-zinc-800 rounded-lg">
                    {readOnly ? '등록된 보험 정보가 없습니다.' : '등록된 보험 정보가 없습니다. 우측 상단 \'추가\' 버튼을 눌러주세요.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
