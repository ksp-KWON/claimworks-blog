const fs = require('fs');
const path = require('path');
const postsDir = path.join(process.cwd(), 'src/content/posts');

const files = fs.readdirSync(postsDir);
let issues = [];

files.forEach(file => {
  if (!file.endsWith('.md') && !file.endsWith('.mdx')) return;
  const p = path.join(postsDir, file);
  const content = fs.readFileSync(p, 'utf8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('## 💡 핵심 요약 포인트')) {
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === '') {
        j++;
      }
      
      let items = [];
      for (let k = 0; k < 3 && j < lines.length; k++, j++) {
        if (lines[j].trim() === '') { k--; continue; } 
        if (lines[j].startsWith('##')) break; 
        items.push(lines[j]);
      }
      
      const nonBullet = items.find(line => {
        const trimmed = line.trim();
        return !trimmed.startsWith('-') && !trimmed.startsWith('*') && !trimmed.match(/^\d+\./);
      });
      if (nonBullet) {
        issues.push({ file, lines: items });
      }
      break;
    }
  }
});

console.log(JSON.stringify(issues, null, 2));
