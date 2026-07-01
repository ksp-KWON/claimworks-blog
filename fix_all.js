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

  // 1. Remove <calculator type="..." /> completely
  content = content.replace(/<calculator type=".*?" \/>/g, '');

  // 2. Fix H2 colon spacing
  // Example: ## Title: subtitle -> ## Title : subtitle
  content = content.replace(/^##(.*)$/gm, (match, p1) => {
    if (p1.includes(':')) {
      return '## ' + p1.trim().split(':').map(s => s.trim()).join(' : ');
    }
    return match;
  });

  // 3. Fix embedded CTAs manually based on known bad patterns
  content = content.replace(/<blue>보상스쿨에 문의하세요<\/blue>를 통해/g, '전문가의 조력을 통해');
  content = content.replace(/<blue>보상스쿨에 문의하세요<\/blue>는/g, '전문가와의 상담은');
  content = content.replace(/<blue>보상스쿨에 문의하세요<\/blue>와 같은/g, '보상스쿨과 같은');
  content = content.replace(/언제든 <blue>보상스쿨에 문의하세요<\/blue>\./g, '언제든 전문가와 상의하십시오.');
  content = content.replace(/<blue>보상스쿨에 문의하세요\.<\/blue>/g, '전문가와 상의하십시오.');
  content = content.replace(/<blue>보상스쿨에 문의하세요<\/blue>\./g, '전문가와 상의하십시오.');
  content = content.replace(/\*\s*<blue>보상스쿨에 문의하세요<\/blue>\s*:/g, '* 전문가와의 상담 :');
  content = content.replace(/언제든 보상스쿨에 문의하세요\./g, '언제든 전문가와 상의하십시오.');
  content = content.replace(/보상스쿨의 전문 상담 채널을 통해 현재 상황을 진단받아 보시기 바랍니다\.\s*전문가와 상의하십시오\./g, '보상스쿨의 전문 상담 채널을 통해 현재 상황을 진단받아 보시기 바랍니다.');
  
  // Clean up any double spaces left behind by calculator removal
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

  if (content !== original) {
    fs.writeFileSync(p, content, 'utf8');
    changedCount++;
  }
});

console.log(`Successfully inspected and updated ${changedCount} files.`);
