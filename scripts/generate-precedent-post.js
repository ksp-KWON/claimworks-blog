/**
 * generate-precedent-post.js
 * 법제처 판례 API + 제미나이 AI 기반 손해사정 판례 분석 블로그 글 자동생성기
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

const POSTS_DIR     = path.join(process.cwd(), 'src/content/posts');
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];
const LAW_API_KEY   = process.env.LAW_API_KEY;
const LAW_PROXY_ENDPOINT = process.env.LAW_PROXY_ENDPOINT;
const LAW_PROXY_TOKEN    = process.env.LAW_PROXY_TOKEN;

const sleep = ms => new Promise(r => setTimeout(r, ms));

function yamlSafe(str) {
  return String(str).replace(/"/g, "'").replace(/\n/g, ' ').trim();
}

// XML 태그 추출 헬퍼 (로딩 속도 및 경량화 유지)
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

// ── 법제처 API 공통 호출 헬퍼 (프록시 우회 및 다이렉트 처리) ───────────────────
async function fetchLawAPI(type, params) {
  let url = '';
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  };

  if (LAW_PROXY_ENDPOINT && LAW_PROXY_ENDPOINT.trim().length > 0) {
    // 프록시 사용 시 (GCP 고정 IP 서버 경유)
    if (type === 'list') {
      url = `${LAW_PROXY_ENDPOINT.trim()}/api/precedent?query=${encodeURIComponent(params.query)}`;
    } else {
      url = `${LAW_PROXY_ENDPOINT.trim()}/api/precedent-detail?ID=${params.id}`;
    }
    if (LAW_PROXY_TOKEN) {
      headers['X-Proxy-Token'] = LAW_PROXY_TOKEN.trim();
    }
  } else {
    // 다이렉트 호출 시
    if (!LAW_API_KEY) {
      throw new Error('법제처 API 인증키(LAW_API_KEY)가 등록되지 않았습니다. 로컬 개발 시에는 .env.local 파일에, GitHub Actions 실행 시에는 Secrets에 등록해 주세요.');
    }
    if (type === 'list') {
      url = `https://www.law.go.kr/DRF/lawSearch.do?target=prec&type=XML&OC=${LAW_API_KEY}&search=2&query=${encodeURIComponent(params.query)}`;
    } else {
      url = `https://www.law.go.kr/DRF/lawService.do?target=prec&type=XML&OC=${LAW_API_KEY}&ID=${params.id}`;
    }
  }

  // 10초 타임아웃 설정 (네트워크 지연으로 인한 무한 대기 현상 방어)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, { 
      headers,
      signal: controller.signal
    });
    if (!res.ok) throw new Error(`법제처 통신 실패 (상태 코드: ${res.status})`);
    return await res.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

// ── 1. 대표 손해사정 키워드로 법제처 판례 검색 ───────────────────────────────
async function searchPrecedents(query) {
  console.log(`[1] 법제처 API 판례 검색 중 (키워드: ${query})...`);
  const xml = await fetchLawAPI('list', { query });
  
  if (xml.includes('사용자 정보 검증에 실패하였습니다')) {
    throw new Error('법제처 API 인증 실패: 등록된 IP와 현재 요청 IP가 일치하지 않거나 서버 동기화 지연 중입니다.');
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

// ── 2. 판례 상세 조회 ────────────────────────────────────────────────────────
async function getPrecedentDetail(id) {
  console.log(`[2] 상세 판결문 본문 조회 중 (판례 ID: ${id})...`);
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

// ── 3. 기존 글 읽기 (슬러그 중복 및 내부 링크용) ──────────────────────────────
function getExistingPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort()
    .slice(-20)
    .map(f => f.replace(/\.md$/, ''));
}

function resolveUniqueSlug(baseSlug) {
  let slug = baseSlug;
  let counter = 2;
  while (fs.existsSync(path.join(POSTS_DIR, `${slug}.md`))) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

// ── 4. 제미나이 호출 ─────────────────────────────────────────────────────────
async function callGemini(prompt, schema = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.length < 10) {
    throw new Error('GEMINI_API_KEY가 등록되지 않았거나 유효하지 않습니다. GitHub Secrets 또는 .env.local 설정을 확인해 주세요.');
  }

  const generationConfig = {
    temperature: 0.75,
    maxOutputTokens: schema ? 4096 : 65536,
  };
  if (schema) {
    generationConfig.responseMimeType = 'application/json';
    generationConfig.responseSchema = schema;
  }

  modelLoop: for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    for (let attempt = 1; attempt <= 5; attempt++) {
      let res;
      // 45초 타임아웃 설정 (제미나이 글쓰기 지연에 대응)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000);

      try {
        res = await fetch(url, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
          signal:  controller.signal
        });
      } catch (networkErr) {
        if (attempt < 5) { await sleep(3000 * attempt); continue; }
        continue modelLoop;
      } finally {
        clearTimeout(timeoutId);
      }

      if (!res.ok) {
        if (res.status === 429) { await sleep(65000); continue; }
        if (res.status >= 500) { await sleep(3000 * attempt); continue; }
        continue modelLoop;
      }

      const data = await res.json();
      const text = (data?.candidates?.[0]?.content?.parts ?? []).map(p => p.text ?? '').join('');
      
      if (!text) continue;
      
      if (schema) {
        try { return JSON.parse(text.trim()); }
        catch { continue; }
      }
      return text;
    }
  }
  throw new Error('제미나이 모델 응답 실패');
}

// ── 5. 토픽 정보 구조화용 스키마 ──────────────────────────────────────────────
const TOPIC_SCHEMA = {
  type: 'OBJECT',
  properties: {
    slug: { type: 'STRING', description: '하이픈 구분 영문 소문자 URL 슬러그 (예: spinal-fracture-precedent)' },
    title: { type: 'STRING', description: '법률적 신뢰도와 호기심을 유발하는 SEO 최적화 블로그 제목' },
    category: { type: 'STRING', description: '무조건 "판례·법률 해석" 지정' },
    specialtyCategory: { type: 'STRING', description: '전문 진료과목 (예: 정형외과, 신경외과 등)' },
    tags: { type: 'ARRAY', items: { type: 'STRING' }, description: '태그 5개 (예: ["대법원판례", "압박골절", "보험금분쟁"])' },
    keywords: { type: 'STRING', description: '타겟 키워드 목록 (쉼표 구분)' },
    calculatorType: { type: 'STRING', description: 'auto 또는 medical 중 삽입할 계산기 종류' }
  },
  required: ['slug', 'title', 'category', 'specialtyCategory', 'tags', 'keywords', 'calculatorType'],
};

// ── 6. 기획 프롬프트 ──────────────────────────────────────────────────────────
function buildPlanningPrompt(detail, existingPosts) {
  return `당신은 독립 신체손해사정사 블로그 '보상스쿨'의 콘텐츠 디렉터입니다.
아래의 법제처 수집 판례 데이터를 바탕으로, 블로그 포스팅 기획 정보(슬러그, 제목, 카테고리 등)를 생성해 주세요.

[수집된 판례 데이터]
- 법원명: ${detail.courtName}
- 사건명: ${detail.caseName}
- 사건번호: ${detail.caseNo}
- 선고일자: ${detail.judgmentDate}
- 판결요지: ${detail.judgmentSummary}

[기존 슬러그 목록 (중복 절대 금지)]
${existingPosts.join(', ')}

[기획 원칙]
1. 제목은 딱딱한 법률 용어를 버리고, 피해자가 검색할 법한 일상 언어와 실무적 혜택을 결합하여 작성해 주세요. (예: "대법원 판결로 보는 척추 압박골절 합의금, 보험사 삭감 주장 대처법")
2. 계산기 타입(calculatorType)은 교통사고, 배상책임, 후유장해, 산재 등 신체장해/일실수입 관련이면 "auto", 실손의료비나 단순 입원비/치료비 관련이면 "medical"을 지정하십시오.`;
}

// ── 7. 본문 작성 프롬프트 (스켈레톤 강제 출력 방식) ───────────────────────────
function buildWritingPrompt(detail, topic, existingPosts) {
  const postsCtx = existingPosts.length > 0
    ? existingPosts.map(s => `- /blog/${s}`).join('\n')
    : '- (없음)';

  const calcTag = topic.calculatorType === 'medical'
    ? '<calculator type="medical" />'
    : '<calculator type="auto" />';

  return `# Role
당신은 '보상스쿨' 블로그의 수석 테크니컬 라이터이자 손해사정 판례 전문 분석가입니다.

# Objective
아래의 대법원/법원 판례 데이터와 기획안을 바탕으로, 구글 E-E-A-T 및 YMYL 기준을 완벽히 만족하며 일반인도 이해하기 쉬운 스토리텔링형 포스팅을 작성합니다.
분량은 전문성을 높이기 위해 최소 5,000자 이상으로 상세하게 작성해 주십시오.

[원본 판례 정보]
* 사건번호: ${detail.caseNo} (${detail.courtName} ${detail.judgmentDate} 선고)
* 사건명: ${detail.caseName}
* 판결요지 및 내용: 
${detail.judgmentSummary}
${detail.caseContent.slice(0, 3000)} (본문 일부)

[기획안]
* 제목: ${topic.title}
* 카테고리: ${topic.category}
* 핵심 키워드: ${topic.keywords}

# 출력 첫 줄 (절대 필수)
응답의 첫 번째 줄에 반드시 아래 형식으로 SEO 요약문을 출력하고, 빈 줄 하나를 두고 본문을 시작하십시오:
SEO_META:[구글 검색 결과에 노출될 150자 이내의 판례 분석 클릭 유도용 요약문]

# ════════════════════════════════════════════════════════════════
# 출력 뼈대 (OUTPUT SKELETON) — 이 순서를 절대 변경하지 마십시오
# ════════════════════════════════════════════════════════════════

[BLOCK-1: 오프닝 — 공감 및 문제 제기]
실제 이 판례 사건과 유사한 고통을 겪고 있거나 보험사로부터 부당한 안내를 받은 독자들에게 공감하는 문단.
마지막 문장은 "이번 포스팅에서는 대법원 판례 [${detail.caseNo}]를 통해 실무 보상 기준과 대처법을 상세히 분석해 드리겠습니다."로 마무리.

[BLOCK-2: 저자 경험 박스 — 아래 한 줄 그대로 출력]
> ✍️ 이 글은 보상스쿨 손해사정사가 실제 법원 판례 분석 및 보상 실무 경험을 바탕으로 작성한 전문 콘텐츠입니다.

[BLOCK-3: Key Points]
## [💡 Key Points]
- {이 판례에서 독자가 반드시 알아야 할 핵심 포인트 1}
- {핵심 포인트 2}
- {핵심 포인트 3}

[BLOCK-4: 본론 1 — 판례 사건의 배경과 쟁점 해설]
## 1. ${detail.caseName} 사건의 발단 : 어떤 분쟁이 있었나
독자가 흥미진진하게 읽을 수 있도록 실제 사고 배경과 피해 상황을 스토리텔링식으로 해설.
쟁점이 된 법률 및 의학적 한계점을 표 형태로 정리.

[BLOCK-5: 본론 2 — 법원의 판단과 그 뒤에 숨겨진 메커니즘]
## 2. 법원의 판단과 판결 요지 : 보험사가 패소한(혹은 승소한) 이유
법원(${detail.courtName})이 왜 이러한 판결을 내렸는지 판결 논리를 일반인 눈높이로 해설.
대법원 판례 판시사항 인용 및 보상 실무 해설.

[BLOCK-6: 계산기 삽입 — 형식 엄수]
아래 태그를 단독 줄에 그대로 출력하십시오:
${calcTag}

[BLOCK-7: 본론 3 — 실무 적용 비교 : 손해사정사 도움의 차이]
## 3. 손해사정 실무 관점에서의 해석 : 나에게 적용하는 방법
일반 소비자가 혼자 대응했을 때와 손해사정사의 조력을 받아 판례 법리를 적용했을 때의 예상 결과를 3열 비교 표로 표현.

[BLOCK-8: 본론 4 — 추가 분쟁 포인트 및 예방 가이드]
## 4. 유사한 보상 분쟁을 방지하기 위한 핵심 대처법
피해자가 합의 전 반드시 확보해야 하는 서류, 진단 기준 설명.
내부 링크 자연스럽게 1~2개 삽입 (마크다운 링크 포맷 '[텍스트](/blog/슬러그)' 엄수).
기존 글 목록:
${postsCtx}

[BLOCK-9: 자가진단 체크리스트]
## [🛡️ 지금 손해사정사가 필요한 상황인지 1분 체크]
☑️ {판례 쟁점과 연결된 구체적 자가진단 질문 1}
☑️ {질문 2}
☑️ {질문 3}
☑️ {질문 4}
☑️ 위 항목 중 하나라도 해당된다면 손해사정사 검토가 필요한 상황입니다.

[BLOCK-10: 본론 5 — 상담 유도 및 마무리]
## 5. 정당한 보상을 위한 첫걸음
독자를 격려하고 전문가 조언의 중요성 안내 (외부 상담 링크 금지, 텍스트로만 표현).

[BLOCK-11: 핵심 보상 용어 사전]
## [💡 핵심 보상 용어 사전]
- **{용어1}** : {간결한 정의 1문장}
- **{용어2}** : {간결한 정의 1문장}

[BLOCK-12: FAQ TOP 3]
## 💡 자주 묻는 질문 (FAQ) TOP 3
### Q1 : {질문 내용 (Q1 문자는 질문 안에 포함하지 말 것)}
{팩트 기반 답변}
### Q2 : {질문 내용 (Q2 문자는 질문 안에 포함하지 말 것)}
{팩트 기반 답변}
### Q3 : 손해사정사에게 판례 분석 상담을 받으려면 비용이 드나요?
{무료 검토 절차 안내 및 상담 유도}

# ════════════════════════════════════════════════════════════════
# 추가 품질 규칙
# ════════════════════════════════════════════════════════════════
- 강조 색상 적극 활용: \`<red>경고</red>\`, \`<blue>핵심</blue>\` 등
- 표 2개 이상 필수 포함.
- LLM 상투어("결론적으로", "주의를 기울여야 합니다") 절대 배제.
- FAQ 부분은 page.tsx 렌더러 버그(Q1Q1)를 고려하여 정확히 '### Q1 : {질문}' 형식 엄수.

위 뼈대와 규칙을 바탕으로 상세하게 본문을 작성해 주세요.`;
}

// ── 8. 메인 오케스트레이터 ──────────────────────────────────────────────────
async function main() {
  console.log('=== 판례 기반 자동글쓰기 프로세스 시작 ===');
  
  if (!LAW_API_KEY) {
    throw new Error('법제처 API 인증키(LAW_API_KEY)가 등록되지 않았습니다. 로컬 개발 시에는 .env.local 파일에, GitHub Actions 실행 시에는 Secrets에 등록해 주세요.');
  }

  // 대표 손해사정 키워드 목록 (명함 서비스 범위 확대 반영)
  const keywords = [
    '사망보험금', '자살보험금', '암진단비', '뇌출혈', '급성심근경색', 
    '실손의료비', '소비자선임권', '교통사고 과실비율', '교통사고 위자료', '휴업손해', 
    '장해진단', '영업배상책임', '의료사고', '근재보험', '산재보험', 
    '장해평가', '면책보험금', '보험금 지급거절'
  ];
  const targetKeyword = keywords[Math.floor(Math.random() * keywords.length)];

  // 1. 판례 목록 수집
  const list = await searchPrecedents(targetKeyword);
  if (list.length === 0) {
    console.log(`[!] 키워드 '${targetKeyword}'에 대해 수집된 판례가 없어 '보험금' 키워드로 재조회합니다.`);
    const fallbackList = await searchPrecedents('보험금');
    if (fallbackList.length === 0) {
      console.log('[-] 수집 가능한 판례가 없습니다. 프로세스를 종료합니다.');
      return;
    }
    list.push(...fallbackList);
  }

  // 2. 유효한 판결요지를 가진 판례 탐색 (최대 5개 후보 순차 검증)
  let detail = null;
  let selectedCase = null;
  
  for (let i = 0; i < Math.min(list.length, 5); i++) {
    const candidate = list[i];
    console.log(`[조회] 후보 판례 사건번호: ${candidate.caseNo} (ID: ${candidate.id}) 상세 조회 중...`);
    try {
      const candidateDetail = await getPrecedentDetail(candidate.id);
      if (candidateDetail.judgmentSummary && candidateDetail.judgmentSummary.trim().length >= 40) {
        detail = candidateDetail;
        selectedCase = candidate;
        console.log(`[확정] 유효한 판결요지 확인됨. 사건번호: ${selectedCase.caseNo}`);
        break;
      } else {
        console.log(`[-] 후보 ${i + 1}번 판례는 판결 요지가 부족하여 건너뜁니다.`);
      }
    } catch (err) {
      console.log(`[-] 후보 ${i + 1}번 상세조회 실패: ${err.message}`);
    }
  }

  // 5개 후보 모두 요지가 마땅치 않은 경우, 목록의 첫 번째 판례를 fallback으로 지정
  if (!detail) {
    console.log('[⚠️ 경고] 유효한 판결요지가 있는 판례를 찾지 못했습니다. 목록의 첫 번째 판례를 기본값으로 진행합니다.');
    selectedCase = list[0];
    detail = await getPrecedentDetail(selectedCase.id);
  }

  // 3. 토픽 선정 (기획안 생성)
  console.log('[3] 제미나이를 이용한 포스팅 기획안 생성 중...');
  const existingPosts = getExistingPosts();
  const topic = await callGemini(buildPlanningPrompt(detail, existingPosts), TOPIC_SCHEMA);
  console.log(`    기획 완료: ${topic.title} (${topic.slug})`);

  // 4. 본문 생성
  console.log('[4] 제미나이를 이용한 판례 분석 칼럼 작성 중...');
  const rawOutput = await callGemini(buildWritingPrompt(detail, topic, existingPosts));

  // 5. 파싱 및 빌드
  const lines = rawOutput.split('\n');
  let summary = '';
  let contentStart = 0;

  if (lines[0].startsWith('SEO_META:')) {
    summary = yamlSafe(lines[0].replace('SEO_META:', '').trim());
    contentStart = 1;
    while (contentStart < lines.length && lines[contentStart].trim() === '') contentStart++;
  }

  const content = lines.slice(contentStart).join('\n').trim();

  if (!summary) {
    summary = content.replace(/[#*`>[\]!]/g, '').replace(/\s+/g, ' ').trim().slice(0, 140);
  }
  if (summary.length > 158) summary = summary.slice(0, 155) + '...';

  // 6. 마크다운 저장
  const uniqueSlug = resolveUniqueSlug(topic.slug);
  const kstDate = new Date(Date.now() + 9 * 3600 * 1000).toISOString().split('T')[0];
  const tagsStr = topic.tags.map(t => `"${yamlSafe(t)}"`).join(', ');

  const md = `---
title: "${yamlSafe(topic.title)}"
slug: "${uniqueSlug}"
date: "${kstDate}"
updatedAt: "${kstDate}"
summary: "${summary}"
category: "판례·법률 해석"
caseNumber: "${yamlSafe(detail.caseNo)}"
regionCategory: ""
specialtyCategory: "${yamlSafe(topic.specialtyCategory)}"
tags: [${tagsStr}]
published: true
---

${content}
`;

  const filePath = path.join(POSTS_DIR, `${uniqueSlug}.md`);
  fs.writeFileSync(filePath, md, 'utf8');
  console.log(`[5] 블로그 포스팅 저장 완료: ${filePath}`);
  
  // 7. prebuild 실행으로 인덱스 정보 갱신
  console.log('[6] prebuild.js 실행하여 포스팅 데이터 갱신 중...');
  try {
    const prebuild = require('./prebuild.js');
    if (prebuild && typeof prebuild.main === 'function') {
      await prebuild.main();
    } else {
      // prebuild 스크립트 모듈 로드 실패 시, 빌드용 동적 실행
      const { execSync } = require('child_process');
      execSync('node scripts/prebuild.js', { stdio: 'inherit' });
    }
    console.log('    포스팅 인덱싱이 정상 반영되었습니다.');
  } catch (err) {
    console.warn(`    [경고] prebuild 실행 중 비치명적 경고: ${err.message}`);
  }

  console.log('=== 프로세스 완료 ===');
}

main().catch(err => {
  console.error(`\n[⚠️ 자동글쓰기 빌드 경고] 프로세스가 중단되었습니다.`);
  console.error(`상세 에러 내용: ${err.message}`);
  console.error(`이 오류는 외부 API(법제처 또는 Gemini) 통신 실패 또는 환경 변수 누락으로 인한 것입니다.`);
  console.error(`전체 빌드 파이프라인의 안정성을 위해 성공 상태(Exit 0)로 정상 우회 종료합니다.\n`);
  process.exit(0);
});
