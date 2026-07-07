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
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">접수 완료</h2>
          <p className="mt-2 text-sm text-gray-600">
            상담 신청이 성공적으로 접수되었습니다.<br/>
            전문 손해사정사가 내용을 확인한 후, 기재해주신 연락처로 빠르게 안내해 드리겠습니다.
          </p>
          <div className="mt-8">
            <a href="/" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
              홈으로 돌아가기
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            무료 상담 신청
          </h2>
          <p className="mt-4 text-lg leading-6 text-gray-600">
            보상스쿨의 전문 손해사정사가 직접 확인하고 명쾌한 답변을 드립니다.<br className="hidden sm:block"/>
            아래 양식을 작성해 주시면 가장 빠르고 정확한 상담이 가능합니다.
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100">
          <div className="bg-blue-600 px-6 py-4">
            <h3 className="text-lg font-medium text-white">기본 정보 및 사고 내용 입력</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            
            {/* 기본 정보 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">고객성함 <span className="text-red-500">*</span></label>
                <input type="text" name="name" id="name" required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2.5 border bg-white"
                  placeholder="홍길동"
                  value={formData.name} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">전화번호 <span className="text-red-500">*</span></label>
                <input type="tel" name="phone" id="phone" required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2.5 border bg-white"
                  placeholder="010-1234-5678"
                  value={formData.phone} onChange={handleChange} />
              </div>
            </div>

            <div>
              <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700">생년월일 <span className="text-gray-400 font-normal">(선택)</span></label>
              <input type="date" name="birth_date" id="birth_date"
                className="mt-1 block w-full sm:w-1/2 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2.5 border bg-white text-gray-900"
                value={formData.birth_date} onChange={handleChange} />
            </div>

            <hr className="border-gray-200" />

            {/* 사고 정보 */}
            <div>
              <label htmlFor="accident_type" className="block text-sm font-medium text-gray-700">사고원인 <span className="text-red-500">*</span></label>
              <select name="accident_type" id="accident_type" required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2.5 border bg-white"
                value={formData.accident_type} onChange={handleChange}>
                <option value="교통사고">교통사고</option>
                <option value="근로재해">근로재해 (산재/근재)</option>
                <option value="일반재해">일반재해 (배상책임 등)</option>
                <option value="질병사고">질병사고 (개인보험)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="accident_date" className="block text-sm font-medium text-gray-700">사고일자 <span className="text-red-500">*</span></label>
                <input type="date" name="accident_date" id="accident_date" required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2.5 border bg-white text-gray-900"
                  value={formData.accident_date} onChange={handleChange} />
              </div>
              <div>
                <label htmlFor="accident_location" className="block text-sm font-medium text-gray-700">사고장소 <span className="text-red-500">*</span></label>
                <input type="text" name="accident_location" id="accident_location" required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2.5 border bg-white"
                  placeholder="예: 서울 강남구 역삼동 교차로"
                  value={formData.accident_location} onChange={handleChange} />
              </div>
            </div>

            <div>
              <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700">진단병명 <span className="text-red-500">*</span></label>
              <input type="text" name="diagnosis" id="diagnosis" required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2.5 border bg-white"
                placeholder="예: 우측 십자인대 파열, 요추 4-5번 디스크"
                value={formData.diagnosis} onChange={handleChange} />
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700">사고내용 <span className="text-red-500">*</span></label>
              <p className="text-xs text-gray-500 mt-1 mb-2">사고가 발생한 경위를 육하원칙에 따라 자세히 적어주시면 더 정확한 상담이 가능합니다.</p>
              <textarea name="content" id="content" rows={4} required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-3 border bg-white"
                placeholder="자전거를 타고 횡단보도를 건너던 중 우회전하던 차량과 충돌하였습니다..."
                value={formData.content} onChange={handleChange} />
            </div>

            <div>
              <label htmlFor="inquiry" className="block text-sm font-medium text-gray-700">문의사항 <span className="text-gray-400 font-normal">(선택)</span></label>
              <textarea name="inquiry" id="inquiry" rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-3 border bg-white"
                placeholder="가장 궁금하신 점이나 특별히 원하시는 보상 처리 방향이 있다면 적어주세요."
                value={formData.inquiry} onChange={handleChange} />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-lg shadow-sm text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? '접수 중...' : '무료 상담 접수하기'}
              </button>
              <p className="text-center text-xs text-gray-500 mt-4">
                접수된 정보는 개인정보 보호법에 따라 안전하게 보호되며, 상담 목적으로만 활용됩니다.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
