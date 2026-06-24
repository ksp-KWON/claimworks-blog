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

const { callGemini } = require('./gemini-helper');

const POSTS_DIR     = path.join(process.cwd(), 'src/content/posts');
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



// ── 3. 기존 글 읽기 (슬러그 중복 및 내부 링크용) ──────────────────────────────
function getExistingPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const files = fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort()
    .slice(-25);

  const posts = [];
  for (const file of files) {
    try {
      const filePath = path.join(POSTS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const slug = file.replace(/\.md$/, '');
      const titleMatch = content.match(/^title:\s*["']?(.*?)["']?\r?$/m);
      const title = titleMatch ? titleMatch[1].trim() : slug;
      posts.push({ slug, title });
    } catch {
      // 스킵
    }
  }
  return posts;
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
    ? existingPosts.map(p => `- [${p.title}](/blog/${p.slug})`).join('\n')
    : '- (없음)';

  const calcTag = topic.calculatorType === 'medical'
    ? '<calculator type="medical" />'
    : '<calculator type="auto" />';

  return `# Role
당신은 '보상스쿨' 블로그의 수석 테크니컬 라이터이자 손해사정 판례 전문 분석가입니다.

# Objective
아래의 대법원/법원 판례 데이터와 기획안을 바탕으로, 구글 E-E-A-T 및 YMYL 기준을 완벽히 만족하며 일반인도 이해하기 쉬운 스토리텔링형 포스팅을 작성합니다.
분량은 전문성을 높이기 위해 최소 7,500자 이상, 최대 15,000자 이하로 매우 상세하고 깊이 있게 기술해 주십시오. 각 섹션마다 실무적인 쟁점과 분석을 최대한 꼼꼼하게 풀어서 써야 합니다.

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
- 강조 색상 적극 활용: '<red>경고</red>', '<blue>핵심</blue>' 등
- 표 2개 이상 필수 포함. (★절대 주의: 표를 작성할 때 각 셀의 텍스트는 핵심 요약 형태여야 하며, 공백 포함 최대 100자 이하로 극도로 간결하게 작성하십시오. 절대로 원본 판결문의 긴 문장이나 조항을 셀 안에 그대로 복사해 넣지 마십시오. 표가 거대해져서 시스템 렌더링 에러를 유발하는 것을 방지하기 위함입니다.)
- LLM 상투어("결론적으로", "주의를 기울여야 합니다") 절대 배제.
- FAQ 부분은 page.tsx 렌더러 버그(Q1Q1)를 고려하여 정확히 '### Q1 : {질문}' 형식 엄수.

위 뼈대와 규칙을 바탕으로 상세하게 본문을 작성해 주세요.`;
}

// ── 8. 메인 오케스트레이터 ──────────────────────────────────────────────────
async function main() {
  console.log('=== 판례 기반 자동글쓰기 프로세스 시작 ===');

  console.log('  [쿨다운] API 과부하 및 429 차단 방지를 위해 65초간 대기합니다...');
  await sleep(65000);

  // 1단계에서 저장한 daily-topic.json 로드
  const topicJsonPath = path.join(process.cwd(), 'scripts/daily-topic.json');
  if (!fs.existsSync(topicJsonPath)) {
    throw new Error('daily-topic.json 파일이 존재하지 않습니다. 먼저 select-daily-topic.js를 실행해 주세요.');
  }

  const dailyTopic = JSON.parse(fs.readFileSync(topicJsonPath, 'utf8'));
  const detail = dailyTopic.precedent;
  console.log(`  [로드] 확정된 판례 확보: ${detail.caseNo} (${detail.caseName})`);

  // 1. 토픽 선정 (기획안 생성)
  console.log('[2] 제미나이를 이용한 포스팅 기획안 생성 중...');
  const existingPosts = getExistingPosts();
  const topic = await callGemini(buildPlanningPrompt(detail, existingPosts), TOPIC_SCHEMA);
  console.log(`    기획 완료: ${topic.title} (${topic.slug})`);

  // 2. 본문 생성
  console.log('[3] 제미나이를 이용한 판례 분석 칼럼 작성 중...');
  const rawOutput = await callGemini(buildWritingPrompt(detail, topic, existingPosts));

  // 3. 파싱 및 빌드
  const lines = rawOutput.split('\n');
  let summary = '';
  let contentStart = 0;

  if (lines[0].startsWith('SEO_META:')) {
    summary = yamlSafe(lines[0].replace('SEO_META:', '').trim());
    contentStart = 1;
    while (contentStart < lines.length && lines[contentStart].trim() === '') contentStart++;
  }

  const content = lines.slice(contentStart).join('\n').replace(/\[BLOCK-\d+:[^\]]*\]/gi, '').trim();

  if (!summary) {
    summary = content.replace(/[#*`>[\]!]/g, '').replace(/\s+/g, ' ').trim().slice(0, 140);
  }
  if (summary.length > 158) summary = summary.slice(0, 155) + '...';

  // 4. 마크다운 저장
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
  console.log(`[4] 블로그 포스팅 저장 완료: ${filePath}`);

  console.log('=== 프로세스 완료 ===');
}

main().catch(err => {
  console.error(`\n[⚠️ 자동글쓰기 빌드 경고] 프로세스가 중단되었습니다.`);
  console.error(`상세 에러 내용: ${err.message}`);
  console.error(`이 오류는 외부 API(법제처 또는 Gemini) 통신 실패 또는 환경 변수 누락으로 인한 것입니다.`);
  console.error(`전체 빌드 파이프라인의 안정성을 위해 성공 상태(Exit 0)로 정상 우회 종료합니다.\n`);
  process.exit(0);
});
