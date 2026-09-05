'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import PremiumCard from '@/components/ui/PremiumCard';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumBadge from '@/components/ui/PremiumBadge';
import PremiumHeaderBanner from '@/components/ui/PremiumHeaderBanner';
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
    income: '',
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
      const payload: any = {
        name: formData.name,
        phone: formData.phone,
        birth_date: formData.birth_date || null,
        income: formData.income || null,
        accident_type: formData.accident_type,
        accident_date: formData.accident_date,
        accident_location: formData.accident_location,
        diagnosis: formData.diagnosis,
        content: formData.content,
        inquiry: formData.inquiry || null,
        status: '대기'
      };

      let { error } = await supabase.from('consultations').insert([payload]);

      // 만약 DB 스키마에 income 컬럼이 없는 경우의 안전한 Fallback
      if (error && error.message?.includes('income')) {
        delete payload.income;
        if (formData.income) {
          payload.content = `[사전 소득정보: ${formData.income}]\n` + payload.content;
        }
        const retry = await supabase.from('consultations').insert([payload]);
        if (retry.error) throw retry.error;
      } else if (error) {
        throw error;
      }
      
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

  const inputClass = "w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 py-3 px-3.5 text-sm font-bold text-gray-900 dark:text-white rounded-none focus:border-blue-500 focus:outline-none transition-colors placeholder-gray-400";
  const labelHeaderClass = "flex items-center justify-between mb-2.5";
  const labelTextClass = "text-xs sm:text-[13.5px] font-extrabold text-gray-900 dark:text-gray-100 select-none";
  const labelSubClass = "text-[11px] text-gray-400 dark:text-zinc-500 font-medium select-none";

  if (isSuccess) {
    return (
      <div className="w-full py-8">
        <PremiumCard borderColor="green" hoverEffect={true} watermarkIcon="shield-check" className="!p-8 sm:!p-12 text-center space-y-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <AppIcon name="check" size={32} />
          </div>
          <div className="space-y-2">
            <PremiumHeading level={1} gradient="green" showLeftBorder={false} className="justify-center !text-2xl sm:!text-3xl">
              1:1 무료 상담 접수 완료
            </PremiumHeading>
            <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] leading-relaxed font-medium max-w-xl mx-auto">
              상담 신청이 성공적으로 접수되었습니다.<br />
              공인 손해사정사가 기재해 주신 내용을 사전 정밀 분석한 후,<br />
              남겨주신 연락처(<strong className="text-gray-900 dark:text-white">{formData.phone}</strong>)로 신속히 연락드리겠습니다.
            </p>
          </div>

          <div className="p-4 sm:p-5 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/40 text-left text-xs sm:text-sm space-y-1.5 text-emerald-950 dark:text-emerald-300 max-w-xl mx-auto">
            <div className="font-extrabold flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
              <AppIcon name="shield-check" size={16} className="text-emerald-600" />
              보상스쿨의 약속
            </div>
            <p className="text-xs sm:text-[13px] opacity-90 leading-relaxed font-medium">
              접수된 모든 사고 정보는 담당 손해사정사 1인만 비공개로 열람하며, 불필요한 영업 및 스팸 전화는 일체 드리지 않습니다.
            </p>
          </div>

          <div className="pt-3 max-w-md mx-auto">
            <Link 
              href="/" 
              className="inline-flex items-center justify-center w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-base font-extrabold transition-all cursor-pointer shadow-md shadow-emerald-500/20"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </PremiumCard>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* 상단 브레드크럼 */}
      <nav className="flex text-xs text-[#5f6368] dark:text-[#9aa0a6]" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1.5">
          <li><Link href="/" className="hover:text-[var(--google-blue)] transition-colors">홈</Link></li>
          <li><span className="mx-1">/</span></li>
          <li className="text-[#202124] dark:text-[#e8eaed] font-medium" aria-current="page">1:1 무료 상담 신청</li>
        </ol>
      </nav>

      {/* 헤더 배너 */}
      <PremiumHeaderBanner
        theme="blue"
        icon="chat"
        title="보상스쿨 1:1 무료 상담 신청"
        badges={['국가공인 손해사정사 직접 검토', { text: '상담 내용 철저한 비밀 유지', color: 'green' }]}
        description="보험사의 일방적인 삭감·면책 주장, 혼자 고민하지 마세요. 손해사정사가 사고 경위와 의학적 판례를 사전에 정밀 분석하여 명쾌한 권익 수호 솔루션을 제시해 드립니다."
      />

      {/* 폼 컨테이너 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* STEP 1: 신청인 기본 정보 */}
        <PremiumCard borderColor="blue" hoverEffect={true} className="!p-5 sm:!p-7 overflow-hidden">
          {/* STEP 1 그라데이션 제목 헤더 바 */}
          <div className="-mx-5 -mt-5 sm:-mx-7 sm:-mt-7 px-5 py-3.5 sm:px-7 sm:py-4 bg-gradient-to-r from-blue-50 via-indigo-50/60 to-transparent dark:from-blue-950/50 dark:via-indigo-950/30 dark:to-transparent border-b border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-zinc-800 px-2 py-0.5 border border-blue-200/80 dark:border-blue-800/80">STEP 01</span>
              <h2 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                <AppIcon name="user" size={16} className="text-blue-600 dark:text-blue-400" />
                신청인 기본 정보
              </h2>
            </div>
            <span className="text-xs text-gray-400 font-medium hidden sm:inline-block">기본 인적사항</span>
          </div>

          {/* 내부 폼 요소 컨테이너 (정확한 space-y-6 간격 보장) */}
          <div className="space-y-6 pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <div className={labelHeaderClass}>
                  <label htmlFor="name" className={labelTextClass}>
                    고객 성함 <span className="text-red-500">*</span>
                  </label>
                  <span className={labelSubClass}>안심 실명 확인</span>
                </div>
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
                <div className={labelHeaderClass}>
                  <label htmlFor="phone" className={labelTextClass}>
                    전화번호 <span className="text-red-500">*</span>
                  </label>
                  <span className={labelSubClass}>상담 안내용 연락처</span>
                </div>
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

            {/* 생년월일 & 월 소득 (2열 균형 배치) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <div className={labelHeaderClass}>
                  <label htmlFor="birth_date" className={labelTextClass}>
                    생년월일 <span className="text-gray-400 font-normal">(선택)</span>
                  </label>
                  <span className={labelSubClass}>호프만 취업연한 산정용</span>
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

              <div>
                <div className={labelHeaderClass}>
                  <label htmlFor="income" className={labelTextClass}>
                    월 평균 소득 <span className="text-gray-400 font-normal">(선택)</span>
                  </label>
                  <span className={labelSubClass}>휴업손해·일실수입 산정용</span>
                </div>
                <input 
                  type="text" 
                  name="income" 
                  id="income"
                  className={inputClass}
                  placeholder="예: 3,500,000"
                  value={formData.income} 
                  onChange={handleChange} 
                />
              </div>
            </div>
          </div>
        </PremiumCard>

        {/* STEP 2: 사고 및 진단 상세 (손해사정 사전 분석용) */}
        <PremiumCard borderColor="indigo" hoverEffect={true} className="!p-5 sm:!p-7 overflow-hidden">
          {/* STEP 2 그라데이션 제목 헤더 바 */}
          <div className="-mx-5 -mt-5 sm:-mx-7 sm:-mt-7 px-5 py-3.5 sm:px-7 sm:py-4 bg-gradient-to-r from-indigo-50 via-purple-50/60 to-transparent dark:from-indigo-950/50 dark:via-purple-950/30 dark:to-transparent border-b border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-800 px-2 py-0.5 border border-indigo-200/80 dark:border-indigo-800/80">STEP 02</span>
              <h2 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                <AppIcon name="file-text" size={16} className="text-indigo-600 dark:text-indigo-400" />
                사고 및 진단 상세 내용
              </h2>
            </div>
            <span className="text-xs text-gray-400 font-medium hidden sm:inline-block">손해사정 사전 정밀 분석</span>
          </div>

          {/* 내부 폼 요소 컨테이너 (정확한 space-y-6 간격 보장) */}
          <div className="space-y-6 pt-5">
            {/* 사고 원인 4대 칩 선택 */}
            <div>
              <div className={labelHeaderClass}>
                <label className={labelTextClass}>
                  사고 원인 / 분쟁 유형 <span className="text-red-500">*</span>
                </label>
                <span className={labelSubClass}>손해사정 분야 분류</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {ACCIDENT_TYPES.map(type => {
                  const isActive = formData.accident_type === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleTypeSelect(type.id)}
                      className={`p-3.5 text-center border transition-all cursor-pointer ${
                        isActive
                          ? 'border-indigo-600 bg-indigo-50/90 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-extrabold shadow-xs'
                          : 'border-gray-200 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-900/60 text-gray-700 dark:text-zinc-300 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex justify-center mb-1.5">
                        <AppIcon name={type.icon} size={20} />
                      </div>
                      <div className="text-xs sm:text-[13px] font-bold">{type.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 사고 일자 & 사고 장소 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <div className={labelHeaderClass}>
                  <label htmlFor="accident_date" className={labelTextClass}>
                    사고 일자 <span className="text-red-500">*</span>
                  </label>
                  <span className={labelSubClass}>소멸시효(3년) 확인</span>
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
                <div className={labelHeaderClass}>
                  <label htmlFor="accident_location" className={labelTextClass}>
                    사고 장소 <span className="text-red-500">*</span>
                  </label>
                  <span className={labelSubClass}>과실비율 판단 기준</span>
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
              <div className={labelHeaderClass}>
                <label htmlFor="diagnosis" className={labelTextClass}>
                  진단 병명 <span className="text-red-500">*</span>
                </label>
                <span className={labelSubClass}>질병분류코드·후유장해 판정</span>
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
              <div className={labelHeaderClass}>
                <label htmlFor="content" className={labelTextClass}>
                  사고 경위 및 내용 <span className="text-red-500">*</span>
                </label>
                <span className={labelSubClass}>육하원칙 상세 기재</span>
              </div>
              <textarea 
                name="content" 
                id="content" 
                rows={4} 
                required
                className={`${inputClass} leading-relaxed`}
                placeholder="사고가 발생한 경위와 현재 치료 상태, 보험사의 주장 등을 자유롭게 적어주세요."
                value={formData.content} 
                onChange={handleChange} 
              />
            </div>

            {/* 문의 사항 */}
            <div>
              <div className={labelHeaderClass}>
                <label htmlFor="inquiry" className={labelTextClass}>
                  궁금하신 점 / 요청 사항 <span className="text-gray-400 font-normal">(선택)</span>
                </label>
                <span className={labelSubClass}>핵심 쟁점 사전 분석</span>
              </div>
              <textarea 
                name="inquiry" 
                id="inquiry" 
                rows={3}
                className={`${inputClass} leading-relaxed`}
                placeholder="보험금 지급 거절 사유, 예상 손해액 산정 등 가장 궁금하신 쟁점을 적어주세요."
                value={formData.inquiry} 
                onChange={handleChange} 
              />
            </div>
          </div>
        </PremiumCard>

        {/* STEP 3: 3대 안심 보장 & 개인정보 수집 동의 */}
        <PremiumCard borderColor="green" hoverEffect={true} className="!p-5 sm:!p-7 overflow-hidden">
          {/* STEP 3 그라데이션 제목 헤더 바 */}
          <div className="-mx-5 -mt-5 sm:-mx-7 sm:-mt-7 px-5 py-3.5 sm:px-7 sm:py-4 bg-gradient-to-r from-emerald-50 via-teal-50/60 to-transparent dark:from-emerald-950/50 dark:via-teal-950/30 dark:to-transparent border-b border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-zinc-800 px-2 py-0.5 border border-emerald-200/80 dark:border-emerald-800/80">STEP 03</span>
              <h2 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                <AppIcon name="shield-check" size={16} className="text-emerald-600 dark:text-emerald-400" />
                보상스쿨 3대 고객 안심 원칙
              </h2>
            </div>
            <span className="text-xs text-gray-400 font-medium hidden sm:inline-block">안심 보안 원칙</span>
          </div>

          {/* 내부 폼 요소 컨테이너 (정확한 space-y-6 간격 보장) */}
          <div className="space-y-6 pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-center">
              <div className="p-4 bg-gray-50 dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 space-y-1.5">
                <div className="text-xs sm:text-[13.5px] font-extrabold text-gray-900 dark:text-white flex items-center justify-center gap-1.5">
                  <AppIcon name="shield-check" size={16} className="text-emerald-600" />
                  스팸·영업 전화 차단
                </div>
                <div className="text-xs text-gray-500 font-medium">상담 완료 후 무단 마케팅 절대 금지</div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 space-y-1.5">
                <div className="text-xs sm:text-[13.5px] font-extrabold text-gray-900 dark:text-white flex items-center justify-center gap-1.5">
                  <AppIcon name="lock" size={16} className="text-emerald-600" />
                  철저한 비밀 유지
                </div>
                <div className="text-xs text-gray-500 font-medium">담당 손해사정사 1인만 비공개 열람</div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-zinc-900 border border-gray-200/80 dark:border-zinc-800 space-y-1.5">
                <div className="text-xs sm:text-[13.5px] font-extrabold text-gray-900 dark:text-white flex items-center justify-center gap-1.5">
                  <AppIcon name="trash" size={16} className="text-emerald-600" />
                  3개월 후 영구 파기
                </div>
                <div className="text-xs text-gray-500 font-medium">목적 달성 시 안전하게 자동 파기</div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={privacyAgreed} 
                  onChange={e => setPrivacyAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded-none border-gray-300 focus:ring-0 cursor-pointer" 
                />
                <span className="text-xs sm:text-[13px] text-gray-800 dark:text-gray-200 leading-relaxed font-bold">
                  [필수] 개인정보 수집 및 이용 동의
                  <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-normal">
                    수집항목: 성명, 연락처, 상담내용 / 이용목적: 손해사정 1:1 무료 상담 및 권익 분석 / 보유기간: 상담 완료 후 3개월 (또는 요청 시 즉시 파기)
                  </span>
                </span>
              </label>
            </div>
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
                손해사정사 1:1 무료 상담 신청하기
              </>
            )}
          </button>
          <p className="text-center text-xs text-[#5f6368] dark:text-[#9aa0a6] mt-3 font-medium">
            신청해 주시면 공인 손해사정사가 기재해 주신 내용을 면밀히 검토한 후 빠르게 연락드립니다.
          </p>
        </div>
      </form>
    </div>
  );
}
