import React from 'react';

export interface ConsultationData {
  category: string;
  diagnosis: string;
  date: string;
  location: string;
  details: string;
  inquiries: string;
}

interface Props {
  data: ConsultationData;
  onChange?: (data: ConsultationData) => void;
  readOnly?: boolean;
}

export default function ConsultationDetailCard({ data, onChange, readOnly = true }: Props) {
  
  const updateField = (field: keyof ConsultationData, value: string) => {
    if (onChange) {
      onChange({ ...data, [field]: value });
    }
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
