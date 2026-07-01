const fs = require('fs');
const path = require('path');
const postsDir = path.join(process.cwd(), 'src/content/posts');

const files = fs.readdirSync(postsDir);

files.forEach(file => {
  if (!file.endsWith('.md') && !file.endsWith('.mdx')) return;
  const p = path.join(postsDir, file);
  let content = fs.readFileSync(p, 'utf8');
  let original = content;

  // Fix summary brackets: summary: "[...]" -> summary: "..."
  content = content.replace(/^summary:\s*"\[(.*)\]"$/gm, 'summary: "$1"');

  // Remove [이미지 제안: ...]
  content = content.replace(/\[이미지 제안:.*?\]\n?/g, '');

  // Remove [관련 글 추천]
  content = content.replace(/\[관련 글 추천\]\n?/g, '');

  if (content !== original) {
    fs.writeFileSync(p, content, 'utf8');
    console.log(`Fixed ${file}`);
  }
});
