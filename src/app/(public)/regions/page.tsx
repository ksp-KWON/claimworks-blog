import Link from 'next/link';
import PremiumHeading from '@/components/ui/PremiumHeading';
import PremiumCard from '@/components/ui/PremiumCard';
import { REGIONS_DATA } from '@/lib/constants';

export const metadata = {
  title: '지역별 의료기관 - 보상스쿨',
  description: '전국 17개 시/도, 226개 시/군/구별 보상 전문 의료기관 및 협력 병원 정보를 제공합니다.',
};

export default function RegionsIndex() {
  return (
    <div className="space-y-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* 지역별 의료기관 상단 띠 배너 */}
      <div className="bg-[var(--google-green)] text-white px-5 py-3 flex items-center justify-between flex-nowrap gap-3 rounded-t-none">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="shrink-0 flex items-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
          </span>
          <div className="text-xs sm:text-sm font-extrabold tracking-tight truncate">
            <span className="underline decoration-wavy mr-1.5">[전국 네트워크]</span>
            우리 지역에서 가장 가까운 보상 전문 협력 병원을 찾아보세요.
          </div>
        </div>
      </div>

      <div className="text-center space-y-4">
        <PremiumHeading level={1} gradient="green" className="justify-center !text-3xl">
          지역별 의료기관 네트워크
        </PremiumHeading>
        <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-xl mx-auto leading-relaxed font-medium">
          교통사고, 산업재해, 의료분쟁 등 특수한 보상 처리에 전문적인 지식을 갖춘 전국 17개 시/도의 우수 병원 및 협력 기관을 안내합니다.
        </p>
      </div>

      {/* 전국 지역 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {REGIONS_DATA.map((region) => (
          <Link 
            key={region.name} 
            href={`/regions/${encodeURIComponent(region.name)}`} 
            className="group outline-none block"
          >
            <PremiumCard hoverEffect={true} borderColor="green" className="p-6 h-full text-center">
              <div className="flex flex-col items-center justify-center w-full h-full">
                <div className="w-14 h-14 flex items-center justify-center text-[var(--google-green)] bg-green-50 dark:bg-green-900/20 rounded-none mb-4 shadow-sm group-hover:scale-110 group-hover:bg-[var(--google-green)] group-hover:text-white transition-all duration-300">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-green)] transition-colors mb-1.5">
                  {region.name}
                </h3>
                <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] font-medium">
                  {region.districts.length}개 시/군/구
                </p>
              </div>
            </PremiumCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
