// scripts/fix-broken-post.js
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/content/posts/disability-call-taxi-discrimination.md');
if (fs.existsSync(filePath)) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 5개 이상의 대시(-)를 표준 3개 대시로 교체하여 모든 표 구분선과 디바이더를 한꺼번에 축소합니다.
  content = content.replace(/-{5,}/g, '---');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ 모든 장문 표 구분선 축소 완료!');
} else {
  console.log('[-] 수정할 대상을 찾지 못했습니다.');
}
