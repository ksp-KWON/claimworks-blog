const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const postsDirectory = path.join(process.cwd(), 'src/content/posts');

function checkQuality() {
  if (!fs.existsSync(postsDirectory)) {
    console.log('Posts directory not found, skipping quality check.');
    return;
  }

  const fileNames = fs.readdirSync(postsDirectory);
  let hasErrors = false;

  fileNames.forEach((fileName) => {
    if (!fileName.endsWith('.md') && !fileName.endsWith('.mdx')) return;

    const fullPath = path.join(postsDirectory, fileName);
    const content = fs.readFileSync(fullPath, 'utf8');
    const { data } = matter(content);

    let errorsInFile = [];

    // 1. AI Memos / Placeholders
    if (/\[(?:이미지 제안|관련 글 추천|이미지 삽입|관련 포스팅|추천 글).*?\]/g.test(content)) {
      errorsInFile.push('Found AI memo placeholder (e.g., [이미지 제안: ...])');
    }

    // 2. Meta description quote/bracket checks (Summary in frontmatter)
    const summaryText = data.summary ? String(data.summary) : '';
    if (summaryText.includes('"') || summaryText.includes('[') || summaryText.includes(']')) {
      errorsInFile.push('Summary frontmatter contains brackets or quotes which harms SEO and breaks parsing.');
    }

    // 3. CTA phrases embedded inside sentences
    const ctaSentencesRegex = /[^.!?\n]*?(?:보상스쿨에 문의|상담을 받아보|상담하시기 바랍|전화주세요|연락주세요|전문가와 상담하|상담을 통해|도움을 받으시)[^.!?\n]*?[.!?]/g;
    if (ctaSentencesRegex.test(content)) {
      errorsInFile.push('CTA text is unnaturally embedded in a sentence (e.g. "보상스쿨에 문의하세요"). CTAs must only be buttons/components.');
    }

    // 4. Tone checks (존댓말 통일, ~하시겠습니까? 금지)
    const toneRegex = /하시겠습니까\?|십니까\?|하실까요\?/g;
    if (toneRegex.test(content)) {
      errorsInFile.push('Tone violation: Found inappropriate interrogative ending like "하시겠습니까?". Use "~합니다" or "~마세요".');
    }

    // 5. H2 Colon spacing checks
    const h2Regex = /^##\s+.*[^ ]:[^ ].*$/gm;
    let match;
    while ((match = h2Regex.exec(content)) !== null) {
      errorsInFile.push(`H2 heading contains unspaced colon: "${match[0]}"`);
    }

    if (errorsInFile.length > 0) {
      hasErrors = true;
      console.error(`\n❌ Quality check failed in ${fileName}:`);
      errorsInFile.forEach((err) => console.error(`  - ${err}`));
    }
  });

  if (hasErrors) {
    console.error('\n🚨 Quality checks failed. (Violation of Content Quality Framework)');
    console.error('Please run `node scripts/enforce-rules.js` to auto-fix most violations, or manually fix the above errors before committing/publishing.');
    process.exit(1);
  } else {
    console.log('✅ All blog posts passed quality checks (Content Quality Framework verified).');
  }
}

checkQuality();
