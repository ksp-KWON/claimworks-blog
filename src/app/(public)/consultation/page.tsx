'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumBadge from '@/components/ui/PremiumBadge';
import AppIcon, { AppIconName } from '@/components/ui/AppIcon';

const ACCIDENT_TYPES: { id: string; label: string; icon: AppIconName; color: string }[] = [
  { id: '교통사고', label: '교통사고', icon: 'car', color: 'blue' },
  { id: '근로재해', label: '근로재해 (산재/근재)', icon: 'hardhat', color: 'amber' },
  { id: '일반재해', label: '일반재해 (배상책임)', icon: 'scale', color: 'rose' },
  { id: '질병사고', label: '질병·실손 (개인보험)', icon: 'hospital', color: 'emerald' },
];

export default function ConsultationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(true);
  
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

  const handleTypeSelect = (type: string) => {
    setFormData(prev => ({ ...prev, accident_type: type }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!privacyAgreed) {
      alert('상담 진행을 위해 개인정보 수집 및 이용에 동의해 주세요.');
      return;
    }

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
      
      // 알림 전송 (에러가 나도 사용자 흐름에는 영향 없도록 catch 처리)
      fetch('/api/push/notify', {
        method: 'POST',
        body: JSON.stringify({
          title: '새로운 1:1 손해사정 상담 접수',
          body: `${formData.name}님의 [${formData.accident_type}] 상담이 접수되었습니다.`,
          url: '/admin'
        }),
        headers: { 'Content-Type': 'application/json' }
      }).catch(console.error);

      setIsSuccess(true);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error('Submission error:', err);
      alert('상담 접수 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 py-2.5 px-3.5 text-xs sm:text-sm font-medium text-gray-900 dark:text-white rounded-none focus:border-blue-500 focus:outline-none transition-colors placeholder-gray-400";
  const labelClass = "block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5";

  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <PremiumCard borderColor="green" hoverEffect={false} watermarkIcon="shield-check" className="!p-8 sm:!p-10 text-center space-y-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <AppIcon name="check" size={32} />
          </div>
          <div className="space-y-2">
            <PremiumHeading level={1} gradient="green" showLeftBorder={false} className="justify-center !text-2xl">
              1:1 무료 상담 접수 완료
            </PremiumHeading>
            <p className="text-xs sm:text-[13.5px] text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed font-medium">
              상담 신청이 성공적으로 접수되었습니다.<br />
              공인 손해사정사가 기재해 주신 내용을 사전 정밀 분석한 후,<br />
              남겨주신 연락처(<strong className="text-gray-900 dark:text-white">{formData.phone}</strong>)로 신속히 연락드리겠습니다.
            </p>
          </div>

          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 text-left text-xs space-y-1.5 text-emerald-950 dark:text-emerald-300">
            <div className="font-bold flex items-center gap-1.5">
              <AppIcon name="shield-check" size={14} className="text-emerald-600" />
              보상스쿨의 약속
            </div>
            <p className="text-[11.5px] opacity-90 leading-relaxed">
              접수된 모든 사고 정보는 담당 손해사정사 1인만 비공개로 열람하며, 불필요한 영업 및 스팸 전화는 일체 드리지 않습니다.
            </p>
          </div>

          <div className="pt-2">
            <Link 
              href="/" 
              className="inline-flex items-center justify-center w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all cursor-pointer shadow-md shadow-emerald-500/20"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </PremiumCard>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* 상단 브레드크럼 */}
      <nav className="flex text-xs text-[#5f6368] dark:text-[#9aa0a6]" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1.5">
          <li><Link href="/" className="hover:text-[var(--google-blue)] transition-colors">홈</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="text-[#202124] dark:text-[#e8eaed] font-medium" aria-current="page">1:1 무료 상담 신청</li>
        </ol>
      </nav>

      {/* 헤더 배너 */}
      <PremiumCard borderColor="blue" hoverEffect={false} watermarkIcon="chat" className="!p-6 sm:!p-8">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <PremiumBadge color="blue">국가공인 손해사정사 직접 검토</PremiumBadge>
            <PremiumBadge color="green">100% 비밀 보장</PremiumBadge>
          </div>
          <PremiumHeading 
            level={1} 
            gradient="blue" 
            showLeftBorder={false}
            icon={<AppIcon name="chat" size={24} className="text-blue-600 dark:text-blue-400 shrink-0" />}
            className="!mb-2 !text-xl sm:!text-2xl"
          >
            보상스쿨 1:1 무료 정밀 상담 신청
          </PremiumHeading>
          <p className="text-xs sm:text-[13.5px] text-[#5f6368] dark:text-[#9aa0a6] font-medium leading-relaxed break-keep">
            보험사의 일방적인 삭감·면책 주장, 혼자 고민하지 마세요. 손해사정사가 사고 경위와 의학적 판례를 사전에 정밀 분석하여 명쾌한 권익 수호 솔루션을 제시해 드립니다.
          </p>
        </div>
      </PremiumCard>

      {/* 폼 컨테이너 */}
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* STEP 1: 신청인 기본 정보 */}
        <PremiumCard borderColor="blue" hoverEffect={false} className="!p-5 sm:!p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">STEP 01</span>
              <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">신청인 기본 정보</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className={labelClass}>
                고객 성함 <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                name="name" 
                id="name" 
                required
                className={inputClass}
                placeholder="홍길동"
                value={formData.name} 
                onChange={handleChange} 
              />
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>
                전화번호 <span className="text-red-500">*</span>
              </label>
              <input 
                type="tel" 
                name="phone" 
                id="phone" 
                required
                className={inputClass}
                placeholder="010-1234-5678"
                value={formData.phone} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="birth_date" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                생년월일 <span className="text-gray-400 font-normal">(선택)</span>
              </label>
              <span className="text-[11px] text-gray-400 font-medium">대법원 호프만 취업가능연한 산정용</span>
            </div>
            <input 
              type="date" 
              name="birth_date" 
              id="birth_date"
              className={inputClass}
              value={formData.birth_date} 
              onChange={handleChange} 
            />
          </div>
        </PremiumCard>

        {/* STEP 2: 사고 및 진단 상세 (손해사정 사전 분석용) */}
        <PremiumCard borderColor="indigo" hoverEffect={false} className="!p-5 sm:!p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded">STEP 02</span>
              <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">사고 및 진단 상세 내용</h2>
            </div>
            <span className="text-[11px] text-gray-400 font-medium">손해사정 사전 정밀 분석</span>
          </div>

          {/* 사고 원인 4대 칩 선택 */}
          <div>
            <label className={labelClass}>
              사고 원인 / 분쟁 유형 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ACCIDENT_TYPES.map(type => {
                const isActive = formData.accident_type === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleTypeSelect(type.id)}
                    className={`p-2.5 text-center border transition-all cursor-pointer ${
                      isActive
                        ? 'border-indigo-600 bg-indigo-50/90 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs'
                        : 'border-gray-200 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-900/60 text-gray-600 dark:text-zinc-400 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex justify-center mb-1">
                      <AppIcon name={type.icon} size={16} />
                    </div>
                    <div className="text-xs">{type.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 사고 일자 & 사고 장소 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="accident_date" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  사고 일자 <span className="text-red-500">*</span>
                </label>
                <span className="text-[10.5px] text-gray-400">소멸시효(3년) 확인</span>
              </div>
              <input 
                type="date" 
                name="accident_date" 
                id="accident_date" 
                required
                className={inputClass}
                value={formData.accident_date} 
                onChange={handleChange} 
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="accident_location" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  사고 장소 <span className="text-red-500">*</span>
                </label>
                <span className="text-[10.5px] text-gray-400">과실비율 판단</span>
              </div>
              <input 
                type="text" 
                name="accident_location" 
                id="accident_location" 
                required
                className={inputClass}
                placeholder="예: 서울 강남구 역삼역 교차로"
                value={formData.accident_location} 
                onChange={handleChange} 
              />
            </div>
          </div>

          {/* 진단 병명 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="diagnosis" className="text-xs font-bold text-gray-700 dark:text-gray-300">
                진단 병명 <span className="text-red-500">*</span>
              </label>
              <span className="text-[10.5px] text-gray-400">질병분류코드·후유장해 판정</span>
            </div>
            <input 
              type="text" 
              name="diagnosis" 
              id="diagnosis" 
              required
              className={inputClass}
              placeholder="예: 우측 무릎 전방십자인대 파열, 뇌경색증(I63), 요추 추간판탈출증"
              value={formData.diagnosis} 
              onChange={handleChange} 
            />
          </div>

          {/* 사고 내용 */}
          <div>
            <label htmlFor="content" className={labelClass}>
              사고 경위 및 내용 <span className="text-red-500">*</span>
            </label>
            <textarea 
              name="content" 
              id="content" 
              rows={3} 
              required
              className={`${inputClass} leading-relaxed`}
              placeholder="사고가 발생한 경위와 현재 치료 상태, 보험사의 주장 등을 자유롭게 적어주세요."
              value={formData.content} 
              onChange={handleChange} 
            />
          </div>

          {/* 문의 사항 */}
          <div>
            <label htmlFor="inquiry" className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">
              궁금하신 점 / 요청 사항 <span className="text-gray-400 font-normal">(선택)</span>
            </label>
            <textarea 
              name="inquiry" 
              id="inquiry" 
              rows={2}
              className={`${inputClass} leading-relaxed`}
              placeholder="보험금 지급 거절 사유, 예상 손해액 산정 등 가장 궁금하신 쟁점을 적어주세요."
              value={formData.inquiry} 
              onChange={handleChange} 
            />
          </div>
        </PremiumCard>

        {/* STEP 3: 3대 안심 보장 & 개인정보 수집 동의 */}
        <PremiumCard borderColor="green" hoverEffect={false} className="!p-5 sm:!p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 dark:border-zinc-800 pb-3">
            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">STEP 03</span>
            <h2 className="text-sm font-extrabold text-gray-900 dark:text-white">보상스쿨 3대 고객 안심 보장</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center">
            <div className="p-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 space-y-1">
              <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center justify-center gap-1">
                <AppIcon name="shield-check" size={13} className="text-emerald-600" />
                스팸·영업 전화 0%
              </div>
              <div className="text-[10.5px] text-gray-500">상담 완료 후 무단 마케팅 절대 금지</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 space-y-1">
              <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center justify-center gap-1">
                <AppIcon name="lock" size={13} className="text-emerald-600" />
                100% 비밀 보장
              </div>
              <div className="text-[10.5px] text-gray-500">담당 손해사정사 1인만 비공개 열람</div>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 space-y-1">
              <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center justify-center gap-1">
                <AppIcon name="trash" size={13} className="text-emerald-600" />
                3개월 후 영구 파기
              </div>
              <div className="text-[10.5px] text-gray-500">목적 달성 시 안전하게 자동 파기</div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-zinc-800">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={privacyAgreed} 
                onChange={e => setPrivacyAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-600 rounded-none border-gray-300 focus:ring-0 cursor-pointer" 
              />
              <span className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                <strong>[필수] 개인정보 수집 및 이용 동의</strong>
                <span className="block text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  수집항목: 성명, 연락처, 상담내용 / 이용목적: 손해사정 1:1 무료 상담 및 권익 분석 / 보유기간: 상담 완료 후 3개월 (또는 요청 시 즉시 파기)
                </span>
              </span>
            </label>
          </div>
        </PremiumCard>

        {/* 접수 버튼 */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !privacyAgreed}
            className="w-full flex justify-center items-center gap-2 py-4 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm sm:text-base tracking-wide transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                사전 분석 접수 중...
              </>
            ) : (
              <>
                <AppIcon name="send" size={18} />
                손해사정사 1:1 무료 정밀 상담 신청하기
              </>
            )}
          </button>
          <p className="text-center text-[11px] text-[#5f6368] dark:text-[#9aa0a6] mt-3 font-medium">
            신청해 주시면 공인 손해사정사가 기재해 주신 내용을 면밀히 검토한 후 빠르게 연락드립니다.
          </p>
        </div>
      </form>
    </div>
  );
}
