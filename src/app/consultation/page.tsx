'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ConsultationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    birth_date: '',
    accident_type: '교통사고',
    accident_date: '',
    accident_location: '',
    diagnosis: '',
    content: '',
    inquiry: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('consultations')
        .insert([{
          name: formData.name,
          phone: formData.phone,
          birth_date: formData.birth_date || null,
          accident_type: formData.accident_type,
          accident_date: formData.accident_date,
          accident_location: formData.accident_location,
          diagnosis: formData.diagnosis,
          content: formData.content,
          inquiry: formData.inquiry || null,
          status: '대기'
        }]);

      if (error) throw error;
      
      setIsSuccess(true);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('Submission error:', err);
      alert('상담 접수 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "mt-1.5 block w-full rounded-none border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/2 focus:outline-none focus:border-[var(--google-blue)] focus:ring-1 focus:ring-[var(--google-blue)] text-gray-900 dark:text-white text-sm font-medium shadow-inner px-4 py-3 sm:py-3.5 transition-colors placeholder-gray-400 dark:placeholder-gray-500";
  const labelClass = "block text-sm font-extrabold text-[#202124] dark:text-[#e8eaed] tracking-tight";

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#111111] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white dark:bg-[#202124] p-10 rounded-none shadow-xl border border-gray-200 dark:border-white/10 text-center space-y-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 bg-blue-50 dark:bg-blue-900/20 text-[var(--google-blue)] dark:text-blue-400 border border-blue-100 dark:border-blue-800/30">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#202124] dark:text-[#e8eaed] tracking-tight">접수 완료</h2>
            <p className="mt-3 text-sm text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed font-medium">
              상담 신청이 성공적으로 접수되었습니다.<br/>
              전문 손해사정사가 내용을 확인한 후, 기재해주신 연락처로 빠르게 안내해 드리겠습니다.
            </p>
          </div>
          <div className="pt-4 border-t border-gray-100 dark:border-white/5">
            <a href="/" className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-none shadow-sm text-sm font-black tracking-wide text-[var(--google-blue)] bg-blue-50 hover:bg-blue-100 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white transition-colors cursor-pointer">
              홈으로 돌아가기
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111111]">
      <div className="max-w-4xl mx-auto bg-white dark:bg-[#1a1a1a] shadow-xl overflow-hidden min-h-screen flex flex-col border-x border-gray-200 dark:border-white/5">
        
        {/* 상단 띠 배너 */}
        <div className="bg-[var(--google-blue)] text-white px-5 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-lg shrink-0">💡</span>
            <div className="text-xs sm:text-sm font-extrabold tracking-tight">
              <span className="underline decoration-wavy mr-1.5">[전문 상담]</span>
              보상스쿨의 전문 손해사정사가 직접 확인하고 명쾌한 답변을 드립니다.
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-10 space-y-8 flex-1">
          {/* 헤더 섹션 */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 pb-4 text-center md:text-left">
            <div className="shrink-0">
              <div className="bg-white px-6 py-4 shadow-sm border border-gray-100 dark:border-white/10">
                <img src="/logo.png" alt="보상스쿨 로고" className="h-12 sm:h-14 object-contain" />
              </div>
            </div>
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202124] dark:text-[#e8eaed] tracking-tight">
                보상스쿨 <span className="text-[var(--google-blue)]">무료 상담 신청</span>
              </h1>
              <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed font-medium mt-3">
                보험사의 억울한 거절과 삭감 주장, 보상스쿨과 함께라면 방어할 수 있습니다.<br className="hidden md:block"/>
                아래 양식을 작성해 주시면 가장 빠르고 정확한 상담이 가능합니다.
              </p>
            </div>
          </div>

          {/* 폼 영역 */}
          <div className="flex flex-col border border-gray-200 dark:border-white/10 rounded-none bg-white dark:bg-[#202124] shadow-sm">
            <div className="bg-gray-50 dark:bg-white/2 px-6 py-4 border-b border-gray-200 dark:border-white/10">
              <h3 className="text-base font-black text-[#202124] dark:text-[#e8eaed] tracking-tight flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[var(--google-blue)] inline-block"></span>
                기본 정보 및 사고 내용 입력
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              
              {/* 기본 정보 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className={labelClass}>고객성함 <span className="text-[var(--google-red)] ml-0.5">*</span></label>
                  <input type="text" name="name" id="name" required
                    className={inputClass}
                    placeholder="홍길동"
                    value={formData.name} onChange={handleChange} />
                </div>
                <div>
                  <label htmlFor="phone" className={labelClass}>전화번호 <span className="text-[var(--google-red)] ml-0.5">*</span></label>
                  <input type="tel" name="phone" id="phone" required
                    className={inputClass}
                    placeholder="010-1234-5678"
                    value={formData.phone} onChange={handleChange} />
                </div>
              </div>

              <div>
                <label htmlFor="birth_date" className={labelClass}>생년월일 <span className="text-[#9aa0a6] font-medium text-xs ml-1">(선택)</span></label>
                <input type="date" name="birth_date" id="birth_date"
                  className={`${inputClass} sm:w-1/2`}
                  value={formData.birth_date} onChange={handleChange} />
              </div>

              <div className="h-px bg-gray-100 dark:bg-white/5 my-8"></div>

              {/* 사고 정보 */}
              <div>
                <label htmlFor="accident_type" className={labelClass}>사고원인 <span className="text-[var(--google-red)] ml-0.5">*</span></label>
                <select name="accident_type" id="accident_type" required
                  className={inputClass}
                  value={formData.accident_type} onChange={handleChange}>
                  <option value="교통사고">교통사고</option>
                  <option value="근로재해">근로재해 (산재/근재)</option>
                  <option value="일반재해">일반재해 (배상책임 등)</option>
                  <option value="질병사고">질병사고 (개인보험)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="accident_date" className={labelClass}>사고일자 <span className="text-[var(--google-red)] ml-0.5">*</span></label>
                  <input type="date" name="accident_date" id="accident_date" required
                    className={inputClass}
                    value={formData.accident_date} onChange={handleChange} />
                </div>
                <div>
                  <label htmlFor="accident_location" className={labelClass}>사고장소 <span className="text-[var(--google-red)] ml-0.5">*</span></label>
                  <input type="text" name="accident_location" id="accident_location" required
                    className={inputClass}
                    placeholder="예: 서울 강남구 역삼동 교차로"
                    value={formData.accident_location} onChange={handleChange} />
                </div>
              </div>

              <div>
                <label htmlFor="diagnosis" className={labelClass}>진단병명 <span className="text-[var(--google-red)] ml-0.5">*</span></label>
                <input type="text" name="diagnosis" id="diagnosis" required
                  className={inputClass}
                  placeholder="예: 우측 십자인대 파열, 요추 4-5번 디스크"
                  value={formData.diagnosis} onChange={handleChange} />
              </div>

              <div>
                <label htmlFor="content" className={labelClass}>사고내용 <span className="text-[var(--google-red)] ml-0.5">*</span></label>
                <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] mt-1 mb-2 font-medium">사고가 발생한 경위를 육하원칙에 따라 자세히 적어주시면 더 정확한 상담이 가능합니다.</p>
                <textarea name="content" id="content" rows={4} required
                  className={`${inputClass} py-3`}
                  placeholder="자전거를 타고 횡단보도를 건너던 중 우회전하던 차량과 충돌하였습니다..."
                  value={formData.content} onChange={handleChange} />
              </div>

              <div>
                <label htmlFor="inquiry" className={labelClass}>문의사항 <span className="text-[#9aa0a6] font-medium text-xs ml-1">(선택)</span></label>
                <textarea name="inquiry" id="inquiry" rows={3}
                  className={`${inputClass} py-3`}
                  placeholder="가장 궁금하신 점이나 특별히 원하시는 보상 처리 방향이 있다면 적어주세요."
                  value={formData.inquiry} onChange={handleChange} />
              </div>

              <div className="pt-6 border-t border-gray-100 dark:border-white/5 mt-8">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-none shadow-md text-base font-black text-white tracking-wide bg-[var(--google-blue)] hover:bg-[#174ea6] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      접수 중...
                    </>
                  ) : (
                    '무료 상담 접수하기'
                  )}
                </button>
                <p className="text-center text-[11px] text-[#5f6368] dark:text-[#9aa0a6] mt-4 font-bold">
                  접수된 정보는 개인정보 보호법에 따라 안전하게 보호되며, 상담 목적으로만 활용됩니다.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
