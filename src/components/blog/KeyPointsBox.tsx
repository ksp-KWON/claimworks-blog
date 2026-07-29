import MarkdownRenderer from './MarkdownRenderer';

interface KeyPointsBoxProps {
  points: string[];
}

export default function KeyPointsBox({ points }: KeyPointsBoxProps) {
  return (
    <div className="my-10 bg-white dark:bg-[#202124] p-5 sm:p-6 border border-red-200 dark:border-red-900/50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] relative overflow-hidden group">
      <div className="absolute right-[-10px] bottom-[-20px] opacity-[0.03] dark:opacity-[0.05] text-[120px] select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
        💡
      </div>
      <div className="relative z-10">
        <div className="border-b border-gray-100 dark:border-white/5 pb-3 mb-4">
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
