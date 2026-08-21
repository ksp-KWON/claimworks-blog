import MarkdownRenderer from './MarkdownRenderer';
import CommonBox from './CommonBox';

interface KeyPointsBoxProps {
  points: string[];
}

export default function KeyPointsBox({ points }: KeyPointsBoxProps) {
  return (
    <CommonBox tone="red" title="핵심 요약">
      <ul className="space-y-3">
        {points.map((point, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--google-red)] dark:bg-[#f28b82] mt-2.5 shrink-0" />
            <div className="flex-1 text-[14.5px] font-medium text-gray-800 dark:text-[#e8eaed] leading-[1.75] break-keep">
              <MarkdownRenderer content={point} inline={true} />
            </div>
          </li>
        ))}
      </ul>
    </CommonBox>
  );
}
