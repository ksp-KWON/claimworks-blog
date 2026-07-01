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

  // Regex to match "## 💡 Key Points" or "## 💡 핵심 요약" or "## Key Points" ignoring case
  // Matches "## [💡 ]Key[ ]Points" and "## [💡 ]핵심[ ]요약[ 포인트]"
  content = content.replace(/^##\s+(?:💡\s*)?(?:key\s*points?|핵심\s*요약(?:\s*포인트)?)/gim, '## 💡 핵심 요약 포인트');

  if (content !== original) {
    fs.writeFileSync(p, content, 'utf8');
    changedCount++;
  }
});

console.log(`Successfully unified key points heading in ${changedCount} files.`);
