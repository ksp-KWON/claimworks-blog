const fs = require('fs');
const path = require('path');
const postsDir = path.join(process.cwd(), 'src/content/posts');

const files = fs.readdirSync(postsDir);
let changedCount = 0;

files.forEach(file => {
  if (!file.endsWith('.md') && !file.endsWith('.mdx')) return;
  const p = path.join(postsDir, file);
  let content = fs.readFileSync(p, 'utf8');
  let original = content;

  // Let's replace any `* ` with `- ` inside the lines following "## 💡 핵심 요약 포인트"
  const lines = content.split('\n');
  let inKeyPoints = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('## 💡 핵심 요약 포인트')) {
      inKeyPoints = true;
      continue;
    }
    if (inKeyPoints) {
      if (lines[i].startsWith('## ')) {
        inKeyPoints = false;
      } else {
        // Change bullet points starting with * (and spaces) to -
        lines[i] = lines[i].replace(/^\*\s+/, '- ');
      }
    }
  }
  
  content = lines.join('\n');

  if (content !== original) {
    fs.writeFileSync(p, content, 'utf8');
    changedCount++;
  }
});

console.log(`Successfully unified bullet points to dash '-' in ${changedCount} files.`);
