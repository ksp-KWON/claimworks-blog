const fs = require('fs');
const path = require('path');

const postsDir = 'c:\\Users\\kspcl\\Desktop\\claimworks-blog\\src\\content\\posts';
const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));

let nonStandardCount = 0;
let results = [];

for (const file of files) {
  const content = fs.readFileSync(path.join(postsDir, file), 'utf8');
  const lines = content.split('\n');
  
  let lastH2 = '';
  
  for (const line of lines) {
    const tLine = line.trim();
    if (tLine.startsWith('## ')) {
      lastH2 = tLine;
    }
    
    // Q: 패턴 발견
    if (/^(?:###\s*)?(?:Q\s*[.:]|질문\s*[.:])/i.test(tLine)) {
      if (lastH2 && lastH2 !== '## 💡 자주 묻는 질문 (FAQ)') {
        results.push(`- [${file}]: ${lastH2}`);
        nonStandardCount++;
      }
      break; // 파일당 첫 Q만 확인하면 됨
    }
  }
}

console.log(`총 ${files.length}개 파일 중 비표준 FAQ 헤딩 사용 파일: ${nonStandardCount}개`);
if (nonStandardCount > 0) {
  console.log(results.slice(0, 50).join('\n'));
}
