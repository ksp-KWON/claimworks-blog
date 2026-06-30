const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('src/app');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let orig = content;
  
  // Replace the specific medium shadow [0_8px_30px...]
  content = content.replace(/shadow-\[0_8px_30px_rgba\(0,0,0,0\.08\)\] dark:shadow-\[0_8px_30px_rgba\(0,0,0,0\.4\)\]/g, 
    'shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)]');

  // Replace hover shadows for cards
  content = content.replace(/hover:shadow-\[0_12px_40px_rgba\(0,0,0,0\.12\)\]/g,
    'hover:shadow-[0_16px_50px_rgba(26,115,232,0.2)]');

  // Replace shadow-sm inside main cards in Calculator
  content = content.replace(/className="bg-white dark:bg-\[\#202124\] rounded-none shadow-sm border border-gray-200 dark:border-white\/10/g,
    'className="bg-white dark:bg-[#202124] rounded-none border border-gray-200 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] hover:border-[var(--google-blue)] hover:shadow-[0_16px_50px_rgba(26,115,232,0.2)] transition-all duration-300');

  // Replace hover:shadow-md for cards in BlogPageClient
  content = content.replace(/hover:shadow-md hover:-translate-y-0\.5 transition-all/g,
    'hover:shadow-[0_16px_50px_rgba(26,115,232,0.2)] hover:-translate-y-0.5 transition-all');

  if (content !== orig) {
    fs.writeFileSync(file, content);
    console.log('Processed shadows in', file);
  }
});
