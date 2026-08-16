const isDescriptive = (text) => {
  const trimmed = text.replace(/\*\*?/g, '').trim();
  // 1. 문장부호 종결
  if (/[.?!]$/.test(trimmed)) return true;
  // 2. 서술/연결 어미 및 조사 종결
  if (/(니다|습니다|합니다|바랍니다|말합니다|시오|을|를|은|는|이|가|에|에게|에서|로|으로)[^\w가-힣]*$/.test(trimmed)) return true;
  // 3. 행정체 명사형 종결
  if (/(함|됨|음)[^\w가-힣]*$/.test(trimmed)) return true;
  // 4. 모바일 UI 한계선 (40자 규칙)
  if (trimmed.length > 40) return true;
  return false;
};

console.log(isDescriptive("과거 유사한 레저 사고에서 법원은 사망자가 수중에서 예기치 않은 환경에 직면해 신체 기능이 급격히 저하되었고, 이것이 외래적 요인에 기인한 사망임을 인정하여 상해사망보험금 전액을 지급하라는 판결을 다수 내린 바 있습니다."));
