/**
 * fetch-fss-news.js
 * 금융감독원 공식 API로부터 최신 보도자료를 수집하고,
 * 손해사정 관련 핵심 자료만 엄선하여 AI 요약 및 실무 코멘트를 붙여 자동 발행합니다.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// 로컬 테스트/실행 시 .env.local 환경변수를 수동 로드하여 API Key 유실을 방지합니다 (Zero-dependency)
try {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
      if (match) {
        const key = match[1].trim();
        let val = match[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        process.env[key] = val;
      }
    });
  }
} catch (e) {
  console.warn('[주의] .env.local 파일 로드 중 에러:', e.message);
}

const { callGemini } = require('./gemini-helper');

// 1. 보안 설정 및 인증키 로드
const FSS_API_KEY = process.env.FSS_API_KEY || 'c610644d50a0105dbb158d26a6fb3834'; // 1순위로 환경변수, 2순위로 디폴트 키 사용
const DATA_FILE_PATH = path.join(__dirname, '../public/data/fss-consumer-data.json');

// 2. 가중치 점수제 설정 (Weighted Scoring System)
const KEYWORDS_WEIGHT = {
  // 핵심 손해사정 키워드 (강한 가중치)
  '도수치료': 7, '백내장': 7, '발달지연': 7, '장해진단': 7, '과실비율': 7, '암진단비': 7, '후유장해': 7,
  // 보험금 청구 관련 (보통 가중치)
  '실손보험': 4, '보험금 청구': 4, '지급 거절': 4, '지급 지연': 4, '배상책임': 4, '합의금': 4, '분쟁조정': 4,
  // 일반 컨텍스트 (낮은 가중치)
  '사고': 2, '치료': 2, '수술': 2, '진단': 2, '장해': 2, '교통사고': 2, '환자': 2, '질병': 2,
  // 무관한 금융 키워드 (감점)
  '대출': -3, '카드': -3, '은행': -3, '금리': -3, '보이스피싱': -3, '신용': -3,
  // 완전 배제 키워드 (강한 감점)
  '주식': -15, '증권': -15, '공시': -15, '상장': -15, '펀드': -15, '채권': -15, '가상자산': -15, 'IFRS17': -15, 'K-ICS': -15
};

// 텍스트에서 매칭되는 가중치 점수 합산 계산
function calculateScoring(title, content) {
  let score = 0;
  const text = `${title} ${content}`.toLowerCase();
  
  for (const [kw, weight] of Object.entries(KEYWORDS_WEIGHT)) {
    if (text.includes(kw.toLowerCase())) {
      score += weight;
    }
  }
  return score;
}

// YYYY-MM-DD 날짜 포맷팅 헬퍼
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 3. 금감원 API 호출 및 EUC-KR 디코딩 함수
async function fetchFssApi(startDate, endDate) {
  const url = `https://www.fss.or.kr/fss/kr/openApi/api/bodoInfo.jsp?apiType=json&startDate=${startDate}&endDate=${endDate}&authKey=${FSS_API_KEY}`;
  
  console.log(`[통신] 금감원 API 호출 기간: ${startDate} ~ ${endDate}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`금감원 API 연결 실패 (HTTP ${res.status})`);
  }
  
  const buffer = await res.arrayBuffer();
  const decoder = new TextDecoder('euc-kr');
  const rawText = decoder.decode(buffer);
  
  const parsed = JSON.parse(rawText);
  return parsed?.reponse?.result || [];
}

// 4. Gemini 응답 구조용 JSON 스키마 선언
const GEMINI_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    isRelevant: { 
      type: 'BOOLEAN', 
      description: '이 보도자료가 실손보험, 암진단비, 후유장해, 상해사망, 배상책임 등 가입자의 보험금 청구 및 실제 손해사정 보상금 합의/분쟁과 100% 밀접한 관련이 있는지 여부' 
    },
    category: { 
      type: 'STRING', 
      enum: ['alert', 'case', 'tip', 'press'], 
      description: '카테고리 분류 (소비자경보/유의사항은 alert, 조정사례/판결은 case, 유용한 팁/정보는 tip, 보도자료/새소식은 press)' 
    },
    easyTitle: { 
      type: 'STRING', 
      description: '기존 딱딱한 관공서 제목 대신, 소비자의 클릭을 유도하고 검색최적화(SEO)에 유리하도록 재구성한 흥미진진한 제목 (25자 내외)' 
    },
    summary: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: '보도자료의 핵심 내용 및 조치 요령을 일반인이 한눈에 파악할 수 있도록 세 줄 요약 문장으로 구성 (정확히 3개 문장)'
    },
    comment: { 
      type: 'STRING', 
      description: '소비자가 보험사의 일방적인 삭감이나 부지급에 당하지 않도록 베테랑 손해사정사 관점에서 제시하는 전문적이고 구체적인 조언/대비책 멘트 (160자 내외)' 
    },
    keywords: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: '태그 키워드 3~5개'
    }
  },
  required: ['isRelevant', 'category', 'easyTitle', 'summary', 'comment', 'keywords']
};

// 진짜 인터넷 표준 시간을 조회하여 로컬 시계의 왜곡을 방지합니다 (Zero-dependency)
async function getRealToday() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4초 타임아웃
    const response = await fetch('http://worldtimeapi.org/api/timezone/Asia/Seoul', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (response.ok) {
      const data = await response.json();
      if (data.datetime) {
        console.log(`  [동기화] 인터넷 표준 시간 동기화 완료: ${data.datetime}`);
        return new Date(data.datetime);
      }
    }
  } catch (e) {
    console.warn(`  [주의] 인터넷 표준 시간 동기화 실패 (${e.message}). 로컬 시스템 시계를 사용합니다.`);
  }
  return new Date();
}

// 5. 메인 자동화 프로세스 실행
async function run() {
  console.log('====== 금감원 보도자료 자동 수집 & 가공 봇 기동 ======');
  
  let rawItems = [];
  
  // 진짜 오늘 날짜(인터넷 시간 기반) 기준 최근 15일 범위 산정
  const today = await getRealToday();
  const past15Days = new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000);
  const endDateStr = formatDate(today);
  const startDateStr = formatDate(past15Days);

  try {
    rawItems = await fetchFssApi(startDateStr, endDateStr);
  } catch (err) {
    console.error(`[오류] 금감원 API 호출 최종 실패: ${err.message}`);
    process.exit(1);
  }

  console.log(`[성공] 금감원 API로부터 총 ${rawItems.length}건의 보도자료 목록을 확보했습니다.`);
  if (rawItems.length === 0) {
    console.log('  새로 추가할 보도자료 데이터가 없습니다. 실행을 종료합니다.');
    return;
  }

  // 기존 저장 데이터 불러오기 (중복 발행 차단)
  let existingData = [];
  if (fs.existsSync(DATA_FILE_PATH)) {
    try {
      existingData = JSON.parse(fs.readFileSync(DATA_FILE_PATH, 'utf-8'));
    } catch (e) {
      console.warn('[주의] 기존 fss-consumer-data.json 로드 또는 파싱 실패, 신규 생성합니다.');
    }
  }

  const existingTitles = new Set(existingData.map(item => item.title));
  const existingIds = new Set(existingData.map(item => item.id));

  let processedCount = 0;
  const newProcessedItems = [];

  for (const item of rawItems) {
    const contentId = item.contentId || `fss-api-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    // 중복 체크
    if (existingIds.has(contentId) || existingTitles.has(item.subject)) {
      console.log(`  [스킵] 중복 데이터 확인되어 제외: ${item.subject}`);
      continue;
    }

    // 1단계 가중치 검사
    const textContent = item.contentKor || '';
    const score = calculateScoring(item.subject, textContent);
    console.log(`  [점수 산정] 제목: "${item.subject}" | 합산 가중치: ${score}점`);

    if (score < 0) {
      console.log(`  [필터 제외] 손해사정과 무관한 금융/증권/규제 데이터로 판정 (0점 미만)`);
      continue;
    }

    // 2단계: AI 심층 검증 및 요약 생성
    const prompt = `당신은 보험 가입자의 권익을 보호하는 대한민국 최고의 손해사정사입니다.
제공된 금융감독원 보도자료의 제목과 내용을 정밀하게 분석하여, 손해사정 법리적 체크리스트(약관 해석 충돌, 의학적 필요성 입증, 상해/기왕증 인과관계, 후유장해/과실비율 손해액 산정, 소비자 구제 수단)에 부합하는지 검증하고 소비자가 감동할 만한 쉬운 해설을 제공하세요.

- 보도자료 원문 제목: ${item.subject}
- 보도자료 원문 내용:
${textContent}

제공된 responseSchema 규격을 100% 준수하여 출력하세요.`;

    try {
      const aiResult = await callGemini(prompt, GEMINI_RESPONSE_SCHEMA);
      
      if (!aiResult || !aiResult.isRelevant) {
        console.log(`  [AI 필터 제외] AI 심층 심사 결과, 손해사정 쟁점이 아니거나 보험금 청구와 연관이 적어 배제 처리되었습니다.`);
        continue;
      }

      // 최종 매핑 데이터 가공
      const finalItem = {
        id: contentId,
        category: aiResult.category,
        title: aiResult.easyTitle,
        date: item.regDate ? item.regDate.substring(0, 10) : formatDate(new Date()),
        content: textContent.substring(0, 200).replace(/\n/g, ' ') + '...',
        summary: aiResult.summary,
        comment: aiResult.comment,
        keywords: aiResult.keywords,
        relColumn: "/blog", // 연계 칼럼 기본값
        officialUrl: item.link || `https://www.fss.or.kr/fss/bbs/B0000188/list.do?menuNo=200218`,
        fullContent: `■ 금감원 보도 요지\n\n${textContent}`
      };

      newProcessedItems.push(finalItem);
      processedCount++;
      console.log(`  [발행 확정] "${finalItem.title}" 생성 성공! (카테고리: ${finalItem.category})`);

      // API 과도한 호출 예방을 위해 잠시 쉬어감
      await new Promise(r => setTimeout(r, 1000));
    } catch (aiErr) {
      console.error(`  [오류] Gemini AI 요약 처리 중 오류 발생: ${aiErr.message}`);
    }
  }

  // 기존 데이터에 합치고 저장
  if (newProcessedItems.length > 0) {
    const updatedData = [...newProcessedItems, ...existingData];
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(updatedData, null, 2), 'utf-8');
    console.log(`\n[완료] 총 ${processedCount}건의 손해사정 뉴스가 성공적으로 데이터 저장소에 업데이트되었습니다!`);
  } else {
    console.log('\n[완료] 수집된 글 중 새로 발행할 손해사정 관련 데이터가 확인되지 않아 파일에 저장하지 않았습니다.');
  }
}

// 직접 스크립트 실행 시 구동
if (require.main === module) {
  run().catch(console.error);
}
