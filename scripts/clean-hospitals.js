const fs = require('fs');
const path = require('path');

const hospitalsDir = path.join(__dirname, '../public/data/hospitals');

if (!fs.existsSync(hospitalsDir)) {
  console.error('디렉토리가 존재하지 않습니다:', hospitalsDir);
  process.exit(1);
}

const files = fs.readdirSync(hospitalsDir);
let deleteCount = 0;

files.forEach(filename => {
  // 숫자가 들어간 코드형 파일(예: 41-150.json)은 보존하고,
  // 한글이 들어간 레거시 파일만 골라내어 삭제합니다.
  if (filename.endsWith('.json') && !/^\d+-\d+\.json$/.test(filename)) {
    const filePath = path.join(hospitalsDir, filename);
    fs.unlinkSync(filePath);
    deleteCount++;
  }
});

console.log(`청소 완료: 총 ${deleteCount}개의 옛날 한글 병원 파일을 삭제했습니다.`);
