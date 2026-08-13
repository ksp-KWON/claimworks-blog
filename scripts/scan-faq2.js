const fs = require('fs');
const path = require('path');

const postsDir = 'c:\\Users\\kspcl\\Desktop\\claimworks-blog\\src\\content\\posts';
const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));

let results = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(postsDir, file), 'utf8');
  const lines = content.split('\n');
  
  let lastH2 = '';
  let faqH2Seen = false;
  
  for (const line of lines) {
    const tLine = line.trim();
    if (tLine.startsWith('## ')) {
      lastH2 = tLine;
      if (/자주\s*묻는/i.test(tLine)) {
        faqH2Seen = true;
      }
    }
    
    // 블로그 파서가 사용하는 Q 정규식과 동일한 수준으로 스캔
    if (/^(?:#+\s*)?(?:[*_💬✅☑️🛡️⭐\s]*Q\d*[*_]*\s*[:.-]?\s*)/i.test(tLine)) {
      if (!faqH2Seen) {
        results.push(`- [${file}]: Q가 본문에 존재함 (소속 H2: ${lastH2})`);
        break;
      }
    }
  }
}

console.log(`총 ${files.length}개 파일 중 FAQ 섹션 밖에서 Q가 사용된 파일: ${results.length}개`);
if (results.length > 0) {
  console.log(results.join('\n'));
}
