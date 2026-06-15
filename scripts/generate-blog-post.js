/**
 * generate-blog-post.js
 * 보상스쿨 블로그 자동글쓰기 스크립트 v5
 *
 * v4.1 → v5 변경사항:
 *   [UPDATE-1] 토픽 선정 프롬프트: 총론/가이드형 금지, 각론 구체적 키워드 강제
 *   [UPDATE-2] 본문 프롬프트: 독자 전환 유도 구조 추가 (공감→메커니즘→결과→체크리스트→상담)
 *   [UPDATE-3] 저자 전문성 3축 명시 (사고조사/약관법규/손해액사정)
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
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];

// ── 유틸 ────────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function yamlSafe(str) {
  return String(str).replace(/"/g, "'").replace(/\n/g, ' ').trim();
}

// ── 구글 트렌드 수집 ────────────────────────────────────────────────────────
async function fetchGoogleTrends() {
  try {
    const res = await fetch(
      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=KR',
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) return [];
    const text = await res.text();
    return [...text.matchAll(/<title>(.*?)<\/title>/g)]
      .map(m => m[1].trim())
      .filter(t => t && t !== '대한민국에서 인기 있는 트렌드')
      .slice(0, 15);
  } catch {
    return [];
  }
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
    slug:             { type: 'STRING', description: '하이픈 구분 영문 소문자 URL 슬러그' },
    title:            { type: 'STRING', description: 'SEO 최적화 포스팅 제목' },
    category:         { type: 'STRING', description: '교통사고|배상책임|후유장해|실손의료비|보험상식 중 택1' },
    specialtyCategory:{ type: 'STRING', description: '전문 진료과목 (예: 정형외과)' },
    tags:             { type: 'ARRAY', items: { type: 'STRING' }, description: '관련 태그 5개' },
    keywords:         { type: 'STRING', description: '타겟 키워드 목록 (쉼표 구분)' },
  },
  required: ['slug', 'title', 'category', 'specialtyCategory', 'tags', 'keywords'],
};

// ── 토픽 선정 프롬프트 ──────────────────────────────────────────────────────
function buildTopicPrompt(existingPosts, trendCtx) {
  return `당신은 독립 신체손해사정사 전문 블로그 '보상스쿨'의 콘텐츠 기획자입니다.
보상스쿨 손해사정사의 업무 영역은 3가지입니다:
  1) 사고 조사 전문가 : 교통사고·산재사고·일상생활 안전사고·질병사고의 손해 발생 사실 확인
  2) 법률 전문가 : 보험약관 및 관계 법규 적용의 적정성 판단
  3) 의학 전문가 : 손해액 및 보험금 사정

기존 슬러그 (중복 금지) : [${existingPosts.join(', ')}]
${trendCtx}

── 키워드 선정 원칙 (반드시 준수) ──

[금지] 총론·가이드형 주제
  - "후유장해 청구 가이드", "실손보험 청구 방법", "암진단비 총정리" 같은
    포괄적이고 일반적인 주제는 절대 선정 금지.

[필수] 각론·구체적 분쟁 장면 키워드
  - 반드시 아래 3요소를 모두 포함하는 구체적인 키워드를 선정할 것:
    ① 구체적 상병명 또는 사고 유형 (예: 반월상연골판 파열, 쿠팡이츠 배달사고, 필러 시술 부작용)
    ② 보험사와의 분쟁 포인트 (예: 부분파열 vs 완전파열 판정, 기왕증 공제 비율, 재해사망 vs 질병사망)
    ③ 손해사정사 개입이 필요한 이유 (예: 후유장해 등급 상향, 휴업손해 과소지급 정정, 보험금 부지급 번복)

[트렌드 활용 원칙]
  - 트렌드 키워드가 있을 경우, 그 키워드와 관련된 사고 유형에서
    실제로 발생하는 보험 분쟁 장면을 구체적으로 결합할 것.
  - 트렌드와 손해사정 업무의 연결이 억지스러우면 트렌드를 무시하고
    독자 기획 키워드를 선정할 것.

[독자 전제]
  - 이 글을 검색하는 사람은 이미 사고 또는 질병의 당사자이거나
    보험금 지급 결과에 의문을 품고 있는 상태임.
  - 검색 시점 = 손해사정사 상담이 필요한지 판단하는 시점.

위 원칙에 따라 검색량 높고 경쟁 강도가 낮은 각론 키워드 1개를 선정하십시오.`;
}

// ── 본문 프롬프트 ───────────────────────────────────────────────────────────
function buildPrompt(topic, existingPosts) {
  const postsCtx = existingPosts.length > 0
    ? existingPosts.map(s => `- /blog/${s}`).join('\n')
    : '- (없음)';

  return `# Role
당신은 '보상스쿨' 블로그의 수석 콘텐츠 기획자이자 손해사정 전문 테크니컬 라이터입니다.
보상스쿨 손해사정사는 다음 3개 영역의 전문가입니다:
  - 사고 조사 전문가 : 교통사고·산재·일상생활 안전사고·질병사고의 손해 발생 사실 확인
  - 법률 전문가 : 보험약관 및 관계 법규 적용의 적정성 판단
  - 의학 전문가 : 손해액 및 보험금 사정

# 출력 형식 (절대 필수)
응답의 **첫 번째 줄**에 반드시 아래 형식으로 SEO 요약문을 먼저 출력하고, 빈 줄 하나를 두고 본문을 시작하십시오:
SEO_META:[구글 검색 결과에 노출될 150자 이내의 매력적인 클릭 유도용 한글 요약문]

# Objective
타겟 키워드 [${topic.keywords}]를 기반으로, 구글 E-E-A-T 및 YMYL 기준을 완벽히 만족하는
**최소 5,000자 이상(5,000자~10,000자 적극 권장)**의 초고품질 전문 칼럼을 작성합니다.

# 핵심 글쓰기 목표 (최우선)
이 글을 읽는 독자는 이미 사고 또는 질병의 당사자이거나, 보험금 지급 결과에 의문을 품고 있습니다.
글의 최종 목적은 독자가 "나는 손해사정사의 도움이 필요한 상황이다"를 스스로 판단하고
자연스럽게 상담 신청에 이르도록 안내하는 것입니다.

이를 위해 글의 흐름을 반드시 아래 5단계 구조로 전개하십시오:

  [1단계] 공감 : 독자가 처한 구체적인 억울한 상황을 정확히 묘사
  [2단계] 메커니즘 해설 : 보험사가 과소지급하거나 부지급하는 실제 이유와 방식을 전문가 시각으로 해설
  [3단계] 결과 비교 : 손해사정사 개입 전/후의 보험금 차이를 구체적 수치·사례로 제시
  [4단계] 자가진단 : 독자가 "내가 손해사정사가 필요한 상황인지" 스스로 판단할 수 있는 체크리스트
  [5단계] 상담 유도 : 강압적이지 않고 자연스럽게 전문가 도움의 필요성으로 마무리

# Strict Rules

## 1. 출력 포맷
- 대화형 응답 금지. 프론트매터나 H1 제목 금지.
- 순수 마크다운 본문만 출력.
- 주제가 맥브라이드 장해평가/교통사고/배상책임 관련이면 \`<calculator type="auto" />\` 태그를,
  실손의료비/병원비 관련이면 \`<calculator type="medical" />\` 태그를 본문에 단 한 번 삽입.

## 2. E-E-A-T 및 YMYL 준수
- 독창적 분석: 다른 웹페이지의 사전적 나열 금지.
- 보험사가 실제로 사용하는 과소지급 전술(기왕증 공제 과다 적용, 의료자문 활용, 부분손해 주장 등)을
  손해사정사 실무 경험을 바탕으로 구체적으로 2개 이상 해설할 것.
- 대법원 판례, 근로복지공단 지침, 장해평가 약관 등 검증된 수치와 함께 언급.

## 3. 전문 용어 해설
- 본문에서 전문 용어(맥브라이드, AMA 기준, 기왕증, 동요도, 휴업손해 등)는 괄호 없이 자연스럽게 사용.
- 해설 방식 (둘 다 또는 하나 선택):
  1) 본문 최하단(FAQ 바로 위): \`## 💡 핵심 보상 용어 사전\` H2 섹션, 불릿으로 2~3개 정리.
  2) 본문 중간 첫 등장 시: 인용구 블록(\`>\`)으로 '💡 여기서 잠깐!' 형태 삽입.

## 4. 구조적 가독성
- **오프닝**: 독자가 처한 구체적인 상황을 직접적으로 묘사하는 2~3문장 (공감 극대화)
  → "이번 포스팅에서는 [주제]에 대해 실무 관점에서 안내해 드리겠습니다."로 마무리.
- **Key Points**: 오프닝 직후 \`## 💡 Key Points\` H2 섹션에 핵심 3가지 불릿 제시. (절대 대괄호 [ ] 씌우지 말 것)
- **강조 색상**: \`<red>경고</red>\` / \`<orange>주의</orange>\` / \`<green>긍정</green>\` / \`<blue>핵심</blue>\` / \`<purple>심화</purple>\`
- **콜론 간격**: 소제목·본문 전체에서 콜론 앞뒤 한 칸 띄기. (예: \`## 2. 꿀팁 : 향후치료비\`)
- **본문 구조**: H2/H3 계층 엄수. 정보 비교나 기준 제시 시, 본문 전체에 걸쳐 서로 다른 주제의 '마크다운 표(Table)'를 **반드시 최소 2개 이상** 활용하십시오. 표의 모든 행 열 개수 일치. 문단 전환 시 \`---\` 적절히 배치.
- **주의사항**: 인용구(\`> \`) 블록으로 강조.

## 5. 톤앤매너
- LLM 상투어("결론적으로", "주의를 기울여야 합니다", "궁극적으로") 절대 금지.
- 도입부는 따뜻한 공감 톤, 보험사 전술 해설은 냉철한 분석 톤, 해결책은 단호한 전문가 톤.
- 문단 3~4줄로 끊기. 핵심 키워드 **볼드** 처리. 어미 '~입니다/합니다' 통일.

## 6. 내부 링크 (반드시 마크다운 링크 포맷 준수)
기존 글 슬러그 목록이 주어집니다. 본문 문맥상 자연스럽게 연관이 있는 포스팅을 골라, **반드시 '[텍스트 제목](/blog/슬러그)' 마크다운 링크 형태로 1~2개 생성**하십시오. 절대 단순 텍스트 경로(예: /blog/슬러그)만 적어서는 안 됩니다.
${postsCtx}

## 7. 자가진단 체크리스트 (4단계 - 핵심 장치)
- 핵심 내용이 끝나는 지점에 \`## 🛡️ 지금 손해사정사가 필요한 상황인지 1분 체크\` H2 추가. (절대 대괄호 [ ] 씌우지 말 것)
- 독자가 상황을 선택할 수 있도록 **반드시 \`- [ ] ☑️ [질문]\` 마크다운 체크박스 형태로 질문 4~5개 작성**.
- 예시 형태:
  - [ ] ☑️ 보험사가 기왕증을 이유로 보험금 일부를 공제했다는 통보를 받았다
  - [ ] ☑️ 진단서상 병명과 보험사의 지급 결정 사유가 다르다
  - [ ] ☑️ 후유장해 진단을 받았지만 보험사에서 해당 없다고 했다
  - [ ] ☑️ 합의를 권유받았지만 향후치료비가 얼마인지 모르는 상태다
  - [ ] ☑️ 위 항목 중 하나라도 해당된다면 손해사정사 검토가 필요한 상황입니다

## 8. FAQ 섹션
- 글 맨 마지막에 \`## 💡 자주 묻는 질문 (FAQ) TOP 3\` H2 추가.
- 하위: \`### Q1 : 질문\` / \`### Q2 : 질문\` / \`### Q3 : 질문\` (샵 3개 단독 사용, 중복 금지).
- 질문 뒤 빈 줄 → 팩트 기반 답변.
- FAQ 마지막 질문은 반드시 "손해사정사에게 의뢰하면 비용이 얼마나 드나요?" 또는
  "손해사정사 없이 혼자 해결할 수 있나요?" 중 하나로 설정하여 자연스러운 상담 유도.

## 9. 마크다운 표 규격
- 헤더/구분선/데이터 행의 열 개수 반드시 일치. 파이프(\`|\`) 올바르게 배치.

## 10. 외부 링크 제한
- 카카오톡 오픈채팅 링크, 외부 상담 신청서 링크 본문 삽입 금지.

## 11. 저자 경험 박스
- 서론 직후(첫 H2 시작 직전)에 아래 한 줄 단독 삽입:
  > ✍️ 이 글은 보상스쿨 손해사정사가 실제 보상 분쟁 처리 경험을 바탕으로 작성한 전문 콘텐츠입니다.

## 12. AIO 최적화
- 각 H2 섹션의 첫 문장은 해당 섹션 핵심을 1문장으로 요약.
- "결론부터 말씀드리면", "핵심은 이것입니다" 등 표현 적극 활용.

## 13. 추천 스니펫 최적화
- H2 소제목은 의문문 또는 키워드 포함 명사구로 작성.
  좋은 예: "## 보험사가 부분파열이라고 우기는 이유" / "## 기왕증 공제 비율, 어디까지 정당한가"

위 규칙을 엄격히 준수하여 본문을 작성해 주세요.`;
}

// ── 메인 실행 ───────────────────────────────────────────────────────────────
async function main() {
  console.log(`=== 자동글쓰기 시작 (${new Date().toISOString()}) ===`);
  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });

  const existingPosts = getExistingPosts();

  // Step 1 : 트렌드 수집
  const trends   = await fetchGoogleTrends();
  const trendCtx = trends.length > 0
    ? `오늘 구글 트렌드 : ${trends.join(', ')}\n(손해사정/보험/의료 관련이면 타겟팅, 아니면 독자 키워드 선정)`
    : '(트렌드 수집 실패 - 독자 키워드로 선정)';

  // Step 2 : 토픽 선정
  const topic = await callGemini(buildTopicPrompt(existingPosts, trendCtx), TOPIC_SCHEMA);
  console.log(`[1] 토픽 확정 : ${topic.title} (${topic.slug})`);

  console.log('  [대기] 30초 쿨다운...');
  await sleep(30000);

  // Step 3 : 본문 생성
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

  const content = lines.slice(contentStart).join('\n').trim();

  if (!summary) {
    summary = content.replace(/[#*`>[\]!]/g, '').replace(/\s+/g, ' ').trim().slice(0, 140);
    console.warn('  [경고] SEO_META 파싱 실패 - 본문 앞부분으로 대체.');
  }
  if (summary.length > 158) summary = summary.slice(0, 155) + '...';

  console.log(`[2] 본문 생성 완료 (${content.length}자) | SEO : ${summary.slice(0, 30)}...`);

  // Step 4 : 저장
  const slug    = resolveUniqueSlug(topic.slug);
  const kstDate = new Date(Date.now() + 9 * 3600 * 1000).toISOString().split('T')[0];
  const tagsStr = topic.tags.map(t => `"${yamlSafe(t)}"`).join(', ');

  const md = `---
title: "${yamlSafe(topic.title)}"
date: "${kstDate}"
updatedAt: "${kstDate}"
summary: "${summary}"
category: "${yamlSafe(topic.category)}"
specialtyCategory: "${yamlSafe(topic.specialtyCategory)}"
tags: [${tagsStr}]
published: true
---

${content}
`;

  const filePath = path.join(POSTS_DIR, `${slug}.md`);
  fs.writeFileSync(filePath, md, 'utf8');
  console.log(`[3] 저장 완료 : ${filePath}`);
  console.log('=== 자동글쓰기 종료 ===');
}

main().catch(err => {
  console.error(`치명적 오류 : ${err.message}`);
  process.exit(1);
});
