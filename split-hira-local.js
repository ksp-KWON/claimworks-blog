const fs = require('fs');
const path = require('path');

const SIDO_MAP = {
  '서울': '서울특별시', '부산': '부산광역시', '인천': '인천광역시',
  '대구': '대구광역시', '광주': '광주광역시', '대전': '대전광역시',
  '울산': '울산광역시', '세종': '세종특별자치시', '경기': '경기도',
  '강원': '강원특별자치도', '충북': '충청북도', '충남': '충청남도',
  '전북': '전북특별자치도', '전남': '전라남도', '경북': '경상북도',
  '경남': '경상남도', '제주': '제주특별자치도', '세종특별자치시': '세종특별자치시'
};

const hiraSourcePath = path.join(process.cwd(), 'public/data/hira-hospitals.json');
const hiraData = JSON.parse(fs.readFileSync(hiraSourcePath, 'utf8'));

// Fix Sido keys
const newRegions = {};
for (const [key, value] of Object.entries(hiraData.regions)) {
  const fullKey = SIDO_MAP[key] || key;
  newRegions[fullKey] = value;
}
hiraData.regions = newRegions;

// Run splitHiraData
const hospitalsOutputDir = path.join(process.cwd(), 'public/data/hospitals');
if (!fs.existsSync(hospitalsOutputDir)) {
  fs.mkdirSync(hospitalsOutputDir, { recursive: true });
}

let taasData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'functions/api/taas-standard-data.json'), 'utf8'));
let splitCount = 0;

for (const [sidoName, sidoData] of Object.entries(hiraData.regions)) {
  if (!sidoData || !sidoData.districts) continue;
  
  const sidoCode = taasData.TAAS_SIDO_CODES[sidoName];
  if (!sidoCode) {
    console.warn(`  ⚠️ SIDO 매핑 실패: ${sidoName}`);
    continue;
  }
  
  const gugunCodes = taasData.TAAS_GUGUN_CODES[sidoCode] || {};
  
  for (const [districtName, districtData] of Object.entries(sidoData.districts)) {
    let gugunCode = '';
    const cleanDistrict = districtName.replace(/^(인천|대구|광주|대전|울산|부산|서울|경기)\s*/, '');
    const matchedKeys = Object.keys(gugunCodes)
      .filter(k => cleanDistrict.includes(k) || k.includes(cleanDistrict))
      .sort((a, b) => b.length - a.length);

    if (matchedKeys.length > 0) {
      gugunCode = gugunCodes[matchedKeys[0]];
    } else {
      for (const [key, code] of Object.entries(gugunCodes)) {
        if (key.substring(0, 2) === cleanDistrict.substring(0, 2)) {
          gugunCode = code;
          break;
        }
      }
    }

    if (gugunCode) {
      const outPath = path.join(hospitalsOutputDir, `${sidoCode}-${gugunCode}.json`);
      fs.writeFileSync(outPath, JSON.stringify(districtData, null, 2), 'utf8');
      splitCount++;
    } else {
      // console.warn(`  ⚠️ 구군 매핑 실패: ${sidoName} > ${districtName}`);
    }
  }
}

console.log(`✅ 성공: ${splitCount}개의 구군별 파일 생성 완료`);
