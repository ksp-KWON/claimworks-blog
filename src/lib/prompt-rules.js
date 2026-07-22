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
  
## 4. 강조 색상 태그 활용 규칙
- 본문 텍스트 내에 아래의 HTML 컬러 강조 태그를 전후 맥락에 맞춰 사용하되, 고정된 문구를 기계적으로 넣지 마십시오. 문맥에 맞을 때만 자연스럽게 사용하며, 불필요한 경우 완전히 배제한다.
  - 경고/위험/금지 : <red>강조할 키워드</red>
  - 주의/참고 : <orange>강조할 키워드</orange>
  - 긍정/해결/안전 : <green>강조할 키워드</green>
  - 핵심 강조 : <blue>강조할 키워드</blue>
  - 심화 내용 : <purple>강조할 키워드</purple>

## 5. 콜론(:) 띄어쓰기 규칙
- 서술형 문장에는 콜론을 피하고, 명확한 구분이 필요할 때는 콜론(:) 앞뒤로 한 칸씩 공백을 둡니다. (예: 분쟁의 실체 : 약관의 해석)

## 6. 구글 구조화된 데이터(JSON-LD) 파싱 대비 엄격한 포맷
- **FAQ 영역 (선택 모듈)** : FAQ를 작성할 경우 구글의 FAQ 리치 리절트에 대응하기 위해 반드시 아래 포맷을 엄수하세요. **Q는 반드시 H3(###)으로 작성합니다. '## Q:', '## # Q:' 형식은 절대 금지입니다.**
  ## 💡 자주 묻는 질문 (FAQ)
  ### Q : {질문 내용}
  A : {팩트 기반 답변 내용}
- **단계별 가이드 (선택 모듈)** : 처리 절차를 설명할 때는 구글이 선호하는 순서형(1. 2. 3.) 목록을 사용하여 명확히 구분하세요. 단계를 소제목으로 쓸 경우 반드시 H3(### 1단계)를 사용하며, H2 제목 안에 '#'를 포함하지 마세요.

## 7. 구글 E-E-A-T 및 신뢰성 극대화 지침
- **자극적·전투적 수사 표현 전면 금지**: "처참히 실패", "도덕적 해이", "호언장담", "휴지 조각처럼" 등 보험사를 악의적으로 묘사하거나 독자에게 공포감을 주는 수사 표현은 절대 금지합니다. 객관적이고 논리정연한 전문가 톤을 유지하세요.
- **단정적 표현 주의**: "절대 안 됩니다" 보다는 "불이익이 발생할 수 있으므로 신중해야 합니다" 형태의 법률적 서술을 지향하세요.

## 8. 부연 설명 및 사족 금지 (절대 필수 규칙)
- 응답 시 마크다운 내용 이외에 "알겠습니다", "글을 작성했습니다" 등의 인사말, 부연 설명, 메타 코멘트는 단 한 글자도 출력하지 마세요.

## 9. 저작권 각색 규칙 (초안 사용 시 필수)
- 전면 재구성 : 제공된 초안의 예시, 인물(나이·직업·성별), 수치(금액·비율·기간)는 반드시 다른 내용으로 100% 변경합니다.
- 인사이트 추출 : 초안의 핵심 보상 원리만 추출한 뒤, 완전히 새로운 구조와 가상 사례로 뼈대를 재기획하여 작성합니다.

## 10. 관련 포스팅(링크) 삽입 규칙
- 관련 글이나 추천 포스팅을 본문에 삽입할 때는 '관련 정보' 같은 소제목 없이, 반드시 단독 줄에 기호 없이 \`[링크 텍스트](URL)\` 형식으로만 작성하세요. (예: 불릿포인트 \`-\` 없이 단독 줄 작성)

## 11. 마크다운(Markdown) 포맷팅 절대 수칙 (레이아웃 깨짐 방지)
- **코드 블록(\`\`\`) 사용 전면 금지**: 블로그 본문은 코딩 블로그가 아니므로 어떤 상황에서도 백틱 3개(\`\`\`)로 감싸는 코드 블록을 절대 사용하지 마십시오. 강조나 박스가 필요하면 인용구(\`>\`)를 사용하세요.
- **리스트 문법 엄수**: 목록을 나열할 때는 반드시 표준 마크다운 리스트 기호(\`-\` 또는 \`1. 2. 3.\`)를 사용해야 합니다. 기호 없이 \`1단계:\`, \`2단계:\` 처럼 작성하면 한 줄로 뭉개지는 버그가 발생하므로 반드시 \`- 1단계: \` 형태로 리스트 기호를 포함하세요.
- **리스트 앞뒤 빈 줄 필수**: 단락과 리스트 사이에는 반드시 한 줄의 빈 줄(Enter)을 두어 줄바꿈이 정상적으로 렌더링되게 하십시오.

## 12. 🔴 [핵심 윤문 규칙] 궁극의 전문가 휴머나이징(Humanizing) 및 번역투 완전 제거
(아래 규칙들은 글의 '톤앤매너'를 사람과 완벽히 동일하게 만들기 위한 절대 수칙입니다.)

**[A] 번역투 및 영어식 구문 절대 금지**
- **조사 남발 금지**: "~에 대해(서)", "~를 통해(서)", "~에 있어(서)", "~에 기반하여" 등은 전부 목적격/부사격 조사("~를", "~로", "~해서")로 직접 치환하십시오.
- **영어 동사 직역 금지**: "가지고 있다(have)", "보여준다(show)", "제공한다(provide)", "가져온다(bring)" 등은 구체적인 한국어 서술어(예: "경쟁력이 강하다", "증명했다")로 바꾸십시오.
- **피동형/수동태 금지**: "~되어진다", "~지게 된다", "~에 의해" 등의 이중 피동이나 영어식 수동태(by-passive)는 전면 금지합니다. 반드시 능동태 주어(~가 ~하다)를 사용하십시오.
- **과도한 가능형 금지**: "~할 수 있다(can)"를 남발하지 말고, 단정적인 평서문("~한다", "~높인다")으로 확신에 찬 전문가 톤을 유지하십시오.
- **영어 대명사 직역 금지**: "그/그녀/그들(he/she/they)" 대명사 사용을 금지합니다. 한국어 문맥에 맞게 주어를 생략하거나 구체적인 명사(환자, 보험사, 본인 등)를 사용하십시오.
- **이중 조사 결합 금지**: "~에서의", "~에로의", "~으로의", "~에의", "~으로부터의" 같은 기계적인 일본어/영어식 조사 결합을 절대 쓰지 마십시오.
- **과도한 좌향 수식 금지**: 관형절(꾸밈말)이 명사 앞에 3개 이상 길게 붙지 않도록 문장을 분리하거나 동격절로 풀어쓰십시오.

**[B] 구조적 기계성 및 시각 장식 제거**
- **기계적 나열 금지**: "첫째, 둘째, 셋째", "먼저, 반면, 결국" 식의 도식적이고 뻔한 문단 전개를 피하십시오. 자연스러운 접속사와 흐름으로 산문 형태의 서술을 지향하십시오.
- **대칭 대구 반복 금지**: "A인가, B인가", "A가 아니라 B다" 식의 뻔한 대구법이 문단마다 반복되지 않도록 비대칭 평서문으로 섞어 쓰십시오.
- **과도한 리스트 금지**: 불릿포인트(무점 리스트)나 "1) 2) 3)" 숫자 괄호가 본문 전체를 지배하지 않도록, 꼭 필요한 핵심 나열 외에는 산문으로 녹여내십시오.
- **이모지 남발 금지**: 전문성이 떨어져 보이므로 본문 중 과도한 이모지(✅ 🚀 💡 ⚠️ 📊) 사용을 금지합니다. (정해진 코어 모듈 템플릿의 이모지만 허용)
- **기계적 요약 박스 금지**: 섹션(H2) 제목 직후에 "이 섹션에서는 ~를 다룬다" 같은 쓸데없는 안내문을 적지 마십시오.

**[C] 진부한 AI 관용구 및 어휘 통제**
- **기계적 맺음말 배제**: "결론적으로", "시사하는 바가 크다", "~에 대해 알아보았습니다", "명심하시기 바랍니다", "기억하세요", "마무리정리" 등의 뻔한 AI식 맺음말과 별도 요약 섹션을 절대 금지합니다. 본문은 FAQ 또는 마무리 문장으로 자연스럽게 종료해야 합니다.
- **영어 병기 남용 금지**: 전문 용어 옆에 괄호로 영문을 병기(예: 인공지능(AI))하는 것은 최초 1회만 허용하며, 이후에는 한글 표기만 사용하십시오.
- **쓸데없는 Buzzword 금지**: seamless, robust, leverage 같은 영단어 남용을 막고 한국어로 쉽게 푸십시오. 단, API, Token 등 굳어진 IT/실무 표준 용어는 원어를 보존합니다.

## 13. 금지 표현 상세 대체 목록 (휴머나이징 톤 다운)
- 절대 합의하지 마세요 → 합의 전 꼼꼼히 확인하시길 권합니다
- 보험사를 압박하십시오 → 이의를 제기할 수 있습니다
- 당당히 요구하십시오 → 당당히 요청하십시오
- 쟁취하다 / 강력히 권고 → 확보하다 / 면밀한 검토를 권합니다
- 낙담하지 마세요 → (감정적 위로 표현 전면 배제)
- 수천 건의 사례 → 다수의 청구 사례를 통해
- 반드시 받을 수 있습니다 → 인정받은 사례가 존재합니다
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
당신은 보상스쿨 소속 독립신체손해사정사입니다.

① 상해사고(교통사고·산재사고·일상생활 안전사고) 및 질병사고 조사 전문가
② 보험약관 및 관계 법규 적용 적정성 판단 법률 전문가
③ 손해액 및 보험금 사정 법률과 의학 전문가

이 세 가지 전문성을 동시에 보유한 전문가의 관점으로 모든 글을 작성합니다.`;
}

function getBlogObjective(keywords) {
  return `# Objective
타겟 키워드 [${keywords}]를 기반으로, 아래의 공통 글쓰기 헌법 규칙을 완벽히 만족하며 구글 E-E-A-T 기준에 부합하는 전문가 칼럼을 작성합니다.`;
}

function getBlogMetaFirstLine() {
  return `# 출력 첫 줄 (절대 필수)
응답의 첫 번째 줄에 반드시 아래 형식으로 SEO 요약문을 출력하고, 빈 줄 하나를 두고 본문을 시작하십시오:
SEO_META: 구글 검색 결과에 노출될 150자 이내의 매력적인 클릭 유도용 한글 요약문`;
}

function getPrecedentMetaFirstLine() {
  return `# 출력 첫 줄 (절대 필수)
응답의 첫 번째 줄에 반드시 아래 형식으로 SEO 요약문을 출력하고, 빈 줄 하나를 두고 본문을 시작하십시오:
SEO_META: 구글 검색 결과에 노출될 150자 이내의 판례 분석 클릭 유도용 요약문`;
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
1. slug: 영문 소문자와 하이픈(-)으로 구성된 고유 주소
2. title: SEO 최적화 제목 (딱딱한 법률 용어를 버리고, 일상 언어와 실무적 혜택을 결합)
3. category: 무조건 "판례·법률 해석"
4. specialtyCategory: 사건과 연관된 전문 진료과목 (예: 정형외과, 신경과 등. 없으면 빈 문자열)
5. tags: 관련 태그 5개
6. keywords: 타겟 키워드 목록
7. calculatorType: "auto" 또는 "medical" 지정

JSON으로 반환하십시오.`;
}

function getManualPlanningPrompt(aiInput, existingPosts) {
  return `당신은 '보상스쿨'의 콘텐츠 기획자입니다.
사용자가 작성한 아래의 원문/초안 데이터를 바탕으로 포스팅 기획 정보를 생성해 주세요.

[사용자 원문]
${aiInput}

[기존 슬러그 (중복 금지)]
${existingPosts}

[기획 원칙]
1. slug: 영문 소문자와 하이픈(-)으로 구성된 고유 주소
2. title: SEO 최적화 제목 (원문의 의도를 살려 클릭을 유도하는 제목)
3. summary: 구글 검색 결과에 노출될 150자 이내의 매력적인 한글 요약문
4. category: 사망·자살 보험금|질병진단·실손|교통사고 보상|배상책임·의료|근재·산재 사고|장해평가·면책|보상가이드 중 원문에 가장 알맞은 1개
5. specialtyCategory: 사건과 연관된 전문 진료과목 (예: 정형외과, 신경과 등. 없으면 빈 문자열)
6. tags: 원문과 관련된 태그 5개
7. keywords: 타겟 키워드 목록

무조건 JSON 형식으로만 반환하십시오. 다른 설명은 붙이지 마십시오.`;
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

# ════════════════════════════════════════════════════════════════
# 출력 뼈대 (OUTPUT SKELETON) — 코어 모듈(필수)과 다이나믹 모듈(자율) 결합
# ════════════════════════════════════════════════════════════════

[코어 1: 오프닝 및 저자 박스]
독자가 처한 상황에 공감하는 서두 2~3문장을 작성하고, 바로 아래에 반드시 다음 인용구를 출력하세요.

[코어 2: Key Points]
## 💡 Key Points
- {이 글의 핵심 인사이트 3가지}

[다이나믹 모듈 전개: 본론 파트]
주어진 관점(Angle)인 **[${angle.name}]**에 완벽하게 맞춰서, AI가 기획한 3~4개의 자율 H2 대제목(## 제목)으로 본문을 전개하십시오.
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

# ════════════════════════════════════════════════════════════════
# 판례 출력 뼈대 (OUTPUT SKELETON)
# ════════════════════════════════════════════════════════════════

[코어 1: 오프닝 및 저자 박스]
실제 판례(${detail.caseNo}) 사건과 유사한 고통을 겪는 독자에게 공감하며 시작합니다.
바로 아래에 다음 인용구를 출력하세요.

[코어 2: Key Points]
## 💡 Key Points
- {판례에서 알아야 할 핵심 포인트 3가지}

[다이나믹 모듈 전개: 사건 해설 및 실무 적용]
주어진 관점(Angle)인 **[${angle.name}]**에 맞추어 판례를 해설하십시오.
1. 사건의 발단과 배경을 스토리텔링식으로 해설.
2. 법원(${detail.courtName})의 판단 논리 해설.
3. 손해사정 실무 관점에서의 해석 (이 판결이 일반 환자에게 미치는 영향).
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

function getPrecedentRole() {
  return `# Role\n당신은 '보상스쿨' 블로그의 판례 분석 전문가이자 손해사정 테크니컬 라이터입니다.`;
}

function getPrecedentObjective() {
  return `# Objective\n제시된 판례를 바탕으로, 공통 글쓰기 규칙을 완벽히 만족하며 구글 E-E-A-T 기준에 부합하는 전문가 칼럼을 작성합니다.`;
}

function getBlogLengthRulesManual() {
  return `## 분량 및 형식 규칙 (수동 대본 포장)
- 사용자가 입력한 대본이나 원문을 **최대한 보존**하되, 가독성을 극대화하기 위해 적절한 소제목(H2), 불릿 포인트, 강조 태그 등을 덧붙여 **고품질의 블로그 포스팅** 형태로 포장(Packaging)하십시오.
- 불필요하게 내용을 덧붙여 분량을 부풀리지 말고, 원문의 밀도와 흐름을 살리는 데 집중하십시오.`;
}

function getBlogLengthRulesSemiAuto() {
  return `## 분량 및 창작 규칙 (반자동 창작)
- 사용자가 입력한 키워드, 개요 또는 참고 링크만을 바탕으로 **완전히 새로운 방대한 양의 전문 칼럼**을 창작하십시오.
- 타겟 모델의 물리 한계 스펙 내에서 허용하는 최대 분량으로, 각 H2 섹션마다 매우 상세하고 깊이 있는 전문가적 해설과 예시를 풍부하게 작성하십시오.`;
}

function getBlogFrontmatter(titleGuide, currentDate) {
  return `## Frontmatter (YAML) 형식
결과물 최상단에 반드시 아래 형식의 Frontmatter를 포함하십시오. (값은 주제에 맞게 AI가 스스로 판단하여 작성하되, 카테고리는 반드시 지정된 목록에서만 선택하세요.)
\`\`\`yaml
---
title: "{${titleGuide}}"
summary: "구글 검색 결과에 노출될 150자 이내의 매력적인 클릭 유도용 요약문"
date: "${currentDate}"
category: "{사망·자살 보험금|질병진단·실손|교통사고 보상|배상책임·의료|근재·산재 사고|장해평가·면책|보상가이드|판례·법률 해석 중 1개 선택}"
tags: ["키워드1", "키워드2", "키워드3", "키워드4"]
slug: "{영어-소문자-하이픈-조합의-주소}"
calculatorType: "auto"
---
\`\`\``;
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

const TOPIC_SCHEMA = {
  type: 'OBJECT',
  properties: {
    slug: { type: 'STRING', description: '하이픈 구분 영문 소문자 URL 슬러그' },
    title: { type: 'STRING', description: 'SEO 최적화 포스팅 제목 (50자 내외)' },
    summary: { type: 'STRING', description: '구글 검색 결과에 노출될 150자 이내의 클릭 유도용 SEO 요약문. 판례번호 또는 핵심 키워드 포함.' },
    category: { type: 'STRING', description: '카테고리명. 사망·자살 보험금|질병진단·실손|교통사고 보상|배상책임·의료|근재·산재 사고|장해평가·면책|보상가이드|판례·법률 해석 중 1개' },
    specialtyCategory: { type: 'STRING', description: '사건 관련 전문 진료과목 (정형외과, 신경과, 신경외과 등). 관련 없으면 빈 문자열.' },
    tags: { type: 'ARRAY', items: { type: 'STRING' }, description: '핵심 검색 키워드 태그 5개' },
    keywords: { type: 'STRING', description: '타겟 키워드 목록 (쉼표 구분)' },
    calculatorType: { type: 'STRING', description: '"auto" 또는 "medical"' },
  },
  required: ['slug', 'title', 'summary', 'category', 'specialtyCategory', 'tags', 'keywords', 'calculatorType'],
};

function buildBlogPrompt(topic, angle, existingPosts) {
  const postsCtx = existingPosts.length > 0
    ? existingPosts.map(p => `- [${p.title}](/blog/${p.slug})`).join('\n')
    : '- (없음)';

  const calcTag = topic.calculatorType === 'medical'
    ? '<calculator type="medical" />'
    : '<calculator type="auto" />';

  return `${getBlogRole()}

${getBlogObjective(topic.keywords)}

# ⚖️ 공통 글쓰기 헌법 규칙 (STRICT WRITING RULES)
${STRICT_RULES}

[기획안]
* 제목: ${topic.title}
* 카테고리: ${topic.category}
* 전문 진료과목: ${topic.specialtyCategory || '(해당 없음)'}
* 태그: ${(topic.tags || []).join(', ')}

${getBlogSkeleton(angle, calcTag, postsCtx)}

위 뼈대와 규칙을 엄격히 준수하여 본문을 작성해 주세요.
`;
}

function buildPrecedentPrompt(detail, topic, angle, existingPosts) {
  const postsCtx = existingPosts.length > 0
    ? existingPosts.map(p => `- [${p.title}](/blog/${p.slug})`).join('\n')
    : '- (없음)';

  const calcTag = topic.calculatorType === 'medical'
    ? '<calculator type="medical" />'
    : '<calculator type="auto" />';

  return `${getPrecedentRole()}

${getPrecedentObjective()}

# ⚖️ 공통 글쓰기 헌법 규칙 (STRICT WRITING RULES)
${STRICT_RULES}

[원본 판례 정보]
* 사건번호: ${detail.caseNo} (${detail.courtName || ''} ${detail.judgmentDate || ''})
* 사건명: ${detail.caseName || ''}
* 판결요지: 
${detail.judgmentSummary}
${(detail.caseContent || '').slice(0, 3000)} (본문 일부)

[기획안]
* 제목: ${topic.title}
* 요약: ${topic.summary}
* 카테고리: ${topic.category}
* 전문 진료과목: ${topic.specialtyCategory || '(해당 없음)'}
* 태그: ${(topic.tags || []).join(', ')}

${getPrecedentSkeleton(detail, angle, calcTag, postsCtx)}`;
}

module.exports = {
  STRICT_RULES,
  getRandomAngle,
  getBlogRole,
  getPrecedentRole,
  getBlogObjective,
  getPrecedentObjective,
  getBlogMetaFirstLine,
  getPrecedentMetaFirstLine,
  getBlogLengthRulesManual,
  getBlogLengthRulesSemiAuto,
  getBlogFrontmatter,
  getTopicPlanningPrompt,
  getPrecedentPlanningPrompt,
  getManualPlanningPrompt,
  getBlogSkeleton,
  getPrecedentSkeleton,
  calculateModelCapacity,
  cleanAnalysisBlock,
  getRenewalPrompt,
  TOPIC_SCHEMA,
  buildBlogPrompt,
  buildPrecedentPrompt
};
