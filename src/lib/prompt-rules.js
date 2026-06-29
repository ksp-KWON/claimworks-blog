/**
 * prompt-rules.js
 * 보상스쿨 블로그 포스팅 작성을 위한 엄격 글쓰기 헌법 규칙 정의 모듈.
 * 다이나믹 앵글(관점) 기반 유동적 프레임워크 지원.
 */

'use strict';

const STRICT_RULES = `
## 1. 사전 분석 및 분량 계획 (Chain-of-Thought) - 필수 수행
- 본문을 작성하기 전에 반드시 아래 형식의 분석 블록을 출력의 최상단에 작성하십시오:
  [ANALYSIS_START]
  - 부여된 타겟 모델 물리 스펙 및 권장량 : {{TARGET_MODEL_CAPACITY}}
  - 오늘의 글쓰기 관점(Angle) : {부여받은 앵글에 따른 핵심 쟁점 정의}
  - 필요한 보상 실무 지식 : {주제와 앵글에 맞는 실제 평가 기준 및 실무 지식 도출}
  - 목차(H2) 및 분량 설계 : 
    * {AI가 앵글에 맞춰 스스로 기획한 H2 제목 1} : {분량 계획}
    * {AI가 스스로 기획한 H2 제목 2} : {분량 계획}
    ...
  [ANALYSIS_END]
- 위 분석을 바탕으로 지정된 타겟 모델 물리 스펙의 안전 허용 범위 이내에서 가장 알찬 고밀도의 전문 칼럼을 자율적으로 구성하십시오. 

## 2. Heading 규칙 (H1 사용 금지 및 H2 필수)
- **H1 사용 금지** : frontmatter 외부 본문에는 절대 H1('# 제목')을 작성하지 마세요.
- **소제목 박스 스타일 (H2 필수)** : 본문 각 섹션의 대제목은 무조건 H2('##')로 작성하세요. H2를 사용해야 블로그 스킨에서 자동으로 아름다운 박스형 스타일로 렌더링됩니다. H3는 하위 소제목에만 사용하세요.

## 3. 공감 서론 및 저자 경험 박스 (필수 코어 모듈)
- **도입부 오프닝** : 독자가 처한 구체적이고 억울한 상황에 깊이 공감하는 자연스럽고 따뜻한 톤의 2~3문장으로 서두를 시작하세요.
- **저자 경험 박스** : 오프닝 문단 바로 다음, 아래 인용구를 그대로 출력하십시오.
  > ✍️ 이 글은 보상스쿨 손해사정사가 실제 분쟁 처리 경험을 바탕으로 작성한 전문 콘텐츠입니다.

## 4. 강조 색상 태그 활용 규칙
- 본문 텍스트 내에 아래의 HTML 컬러 강조 태그를 전후 맥락에 맞춰 섞어서 쓰십시오:
  - 경고/위험/금지 : <red>절대 합의하지 마세요</red>
  - 주의/참고 : <orange>향후치료비가 핵심입니다</orange>
  - 긍정/해결/안전 : <green>전액 인정 가능합니다</green>
  - 핵심 강조 : <blue>보상스쿨에 문의하세요</blue>
  - 심화 내용 : <purple>후유장해 진단</purple>

## 5. 이미지 Placeholder 및 시각적 요소 
- 본문을 서술하다가 시각적 자료(엑스레이, 진단서, 현장 사진, 약관 캡처 등)가 들어가면 독자의 이해를 돕기 좋을 위치에 아래 형식으로 이미지 자리 표시자를 넣어주세요. (최소 1개 이상)
  예시: \`[이미지 제안: 척추 압박골절 환자의 X-ray 촬영본 예시]\`

## 6. 콜론(:) 사용 최소화 및 띄어쓰기 규칙
- 서술형 문장에는 콜론을 피하고, '항목 : 상세 설명'처럼 명확한 구분이 필요할 때만 최소한으로 사용하며 앞뒤로 한 칸씩 띄어 쓰세요.

## 7. 구글 구조화된 데이터(JSON-LD) 파싱 대비 엄격한 포맷
- **FAQ 영역 (선택 모듈)** : FAQ를 작성할 경우 구글의 FAQ 리치 리절트에 대응하기 위해 반드시 아래 포맷을 엄수하세요.
  ## 💡 자주 묻는 질문 (FAQ)
  ### Q: {질문 내용}
  A: {팩트 기반 답변 내용}
- **단계별 가이드 (선택 모듈)** : 처리 절차를 설명할 때는 구글이 선호하는 순서형(1. 2. 3.) 목록을 사용하여 명확히 구분하세요.

## 8. 구글 E-E-A-T 및 신뢰성 극대화 지침 (스팸 어휘 금지)
- **자극적·전투적 수사 표현 전면 금지**: "처참히 실패", "도덕적 해이", "호언장담", "휴지 조각처럼" 등 보험사를 악의적으로 묘사하거나 독자에게 공포감을 주는 수사 표현은 절대 금지합니다. 객관적이고 논리정연한 전문가 톤을 유지하세요.
- **기계적 맺음말 배제**: "~에 대해 알아보았습니다", "명심하시기 바랍니다" 등의 뻔한 AI 멘트를 절대 사용하지 마세요.
- **단정적 표현 주의**: "절대 안 됩니다" 보다는 "불이익이 발생할 수 있으므로 신중해야 합니다" 형태의 법률적 서술을 지향하세요.

## 9. 부연 설명 및 사족 금지 (절대 필수 규칙)
- 응답 시 마크다운 내용 이외에 "알겠습니다", "글을 작성했습니다" 등의 인사말, 부연 설명, 메타 코멘트는 단 한 글자도 출력하지 마세요.
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

function getBlogRole() {
  return `# Role
당신은 '보상스쿨' 블로그의 수석 콘텐츠 기획자이자 손해사정 전문 테크니컬 라이터입니다.`;
}

function getBlogObjective(keywords) {
  return `# Objective
타겟 키워드 [${keywords}]를 기반으로, 아래의 공통 글쓰기 헌법 규칙을 완벽히 만족하며 구글 E-E-A-T 기준에 부합하는 전문가 칼럼을 작성합니다.`;
}

function getBlogMetaFirstLine() {
  return `# 출력 첫 줄 (절대 필수)
응답의 첫 번째 줄에 반드시 아래 형식으로 SEO 요약문을 출력하고, 빈 줄 하나를 두고 본문을 시작하십시오:
SEO_META:[구글 검색 결과에 노출될 150자 이내의 매력적인 클릭 유도용 한글 요약문]`;
}

function getPrecedentMetaFirstLine() {
  return `# 출력 첫 줄 (절대 필수)
응답의 첫 번째 줄에 반드시 아래 형식으로 SEO 요약문을 출력하고, 빈 줄 하나를 두고 본문을 시작하십시오:
SEO_META:[구글 검색 결과에 노출될 150자 이내의 판례 분석 클릭 유도용 요약문]`;
}

function getTopicPlanningPrompt(keyword, trendTitle, existingPosts) {
  return `당신은 '보상스쿨'의 콘텐츠 기획자입니다.
오늘 확정된 대표 키워드는 [${keyword}] 이며, 관련된 오늘의 이슈는 [${trendTitle}] 입니다.

기존 슬러그 (중복 금지) : [${existingPosts}]

위 키워드와 맥락을 바탕으로 다음 항목들을 기획하십시오:
1. slug: 영문 소문자와 하이픈(-)으로 구성된 고유 주소 (예: daily-accident-compensation)
2. title: SEO 최적화 제목 (일상 용어 + 혜택 결합)
3. category: 사망·자살 보험금|질병진단·실손|교통사고 보상|배상책임·의료|근재·산재 사고|장해평가·면책|보상가이드 중 1~2개
4. specialtyCategory: 전문 진료과목 (예: 정형외과)
5. tags: 관련 태그 5개
6. keywords: 타겟 키워드 목록
7. calculatorType: "auto" 또는 "medical" 지정.

JSON으로 반환하십시오.`;
}

function getPrecedentPlanningPrompt(detail, existingPosts) {
  return `당신은 '보상스쿨'의 콘텐츠 기획자입니다.
아래의 법제처 수집 판례 데이터를 바탕으로 포스팅 기획 정보를 생성해 주세요.

[판례 데이터]
- 사건명: ${detail.caseName}
- 사건번호: ${detail.caseNo}
- 요지: ${detail.judgmentSummary}

[기존 슬러그 (중복 금지)]
${existingPosts}

[기획 원칙]
1. 제목은 딱딱한 법률 용어를 버리고, 일상 언어와 실무적 혜택을 결합.
2. calculatorType은 "auto" 또는 "medical"을 지정.
3. category는 무조건 "판례·법률 해석"

JSON으로 반환하십시오.`;
}

function getBlogSkeleton(angle, calcTag, postsCtx) {
  return `
[ANALYSIS_START]
- 부여된 타겟 모델 물리 스펙 및 권장량 : {{TARGET_MODEL_CAPACITY}}
- 오늘의 글쓰기 관점(Angle) : [${angle.name}] ${angle.instruction}
- 필요한 보상 실무 지식 : {작성}
- 목차(H2) 및 분량 설계 : 
  * {자율 생성 H2 제목 1} : {계획}
  * {자율 생성 H2 제목 2} : {계획}
  ...
[ANALYSIS_END]

SEO_META:[요약문]

# ════════════════════════════════════════════════════════════════
# 출력 뼈대 (OUTPUT SKELETON) — 코어 모듈(필수)과 다이나믹 모듈(자율) 결합
# ════════════════════════════════════════════════════════════════

[코어 1: 오프닝 및 저자 박스]
독자가 처한 상황에 공감하는 서두 2~3문장을 작성하고, 바로 아래에 반드시 다음 인용구를 출력하세요.
> ✍️ 이 글은 보상스쿨 손해사정사가 실제 보상 분쟁 처리 경험을 바탕으로 작성한 전문 콘텐츠입니다.

[코어 2: Key Points]
## 💡 Key Points
- {이 글의 핵심 인사이트 3가지}

[다이나믹 모듈 전개: 본론 파트]
주어진 관점(Angle)인 **[${angle.name}]**에 완벽하게 맞춰서, AI가 기획한 3~4개의 자율 H2 대제목(## 제목)으로 본문을 전개하십시오.
- ${angle.instruction}
- 전개 중 적절한 위치(주제와 가장 연관 깊은 H2 섹션 내부)에 반드시 단독 줄로 아래 계산기 태그를 출력하십시오:
${calcTag}
- 전개 중 독자의 이해를 돕기 위해 비교 표(Table), 단계별 가이드(Step), 용어 사전 등을 자유롭게 활용하십시오.
- 기존 작성된 연관 글을 소개할 수 있는 문맥에서 아래 링크를 1~2개 자연스럽게 삽입하십시오. (형식: [텍스트](/blog/\${slug}))
[기존 글 목록]
${postsCtx}

[코어 3: 자가진단 체크리스트]
본문이 끝난 후, 주제에 맞는 자가진단 항목을 구성하십시오.
## 🛡️ 지금 손해사정사가 필요한 상황인지 1분 체크
☑️ {자가진단 질문 1}
☑️ {자가진단 질문 2}
☑️ {자가진단 질문 3}
☑️ 위 항목 중 하나라도 해당된다면 전문가의 정확한 검토가 필요한 상황입니다.

[코어 4: 자연스러운 상담 유도 마무리]
## {자율 생성 H2 제목 - 예: 정당한 권리를 되찾는 방법}
독자를 격려하며 자연스럽게 전문가 조언의 중요성을 안내하세요. (외부 링크 금지, 텍스트로만 표현)

[코어 5: FAQ (형식 엄수)]
## 💡 자주 묻는 질문 (FAQ)
### Q: {질문 내용}
A: {팩트 기반 답변}
(2~3개 질문 구성)
`;
}

function getPrecedentSkeleton(detail, angle, calcTag, postsCtx) {
  // 판례의 경우 기본적으로 LEGAL 앵글과 섞이게 되지만, 넘겨받은 angle 포커스를 우대함.
  return `
[ANALYSIS_START]
- 부여된 타겟 모델 물리 스펙 및 권장량 : {{TARGET_MODEL_CAPACITY}}
- 오늘의 글쓰기 관점(Angle) : [${angle.name}] 판례 해설을 이 관점에 맞추어 풀어냅니다.
- 판례 핵심 쟁점 : {작성}
- 목차(H2) 및 분량 설계 : 
  * {사건 발단 관련 H2 제목} : {계획}
  * {법원 판단 관련 H2 제목} : {계획}
  * {실무 적용 관련 H2 제목} : {계획}
  ...
[ANALYSIS_END]

SEO_META:[요약문]

# ════════════════════════════════════════════════════════════════
# 판례 출력 뼈대 (OUTPUT SKELETON)
# ════════════════════════════════════════════════════════════════

[코어 1: 오프닝 및 저자 박스]
실제 판례(${detail.caseNo}) 사건과 유사한 고통을 겪는 독자에게 공감하며 시작합니다.
바로 아래에 다음 인용구를 출력하세요.
> ✍️ 이 글은 보상스쿨 손해사정사가 실제 법원 판례 분석 및 보상 실무 경험을 바탕으로 작성한 전문 콘텐츠입니다.

[코어 2: Key Points]
## 💡 Key Points
- {판례에서 알아야 할 핵심 포인트 3가지}

[다이나믹 모듈 전개: 사건 해설 및 실무 적용]
주어진 관점(Angle)인 **[${angle.name}]**에 맞추어 판례를 해설하십시오.
1. 사건의 발단과 배경을 스토리텔링식으로 해설.
2. 법원(${detail.courtName})의 판단 논리 해설.
3. 손해사정 실무 관점에서의 해석 (이 판결이 일반 환자에게 미치는 영향).
- 전개 중 아래 계산기 태그를 단독 줄에 출력하십시오:
${calcTag}
- 내부 연관 글 링크 1~2개 삽입:
[기존 글 목록]
${postsCtx}

[코어 3: 자가진단 체크리스트]
## 🛡️ 지금 손해사정사가 필요한 상황인지 1분 체크
☑️ {판례 쟁점과 연결된 자가진단 질문}
...
☑️ 위 항목 중 하나라도 해당된다면 전문가의 정확한 검토가 필요한 상황입니다.

[코어 4: 상담 유도 마무리]
전문가 조언의 중요성 안내 (텍스트로만).

[코어 5: FAQ]
## 💡 자주 묻는 질문 (FAQ)
### Q: {질문 내용}
A: {팩트 기반 답변}
`;
}

function calculateModelCapacity(maxTokens) {
  const safetyLimitChar = Math.floor(maxTokens / 3.0);
  const minRecommended = Math.floor(safetyLimitChar * 0.45);
  const maxRecommended = Math.floor(safetyLimitChar * 0.85);
  const minNoSpace = Math.floor(minRecommended * 0.7);
  const maxNoSpace = Math.floor(maxRecommended * 0.7);

  return `할당된 인공지능 모델 용량 스펙 (최대 출력 ${maxTokens.toLocaleString()} 토큰) | 권장량: 1회 생성 한계치인 한글 약 ${safetyLimitChar.toLocaleString()}자 내에서 끊김 방지를 위한 최적 작성 분량은 **공백 포함 약 ${minRecommended.toLocaleString()}자 ~ ${maxRecommended.toLocaleString()}자 (공백 제외 약 ${minNoSpace.toLocaleString()}자 ~ ${maxNoSpace.toLocaleString()}자)** 입니다.`;
}

function cleanAnalysisBlock(text) {
  if (!text) return '';
  if (text.includes('[ANALYSIS_START]')) {
    return text.replace(/\[ANALYSIS_START\][\s\S]*?\[ANALYSIS_END\]/, '').trim();
  }
  return text.trim();
}

function getTitleRenewalPrompt(currentTitle, query) {
  return `당신은 '보상스쿨'의 최고 SEO 카피라이터입니다.
현재 블로그의 한 글이 구글 상위 노출은 잘 되고 있으나 클릭(CTR)이 저조합니다.

- 현재 제목: [${currentTitle}]
- 유저들이 구글에 실제로 검색한 핵심 키워드(Query): [${query}]

위의 실제 유저 검색어(Query)를 바탕으로, 유저가 검색 결과를 보자마자 클릭할 수밖에 없도록 SEO와 후킹(Hooking)이 극대화된 새로운 제목을 딱 1개만 제안해 주세요.

[제약 조건]
1. 기존 제목의 핵심 의도를 훼손하지 말 것.
2. 30~50자 내외로 작성할 것.
3. 어그로성 거짓말은 금지하되, 실무적 혜택을 강조할 것.
4. 부연 설명 없이 오직 새로 작성된 제목 딱 1줄만 출력할 것. (따옴표나 기호 제외)`;
}

module.exports = {
  STRICT_RULES,
  getRandomAngle,
  getBlogRole,
  getBlogObjective,
  getBlogMetaFirstLine,
  getPrecedentMetaFirstLine,
  getTopicPlanningPrompt,
  getPrecedentPlanningPrompt,
  getBlogSkeleton,
  getPrecedentSkeleton,
  calculateModelCapacity,
  cleanAnalysisBlock,
  getTitleRenewalPrompt
};
