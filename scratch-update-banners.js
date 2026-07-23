const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetDir = 'c:/Users/kspcl/Desktop/claimworks-blog/src/app/(public)';

walkDir(targetDir, function(filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;
    
    content = content.replace(/className="([^"]*?)flex-wrap gap-3([^"]*?)"/g, (match, p1, p2) => {
      // only replace if it looks like the banner
      if (match.includes('bg-[var(--google-blue)]') || match.includes('bg-')) {
        return `className="${p1}flex-nowrap gap-3${p2}"`;
      }
      return match;
    });

    content = content.replace(/className="flex items-center gap-2\.5"/g, 'className="flex items-center gap-2.5 flex-1 min-w-0"');
    content = content.replace(/className="([^"]*?)text-xs sm:text-sm font-extrabold tracking-tight([^"]*?)"/g, (match, p1, p2) => {
      if (!match.includes('truncate')) {
        return `className="${p1}text-xs sm:text-sm font-extrabold tracking-tight truncate${p2}"`;
      }
      return match;
    });

    if (original !== content) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log('Updated:', filePath);
    }
  }
});
