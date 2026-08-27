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

// ── 1. 절대 헌법 규칙 (STRICT WRITING RULES) ───────────────────────────
const STRICT_RULES = `
## 1. 글로벌 표준 마크다운(GFM) & W3C 시맨틱 위계 규칙 (절대 헌법)
본문은 종이 공문서 기호가 아닌, 전 세계 공식 표준 마크다운(GFM)에 따라 구글 검색엔진 최적화(SEO)와 시맨틱 위계를 엄격히 준수하여 작성해야 합니다.
- **H1 ('# 제목') 본문 작성 절대 금지**: 포스트 제목은 Frontmatter title로 자동 렌더링되므로 본문에 H1을 절대 쓰지 마십시오.
- **1단계 대주제 (H2)**: 본문 대주제는 사안의 난이도에 따라 **'## 1. [쟁점 및 법리]' ➔ '## 2. [단계별 실무 절차]' ➔ '## 3. [비교 분석 및 반박]' ➔ '## 4. [의학적 요건 및 장해 기준]'** 등으로 순차 번호를 부여하여 자연스럽게 전개하며, 마지막 결론부는 **'## 결론 및 보상스쿨의 맞춤형 솔루션'** 체계로 확고하게 전개합니다. (FAQ나 결론부 헤더에는 '4.', '5.' 등 숫자 번호를 붙이지 마십시오)
- **2단계 중주제 (H3)**: 각 H2 챕터 안에서 필요한 만큼 세부 주제를 '### 질병분류코드와 보험사의 면책 논리', '### 의무기록 감정 및 인과관계 쟁점' 등 W3C & Google SEO 표준에 따라 AI가 100% 자율적·유연하게 무제한 구성하십시오.
- **3단계 하위 목록 구조**: 순서 없는 나열('- ' 또는 '* '), 순서 있는 절차('1. ', '2. '), 자가진단 체크('> - [ ] ')
- **순수 텍스트 미니멀리즘 (No Emoji in Markdown)**: 본문 및 헤딩에 💡, 🎯, 📌, ❓, 🛡️, ✅ 등 유니코드 이모지를 직접 쓰지 않고 순수 텍스트로만 작성합니다.

## 2. 보상스쿨 7대 핵심 시각화 무기 (W3C 모던 단색 SVG 심볼 시스템 자동 장착)
정보를 시각화할 때 조잡한 유니코드 이모지(💡, 📌, 🚗 등)나 HTML 태그는 금지되며, 순수 텍스트 마크다운으로 작성하면 시스템 렌더러가 W3C 모던 단색 SVG 라인 심볼을 톤온톤으로 자동 결합합니다.
- **[무기 1] 핵심 요약 박스 & 감성 오프닝 (Lightbulb SVG)**: 최상단에 '## 핵심 요약' 제목 아래 3개 불릿 포인트('> - **핵심 키워드** : 구체적 설명')로 핵심 요약을 먼저 작성하고, 직후 2~3문장의 따뜻한 오프닝 서술을 전개합니다.
- **[무기 2] 이 글의 목차 (List Index SVG)**: 시스템이 본문 H2 챕터를 기반으로 자동 렌더링합니다.
- **[무기 3] 1분 자가진단 체크리스트 (Clipboard Check SVG)**: 1번 본문 챕터 직후 또는 중반부에 '## 1분 자가진단 : [주제] 체크리스트' 제목을 작성하고, 그 아래 '> - [ ] ' 형식의 체크박스 4~5개를 배치하십시오.
- **[무기 4] 자주 묻는 질문 (FAQ) (Message Circle SVG)**: 본문 후반부에 '## 자주 묻는 질문 (FAQ)' 제목을 작성하고, 핵심 Q&A 3개를 '### Q : [질문]' 과 'A : [답변]' 포맷으로 구성하십시오.
- **[무기 5] 보상스쿨 피드백 & 실무 인사이트 (Shield Insight SVG)**: 손해사정 실무 노하우나 핵심 주의사항, 심층 반박 논리를 강조할 때 '> ### 보상스쿨 피드백 & 실무 인사이트' 인용구 조언 박스를 본문 적재적소에 자유롭게 배치하십시오.
- **[무기 6] 전역 계산기 아코디언 (Calculator SVG)**: 모든 포스트 하단에 자동차/실손/배상책임 통합 계산기가 자동 렌더링됩니다.
- **[무기 7] E-E-A-T 클로징 맞춤형 다단계 솔루션 & CTA 배너 (Shield Check SVG)**: 결론부 '## 결론 및 보상스쿨의 맞춤형 솔루션' 아래에 '###### ① [해결 솔루션 제목]'과 설명 문단으로 구성하십시오. (시스템이 프리미엄 에메랄드 그린 승소 카드와 상담 신청 배너로 자동 렌더링합니다.)
- **[공통 서식] 마크다운 비교표 (Table) & 인라인 용어사전**: 복잡한 법리/약관은 표준 마크다운 표('| 구분 | 내용 |')로, 전문 용어는 '> **용어명** : 설명' 인라인 인용구로 작성하십시오.

## 3. 문체 규칙, 표준 문단 호흡 및 키워드 강조
- **표준 문단 호흡 규칙 (GFM Paragraph Breathing Rule)**: 하나의 완결된 생각(논리 덩어리)을 하나의 문단으로 묶고, 다음 문단으로 전환 시 **반드시 표준 빈 줄 1개(엔터 2회)로 구분**하십시오. 모바일 및 PC 가독성을 위해 기본 **2~4문장(150~250자 내외)의 호흡을 권장**하며, 5문장 이상 빽빽하게 이어지는 벽돌 문단(Wall of Text)이나 문장 중간 강제 줄바꿈에 의한 텍스트 파편화는 금지합니다.
- **키워드 및 인사이트 강조 ('**볼드**')**: 중요한 법리, 핵심 키워드, 인사이트 문장에 문단당 1~2개 이하로 절제하여 '**강조**'를 적용하십시오. (시스템 렌더러가 단어의 의미적 맥락을 분석하여 **위험(레드)/승소(에메랄드)/핵심(앰버)/전문법리(퍼플)/기본(블루) 5대 톤온톤 컬러 볼드와 은은한 파스텔 배경색**으로 자동 렌더링합니다.)
- **콜론(:) 띄어쓰기**: 콜론 앞뒤로 무조건 한 칸씩 공백을 둡니다. (예: '분쟁의 본질 : 약관의 해석')
- **문장 종결**: 정중한 존댓말로 통일합니다. (~합니다, ~권합니다)
- **CTA 및 관련글 수동 작성 금지**: '보상스쿨에 문의하세요', '함께 읽으면 좋은 글' 등의 문구를 본문 끝에 임의로 작성하지 마십시오.
`;

// ── 2. 집필 관점 (Angles) ───────────────────────────────────────────
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

// ── 3. 불변의 6대 헌법 테두리 뼈대 (Universal Skeleton) ─────────────
function getUniversalSkeleton() {
  return `## [글로벌 마크다운 & W3C 시맨틱 블로그 뼈대 (필수 구성)]

## 핵심 요약
> - **[핵심 키워드 1]** : [핵심 약관 및 법리 요약 서술 문장]
> - **[핵심 키워드 2]** : [손해사정 실무 핵심 대응 전략 요약 서술 문장]
> - **[핵심 키워드 3]** : [가입자 권익 확보 팁 요약 서술 문장]
(주의: '[핵심 쟁점 1]' 같은 기계적 대괄호 라벨은 붙이지 마십시오)

[도입부 공감 오프닝]
* 독자의 상황에 깊이 공감하고 현실적인 문제의식을 던지는 자연스러운 오프닝 서술 문단 (3~4문장)

## 1. [사안의 성격에 맞는 대주제 1]
- W3C & Google SEO 표준(GFM)에 따라 AI가 100% 자율적으로 필요한 만큼 H3(### ...) 소제목과 본문, 인라인 용어사전(> **용어명** : 설명), 리스트를 유연하게 구성하십시오.

## 2. [사안의 성격에 맞는 대주제 2]
- 법리 비교, 약관 해석 차이, 보험사 주장 vs 손해사정사 반박 등 구조화된 데이터는 반드시 깨끗한 표준 마크다운 표(| 구분 | 내용 |)로 정리하십시오.

## 1분 자가진단 : [주제] 체크리스트
> - [ ] 자가진단 체크 항목 1
> - [ ] 자가진단 체크 항목 2
> - [ ] 자가진단 체크 항목 3
> - [ ] 자가진단 체크 항목 4

## 3. [사안의 성격에 맞는 대주제 3]
- 심층 실무 조언 작성 시 '> ### 보상스쿨 피드백 & 실무 인사이트' 시그니처 박스를 활용하십시오.

## 4. [사안의 성격에 맞는 대주제 4]
- 의학적 판정 기준, 후유장해 평가 척도(맥브라이드/AMA), 손해액 산출 공식 등을 명확히 기술하십시오. (사안에 따라 3~4개 대주제로 자율 구성)

## 자주 묻는 질문 (FAQ)
### Q : [실제 피보험자가 가장 궁금해하는 핵심 질문 1]?
A : [손해사정 전문가 관점의 명쾌하고 친절한 답변]

### Q : [실제 피보험자가 가장 궁금해하는 핵심 질문 2]?
A : [손해사정 전문가 관점의 명쾌하고 친절한 답변]

### Q : [실제 피보험자가 가장 궁금해하는 핵심 질문 3]?
A : [손해사정 전문가 관점의 명쾌하고 친절한 답변]

## 결론 및 보상스쿨의 맞춤형 솔루션
###### ① [맞춤형 솔루션 1 제목]
[전문적이고 구체적인 손해사정 실무 실행 방안 설명 문단]

###### ② [맞춤형 솔루션 2 제목]
[피보험자 권익 보호를 위한 선제적 대응 전략 설명 문단]

###### ③ [맞춤형 솔루션 3 제목]
[전액 수령 및 권리 구제를 위한 실행 방안 설명 문단]
`;
}

// ── 4. [단일 통합 프롬프트 팩토리] (Unified Prompt Factory) ───────────
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

  let modeInstruction = '';
  if (mode === 'manual-naver') {
    modeInstruction = `[네이버 블로그 D.I.A.+ 전용 원고 각색 특명 (옴니-인지 3단계 라이프사이클)]
1. [1단계: 거시적 본질 및 입체 탐색 (Step-Back & ToT/GoT)]: 원문의 쟁점을 분석하여 네이버 독자가 공감할 수 있는 1:1 상담 대화체와 스토리텔링으로 재구성하는 전략, 모바일 가독성 호흡 설계를 thoughtProcess에 심층 기술하십시오.
2. [2단계: 정밀 실행 (CoT & PoT)]: 인과관계에 입각한 생각의 사슬과 정밀한 손해액 산정으로 6대 헌법 무기(핵심요약/오프닝/비교표/인라인사전/자가진단/FAQ/맞춤솔루션)를 완벽 장착하십시오.
3. [3단계: 자가 비판 및 검증 (Reflexion & Self-Consistency)]: 네이버 스마트에디터 호환성 및 이모지 배제 규칙을 자체 점검하십시오.`;
  } else if (mode === 'naver-expand') {
    modeInstruction = `[네이버 블로그 D.I.A.+ 신규 확장 창작 특명 (옴니-인지 3단계 라이프사이클)]
1. [1단계: 거시적 본질 및 입체 탐색 (Step-Back & ToT/GoT)]: 실제 피해자의 고충과 검색 의도를 분석하고, 상위 법리 원칙과 공감 스토리텔링 기획을 thoughtProcess에 심층 기술하십시오.
2. [2단계: 정밀 실행 (CoT & PoT)]: 2~3줄 단위의 부드러운 줄간격과 정밀한 손해사정 실무 법리를 6대 헌법 무기 틀에 담아 작성하십시오.
3. [3단계: 자가 비판 및 검증 (Reflexion & Self-Consistency)]: 네이버 D.I.A.+ 신뢰도와 헌법 규칙 준수 여부를 자체 검증하십시오.`;
  } else if (mode === 'semi-auto-naver') {
    modeInstruction = `[네이버 블로그 D.I.A.+ 링크/키워드 기획 창작 특명 (옴니-인지 3단계 라이프사이클)]
1. [1단계: 거시적 본질 및 입체 탐색 (Step-Back & ToT/GoT)]: 제공된 키워드/링크의 핵심 쟁점과 유입 극대화 스토리텔링 설계를 thoughtProcess에 심층 기술하십시오.
2. [2단계: 정밀 실행 (CoT & PoT)]: 전문 손해사정사의 따뜻한 상담체와 생생한 사례로 6대 헌법 무기를 완벽하게 장착하십시오.
3. [3단계: 자가 비판 및 검증 (Reflexion & Self-Consistency)]: 모바일 최적 가독성과 일관된 법리를 자체 감수하십시오.`;
  } else if (mode === 'manual-preserve') {
    modeInstruction = `[구글 E-E-A-T 초안 다듬기 모드 특명 (옴니-인지 3단계 라이프사이클)]
1. [1단계: 거시적 본질 및 입체 탐색 (Step-Back & ToT/GoT)]: 원문의 사실관계와 핵심 논리를 상위 원칙에 입각해 정밀 분석하여 thoughtProcess에 기술하십시오.
2. [2단계: 정밀 실행 (CoT & PoT)]: 원문의 부족한 부분을 보강하여 6대 헌법 무기(공감 오프닝, 핵심 요약, 인라인 용어사전, 마크다운 표, 1분 자가진단, FAQ 3개, 결론 맞춤형 솔루션)의 완결된 틀로 다듬으십시오.
3. [3단계: 자가 비판 및 검증 (Reflexion & Self-Consistency)]: 구글 E-E-A-T 기준과 W3C 시맨틱 위계를 자체 비판하고 확정하십시오.`;
  } else if (mode === 'manual-expand') {
    modeInstruction = `[구글 E-E-A-T 초안 확장 모드 특명 (옴니-인지 3단계 라이프사이클)]
1. [1단계: 거시적 본질 및 입체 탐색 (Step-Back & ToT/GoT)]: 최신 대법원 판례, 의학 장해평가 기준(맥브라이드/AMA), 약관 면책 방어 논리를 다각도로 수읽기하여 thoughtProcess에 기술하십시오.
2. [2단계: 정밀 실행 (CoT & PoT)]: 5,000자 이상의 최고 권위 심층 전문 칼럼으로 6대 헌법 무기를 100% 장착하십시오.
3. [3단계: 자가 비판 및 검증 (Reflexion & Self-Consistency)]: 의학/법률 전문성과 일관성을 교차 검증하십시오.`;
  } else {
    modeInstruction = `[구글 E-E-A-T 전문 칼럼 창작 모드 특명 (옴니-인지 3단계 라이프사이클)]
1. [1단계: 거시적 본질 및 입체 탐색 (Step-Back & ToT/GoT)]: 최고 권위의 손해사정 기획안을 도출하여 thoughtProcess에 기술하십시오.
2. [2단계: 정밀 실행 (CoT & PoT)]: 구글 E-E-A-T 기준을 충족하는 6대 헌법 무기 칼럼을 집필하십시오.
3. [3단계: 자가 비판 및 검증 (Reflexion & Self-Consistency)]: 환각 없는 무결점 판례와 전문성을 자체 검증하십시오.`;
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

# 공통 글쓰기 헌법 규칙 (STRICT WRITING RULES)
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

// ── 기존 함수 인터페이스 100% 하위 호환 매핑 ──────────────────────────
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

// ── 5. JSON 스키마 정의 (TOPIC_SCHEMA & CONTENT_SCHEMA) ───────────────
const TOPIC_SCHEMA = {
  type: "OBJECT",
  properties: {
    thoughtProcess: {
      type: "STRING",
      description: "기획 및 마케팅 전략에 대한 연쇄 사고 논리 서술 (Chain-of-Thought)"
    },
    slug: {
      type: "STRING",
      description: "URL-friendly 영문 slug (소문자 및 하이픈 조합의 고유 주소)"
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
      description: "판례·분쟁조정, 사망·자살 보험금, 질병진단·실손, 교통사고 보상, 배상책임·의료, 근재·산재 사고, 장해평가·면책, 보상가이드 중 1개 선택"
    },
    caseNumber: {
      type: "STRING",
      description: "판례·분쟁조정 카테고리인 경우 대법원/하급심 사건번호(예: 2019다214248) 또는 금융분쟁조정위원회 결정번호(예: 금융분쟁조정위원회 제2023-15호). 일반 주제인 경우 빈 문자열."
    },
    specialtyCategory: {
      type: "STRING",
      description: "사안과 직결된 전문 진료과목"
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
      description: "콘텐츠 작성 시 고려한 W3C 시맨틱 마크다운 위계, 의학/법리 쟁점, 플랫폼별 최적화(구글 E-E-A-T 또는 네이버 D.I.A.+ 공감 스토리텔링) 및 6대 무기 설계 논리 서술 (Chain-of-Thought)"
    },
    title: {
      type: "STRING",
      description: "플랫폼 성격(구글 E-E-A-T 전문성 또는 네이버 D.I.A.+ 공감 스토리텔링)과 본문 핵심 쟁점을 가장 강력하게 후킹하는 SEO 최적화 포스트 최종 완성 제목"
    },
    markdownContent: {
      type: "STRING",
      description: "글로벌 마크다운 헌법 규칙을 100% 준수한 블로그 본문 마크다운 전문 (Frontmatter 제외)"
    }
  },
  required: ["thoughtProcess", "title", "markdownContent"]
};

// ── 6. 기획 프롬프트 헬퍼들 ──────────────────────────────────────────
function getTopicPlanningPrompt(keyword, trendTitle, existingPosts, targetCategory, planFeedback = '') {
  const feedbackSection = planFeedback ? `\n[🚨 기획안 재시도 피드백 (반드시 준수)]\n${planFeedback}\n` : '';
  const isLegal = targetCategory === '판례·분쟁조정' || targetCategory === '판례·법률 해석';
  const legalInstruction = isLegal
    ? `\n[판례·분쟁조정 카테고리 특화 지침]\n- 대한민국 대법원 주요 판례(예: 2019다214248) 또는 금융감독원 금융분쟁조정위원회 결정례(예: 금융분쟁조정위원회 제2023-15호) 중 오늘의 이슈에 가장 부합하는 실존 선례를 바탕으로 기획하십시오.\n- 가공의 사건번호나 결정번호는 절대 창작하지 마시고, 실존하는 번호를 caseNumber 필드에 명시하십시오.\n`
    : '';

  return `당신은 '보상스쿨'의 최정상 콘텐츠 기획자이자 마케터입니다.
오늘 확정된 대표 키워드는 [${keyword}] 이며, 관련된 오늘의 이슈는 [${trendTitle}] 입니다.
반드시 **[${targetCategory}]** 카테고리에 맞는 관점으로 기획하세요.${legalInstruction}

[최근 발행 글 및 슬러그 목록 (중복 금지!)]
${existingPosts}
${feedbackSection}
[기획 핵심 지시사항]
1. 최근 30일간 다룬 질환명, 신체 부위, 특수 사고 유형, 판례 사건, 분조위 결정례와 겹치지 않는 완전히 참신하고 새로운 분쟁 영역을 발굴하십시오.
2. 위 키워드와 맥락을 바탕으로, 어떻게 하면 잠재 고객(보험 분쟁 중인 사람)이 검색 결과에서 클릭하지 않고는 못 배길지 연쇄 사고(Chain-of-Thought)를 거쳐 기획하십시오:
   - thoughtProcess: 기획 및 마케팅 전략에 대한 연쇄 사고 논리 서술
   - slug: 영문 소문자와 하이픈(-)으로 구성된 고유 주소
   - title: SEO 최적화 제목 (딱딱한 법률 용어를 버리고, 일상 언어와 실무적 혜택을 결합한 강력한 훅킹)
   - summary: 구글 검색 결과에 노출될 150자 이내의 클릭 유도용 매력적인 한글 요약문
   - category: 판례·분쟁조정|사망·자살 보험금|질병진단·실손|교통사고 보상|배상책임·의료|근재·산재 사고|장해평가·면책|보상가이드 중 1개
   - caseNumber: 실존하는 사건번호/결정번호(판례·분쟁조정 카테고리인 경우) 또는 빈 문자열
   - specialtyCategory: 사안과 직결된 전문 진료과목
   - tags: 관련 태그 5개
   - keywords: 타겟 키워드 목록

반드시 지정된 JSON 스키마를 준수하여 출력하십시오.`;
}

function getPrecedentPlanningPrompt(courtCase, existingPosts, targetCategory = '판례·분쟁조정', planFeedback = '') {
  const feedbackSection = planFeedback ? `\n[🚨 기획안 재시도 피드백 (반드시 준수)]\n${planFeedback}\n` : '';
  const caseNo = courtCase?.caseNumber || courtCase?.caseNo || courtCase?.id || '';
  const caseName = courtCase?.caseName || courtCase?.title || '';
  const caseSummary = courtCase?.summary || courtCase?.judgmentSummary || courtCase?.content || '';

  return `당신은 '보상스쿨'의 최정상 판례 기획자이자 테크니컬 라이터입니다.
아래 판례/분쟁조정 정보를 분석하여 일반 소비자가 이해하기 쉽고 SEO 유입 효과가 극대화된 블로그 포스팅을 기획하십시오.
반드시 **[${targetCategory}]** 카테고리에 맞는 관점으로 기획하세요.

판례/결정 사건명: ${caseName}
사건/결정번호: ${caseNo}
판례/결정 내용 요약: ${caseSummary}

[기존 슬러그 및 최근 다룬 주제 (중복 금지)]
${existingPosts}
${feedbackSection}
1. thoughtProcess: 핵심 쟁점을 일반인이 공감할 스토리로 전환하는 연쇄 사고 논리
2. slug: 영문 소문자와 하이픈(-)으로 구성된 고유 주소
3. title: SEO 최적화 판례/분조례 제목 (핵심 쟁점과 결정 취지를 알기 쉽게 후킹하는 제목)
4. summary: 150자 이내의 메타 디스크립션 요약문
5. category: 판례·분쟁조정|사망·자살 보험금|질병진단·실손|교통사고 보상|배상책임·의료|근재·산재 사고|장해평가·면책|보상가이드 중 1개
6. caseNumber: "${caseNo}"
7. specialtyCategory: 사안과 직결된 전문 진료과목
8. tags: 관련 태그 5개
9. keywords: 타겟 키워드 목록

반드시 지정된 JSON 스키마를 준수하여 출력하십시오.`;
}


function getManualPlanningPrompt(arg1, arg2, arg3, arg4, arg5) {
  let topicTitle, rawInput, existingPosts, targetCategory, isNaver;
  if (arguments.length <= 2) {
    rawInput = String(arg1 || '');
    topicTitle = rawInput.slice(0, 60);
    existingPosts = arg2 || '- (없음)';
    targetCategory = '보상가이드';
    isNaver = false;
  } else {
    topicTitle = arg1 || '';
    rawInput = String(arg2 || '');
    existingPosts = arg3 || '- (없음)';
    targetCategory = arg4 || '보상가이드';
    isNaver = Boolean(arg5);
  }

  const titleGuideline = isNaver
    ? "네이버 블로그 D.I.A.+ 독자의 시선을 사로잡는 친근하고 매력적인 후킹 제목 (예: '손목이 저리고 아픈데 산재 될까? 수근관증후군 보상금 완벽 정리')"
    : "구글 E-E-A-T 검색엔진 최적화 및 전문성을 드러내는 명확하고 권위 있는 칼럼 제목 (예: '수근관증후군 산재 장해등급 판정 및 개인보험 후유장해 보상 기준')";

  return `당신은 '보상스쿨'의 최정상 콘텐츠 기획자이자 수석 에디터입니다.
사용자가 제공한 원문/주제/자료를 바탕으로 블로그 포스팅 기획안 및 최적의 제목을 수립하십시오.
반드시 **[${targetCategory}]** 카테고리에 맞는 관점으로 기획하세요.

사용자 입력 주제/기존제목: ${topicTitle || '(사용자 미입력 - 원문 내용으로 최적 제목 창작 필요)'}
사용자 입력 원문/자료 요약: ${rawInput.slice(0, 800)}

기존 슬러그 (중복 금지) : [${existingPosts}]

[기획 핵심 지시사항]
1. thoughtProcess: 원문의 핵심 메시지를 분석하여 최상의 ${isNaver ? '네이버 D.I.A.+' : '구글 E-E-A-T'} 기획과 제목을 도출하는 논리
2. slug: 영문 소문자와 하이픈(-)으로 구성된 고유 주소
3. title: ${titleGuideline}
4. summary: 150자 이내의 메타 디스크립션 요약문
5. category: 판례·분쟁조정|사망·자살 보험금|질병진단·실손|교통사고 보상|배상책임·의료|근재·산재 사고|장해평가·면책|보상가이드 중 1개
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
1. 위 최근 발행 글에 이미 등장한 주제 및 키워드는 완전히 배제하십시오.
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
2. 아직 블로그에서 다루지 않은 새로운 의학/법률/손해사정 실무 명사만 추출하십시오.
3. 반드시 짧고 핵심적인 명사 단어로만 추출하세요.

아래와 같은 JSON 형식으로만 응답하세요:
{"thoughtProcess": "기존 글과의 중복을 걸러내고 참신한 실무 쟁점을 선정한 논리 (Chain-of-Thought)", "candidates": [{"newsTitle": "기사원문", "searchKeyword": "검색용키워드명사"}]}`;
}

function getNovelTopicPrompt(targetCategory, existingTitles, retryFeedback = '') {
  const feedbackMsg = retryFeedback ? `\n[재시도 주의사항]\n이전 생성 결과("${retryFeedback}")는 최근 발행 글과 중복되었습니다. 완전히 다른 새로운 분쟁 주제를 발굴하십시오.\n` : '';
  const isLegal = targetCategory === '판례·분쟁조정' || targetCategory === '판례·법률 해석';
  const legalInstruction = isLegal
    ? `\n[판례·분쟁조정 카테고리 특화 지침]\n- 반드시 아직 블로그에서 다루지 않은 실존 대법원 주요 판결 또는 금융감독원 금융분쟁조정위원회 결정례를 바탕으로 주제를 도출하십시오.\n`
    : '';

  return `당신은 대한민국 최고의 손해사정 전문 블로그 수석 편집장입니다.
**[${targetCategory}]** 카테고리에서 최근 아래의 주제들이 이미 발행되었습니다:

[최근 30개 발행 글 (절대 중복 금지!)]
${existingTitles}
${feedbackMsg}
[지시사항]
1. 위 목록에 이미 등장한 주제 및 연관 키워드는 절대 다루지 마십시오.
2. **[${targetCategory}]** 분야에서 실제 손해사정사에게 상담 문의가 많지만 아직 블로그에서 다루지 않은 '완전히 새로운 실무 분쟁 주제' 1개를 발굴하십시오.${legalInstruction}
3. 특정 관행에 얽매이지 말고, 해당 카테고리의 의학/약관/손해액 산정 실무에서 소비자가 겪는 현실적 고통과 권리 구제 포인트를 포착하십시오.

반드시 아래 JSON 형식으로 반환하세요:
{"thoughtProcess": "새로운 주제 선정 이유 및 수임 관점 논리 (Chain-of-Thought)", "keyword": "완전히 새로운 핵심 키워드", "newsTitle": "최신 실무 분쟁 이슈 제목"}`;
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
  getNovelTopicPrompt,
  getFssEvaluationPrompt,
};
