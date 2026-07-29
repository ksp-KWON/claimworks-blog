import MarkdownRenderer from './MarkdownRenderer';

interface KeyPointsBoxProps {
  points: string[];
}

export default function KeyPointsBox({ points }: KeyPointsBoxProps) {
  return (
    <div className="my-10 bg-white dark:bg-[#202124] p-5 sm:p-6 rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:shadow-[0_16px_50px_rgba(234,67,53,0.25)] hover:border-[var(--google-red)] transition-all duration-300 relative overflow-hidden group">
      <div className="absolute right-[-10px] bottom-[-20px] opacity-[0.03] dark:opacity-[0.05] text-[120px] select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
        💡
      </div>
      <div className="relative z-10">
        <div className="-mt-5 sm:-mt-6 -mx-5 sm:-mx-6 px-5 sm:px-6 py-4 mb-4 border-b border-gray-100 dark:border-white/5 bg-gradient-to-r from-red-50/80 to-transparent dark:from-red-900/20 dark:to-transparent flex items-center">
          <h3 className="text-base font-bold flex items-center gap-1.5 border-l-4 border-[var(--google-red)] pl-3">
            <span className="text-[var(--google-red)] text-lg leading-none">💡</span>
            <span className="text-[var(--google-red)] dark:text-red-400">핵심 요약 포인트</span>
          </h3>
        </div>
        <ul className="space-y-3">
          {points.map((point, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="text-[var(--google-red)] dark:text-[#f28b82] mt-0.5 font-bold shrink-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </span>
              <div className="flex-1 text-[14.5px] font-normal text-gray-700 dark:text-[#bdc1c6] leading-[1.7] break-keep">
                <MarkdownRenderer content={point} inline={true} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
