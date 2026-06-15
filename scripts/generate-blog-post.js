/**
 * generate-blog-post.js
 * 보상스쿨 블로그 자동글쓰기 스크립트 (Core Agent v3)
 *
 * ✅ 토큰 최적화 전략:
 *   - API 호출 3회 → 2회로 단축 (SEO 요약문을 본문 첫 줄에서 파싱)
 *   - 입력 프롬프트 슬림화 (규칙 핵심만 유지, 장황한 설명 제거)
 *   - 출력 토큰 한도 65536 명시 (gemini-2.5-flash 최대 품질 활용)
 *
 * ✅ 안정성 전략:
 *   - 429 : 65초 대기 (분당 쿼터 리셋 대기)
 *   - 503 : 5→10→20→40초 지수 백오프
 *   - 404 : 즉시 다음 모델로 폴백
 *   - 주력: gemini-2.5-flash / 백업: gemini-2.0-flash
 */
'use strict';
const fs = require('fs');
const path = require('path');

// ── 환경변수 로드 (.env.local) ──
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2]?.replace(/(^['"]|['"]$)/g, '').trim() ?? '';
  });
}

const POSTS_DIR = path.join(process.cwd(), 'src/content/posts');

// ── Gemini 모델 (주력 → 백업 순) ──
// gemini-2.5-flash : 최신 최고 품질, 무료 티어 지원
// gemini-2.0-flash : v1beta 검증된 안전한 백업
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];

// ── 구글 트렌드 수집 ──
async function fetchGoogleTrends() {
  try {
    const res = await fetch('https://trends.google.com/trends/trendingsearches/daily/rss?geo=KR');
    if (!res.ok) return [];
    return [...(await res.text()).matchAll(/<title>(.*?)<\/title>/g)].map(m => m[1]).slice(1, 16);
  } catch { return []; }
}

// ── 기존 포스트 목록 ──
function getExistingPostsInfo() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const files = fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md'));
  // 최대 20개까지만 노출, 슬러그만 반환하여 프롬프트 토큰 절약
  return files.slice(-20).map(f => f.replace(/\.md$/, ''));
}

// ── Gemini API 호출 (429 전용 65초 대기 / 503 지수백오프 / 404 즉시 폴백) ──
async function callGemini(prompt, schema = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.length < 10) throw new Error('유효하지 않은 GEMINI_API_KEY');

  // 출력 토큰 한도: 65536(최대품질) / JSON 모드는 4096으로 충분
  const generationConfig = {
    temperature: 0.75,
    maxOutputTokens: schema ? 4096 : 65536,
  };
  if (schema) {
    generationConfig.responseMimeType = 'application/json';
    generationConfig.responseSchema = schema;
  }

  for (const model of GEMINI_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    console.log(`  [API] 모델 '${model}' 호출 중...`);
    let modelSkip = false;

    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig }),
        });

        if (!res.ok) {
          const errText = await res.text();

          if (res.status === 404) {
            // 모델 자체 없음 → 재시도 없이 바로 다음 모델
            console.error(`  [폴백] '${model}' 404. 백업 모델로 전환합니다.`);
            modelSkip = true; break;
          }
          if (res.status === 429 && attempt < 5) {
            // 분당 한도 초과 → 쿼터 리셋까지 65초 대기
            console.warn(`  [429] ${model} 분당 한도 초과. 65초 대기... (${attempt}/5)`);
            await new Promise(r => setTimeout(r, 65000));
            continue;
          }
          if ((res.status === 503 || res.status >= 500) && attempt < 5) {
            // 서버 과부하 → 지수 백오프
            const w = 5000 * Math.pow(2, attempt - 1);
            console.warn(`  [${res.status}] ${model} 서버 오류. ${w / 1000}초 후 재시도... (${attempt}/5)`);
            await new Promise(r => setTimeout(r, w));
            continue;
          }
          throw new Error(`HTTP ${res.status}: ${errText.slice(0, 200)}`);
        }

        const data = await res.json();
        const text = (data?.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
        if (!text) throw new Error('응답 텍스트 비어있음');

        if (schema) {
          try { return JSON.parse(text.trim()); }
          catch (e) { throw new Error(`JSON 파싱 실패: ${e.message}`); }
        }
        return text;

      } catch (err) {
        if (modelSkip) break;
        if (attempt === 5) {
          console.error(`  [실패] '${model}' 5회 모두 실패. 다음 모델 시도.`);
          break;
        }
        const w = 5000 * Math.pow(2, attempt - 1);
        console.warn(`  [오류] ${err.message.slice(0, 80)}. ${w / 1000}초 후 재시도... (${attempt}/5)`);
        await new Promise(r => setTimeout(r, w));
      }
    }
    if (modelSkip) continue;
  }

  throw new Error('모든 모델이 응답하지 않았습니다. 잠시 후 다시 실행해 주세요.');
}

// ── 프롬프트 헌법 (완전판 - 고품질 규칙 전면 복원) ──
function buildPrompt(topic, existingPosts) {
  const postsCtx = existingPosts.length > 0
    ? existingPosts.map(slug => `- /blog/${slug}`).join('\n')
    : '- (없음)';

  return `# Role
당신은 '보상스쿨' 블로그의 수석 콘텐츠 기획자이자 손해사정 전문 테크니컬 라이터입니다. 구글 SEO 최상위 가이드라인인 '유용하고 신뢰할 수 있는 사용자 중심 콘텐츠(Helpful Content)' 제작 원칙을 완벽히 이해하고 있습니다.

# 출력 형식 (절대 필수 - 반드시 지킬 것)
응답의 **첫 번째 줄**에 반드시 아래 형식으로 SEO 요약문을 먼저 출력하고, 빈 줄 하나를 두고 본문을 시작하십시오:
SEO_META:[구글 검색 결과에 노출될 150자 이내의 매력적인 클릭 유도용 한글 요약문]

그 이후부터 바로 마크다운 본문을 출력하십시오.

# Objective
타겟 키워드 [${topic.keywords}]를 기반으로, 구글 E-E-A-T(경험/전문성/권위성/신뢰성) 및 YMYL(재정적/의학적 중대 의사결정) 기준을 완벽히 만족하는 **최소 5,000자 이상(5,000자~10,000자 적극 권장)**의 풍부하고 깊이 있는 초고품질 전문 칼럼을 작성합니다. 글의 분량이 절대 짧아지거나 서술이 단조롭지 않도록 구체적인 사례와 해석을 상세하게 풀어 써야 합니다.

# Strict Rules (블로그 작성 헌법)

## 1. System Safety & Output Format
- 대화형 응답("네, 작성하겠습니다" 등) 금지. 프론트매터(Frontmatter)나 H1 제목('# 제목') 금지.
- 오직 순수 마크다운(Markdown) 문법으로 본문 출력.
- 특별 허용 : 주제가 **맥브라이드 장해평가, 교통사고, 배상책임** 관련이면 \`<calculator type="auto" />\` 태그를, **실손의료비(실비보험)나 병원비** 관련이면 \`<calculator type="medical" />\` 태그를 본문 적절한 곳에 단 한 번 삽입. (다른 HTML/JSX 태그 금지)

## 2. 구글 E-E-A-T 및 YMYL 준수 (Helpful Content)
- **독창성 (Originality)** : 다른 웹페이지나 법률 약관의 사전적 나열 금지.
- **경험(Experience) 및 전문성(Expertise) 소명** : 실제 손해사정사로서 수년간 분쟁을 해결하며 얻은 주관적인 실무 노하우 (예: "보험사 대리인의 현장 실사 요구 시 녹취 및 대처법", "의료자문 동의 요구 방어 꿀팁")와 같은 **독창적이고 실질적인 분석 기법**을 최소 2개 이상 상세히 제시하십시오.
- **YMYL 신뢰성** : 의학적/법률적 팩트(대법원 판례, 근로복지공단 지침, 장해평가 약관 등)는 정밀하게 검증된 수치와 함께 언급하십시오.

## 3. 독자를 위한 전문 용어 해설 박스 제공 (Readability & SEO)
- 본문 텍스트 내에는 '맥브라이드 장해평가', 'AMA 기준', '기왕증', '동요도', '휴업손해', '도시일용노임' 등 고도의 손해사정 전문 용어들을 괄호 설명 없이 문맥상 자연스럽게 그대로 사용하십시오.
- 대신, 용어를 친절하게 해설하기 위해 아래 두 가지 방식 중 하나를(혹은 둘 다) 상황에 맞게 유연하게 활용하십시오:
  1) [하단 용어 사전]: 본문의 최하단(자주 묻는 질문 FAQ 섹션 바로 위쪽)에 '## [💡 핵심 보상 용어 사전]' (H2) 섹션을 만들고, 본문에 언급된 전문 용어 2~3개의 뜻을 불릿(-)으로 명료하고 친절하게 정리하여 요약 박스 형태로 제공하십시오.
  2) [중간 한 줄 브리핑]: 중요한 핵심 용어가 본문 중간에 처음 등장할 때, 본문 문단 사이에 단독 줄로 인용구 블록(blockquote, '>')을 활용하여 '📖 **<purple>[용어]</purple>** : [설명 내용]' 형태로 군더더기 없이 깔끔하고 신뢰감 주는 한 줄 용어 해설 박스로 눈에 띄게 해설해 주십시오.

## 4. 구조적 가독성 (Readability & Structure)
- **오프닝 규칙 :** 글의 시작은 독자의 억울한 상황에 공감하는 자연스럽고 따뜻한 톤의 2~3문장. 그 후 "이번 포스팅에서는 [주제]에 대해 실제 보상 실무 관점에서 안내해 드리겠습니다."로 서론 마무리.
- **Key Points :** 오프닝 직후, 반드시 **[💡 Key Points]** (H2) 섹션을 만들어 3가지 핵심 포인트를 불릿(-)으로 제시.
- **강조 색상 다변화 :** 내용의 경중에 따라 다채롭게 강조하세요.
  - 경고/위험/금지 : \`<red>절대 합의하지 마세요</red>\`
  - 주의/참고 : \`<orange>향후치료비가 핵심입니다</orange>\`
  - 긍정/해결/안전 : \`<green>휴업손해 전액 인정 가능합니다</green>\`
  - 핵심 강조 : \`<blue>보상스쿨에 문의하세요</blue>\`
  - 심화 내용 : \`<purple>후유장해 진단서 발급</purple>\`
- **단어 간격 규칙 :** 모든 소제목(H2, H3)과 본문 전체에서 콜론(\`:\`)을 사용할 때 반드시 앞뒤로 한 칸씩 띄어 쓰세요. (예: \`## 2. 꿀팁 : 향후치료비\`, \`위자료 : 부상 급수\`)
- **본문 구조 :** 소제목은 \`## (H2)\`와 \`### (H3)\` 계층 엄수. 정보 비교 시 최소 2곳 이상에서 '마크다운 표(Table)' 활용. 표의 헤더 열 개수와 구분선 행 및 데이터 행의 열(Column) 개수가 반드시 일치해야 합니다. 문단 전환 시 가로 실선(\`---\`) 적절히 배치.
- **전문가 조언 :** 주의사항 부분은 인용구(\`> \`) 블록으로 강조.

## 5. 톤앤매너 (Tone & Manner)
- LLM 특유의 상투어("결론적으로", "주의를 기울여야 합니다", "궁극적으로" 등) 절대 금지.
- 도입부/주의사항은 따뜻한 공감 톤, 해결책/기준은 단호한 전문가 톤 혼용.
- 문단은 3~4줄로 짧게 끊고 핵심 키워드는 **볼드** 처리. 어미는 '~입니다/합니다' 통일.

## 6. 자동 내부 링크 (Internal Linking)
- 우리 블로그의 기존 글 슬러그 목록 (이 슬러그들을 사용하여 본문 문맥상 자연스럽게 1~2개 내부 링크를 '[관련 내용 설명](/blog/슬러그)' 형태로 생성하십시오):
${postsCtx}

## 7. 자가진단 (Self-Check)
- 본문 중간 핵심 내용이 끝나는 지점에 **[🛡️ 내 보험금/보상금 1분 자가진단 체크리스트]** (H2) 추가.
- 독자가 상황을 판단할 수 있는 체크박스(☑️) 형태의 질문 3~5개 작성.

## 8. 자주 묻는 질문 (FAQ)
- 글의 맨 마지막에 **## 💡 자주 묻는 질문 (FAQ) TOP 3** (H2) 섹션을 추가하십시오.
- 하위 항목으로 질문 3가지를 작성하되, 반드시 **단일 샵 3개만 사용하는 H3 형식**(\`### Q1 : 질문\`, \`### Q2 : 질문\`, \`### Q3 : 질문\`)으로 작성해야 합니다. 절대 샵 기호를 중복 사용(예: \`### ###\` 등)해서는 안 됩니다.
- 질문 뒤에는 빈 줄을 하나 두고 정갈한 팩트 기반 답변을 작성하십시오.

## 9. 마크다운 표(Table) 작성 규격
- 표를 작성할 때, 헤더 행의 열 개수와 구분선 행 및 내용 데이터 행의 열(Column) 개수가 반드시 일치하도록 하십시오. 파이프(|) 구분자를 올바르게 배치하여 렌더링이 깨지지 않게 하십시오. (예 : 2열짜리 표라면 모든 행이 2개의 열을 갖추어야 함)

## 10. 외부 링크 삽입 제한 (중복 방지)
- 글 본문 내부에는 카카오톡 링크(https://open.kakao.com/...)나 기타 외부 상담 신청서 링크를 삽입하지 마십시오. (사이트 하단에 상담 배너가 항상 노출됩니다.)

## 11. 저자 경험 명시 (E-E-A-T 강화)
- 글의 서론 직후(첫 번째 본론 H2 섹션 시작 직전)에 아래 형태의 저자 경험 박스를 반드시 한 줄 삽입하십시오:
  > ✍️ 이 글은 보상스쿨 손해사정사가 실제 보상 분쟁 처리 경험을 바탕으로 작성한 전문 콘텐츠입니다.
- 이 한 줄은 인용구 블록(>) 형태로 독립된 줄에 삽입하십시오.

## 12. AI 검색(AIO) 최적화 — Google AI Overviews 인용 구조
- 각 H2 섹션의 **첫 번째 문단 첫 문장**은 반드시 해당 섹션의 핵심을 1문장으로 요약하는 문장으로 시작하십시오.
- 예시 형태 : "손해사정사를 선임하면 보상금이 평균 30~50% 더 높게 산정됩니다." → 이후 상세 설명 전개.
- "결론부터 말씀드리면", "핵심은 이것입니다" 등의 표현으로 시작하면 구글 AI Overviews에 인용될 확률이 높아집니다.

## 13. 추천 스니펫(Featured Snippet) 최적화
- H2 소제목을 가능한 한 독자의 실제 검색 의도를 반영하는 **의문문 또는 키워드 포함 명사구**로 작성하십시오.
  - 좋은 예: "## 손해사정사 선임 비용, 얼마나 드나요?", "## 후유장해 등급별 보상금 기준표"
  - 나쁜 예: "## 비용", "## 알아보기"
- 정의·기준이 있는 항목은 반드시 **마크다운 표(Table)**로 구조화하십시오.

위 규칙을 엄격히 준수하여 본문을 작성해 주세요.`;
}

// ── 메인 실행 ──
async function main() {
  console.log(`=== 자동글쓰기 시작 (${new Date().toISOString()}) ===`);
  if (!fs.existsSync(POSTS_DIR)) fs.mkdirSync(POSTS_DIR, { recursive: true });

  // ── Step 1. 토픽 기획 ──
  const existingPosts = getExistingPostsInfo();
  const trends = await fetchGoogleTrends();
  const trendCtx = trends.length > 0
    ? `오늘 구글 트렌드: ${trends.join(', ')}\n(관련 있으면 타겟팅, 억지스러우면 독자 키워드 생성)`
    : '(트렌드 생략)';

  const topicPrompt = `기존 슬러그: [${existingPosts.join(', ')}]
${trendCtx}
중복 없이 검색량 높은 '손해사정/의료/보상' 타겟 키워드 1개 선정.`;

  const topicSchema = {
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

  const topic = await callGemini(topicPrompt, topicSchema);
  console.log(`[1] 토픽 확정 : ${topic.title} (${topic.slug})`);

  // 연속 호출 429 방지 - 30초 쿨다운
  console.log('  [대기] 30초 쿨다운...');
  await new Promise(r => setTimeout(r, 30000));

  // ── Step 2. 본문 + SEO 요약문 동시 생성 (1회 호출로 처리) ──
  // → SEO 요약문을 첫 줄에 포함시켜 별도 3차 API 호출 완전 제거
  const rawOutput = await callGemini(buildPrompt(topic, existingPosts));

  // SEO_META 첫 줄 파싱
  const lines = rawOutput.split('\n');
  let summary = '';
  let contentStartIdx = 0;

  if (lines[0].startsWith('SEO_META:')) {
    summary = lines[0].replace('SEO_META:', '').replace(/"/g, "'").trim();
    contentStartIdx = 1;
    // 빈 줄 스킵
    while (contentStartIdx < lines.length && lines[contentStartIdx].trim() === '') contentStartIdx++;
  }

  const content = lines.slice(contentStartIdx).join('\n').trim();

  // SEO 요약문 파싱 실패 시 자동 생성 (앞 140자 추출)
  if (!summary) {
    const plainText = content.replace(/[#*`>\[\]]/g, '').replace(/\s+/g, ' ').trim();
    summary = plainText.slice(0, 140);
    console.warn('  [경고] SEO_META 파싱 실패. 본문 앞부분으로 대체합니다.');
  }

  // 구글 검색 최적화를 위한 158자 이내 요약 제한 자동 적용 (Group 7)
  if (summary.length > 158) {
    summary = summary.slice(0, 155) + '...';
  }

  console.log(`[2] 본문 생성 완료 (${content.length}자) | SEO: ${summary.slice(0, 30)}...`);

  // ── Step 3. 마크다운 파일 저장 ──
  const kstDate = new Date(Date.now() + 9 * 3600 * 1000).toISOString().split('T')[0];
  const tagsStr = topic.tags.map(t => `"${t}"`).join(',');

  const md = `---
title: "${topic.title}"
date: "${kstDate}"
updatedAt: "${kstDate}"
summary: "${summary}"
category: "${topic.category}"
specialtyCategory: "${topic.specialtyCategory}"
tags: [${tagsStr}]
published: true
---

${content}
`;

  const filePath = path.join(POSTS_DIR, `${topic.slug}.md`);
  fs.writeFileSync(filePath, md, 'utf8');
  console.log(`[3] 저장 완료: ${filePath}\n=== 자동글쓰기 종료 ===`);
}

main().catch(err => {
  console.error(`치명적 오류: ${err.message}`);
  process.exit(1);
});
