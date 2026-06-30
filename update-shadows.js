const fs = require('fs');
const files = [
  'src/app/blog/BlogPageClient.tsx',
  'src/app/blog/[slug]/page.tsx',
  'src/app/calculator/auto/page.tsx',
  'src/app/calculator/liability/page.tsx',
  'src/app/calculator/medical/page.tsx',
  'src/app/calculator/page.tsx'
];

const familyShadow = 'shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:border-[var(--google-blue)] hover:shadow-[0_16px_50px_rgba(26,115,232,0.2)] transition-all duration-300';

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  let orig = content;
  
  // BlogPageClient.tsx
  content = content.split('className="bg-white dark:bg-[#202124] p-5 sm:p-6 rounded-none border border-[var(--google-border)] flex flex-col justify-between h-full group hover:shadow-md transition-shadow"')
                 .join('className="bg-white dark:bg-[#202124] p-5 sm:p-6 rounded-none border border-[var(--google-border)] flex flex-col justify-between h-full group ' + familyShadow + '"');

  content = content.split('className="bg-white dark:bg-[#202124] rounded-none border border-[var(--google-border)] p-4 sm:p-5 flex flex-col justify-between h-full hover:shadow-md transition-shadow"')
                 .join('className="bg-white dark:bg-[#202124] rounded-none border border-[var(--google-border)] p-4 sm:p-5 flex flex-col justify-between h-full ' + familyShadow + '"');

  // Blog 상세페이지 ([slug]/page.tsx)
  content = content.split('className="bg-white dark:bg-[#202124] rounded-none shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden"')
                 .join('className="bg-white dark:bg-[#202124] rounded-none border border-gray-100 dark:border-white/5 overflow-hidden ' + familyShadow + '"');

  // Calculator main pages
  content = content.split('className="bg-white dark:bg-[#202124] rounded-none shadow-sm border border-gray-200 dark:border-white/10 p-5 sm:p-8 space-y-6 sm:space-y-8"')
                 .join('className="bg-white dark:bg-[#202124] rounded-none border border-gray-200 dark:border-white/10 p-5 sm:p-8 space-y-6 sm:space-y-8 ' + familyShadow + '"');

  content = content.split('bg-white dark:bg-[#202124] rounded-none shadow-sm border border-gray-100 dark:border-zinc-800/50 hover:shadow-md transition-shadow')
                 .join('bg-white dark:bg-[#202124] rounded-none border border-gray-100 dark:border-zinc-800/50 ' + familyShadow);

  if (content !== orig) {
    fs.writeFileSync(file, content);
    console.log('Processed', file);
  }
});
console.log('Shadows upgraded!');
