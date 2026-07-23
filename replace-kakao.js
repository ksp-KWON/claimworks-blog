const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

walkDir('c:/Users/kspcl/Desktop/claimworks-blog/src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;
    
    // Replace window.open(KAKAO_OPEN_CHAT_URL...) with document.getElementById('chat-floating-btn')?.click()
    content = content.replace(/window\.open\(\s*KAKAO_OPEN_CHAT_URL\s*,\s*'[^']+'\s*,\s*'[^']+'\s*\);?/g, "document.getElementById('chat-floating-btn')?.click();");
    
    // Also replace title/text where 카카오톡 is used
    if (content.includes('카카오톡')) {
      content = content.replace(/카카오톡(?: 오픈)?채팅(?: 문의)?/g, '실시간 채팅');
      content = content.replace(/카카오톡 문의/g, '실시간 채팅');
      content = content.replace(/카카오톡/g, '실시간 채팅');
    }

    if (original !== content) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log('Updated:', filePath);
    }
  }
});
