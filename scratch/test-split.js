const fs = require('fs');

let text = `가. 사고 발생 시 배상책임의 주체 1) 어촌체험마을에서 발생하는 안전사고는 대개 시설물의 하자 혹은 운영자의 안전배려의무 위반에서 기인합니다. 2) 어촌어항공단 및 지자체, 그리고 개별 어촌계는 방문객의 안전을 확보할 의무가 있으며, 이를 소홀히 한 과실이 인정될 경우 민사상 손해배상 책임이 성립합니다.

나. 보험사의 면책 논리와 대법원 판례의 태도 1) 보험사는 사고의 원인이 피해자의 부주의에 기인한다고 주장하며 전액 면책 또는 과실상계 비율을 높게 산정하려는 경향이 있습니다. 2) 관련 대법원 판례에 따르면, 공중이 이용하는 시설의 성격상 예상 가능한 위험에 대해 관리 주체가 방지 조치를 다하지 않았다면 피해자의 부주의가 일부 있더라도 운영자의 책임을 일정 부분 인정하고 있습니다.`;

let body = text.replace(/ ([1-9]+\.|[가-하]\.|[1-9]+\)|[가-하]\)|\([1-9]+\)|\([가-하]\)|[①-⑳]|[㉮-㉻]) /g, '\n\n$1 ');

const blocks = body.split(/(?:\r?\n){2,}/);

const processBlock = (block) => {
  const lines = block.split(/\r?\n/);
  // simulate processBlock mapping
  return lines.join('\n\n');
};

let result = blocks.map(processBlock).join('\n\n').trim() + '\n';
console.log(result);
