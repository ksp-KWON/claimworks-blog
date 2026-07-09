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

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-[#202124] p-10 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] text-center border border-gray-100 dark:border-white/5 relative overflow-hidden group/headerbox transition-all duration-300 hover:shadow-[0_16px_50px_rgba(26,115,232,0.2)] hover:border-[var(--google-blue)]">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30">
            <svg className="h-10 w-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">접수 완료</h2>
          <p className="mt-2 text-sm text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed">
            상담 신청이 성공적으로 접수되었습니다.<br/>
            전문 손해사정사가 내용을 확인한 후, 기재해주신 연락처로 빠르게 안내해 드리겠습니다.
          </p>
          <div className="mt-8">
            <a href="/" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-[var(--google-blue)] hover:opacity-90 focus:outline-none transition-colors">
              홈으로 돌아가기
            </a>
          </div>
        </div>
      </div>
    );
  }

  const inputClass = "mt-1 block w-full rounded-md border-gray-300 dark:border-[#5f6368] shadow-sm focus:border-[var(--google-blue)] focus:ring-[var(--google-blue)] sm:text-sm px-4 py-2.5 border bg-white dark:bg-[#303134] text-gray-900 dark:text-white transition-colors placeholder-gray-400 dark:placeholder-gray-500";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10 bg-white dark:bg-[#202124] p-6 sm:p-8 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] border border-gray-100 dark:border-white/5 relative overflow-hidden group/headerbox transition-all duration-300 hover:shadow-[0_16px_50px_rgba(26,115,232,0.2)] hover:border-[var(--google-blue)]">
          <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2 border-l-4 border-[var(--google-blue)] pl-3 mb-4">
            <span className="bg-gradient-to-r from-[#0d47a1] to-[#669df6] dark:from-[#669df6] dark:to-[#aecbfa] bg-clip-text text-transparent">
              무료 상담 신청
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg leading-relaxed text-[#5f6368] dark:text-[#9aa0a6] font-medium break-keep">
            보상스쿨의 전문 손해사정사가 직접 확인하고 명쾌한 답변을 드립니다.<br className="hidden sm:block"/>
            아래 양식을 작성해 주시면 가장 빠르고 정확한 상담이 가능합니다.
          </p>
        </div>

        <div className="bg-white dark:bg-[#202124] shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] rounded-2xl overflow-hidden border border-gray-100 dark:border-white/5">
          <div className="bg-[var(--google-blue)] px-6 py-4">
            <h3 className="text-lg font-bold text-white">기본 정보 및 사고 내용 입력</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            
            {/* 기본 정보 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className={labelClass}>고객성함 <span className="text-[var(--google-red)]">*</span></label>
                <input type="text" name="name" id="name" required
                  className={inputClass}
                  placeholder="홍길동"
                  value={formData.name} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>전화번호 <span className="text-[var(--google-red)]">*</span></label>
                <input type="tel" name="phone" id="phone" required
                  className={inputClass}
                  placeholder="010-1234-5678"
                  value={formData.phone} onChange={handleChange} />
              </div>
            </div>

            <div>
              <label htmlFor="birth_date" className={labelClass}>생년월일 <span className="text-[#5f6368] dark:text-[#9aa0a6] font-normal">(선택)</span></label>
              <input type="date" name="birth_date" id="birth_date"
                className={`${inputClass} sm:w-1/2`}
                value={formData.birth_date} onChange={handleChange} />
            </div>

            <hr className="border-gray-200 dark:border-white/10" />

            {/* 사고 정보 */}
            <div>
              <label htmlFor="accident_type" className={labelClass}>사고원인 <span className="text-[var(--google-red)]">*</span></label>
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
                <label htmlFor="accident_date" className={labelClass}>사고일자 <span className="text-[var(--google-red)]">*</span></label>
                <input type="date" name="accident_date" id="accident_date" required
                  className={inputClass}
                  value={formData.accident_date} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="accident_location" className={labelClass}>사고장소 <span className="text-[var(--google-red)]">*</span></label>
                <input type="text" name="accident_location" id="accident_location" required
                  className={inputClass}
                  placeholder="예: 서울 강남구 역삼동 교차로"
                  value={formData.accident_location} onChange={handleChange} />
              </div>
            </div>

            <div>
              <label htmlFor="diagnosis" className={labelClass}>진단병명 <span className="text-[var(--google-red)]">*</span></label>
              <input type="text" name="diagnosis" id="diagnosis" required
                className={inputClass}
                placeholder="예: 우측 십자인대 파열, 요추 4-5번 디스크"
                value={formData.diagnosis} onChange={handleChange} />
            </div>

            <div>
              <label htmlFor="content" className={labelClass}>사고내용 <span className="text-[var(--google-red)]">*</span></label>
              <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-1 mb-2">사고가 발생한 경위를 육하원칙에 따라 자세히 적어주시면 더 정확한 상담이 가능합니다.</p>
              <textarea name="content" id="content" rows={4} required
                className={`${inputClass} py-3`}
                placeholder="자전거를 타고 횡단보도를 건너던 중 우회전하던 차량과 충돌하였습니다..."
                value={formData.content} onChange={handleChange} />
            </div>

            <div>
              <label htmlFor="inquiry" className={labelClass}>문의사항 <span className="text-[#5f6368] dark:text-[#9aa0a6] font-normal">(선택)</span></label>
              <textarea name="inquiry" id="inquiry" rows={3}
                className={`${inputClass} py-3`}
                placeholder="가장 궁금하신 점이나 특별히 원하시는 보상 처리 방향이 있다면 적어주세요."
                value={formData.inquiry} onChange={handleChange} />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-lg shadow-sm text-lg font-bold text-white bg-[var(--google-blue)] hover:opacity-90 focus:outline-none transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? '접수 중...' : '무료 상담 접수하기'}
              </button>
              <p className="text-center text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-4 font-medium">
                접수된 정보는 개인정보 보호법에 따라 안전하게 보호되며, 상담 목적으로만 활용됩니다.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
