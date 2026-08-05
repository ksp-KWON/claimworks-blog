const fs = require('fs');
const path = require('path');

const postsDir = path.join(__dirname, '../src/content/posts');

function updatePosts() {
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
  let updatedCount = 0;

  files.forEach(file => {
    const filePath = path.join(postsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // 1. 저자 경험 박스 -> 보상스쿨 실무쟁점 h3
    content = content.replace(/> \*\*(?:👨‍⚖️\s*)?(?:15년 차 독립신체손해사정사의 실무 고백|저자 경험 박스|보상스쿨 손해사정사의 현장 노트|보상스쿨 실무쟁점)\*\*/g, '> ### 👨‍⚖️ 보상스쿨 실무쟁점');
    content = content.replace(/> (?:👨‍⚖️\s*)?보상스쿨 손해사정사의 현장 노트/g, '> ### 👨‍⚖️ 보상스쿨 실무쟁점');
    
    // HTML div 형태의 현장 노트 처리
    const htmlDivRegex = /<div[^>]*>\s*<strong>(?:👨‍⚖️\s*)?(?:15년 차 독립신체손해사정사의 실무 고백|저자 경험 박스|보상스쿨 손해사정사의 현장 노트|보상스쿨 실무쟁점)<\/strong>(?:<br\s*\/?>)?\s*"?([\s\S]*?)"?\s*<\/div>/g;
    content = content.replace(htmlDivRegex, (match, p1) => {
      // p1 is the text content inside the div. We need to wrap it in blockquote.
      const blockquoted = p1.split('\n').map(line => `> ${line.trim()}`).join('\n');
      return `> ### 👨‍⚖️ 보상스쿨 실무쟁점\n${blockquoted}`;
    });
    
    // 2. 실무 조언 박스 -> h3
    content = content.replace(/> \*\*💡 손해사정사 실무 조언\*\*/g, '> ### 💡 손해사정사 실무 조언');
    
    // 3. 용어 설명 박스 -> <green> 태그 및 포맷 변경
    content = content.replace(/> \*\*📖 용어 설명\s*:\s*(.*?)\*\*/g, '> 📖 <green>**$1**</green> :');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      updatedCount++;
    }
  });

  console.log(`총 ${files.length}개의 포스팅 중 ${updatedCount}개의 포스팅이 성공적으로 업데이트 되었습니다.`);
}

updatePosts();
