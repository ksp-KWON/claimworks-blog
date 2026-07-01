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

  // 1. Heading Formatting Fixes
  // Fix nested hashes with numbers e.g. "## # 3.1. Title" or "## # Title"
  content = content.replace(/^(#{2,4})\s+#\s+(?:\d+(?:\.\d+)*\.\s*)?(.*)$/gm, '### $2');
  
  // Strip numbers from headings e.g. "## 1. Title" or "## 3.1. Title"
  content = content.replace(/^(#{2,4})\s+(?:\d+(?:\.\d+)*\.\s*)+(.*)$/gm, '$1 $2');
  
  // Strip brackets from headings e.g. "## [💡 Key Points]"
  content = content.replace(/^(#{2,4})\s+\[(.*?)\]\s*$/gm, '$1 $2');

  // 2. Remove AI Boilerplate / Old Openings & Closings
  
  // Greetings
  content = content.replace(/안녕하세요[!,]?\s*보상스쿨( 손해사정사)?입니다\.\s*/g, '');
  
  // Generic intros
  content = content.replace(/(이번|이)\s+(포스팅|글)(에서는|에서|을 통해)?.*?(알아보겠습니다|살펴보겠습니다|말씀드리겠습니다|다루어\s?보겠습니다)\.?\s*/g, '');
  content = content.replace(/(다음 장|아래)에서 자세히 (설명드리겠습니다|알아보겠습니다|살펴보겠습니다)\.\s*/g, '');
  content = content.replace(/.*사고가 발생하면 누구나 당황하기 마련입니다\.\s*/g, '');
  
  // Generic transitions / summaries
  content = content.replace(/요약하자면,?\s*/g, '');
  content = content.replace(/결론적으로 말씀드리면,?\s*/g, '');
  // Keep "결론부터 말씀드리면" as it's a good BLUF hook
  
  // Generic closings
  content = content.replace(/지금까지 .*? (대해 )?알아보았습니다\.\s*/g, '');
  content = content.replace(/모쪼록 .*? 도움이 되셨길 바랍니다\.\s*/g, '');
  content = content.replace(/모쪼록 억울함 없이 보상받으시길 바라며,\s*글을 마칩니다\.\s*/g, '');
  content = content.replace(/도움이 되셨길 바랍니다\.\s*/g, '');
  content = content.replace(/이상으로 글을 마칩니다\.\s*/g, '');
  content = content.replace(/감사합니다\.\s*$/g, '');

  // 3. Cleanup multiple blank lines (more than 2 blank lines becomes 2)
  content = content.replace(/\n{4,}/g, '\n\n\n');

  if (content !== original) {
    fs.writeFileSync(p, content, 'utf8');
    changedCount++;
  }
});

console.log(`Successfully inspected and updated ${changedCount} files with AI boilerplate removal.`);
