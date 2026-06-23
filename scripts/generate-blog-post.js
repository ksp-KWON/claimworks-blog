/**
 * generate-blog-post.js
 * 보상스쿨 블로그 자동글쓰기 스크립트 v6
 *
 * v5 → v6 핵심 변경사항:
 *   [FIX-1] buildPrompt 전면 재설계 : 규칙 나열형 → 스켈레톤(뼈대) 강제 출력 방식
 *           AI에게 "어디에 넣어라"는 설명 대신 번호 달린 출력 뼈대를 직접 제공해
 *           저자 박스 위치·계산기 삽입 위치·섹션 번호·체크리스트 순서 오류 근본 해결
 *   [FIX-2] TOPIC_SCHEMA에 calculatorType 필드 추가
 *           토픽 선정 단계에서 auto/medical을 AI가 결정 → 본문 프롬프트에 직접 주입
 *           계산기 주제 부적합 오류 및 H2 제목 내 삽입 오류 근본 해결
 *   [FIX-3] 외부 링크(카카오톡 등) 금지 규칙을 스켈레톤 내 해당 블록에 명시
 *   [FIX-4] FAQ 형식 명확화 — ### Q1 : 형식 엄수 지시로 Q1Q1 이중 표기 방지
 *           (page.tsx BlogPostContent 렌더러 코드 수정도 병행 필요)
 */

'use strict';
const fs   = require('fs');
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

// ── 상수 ────────────────────────────────────────────────────────────────────
const POSTS_DIR     = path.join(process.cwd(), 'src/content/posts');
const GEMINI_MODELS = ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.5-flash', 'gemini-2.0-flash'];

// ── 유틸 ────────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function yamlSafe(str) {
  return String(str).replace(/"/g, "'").replace(/\n/g, ' ').trim();
}



// ── 기존 포스트 목록 ────────────────────────────────────────────────────────
function getExistingPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md'))
    .sort()
    .slice(-20)
    .map(f => f.replace(/\.md$/, ''));
}

// ── 슬러그 중복 방지 ────────────────────────────────────────────────────────
function resolveUniqueSlug(baseSlug) {
  let slug = baseSlug;
  let counter = 2;
  while (fs.existsSync(path.join(POSTS_DIR, `${slug}.md`))) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

// ── Gemini API 호출 ─────────────────────────────────────────────────────────
async function callGemini(prompt, schema = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.length < 10) throw new Error('유효하지 않은 GEMINI_API_KEY');

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
    console.log(`  [API] 모델 '${model}' 호출 중...`);

    for (let attempt = 1; attempt <= 5; attempt++) {
      let res;

      try {
        res = await fetch(url, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
        });
      } catch (networkErr) {
        if (attempt < 5) {
          const wait = 5000 * Math.pow(2, attempt - 1);
          console.warn(`  [네트워크 오류] ${networkErr.message.slice(0, 60)}. ${wait / 1000}초 후 재시도... (${attempt}/5)`);
          await sleep(wait);
          continue;
        }
        console.error(`  [실패] '${model}' 네트워크 오류 5회. 다음 모델 시도.`);
        continue modelLoop;
      }

      if (!res.ok) {
        await res.text().catch(() => '');
        if (res.status === 404) {
          console.error(`  [폴백] '${model}' 404. 다음 모델로 전환.`);
          continue modelLoop;
        }
        if (res.status === 429) {
          console.warn(`  [429] 분당 한도 초과. 65초 대기... (${attempt}/5)`);
          await sleep(65000);
          if (attempt < 5) continue;
          console.error(`  [실패] '${model}' 429 해소 불가. 다음 모델 시도.`);
          continue modelLoop;
        }
        if (res.status >= 500) {
          const wait = 5000 * Math.pow(2, attempt - 1);
          console.warn(`  [${res.status}] 서버 오류. ${wait / 1000}초 후 재시도... (${attempt}/5)`);
          await sleep(wait);
          if (attempt < 5) continue;
          console.error(`  [실패] '${model}' 500대 오류 5회. 다음 모델 시도.`);
          continue modelLoop;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const text = (data?.candidates?.[0]?.content?.parts ?? []).map(p => p.text ?? '').join('');

      if (!text) {
        if (attempt < 5) { console.warn(`  [빈 응답] 재시도... (${attempt}/5)`); await sleep(3000); continue; }
        console.error(`  [실패] '${model}' 빈 응답 5회. 다음 모델 시도.`);
        continue modelLoop;
      }

      if (schema) {
        try { return JSON.parse(text.trim()); }
        catch (e) {
          if (attempt < 5) { console.warn(`  [JSON 파싱 실패] 재시도... (${attempt}/5)`); await sleep(3000); continue; }
          throw new Error(`JSON 파싱 최종 실패: ${e.message}`);
        }
      }
      return text;
    }
  }

  throw new Error('모든 모델이 응답하지 않았습니다. 잠시 후 다시 실행해 주세요.');
}

// ── 토픽 선정 스키마 ────────────────────────────────────────────────────────
const TOPIC_SCHEMA = {
  type: 'OBJECT',
  properties: {
    slug: {
      type: 'STRING',
      description: '하이픈 구분 영문 소문자 URL 슬러그',
    },
    title: {
      type: 'STRING',
      description: 'SEO 최적화 포스팅 제목',
    },
    category: {
      type: 'STRING',
      description: '사망·자살 보험금|질병진단·실손|교통사고 보상|배상책임·의료|근재·산재 사고|장해평가·면책|보상가이드 중 최소 1개 이상 선택하여 기재합니다. 만약 2개 이상의 카테고리에 해당한다면 쉼표(,)로 구분하여 나열해 주세요. (예: "장해평가·면책, 교통사고 보상")',
    },
    specialtyCategory: {
      type: 'STRING',
      description: '전문 진료과목 (예: 정형외과)',
    },
    tags: {
      type: 'ARRAY',
      items: { type: 'STRING' },
      description: '관련 태그 5개',
    },
    keywords: {
      type: 'STRING',
      description: '타겟 키워드 목록 (쉼표 구분)',
    },
    calculatorType: {
      type: 'STRING',
      description:
        '본문에 삽입할 계산기 종류. ' +
        '교통사고·배상책임·후유장해·맥브라이드·일실수입·휴업손해·산재 관련이면 "auto", ' +
        '실손의료비·병원비·입원비·수술비 관련이면 "medical".',
    },
  },
  required: ['slug', 'title', 'category', 'specialtyCategory', 'tags', 'keywords', 'calculatorType'],
};

// ── 토픽 기획 프롬프트 ──────────────────────────────────────────────────────
function buildTopicPromptFromKeyword(keyword, trendTitle, existingPosts) {
  return `당신은 독립 신체손해사정사 전문 블로그 '보상스쿨'의 콘텐츠 기획자입니다.
오늘 확정된 대표 키워드는 [${keyword}] 이며, 관련된 오늘의 실시간 트렌드 문맥은 [${trendTitle || '없음'}] 입니다.

기존 슬러그 (중복 금지) : [${existingPosts.join(', ')}]

위 키워드와 트렌드 맥락을 바탕으로 다음 항목들을 기획하십시오:
1. slug: 영문 소문자와 하이픈(-)으로만 구성된 고유 주소 (예: daily-accident-compensation)
2. title: 피해자가 검색하기 쉬운 일상 용어와 법률적 혜택이 어우러진 SEO 최적화 제목
3. category: 사망·자살 보험금|질병진단·실손|교통사고 보상|배상책임·의료|근재·산재 사고|장해평가·면책|보상가이드 중 적절한 카테고리 기재 (쉼표 구분 나열 가능)
4. specialtyCategory: 전문 진료과목 (예: 정형외과, 신경외과, 내과 등)
5. tags: 관련 태그 5개
6. keywords: 타겟 키워드 목록
7. calculatorType: 관련 분야에 맞춰 "auto"(교통사고/배상/장해/산재 등) 또는 "medical"(실손/치료비 등) 지정.

반드시 YMYL 및 구글 E-E-A-T 기준에 부합하도록 전문적이면서도 클릭하고 싶은 주제로 기획하여 JSON으로 반환하십시오.`;
}

// ── 본문 프롬프트 — 스켈레톤 강제 출력 방식 ─────────────────────────────────
function buildPrompt(topic, existingPosts) {
  const postsCtx = existingPosts.length > 0
    ? existingPosts.map(s => `- /blog/${s}`).join('\n')
    : '- (없음)';

  // 토픽 선정 단계에서 결정된 계산기 타입을 본문 프롬프트에 직접 주입
  const calcTag = topic.calculatorType === 'medical'
    ? '<calculator type="medical" />'
    : '<calculator type="auto" />';

  return `# Role
당신은 '보상스쿨' 블로그의 수석 콘텐츠 기획자이자 손해사정 전문 테크니컬 라이터입니다.
보상스쿨 손해사정사는 다음 3개 영역의 전문가입니다:
  - 사고 조사 전문가 : 교통사고·산재·일상생활 안전사고·질병사고의 손해 발생 사실 확인
  - 법률 전문가 : 보험약관 및 관계 법규 적용의 적정성 판단
  - 의학 전문가 : 손해액 및 보험금 사정

# Objective
타겟 키워드 [${topic.keywords}]를 기반으로, 구글 E-E-A-T 및 YMYL 기준을 완벽히 만족하는
최소 15,000자 이상의 초고품질 전문 칼럼을 작성합니다. 각 단락과 설명은 법적, 의학적 실무 사례를 들어 매우 상세하고 깊이 있게 기술해 주십시오.

# 핵심 글쓰기 목표
이 글을 읽는 독자는 이미 사고 또는 질병의 당사자이거나, 보험금 지급 결과에 의문을 품고 있습니다.
글의 최종 목적은 독자가 "나는 손해사정사의 도움이 필요한 상황이다"를 스스로 판단하고
자연스럽게 상담 신청에 이르도록 안내하는 것입니다.

# 출력 첫 줄 (절대 필수)
응답의 첫 번째 줄에 반드시 아래 형식으로 SEO 요약문을 출력하고, 빈 줄 하나를 두고 본문을 시작하십시오:
SEO_META:[구글 검색 결과에 노출될 150자 이내의 매력적인 클릭 유도용 한글 요약문]

# ════════════════════════════════════════════════════════════════
# 출력 뼈대 (OUTPUT SKELETON) — 이 순서를 절대 변경하지 마십시오
# ════════════════════════════════════════════════════════════════
# 아래 각 [BLOCK]을 순서대로, 지정된 형식에 맞춰 내용을 채워 넣으십시오.
# [BLOCK-N: ...] 레이블 자체는 최종 출력에 포함하지 마십시오.
# H1 제목, 프론트매터, "안녕하세요" 등 대화형 인사 절대 금지.

─────────────────────────────────────────────────
[BLOCK-1: 오프닝 — 공감 문단]
─────────────────────────────────────────────────
독자가 처한 구체적이고 억울한 상황을 직접적으로 묘사하는 2~3문장.
마지막 문장은 "이번 포스팅에서는 [주제]에 대해 실무 관점에서 안내해 드리겠습니다."로 마무리.

─────────────────────────────────────────────────
[BLOCK-2: 저자 경험 박스 — 아래 한 줄을 그대로 출력]
─────────────────────────────────────────────────
> ✍️ 이 글은 보상스쿨 손해사정사가 실제 보상 분쟁 처리 경험을 바탕으로 작성한 전문 콘텐츠입니다.

주의 : 이 블록은 반드시 [BLOCK-1] 바로 다음, [BLOCK-3] Key Points 바로 앞에 위치해야 합니다.

─────────────────────────────────────────────────
[BLOCK-3: Key Points]
─────────────────────────────────────────────────
## [💡 Key Points]
- {이 글에서 독자가 얻어갈 핵심 인사이트 1}
- {핵심 인사이트 2}
- {핵심 인사이트 3}

─────────────────────────────────────────────────
[BLOCK-4: 본론 1 — 1단계 공감 : 독자 상황 묘사]
─────────────────────────────────────────────────
## 1. {H2 소제목 — 의문문 또는 키워드 포함 명사구}

독자가 처한 억울한 상황과 감정을 구체적으로 묘사. 검색자가 "내 얘기다"라고 느낄 수 있도록.
마크다운 표 1개 이상 포함 권장.

─────────────────────────────────────────────────
[BLOCK-5: 본론 2 — 2단계 메커니즘 : 보험사 과소지급 전술 해설]
─────────────────────────────────────────────────
## 2. {H2 소제목}

보험사가 실제로 사용하는 과소지급·부지급 전술 2개 이상을 손해사정사 실무 경험을 바탕으로 구체적으로 해설.
대법원 판례, 근로복지공단 지침, 장해평가 약관 등 검증된 수치와 함께 언급.
마크다운 표 1개 이상 포함 권장.

─────────────────────────────────────────────────
[BLOCK-6: 계산기 삽입 — 형식 엄수]
─────────────────────────────────────────────────
아래 태그를 그대로 출력하십시오. 앞뒤에 다른 텍스트를 붙이지 마십시오.
이 태그는 반드시 독립된 줄에 단독으로 위치해야 합니다.
절대로 H2 제목(## ...) 텍스트와 같은 줄에 넣지 마십시오.

${calcTag}

─────────────────────────────────────────────────
[BLOCK-7: 본론 3 — 3단계 결과 비교 : 손해사정사 개입 전후]
─────────────────────────────────────────────────
## 3. {H2 소제목}

손해사정사 개입 전/후의 보험금 차이를 구체적 수치와 실제 사례로 제시.
아래와 같은 3열 비교 표 형태로 정리할 것:

| 구분 | 개입 전 (보험사 제시) | 개입 후 (사정 결과) |
|---|---|---|
| ... | ... | ... |

─────────────────────────────────────────────────
[BLOCK-8: 본론 4 — 심화 분석 또는 추가 분쟁 포인트]
─────────────────────────────────────────────────
## 4. {H2 소제목}

추가 전문 내용, 심화 분석, 관련 법규 해설 등.

내부 링크를 아래 기존 글 슬러그 목록에서 골라 1~2개 삽입.
반드시 '[링크 텍스트](/blog/슬러그)' 마크다운 형태로 작성. 단순 텍스트 경로 금지.

기존 글 슬러그 목록:
${postsCtx}

─────────────────────────────────────────────────
[BLOCK-9: 자가진단 체크리스트]
─────────────────────────────────────────────────
## [🛡️ 지금 손해사정사가 필요한 상황인지 1분 체크]

☑️ {주제에 맞는 구체적 자가진단 질문 1}
☑️ {주제에 맞는 구체적 자가진단 질문 2}
☑️ {주제에 맞는 구체적 자가진단 질문 3}
☑️ {주제에 맞는 구체적 자가진단 질문 4}
☑️ 위 항목 중 하나라도 해당된다면 손해사정사 검토가 필요한 상황입니다.

─────────────────────────────────────────────────
[BLOCK-10: 본론 5 — 5단계 상담 유도 : 자연스러운 마무리]
─────────────────────────────────────────────────
## 5. {H2 소제목}

강압적이지 않고 자연스럽게 전문가 도움의 필요성으로 마무리.

금지 사항 (이 블록 포함 본문 전체):
- 카카오톡 오픈채팅 URL 삽입 금지
- 외부 상담 신청서 링크 삽입 금지
- 상담 유도는 텍스트로만 표현

─────────────────────────────────────────────────
[BLOCK-11: 핵심 보상 용어 사전]
─────────────────────────────────────────────────
## [💡 핵심 보상 용어 사전]

- **{용어1}** : {간결한 정의 1문장}
- **{용어2}** : {간결한 정의 1문장}
- **{용어3 (선택)}** : {간결한 정의 1문장}

─────────────────────────────────────────────────
[BLOCK-12: FAQ — 형식 엄수]
─────────────────────────────────────────────────
## 💡 자주 묻는 질문 (FAQ) TOP 3

### Q1 : {질문 내용 (Q1이라는 문자를 질문 텍스트 안에 포함하지 말 것)}

{팩트 기반 답변}

### Q2 : {질문 내용 (Q2라는 문자를 질문 텍스트 안에 포함하지 말 것)}

{팩트 기반 답변}

### Q3 : 손해사정사에게 의뢰하면 비용이 얼마나 드나요?

{비용 구조 설명 + 자연스러운 상담 유도. 외부 링크 절대 금지.}

# ════════════════════════════════════════════════════════════════
# 추가 품질 규칙 (위 스켈레톤과 함께 반드시 준수)
# ════════════════════════════════════════════════════════════════

## 톤앤매너
- LLM 상투어("결론적으로", "주의를 기울여야 합니다", "궁극적으로") 절대 금지.
- 도입부는 따뜻한 공감 톤, 보험사 전술 해설은 냉철한 분석 톤, 해결책은 단호한 전문가 톤.
- 문단 3~4줄로 끊기. 핵심 키워드 **볼드** 처리. 어미 '~입니다/합니다' 통일.

## 강조 색상 태그 적극 활용
\`<red>경고</red>\` / \`<orange>주의</orange>\` / \`<green>긍정</green>\` / \`<blue>핵심</blue>\` / \`<purple>심화</purple>\`

## 마크다운 표 규격
- 헤더·구분선·데이터 행의 열 개수 반드시 일치. 파이프(|) 올바르게 배치.
- 본문 전체에서 서로 다른 주제의 마크다운 표를 반드시 최소 2개 이상 포함.

## H2 소제목 스타일
- 의문문 또는 키워드 포함 명사구로 작성.
- 콜론 앞뒤 한 칸 띄기. 예: \`## 2. 보험사가 기왕증을 꺼내는 진짜 이유 : 실무자가 말하는 현실\`

## AIO 최적화
- 각 H2 섹션의 첫 문장은 해당 섹션 핵심을 1문장으로 요약.

위 뼈대와 규칙을 엄격히 준수하여 본문을 작성해 주세요.`;
}

// ── 메인 실행 ───────────────────────────────────────────────────────────────
async function main() {
  console.log(`=== 자동글쓰기 시작 (${new Date().toISOString()}) ===`);
  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });

  // 1단계에서 저장한 daily-topic.json 로드
  const topicJsonPath = path.join(process.cwd(), 'scripts/daily-topic.json');
  if (!fs.existsSync(topicJsonPath)) {
    throw new Error('daily-topic.json 파일이 존재하지 않습니다. 먼저 select-daily-topic.js를 실행해 주세요.');
  }

  const dailyTopic = JSON.parse(fs.readFileSync(topicJsonPath, 'utf8'));
  console.log(`  [로드] 확정된 오늘의 키워드: '${dailyTopic.keyword}' (출처: ${dailyTopic.source})`);

  const existingPosts = getExistingPosts();

  // Step 2 : 토픽 정보 상세 기획 (AI 호출)
  console.log('[2] 제미나이를 통한 오늘의 토픽 상세 기획 생성 중...');
  const topic = await callGemini(
    buildTopicPromptFromKeyword(dailyTopic.keyword, dailyTopic.trendTitle, existingPosts),
    TOPIC_SCHEMA
  );
  console.log(`    토픽 기획 완료 : ${topic.title} (${topic.slug})`);
  console.log(`    계산기 타입 : ${topic.calculatorType}`);

  console.log('  [대기] 10초 쿨다운...');
  await sleep(10000);

  // Step 3 : 본문 생성
  console.log('[3] 제미나이를 통한 블로그 본문 칼럼 작성 중...');
  const rawOutput = await callGemini(buildPrompt(topic, existingPosts));

  // SEO_META 파싱
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
    console.warn('  [경고] SEO_META 파싱 실패 - 본문 앞부분으로 대체.');
  }
  if (summary.length > 158) summary = summary.slice(0, 155) + '...';

  console.log(`[4] 본문 생성 완료 (${content.length}자) | SEO : ${summary.slice(0, 30)}...`);

  // Step 4 : 저장
  const slug    = resolveUniqueSlug(topic.slug);
  const kstDate = new Date(Date.now() + 9 * 3600 * 1000).toISOString().split('T')[0];
  const tagsStr = topic.tags.map(t => `"${yamlSafe(t)}"`).join(', ');

  const md = `---
title: "${yamlSafe(topic.title)}"
slug: "${slug}"
date: "${kstDate}"
updatedAt: "${kstDate}"
summary: "${summary}"
category: "${yamlSafe(topic.category)}"
regionCategory: ""
specialtyCategory: "${yamlSafe(topic.specialtyCategory)}"
tags: [${tagsStr}]
published: true
---

${content}
`;

  const filePath = path.join(POSTS_DIR, `${slug}.md`);
  fs.writeFileSync(filePath, md, 'utf8');
  console.log(`[5] 저장 완료 : ${filePath}`);
  console.log('=== 자동글쓰기 종료 ===');
}

main().catch(err => {
  console.error(`치명적 오류 : ${err.message}`);
  process.exit(1);
});
