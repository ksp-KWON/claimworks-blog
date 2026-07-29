const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '../src/content/posts');
let count = 0;
const emojiRegex = /\*\*([🔴🟣🟠🟢🟡🔵⚠️🚨🛑❗❌✅☑️💡🌿✔⭐🔥⚡✨🏆🔮💎💜]+)\s*/gu;
fs.readdirSync(dir).filter(f => f.endsWith('.md')).forEach(f => {
  const p = path.join(dir, f);
  const content = fs.readFileSync(p, 'utf8');
  if (emojiRegex.test(content)) {
    const newContent = content.replace(emojiRegex, '**');
    fs.writeFileSync(p, newContent, 'utf8');
    count++;
  }
});
console.log('Updated: ' + count);
