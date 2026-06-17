// scripts/build-precedents-db.js
const fs = require('fs');
const path = require('path');

// Env loading
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)?\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = (m[2] ?? '').replace(/(^['"]|['"]$)/g, '').trim();
    }
  });
}

const LAW_API_KEY = process.env.LAW_API_KEY || 'ksp78';
const outputDir = path.join(process.cwd(), 'public/data');
const outputPath = path.join(outputDir, 'precedents-db.json');

const KEYWORDS = [
  '보험금', '기왕증', '과실상계', '후유장해', 
  '압박골절', '백내장', '도수치료', '실손의료비', 
  '자살', '재해사망보험금', '맥브라이드', '노동능력상실률', 
  '영업배상책임', '의료과실', '손해배상'
];

function getXmlTagContent(xml, tag) {
  const regex = new RegExp(`<${tag}>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*?))</${tag}>`);
  const match = xml.match(regex);
  return match ? (match[1] || match[2] || '').trim() : '';
}

function getXmlTags(xml, tag) {
  const regex = new RegExp(`<${tag}>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*?))</${tag}>`, 'g');
  const results = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    results.push((match[1] || match[2] || '').trim());
  }
  return results;
}

// 텍스트 클리닝
function cleanLawText(text) {
  if (!text) return '';
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function fetchPrecedentsList(kw) {
  const url = `https://www.law.go.kr/DRF/lawSearch.do?target=prec&type=XML&OC=${LAW_API_KEY}&search=2&query=${encodeURIComponent(kw)}`;
  console.log(`Searching list for: "${kw}"...`);
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const xml = await res.text();
    if (xml.includes('사용자 정보 검증에 실패하였습니다')) {
      console.warn("  -> API IP verification failed. Please check if your local IP is registered for key:", LAW_API_KEY);
      return [];
    }
    const ids = getXmlTags(xml, '판례일련번호');
    const titles = getXmlTags(xml, '사건명');
    const caseNos = getXmlTags(xml, '사건번호');
    
    return ids.map((id, index) => ({
      id,
      title: titles[index] || '',
      caseNo: caseNos[index] || ''
    }));
  } catch (err) {
    console.error(`Error searching list for "${kw}":`, err.message);
    return [];
  }
}

async function fetchPrecedentDetail(id, titleFallback, caseNoFallback) {
  const url = `https://www.law.go.kr/DRF/lawService.do?target=prec&type=XML&OC=${LAW_API_KEY}&ID=${id}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const xml = await res.text();
    
    return {
      id,
      title: titleFallback || getXmlTagContent(xml, '사건명'),
      caseNo: caseNoFallback || getXmlTagContent(xml, '사건번호'),
      judgmentDate: getXmlTagContent(xml, '선고일자'),
      courtName: getXmlTagContent(xml, '법원명'),
      judgmentSummary: cleanLawText(getXmlTagContent(xml, '판결요지')),
      caseContent: cleanLawText(getXmlTagContent(xml, '판례내용')),
      caseType: getXmlTagContent(xml, '사건종류명'),
      officialUrl: `https://www.law.go.kr/LSW/precInfoP.do?precSeq=${id}`
    };
  } catch (err) {
    console.error(`Error fetching detail for ID "${id}":`, err.message);
    return null;
  }
}

async function run() {
  console.log('Starting static precedents database build...');
  console.log(`Using API Key: ${LAW_API_KEY}`);
  
  const allListItems = [];
  
  // 1. 목록 수집
  for (const kw of KEYWORDS) {
    const list = await fetchPrecedentsList(kw);
    allListItems.push(...list);
    // 약간의 딜레이
    await new Promise(r => setTimeout(r, 100));
  }
  
  // 중복 제거
  const uniqueItemsMap = new Map();
  allListItems.forEach(item => {
    uniqueItemsMap.set(item.id, item);
  });
  
  const uniqueItems = Array.from(uniqueItemsMap.values());
  console.log(`Found ${uniqueItems.length} unique precedent IDs from search.`);
  
  if (uniqueItems.length === 0) {
    console.error("No precedents found. API Key might be invalid or IP is not registered.");
    console.log("Creating an empty/fallback database to prevent crash.");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify([], null, 2), 'utf8');
    return;
  }
  
  // 2. 상세 수집 (병렬 처리 청크 단위)
  const precedents = [];
  const chunkSize = 5;
  for (let i = 0; i < uniqueItems.length; i += chunkSize) {
    const chunk = uniqueItems.slice(i, i + chunkSize);
    console.log(`Fetching details: ${i + 1} to ${Math.min(i + chunkSize, uniqueItems.length)} of ${uniqueItems.length}...`);
    
    const details = await Promise.all(
      chunk.map(item => fetchPrecedentDetail(item.id, item.title, item.caseNo))
    );
    
    details.forEach(detail => {
      if (detail) precedents.push(detail);
    });
    
    await new Promise(r => setTimeout(r, 200));
  }
  
  // 3. 파일로 저장
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(precedents, null, 2), 'utf8');
  console.log(`Successfully built precedents database with ${precedents.length} cases.`);
  console.log(`Saved to: ${outputPath}`);
}

run();
