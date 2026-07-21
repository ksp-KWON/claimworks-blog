import Link from 'next/link';

import { REGIONS_DATA } from '@/lib/constants';

export const metadata = {
  title: '지역별 의료기관 - 보상스쿨',
  description: '전국 17개 시/도, 226개 시/군/구별 보상 전문 의료기관 및 협력 병원 정보를 제공합니다.',
};

export default function RegionsIndex() {
  return (
    <>
      <div className="space-y-8 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="bg-white dark:bg-[#202124] rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:border-[var(--google-green)] hover:shadow-[0_16px_50px_rgba(52,168,83,0.15)] transition-all duration-300 overflow-hidden">
          
          {/* 🗺️ 상단 정보성 띠 배너 */}
          <div className="bg-[var(--google-green)] text-white px-5 py-3 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-lg shrink-0">🗺️</span>
              <div className="text-xs sm:text-sm font-extrabold tracking-tight">
                <span className="underline decoration-wavy mr-1.5">[전국 네트워크]</span>
                우리 지역에서 가장 가까운 보상 전문 협력 병원을 찾아보세요.
              </div>
            </div>
            <div className="text-[10px] font-black uppercase tracking-wider bg-white text-[var(--google-green)] px-2.5 py-1 rounded-none border border-white opacity-90">
              전국 매핑
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-12">
            {/* 헤더 타이틀 */}
            <div className="text-center space-y-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202124] dark:text-[#e8eaed] tracking-tight">
                보상스쿨 <span className="bg-gradient-to-r from-green-500 to-green-700 bg-clip-text text-transparent">지역별 의료기관 네트워크</span>
              </h1>
              <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-lg mx-auto leading-relaxed font-medium">
                교통사고, 산업재해, 의료분쟁 등 특수한 보상 처리에 전문적인 지식을 갖춘 전국 17개 시/도의 우수 병원 및 협력 기관을 안내합니다.
              </p>
            </div>

            {/* 전국 지역 그리드 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {REGIONS_DATA.map((region) => (
                <Link 
                  key={region.name} 
                  href={`/regions/${encodeURIComponent(region.name)}`} 
                  className="group flex flex-col items-center justify-center p-4 sm:p-6 bg-white dark:bg-[#303134] rounded-none border border-gray-200 dark:border-gray-700 shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-[4px_8px_20px_rgba(52,168,83,0.15)] hover:border-[var(--google-green)] hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-12 h-12 flex items-center justify-center text-2xl text-green-600 bg-green-50 dark:bg-green-900/20 rounded-none mb-3 group-hover:scale-110 group-hover:bg-[var(--google-green)] group-hover:text-white transition-all duration-300">
                    📍
                  </div>
                  <h3 className="text-sm font-bold text-[#202124] dark:text-[#e8eaed] group-hover:text-[var(--google-green)] transition-colors text-center">{region.name}</h3>
                  <p className="text-[10px] text-[#5f6368] dark:text-[#9aa0a6] mt-1 font-medium">{region.districts.length}개 시/군/구</p>
                </Link>
              ))}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
