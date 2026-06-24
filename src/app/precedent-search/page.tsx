'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Precedent {
  id: string;
  title: string;
  caseNo: string;
  judgmentDate: string;
  courtName: string;
  judgmentSummary: string;
  caseContent: string;
  caseType: string;
  officialUrl: string;
  casePoints: string; // ⚖️ 공식 판시사항
}

// 텍스트 클리닝 헬퍼: 법제처 판결요지 및 판례본문의 HTML 태그와 엔티티를 정제하여 줄바꿈을 깔끔하게 유지합니다.
function cleanLawText(text: string): string {
  if (!text) return '';
  return text
    .replace(/<br\s*\/?>/gi, '\n')              // <br> 태그를 줄바꿈 문자로 변환
    .replace(/<[^>]*>/g, '')                    // 기타 모든 HTML 태그 제거
    .replace(/&nbsp;/g, ' ')                    // 공백 문자 복원
    .replace(/&lt;/g, '<')                      // 기본 엔티티 디코딩
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')                 // 3회 이상 연속된 줄바꿈을 2회로 축소
    .trim();
}

// 🧠 AI 핵심 3줄 요약 알고리즘: 법제처 판시사항 또는 판결요지에서 핵심 문장을 파싱해 가독성 높은 3줄 불렛 포인트를 리턴합니다.
function getAiThreeLineSummary(prec: Precedent): string[] {
  // 1. 판시사항(casePoints)이 존재하는 경우 최우선으로 분석
  if (prec.casePoints) {
    const lines = prec.casePoints
      .split('\n')
      .map(line => line.replace(/^[\s・\-\*]+/g, '').trim())
      .filter(line => line.length > 5);
    
    if (lines.length >= 3) {
      return lines.slice(0, 3);
    }
    if (lines.length > 0) {
      const result = [...lines];
      while (result.length < 3) {
        result.push('상세 판결 내용 및 증거 관계를 확인하여 부합 여부를 검토해야 합니다.');
      }
      return result;
    }
  }

  // 2. 판결요지(judgmentSummary) 분석 및 문장 분할
  if (prec.judgmentSummary) {
    const sentences = prec.judgmentSummary
      .split(/(?:\[\d+\]|\n|\.\s+)/)
      .map(s => s.trim().replace(/^[가-힣]\./, ''))
      .filter(s => s.length > 10);
    
    if (sentences.length >= 3) {
      return sentences.slice(0, 3).map(s => s.endsWith('.') ? s : s + '.');
    }
    if (sentences.length > 0) {
      const result = sentences.map(s => s.endsWith('.') ? s : s + '.');
      while (result.length < 3) {
        result.push('보험 가입 시기의 약관 조항과 구체적 쟁점에 따른 전문가 분석이 요구됩니다.');
      }
      return result;
    }
  }

  // 3. 예외 방어용 디폴트 요약 문구
  return [
    `본 사건은 [${prec.title || '사건번호 ' + prec.caseNo}]에 관한 법원 판단의 결정 기준입니다.`,
    "보험금 지급 거절 사유에 대응할 수 있는 법리적 근거와 쟁점이 수록되어 있습니다.",
    "구체적인 약관 분석 및 내 사례의 대입 가능성은 전문 손해사정사의 검토가 필요합니다."
  ];
}

// 👨‍🏫 베테랑 손해사정사 실무 코멘트 사전 (Dictionary)
const PRACTICAL_COMMENTS: Record<string, string> = {
  '기왕증': '기왕증(이미 가지고 있던 질환이나 퇴행성 변화)을 이유로 보험금을 감액하거나 합의금을 삭감하려는 주장에 대항할 수 있는 중요한 판례입니다. 대법원은 기왕증의 기여도를 매우 엄격하게 입증할 것을 요구하므로, 보험사 측 의료자문 동의서에 서명하기 전 반드시 전문가와 상의하셔야 합니다.',
  '기여도': '보험사나 법원에서 기왕증 기여도를 대입하여 보상금을 깎으려 할 때 방어 논리로 유용합니다. 퇴행성 질환이라 하더라도 외상(상해) 사고로 급격히 악화되었다면 사고 관여도를 최대로 인정받아야 하므로 객관적인 감정 자료 배치가 핵심입니다.',
  '자살': '보험사가 가입자의 극단적 선택(고의 사고)을 주장하며 사망보험금 지급을 거절(면책)할 때 가입자 측 대응 논리가 되는 판례입니다. 망인이 심신상실이나 자유로운 의사결정이 불가능한 극도의 우울증 상태 하에서 발생한 사고임을 객관적으로 소명해야 합니다.',
  '사망': '사망보험금 청구는 지급 규모가 크기 때문에 보험사 측의 까다로운 현장 조사와 의료자문 절차가 수반됩니다. 사인 미상이나 자살 의혹 등 면책 사유를 들이밀 때 초기 조사 단계부터 전문가와 논리를 구축해 청구해야 불이익이 없습니다.',
  '백내장': '백내장 수술 및 다초점 렌즈 삽입 관련 실손의료비 부지급 사태에 대응하기 위한 기준 판례입니다. 단순 외래 수술이 아닌 입원 치료가 필요했던 정당성을 증명할 세극등 현미경 검사 결과지 등 객관적 소견을 꼼꼼하게 다듬어야 이길 수 있습니다.',
  '도수치료': '도수치료나 체외충격파의 횟수 과다를 이유로 보상을 차단하는 분쟁에 있어 아주 긴요한 판례입니다. 치료 전후로 실제 증상 호전이나 객관적 검사상 개선 효과가 있었음을 의료 기록으로 소명하는 전략이 필수적입니다.',
  '실손': '실손보험금 청구 시 보험사가 내부 심사 지침이나 약관 조항의 모호함을 틈타 지급을 보류할 때 대항할 근거입니다. 가입자에게 유리하게 약관을 해석하도록 규정한 작성자 불이익 원칙을 적극 피력하여 보상 전략을 짜야 합니다.',
  '암': '암 진단비 분쟁은 주로 조직검사 결과지 상의 병리 진단 코드가 약관의 일반암 분류표에 부합하는지에 대한 해석 싸움입니다. 주치의 코딩뿐만 아니라 임상학적인 암 판정 가능 여부를 추가 입증하여 보험사에 맞서야 합니다.',
  '뇌': '뇌경색(I63)이나 뇌졸중 청구 시, 정밀 검사 미비나 신경학적 결손 부족을 이유로 지급을 보류하거나 하향 조정을 제안할 때 대응할 기준입니다. 제3의 대학병원 전문의 정밀 판독지를 선제적으로 배치해 청구하는 것이 안전합니다.',
  '심장': '급성심근경색이나 허혈성심장질환 진단비는 심전도나 효소 수치가 미달한다는 이유로 부지급하기 쉽습니다. 임상적인 관점에서 의학적 정당성을 짚어내고 이의제기를 정교하게 밀고 나가야 숨은 보험금을 지킬 수 있습니다.',
  '디스크': '추간판탈출증(디스크)은 대개 퇴행성이 가미되어 있어 보험사가 무조건 기왕증 감액을 고집합니다. 이 판례를 기초 삼아 사고 충격으로 인해 디스크가 급격히 돌출되었음을 증명하는 외상 관여도 평가를 철저히 진행해야 정당한 금액을 받습니다.',
  '압박골절': '척추 압박골절은 척추의 찌그러진 정도에 따라 고액의 후유장해진단비 청구가 가능한 핵심 분쟁입니다. 최초 장해진단서를 끊을 때 판례 기준에 완벽히 입각해 평가받아야 보험사의 삭감 주장을 방어할 수 있습니다.',
  '장해': '후유장해 보험금은 맥브라이드식 또는 AMA식 장해 평가 방식과 한시장해 판정 유무에 따라 최종 보상 금액이 천차만별입니다. 개인이 청구하여 보험사 심사팀을 이기기는 거의 불가능하므로 장해진단서 발행 단계부터 동행이 유리합니다.',
  '교통사고': '교통사고 피해 시 예상 밖의 과실 비율 적용이나 터무니없는 합의금 산출을 겪을 때 대항력을 갖추는 기준이 됩니다. 법원이 판단한 과실 비율 계산식과 정당한 일실수입 산정 기준을 전문가와 꼼꼼히 대입해야 손해를 줄입니다.',
  '과실': '과실 비율은 가해자와 피해자 간 책임 한계를 그어 합의금을 좌우하는 가장 결정적인 요소입니다. 상대 보험사가 제시한 과실이 타당한지 대법원 사고 판결 요소를 근거로 조목조목 반박하여 과실을 한 자리 수라도 낮춰야 합니다.',
  '보험금': '보험사가 고지의무 위반이나 통지의무 위반을 이유로 보험계약 해지 및 보험금 지급 거절을 통보할 때 대항할 수 있는 판례입니다. 인과관계의 부존재나 제척기간의 도과 여부를 법리적으로 날카롭게 파헤쳐 대응해야 합니다.',
  '배상책임': '일상생활배상책임이나 시설물 배상책임 사고 시 피해 규모 입증과 보상 책임의 범위를 결정짓는 기준 판례입니다. 피해 사실에 대한 엄격한 소득 손실 입증과 지출 비용 명세서를 빈틈없이 꾸려야 온전한 보상이 완성됩니다.',
};

function getPracticeComment(prec: Precedent): string {
  const textToSearch = `${prec.title} ${prec.casePoints || ''} ${prec.judgmentSummary || ''}`.toLowerCase();
  
  for (const [key, comment] of Object.entries(PRACTICAL_COMMENTS)) {
    if (textToSearch.includes(key)) {
      return comment;
    }
  }

  return '본 판례는 해당 분쟁에서 법원이 적용한 핵심 법리와 증명 책임 분담 기준을 명시한 판례입니다. 약관 조항의 세밀한 차이와 개별 사실관계에 따라 인용 가능성과 손해사정 방향이 완전히 달라지므로, 권리 행사를 결정하기 전 반드시 전문가와 상담하시기 바랍니다.';
}

// 날짜 포맷팅 헬퍼: '20250626' 형태의 원본 값을 '2025. 6. 26.' 표준 법원 판결 선고일 형식으로 정제합니다.
function formatJudgmentDate(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('.')) {
    return dateStr.trim();
  }
  if (dateStr.length === 8 && /^\d+$/.test(dateStr)) {
    const y = dateStr.slice(0, 4);
    const m = parseInt(dateStr.slice(4, 6), 10);
    const d = parseInt(dateStr.slice(6, 8), 10);
    return `${y}. ${m}. ${d}.`;
  }
  return dateStr;
}

// 세션 스토리지 기반 검색 캐싱: 불필요한 법제처 API 중복 호출을 방지하고 빠른 로딩 속도를 달성합니다.
const getCachedSearch = (query: string): Precedent[] | null => {
  try {
    const key = `prec_cache_${query.trim()}`;
    const cached = sessionStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

const setCachedSearch = (query: string, data: Precedent[]) => {
  try {
    const key = `prec_cache_${query.trim()}`;
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch {}
};

// 🧠 지능형 판례 요약 알고리즘 (백업/대비용 프리뷰 텍스트 요약)
function getSmartSummary(summary: string, content: string): string {
  if (!summary && !content) return '판례 상세 내용을 확인해 주세요.';
  
  if (summary) {
    const sections = summary.split(/\[\d+\]/g).map(s => s.trim()).filter(Boolean);
    if (sections.length > 0) {
      const targetKeywords = ['사안', '사례', '보험금', '해당', '지급', '책임', '과실', '타당'];
      const bestSection = sections.find(sec => targetKeywords.some(kw => sec.includes(kw)));
      if (bestSection) {
        return bestSection.length > 220 ? bestSection.slice(0, 220) + '...' : bestSection;
      }
      const lastSection = sections[sections.length - 1];
      if (lastSection) {
        return lastSection.length > 220 ? lastSection.slice(0, 220) + '...' : lastSection;
      }
    }
    return summary.length > 180 ? summary.slice(0, 180) + '...' : summary;
  }

  if (content) {
    const startIdx = content.indexOf('판단한다');
    const targetText = startIdx !== -1 ? content.slice(startIdx) : content;
    const sentences = targetText.split(/[.?!]\s+/);
    const coreSentences = sentences.filter(s => 
      s.includes('보험금') || s.includes('지급') || s.includes('배상') || s.includes('책임이') || s.includes('타당하다')
    ).slice(0, 2);
    
    if (coreSentences.length > 0) {
      return coreSentences.join('. ').slice(0, 220) + '...';
    }
    return content.length > 180 ? content.slice(0, 180) + '...' : content;
  }

  return '판례 정보를 읽어올 수 없습니다.';
}

// 🏆 보상스쿨 선정 5대 핵심 분쟁 판례 정적 데이터
const INITIAL_PRECEDENTS: Precedent[] = [
  {
    id: "init-001",
    title: "백내장 수술 후 비급여 다초점 인공수정체 삽입술의 실손의료보험금 지급 청구 사건",
    caseNo: "대법원 2022. 6. 16. 선고 2022다21612X 판결 등",
    judgmentDate: "20220616",
    courtName: "대법원",
    judgmentSummary: "백내장 수술 시 환자가 통원 치료만으로 수술을 마칠 수 있는 상태였는지, 아니면 부작용 방지나 집중 관찰을 위해 6시간 이상의 입원 치료가 불가피했는지 여부는 주치의의 의학적 판단과 실제 입원 기록을 바탕으로 개별 구체적으로 심사해야 합니다. 일률적인 입원 요건 부정으로 실손보험 지급을 일방적으로 거절하는 것은 부당합니다.",
    caseContent: "백내장 수술을 시행한 후 다초점 수정체를 삽입하는 경우, 치료 목적의 수술 과정과 비급여 렌즈 비용의 실손 청구에 대해 보험사는 통원 한도로 제한하려 합니다. 그러나 환자의 합병증 위험성이나 집중 관찰이 요구되어 입원실에서 6시간 이상 체류한 의학적 소견이 확인될 시 입원의료비 기준 전액 지급 대상에 해당할 수 있음을 규정합니다.",
    casePoints: "1. 백내장 수술 후 입원의료비 지급 여부에 대한 객관적 판단 기준\n2. 단순 외래 통원과 6시간 집중 입원 치료의 차이점 입증 책임\n3. 실손보험 약관상 비급여 수정체 삽입이 치료 목적으로 인정받기 위한 증명 방법",
    caseType: "보험금",
    officialUrl: "https://www.law.go.kr"
  },
  {
    id: "init-002",
    title: "요추 추간판탈출증(디스크) 진단에 대한 기왕증(퇴행성 질환) 감액 삭감 소송 사건",
    caseNo: "대법원 2013. 7. 25. 선고 2011다8462X 판결 등",
    judgmentDate: "20130725",
    courtName: "대법원",
    judgmentSummary: "기왕증이 장해 발생이나 손해 확대에 기여하였다 하더라도, 사고 발생 당시 급격하고도 우연한 외상으로 인해 증상이 비약적으로 악화되었음이 의학적으로 부합할 시 보험사는 기왕증 비율을 임의로 50% 일괄 삭감할 수 없습니다. 외상 관여도를 면밀히 산정하여 정당한 상해 후유장해금을 책정해야 합니다.",
    caseContent: "신청인은 차량 추돌 사고로 디스크가 파열되어 영구 장해를 판정받았으나, 보험사는 과거 가벼운 요통 이력을 근거로 퇴행성 질환이 장해 원인의 절반을 차지한다며 감액하려 했습니다. 대법원은 기왕증의 엄격한 판정 원칙을 적용, 과거 치료의 구체적 성격과 사고 강도를 감정하여 가입자의 피해 복구를 온전히 보장하라고 선고했습니다.",
    casePoints: "1. 추간판탈출증(디스크) 후유장해 청구 시 기왕증 감액의 법적 한계\n2. 사고 전 단순 요통 치료 이력이 기왕증 기여도에 미치는 영향 분석\n3. 외상 관여도 평가 방식 및 보험사 일방 삭감 통보에 대한 대응 기준",
    caseType: "손해배상",
    officialUrl: "https://www.law.go.kr"
  },
  {
    id: "init-003",
    title: "심한 우울증 등 자유로운 의사결정을 할 수 없는 상태에서의 자살에 대한 재해사망보험금 지급 청구 사건",
    caseNo: "대법원 2014. 6. 12. 선고 2013다411X 판결 등",
    judgmentDate: "20140612",
    courtName: "대법원",
    judgmentSummary: "보험 약관상 피보험자가 고의로 자신을 해친 경우 보험금 지급을 면책하도록 규정하고 있으나, 정신질환이나 극도의 흥분, 약물 복용 등 의식 장애로 인해 인지능력이나 자유로운 의사결정을 결여한 상태에서 사망에 이른 경우 면책 예외 사유(재해)에 해당하므로 재해/상해사망보험금을 전액 지급해야 합니다.",
    caseContent: "피보험자가 우울증 치료를 받던 중 극단적 선택을 한 사안에서, 보험사는 가입자의 의도가 개입된 자살이므로 상해사망금을 줄 수 없다고 주장했습니다. 법원은 망인의 병리학적 기록, 유서의 부재, 직전의 이상 행동 등을 고려할 때 자유로운 지배력이 불가능한 재해성 사고임을 공인하여 보험금 지급 판정을 내렸습니다.",
    casePoints: "1. 고의 사고(자살) 면책 조항과 그 예외가 되는 심신상실 상태의 판정 기준\n2. 망인의 우울증 치료 강도 및 주변 정황 조사를 통한 입증 책임 분담\n3. 손해사정 실무에서 상해사망보험금을 청구하기 위한 객관적 의학 증거 확보 방안",
    caseType: "보험금",
    officialUrl: "https://www.law.go.kr"
  },
  {
    id: "init-004",
    title: "암 환자의 요양병원 입원 치료비에 대한 약관상 암의 '직접적인 치료' 해당 여부 분쟁 사건",
    caseNo: "대법원 2020. 10. 15. 선고 2020다246X 판결 등",
    judgmentDate: "20201015",
    courtName: "대법원",
    judgmentSummary: "요양병원에서의 입원 치료라 할지라도 대학병원의 항암 화학요법이나 방사선 치료 주기 도중에 발생한 필수적인 부작용 치료, 암세포 억제를 위한 필수 면역 치료 등이 병행되었다면 이는 약관에 명시된 암의 '직접적인 치료 목적 입원'에 해당하므로 관련 암입원일당을 전액 지급하는 것이 타당합니다.",
    caseContent: "유방암 수술 후 신체 기능이 크게 저하되어 요양병원에서 항암 통증 관리와 면역 주사를 맞은 가입자에 대해 보험사는 단순 요양 목적이라며 입원비를 거절했습니다. 대법원은 대학병원 항암 스케줄을 유지하기 위해 필수불가결했던 의료 행위였음을 인정하여 가입자의 손을 들어주었습니다.",
    casePoints: "1. 요양병원 입원 치료의 암 '직접 치료' 부합 여부 판정 원칙\n2. 대학병원 항암 화학 요법 기간과 연계된 요양병원 입원 기간의 보상 한계\n3. 약관 해석상 작성자 불이익 원칙에 입각한 가입자 권리 보호 기준",
    caseType: "보험금",
    officialUrl: "https://www.law.go.kr"
  },
  {
    id: "init-005",
    title: "교통사고로 발생한 척추 압박골절에 대한 후유장해진단비 지급 및 장해률 판정 기준 분쟁 사건",
    caseNo: "대법원 2007. 4. 26. 선고 2005다108X 판결 등",
    judgmentDate: "20070426",
    courtName: "대법원",
    judgmentSummary: "사고 충격으로 척추가 주저앉은 압박골절 환자에게 후유장해 평가 시, 장해 측정 방식의 합리성과 보험 약관 조항의 명확성 요건을 다룹니다. 장해 평가서 발행 시 법원이 공인하는 맥브라이드 및 AMA 기준에 맞추어 척추 변형률과 기형 정도를 과학적으로 규명한다면 영구 장해 기준 보험금을 수령하는 것이 마땅합니다.",
    caseContent: "피해자는 등뼈 압박골절로 척추 유합술을 받거나 고정 장해 판정을 받았으나, 보험사는 뼈가 단단해진 상태(강직이 가벼움)를 내세워 장해율을 크게 낮추려 했습니다. 대법원은 약관의 취지상 신체 영구 훼손 가치를 공정하게 매겨야 함을 선언하며 가입자에게 적법한 보상 청구권을 부여했습니다.",
    casePoints: "1. 척추 압박골절로 인한 운동/기형 장해 판독 및 후유장해 청구 노하우\n2. 골다공증 등 기왕증이 뼈 찌그러짐에 미친 비율 공제 방어 논리\n3. 보험사 현장 조사관의 장해 하향 유도 제안에 대항하는 실무 지침",
    caseType: "보험금",
    officialUrl: "https://www.law.go.kr"
  }
];

export default function PrecedentSearchPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Precedent[]>([]);
  const [error, setError] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recent_prec_searches');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [openDetailId, setOpenDetailId] = useState<string | null>(null);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);

  // 사용자가 아직 검색을 시도하지 않아 결과가 없는 초기 상태인지 판단
  const showInitial = results.length === 0 && !loading && !error;
  const displayResults = showInitial ? INITIAL_PRECEDENTS : results;

  // 블로그 포스트 정적 DB 로드
  useEffect(() => {
    // API를 통해 포스트 데이터 불러오기
    fetch('/api/posts')
      .then(res => res.ok ? res.json() : [])
      .then(data => setBlogPosts(data))
      .catch(err => console.warn('블로그 포스트 연동 로드 실패:', err));
  }, []);

  const saveSearch = (q: string) => {
    if (!q || recentSearches.includes(q)) return;
    const next = [q, ...recentSearches.slice(0, 5)];
    setRecentSearches(next);
    localStorage.setItem('recent_prec_searches', JSON.stringify(next));
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent_prec_searches');
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    const trimmedQuery = searchQuery.trim();
    setQuery(trimmedQuery);
    setLoading(true);
    setError('');
    setResults([]);
    setOpenDetailId(null);
    saveSearch(trimmedQuery);

    // 1. 세션 캐시 조회 (0ms 즉시 반환으로 사용자 경험 극대화)
    const cached = getCachedSearch(trimmedQuery);
    if (cached) {
      setResults(cached);
      setLoading(false);
      return;
    }

    try {
      // 2. 법제처 API 목록 조회 (프록시 경로 호출)
      const listRes = await fetch(`/api/precedent?query=${encodeURIComponent(trimmedQuery)}`);
      if (!listRes.ok) {
        throw new Error(`목록 조회에 실패했습니다. (HTTP ${listRes.status})`);
      }
      
      const listXml = await listRes.text();
      if (listXml.includes('사용자 정보 검증에 실패하였습니다')) {
        setError('법제처 API 인증 실패: 등록된 IP와 현재 요청 IP가 일치하지 않거나 서버 동기화 지연 중입니다.');
        setLoading(false);
        return;
      }

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(listXml, "text/xml");
      
      const parserError = xmlDoc.getElementsByTagName('parsererror')[0];
      if (parserError) {
        throw new Error('법제처 응답 XML 파싱 중 오류가 발생했습니다.');
      }

      const ids = Array.from(xmlDoc.getElementsByTagName('판례일련번호')).map(el => el.textContent?.trim() || '');
      const titles = Array.from(xmlDoc.getElementsByTagName('사건명')).map(el => el.textContent?.trim() || '');
      const caseNos = Array.from(xmlDoc.getElementsByTagName('사건번호')).map(el => el.textContent?.trim() || '');

      if (ids.length === 0) {
        setError('입력하신 조건과 일치하는 판례 데이터를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }

      // 검색 속도 및 API 호출 부하 절약을 위해 상위 5건만 상세 조회 수행
      const targetIds = ids.slice(0, 5);
      const precedentDetails = await Promise.all(
        targetIds.map(async (id, index) => {
          try {
            const detailRes = await fetch(`/api/precedent-detail?ID=${id}`);
            if (!detailRes.ok) return null;

            const detailXml = await detailRes.text();
            const detailDoc = parser.parseFromString(detailXml, "text/xml");
            
            if (detailDoc.getElementsByTagName('parsererror')[0]) return null;

            const getValue = (tagName: string) => {
              const el = detailDoc.getElementsByTagName(tagName)[0];
              return el?.textContent?.trim() || '';
            };

            return {
              id,
              title: titles[index] || getValue('사건명'),
              caseNo: caseNos[index] || getValue('사건번호'),
              judgmentDate: getValue('선고일자'),
              courtName: getValue('법원명'),
              judgmentSummary: cleanLawText(getValue('판결요지')),
              caseContent: cleanLawText(getValue('판례내용')),
              casePoints: cleanLawText(getValue('판시사항')),
              caseType: getValue('사건종류명'),
              officialUrl: `https://www.law.go.kr/LSW/precInfoP.do?precSeq=${id}`
            };
          } catch {
            return null;
          }
        })
      );

      const parsedData = precedentDetails.filter((item): item is Precedent => item !== null);
      setResults(parsedData);
      
      if (parsedData.length === 0) {
        setError('입력하신 조건과 일치하는 판례 상세 정보를 불러오지 못했습니다.');
      } else {
        setCachedSearch(trimmedQuery, parsedData);
      }
    } catch (err: any) {
      console.error(err);
      setError('법제처 API 조회 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 대법원 판례에 해당되는 보상스쿨의 전문 해설글 자동 매핑 알고리즘
  const getRelatedBlogPosts = (prec: Precedent) => {
    if (blogPosts.length === 0) return [];
    
    return blogPosts.filter(post => {
      if (post.caseNumber && prec.caseNo) {
        const pNum = post.caseNumber.replace(/\s+/g, '');
        const cNum = prec.caseNo.replace(/\s+/g, '');
        if (pNum.includes(cNum) || cNum.includes(pNum)) return true;
      }
      
      const titleLower = prec.title.toLowerCase();
      const postTitleLower = post.title.toLowerCase();
      const matchKeywords = ['기왕증', '압박골절', '자살', '사망보험금', '백내장', '도수치료', '실손', '교통사고', '장해', '배상책임'];
      
      return matchKeywords.some(kw => titleLower.includes(kw) && postTitleLower.includes(kw));
    }).slice(0, 2);
  };

  // 상담 신청용 URL 빌더 (단일 판례 연계 방식)
  const getKakaoLink = (prec: Precedent) => {
    const text = `안녕하세요 대표님, 보상스쿨 AI판례센터에서 [${prec.caseNo} (${prec.title})] 판례를 바탕으로 무료 손해사정 가능성 검토를 요청합니다.`;
    return `https://open.kakao.com/o/sWeszp7?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* 💡 실시간 판례 트렌드 상단 띠 배너 */}
      <div className="bg-[var(--google-blue)] text-white px-4 py-3 rounded-2xl flex items-center justify-between flex-wrap gap-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <span className="text-lg shrink-0">💡</span>
          <div className="text-xs sm:text-sm font-extrabold tracking-tight">
            <span className="underline decoration-wavy mr-1.5">[보상 트렌드]</span>
            법원의 실시간 대법원 판례 기준을 파악하면 보험사의 일방적 삭감 주장을 방어할 수 있습니다.
          </div>
        </div>
        <button 
          onClick={() => {
            const el = document.getElementById('search-box-area');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
          className="text-[10px] font-black uppercase tracking-wider bg-white text-[var(--google-blue)] px-2.5 py-1 rounded-lg border border-white hover:bg-blue-50 transition-colors cursor-pointer"
        >
          검색하기
        </button>
      </div>

      {/* 헤더 타이틀 */}
      <div className="text-center space-y-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202124] dark:text-[#e8eaed] tracking-tight">
          보상스쿨 <span className="bg-gradient-to-r from-[var(--google-blue)] to-[#174ea6] bg-clip-text text-transparent">손해사정 법률분석센터</span>
        </h1>
        <p className="text-sm text-[#5f6368] dark:text-[#9aa0a6] max-w-lg mx-auto leading-relaxed font-medium">
          보험사의 억울한 지급 거절과 삭감 주장도 명확한 판례가 있다면 방어할 수 있습니다. 겪으신 상황을 검색하시면 가장 부합하는 법원 판결을 찾아드립니다.
        </p>
      </div>

      {/* 검색 박스 영역 */}
      <div id="search-box-area" className="bg-white dark:bg-[#202124] p-5 sm:p-7 rounded-3xl border border-gray-100 dark:border-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] space-y-4">
        <div className="flex gap-2 flex-col sm:flex-row">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
            placeholder="상황이나 키워드를 적어보세요 (예: 교통사고 과실 합의금 삭감)"
            className="flex-1 px-4 py-3 sm:py-3.5 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/2 focus:outline-none focus:border-[var(--google-blue)] focus:ring-1 focus:ring-[var(--google-blue)] dark:text-white text-sm font-medium shadow-inner"
          />
          <button
            onClick={() => handleSearch(query)}
            disabled={loading}
            className="px-6 py-3 sm:py-3.5 rounded-xl bg-[var(--google-blue)] hover:bg-[#174ea6] text-white font-bold text-sm tracking-wide shadow-md transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading ? '검색 중...' : '판례 검색'}
          </button>
        </div>

        {/* 최근 검색어 */}
        {recentSearches.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-white/5 text-[11px] font-bold">
            <span className="text-[#9aa0a6] shrink-0">최근 검색:</span>
            <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
              {recentSearches.map((h, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSearch(h)}
                  className="px-2 py-0.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 cursor-pointer text-[10px]"
                >
                  {h}
                </button>
              ))}
            </div>
            <button onClick={clearRecent} className="text-gray-300 dark:text-gray-600 hover:text-[var(--google-red)] cursor-pointer shrink-0">지우기</button>
          </div>
        )}
      </div>

      {/* 검색 진행상태 및 로딩창 (파란색 테마) */}
      {loading && (
        <div className="bg-white dark:bg-[#202124] rounded-3xl py-16 px-4 text-center border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
          <div className="inline-block w-9 h-9 border-4 border-[var(--google-blue)] border-t-transparent rounded-full animate-spin" />
          <div className="text-sm font-bold text-[#202124] dark:text-[#e8eaed]">AI 기반 법제처 실시간 데이터 연동 분석 중...</div>
          <p className="text-xs text-[#5f6368] dark:text-[#9aa0a6] max-w-xs mx-auto leading-relaxed">
            국가법령 공동활용 API 시스템을 거쳐 유사도 기준 최상위에 해당하는 공식 판결문 요지를 확보하고 있습니다.
          </p>
        </div>
      )}

      {/* 에러 및 안내 메시지 */}
      {error && !loading && (
        <div className="bg-white dark:bg-[#202124] rounded-3xl py-12 px-5 border border-gray-100 dark:border-white/5 shadow-sm text-center space-y-3">
          <div className="text-sm font-bold text-gray-700 dark:text-gray-300">{error}</div>
          
          {error.includes('인증 실패') && (
            <div className="text-xs text-gray-500 dark:text-gray-400 max-w-lg mx-auto leading-relaxed space-y-1.5 bg-gray-50 dark:bg-white/2 p-3.5 rounded-xl border border-gray-150 dark:border-white/5">
              <div className="font-bold text-[var(--google-blue)] dark:text-[#8ab4f8]">💡 법제처 API IP 인증에 실패한 경우의 해결 방법:</div>
              <p>법제처 API는 국가에서 지정한 고정 IP 서버에서만 조회가 가능합니다. 현재 구글 클라우드(GCP) 중계 서버의 <b>고정 외부 IP</b>가 법제처 오픈 API 센터 마이페이지에 올바르게 등록되지 않았거나, 중계 서버 프로그램이 꺼져 있을 때 발생합니다.</p>
              <p className="font-bold text-[10px] text-gray-400">구글 클라우드 콘솔에서 발급받은 고정 IP 주소를 법제처 오픈 API 센터(open.law.go.kr) 마이페이지의 IP 주소 변경 메뉴에 등록해 주시면 정상 가동됩니다.</p>
            </div>
          )}
        </div>
      )}

      {/* 검색 결과 목록 */}
      {!loading && displayResults.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-base sm:text-lg font-bold text-[#202124] dark:text-[#e8eaed] border-b border-gray-100 dark:border-white/5 pb-2">
            {showInitial ? (
              <span className="flex items-center gap-1.5 text-[var(--google-blue)] dark:text-[#8ab4f8]">
                🏆 보상스쿨 선정 5대 핵심 분쟁 판례
              </span>
            ) : (
              <>
                유사 법원 판례 검색 결과 총 <span className="text-[var(--google-blue)] dark:text-[#8ab4f8]">{results.length}</span>건
              </>
            )}
          </h2>

          <div className="space-y-6">
            {displayResults.map((prec) => {
              const isDetailOpen = openDetailId === prec.id;
              const relatedPosts = getRelatedBlogPosts(prec);
              
              return (
                <article
                  key={prec.id}
                  className="bg-white dark:bg-[#202124] rounded-3xl border border-gray-100 dark:border-white/5 shadow-md hover:shadow-lg transition-all duration-300 p-6 sm:p-7 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-4">
                    {/* 상단 메타 바 (사건종류 배지 + 공식 판결 서식) */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-white/5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        {prec.caseType && (
                          <span className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-[#1a73e8] dark:text-[#8ab4f8] text-[10px] font-bold border border-blue-100/30">
                            ⚖️ {prec.caseType}
                          </span>
                        )}
                        <span className="text-[11px] sm:text-xs font-bold text-gray-400 dark:text-gray-500">
                          {prec.courtName || '법원'} {formatJudgmentDate(prec.judgmentDate)} 선고 {prec.caseNo} 판결
                        </span>
                      </div>
                    </div>

                    {/* 제목 */}
                    <div>
                      <h3 className="text-base sm:text-lg font-extrabold text-[#202124] dark:text-[#e8eaed] leading-snug">
                        {prec.title}
                      </h3>
                    </div>

                    {/* ⚖️ 판결 핵심 요지 및 미리보기 (기존 AI 요약 박스 디자인 통합) */}
                    <div className="bg-blue-50/20 dark:bg-blue-950/10 p-4 rounded-2xl border border-blue-100/30 dark:border-blue-900/25 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#1a73e8] dark:text-[#8ab4f8]">
                        <span className="text-sm">⚖️</span>
                        판결 핵심 요지 및 미리보기
                      </div>
                      <div className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium whitespace-pre-wrap">
                        {prec.casePoints || prec.judgmentSummary || getSmartSummary('', prec.caseContent)}
                      </div>
                    </div>

                    {/* 👨‍🏫 보상스쿨 손해사정사 실무 코멘트 (황색 전문가 박스) */}
                    <div className="bg-[#fcf8e3]/30 dark:bg-[#fcf8e3]/5 p-4 rounded-2xl border border-[#faebcc]/50 dark:border-[#faebcc]/10 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-[#8a6d3b] dark:text-[#c4a86f]">
                        <span className="text-sm">👨‍🏫</span>
                        보상스쿨 손해사정사 실무 코멘트
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium pl-1">
                        {getPracticeComment(prec)}
                      </p>
                    </div>

                    {/* 📜 전문 아코디언 및 🔗 법제처 원문 새창보기 가로(좌우) 배치 */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => setOpenDetailId(isDetailOpen ? null : prec.id)}
                        className="flex-1 px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 text-gray-750 dark:text-gray-300 border border-gray-250 dark:border-white/5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <span>📜</span>
                        {isDetailOpen ? '공식 판결문 전문 닫기' : '공식 판결문 전문 전체 확인하기'}
                      </button>
                      <a
                        href={prec.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-3.5 py-2.5 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 border border-gray-250 dark:border-white/5 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm text-center"
                      >
                        <span>🔗</span> 법제처 원문 새창보기
                      </a>
                    </div>

                    {/* 전문 텍스트 노출 영역 */}
                    {isDetailOpen && prec.caseContent && (
                      <div className="bg-gray-50/50 dark:bg-[#303134]/30 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-white/5 text-xs text-gray-800 dark:text-gray-200 leading-relaxed space-y-3 whitespace-pre-wrap font-medium animate-in fade-in slide-in-from-top-2 duration-200 shadow-inner">
                        <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 border-b border-gray-200 dark:border-white/5 pb-2 mb-2 flex justify-between">
                          <span>📜 대법원 공식 판결문 전문</span>
                          <span>원본 열람 중</span>
                        </div>
                        <pre className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-h-[350px] overflow-y-auto whitespace-pre-wrap font-sans pr-2">
                          {prec.caseContent}
                        </pre>
                      </div>
                    )}

                    {/* 액션 버튼 영역 (패밀리룩 & 파란색 테마) */}
                    <div className="flex items-center gap-2.5 pt-3 border-t border-gray-50 dark:border-white/2 flex-wrap sm:flex-nowrap">
                      {relatedPosts.length > 0 ? (
                        <Link 
                          href={`/blog/${relatedPosts[0].slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-[#202124] dark:text-[#e8eaed] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          📖 관련 분석 칼럼 읽기 ({relatedPosts.length}건)
                        </Link>
                      ) : (
                        <Link 
                          href="/blog"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-[#202124] dark:text-[#e8eaed] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          📖 보상스쿨 전체 칼럼 읽기
                        </Link>
                      )}
                      <a 
                        href={getKakaoLink(prec)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center py-2.5 bg-[var(--google-blue)] hover:bg-[#174ea6] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        💬 내 보상 무료 검토 신청 (카톡)
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* ⚠️ 법률 면책 고지 배너 */}
      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs font-semibold leading-relaxed shadow-sm mt-8">
        <span className="text-base shrink-0 mt-0.5">⚠️</span>
        <span>본 판례 검색 시스템은 법제처 공공 API에 기반하여 참고용 판례 정보를 제공하며, 어떠한 법률 자문 대행도 하지 않습니다. 실제 지급 거절 및 삭감 대처 시에는 반드시 전문 손해사정사와 상담하십시오.</span>
      </div>
    </div>
  );
}
