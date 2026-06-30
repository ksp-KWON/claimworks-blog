import React from 'react';

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
    <nav className="mb-14 rounded-none overflow-hidden bg-white dark:bg-[#202124] border border-gray-200 dark:border-white/10 shadow-[0_6px_25px_rgba(0,0,0,0.05)] dark:shadow-[0_6px_25px_rgba(0,0,0,0.4)] relative">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 to-[#1a73e8] dark:from-red-500 dark:to-blue-500" />
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-white/5">
        <div className="w-8 h-8 rounded-none bg-gradient-to-br from-red-50 to-blue-50 dark:from-red-900/20 dark:to-blue-900/20 flex items-center justify-center shrink-0 border border-gray-200 dark:border-white/10 shadow-sm">
          <svg className="w-4 h-4 text-[#1a73e8] dark:text-[#8ab4f8]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </div>
        <div>
          <span className="block text-[16px] font-extrabold text-gray-900 dark:text-white tracking-tight">이 글의 목차</span>
          <span className="block text-[12px] font-medium text-gray-500 dark:text-gray-400 mt-0.5">목차를 클릭하면 해당 내용으로 이동합니다</span>
        </div>
      </div>

      <ul className="px-6 py-5 space-y-3">
        {toc.map((item, i) => {
          const isActive = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={(e) => onItemClick(e, item.id)}
                className="group flex items-start gap-3 w-full"
              >
                <span className={`relative w-7 h-7 shrink-0 mt-[2px] transition-transform duration-200 group-hover:-translate-y-0.5 ${
                  isActive
                    ? 'text-[#1a73e8] dark:text-[#8ab4f8]'
                    : 'text-gray-400 dark:text-gray-500 group-hover:text-[#1a73e8] dark:group-hover:text-[#8ab4f8]'
                }`}>
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="square" d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  <span className="absolute top-[60%] left-[45%] -translate-x-1/2 -translate-y-1/2 text-[11.5px] font-black">
                    {i + 1}
                  </span>
                </span>
                
                <span className={`flex-1 text-[15px] leading-[1.7] break-keep transition-colors group-hover:underline underline-offset-4 decoration-2 ${
                  isActive 
                    ? 'font-extrabold text-[#1a73e8] dark:text-[#8ab4f8] decoration-[#1a73e8]/30' 
                    : 'font-semibold text-gray-800 dark:text-[#e8eaed] group-hover:text-[#1a73e8] dark:group-hover:text-[#8ab4f8] decoration-[#1a73e8]/30'
                }`}>
                  {item.text}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
