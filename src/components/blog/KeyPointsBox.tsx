import MarkdownRenderer from './MarkdownRenderer';
import CommonBox from './CommonBox';

interface KeyPointsBoxProps {
  points: string[];
}

export default function KeyPointsBox({ points }: KeyPointsBoxProps) {
  const icon = (
    <svg className="w-4 h-4 text-[var(--google-red)] dark:text-[#f28b82]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
    </svg>
  );

  return (
    <CommonBox tone="red" title="핵심 요약" icon={icon}>
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
