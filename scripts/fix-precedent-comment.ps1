
# precedent-search/page.tsx 의 PRACTICAL_COMMENTS 딕셔너리와 getPracticeComment 함수를
# 스코어링 기반 시스템으로 교체하는 스크립트

$file = "src\app\precedent-search\page.tsx"
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# 교체할 OLD 블록 시작/끝 마커
$oldStart = "// 👨‍🏫 베테랑 손해사정사 실무 코멘트 사전 (Dictionary)"
$oldEnd   = "  return '본 판례는 해당 분쟁에서 법원이 적용한 핵심 법리와 증명 책임 분담 기준을 명시한 판례입니다. 약관 조항의 세밀한 차이와 개별 사실관계에 따라 인용 가능성과 손해사정 방향이 완전히 달라지므로, 권리 행사를 결정하기 전 반드시 전문가와 상담하시기 바랍니다.';`r`n}"

$startIdx = $content.IndexOf($oldStart)
$endIdx   = $content.IndexOf($oldEnd)

if ($startIdx -lt 0 -or $endIdx -lt 0) {
    Write-Host "ERROR: 마커를 찾을 수 없습니다."
    Write-Host "startIdx=$startIdx endIdx=$endIdx"
    exit 1
}

$endIdx = $endIdx + $oldEnd.Length

$newBlock = @'
// 👨‍🏫 베테랑 손해사정사 실무 코멘트 — 카테고리별 키워드 배열 + 코멘트
const PRACTICAL_COMMENTS: Record<string, { keywords: string[]; comment: string }> = {
  '기왕증': {
    keywords: ['기왕증', '기여도', '퇴행성', '기존 질환', '기존질환', '선천', '기왕'],
    comment: '기왕증(이미 가지고 있던 질환이나 퇴행성 변화)을 이유로 보험금을 감액하거나 합의금을 삭감하려는 주장에 대항할 수 있는 중요한 판례입니다. 대법원은 기왕증의 기여도를 매우 엄격하게 입증할 것을 요구하므로, 보험사 측 의료자문 동의서에 서명하기 전 반드시 전문가와 상의하셔야 합니다.',
  },
  '장해': {
    keywords: ['장해', '후유장해', '장애', '맥브라이드', 'ama', '노동능력', '한시장해', '영구장해'],
    comment: '후유장해 보험금은 맥브라이드식 또는 AMA식 장해 평가 방식과 한시장해 판정 유무에 따라 최종 보상 금액이 천차만별입니다. 개인이 청구하여 보험사 심사팀을 이기기는 거의 불가능하므로 장해진단서 발행 단계부터 전문가 동행이 유리합니다.',
  },
  '교통사고': {
    keywords: ['교통사고', '과실', '차량', '자동차', '충돌', '추돌', '보행자', '도로'],
    comment: '교통사고 피해 시 예상 밖의 과실 비율 적용이나 터무니없는 합의금 산출을 겪을 때 대항력을 갖추는 기준이 됩니다. 법원이 판단한 과실 비율 계산식과 정당한 일실수입 산정 기준을 전문가와 꼼꼼히 대입해야 손해를 줄입니다.',
  },
  '사망': {
    keywords: ['사망', '사망보험금', '유족', '상속', '사인', '익사', '추락사', '심정지'],
    comment: '사망보험금 청구는 지급 규모가 크기 때문에 보험사 측의 까다로운 현장 조사와 의료자문 절차가 수반됩니다. 사인 미상이나 자살 의혹 등 면책 사유를 들이밀 때 초기 조사 단계부터 전문가와 논리를 구축해 청구해야 불이익이 없습니다.',
  },
  '자살': {
    keywords: ['자살', '극단적선택', '고의사고', '심신상실', '우울증', '심신미약'],
    comment: '보험사가 가입자의 극단적 선택(고의 사고)을 주장하며 사망보험금 지급을 거절(면책)할 때 가입자 측 대응 논리가 되는 판례입니다. 망인이 심신상실이나 자유로운 의사결정이 불가능한 극도의 우울증 상태 하에서 발생한 사고임을 객관적으로 소명해야 합니다.',
  },
  '암': {
    keywords: ['암', '악성종양', '악성신생물', '암보험', '진단비', '항암', '전이', '원발'],
    comment: '암 진단비 분쟁은 주로 조직검사 결과지 상의 병리 진단 코드 매칭 해석 싸움입니다. 주치의 코딩뿐만 아니라 임상학적인 암 판정 가능 여부를 추가 입증하여 보험사에 맞서야 합니다.',
  },
  '실손': {
    keywords: ['실손', '실비', '의료비', '비급여', '급여', '건강보험', '의료실비'],
    comment: '실손보험금 청구 시 보험사가 내부 심사 지침이나 약관 조항의 모호함을 틈타 지급을 보류할 때 대항할 근거입니다. 가입자에게 유리하게 약관을 해석하도록 규정한 작성자 불이익 원칙을 적극 피력하여 보상 전략을 짜야 합니다.',
  },
  '고지의무': {
    keywords: ['고지의무', '고지', '알릴의무', '통지의무', '계약해지', '면책', '위반'],
    comment: '보험사가 고지의무 위반이나 통지의무 위반을 이유로 보험계약 해지 및 보험금 지급 거절을 통보할 때 대항할 수 있는 판례입니다. 인과관계의 부존재나 제척기간의 도과 여부를 법리적으로 날카롭게 파헤쳐 대응해야 합니다.',
  },
  '도수치료': {
    keywords: ['도수치료', '체외충격파', '물리치료', '비급여치료', '근막'],
    comment: '도수치료나 체외충격파의 횟수 과다를 이유로 보상을 차단하는 분쟁에 있어 아주 긴요한 판례입니다. 치료 전후로 실제 증상 호전이나 객관적 검사상 개선 효과가 있었음을 의료 기록으로 소명하는 전략이 필수적입니다.',
  },
  '백내장': {
    keywords: ['백내장', '다초점렌즈', '인공수정체', '안과', '수정체'],
    comment: '백내장 수술 및 다초점 렌즈 삽입 관련 실손의료비 부지급 사태에 대응하기 위한 기준 판례입니다. 단순 외래 수술이 아닌 입원 치료가 필요했던 정당성을 증명할 세극등 현미경 검사 결과지 등 객관적 소견을 꼼꼼하게 다듬어야 이길 수 있습니다.',
  },
  '뇌': {
    keywords: ['뇌경색', '뇌졸중', '뇌출혈', '뇌혈관', '뇌간', '뇌수막', '지주막하'],
    comment: '뇌경색(I63)이나 뇌졸중 청구 시, 정밀 검사 미비나 신경학적 결손 부족을 이유로 지급을 보류하거나 하향 조정을 제안할 때 대응할 기준입니다. 제3의 대학병원 전문의 정밀 판독지를 선제적으로 배치해 청구하는 것이 안전합니다.',
  },
  '심장': {
    keywords: ['심근경색', '허혈성심장', '협심증', '심장', '관상동맥', '심전도'],
    comment: '급성심근경색이나 허혈성심장질환 진단비는 심전도나 효소 수치가 미달한다는 이유로 부지급하기 쉽습니다. 임상적인 관점에서 의학적 정당성을 짚어내고 이의제기를 정교하게 밀고 나가야 숨은 보험금을 지킬 수 있습니다.',
  },
  '디스크': {
    keywords: ['추간판', '디스크', '경추', '요추', '척추', '탈출증', '협착'],
    comment: '추간판탈출증(디스크)은 대개 퇴행성이 가미되어 있어 보험사가 무조건 기왕증 감액을 고집합니다. 이 판례를 기초 삼아 사고 충격으로 인해 디스크가 급격히 돌출되었음을 증명하는 외상 관여도 평가를 철저히 진행해야 정당한 금액을 받습니다.',
  },
  '압박골절': {
    keywords: ['압박골절', '골절', '척추골절', '압박', '방출성', '경추골절'],
    comment: '척추 압박골절은 척추의 찌그러진 정도에 따라 고액의 후유장해진단비 청구가 가능한 핵심 분쟁입니다. 최초 장해진단서를 끊을 때 판례 기준에 완벽히 입각해 평가받아야 보험사의 삭감 주장을 방어할 수 있습니다.',
  },
  '배상책임': {
    keywords: ['배상책임', '배상', '손해배상', '책임보험', '피해보상', '시설물'],
    comment: '일상생활배상책임이나 시설물 배상책임 사고 시 피해 규모 입증과 보상 책임의 범위를 결정짓는 기준 판례입니다. 피해 사실에 대한 엄격한 소득 손실 입증과 지출 비용 명세서를 빈틈없이 꾸려야 온전한 보상이 완성됩니다.',
  },
};

// 판결 방향 자동 감지 (소비자 유리/불리)
function detectVerdictDirection(prec: Precedent): string {
  const text = `${prec.judgmentSummary} ${prec.casePoints} ${prec.caseContent}`.toLowerCase();
  if (!text.trim()) return '';

  const favorableScore = ['원고 승', '보험금 지급', '지급 의무', '지급하여야', '인정된다', '타당하다', '이유 있다']
    .filter(kw => text.includes(kw)).length;
  const unfavorableScore = ['기각', '원고 패', '지급 거절', '면책', '해지 적법', '이유 없다', '인정할 수 없다']
    .filter(kw => text.includes(kw)).length;

  if (favorableScore > unfavorableScore)
    return ' 판결데이터 분석결과 소비자(피보험자)에게 유리한 판결 방향으로, 유사한 상황에서 보험금 청구 시 유력한 방어 논리로 활용할 수 있습니다.';
  if (unfavorableScore > favorableScore)
    return ' 보험사 측 주장이 인용된 사례로, 유사한 분쟁에서 소비자가 주의해야 할 법리 기준을 파악하는 데 활용하시기 바랍니다.';
  return '';
}

// 판례 전체 내용 기반 스코어링으로 최적 코멘트 선택
function getPracticeComment(prec: Precedent): string {
  // 제목 + 판시사항 + 판결요지 + 본문을 모두 통합 분석
  const fullText = [prec.title, prec.casePoints, prec.judgmentSummary, prec.caseContent]
    .join(' ').toLowerCase();

  let bestCategory = '';
  let bestScore = 0;

  for (const [category, data] of Object.entries(PRACTICAL_COMMENTS)) {
    const score = data.keywords.filter(kw => fullText.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  const baseComment = bestScore > 0
    ? PRACTICAL_COMMENTS[bestCategory].comment
    : '본 판례는 해당 분쟁에서 법원이 적용한 핵심 법리와 증명 책임 분담 기준을 명시한 판례입니다. 약관 조항의 세밀한 차이와 개별 사실관계에 따라 인용 가능성과 손해사정 방향이 완전히 달라지므로, 권리 행사를 결정하기 전 반드시 전문가와 상담하시기 바랍니다.';

  // 판결 방향 감지 (상세 데이터 로드 후에만)
  const verdictNote = (prec.judgmentSummary || prec.casePoints || prec.caseContent)
    ? detectVerdictDirection(prec)
    : '';

  return baseComment + (verdictNote ? ` ${verdictNote}` : '');
}
'@

$before = $content.Substring(0, $startIdx)
$after  = $content.Substring($endIdx)
$newContent = $before + $newBlock + $after

[System.IO.File]::WriteAllText($file, $newContent, [System.Text.Encoding]::UTF8)
Write-Host "✅ Successfully replaced PRACTICAL_COMMENTS and getPracticeComment with scoring-based system."
Write-Host "New file length: $($newContent.Length) bytes"
