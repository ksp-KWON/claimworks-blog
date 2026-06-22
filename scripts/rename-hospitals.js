const fs = require('fs');
const path = require('path');

// 경로 정의
const standardDataPath = path.join(__dirname, '../functions/api/taas-standard-data.json');
const hospitalsDir = path.join(__dirname, '../public/data/hospitals');

// 1. 표준 메타데이터 로드
if (!fs.existsSync(standardDataPath)) {
  console.error('표준 메타데이터 파일이 존재하지 않습니다:', standardDataPath);
  process.exit(1);
}

const standardData = JSON.parse(fs.readFileSync(standardDataPath, 'utf-8'));
const { TAAS_SIDO_CODES, TAAS_GUGUN_CODES } = standardData;

// 2. 시도 한글 접두사 -> 정식 시도명 매핑 테이블
const SIDO_PREFIX_MAP = {
  '서울': '서울특별시',
  '부산': '부산광역시',
  '대구': '대구광역시',
  '인천': '인천광역시',
  '광주': '광주광역시',
  '대전': '대전광역시',
  '울산': '울산광역시',
  '세종특별자치시': '세종특별자치시',
  '경기': '경기도',
  '강원': '강원특별자치도',
  '충북': '충청북도',
  '충남': '충청남도',
  '전북': '전북특별자치도',
  '전남': '전라남도',
  '경북': '경상북도',
  '경남': '경상남도',
  '제주': '제주특별자치도'
};

// 3. 파일 목록 읽기
if (!fs.existsSync(hospitalsDir)) {
  console.error('병원 데이터 디렉토리가 존재하지 않습니다:', hospitalsDir);
  process.exit(1);
}

const files = fs.readdirSync(hospitalsDir);
console.log(`총 ${files.length}개의 파일을 처리합니다.`);

// 병합을 위한 임시 맵: key = 'sidoCode-gugunCode', value = 병합될 병원 데이터 객체
const mergedDataMap = new Map();

// 매칭되지 않은 파일 목록 기록용
const unmappedFiles = [];

files.forEach(filename => {
  // .json 파일이 아니거나 리네이밍된 파일(숫자-숫자.json 형태)은 건너뜀
  if (!filename.endsWith('.json') || /^\d+-\d+\.json$/.test(filename)) {
    return;
  }

  // NFC 정규화 처리 (맥/리눅스 한글 자소 분리 극복)
  const normFilename = filename.normalize('NFC');
  const match = normFilename.match(/^([^-]+)-(.+)\.json$/);
  
  if (!match) {
    console.warn(`파일 이름 포맷 불일치로 제외: ${filename}`);
    return;
  }

  const [, sidoPrefix, rawGugun] = match;
  const sidoFullName = SIDO_PREFIX_MAP[sidoPrefix];

  if (!sidoFullName) {
    console.warn(`알 수 없는 시도 접두사 (${sidoPrefix}): ${filename}`);
    unmappedFiles.push(filename);
    return;
  }

  const sidoCode = TAAS_SIDO_CODES[sidoFullName];
  if (!sidoCode) {
    console.warn(`표준 메타데이터에 시도 코드 없음 (${sidoFullName}): ${filename}`);
    unmappedFiles.push(filename);
    return;
  }

  const gugunCodes = TAAS_GUGUN_CODES[sidoCode];
  if (!gugunCodes) {
    console.warn(`표준 메타데이터에 해당 시도에 대한 구군 사전 없음 (${sidoFullName}, 코드: ${sidoCode}): ${filename}`);
    unmappedFiles.push(filename);
    return;
  }

  // 구군 코드 찾기 (휴리스틱 매칭)
  let gugunCode = null;
  let matchedGugunKey = null;

  // 1단계: 정확히 일치하는가?
  if (gugunCodes[rawGugun]) {
    gugunCode = gugunCodes[rawGugun];
    matchedGugunKey = rawGugun;
  } else {
    // 2단계: 유연한 구군 매칭
    // 예: '고양덕양구' -> '고양시덕양구', '부천소사구' -> '부천시'
    const cleanGugun = rawGugun.replace(/^(인천|대구|광주|대전|울산|부산|서울)/, ''); // 광주광산구 -> 광산구 등 정규화
    
    // 특수 예외 처리: 부천과 화성 (일반구 통합에 대응)
    if (cleanGugun.includes('부천')) {
      gugunCode = gugunCodes['부천시'];
      matchedGugunKey = '부천시';
    } else if (cleanGugun.includes('화성')) {
      gugunCode = gugunCodes['화성시'];
      matchedGugunKey = '화성시';
    } else {
      // 일반적인 부분 일치 검색
      for (const [key, code] of Object.entries(gugunCodes)) {
        // '고양시덕양구'와 '고양덕양구', '안양만안구'와 '안양시만안구' 등 비교
        const cleanKey = key.replace('시', ''); // '고양시덕양구' -> '고양덕양구'
        if (cleanGugun === key || cleanGugun === cleanKey || cleanGugun.includes(key) || key.includes(cleanGugun)) {
          gugunCode = code;
          matchedGugunKey = key;
          break;
        }
      }
    }
  }

  if (!gugunCode) {
    console.warn(`구군 매칭 실패 (${sidoFullName} - ${rawGugun}): ${filename}`);
    unmappedFiles.push(filename);
    return;
  }

  // 매칭 성공! 파일 데이터 로드
  const filePath = path.join(hospitalsDir, filename);
  let fileContent;
  try {
    fileContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    console.error(`파일 읽기/파싱 실패: ${filename}`, err);
    return;
  }

  const targetKey = `${sidoCode}-${gugunCode}`;
  
  // 병합용 객체 가져오거나 생성
  if (!mergedDataMap.has(targetKey)) {
    mergedDataMap.set(targetKey, {
      sido: sidoFullName,
      district: matchedGugunKey,
      specialties: {}
    });
  }

  const merged = mergedDataMap.get(targetKey);

  // specialties 병합
  if (fileContent.specialties) {
    Object.entries(fileContent.specialties).forEach(([specName, specData]) => {
      if (!merged.specialties[specName]) {
        merged.specialties[specName] = {
          count: 0,
          diseases: [],
          hospitals: []
        };
      }

      const mergedSpec = merged.specialties[specName];

      // 질병 병합 (중복 제거)
      if (specData.diseases) {
        const diseaseSet = new Set([...mergedSpec.diseases, ...specData.diseases]);
        mergedSpec.diseases = Array.from(diseaseSet);
      }

      // 병원 병합 (이름 중복 제거)
      if (specData.hospitals) {
        specData.hospitals.forEach(h => {
          const exists = mergedSpec.hospitals.some(existingH => existingH.name === h.name);
          if (!exists) {
            mergedSpec.hospitals.push(h);
          }
        });
      }

      // count 업데이트
      mergedSpec.count = mergedSpec.hospitals.length;
    });
  }
});

// 4. 병합된 데이터 파일로 기록 및 기존 한글 파일 백업/삭제
console.log('\n--- 리네이밍 및 병합 데이터 쓰기 시작 ---');

let successCount = 0;
mergedDataMap.forEach((data, codeKey) => {
  const targetFilename = `${codeKey}.json`;
  const targetPath = path.join(hospitalsDir, targetFilename);

  try {
    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[성공] ${data.sido} ${data.district} -> ${targetFilename} 쓰기 완료 (병원 수: ${Object.values(data.specialties).reduce((acc, curr) => acc + curr.hospitals.length, 0)}개)`);
    successCount++;
  } catch (err) {
    console.error(`[오류] 파일 쓰기 실패 (${targetFilename}):`, err);
  }
});

console.log(`\n리네이밍/병합 완료: 새 파일 ${successCount}개 생성됨.`);
if (unmappedFiles.length > 0) {
  console.warn(`\n매칭되지 않은 한글 파일 (${unmappedFiles.length}개):`, unmappedFiles);
} else {
  console.log('\n모든 한글 파일이 성공적으로 코드로 매핑되었습니다!');
}
