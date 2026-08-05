const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const postsDirectory = path.join(process.cwd(), 'src/content/posts');

function autoFixContent(content, data) {
  let originalContent = content;

  // 1. Remove AI Memos
  content = content.replace(/\[(?:이미지 제안|관련 글 추천|이미지 삽입|관련 포스팅|추천 글).*?\]/g, '');

  // 2. Meta description (summary) quotes and brackets
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    let frontmatter = frontmatterMatch[1];
    const summaryMatch = frontmatter.match(/summary:\s*(?:>-\s*)?([^\n]+(?:\n\s+[^\n]+)*)/);
    if (summaryMatch) {
      let originalSummary = summaryMatch[1];
      let newSummary = originalSummary.replace(/["'\[\]]/g, '');
      if (newSummary !== originalSummary) {
        content = content.replace(originalSummary, newSummary);
      }
    }
  }

  // 3. CTA phrases embedded
  const ctaSentencesRegex = /[^.!?\n]*?(?:보상스쿨에 문의|상담을 받아보|상담하시기 바랍|전화주세요|연락주세요|전문가와 상담하|상담을 통해|도움을 받으시)[^.!?\n]*?[.!?]/g;
  content = content.replace(ctaSentencesRegex, '');

  // 4. Tone fixes
  content = content.replace(/하시겠습니까\?/g, '해야 합니다.');
  content = content.replace(/계십니까\?/g, '상황이신가요.');
  content = content.replace(/있습니까\?/g, '있으신가요.');
  content = content.replace(/십니까\?/g, '하신가요.');
  content = content.replace(/하실까요\?/g, '할 수 있습니다.');

  // 5. Unspaced colons in H2
  let lines = content.split('\n');
  let changedLines = false;
  for(let i=0; i<lines.length; i++) {
    if (lines[i].startsWith('##')) {
       let oldLine = lines[i];
       let newLine = oldLine.replace(/([^ ])\s*:\s*([^ ])/g, '$1 : $2');
       if (oldLine !== newLine) {
         lines[i] = newLine;
         changedLines = true;
       }
    }
  }
  if (changedLines) {
    content = lines.join('\n');
  }

  return content;
}

function checkQuality() {
  if (!fs.existsSync(postsDirectory)) {
    console.log('Posts directory not found, skipping quality check.');
    return;
  }

  const fileNames = fs.readdirSync(postsDirectory);
  let hasErrors = false;
  let fixedCount = 0;

  fileNames.forEach((fileName) => {
    if (!fileName.endsWith('.md') && !fileName.endsWith('.mdx')) return;

    const fullPath = path.join(postsDirectory, fileName);
    let content = fs.readFileSync(fullPath, 'utf8');
    const { data } = matter(content);

    // AUTO-FIX FIRST
    const fixedContent = autoFixContent(content, data);
    if (fixedContent !== content) {
      fs.writeFileSync(fullPath, fixedContent, 'utf8');
      content = fixedContent; // use fixed content for further checks
      fixedCount++;
    }

    let errorsInFile = [];

    // Final Validation (if anything was unfixable or structural)
    if (/\[(?:이미지 제안|관련 글 추천|이미지 삽입|관련 포스팅|추천 글).*?\]/g.test(content)) {
      errorsInFile.push('Unfixable AI memo placeholder remaining.');
    }
    const toneRegex = /하시겠습니까\?|십니까\?|하실까요\?/g;
    if (toneRegex.test(content)) {
      errorsInFile.push('Unfixable tone violation remaining.');
    }

    // 5. H2 Colon spacing checks (Strict Validation)
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

  if (fixedCount > 0) {
    console.log(`🛠️ Auto-fixed ${fixedCount} files during quality check.`);
  }

  if (hasErrors) {
    console.error('\n🚨 Quality checks failed with unfixable errors. Please manually fix the above errors.');
    process.exit(1);
  } else {
    console.log('✅ All blog posts passed quality checks (Auto-fixed & Verified).');
  }
}

checkQuality();
