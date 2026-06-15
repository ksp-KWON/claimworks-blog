/**
 * generate-blog-post.js
 * 보상스쿨 블로그 자동글쓰기 스크립트 v4.1 (최종)
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

// ── 유틸 (최상단 선언 - 이하 모든 함수에서 사용) ──────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

// frontmatter 값의 큰따옴표를 작은따옴표로 치환, 개행 제거
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

// ── 기존 포스트 목록 (파일명 정렬 후 최신 20개) ───────────────────────────
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

      // HTTP 요청
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

      // HTTP 오류 처리
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

      // 응답 파싱
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

// ── 본문 프롬프트 ───────────────────────────────────────────────────────────
function buildPrompt(topic, existingPosts) {
  const postsCtx = existingPosts.length > 0
    ? existingPosts.map(s => `- /blog/${s}`).join('\n')
    : '- (없음)';

  return `# Role
당신은 '보상스쿨' 블로그의 수석 콘텐츠 기획자이자 손해사정 전문 테크니컬 라이터입니다. 구글 SEO 최상위 가이드라인인 '유용하고 신뢰할 수 있는 사용자 중심 콘텐츠(Helpful Content)' 제작 원칙을 완벽히 이해하고 있습니다.

# 출력 형식 (절대 필수)
응답의 **첫 번째 줄**에 반드시 아래 형식으로 SEO 요약문을 먼저 출력하고, 빈 줄 하나를 두고 본문을 시작하십시오:
SEO_META:[구글 검색 결과에 노출될 150자 이내의 매력적인 클릭 유도용 한글 요약문]

그 이후부터 바로 마크다운 본문을 출력하십시오.

# Objective
타겟 키워드 [${topic.keywords}]를 기반으로, 구글 E-E-A-T(경험/전문성/권위성/신뢰성) 및 YMYL(재정적/의학적 중대 의사결정) 기준을 완벽히 만족하는 **최소 5,000자 이상(5,000자~10,000자 적극 권장)**의 풍부하고 깊이 있는 초고품질 전문 칼럼을 작성합니다.

# Strict Rules

## 1. 출력 포맷
- 대화형 응답 금지. 프론트매터나 H1 제목 금지.
- 순수 마크다운 본문만 출력.
- 주제가 맥브라이드 장해평가/교통사고/배상책임 관련이면 \`<calculator type="auto" />\` 태그를,
  실손의료비/병원비 관련이면 \`<calculator type="medical" />\` 태그를 본문에 단 한 번 삽입.

## 2. E-E-A-T 및 YMYL 준수
- 독창적 분석: 다른 웹페이지의 사전적 나열 금지.
- 실무 노하우(예: 보험사 현장실사 대처법, 의료자문 동의 방어 꿀팁)를 최소 2개 이상 상세히 제시.
- 대법원 판례, 근로복지공단 지침, 장해평가 약관 등 검증된 수치와 함께 언급.

## 3. 전문 용어 해설
- 본문에서 전문 용어(맥브라이드, AMA 기준, 기왕증, 동요도, 휴업손해 등)는 괄호 없이 자연스럽게 사용.
- 해설 방식 (둘 다 또는 하나 선택):
  1) 본문 최하단(FAQ 바로 위): \`## [💡 핵심 보상 용어 사전]\` H2 섹션, 불릿으로 2~3개 정리.
  2) 본문 중간 첫 등장 시: 인용구 블록(\`>\`)으로 '💡 여기서 잠깐!' 형태 삽입.

## 4. 구조적 가독성
- **오프닝**: 독자 상황에 공감하는 따뜻한 2~3문장 → "이번 포스팅에서는 [주제]에 대해 실무 관점에서 안내해 드리겠습니다."
- **Key Points**: 오프닝 직후 \`## [💡 Key Points]\` H2 섹션에 핵심 3가지 불릿 제시.
- **강조 색상**: \`<red>경고</red>\` / \`<orange>주의</orange>\` / \`<green>긍정</green>\` / \`<blue>핵심</blue>\` / \`<purple>심화</purple>\`
- **콜론 간격**: 소제목·본문 전체에서 콜론 앞뒤 한 칸 띄기. (예: \`## 2. 꿀팁 : 향후치료비\`)
- **본문 구조**: H2/H3 계층 엄수. 정보 비교 시 최소 2곳에서 마크다운 표 활용. 표의 모든 행 열 개수 일치. 문단 전환 시 \`---\` 적절히 배치.
- **주의사항**: 인용구(\`> \`) 블록으로 강조.

## 5. 톤앤매너
- LLM 상투어("결론적으로", "주의를 기울여야 합니다", "궁극적으로") 절대 금지.
- 도입부/주의사항은 따뜻한 공감 톤, 해결책/기준은 단호한 전문가 톤 혼용.
- 문단 3~4줄로 끊기. 핵심 키워드 **볼드** 처리. 어미 '~입니다/합니다' 통일.

## 6. 내부 링크
기존 글 슬러그 목록 (본문에 문맥상 자연스럽게 1~2개 삽입):
${postsCtx}

## 7. 자가진단 체크리스트
- 핵심 내용이 끝나는 지점에 \`## [🛡️ 내 보험금/보상금 1분 자가진단 체크리스트]\` H2 추가.
- 체크박스(☑️) 형태 질문 3~5개.

## 8. FAQ 섹션
- 글 맨 마지막에 \`## 💡 자주 묻는 질문 (FAQ) TOP 3\` H2 추가.
- 하위: \`### Q1 : 질문\` / \`### Q2 : 질문\` / \`### Q3 : 질문\` (샵 3개 단독 사용, 중복 금지).
- 질문 뒤 빈 줄 → 팩트 기반 답변.

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
  좋은 예: "## 손해사정사 선임 비용, 얼마나 드나요?" / "## 후유장해 등급별 보상금 기준표"

위 규칙을 엄격히 준수하여 본문을 작성해 주세요.`;
}

// ── 메인 실행 ───────────────────────────────────────────────────────────────
async function main() {
  console.log(`=== 자동글쓰기 시작 (${new Date().toISOString()}) ===`);
  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });

  const existingPosts = getExistingPosts();

  // Step 1: 트렌드 수집
  const trends   = await fetchGoogleTrends();
  const trendCtx = trends.length > 0
    ? `오늘 구글 트렌드 : ${trends.join(', ')}\n(손해사정/보험/의료 관련이면 타겟팅, 아니면 독자 키워드 선정)`
    : '(트렌드 수집 실패 - 독자 키워드로 선정)';

  // Step 2: 토픽 선정
  const topicPrompt =
    `기존 슬러그 : [${existingPosts.join(', ')}]\n${trendCtx}\n` +
    `중복 없이 검색량 높은 손해사정/의료/보상 키워드 1개 선정.`;

  const topic = await callGemini(topicPrompt, TOPIC_SCHEMA);
  console.log(`[1] 토픽 확정 : ${topic.title} (${topic.slug})`);

  console.log('  [대기] 30초 쿨다운...');
  await sleep(30000);

  // Step 3: 본문 생성
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

  // Step 4: 저장
  const slug      = resolveUniqueSlug(topic.slug);
  const kstDate   = new Date(Date.now() + 9 * 3600 * 1000).toISOString().split('T')[0];
  const tagsStr   = topic.tags.map(t => `"${yamlSafe(t)}"`).join(', ');

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
