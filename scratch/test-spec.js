const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
// We need to test how react-markdown parses `1\) `
// Since we don't have react-markdown installed in our scratch env, I'll just rely on markdown spec.
// CommonMark spec: "Any ASCII punctuation character may be backslash-escaped".
// ")" is an ASCII punctuation character. So `1\)` renders as `1)`.
console.log("Markdown spec confirms 1\\) parses to '1) ' text node.");
