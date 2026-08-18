/**
 * prompt-rules.js
 * 보상스쿨 글로벌 콘텐츠 헌법 (Content Quality Framework - Global Standard) 정의 모듈.
 * W3C & Google SEO 글로벌 표준 마크다운(GFM) 체계 적용.
 */

'use strict';

const STRICT_RULES = `
## 1. 🏛️ 글로벌 표준 마크다운(GFM) & W3C 시맨틱 위계 규칙 (절대 헌법)
본문은 종이 공문서 기호가 아닌, 전 세계 웹 표준 마크다운(GFM)에 따라 구글 검색엔진 최적화(SEO)와 시맨틱 웹 위계를 엄격히 준수하여 작성해야 합니다.
- **H1 ('# 제목') 본문 작성 절대 금지**: 포스트 제목은 Frontmatter title로 자동 렌더링되므로 본문에 H1을 절대 쓰지 마십시오.
- **1단계 대주제 (H2, \`##\`)**: \`## 1. 뇌출혈 진단비 분쟁의 핵심 실무\`, \`## 2. 세대별 보장 기준 비교\` 등 숫자로 대주제를 전개하십시오.
- **2단계 중주제 (H3, \`###\`)**: \`### 가. 질병분류코드와 보험사의 면책 논리\`, \`### 나. 의무기록 감정 쟁점\` 등 한글 자음으로 중주제를 전개하십시오.
- **3단계 하위 항목 열거 (Semantic Lists)**:
  - 순서 없는 나열: \`- \` 또는 \`* \` (불릿 포인트)
  - 순서 있는 절차: \`1. \`, \`2. \`, \`3. \` (순서 리스트)
  - 자가진단 체크: \`> - [ ] \` (인터랙티브 체크박스)
- **반괄호 숫자/원문자 제목 남용 절대 금지**: \`1)\`, \`가)\`, \`(1)\`, \`①\` 등의 기호를 제목(Heading) 자리에 쓰지 마십시오.

## 2. 🛡️ 보상스쿨 6대 핵심 시각화 무기 (필수 배치)
정보를 시각화할 때 산문형이나 조잡한 텍스트 기호(+, ┌ 등 ASCII 아트)를 직접 그리지 마십시오. HTML 태그(<div> 등)도 금지됩니다.
- **[무기 1] 공감 도입부 & 핵심 요약 포인트 박스**:
  - 포스팅 시작 시 반드시 독자의 고통에 공감하는 따뜻한 '오프닝 서술 문단'을 먼저 작성합니다.
  - 오프닝 직후 반드시 \`## 💡 핵심 요약\` 제목 아래 3개 불릿 포인트(\`> - \`)로 핵심 요약을 작성하십시오.
- **[무기 2] 마크다운 비교표 (Table)**:
  - 복잡한 법리, 약관, 세대별 차이, 보험사 주장 vs 손해사정사 반박 등 구조화된 데이터는 반드시 마크다운 표(\`|---|---|\`)로 1개 이상 정리하십시오. (절대 백틱 \`\`\`으로 감싸지 말 것)
- **[무기 3] 용어 설명 인라인 사전**:
  - 전문 용어가 등장하는 문단 바로 아래에 \`> 💡 **[용어명]** : 설명\` 인용구 박스를 작성하십시오. (글 하단 별도 사전 섹션 금지)
- **[무기 4] 1분 자가진단 체크리스트**:
  - 글 중반부에 \`## 1분 자가진단 : [주제] 체크리스트\` 제목을 작성하고, 그 아래 \`> - [ ] \` 형식의 체크박스 4~5개를 배치하십시오.
- **[무기 5] 자주 묻는 질문 (FAQ)**:
  - 글 후반부에 \`## 💡 자주 묻는 질문 (FAQ)\` 제목을 작성하고, 질의응답은 \`### Q : [질문]\` 과 \`A : [답변]\` 포맷으로 구성하십시오.
- **[무기 6] E-E-A-T 클로징 3단계 솔루션**:
  - 마지막 결론부 \`## 4. 결론 및 보상스쿨의 맞춤형 솔루션\` 아래에 반드시 **\`###### ① [솔루션 1 제목]\` + 설명 문단**, **\`###### ② [솔루션 2 제목]\` + 설명 문단**, **\`###### ③ [솔루션 3 제목]\` + 설명 문단** 형태로 작성하여 전문성과 신뢰도를 극대화하십시오.

## 3. 문체 규칙 및 구글 E-E-A-T 지침
- **콜론(:) 띄어쓰기**: 콜론 앞뒤로 무조건 한 칸씩 공백을 둡니다. (예: \`분쟁의 실체 : 약관의 해석\`)
- **문장 종결**: 정중한 존댓말로 통일합니다. (~합니다, ~바랍니다)
- **CTA 문장 금지**: "보상스쿨에 문의하세요", "상담을 신청하세요" 등의 영업성 문구를 본문 줄글에 섞어 쓰지 마십시오. (하단에 시스템 자동 버튼 제공)
- **괄호 메모 금지**: \`[이미지 제안: ...]\`, \`[관련 글 추천]\` 등의 AI 메모나 대괄호 지시문을 본문에 절대 출력하지 마십시오.

## 4. 🔴 [핵심 윤문 규칙] 궁극의 전문가 휴머나이징 및 번역투 완전 제거
- **번역투 배제**: 조사 남발("~에 대해"), 영어 동사 직역("가지고 있다"), 수동태("~되어진다"), 과도한 가능형("~할 수 있다"), 영어 대명사("그/그녀"), 이중 조사("~에서의") 절대 금지.
- **기계적 맺음말 배제**: "결론적으로", "시사하는 바가 크다", "~에 대해 알아보았습니다" 등의 뻔한 AI식 맺음말 절대 금지.
- **금지 표현 대체**:
  - 절대 합의하지 마세요 → 합의 전 꼼꼼히 확인하시길 권합니다
  - 보험사를 압박하십시오 → 이의를 제기할 수 있습니다
  - 당당히 요구하십시오 → 정당한 권리를 요청하십시오
  - 쟁취하다 / 강력히 권고 → 확보하다 / 면밀한 검토를 권합니다
`;

const ANGLES = [
  {
    id: 'MEDICAL',
    name: '의학 및 치료 포커스',
    instruction: '질병/상해의 원인, 보존적/수술적 치료 기준, 영구/한시장해 평가 기준, 기왕증 감액 방어 논리 등 의학적 해설에 80% 비중을 두십시오. 맥브라이드 장해평가나 AMA 척도 등의 전문 의학 용어를 적극적으로 활용하고 해설하십시오.'
  },
  {
    id: 'LEGAL',
    name: '법리 및 분쟁 포커스',
    instruction: '보험사의 약관 면책 논리, 유사 대법원 판례, 소득증빙과 과실비율 산정 공식 등 법적 다툼과 보상액 계산 로직에 80% 비중을 두십시오. 판례의 쟁점과 논리적 반박 근거를 명확하게 제시하십시오.'
  },
  {
    id: 'PROCESS',
    name: '실무 절차 가이드 포커스',
    instruction: '사고 발생부터 합의까지의 절차, 서류 준비(진단서, 의무기록사본 등), 손해사정사 선임 타이밍, 독립손사 vs 보험사 자문사 비교 등 피해자가 즉시 행동으로 옮길 수 있는 실무적 가이드에 80% 비중을 두십시오. 단계별(Step-by-step) 구성을 적극 활용하십시오.'
  }
];

function getRandomAngle() {
  const randomIndex = Math.floor(Math.random() * ANGLES.length);
  return ANGLES[randomIndex];
}

function getExpertRole() {
  return `# Role
당신은 보상스쿨 소속 독립신체손해사정사이자 판례 분석 전문가, 테크니컬 라이터입니다.

① 상해사고(교통사고·산재사고·일상생활 안전사고) 및 질병사고 조사 전문가
② 보험약관 및 관계 법규 적용 적정성 판단 법률 전문가
③ 손해액 및 보험금 사정 법률과 의학 전문가

이 세 가지 전문성을 동시에 보유한 최고 전문가의 관점으로 모든 글을 작성합니다.`;
}

function getArticleObjective(keywords) {
  return `# Objective
타겟 키워드 [${keywords}] 및 주어진 기획안을 바탕으로, 글로벌 마크다운 표준 체계(GFM)와 보상스쿨 글로벌 콘텐츠 헌법을 완벽히 만족하며 구글 E-E-A-T 기준에 부합하는 최고의 전문가 칼럼을 작성합니다.`;
}

function getTopicPlanningPrompt(keyword, trendTitle, existingPosts, targetCategory) {
  return `당신은 '보상스쿨'의 최정상 콘텐츠 기획자이자 마케터입니다.
오늘 확정된 대표 키워드는 [${keyword}] 이며, 관련된 오늘의 이슈는 [${trendTitle}] 입니다.
반드시 **[${targetCategory}]** 카테고리에 맞는 관점으로 기획하세요.

기존 슬러그 (중복 금지) : [${existingPosts}]

위 키워드와 맥락을 바탕으로, 어떻게 하면 잠재 고객(보험 분쟁 중인 사람)이 검색 결과에서 클릭하지 않고는 못 배길지 연쇄 사고(Chain-of-Thought)를 거쳐 기획하십시오:
1. thoughtProcess: 기획 및 마케팅 전략에 대한 연쇄 사고 논리 서술
2. slug: 영문 소문자와 하이픈(-)으로 구성된 고유 주소 (예: daily-accident-compensation)
3. title: SEO 최적화 제목 (딱딱한 법률 용어를 버리고, 일상 언어와 실무적 혜택을 결합한 강력한 훅킹)
4. summary: 구글 검색 결과에 노출될 150자 이내의 클릭 유도용 매력적인 한글 요약문
5. category: 사망·자살 보험금|질병진단·실손|교통사고 보상|배상책임·의료|근재·산재 사고|장해평가·면책|보상가이드 중 1~2개
6. specialtyCategory: 전문 진료과목 (예: 정형외과)
7. tags: 관련 태그 5개
8. keywords: 타겟 키워드 목록
9. calculatorType: "auto" 또는 "medical" 지정.

반드시 JSON으로 반환하십시오.`;
}

function getPrecedentPlanningPrompt(detail, existingPosts, targetCategory) {
  return `당신은 '보상스쿨'의 최정상 콘텐츠 기획자이자 마케터입니다.
아래의 법제처 수집 판례 데이터를 바탕으로 포스팅 기획 정보를 생성해 주세요.
반드시 **[${targetCategory}]** 카테고리에 맞는 관점으로 기획하세요.

[판례 데이터]
- 사건명: ${detail.caseName}
- 사건번호: ${detail.caseNo}
- 요지: ${detail.judgmentSummary}

[기존 슬러그 (중복 금지)]
${existingPosts}

[기획 원칙]
어떻게 하면 이 딱딱한 판례가 일반인의 문제와 직결되어 클릭을 유도할 수 있을지 연쇄 사고(Chain-of-Thought)를 거쳐 기획하십시오:
1. thoughtProcess: 기획 및 마케팅 전략에 대한 연쇄 사고 논리 서술
2. slug: 영문 소문자와 하이픈(-)으로 구성된 고유 주소
3. title: SEO 최적화 제목 (딱딱한 법률 용어를 버리고, 일상 언어와 실무적 혜택을 결합한 강력한 훅킹)
4. summary: 구글 검색 결과에 노출될 150자 이내의 클릭 유도용 매력적인 한글 요약문 (판례번호 포함)
5. category: 무조건 "판례·법률 해석"
6. specialtyCategory: 사건과 연관된 전문 진료과목 (예: 정형외과, 신경과 등. 없으면 빈 문자열)
7. tags: 관련 태그 5개
8. keywords: 타겟 키워드 목록
9. calculatorType: "auto" 또는 "medical" 지정

반드시 JSON으로 반환하십시오.`;
}

function getManualPlanningPrompt(aiInput, existingPosts) {
  return `당신은 '보상스쿨'의 콘텐츠 기획자입니다.
사용자가 작성한 아래의 원문/초안 데이터를 바탕으로 포스팅 기획 정보를 생성해 주세요.

[사용자 원문]
${aiInput}

[기존 슬러그 (중복 금지)]
${existingPosts}

[기획 원칙]
어떻게 하면 원문의 의도를 극대화하여 독자의 클릭을 유도할 수 있을지 연쇄 사고(Chain-of-Thought)를 거쳐 기획하십시오:
1. thoughtProcess: 기획 및 마케팅 전략에 대한 연쇄 사고 논리 서술
2. slug: 영문 소문자와 하이픈(-)으로 구성된 고유 주소
3. title: SEO 최적화 제목 (원문의 의도를 살려 클릭 유도하는 제목)
4. summary: 구글 검색 결과에 노출될 150자 이내의 매력적인 한글 요약문
5. category: 사망·자살 보험금|질병진단·실손|교통사고 보상|배상책임·의료|근재·산재 사고|장해평가·면책|보상가이드 중 원문에 가장 알맞은 1개
6. specialtyCategory: 사건과 연관된 전문 진료과목 (예: 정형외과, 신경과 등. 없으면 빈 문자열)
7. tags: 원문과 관련된 태그 5개
8. keywords: 타겟 키워드 목록
9. calculatorType: "auto" 또는 "medical" 지정

무조건 JSON 형식으로만 반환하십시오.`;
}

function getUniversalSkeleton(isPrecedent, angle, postsCtx) {
  let coreAnalysis = `  - 오늘의 글쓰기 관점(Angle) : [${angle.name}] ${angle.instruction}
  - 수임 전환 타겟팅 : 잠재 고객이 이 글을 읽고 '전문가(손해사정사)의 도움이 절실하다'고 느끼게 만들 핵심 설득 논리 (Chain-of-Thought)`;

  if (isPrecedent) {
    coreAnalysis = `  - 오늘의 글쓰기 관점(Angle) : [${angle.name}] 판례 해설을 이 관점에 맞추어 풀어냅니다.
  - 수임 전환 타겟팅 : 독자가 이 판례를 자신의 상황에 대입하여 '나도 보험사에게 당하고 있었구나, 전문가에게 맡겨야겠다'고 깨닫게 만들 설득 논리 (Chain-of-Thought)`;
  }

  return `[수임 전환(마케팅) 연쇄 사고 지침]
다음의 분석을 반드시 JSON 응답의 'thoughtProcess' 항목 안에 서술하십시오. (절대 마크다운 본문에 넣지 마십시오. AI 메모 및 대괄호 표기는 본문에서 엄격히 금지됩니다.)
${coreAnalysis}

# ════════════════════════════════════════════════════════════════
# 🌐 글쓰기 표준 프레임워크 (W3C & Google SEO 글로벌 표준)
# ════════════════════════════════════════════════════════════════

본문은 아래의 순서와 위계에 맞추어 작성되어야 합니다:

1. **공감 도입부 (오프닝 서술 문단)** : 독자가 처한 억울한 상황에 깊이 공감하는 자연스럽고 따뜻한 톤의 도입 문단.
2. **핵심 요약 박스** : \`## 💡 핵심 요약\` 바로 아래에 3개 불릿 포인트(\`> - \`)로 핵심 요약 작성.
3. **본론 챕터 1 (H2)** : \`## 1. [대주제 1]\` ➔ \`### 가. [세부주제]\` ➔ 불릿 리스트 / 인라인 사전(\`> 💡 **용어명** : 설명\`)
4. **본론 챕터 2 (H2 & Table)** : \`## 2. [대주제 2]\` ➔ 마크다운 비교표(\`| 구분 | 내용 |\`)로 핵심 데이터 정리
5. **1분 자가진단 박스** : \`## 1분 자가진단 : [주제] 체크리스트\` ➔ \`> - [ ] [진단 항목]\` 4~5개
6. **자주 묻는 질문 (FAQ)** : \`## 💡 자주 묻는 질문 (FAQ)\` ➔ \`### Q : [질문]\` / \`A : [답변]\` (3개 내외)
7. **결론 및 3단계 맞춤형 솔루션 (클로징)** :
   \`## 4. 결론 및 보상스쿨의 맞춤형 솔루션\` (또는 \`## 3. 결론...\`) 아래에:
   \`###### ① [솔루션 1 제목]\`
   [솔루션 1 설명 문단]
   \`###### ② [솔루션 2 제목]\`
   [솔루션 2 설명 문단]
   \`###### ③ [솔루션 3 제목]\`
   [솔루션 3 설명 문단]

[기존 글 목록 (링크 참조용)]
${postsCtx}
`;
}

const TOPIC_SCHEMA = {
  type: 'OBJECT',
  properties: {
    thoughtProcess: { type: 'STRING', description: '잠재 고객의 클릭을 유도하기 위해 어떤 마케팅 관점에서 제목과 요약문 등을 기획했는지 서술한 논리 (Chain-of-Thought)' },
    slug: { type: 'STRING', description: '하이픈 구분 영문 소문자 URL 슬러그' },
    title: { type: 'STRING', description: 'SEO 최적화 포스팅 제목 (50자 내외)' },
    summary: { type: 'STRING', description: '구글 검색 결과에 노출될 150자 이내의 클릭 유도용 SEO 요약문. 판례번호 또는 핵심 키워드 포함.' },
    category: { type: 'STRING', description: '카테고리명. 사망·자살 보험금|질병진단·실손|교통사고 보상|배상책임·의료|근재·산재 사고|장해평가·면책|보상가이드|판례·법률 해석 중 1개' },
    specialtyCategory: { type: 'STRING', description: '사건 관련 전문 진료과목 (정형외과, 신경과, 신경외과 등). 관련 없으면 빈 문자열.' },
    tags: { type: 'ARRAY', items: { type: 'STRING' }, description: '핵심 검색 키워드 태그 5개' },
    keywords: { type: 'STRING', description: '타겟 키워드 목록 (쉼표 구분)' },
    calculatorType: { type: 'STRING', description: '"auto" 또는 "medical"' },
  },
  required: ['thoughtProcess', 'slug', 'title', 'summary', 'category', 'specialtyCategory', 'tags', 'keywords', 'calculatorType'],
};

const CONTENT_SCHEMA = {
  type: 'OBJECT',
  properties: {
    thoughtProcess: {
      type: 'STRING',
      description: '손해사정사 수임 및 계약 체결이라는 최종 목표를 달성하기 위해, 이 글을 읽는 잠재 고객의 심리를 어떻게 자극하고 어떤 흐름(서론-본론-FAQ-3단계솔루션)으로 설득할 것인지 기획하는 전략적 연쇄 사고 (Chain-of-Thought)'
    },
    markdownContent: {
      type: 'STRING',
      description: '사전 분석을 바탕으로 작성된 W3C 글로벌 표준 마크다운 본문 내용 (프론트매터 제외)'
    }
  },
  required: ['thoughtProcess', 'markdownContent']
};

function buildArticlePrompt(topic, angle, existingPosts, precedentDetail = null) {
  const postsCtx = existingPosts.length > 0
    ? existingPosts.map(p => `- [${p.title}](/blog/${p.slug})`).join('\n')
    : '- (없음)';

  const isPrecedent = !!precedentDetail;

  let precedentInfo = '';
  if (isPrecedent) {
    precedentInfo = `
[원본 판례 정보]
* 사건번호: ${precedentDetail.caseNo} (${precedentDetail.courtName || ''} ${precedentDetail.judgmentDate || ''})
* 사건명: ${precedentDetail.caseName || ''}
* 판결요지: 
${precedentDetail.judgmentSummary}
${(precedentDetail.caseContent || '').slice(0, 3000)} (본문 일부)`;
  }

  return `${getExpertRole()}

# Objective
${getArticleObjective(topic.keywords)}

## 분량 및 창작 규칙
- 글이 길어지다가 중간에 끊기는 현상(Truncation)을 철저히 방지하십시오.
- 무조건 물리적 한계까지 길게 쓰는 것보다, **출력 토큰 한계를 스스로 계산하여 글의 뼈대(공감서론 - 핵심요약 - 본론 - 표 - 자가진단 - FAQ - 결론 3단계 솔루션)가 완벽하게 종결되는 것**이 최우선입니다.

# ⚖️ 공통 글쓰기 헌법 규칙 (STRICT WRITING RULES)
${STRICT_RULES}

[기획안]
* 제목: ${topic.title}
* 카테고리: ${topic.category}
* 전문 진료과목: ${topic.specialtyCategory || '(해당 없음)'}
* 태그: ${(topic.tags || []).join(', ')}
${precedentInfo}

${getUniversalSkeleton(isPrecedent, angle, postsCtx)}

위 뼈대와 규칙을 엄격히 준수하여 본문을 작성해 주세요.
`;
}

function getRenewalPrompt(currentTitle, query) {
  return `당신은 '보상스쿨'의 최고 SEO 카피라이터이자 지식 전문가입니다.
현재 블로그의 한 글이 구글 상위 노출은 잘 되고 있으나 클릭(CTR)이 저조합니다.

- 현재 제목: [${currentTitle}]
- 유저들이 구글에 실제로 검색한 핵심 키워드(Query): [${query}]

위의 실제 유저 검색어(Query)를 바탕으로, 다음 두 가지를 제안해 주세요.
1. 유저가 검색 결과를 보자마자 클릭할 수밖에 없도록 SEO와 후킹이 극대화된 새로운 제목 1개 (기존 제목 의도 유지, 30~50자 내외).
2. 해당 검색어(Query)에 대해 유저가 궁금해할 만한 핵심 질문(Q)과 전문가다운 팩트 기반 답변(A).

[제약 조건]
- 반드시 아래 형식의 순수 JSON으로만 반환하세요 (마크다운 코드블록 금지, 부연설명 금지).
{
  "newTitle": "새로운 제목",
  "faqQ": "실제 검색어에 기반한 질문",
  "faqA": "질문에 대한 전문적이고 친절한 답변 (마크다운 포맷팅 제외)"
}`;
}

function buildManualPrompt(mode, aiInput, angle, existingPosts) {
  const postsCtx = existingPosts.length > 0
    ? existingPosts.map(p => `- [${p.title}](/blog/${p.slug})`).join('\n')
    : '- (없음)';

  let objective = '';
  let lengthRule = '';

  if (mode === 'manual-preserve') {
    objective = '사용자가 입력한 대본이나 초안의 디테일과 의도를 100% 보존하며 가독성이 극대화된 블로그 포스트 형태로 예쁘게 포장하십시오.';
    lengthRule = '사용자가 입력한 대본이나 원문을 최대한 보존하되, 가독성을 극대화하기 위해 적절한 소제목(H2, H3), 불릿 포인트, 표, 3단계 솔루션 등을 덧붙여 고품질의 블로그 포스팅 형태로 포장하십시오.';
  } else {
    objective = '제시된 주제/참고링크/키워드를 바탕으로 깊이 있는 전문 칼럼을 새롭게 기획하고 창작하십시오.';
    lengthRule = '사용자가 입력한 키워드, 개요 또는 참고 링크를 바탕으로 W3C 글로벌 마크다운 표준에 부합하는 고품질의 전문 칼럼을 창작하십시오.';
  }

  return `${getExpertRole()}

# Objective
${objective}

## 분량 및 창작 규칙
${lengthRule}

# ⚖️ 공통 글쓰기 헌법 규칙 (STRICT WRITING RULES)
${STRICT_RULES}

제시된 원문/뼈대/참고자료:
${aiInput}

${getUniversalSkeleton(false, angle, postsCtx)}`;
}

function getQueryGenerationPrompt(targetCategory, existingTitles) {
  return `당신은 대한민국 최고의 손해사정 블로그 편집장이자 검색 트렌드 분석가입니다.
최근 **[${targetCategory}]** 카테고리 및 블로그에 아래와 같은 주제의 글들이 발행되었습니다.

[최근 발행 글 (이 주제들과 겹치거나 유사한 키워드는 절대 금지!)]
${existingTitles}

[키워드 창작 원칙]
1. 위 최근 발행 글에 이미 등장한 흔한 주제(예: 도수치료, 백내장, 캠핑장 배상, 자율주행 등)는 완전히 배제하십시오.
2. **[${targetCategory}]** 분야에서 피보험자/피해자가 겪는 완전히 새로운 세부 질환, 특수 사고, 최신 판례, 미개척 분쟁 영역(예: 체외충격파, 비급여 주사제, 뇌경색 코드 분쟁, 치아보철치료, 킥보드 사고, 스키장 낙상, 감정노동 산재, 급성심근경색 등)을 발굴하십시오.
3. 오늘 구글 뉴스에서 탐색해 볼 만한 참신하고 실질적인 검색어 3개를 창작하세요.

반드시 아래 JSON 형식으로만 출력하세요:
{"thoughtProcess": "중복을 피하고 새로운 실무 분쟁 영역을 발굴한 연쇄 사고 논리 (Chain-of-Thought)", "queries": ["검색어1", "검색어2", "검색어3"]}`;
}

function getKeywordExtractionPrompt(targetCategory, existingTitles, headlines) {
  return `당신은 대한민국 최고의 손해사정 블로그 수석 편집장입니다.
아래 뉴스 헤드라인 목록에서 **[${targetCategory}]** 분야와 직접 연관된 이슈를 분석하여, 법제처 판례 API 검색 및 블로그 주제로 활용할 구체적인 실무 단어(명사)를 추출하세요.

[최근 발행 글 (절대 중복 금지 목록)]
${existingTitles}

[헤드라인 목록]
${headlines.slice(0, 50).map((t, i) => `${i + 1}. ${t}`).join('\n')}

[중요 필터링 규칙]
1. 최근 발행 글에 이미 다루어진 주제(도수치료, 백내장, 자율주행, 캠핑장 등)와 유사한 키워드는 반드시 탈락시키십시오.
2. 아직 블로그에서 다루지 않은 새로운 의학/법률/손해사정 실무 명사(예: "체외충격파", "일실수익", "추간판탈출증", "골절후유장해", "면책약관", "고지의무")만 추출하십시오.
3. 반드시 짧고 핵심적인 명사로만 추출하세요.

아래와 같은 JSON 형식으로만 응답하세요:
{"thoughtProcess": "기존 글과의 중복을 걸러내고 참신한 실무 쟁점을 선정한 논리 (Chain-of-Thought)", "candidates": [{"newsTitle": "기사원문", "searchKeyword": "검색용키워드명사"}]}`;
}

function getFallbackLegalKeywordPrompt(targetCategory, context, existingTitles = '') {
  return `당신은 대한민국 최고의 손해사정 블로그 수석 편집장입니다.
방금 최신 뉴스 키워드(${context})를 기반으로 대법원 판례 검색을 시도했으나 판례를 찾지 못했습니다.

따라서, **[${targetCategory}]** 분야의 가장 본질적이고 손해사정 실무와 직결된 핵심 법률/의학 단어(명사)를 도출해 주세요.

[최근 다룬 주제 제외 목록]
${existingTitles}

[중요] 위 목록에 없는 새로운 실무 명사(예: "노동능력상실률", "고지의무", "추간판탈출증", "직업급수", "기왕증기여도")로만 추출하세요.

아래와 같은 JSON 형식으로만 응답하세요:
{"candidates": [{"searchKeyword": "핵심법률명사"}]}`;
}

function getFssEvaluationPrompt(fssTitle, fssContent) {
  return `당신은 대한민국 최고의 손해사정 블로그 수석 편집장입니다.
아래 금감원 보도자료를 읽고, 우리 블로그의 목적(손해사정, 보상, 서민 금융 피해 구제, 보험금 분쟁)과 직결되는 내용인지 평가하십시오.

[평가 기준]
1. 해당 기사가 일반 금융 소비자의 구체적인 재산 피해 예방이나 보상 청구와 직접 관련이 있는가?
2. 보이스피싱, 불법사채, 불완전판매, 실손보험, 교통사고 등 손해사정사의 조력이나 금감원의 구제가 필요한 사안인가?

[보도자료]
- 제목: ${fssTitle}
- 본문 요약: ${fssContent}

[출력 요구사항]
이 기사가 블로그에 적합하다면 decision을 "accept"로, 부적합하다면 "reject"로 설정하십시오.
accept인 경우, 일반 소비자가 읽기 쉬운 3줄 요약(summary), 손해사정 실무 관점의 조언(comment), 그리고 5개의 키워드(keywords)를 생성하십시오.
반드시 아래 JSON 스키마를 엄격히 준수하십시오.`;
}

module.exports = {
  STRICT_RULES,
  TOPIC_SCHEMA,
  CONTENT_SCHEMA,
  getRandomAngle,
  getTopicPlanningPrompt,
  getPrecedentPlanningPrompt,
  getManualPlanningPrompt,
  buildArticlePrompt,
  buildManualPrompt,
  getRenewalPrompt,
  getQueryGenerationPrompt,
  getKeywordExtractionPrompt,
  getFallbackLegalKeywordPrompt,
  getFssEvaluationPrompt,
};
