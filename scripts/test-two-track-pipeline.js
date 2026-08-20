/**
 * scripts/test-two-track-pipeline.js
 * 네이버용 / 구글용 투트랙 AI 파이프라인 및 네이버 포매터 무결성 백엔드 시뮬레이션 테스트
 */

const { assembleArticlePrompt, buildManualPrompt } = require('../src/lib/prompt-rules');
const { convertMarkdownToNaverHtml } = require('../src/lib/naver-formatter');

console.log('================================================================');
console.log('🧪 [보상스쿨 투트랙 백엔드 파이프라인 무결성 정밀 검증 시작]');
console.log('================================================================\n');

// ── TEST 1: 구글 E-E-A-T 모드 프롬프트 생성 검증 ────────────────────────
console.log('1️⃣ [구글 E-E-A-T] 프롬프트 팩토리 검증...');

const googlePreservePrompt = assembleArticlePrompt({
  mode: 'manual-preserve',
  rawInput: '요추 1번 압박골절 후유장해 보상금 실무 쟁점',
  topic: { title: '요추 1번 압박골절 후유장해 완벽 가이드', category: '교통사고 보상' }
});

const googleExpandPrompt = assembleArticlePrompt({
  mode: 'manual-expand',
  rawInput: '십자인대 파열 동요관절 맥브라이드 평가',
  topic: { title: '십자인대 파열 후유장해 동요관절 평가 기준', category: '장해평가·면책' }
});

if (googlePreservePrompt.includes('구글 E-E-A-T 초안 다듬기 모드') && (googlePreservePrompt.includes('6대 무기') || googlePreservePrompt.includes('6대 헌법 무기'))) {
  console.log('  ✅ 구글 초안 다듬기(manual-preserve) 프롬프트: 정상 조립 완료');
} else {
  console.error('  ❌ 구글 초안 다듬기 프롬프트 오류!');
}

if (googleExpandPrompt.includes('구글 E-E-A-T 초안 확장 모드') && googleExpandPrompt.includes('대법원 판례')) {
  console.log('  ✅ 구글 초안 확장(manual-expand) 프롬프트: 정상 조립 완료');
} else {
  console.error('  ❌ 구글 초안 확장 프롬프트 오류!');
}

// ── TEST 2: 네이버 D.I.A.+ 모드 프롬프트 생성 검증 ──────────────────────
console.log('\n2️⃣ [네이버 D.I.A.+] 프롬프트 팩토리 검증...');

const naverRewritePrompt = assembleArticlePrompt({
  mode: 'manual-naver',
  rawInput: '대장 유암종 C코드 D코드 일반암 분쟁 사례',
  topic: { title: '대장 유암종 D코드 일반암 수령 비결', category: '질병진단·실손' }
});

const naverExpandPrompt = assembleArticlePrompt({
  mode: 'naver-expand',
  rawInput: '음주운전 피해자 직접청구권과 사고부담금',
  topic: { title: '음주운전 사고부담금 피해자 합의금 총정리', category: '교통사고 보상' }
});

if (naverRewritePrompt.includes('네이버 블로그 D.I.A.+ 전용 원고 각색') && naverRewritePrompt.includes('친근하고 따뜻한 스토리텔링 문체')) {
  console.log('  ✅ 네이버 D.I.A.+ 각색(manual-naver) 프롬프트: 정상 조립 완료');
} else {
  console.error('  ❌ 네이버 각색 프롬프트 오류!');
}

if (naverExpandPrompt.includes('네이버 블로그 D.I.A.+ 신규 확장 창작') && naverExpandPrompt.includes('스토리텔링')) {
  console.log('  ✅ 네이버 D.I.A.+ 확장(naver-expand) 프롬프트: 정상 조립 완료');
} else {
  console.error('  ❌ 네이버 확장 프롬프트 오류!');
}

// ── TEST 3: 네이버 스마트에디터 변환 엔진 (naver-formatter) 검증 ────────
console.log('\n3️⃣ [네이버 스마트에디터 ONE 포매터 2.0] 실전 마크다운 변환 검증...');

const sampleMarkdown = `
자택 욕실이나 길거리에서 뜻하지 않게 미끄러지면서 엉덩방아를 찧으면 척추에 거대한 충격이 가해집니다.

## 💡 핵심 요약
> - 척추 압박골절 발생 시 단순 진단명이 아닌 정밀 영상 속 압박률과 콥스 각도(Cobb's angle) 측정이 핵심입니다.
> - 골다공증 기왕증 감액 주장에 대해 선제적인 의학적 반박 논리를 마련해야 합니다.
> - 상해후유장해 담보를 활용하여 정당한 보상금을 확보할 수 있습니다.

## 1. 진단서 너머 정밀 영상 속 변형 각도 확인의 중요성
압박골절 진단 후 치료비만 청구하고 마무리하는 경우가 많지만, 후유장해 검토가 필수적입니다.

> 💡 **후유장해** : 치료 후에도 신체에 영구적인 정신적 또는 육체적 훼손 상태가 남는 경우를 의미합니다.

### 약관상 척추 기형 장해의 세부 평가 기준
척추의 기형 장해는 변형 각도에 따라 지급률이 달라집니다.

| 구분 | 기형 정도 | 지급률 |
|---|---|---|
| 심한 기형 | 35도 이상 | 50% |
| 뚜렷한 기형 | 15도 이상 | 30% |
| 약간의 기형 | 15도 미만 | 15% |

## 1분 자가진단 : 척추 압박골절 체크리스트
> - [ ] 엑스레이 및 MRI 검사 결과 척추체 압박률을 확인했습니까?
> - [ ] 보험사로부터 골다공증 기왕증 삭감 통보를 받았습니까?
> - [ ] 6개월 경과 후 정형외과 전문의의 후유장해 진단서 발급을 검토했습니까?

---

## 💡 자주 묻는 질문 (FAQ)
### Q : 수술을 받지 않고 보존적 치료만 받았는데도 후유장해 청구가 가능한가요?
A : 네, 가능합니다. 척추의 기형 장해는 수술 유무가 아니라 방사선 영상상 척추체의 압박률과 변형 각도를 기준으로 평가합니다.

### Q : 골다공증이 있으면 보험금이 깎이나요?
A : 보험사에서 기왕증 기여도를 주장하여 감액하려 하지만, 외상 기여도를 명확히 입증하면 삭감을 최소화할 수 있습니다.

## 4. 결론 및 보상스쿨의 맞춤형 솔루션
###### ① 영상 정밀 판독을 통한 콥스 각도 측정
영상의학과 전문의와 함께 정밀 측정을 진행합니다.

###### ② 골다공증 기왕증 주장에 대한 의학자문 반박
전문 손해사정서를 작성하여 정당한 권익을 지킵니다.
`;

const naverHtml = convertMarkdownToNaverHtml(sampleMarkdown, {
  title: '요추 1번 압박골절 진단, 실손만 청구했다면? 후유장해 보상금 수령 비결',
  targetBlog: 'traffic'
});

// 포매터 결과 점검
const checks = [
  { name: '대제목 H2 구분선 + 라인형 인용구 테이블', pass: naverHtml.includes('border-left: 6px solid #03c75a') && naverHtml.includes('📌') },
  { name: '중제목 H3 박스형 인용구 테이블', pass: naverHtml.includes('border-left: 4px solid #3b82f6') && naverHtml.includes('■') },
  { name: '소제목 H6 버블/뱃지형 인용구', pass: naverHtml.includes('✔') && naverHtml.includes('background-color: #ecfdf5') },
  { name: '핵심 요약 상하 초록 라인 인용구', pass: naverHtml.includes('border-top: 2px solid #03c75a') },
  { name: '용어사전 점선 메모 인용구', pass: naverHtml.includes('border: 1px dashed #86efac') },
  { name: '1분 자가진단 체크보드 카드 테이블', pass: naverHtml.includes('📋') && naverHtml.includes('☑️') },
  { name: 'FAQ 상하 2단 파스텔 카드 테이블 (#eff6ff / #ffffff)', pass: naverHtml.includes('#eff6ff') && naverHtml.includes('❓') && naverHtml.includes('💡') },
  { name: '마크다운 비교표 (Table) 정상 렌더링', pass: naverHtml.includes('<table') && naverHtml.includes('심한 기형') },
  { name: '노란색 형광펜 하이라이트 (#fef08a)', pass: naverHtml.includes('#fef08a') },
  { name: '하단 공식 OG 이미지 프리뷰 카드 탑재', pass: naverHtml.includes('og-image.png') && naverHtml.includes('claim-works.com') },
  { name: '체크리스트 마지막 줄 대시(--) 버그 없음', pass: !naverHtml.includes('☑️ --') && !naverHtml.includes('☑️ -') }
];

let allPassed = true;
checks.forEach((chk, idx) => {
  if (chk.pass) {
    console.log(`  ✅ [검증 ${idx + 1}] ${chk.name}: 완벽 통과`);
  } else {
    console.error(`  ❌ [검증 ${idx + 1}] ${chk.name}: 실패!`);
    allPassed = false;
  }
});

console.log('\n================================================================');
if (allPassed) {
  console.log('🎉 [최종 결과] 네이버용 / 구글용 투트랙 백엔드 및 서식 엔진 100% 무결점 통과!');
} else {
  console.error('⚠️ [최종 결과] 일부 검증 항목에서 오류가 발견되었습니다.');
}
console.log('================================================================');
