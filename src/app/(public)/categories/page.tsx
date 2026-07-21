import Link from 'next/link';
import type { Metadata } from 'next';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumCard from '@/components/ui/PremiumCard';

export const metadata: Metadata = {
  title: '분야별 전문 보상가이드 - 보상스쿨',
  description: '사망/자살 보험금, 질병진단, 실손, 교통사고, 배상책임 등 보상스쿨 전문가 그룹의 핵심 실무 노하우를 제공합니다.',
  alternates: {
    canonical: 'https://claim-works.com/categories',
  },
};

const COLUMN_CATEGORIES = [
  { name: '판례·법률 해석', icon: '⚖️', color: 'bg-[var(--google-blue)]', desc: '대법원 판례 및 법률 해석 기준' },
  { name: '사망·자살 보험금', icon: '🥀', color: 'bg-rose-500', desc: '사망보험금 및 자살(심신상실) 인정 사례' },
  { name: '질병진단·실손', icon: '🏥', color: 'bg-blue-500', desc: '암, 뇌졸중, 급성심근경색 및 실손 분쟁' },
  { name: '교통사고 보상', icon: '🚗', color: 'bg-red-500', desc: '자동차보험 대인배상 및 무보험차상해' },
  { name: '배상책임·의료', icon: '🛡️', color: 'bg-green-500', desc: '일상생활배상책임 및 의료사고 과실' },
  { name: '근재·산재 사고', icon: '👷', color: 'bg-teal-500', desc: '산업재해 및 근로자재해보장책임보험' },
  { name: '장해평가·면책', icon: '♿', color: 'bg-purple-500', desc: 'AMA, 맥브라이드 장해 및 고지의무 위반' },
  { name: '보상가이드', icon: '💡', color: 'bg-yellow-600', desc: '손해사정 실무 및 보험금 청구 꿀팁' }
];

const SPECIALTIES = [
  { name: '정형외과 (OS)', icon: '🦴', color: 'bg-indigo-500', desc: '골절, 인대 파열, 척추 손상 보상' },
  { name: '신경외과 (NS)', icon: '🧠', color: 'bg-blue-600', desc: '추간판탈출증, 뇌출혈, 척추 질환' },
  { name: '내과 (IM)', icon: '💊', color: 'bg-green-600', desc: '심근경색, 협심증, 내과적 기왕증' },
  { name: '외과 (GS)', icon: '✂️', color: 'bg-rose-600', desc: '수술 부작용, 소액암, 암 수술비 분쟁' },
  { name: '산부인과 (OBGY)', icon: '🤰', color: 'bg-pink-500', desc: '자궁근종 하이푸, 요실금 수술 등' },
  { name: '안과 (OPH)', icon: '👁️', color: 'bg-teal-600', desc: '백내장 다초점 렌즈, 황반변성 주사' },
  { name: '피부/성형외과', icon: '🧴', color: 'bg-orange-500', desc: '흉터 레이저, 미용 목적 비급여 분쟁' },
  { name: '비뇨의학과 (URO)', icon: '🧬', color: 'bg-cyan-600', desc: '전립선비대증 결찰술, 요로결석' },
  { name: '치과 (DEN)', icon: '🦷', color: 'bg-stone-500', desc: '치조골 이식술, 크라운 보상 분쟁' },
  { name: '한방의학과 (KM)', icon: '🌿', color: 'bg-emerald-600', desc: '교통사고 첩약, 추나요법 제한 분쟁' }
];

export default function CategoriesIndex() {
  return (
    <div className="space-y-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* 📂 전문 보상가이드 상단 띠 배너 */}
      <div className="bg-[var(--google-yellow)] text-white px-5 py-3 flex items-center justify-between flex-wrap gap-3 rounded-t-none">
        <div className="flex items-center gap-2.5">
          <span className="text-lg shrink-0">📂</span>
          <div className="text-xs sm:text-sm font-extrabold tracking-tight">
            <span className="underline decoration-wavy mr-1.5">[핵심 실무]</span>
            보상스쿨 손해사정사의 분야별 전문 칼럼과 분쟁 가이드를 확인하세요.
          </div>
        </div>
      </div>

      {/* 헤더 영역 */}
      <div className="text-center space-y-4">
        <PremiumHeading level={1} gradient="yellow" className="justify-center !text-3xl">
          분야별 전문 보상 가이드
        </PremiumHeading>
        <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-xl mx-auto leading-relaxed font-medium">
          보상스쿨 손해사정사의 풍부한 실무 경험이 담긴 전문 칼럼과, 진료과목별로 자주 발생하는 의료분쟁 해결책을 상세히 제공합니다.
        </p>
      </div>

      {/* 분야별 보상 칼럼 섹션 */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b-2 border-gray-100 dark:border-white/5">
          <span className="text-lg">📚</span>
          <h2 className="text-lg font-bold text-[#202124] dark:text-[#e8eaed]">분야별 보상 칼럼</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {COLUMN_CATEGORIES.map((cat) => (
            <Link key={cat.name} href={`/blog?category=${encodeURIComponent(cat.name)}`} className="group outline-none block">
              <PremiumCard hoverEffect={true} borderColor="yellow" className="p-4 h-full">
                <div className="flex flex-row items-center w-full h-full">
                  <div className={`w-12 h-12 flex items-center justify-center text-xl text-white ${cat.color} rounded-sm shadow-inner shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    {cat.icon}
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-yellow)] transition-colors mb-1 truncate">
                      {cat.name}
                    </h3>
                    <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] leading-snug break-keep">
                      {cat.desc}
                    </p>
                  </div>
                </div>
              </PremiumCard>
            </Link>
          ))}
        </div>
      </section>

      {/* 진료과목별 분쟁 가이드 섹션 */}
      <section className="space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b-2 border-gray-100 dark:border-white/5">
          <span className="text-lg">🩺</span>
          <h2 className="text-lg font-bold text-[#202124] dark:text-[#e8eaed]">진료과목별 분쟁 가이드</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SPECIALTIES.map((spec) => (
            <Link key={spec.name} href={`/blog?category=${encodeURIComponent(spec.name.split(' ')[0])}`} className="group outline-none block">
              <PremiumCard hoverEffect={true} borderColor="blue" className="p-4 h-full">
                <div className="flex flex-row items-center w-full h-full">
                  <div className={`w-12 h-12 flex items-center justify-center text-xl text-white ${spec.color} rounded-sm shadow-inner shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    {spec.icon}
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-blue)] transition-colors mb-1 truncate">
                      {spec.name}
                    </h3>
                    <p className="text-[11px] text-[#5f6368] dark:text-[#9aa0a6] leading-snug break-keep">
                      {spec.desc}
                    </p>
                  </div>
                </div>
              </PremiumCard>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
