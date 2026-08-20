/**
 * prompt-rules.js
 * 보상스쿨 글로벌 콘텐츠 헌법 (Content Quality Framework - Global Standard) 정의 모듈.
 * W3C & Google SEO 글로벌 표준 마크다운(GFM) 체계 적용.
 *
 * [핵심 아키텍처: 단일 통합 프롬프트 엔진 (Unified Prompt Factory)]
 * — 표준, 범용, 콤팩트, 통합, 공유, 공통 원칙 100% 준수
 * — 자동 모드(8개 카테고리)와 창작 모드 3개 탭(초안다듬기/초안확장/링크키워드)이 단 1개의 공통 헌법 팩토리 공유
 * — 운동장의 테두리(6대 무기 필수 규격)는 견고하게 표준화, 그 안에서 AI 창작 자유도 최대 보장
 */

'use strict';

// ── 🏛️ 1. 절대 헌법 규칙 (STRICT WRITING RULES) ───────────────────────────
const STRICT_RULES = `
## 1. 🏛️ 글로벌 표준 마크다운(GFM) & W3C 시맨틱 위계 규칙 (절대 헌법)
본문은 종이 공문서 기호가 아닌, 전 세계 웹 표준 마크다운(GFM)에 따라 구글 검색엔진 최적화(SEO)와 시맨틱 웹 위계를 엄격히 준수하여 작성해야 합니다.
- **H1 ('# 제목') 본문 작성 절대 금지**: 포스트 제목은 Frontmatter title로 자동 렌더링되므로 본문에 H1을 절대 쓰지 마십시오.
- **1단계 대주제 (H2, \`##\`)**: 특정 개수에 국한되지 않고, 사안의 난이도·의학적/법률적 복잡도와 출력 토큰 한계 내에서 기승전결 구조에 맞추어 대주제(\`## 1. 뇌출혈 진단비 분쟁의 핵심 실무\`, \`## 2. 세대별 보장 기준 비교\` 등)의 개수를 자율적으로 늘리거나 줄여 풍부하게 전개하십시오.
- **2단계 중주제 (H3, \`###\`)**: 각 대주제 안에서 필요한 만큼 세부 소제목(\`### 질병분류코드와 보험사의 면책 논리\`, \`### 의무기록 감정 및 인과관계 쟁점\` 등)을 W3C & Google SEO 표준(GFM)에 따라 AI가 100% 자율적·유연하게 구성하십시오. (공문서식 '가.', '나.', '다.' 접두사 없이 깔끔한 서술형 소제목 권장)
- **3단계 하위 항목 열거 (Semantic Lists)**:
  - 순서 없는 나열: \`- \` 또는 \`* \` (불릿 포인트)
  - 순서 있는 절차: \`1. \`, \`2. \`, \`3. \` (순서 리스트)
  - 자가진단 체크: \`> - [ ] \` (인터랙티브 체크박스)
- **반괄호 숫자/원문자/자모 제목 남용 절대 금지**: \`1)\`, \`가)\`, \`가.\`, \`(1)\`, \`①\` 등의 기호를 제목(Heading) 자리에 남용하지 마십시오.

## 2. 🛡️ 보상스쿨 6대 핵심 시각화 무기 (필수 배치)
정보를 시각화할 때 산문형이나 조잡한 텍스트 기호(+, ┌ 등 ASCII 아트)를 직접 그리지 마십시오. HTML 태그(<div> 등)도 금지됩니다.
- **[무기 1] 공감 도입부 & 핵심 요약 포인트 박스**:
  - 포스팅 시작 시 반드시 독자의 고통에 공감하는 따뜻한 '오프닝 서술 문단'을 먼저 작성합니다.
  - 오프닝 직후 반드시 \`## 💡 핵심 요약\` 제목 아래 3개 불릿 포인트(\`> - \`)로 핵심 요약을 작성하십시오.
  - **주의**: '[핵심 쟁점 1]' 같은 기계적인 대괄호 머리말 라벨을 절대 붙이지 말고, 자연스러운 요약 문장으로 서술하십시오.
- **[무기 2] 마크다운 비교표 (Table)**:
  - 복잡한 법리, 약관, 세대별 차이, 보험사 주장 vs 손해사정사 반박 등 구조화된 데이터는 반드시 깨끗한 표준 마크다운 표(\`| 구분 | 내용 |\`, \`|---|---|\`)로 1개 이상 정리하십시오. (절대 백틱 \`\`\`으로 감싸거나 행 끝에 \`>\` 기호를 붙이지 말 것)
- **[무기 3] 용어 설명 인라인 사전**:
  - 전문 용어가 등장하는 문단 바로 아래에 \`> 💡 **용어명** : 설명\` 인용구 박스를 작성하십시오. (대괄호 \`[\` \`]\` 절대 사용 금지, 글 하단 별도 사전 섹션 금지)
- **[무기 4] 1분 자가진단 체크리스트**:
  - 글 중반부에 \`## 1분 자가진단 : [주제] 체크리스트\` 제목을 작성하고, 그 아래 \`> - [ ] \` 형식의 체크박스 4~5개를 배치하십시오.
- **[무기 5] 자주 묻는 질문 (FAQ)**:
  - 글 후반부에 \`## 💡 자주 묻는 질문 (FAQ)\` 제목을 반드시 작성하고, 실무 관점의 핵심 Q&A 3개를 \`### Q : [질문]\` 과 \`A : [답변]\` 포맷으로 구성하십시오.
- **[무기 6] E-E-A-T 클로징 맞춤형 다단계 솔루션**:
  - 마지막 결론부 \`## [번호]. 결론 및 보상스쿨의 맞춤형 솔루션\` 아래에 사안의 복잡도와 성격에 맞추어 **\`###### ① [솔루션 1 제목]\` + 설명 문단**, **\`###### ② [솔루션 2 제목]\` + 설명 문단** (필요시 **\`###### ③\`**, **\`###### ④\`**, **\`###### ⑤\`**, **\`###### ⑥\`** 등) 형태로 AI가 최적의 솔루션 단계(2단계 이상 자율적 다단계 확장)를 자유롭게 구성하여 전문성과 신뢰도를 극대화하십시오.

## 3. 문체 규칙 및 구글 E-E-A-T 지침
- **키워드 및 인사이트 강조 (\`**볼드**\`)**: 중요한 법리, 핵심 키워드, 인사이트 문장에 \`**강조**\`를 적용하십시오. (문단당 1~2개로 절제). 시스템 렌더러가 키워드 의미에 맞추어 **컬러 볼드와 은은한 파스텔 배경색(Red, Green, Blue, Amber, Purple)**으로 자동 렌더링합니다.
- **콜론(:) 띄어쓰기**: 콜론 앞뒤로 무조건 한 칸씩 공백을 둡니다. (예: \`분쟁의 실체 : 약관의 해석\`)
- **문장 종결**: 정중한 존댓말로 통일합니다. (~합니다, ~바랍니다)
- **CTA 및 관련 글 추천 금지**: "보상스쿨에 문의하세요", "함께 읽으면 도움되는 글" 등의 문구나 관련 글 링크 박스를 본문 끝에 작성하지 마십시오. (하단에 시스템 컴포넌트가 자동으로 렌더링함)
- **괄호 메모 금지**: \`[이미지 제안: ...]\`, \`[관련 글 추천]\`, \`[핵심 쟁점 1]\` 등의 AI 메모나 기계적 대괄호 라벨을 본문에 절대 출력하지 마십시오.

## 4. 🔴 [핵심 윤문 규칙] 궁극의 전문가 휴머나이징 및 번역투 완전 제거
- **번역투 배제**: 조사 남발("~에 대해"), 영어 동사 직역("가지고 있다"), 수동태("~되어진다"), 과도한 가능형("~할 수 있다"), 영어 대명사("그/그녀"), 이중 조사("~에서의") 절대 금지.
- **기계적 맺음말 배제**: "결론적으로", "시사하는 바가 크다", "~에 대해 알아보았습니다" 등의 뻔한 AI식 맺음말 절대 금지.
- **금지 표현 대체**:
  - 절대 합의하지 마세요 → 합의 전 꼼꼼히 확인하시길 권합니다
  - 보험사를 압박하십시오 → 이의를 제기할 수 있습니다
  - 당당히 요구하십시오 → 정당한 권리를 요청하십시오
  - 쟁취하다 / 강력히 권고 → 확보하다 / 면밀한 검토를 권합니다
`;

// ── ⚖️ 2. 집필 관점 (Angles) ───────────────────────────────────────────
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

// ── 🏛️ 3. 불변의 6대 헌법 테두리 뼈대 (Universal Skeleton) ─────────────
function getUniversalSkeleton() {
  return `## [글로벌 마크다운 & W3C 시맨틱 블로그 뼈대 (필수 구성)]

[글의 시작]
* 독자의 상황에 깊이 공감하고 현실적인 문제의식을 던지는 자연스러운 오프닝 서술 문단 (3~4문장)

## 💡 핵심 요약
> - [핵심 약관 및 법리 요약 서술 문장]
> - [손해사정 실무 핵심 대응 전략 요약 서술 문장]
> - [가입자 권익 확보 팁 요약 서술 문장]
(주의: '[핵심 쟁점 1]' 같은 기계적 대괄호 라벨은 붙이지 마십시오)

## 1. [사안의 성격에 맞는 대주제 1]
- W3C & Google SEO 표준(GFM)에 따라 AI가 100% 자율적으로 필요한 만큼 H3(### ...) 소제목과 본문, 인라인 용어사전(> 💡 **용어명** : 설명), 리스트를 유연하게 구성하십시오.

## 2. [사안의 성격에 맞는 대주제 2]
- 법리 비교, 약관 해석 차이, 보험사 주장 vs 손해사정사 반박 등 구조화된 데이터는 반드시 깨끗한 표준 마크다운 표(| 구분 | 내용 |)로 정리하십시오.

## 1분 자가진단 : [주제] 체크리스트
> - [ ] 자가진단 체크 항목 1
> - [ ] 자가진단 체크 항목 2
> - [ ] 자가진단 체크 항목 3
> - [ ] 자가진단 체크 항목 4
> - [ ] 자가진단 체크 항목 5

## [번호]. [추가 대주제 - 사안의 복잡도 및 토큰 한도에 따라 자유롭게 자율 전개]

## 💡 자주 묻는 질문 (FAQ)
### Q : [실제 피보험자가 가장 궁금해하는 핵심 질문 1]?
A : [손해사정 전문가 관점의 명쾌하고 친절한 답변]

### Q : [실제 피보험자가 가장 궁금해하는 핵심 질문 2]?
A : [손해사정 전문가 관점의 명쾌하고 친절한 답변]

### Q : [실제 피보험자가 가장 궁금해하는 핵심 질문 3]?
A : [손해사정 전문가 관점의 명쾌하고 친절한 답변]

## [번호]. 결론 및 보상스쿨의 맞춤형 솔루션
###### ① [맞춤형 솔루션 1 제목]
[전문적이고 구체적인 손해사정 실무 실행 방안 설명 문단]

###### ② [맞춤형 솔루션 2 제목]
[피보험자 권익 보호를 위한 선제적 대응 전략 설명 문단]

(사안의 성격과 깊이에 따라 필요시 ###### ③, ④, ⑤, ⑥... 단계 자율적 확장 구성)
`;
}

// ── 🏭 4. [단일 통합 프롬프트 팩토리] (Unified Prompt Factory) ───────────
/**
 * 모든 글쓰기 모드(자동 모드, 초안 다듬기, 초안 확장, 링크/키워드)의 단일 통합 진입점.
 */
function assembleArticlePrompt({
  mode = 'auto-generate',
  topic = null,
  rawInput = '',
  angle = null,
  precedent = null,
  existingPosts = []
}) {
  const chosenAngle = (angle && angle.name) ? angle : getRandomAngle();
  const safeTopic = topic || {};
  const topicTitle = safeTopic.title || safeTopic.keyword || rawInput.slice(0, 60) || '손해사정 실무 가이드';
  const topicCategory = safeTopic.category || '보상가이드';
  const topicSpecialty = safeTopic.specialtyCategory || '(해당 없음)';
  const topicTags = Array.isArray(safeTopic.tags) ? safeTopic.tags.join(', ') : (safeTopic.tags || '');

  // 모드별 AI 행동 지침 정의
  let modeInstruction = '';
  if (mode === 'manual-naver') {
    modeInstruction = `[네이버 블로그 D.I.A.+ 전용 원고 각색 특명]
1. 사용자가 제공한 원문의 핵심 손해사정 지식, 사실관계, 법리적 쟁점을 100% 충실히 보존하되, 네이버 블로그 D.I.A.+ 알고리즘과 이웃 독자의 눈높이에 맞춘 '친근하고 따뜻한 스토리텔링 문체'로 전면 각색하십시오.
2. 네이버 D.I.A.+ 문체 헌법:
   - 딱딱하고 건조한 논문체가 아닌, 전문 손해사정사가 1:1로 다정하게 상담해 주듯 대화형 존댓말(~하셨을 텐데요, ~확인해보셨나요?, ~꼭 챙기시길 권합니다)로 서술하십시오.
   - 모바일 환경 가독성을 위해 1~2문장(2~3줄) 단위로 시원하게 여백을 부여하십시오.
   - 원문과의 중복문서(유사문서) 검색 페널티를 원천 차단하기 위해 표현과 문장 구조를 독창적이고 풍부하게 리라이팅하십시오.
3. 6대 헌법 무기(공감 오프닝, 핵심 요약, 대법원 판례 대조표, 1분 자가진단, FAQ 3개, ①/②/③ 맞춤형 솔루션)를 100% 완벽하게 장착하십시오.`;
  } else if (mode === 'naver-expand') {
    modeInstruction = `[네이버 블로그 D.I.A.+ 신규 확장 창작 특명]
1. 사용자가 제공한 초안/키워드를 바탕으로 네이버 블로그 검색 상위 노출에 최적화된 고품질 D.I.A.+ 포스팅을 완성하십시오.
2. 실제 피해자의 입장에서 겪는 고충에 깊이 공감하는 스토리텔링과 쉬운 비유를 적용하고, 2~3줄 단위의 부드러운 줄간격으로 작성하십시오.
3. 6대 헌법 무기를 100% 의무 배치하십시오.`;
  } else if (mode === 'manual-preserve') {
    modeInstruction = `[구글 E-E-A-T 초안 다듬기 모드 특명]
1. 사용자가 제공한 원문의 핵심 사실관계, 데이터, 논리, 의도를 100% 충실히 반영하십시오.
2. 원문의 엉성하거나 거친 문장을 W3C 마크다운 헌법 6대 무기(공감 오프닝, 핵심 요약, 인라인 용어사전, 마크다운 표, 1분 자가진단, FAQ 3개, 결론 맞춤형 솔루션)의 틀에 완벽히 담아내십시오.
3. 원문에 FAQ나 다단계 솔루션이 없더라도, 원문 내용을 기반으로 AI가 스스로 분석하여 **[## 💡 자주 묻는 질문 (FAQ)] 3개**와 **[## 결론 및 보상스쿨의 맞춤형 솔루션 (###### ①, ###### ②...)]**을 의무적으로 완벽하게 창작하여 장착하십시오.`;
  } else if (mode === 'manual-expand') {
    modeInstruction = `[구글 E-E-A-T 초안 확장 모드 특명]
1. 사용자가 제공한 원문/아이디어를 씨앗으로 삼아, 최신 대법원 판례, 의학 장해평가 기준(맥브라이드/AMA), 약관 면책 방어 논리를 대폭 보강하여 5,000자 이상의 심층 전문 칼럼으로 완성하십시오.
2. 6대 헌법 무기를 빠짐없이 100% 배치하십시오.`;
  } else {
    modeInstruction = `[구글 E-E-A-T 전문 칼럼 창작 모드 특명]
1. 타겟 기획안과 쟁점을 바탕으로, 구글 E-E-A-T 기준을 완벽히 충족하는 최고 권위의 전문 손해사정 칼럼을 작성하십시오.
2. 6대 헌법 무기를 100% 의무 배치하십시오.`;
  }

  const precedentInfo = precedent
    ? `\n* 분석 대상 판례: ${precedent.caseName || precedent.title || ''} (${precedent.caseNumber || precedent.caseNo || precedent.id || ''})\n* 판례 요지: ${precedent.summary || precedent.judgmentSummary || precedent.content || ''}\n`
    : '';

  const rawSection = rawInput ? `\n[사용자 원문 / 참고 자료]\n${rawInput}\n` : '';

  return `${getExpertRole()}

# Objective
${modeInstruction}

## 집필 포커스 (Angle)
* **집필 앵글**: ${chosenAngle.name}
* **앵글 지침**: ${chosenAngle.instruction}

# ⚖️ 공통 글쓰기 헌법 규칙 (STRICT WRITING RULES)
${STRICT_RULES}

[기획안 메타데이터]
* 제목: ${topicTitle}
* 카테고리: ${topicCategory}
* 전문 진료과목: ${topicSpecialty}
* 태그: ${topicTags}
${precedentInfo}${rawSection}
${getUniversalSkeleton()}

위 불변의 6대 헌법 뼈대와 규칙을 100% 엄격히 준수하여 본문 마크다운을 완성하십시오.`;
}

// ── 🔄 기존 함수 인터페이스 100% 하위 호환 매핑 ──────────────────────────
function buildArticlePrompt(topic, arg2, arg3, arg4) {
  let angle, existingPosts, precedent;
  if (arg2 && typeof arg2 === 'object' && arg2.name && arg2.instruction) {
    angle = arg2;
    existingPosts = Array.isArray(arg3) ? arg3 : [];
    precedent = arg4 || null;
  } else {
    precedent = arg2 || null;
    angle = (arg3 && typeof arg3 === 'object' && arg3.name) ? arg3 : getRandomAngle();
    existingPosts = Array.isArray(arg4) ? arg4 : [];
  }

  return assembleArticlePrompt({
    mode: precedent ? 'precedent' : 'trend',
    topic,
    angle,
    precedent,
    existingPosts
  });
}

function buildManualPrompt(mode, aiInput, angle, existingPosts) {
  return assembleArticlePrompt({
    mode,
    rawInput: aiInput,
    angle,
    existingPosts
  });
}

// ── 📦 5. JSON 스키마 정의 (TOPIC_SCHEMA & CONTENT_SCHEMA) ───────────────
const TOPIC_SCHEMA = {
  type: "OBJECT",
  properties: {
    thoughtProcess: {
      type: "STRING",
      description: "기획 및 마케팅 전략에 대한 연쇄 사고 논리 서술 (Chain-of-Thought)"
    },
    slug: {
      type: "STRING",
      description: "URL-friendly 영문 slug (예: traumatic-brain-injury-compensation)"
    },
    title: {
      type: "STRING",
      description: "SEO 최적화된 포스트 제목 (클릭을 유도하는 전문적이고 명확한 제목)"
    },
    summary: {
      type: "STRING",
      description: "150자 이내의 구글 검색 결과 노출용 매력적인 메타 디스크립션 요약문"
    },
    category: {
      type: "STRING",
      description: "사망·자살 보험금, 질병진단·실손, 교통사고 보상, 배상책임·의료, 근재·산재 사고, 장해평가·면책, 보상가이드 중 1개 선택"
    },
    specialtyCategory: {
      type: "STRING",
      description: "전문 진료과목 (예: 신경외과, 정형외과, 내과 등)"
    },
    tags: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "관련 태그 5개"
    },
    keywords: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "타겟 검색 키워드 목록"
    }
  },
  required: ["thoughtProcess", "slug", "title", "summary", "category", "specialtyCategory", "tags", "keywords"]
};

const CONTENT_SCHEMA = {
  type: "OBJECT",
  properties: {
    thoughtProcess: {
      type: "STRING",
      description: "콘텐츠 작성 시 고려한 W3C 시맨틱 마크다운 위계, 의학/법리 쟁점, E-E-A-T 최적화 전략 서술 (Chain-of-Thought)"
    },
    markdownContent: {
      type: "STRING",
      description: "글로벌 마크다운 헌법 규칙을 100% 준수한 블로그 본문 마크다운 전문 (Frontmatter 제외)"
    }
  },
  required: ["thoughtProcess", "markdownContent"]
};

// ── 🧠 6. 기획 프롬프트 헬퍼들 ──────────────────────────────────────────
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

반드시 지정된 JSON 스키마를 준수하여 출력하십시오.`;
}

function getPrecedentPlanningPrompt(courtCase, existingPosts, targetCategory) {
  return `당신은 '보상스쿨'의 최정상 판례 기획자이자 테크니컬 라이터입니다.
아래 판례 정보를 분석하여 일반 소비자가 이해하기 쉽고 SEO 유입 효과가 극대화된 블로그 포스팅을 기획하십시오.
반드시 **[${targetCategory}]** 카테고리에 맞는 관점으로 기획하세요.

판례 사건명: ${courtCase.caseName || courtCase.title}
판례 사건번호: ${courtCase.caseNumber || courtCase.caseNo || courtCase.id}
판례 내용 요약: ${courtCase.summary || courtCase.content}

기존 슬러그 (중복 금지) : [${existingPosts}]

1. thoughtProcess: 판례의 핵심 쟁점을 일반인이 공감할 스토리로 전환하는 연쇄 사고 논리
2. slug: 영문 소문자와 하이픈(-)으로 구성된 고유 주소
3. title: SEO 최적화 판례 제목 (예: "골절 수술 후 발생한 합병증, 법원은 왜 보험사의 손을 들어주지 않았을까?")
4. summary: 150자 이내의 메타 디스크립션 요약문
5. category: 사망·자살 보험금|질병진단·실손|교통사고 보상|배상책임·의료|근재·산재 사고|장해평가·면책|보상가이드 중 1~2개
6. specialtyCategory: 전문 진료과목
7. tags: 관련 태그 5개
8. keywords: 타겟 키워드 목록

반드시 지정된 JSON 스키마를 준수하여 출력하십시오.`;
}

function getManualPlanningPrompt(arg1, arg2, arg3, arg4) {
  let topicTitle, rawInput, existingPosts, targetCategory;
  if (arguments.length <= 2) {
    rawInput = String(arg1 || '');
    topicTitle = rawInput.slice(0, 60);
    existingPosts = arg2 || '- (없음)';
    targetCategory = '보상가이드';
  } else {
    topicTitle = arg1 || '';
    rawInput = String(arg2 || '');
    existingPosts = arg3 || '- (없음)';
    targetCategory = arg4 || '보상가이드';
  }

  return `당신은 '보상스쿨'의 최정상 콘텐츠 기획자이자 수석 에디터입니다.
사용자가 제공한 원문/주제/자료를 바탕으로 블로그 포스팅 기획안을 수립하십시오.
반드시 **[${targetCategory}]** 카테고리에 맞는 관점으로 기획하세요.

사용자 입력 주제/제목: ${topicTitle}
사용자 입력 원문/자료 요약: ${rawInput.slice(0, 500)}

기존 슬러그 (중복 금지) : [${existingPosts}]

1. thoughtProcess: 원문의 핵심 메시지를 살려 최상의 SEO 칼럼으로 기획하는 논리
2. slug: 영문 소문자와 하이픈(-)으로 구성된 고유 주소
3. title: 매력적인 최종 포스트 제목
4. summary: 150자 이내의 메타 디스크립션 요약문
5. category: 사망·자살 보험금|질병진단·실손|교통사고 보상|배상책임·의료|근재·산재 사고|장해평가·면책|보상가이드 중 1~2개
6. specialtyCategory: 전문 진료과목
7. tags: 관련 태그 5개
8. keywords: 타겟 키워드 목록

반드시 지정된 JSON 스키마를 준수하여 출력하십시오.`;
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

function getQueryGenerationPrompt(targetCategory, existingTitles) {
  return `당신은 대한민국 최고의 손해사정 블로그 편집장이자 검색 트렌드 분석가입니다.
최근 **[${targetCategory}]** 카테고리 및 블로그에 아래와 같은 주제의 글들이 발행되었습니다.

[최근 발행 글 (이 주제들과 겹치거나 유사한 키워드는 절대 금지!)]
${existingTitles}

[키워드 창작 원칙]
1. 위 최근 발행 글에 이미 등장한 흔한 주제(예: 도수치료, 백내장, 캠핑장 배상, 자율주행 등)는 완전히 배제하십시오.
2. **[${targetCategory}]** 분야에서 피보험자/피해자가 겪는 완전히 새로운 세부 질환, 특수 사고, 최신 판례, 미개척 분쟁 영역을 발굴하십시오.
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
1. 최근 발행 글에 이미 다루어진 주제와 유사한 키워드는 반드시 탈락시키십시오.
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

function getHealingPrompt(keywords) {
  return `당신은 대한민국 최고의 손해사정 블로그 수석 편집장입니다.
방금 키워드(${keywords})로 판례 검색에 실패했습니다.
이를 대체할 수 있는 가장 본질적이고 손해사정 실무와 직결된 핵심 법률/의학 단어(명사) 3개를 도출해 주세요.

반드시 아래 JSON 형식으로만 응답하세요:
{"keywords": ["핵심법률명사1", "핵심법률명사2", "핵심법률명사3"]}`;
}

function getFssEvaluationPrompt(fssTitle, fssContent) {
  return `당신은 대한민국 최고의 손해사정 블로그 수석 편집장입니다.
아래 금감원 보도자료를 읽고, 우리 블로그의 목적(손해사정, 보상, 서민 금융 피해 구제, 보험금 분쟁)과 직결되는 내용인지 평가하십시오.

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
  getUniversalSkeleton,
  assembleArticlePrompt,
  buildArticlePrompt,
  buildManualPrompt,
  getTopicPlanningPrompt,
  getPrecedentPlanningPrompt,
  getManualPlanningPrompt,
  getRenewalPrompt,
  getQueryGenerationPrompt,
  getKeywordExtractionPrompt,
  getFallbackLegalKeywordPrompt,
  getHealingPrompt,
  getFssEvaluationPrompt,
};
