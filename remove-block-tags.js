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

  // Remove lines that contain [BLOCK-...] tags completely
  content = content.replace(/^\[BLOCK-.*?\]\s*\n?/gm, '');

  if (content !== original) {
    fs.writeFileSync(p, content, 'utf8');
    changedCount++;
  }
});

console.log(`Successfully removed [BLOCK-*] tags from ${changedCount} files.`);
