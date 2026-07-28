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

    // 1. Placeholder checks
    if (content.includes('[이미지 제안:')) {
      errorsInFile.push('Found image placeholder: [이미지 제안: ...]');
    }
    if (content.includes('[관련 글 추천]')) {
      errorsInFile.push('Found placeholder: [관련 글 추천]');
    }

    // 2. Meta description bracket checks (Summary in frontmatter)
    const summaryText = data.summary ? String(data.summary) : '';
    if (summaryText.startsWith('[') && summaryText.endsWith(']')) {
      errorsInFile.push('Summary frontmatter contains brackets [...] which harms SEO.');
    }

    // 3. Embedded CTA checks
    // "보상스쿨에 문의하세요" embedded inside sentences (e.g., ends with "를 통해" or "라고")
    if (/(보상스쿨에 문의하세요를|보상스쿨에 문의하세요라고|보상스쿨에 문의하세요가)/.test(content)) {
      errorsInFile.push('CTA text "보상스쿨에 문의하세요" is unnaturally embedded in a sentence.');
    }

    // 4. H2 Colon spacing checks
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
    console.error('\n🚨 Quality checks failed. Please fix the above errors before publishing.');
    process.exit(1);
  } else {
    console.log('✅ All blog posts passed quality checks.');
  }
}

checkQuality();
