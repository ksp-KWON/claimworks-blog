import Image from 'next/image';

export default function AuthorBioCard() {
  return (
    <div className="mt-12 mb-10 bg-white dark:bg-[#202124] p-5 sm:p-6 rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:shadow-[0_16px_50px_rgba(99,102,241,0.25)] hover:border-indigo-500 transition-all duration-300 relative overflow-hidden group">
      <div className="absolute right-[-10px] bottom-[-20px] opacity-[0.03] dark:opacity-[0.05] text-[120px] select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
        👨‍💼
      </div>
      <div className="relative z-10">
        <div className="border-b border-gray-100 dark:border-white/5 pb-3 mb-4">
          <h3 className="text-base font-bold text-[#202124] dark:text-[#e8eaed] flex items-center gap-2 border-l-4 border-indigo-500 pl-2.5">
            <span className="text-indigo-500 text-lg leading-none">👨‍💼</span>
            저자 소개
          </h3>
        </div>

        <div className="flex items-start gap-4">
          {/* 아바타 */}
          <div className="w-16 h-16 rounded-none bg-white flex items-center justify-center shrink-0 shadow-sm border border-gray-200 p-1">
            <Image
              src="/images/author-bio-logo.png"
              alt="보상스쿨TV 로고"
              width={64}
              height={64}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-[16px] font-extrabold text-gray-900 dark:text-white tracking-tight">보상스쿨 손해사정사</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-none bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/30">
                공인 손해사정사
              </span>
            </div>
            <p className="text-[13.5px] text-gray-600 dark:text-[#9aa0a6] leading-relaxed break-keep">
              교통사고·후유장해·실손의료비 보상 전문가로, 수백 건의 보험 분쟁을 직접 처리한 실무 경험을 바탕으로 소비자 권익 보호에 앞장서고 있습니다.
            </p>
            <div className="mt-3 flex items-center gap-3 text-[12px] text-indigo-600 dark:text-indigo-400 font-bold">
              <a href="/about" className="hover:underline flex items-center gap-1 group/link">
                <svg className="w-3.5 h-3.5 group-hover/link:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                저자 소개 보기
              </a>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span className="text-gray-400 dark:text-gray-500 font-medium">보상스쿨 공식 블로그</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
