const fs = require('fs');
const path = require('path');
const dir = 'src/content/posts';

fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.md')) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf-8');
    let original = content;

    content = content.replace(/## 📞[^\n]*\n+/g, '');
    content = content.replace(/\[👉 카카오톡[^\n]*\n*/g, '');
    content = content.replace(/## 🛡️ 내 합의금 직접 계산해 보기\n+/g, '');
    content = content.replace(/.*보상스쿨 교통사고 합의금 계산기.*직접 이용해 보세요\..*\n+/g, '');
    content = content.replace(/<calculator\s+type="[^"]+"\s*\/>\n*/g, '');
    content = content.replace(/> \*\*전문가의 조언\*\*\s*\n> /g, '> 💡 **전문가의 조언** : ');

    if (content !== original) {
      fs.writeFileSync(p, content);
      console.log('Fixed', file);
    }
  }
});
