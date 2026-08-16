const React = require('react');

// Simulate the logic in MarkdownRenderer.tsx
const p = ({ children }) => {
  // simulate React.Children.toArray
  const childrenArray = Array.isArray(children) ? children : [children];
  if (childrenArray.length > 0 && typeof childrenArray[0] === 'string') {
    const firstText = childrenArray[0];
    const match = firstText.match(/^([1-9]+\.|[가-하]\.|[1-9]+\)|[가-하]\)|\([1-9]+\)|\([가-하]\)|[①-⑳]|[㉮-㉻])(?:[ \t]+)/);
    if (match) {
      const marker = match[1];
      const restText = firstText.slice(match[0].length);
      
      let indentClass = '';
      if (/^[1-9]+\.$/.test(marker)) indentClass = 'ml-0';
      else if (/^[가-하]\.$/.test(marker)) indentClass = 'ml-4 sm:ml-5';
      else if (/^[1-9]+\)$/.test(marker)) indentClass = 'ml-8 sm:ml-10';
      else if (/^[가-하]\)$/.test(marker)) indentClass = 'ml-12 sm:ml-[60px]';
      else if (/^\([1-9]+\)$/.test(marker)) indentClass = 'ml-16 sm:ml-[80px]';
      else if (/^\([가-하]\)$/.test(marker)) indentClass = 'ml-20 sm:ml-[100px]';
      else if (/^[①-⑳]$/.test(marker)) indentClass = 'ml-24 sm:ml-[120px]';
      else if (/^[㉮-㉻]$/.test(marker)) indentClass = 'ml-28 sm:ml-[140px]';

      return `MATCHED! marker: ${marker}, indent: ${indentClass}, rest: ${restText}`;
    }
  }
  return `NOT MATCHED`;
};

console.log(p({ children: "1) 보험사가 자체 자의적으로 실시한..." }));
console.log(p({ children: "가. 객관적인 제3자의료자문..." }));
console.log(p({ children: "① 사고 초기 기록 및..." }));
console.log(p({ children: "일반적인 텍스트입니다." }));
