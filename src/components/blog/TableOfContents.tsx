import CommonBox from './CommonBox';

interface TOCItem {
  id: string;
  text: string;
}

interface TableOfContentsProps {
  toc: TOCItem[];
  activeId: string;
  onItemClick: (e: React.MouseEvent<HTMLAnchorElement>, id: string) => void;
}

export default function TableOfContents({
  toc,
  activeId,
  onItemClick,
}: TableOfContentsProps) {
  if (!toc.length) return null;

  const headerRight = (
    <span className="text-[11px] font-semibold text-gray-400 mt-1">항목 클릭 시 이동</span>
  );

  const icon = (
    <svg className="w-4 h-4 text-[var(--google-blue)] dark:text-[#8ab4f8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );

  return (
    <CommonBox
      tone="blue"
      title="이 글의 목차"
      icon={icon}
      headerRight={headerRight}
    >
      <ul className="space-y-3">
        {toc.map((item, i) => {
          const isActive = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => onItemClick(e, item.id)}
                className="group/item flex items-start gap-2.5 w-full"
              >
                <span className={`w-5 h-5 rounded-none text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-[1.5px] transition-colors ${
                  isActive
                    ? 'bg-[var(--google-blue)] text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 group-hover/item:bg-[var(--google-blue)]/10 group-hover/item:text-[var(--google-blue)] dark:group-hover/item:text-[#8ab4f8]'
                }`}>
                  {i + 1}
                </span>
                
                <span className={`flex-1 text-[14.5px] leading-[1.7] break-keep transition-colors group-hover/item:underline underline-offset-4 decoration-2 ${
                  isActive 
                    ? 'font-extrabold text-[var(--google-blue)] dark:text-[#8ab4f8] decoration-[var(--google-blue)]/30' 
                    : 'font-medium text-gray-700 dark:text-[#e8eaed] group-hover/item:text-[var(--google-blue)] dark:group-hover/item:text-[#8ab4f8] decoration-[var(--google-blue)]/30'
                }`}>
                  {item.text}
                </span>
                <span className={`shrink-0 mt-1.5 flex items-center gap-1 text-[11px] font-bold transition-all duration-300 ${isActive ? 'text-[var(--google-blue)] dark:text-[#8ab4f8]' : 'text-transparent group-hover/item:text-[var(--google-blue)] dark:group-hover/item:text-[#8ab4f8]'}`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </CommonBox>
  );
}
