const fs = require('fs');
const path = require('path');

const postsDir = path.join(process.cwd(), 'src/content/posts');
const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));

let stats = {
  aiMemosRemoved: 0,
  metaIssuesFixed: 0,
  ctasRemoved: 0,
  toneFixed: 0
};

files.forEach(f => {
  const filePath = path.join(postsDir, f);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Remove AI Memos like [이미지 제안: ...] or [관련 글 추천] or [이미지 삽입: ...] (when they are on their own line or embedded)
  const aiMemoRegex = /\[(?:이미지 제안|관련 글 추천|이미지 삽입|관련 포스팅|추천 글).*?\]/g;
  if (aiMemoRegex.test(content)) {
    content = content.replace(aiMemoRegex, '');
    stats.aiMemosRemoved++;
  }

  // 2. Fix Meta description (summary) quotes and brackets
  // Find the frontmatter block
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    let frontmatter = frontmatterMatch[1];
    const summaryMatch = frontmatter.match(/summary:\s*(?:>-\s*)?([^\n]+(?:\n\s+[^\n]+)*)/);
    
    if (summaryMatch) {
      let originalSummary = summaryMatch[1];
      let newSummary = originalSummary.replace(/["'\[\]]/g, ''); // Remove quotes and brackets
      if (newSummary !== originalSummary) {
        frontmatter = frontmatter.replace(originalSummary, newSummary);
        content = content.replace(frontmatterMatch[1], frontmatter);
        stats.metaIssuesFixed++;
      }
    }
  }

  // 3. Remove inappropriate CTAs from text (e.g., "보상스쿨에 문의하세요", "전문가와 상담하세요" etc. at the end of sentences)
  // We'll look for sentences that end with these calls to action and remove the whole sentence.
  const ctaSentencesRegex = /[^.!?\n]*?(?:보상스쿨에 문의|상담을 받아보|상담하시기 바랍|전화주세요|연락주세요|전문가와 상담하|상담을 통해|도움을 받으시)[^.!?\n]*?[.!?]/g;
  if (ctaSentencesRegex.test(content)) {
    content = content.replace(ctaSentencesRegex, '');
    stats.ctasRemoved++;
  }

  // 4. Tone fixes: "하시겠습니까?" -> "할까요?" or "합니까?"
  // Example: 억울하시겠습니까? -> 억울하실 것입니다.
  const toneRegex1 = /하시겠습니까\?/g;
  if (toneRegex1.test(content)) {
    content = content.replace(toneRegex1, '하실 것입니다.');
    stats.toneFixed++;
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
});

console.log('--- Rule Enforcement Results ---');
console.log(`AI Memos Removed: ${stats.aiMemosRemoved} files`);
console.log(`Meta Issues Fixed: ${stats.metaIssuesFixed} files`);
console.log(`CTAs Removed: ${stats.ctasRemoved} files`);
console.log(`Tone Fixed: ${stats.toneFixed} files`);
