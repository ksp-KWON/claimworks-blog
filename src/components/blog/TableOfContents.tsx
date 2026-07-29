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
  return (
    <div className="my-10 bg-white dark:bg-[#202124] p-5 sm:p-6 rounded-none border border-gray-100 dark:border-white/5 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:shadow-[0_16px_50px_rgba(26,115,232,0.20)] hover:border-[var(--google-blue)] transition-all duration-300 relative overflow-hidden group">
      <div className="absolute right-[-10px] bottom-[-20px] opacity-[0.03] dark:opacity-[0.05] text-[120px] select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
        📑
      </div>
      <div className="relative z-10">
        <div className="-mt-5 sm:-mt-6 -mx-5 sm:-mx-6 px-5 sm:px-6 py-4 mb-4 border-b border-gray-100 dark:border-white/5 bg-gradient-to-r from-blue-50/80 to-transparent dark:from-blue-900/20 dark:to-transparent flex items-end justify-between">
          <h3 className="text-base font-bold flex items-center gap-1.5 border-l-4 border-[var(--google-blue)] pl-3">
            <span className="text-[var(--google-blue)] text-lg leading-none">📑</span>
            <span className="text-[var(--google-blue)] dark:text-blue-400">이 글의 목차</span>
          </h3>
          <span className="text-[11px] font-medium text-gray-400">항목 클릭 시 이동</span>
        </div>

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
      </div>
    </div>
  );
}
