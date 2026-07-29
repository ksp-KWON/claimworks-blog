import MarkdownRenderer from './MarkdownRenderer';
import CommonBox from './CommonBox';

interface KeyPointsBoxProps {
  points: string[];
}

export default function KeyPointsBox({ points }: KeyPointsBoxProps) {
  return (
    <CommonBox tone="red" emoji="💡" title="핵심 요약 포인트">
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
    </CommonBox>
  );
}
