/**
 * fetch-hira-data.js  (v2 - 실제 API 연동)
 *
 * 심평원 공공데이터포털 hospInfoServicev2/getHospBasisList API를 호출하여
 * 지역별 + 진료과목별 병원 목록을 hira-hospitals.json 으로 저장합니다.
 *
 * 실행: node scripts/fetch-hira-data.js
 */

const fs = require('fs');
const path = require('path');
const { safeFetch } = require('./fetch-utils.js');

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

const API_KEY  = process.env.PUBLIC_DATA_API_KEY;
const BASE_URL = 'https://apis.data.go.kr/B551182/hospInfoServicev2/getHospBasisList';
const OUT_PATH = path.join(process.cwd(), 'public/data/hira-hospitals.json');

// 진료과목 코드 → 한글명 (심평원 clCd 기준)
const CLASS_CODE = { '01':'상급종합', '11':'종합병원', '21':'병원', '28':'요양병원', '29':'정신병원', '31':'의원', '41':'치과병원', '51':'치과의원', '61':'한방병원', '71':'한의원', '81':'보건소', '82':'보건지소', '91':'약국' };

// 수집할 시도 코드 (전국 17개)
const SIDO_LIST = [
  { code:'110000', name:'서울특별시' },
  { code:'210000', name:'부산광역시' },
  { code:'220000', name:'인천광역시' },
  { code:'230000', name:'대구광역시' },
  { code:'240000', name:'광주광역시' },
  { code:'250000', name:'대전광역시' },
  { code:'260000', name:'울산광역시' },
  { code:'290000', name:'세종특별자치시' },
  { code:'310000', name:'경기도' },
  { code:'320000', name:'강원특별자치도' },
  { code:'330000', name:'충청북도' },
  { code:'340000', name:'충청남도' },
  { code:'350000', name:'전북특별자치도' },
  { code:'360000', name:'전라남도' },
  { code:'370000', name:'경상북도' },
  { code:'380000', name:'경상남도' },
  { code:'390000', name:'제주특별자치도' },
];

// 진료과목별 주요 질환 매핑 (보상 실무 관련)
const SPECIALTY_DISEASES = {
  '정형외과':       ['척추압박골절', '회전근개 파열', '십자인대 파열', '아킬레스건 파열', '반월상 연골판 파열', '손목/발목 골절', '고관절 골절'],
  '신경외과':       ['목/허리디스크(추간판탈출증)', '척추관협착증', '외상성 뇌출혈', '경추/요추 염좌', '뇌경색'],
  '내과':           ['급성 심근경색증', '협심증', '기왕증 기여도 산정', '고혈압성 심질환'],
  '외과':           ['하지정맥류 수술', '탈장 수술', '갑상선암 소액암', '복강경 수술'],
  '산부인과':       ['자궁근종(하이푸 시술)', '유방 섬유선종(맘모톰)', '요실금 수술', '자궁경부암'],
  '안과':           ['백내장(다초점 렌즈)', '황반변성', '녹내장', '망막박리'],
  '피부과':         ['여드름/레이저 미용', '흉터 레이저(핀홀 시술)', '대상포진'],
  '성형외과':       ['도수치료/비급여', '흉터 성형', '지방흡입'],
  '비뇨의학과':     ['전립선비대증(유로리프트)', '요로결석 쇄석술', '방광암'],
  '치과':           ['임플란트/치조골 이식술', '크라운/브릿지', '치주질환'],
  '한방내과':       ['교통사고 첩약 처방', '추나요법', '침구 치료'],
  '재활의학과':     ['도수치료', '체외충격파치료(ESWT)', '통증 재활'],
  '마취통증의학과': ['신경차단술', '경막외 스테로이드', '관절강 내 주사'],
  '신경과':         ['뇌졸중(뇌경색/뇌출혈)', '파킨슨병', '편두통'],
  '이비인후과':     ['후두염', '만성 부비동염', '이명/난청', '편도선 수술'],
  '응급의학과':     ['외상 응급처치', '다발성 골절', '두부 외상'],
  '가정의학과':     ['만성질환 관리', '건강검진', '비만 치료'],
};

// 진료과목명 → 표준 한글명 매핑 (API 응답의 과목명 정규화)
function normalizeSpecialty(raw) {
  if (!raw) return null;
  const r = raw.trim();
  const MAP = {
    '일반의': null, '응급의학': '응급의학과', '정형': '정형외과',
    '신경': '신경외과', '재활': '재활의학과', '가정': '가정의학과',
    '마취': '마취통증의학과', '비뇨': '비뇨의학과', '산부': '산부인과',
  };
  for (const [key, val] of Object.entries(MAP)) {
    if (r.startsWith(key)) return val;
  }
  // "XX과" 형태면 그대로
  if (r.endsWith('과') || r.endsWith('학')) return r;
  return r + (r.endsWith('과') ? '' : '');
}

// 한 시도의 병원 목록 전수 수집 (페이징 처리)
async function fetchAllHospitalsForSido(sidoCode, sidoName) {
  const hospitals = [];
  let pageNo = 1;
  const numOfRows = 1000;

  while (true) {
    const url = `${BASE_URL}?serviceKey=${encodeURIComponent(API_KEY)}&pageNo=${pageNo}&numOfRows=${numOfRows}&sidoCd=${sidoCode}&_type=json`;
    try {
      const res = await safeFetch(url, {}, 15000);
      const json = await res.json();
      const body = json?.response?.body;
      const items = body?.items?.item;

      if (!items) break;
      const arr = (Array.isArray(items) ? items : [items]).map(item => ({...item, sidoFullName: sidoName}));
      hospitals.push(...arr);

      // 마지막 페이지 확인
      const totalCount = parseInt(body?.totalCount || '0', 10);
      if (pageNo * numOfRows >= totalCount) break;
      pageNo++;

      // API 부하 방지: 50ms 딜레이
      await new Promise(r => setTimeout(r, 50));
    } catch (e) {
      console.warn(`  ⚠️  ${sidoName} p.${pageNo} 오류: ${e.message}`);
      break;
    }
  }
  return hospitals;
}

// 병원 데이터를 지역별 구조로 변환
function buildStructure(allHospitals) {
  // result: { regions: { 시도명: { districts: { 구군명: { specialties: { 과목명: {count, diseases, hospitals} } } } } } }
  const result = { updatedAt: new Date().toISOString(), source: 'HIRA_API_v2', regions: {} };

  for (const h of allHospitals) {
    // 시도명 / 구군명 추출
    const sido = h.sidoFullName || h.addr?.split(' ')[0] || '기타';
    const sggu = h.sgguCdNm || h.addr?.split(' ')[1] || '기타';
    // 진료과목 정보 (API에서 제공하는 clCdNm은 종별구분, 실제 과목은 없음)
    // → 종별구분(clCdNm)을 진료과목으로 대신 사용하고, 상세 과목은 별도 매핑
    const clNm = h.clCdNm || '의원';

    // 의원/병원 종류를 진료과목으로 매핑 (실제 API에는 단일 진료과목 필드가 없음)
    // 단, 주소에서 유추하거나 병원명에서 유추
    const specialtyFromName = guessSpecialtyFromName(h.yadmNm || '');
    const specialty = specialtyFromName || mapClassToSpecialty(clNm);

    if (!specialty) continue;

    if (!result.regions[sido]) result.regions[sido] = { districts: {} };
    if (!result.regions[sido].districts[sggu]) result.regions[sido].districts[sggu] = { specialties: {} };
    if (!result.regions[sido].districts[sggu].specialties[specialty]) {
      result.regions[sido].districts[sggu].specialties[specialty] = {
        count: 0,
        diseases: SPECIALTY_DISEASES[specialty] || [],
        hospitals: []
      };
    }

    const sp = result.regions[sido].districts[sggu].specialties[specialty];
    sp.count++;
    
    // 모든 병원 상세 정보를 배열에 저장
    sp.hospitals.push({
      name: h.yadmNm || '',
      address: h.addr || '',
      tel: h.telno || '',
    });
  }

  return result;
}

// 병원명에서 진료과목 추측
function guessSpecialtyFromName(name) {
  const n = name.replace(/\s/g, '');
  if (n.includes('정형')) return '정형외과';
  if (n.includes('신경외과')) return '신경외과';
  if (n.includes('신경과')) return '신경과';
  if (n.includes('재활')) return '재활의학과';
  if (n.includes('통증') || n.includes('마취')) return '마취통증의학과';
  if (n.includes('산부인과') || n.includes('여성')) return '산부인과';
  if (n.includes('안과')) return '안과';
  if (n.includes('이비인후')) return '이비인후과';
  if (n.includes('피부')) return '피부과';
  if (n.includes('성형')) return '성형외과';
  if (n.includes('비뇨')) return '비뇨의학과';
  if (n.includes('한방') || n.includes('한의')) return '한방내과';
  if (n.includes('치과')) return '치과';
  if (n.includes('응급')) return '응급의학과';
  if (n.includes('가정의학')) return '가정의학과';
  return null;
}

// 종별구분 → 대표 진료과목 (fallback)
function mapClassToSpecialty(clNm) {
  if (!clNm) return '내과';
  if (clNm.includes('치과')) return '치과';
  if (clNm.includes('한방') || clNm.includes('한의')) return '한방내과';
  if (clNm.includes('정신')) return null; // 제외
  if (clNm.includes('요양')) return null; // 요양병원 제외
  if (clNm.includes('보건')) return null; // 보건소 제외
  if (clNm.includes('약국')) return null;
  return '내과'; // 일반 의원/병원
}

// ─── 메인 ───
async function main() {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🏥 HIRA 심평원 병원 데이터 수집 (v2 실제 API)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (!API_KEY || API_KEY === '여기에_입력') {
    console.error('❌ PUBLIC_DATA_API_KEY가 설정되지 않았습니다.');
    process.exit(1);
  }

  const outDir = path.dirname(OUT_PATH);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const allHospitals = [];
  let totalFetched = 0;

  // 전국 17개 시도 전체 수집
  const PRIORITY_SIDO = SIDO_LIST; // 전국 데이터 수집

  for (const { code, name } of PRIORITY_SIDO) {
    process.stdout.write(`  📡 ${name} 수집 중...`);
    const hospitals = await fetchAllHospitalsForSido(code, name);
    allHospitals.push(...hospitals);
    totalFetched += hospitals.length;
    console.log(` ${hospitals.length}건 완료 (누계: ${totalFetched}건)`);
  }

  console.log('');
  console.log(`  📊 총 수집: ${totalFetched}건 → 지역별 구조화 중...`);

  const result = buildStructure(allHospitals);

  fs.writeFileSync(OUT_PATH, JSON.stringify(result, null, 2), 'utf8');

  const regionCount = Object.keys(result.regions).length;
  const districtCount = Object.values(result.regions).reduce((s, r) => s + Object.keys(r.districts).length, 0);

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  ✅ 저장 완료: ${OUT_PATH}`);
  console.log(`  🗺️  시도: ${regionCount}개  /  구군: ${districtCount}개`);
  console.log(`  🏥 원본 병원 수: ${totalFetched}건`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 데이터 수집 즉시 쪼개진 파편 파일로 분할
  splitHiraData();
}

function splitHiraData() {
  const hiraSourcePath = path.join(process.cwd(), 'public/data/hira-hospitals.json');
  const hospitalsOutputDir = path.join(process.cwd(), 'public/data/hospitals');

  if (fs.existsSync(hiraSourcePath)) {
    console.log('  📡 HIRA 병원 데이터를 구군별 파편 파일로 분할 중...');
    const hiraData = JSON.parse(fs.readFileSync(hiraSourcePath, 'utf8'));
    
    // TAAS 표준 코드 불러오기
    let taasData;
    try {
      taasData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'functions/api/taas-standard-data.json'), 'utf8'));
    } catch (e) {
      console.warn('  ⚠️ TAAS 표준 코드 파일 로드 실패. 분할을 건너뜁니다.');
      return;
    }

    if (!fs.existsSync(hospitalsOutputDir)) {
      fs.mkdirSync(hospitalsOutputDir, { recursive: true });
    } else {
      const files = fs.readdirSync(hospitalsOutputDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          fs.unlinkSync(path.join(hospitalsOutputDir, file));
        }
      }
    }

    let splitCount = 0;
    if (hiraData && hiraData.regions) {
      for (const [sidoName, sidoData] of Object.entries(hiraData.regions)) {
        if (!sidoData || !sidoData.districts) continue;
        
        // 1. Sido Code 매핑
        const sidoCode = taasData.TAAS_SIDO_CODES[sidoName];
        if (!sidoCode) {
          console.warn(`  ⚠️ SIDO 매핑 실패: ${sidoName}`);
          continue;
        }

        const gugunCodes = taasData.TAAS_GUGUN_CODES[sidoCode] || {};

        for (const [districtName, districtData] of Object.entries(sidoData.districts)) {
          // 2. Gugun Code 매핑 (정교한 부분 매핑)
          let gugunCode = '';
          const cleanGugun = districtName.replace(/^(인천|대구|광주|대전|울산|부산|서울)\s*/, '');
          
          const matchedKeys = Object.keys(gugunCodes)
            .filter(k => cleanGugun.includes(k) || k.includes(cleanGugun))
            .sort((a, b) => b.length - a.length);
            
          if (matchedKeys.length > 0) {
            gugunCode = gugunCodes[matchedKeys[0]];
          } else {
            // fallback (e.g. 여주군 -> 여주시)
            for (const [key, code] of Object.entries(gugunCodes)) {
              if (key.substring(0,2) === cleanGugun.substring(0,2)) {
                gugunCode = code;
                break;
              }
            }
          }

          if (!gugunCode) {
            console.warn(`  ⚠️ GUGUN 매핑 실패: ${sidoName} ${districtName}`);
            continue;
          }

          const fileContent = {
            sido: sidoName,
            district: districtName,
            specialties: districtData.specialties || {}
          };
          const outputFileName = `${sidoCode}-${gugunCode}.json`;
          fs.writeFileSync(
            path.join(hospitalsOutputDir, outputFileName),
            JSON.stringify(fileContent, null, 2),
            'utf8'
          );
          splitCount++;
        }
      }
    }
    console.log(`  ✅ 성공: ${splitCount}개의 구군별 파일 생성 완료 (${hospitalsOutputDir})`);
  } else {
    console.warn(`  ⚠️ HIRA 원본 데이터 파일 없음: ${hiraSourcePath}. 분할을 건너뜁니다.`);
  }
}

main().catch(e => { console.error('오류:', e.message); process.exit(1); });
