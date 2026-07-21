const { cleanFssText } = require('./src/lib/cleaners.js');

const input1 = `■ (추진 배경) 금융감독원 등 4개 기관이 고의 교통사고 보험사기 근절을 위해 체결한 업무협약*에 따라 고의 교통사고 예방 교육 및 홍보 활동을 본격 추진



금융감독원,경찰청,한국도로교통공단,손해보험협회 간 업무협약 체결('25.11.13)


■ (예방 교육) 고의 교통사고 유형,처벌,대처요령 등이 담긴 전문 교통안전교육 콘텐츠 개발 및 교육 실시('26.6월 말부터)`;

const input2 = `■ 개선방안



'기명 대리청구인'만 운영 → '무기명 대리청구인' 추가

대리청구인 지정시 개인정보 동의 필요 → 대리청구인 지정시 개인정보 동의 불필요`;

console.log("----1----");
console.log(cleanFssText(input1));
console.log("----2----");
console.log(cleanFssText(input2));
