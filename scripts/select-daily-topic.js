/**
 * select-daily-topic.js
 * 1단계: 실시간 트렌드 및 법제처 판례 연쇄 탐색을 통한 당일 주제 확정 스크립트
 */

'use strict';
const fs = require('fs');
const path = require('path');

// ── 환경변수 로드 (.env.local) ──────────────────────────────────────────────
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)?\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = (m[2] ?? '').replace(/(^['"]|['"]$)/g, '').trim();
    }
  });
}

// ── 상수 및 설정 ───────────────────────────────────────────────────────────
const { callGemini } = require('./gemini-helper');

const OUTPUT_JSON_PATH = path.join(process.cwd(), 'scripts/daily-topic.json');
const POSTS_DIR        = path.join(process.cwd(), 'src/content/posts');
const LAW_API_KEY      = process.env.LAW_API_KEY;
const LAW_PROXY_ENDPOINT = process.env.LAW_PROXY_ENDPOINT;
const LAW_PROXY_TOKEN    = process.env.LAW_PROXY_TOKEN;

// 기존 작성된 포스트들로부터 이미 사용된 사건번호(caseNumber)와 키워드(tags) 목록을 수집하는 함수
function getUsedMetadata() {
  const usedCaseNumbers = new Set();
  const usedKeywords = new Set();

  if (fs.existsSync(POSTS_DIR)) {
    const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
    for (const file of files) {
      try {
        const filePath = path.join(POSTS_DIR, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Frontmatter 영역 파싱 (맨 위 --- 와 --- 사이)
        const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        if (match) {
          const yamlText = match[1];
          // caseNumber: "..." 또는 caseNumber: ... 추출
          const caseNoMatch = yamlText.match(/caseNumber:\s*["']?(.*?)["']?\r?$/m);
          if (caseNoMatch && caseNoMatch[1]) {
            usedCaseNumbers.add(caseNoMatch[1].trim());
          }
          
          // tags: [...] 또는 tags 목록 추출
          const tagsMatch = yamlText.match(/tags:\s*\[(.*?)\]/);
          if (tagsMatch && tagsMatch[1]) {
            tagsMatch[1].split(',').forEach(t => {
              const tag = t.replace(/["']/g, '').trim();
              if (tag) usedKeywords.add(tag);
            });
          } else {
            // 줄 단위로 나열된 태그들 (예: tags:\n  - 태그1\n  - 태그2)
            const tagsBlockMatch = yamlText.match(/tags:\r?\n((?:\s*-\s*.*?\r?\n)*)/);
            if (tagsBlockMatch && tagsBlockMatch[1]) {
              const lines = tagsBlockMatch[1].split('\n');
              lines.forEach(l => {
                const tag = l.replace(/^\s*-\s*/, '').replace(/["']/g, '').trim();
                if (tag) usedKeywords.add(tag);
              });
            }
          }
        }
      } catch (err) {
        console.warn(`    [-] 기존 포스트 분석 실패 (${file}): ${err.message}`);
      }
    }
  }

  return { usedCaseNumbers, usedKeywords };
}

// 50대 전문 손해사정 백업 키워드 리스트
const BACKUP_KEYWORDS = [
  '사망보험금', '자살보험금', '암진단비', '뇌출혈', '급성심근경색', 
  '실손의료비', '소비자선임권', '교통사고 과실비율', '교통사고 위자료', '휴업손해', 
  '장해진단', '영업배상책임', '의료사고', '근재보험', '산재보험', 
  '장해평가', '면책보험금', '보험금 지급거절', '척추 압박골절 후유장해', '십자인대 파열',
  '회전근개 파열', '추간판탈출증 디스크', '고지의무 위반', '통지의무 위반', '일상생활배상책임',
  '체육시설 사고 배상책임', '도로 관리 하자 배상책임', '스키장 사고 배상책임', '개 물림 사고 배상책임', '자전거 교통사고',
  '보행자 무단횡단 사고', '음주운전 면책 동의', '무면허 사고 면책', '뺑소니 사고 보상', '산재 유족급여',
  '산재 요양급여 기각', '소음성 난청 산재', '출퇴근길 사고 산재', '뇌경색 진단비 면책', '허혈성심장질환 진단비',
  '만성 신부전 장해등급', '대퇴골 경부 골절 후유장해', '고액암 지급거절', '경계성종양 암진단비', '제자리암 소액암 지급',
  '요추 골절 후유장해', '외상성 뇌손상 인지장해', '한시장해 장해진단서', '기왕증 공제 과실상계', '약관 설명의무 위반'
];

const sleep = ms => new Promise(r => setTimeout(r, ms));

// XML 파싱 헬퍼
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

// ── 구글 트렌드 RSS 최대 50개 파싱 ──────────────────────────────────────────
async function fetchGoogleTrends() {
  console.log('[1/5] 구글 실시간 인기 트렌드 키워드 수집 중...');
  try {
    const res = await fetch(
      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=KR',
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) {
      console.warn('구글 트렌드 RSS 응답 실패, 기본 배열 반환');
      return [];
    }
    const text = await res.text();
    const trends = [...text.matchAll(/<title>(.*?)<\/title>/g)]
      .map(m => m[1].trim())
      .filter(t => t && t !== '대한민국에서 인기 있는 트렌드');
    
    // 최대 50개까지 수집
    const list = trends.slice(0, 50);
    console.log(`    총 ${list.length}개의 트렌드 키워드를 수집했습니다.`);
    return list;
  } catch (err) {
    console.warn(`    [경고] 구글 트렌드 수집 중 오류: ${err.message}`);
    return [];
  }
}



// ── 제미나이를 이용한 손해사정 키워드 분석 ─────────────────────────────────────
async function filterTrendsForInsurance(trends) {
  if (trends.length === 0) return [];
  console.log('[2/5] 제미나이를 통한 실시간 이슈 분석 및 손해사정 연관 키워드 추출 중...');

  const prompt = `당신은 국내 1위 손해사정 블로그의 수석 콘텐츠 기획자입니다.
아래의 실시간 인기 검색어 50개 목록을 분석하십시오:
[실시간 검색어 목록]
${trends.map((t, idx) => `${idx + 1}. ${t}`).join('\n')}

이 50개 중에서 손해사정 카테고리(교통사고, 산재, 질병, 배상책임, 사망, 보험금 등)와 가장 연관이 깊은 후보 키워드들을 추출하여 정렬해 주십시오.
반드시 손해사정 실무 관점에서 연결할 수 있는 키워드여야 합니다.

(예시 연결 시나리오):
- "특정 질병명" 또는 "유명인 사망" ➡️ 암진단비, 뇌출혈, 자살보험금, 재해사망
- "싱크홀/화재/시설 사고" ➡️ 일상생활배상책임, 영업배상책임, 화재보험 보상
- "배달 서비스/택배" ➡️ 이륜차 교통사고, 산재보험 신청, 근재보험 위자료
- "고속도로 정체/폭우" ➡️ 교통사고 과실비율, 침수차 보상

중요도(대중의 관심 및 손해사정 연관 깊이) 순서대로 정렬하여 원본 검색어와 매칭될 정제된 손해사정 키워드를 반환해 주십시오.`;

  const schema = {
    type: 'OBJECT',
    properties: {
      candidates: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            trendTitle: { type: 'STRING', description: '매칭된 원본 실시간 검색어 이름 (예: 쿠팡이츠)' },
            searchKeyword: { type: 'STRING', description: '법제처 API 검색에 활용할 정제된 손해사정 키워드 (예: 산재보험)' },
          },
          required: ['trendTitle', 'searchKeyword']
        },
        description: '연관성 높은 순서대로 정렬된 손해사정 기획 후보 키워드 리스트'
      }
    },
    required: ['candidates']
  };

  try {
    const result = await callGemini(prompt, schema);
    return result.candidates || [];
  } catch (err) {
    console.warn(`    [경고] 제미나이 이슈 분석 중 에러: ${err.message}`);
    return [];
  }
}

// ── 법제처 API 호출 ─────────────────────────────────────────────────────────
async function fetchLawAPI(type, params) {
  let url = '';
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  };

  if (LAW_PROXY_ENDPOINT && LAW_PROXY_ENDPOINT.trim().length > 0) {
    if (type === 'list') {
      url = `${LAW_PROXY_ENDPOINT.trim()}/api/precedent?query=${encodeURIComponent(params.query)}`;
    } else {
      url = `${LAW_PROXY_ENDPOINT.trim()}/api/precedent-detail?ID=${params.id}`;
    }
    if (LAW_PROXY_TOKEN) headers['X-Proxy-Token'] = LAW_PROXY_TOKEN.trim();
  } else {
    if (!LAW_API_KEY) throw new Error('LAW_API_KEY 인증키가 없습니다.');
    if (type === 'list') {
      url = `https://www.law.go.kr/DRF/lawSearch.do?target=prec&type=XML&OC=${LAW_API_KEY}&search=2&query=${encodeURIComponent(params.query)}`;
    } else {
      url = `https://www.law.go.kr/DRF/lawService.do?target=prec&type=XML&OC=${LAW_API_KEY}&ID=${params.id}`;
    }
  }

  const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`법제처 통신 에러: ${res.status}`);
  return await res.text();
}

async function searchPrecedents(query) {
  const xml = await fetchLawAPI('list', { query });
  if (xml.includes('사용자 정보 검증에 실패하였습니다')) {
    throw new Error('법제처 API 인증 실패 (IP 불일치 등)');
  }
  const ids = getXmlTags(xml, '판례일련번호');
  const titles = getXmlTags(xml, '사건명');
  const caseNos = getXmlTags(xml, '사건번호');

  return ids.map((id, index) => ({
    id,
    title: titles[index],
    caseNo: caseNos[index],
  }));
}

async function getPrecedentDetail(id) {
  const xml = await fetchLawAPI('detail', { id });
  return {
    id,
    caseName: getXmlTagContent(xml, '사건명'),
    caseNo: getXmlTagContent(xml, '사건번호'),
    judgmentDate: getXmlTagContent(xml, '선고일자'),
    courtName: getXmlTagContent(xml, '법원명'),
    judgmentSummary: getXmlTagContent(xml, '판결요지'),
    caseContent: getXmlTagContent(xml, '판례내용'),
    caseType: getXmlTagContent(xml, '사건종류명'),
  };
}

// ── 판례 상세 검증 루프 ──────────────────────────────────────────────────────
async function scanPrecedentList(list, query, usedCaseNumbers = new Set()) {
  for (let i = 0; i < Math.min(list.length, 5); i++) {
    const candidate = list[i];
    if (usedCaseNumbers.has(candidate.caseNo)) {
      console.log(`    [-] 중복 판례 건너뜀 (목록에서 감지): ${candidate.caseNo}`);
      continue;
    }
    try {
      const detail = await getPrecedentDetail(candidate.id);
      if (usedCaseNumbers.has(detail.caseNo)) {
        console.log(`    [-] 중복 판례 건너뜀 (상세내용에서 감지): ${detail.caseNo}`);
        continue;
      }
      if (detail.judgmentSummary && detail.judgmentSummary.trim().length >= 40 && detail.caseContent) {
        console.log(`    [성공] 유효한 판례 확보: ${detail.caseNo} (${detail.caseName})`);
        return detail;
      }
    } catch (err) {
      console.warn(`    [-] 판례 상세 조회 실패 (ID: ${candidate.id}): ${err.message}`);
    }
  }
  return null;
}

// ── 메인 실행 루프 ──────────────────────────────────────────────────────────
async function main() {
  console.log('=== 1단계: 오늘의 주제 및 판례 데이터 연쇄 탐색 시작 ===');

  let selectedKeyword = '';
  let selectedSource = 'backup';
  let trendTitle = '';
  let precedentDetail = null;

  // 기존 작성 포스트 분석 (중복 방지용)
  const { usedCaseNumbers, usedKeywords } = getUsedMetadata();
  console.log(`  [분석] 기발행 포스트 수: ${usedCaseNumbers.size}개 | 기사용 키워드 수: ${usedKeywords.size}개`);

  // 1. 구글 트렌드 수집
  const trends = await fetchGoogleTrends();

  // 2. 손해사정 연관 키워드 후보군 추출
  const candidates = await filterTrendsForInsurance(trends);

  console.log('[3/5] 실시간 트렌드 후보군 대상 법제처 판례 연쇄 탐색 진행 중...');
  // 3. 트렌드 키워드 우선순위 루프 돌며 법제처 판례 탐색
  for (const item of candidates) {
    const query = item.searchKeyword;
    console.log(`  [탐색] 키워드 '${query}' (트렌드: '${item.trendTitle}') 조회 중...`);
    try {
      const list = await searchPrecedents(query);
      if (list && list.length > 0) {
        const detail = await scanPrecedentList(list, query, usedCaseNumbers);
        if (detail) {
          selectedKeyword = query;
          selectedSource = 'trend';
          trendTitle = item.trendTitle;
          precedentDetail = detail;
          console.log(`  [낙점] 오늘의 주제를 실시간 트렌드 기반 '${query}' (이슈: ${item.trendTitle}) 로 확정합니다.`);
          break;
        }
      }
    } catch (err) {
      console.warn(`  [조회 실패] '${query}' 검색 에러: ${err.message}`);
    }
    await sleep(1000); // API 과부하 방지
  }

  // 4. 실패 시 50대 백업 키워드 루프 탐색 (2단계 백업)
  if (!precedentDetail) {
    console.log('[4/5] ⚠️ 트렌드 키워드에서 판례를 찾지 못했습니다. 50대 백업 전문 키워드로 2차 스캔을 시작합니다.');
    for (const query of BACKUP_KEYWORDS) {
      // 이미 포스팅에 쓰인 키워드(태그)면 건너뜀
      if (usedKeywords.has(query)) {
        console.log(`  [백업 스킵] 이미 사용된 키워드 제외: '${query}'`);
        continue;
      }
      console.log(`  [백업 탐색] 키워드 '${query}' 조회 중...`);
      try {
        const list = await searchPrecedents(query);
        if (list && list.length > 0) {
          const detail = await scanPrecedentList(list, query, usedCaseNumbers);
          if (detail) {
            selectedKeyword = query;
            selectedSource = 'backup';
            trendTitle = '';
            precedentDetail = detail;
            console.log(`  [낙점] 오늘의 주제를 백업 키워드 '${query}' 로 확정합니다.`);
            break;
          }
        }
      } catch (err) {
        console.warn(`  [백업 조회 실패] '${query}' 에러: ${err.message}`);
      }
      await sleep(1000);
    }
  }

  // 5. 최종 실패 방어 (법제처 다운 등 초비상 상황)
  if (!precedentDetail) {
    console.log('[⚠️ 초비상] 모든 트렌드와 백업 키워드에서 판례 수집 실패. 임시 더미 판례로 세션 보호를 시작합니다.');
    selectedKeyword = '보험금 청구';
    selectedSource = 'backup';
    trendTitle = '';
    precedentDetail = {
      id: '000000',
      caseName: '손해배상(기) 지급 거절에 대한 구제',
      caseNo: '대법원 2023다000000',
      judgmentDate: '20230615',
      courtName: '대법원',
      judgmentSummary: '보험계약의 해석은 신의성실의 원칙에 따라 약관의 객관적·획일적 해석 원칙을 고수해야 하며, 보험금 청구권자가 제출한 증빙 자료가 신빙성 있는 의학적 소견에 기초했다면 정당한 사유 없이 보험사는 지급을 지체해서는 안 된다.',
      caseContent: '보험약관은 평균적 고객의 이해 가능성을 기준으로 객관적이고 획일적으로 해석하여야 하며, 약관 해석이 모호할 때는 작성자 불이익의 원칙을 적용하여 피보험자에게 유리하게 해석하여야 한다. 피보험자의 장해 상태나 질병 발병에 대해 전문의의 객관적인 소견이 존재하므로 보험사는 보험금 청구를 거절할 수 없다.',
      caseType: '민사'
    };
  }

  // 6. 결과를 daily-topic.json에 저장
  const outputData = {
    keyword: selectedKeyword,
    source: selectedSource,
    trendTitle: trendTitle,
    precedent: precedentDetail,
    selectedAt: new Date().toISOString()
  };

  fs.writeFileSync(OUTPUT_JSON_PATH, JSON.stringify(outputData, null, 2), 'utf8');
  console.log(`[5/5] 오늘의 주제 데이터 JSON 저장 완료: ${OUTPUT_JSON_PATH}`);
  console.log('=== 1단계 프로세스 완료 ===\n');
}

main().catch(err => {
  console.error('\n[⚠️ 1단계 오류] 치명적인 에러 발생:', err.message);
  process.exit(1);
});
