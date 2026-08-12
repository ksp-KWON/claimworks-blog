const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const postsDirectory = path.join(process.cwd(), 'src/content/posts');

// 파이프라인 배열 패턴: 각 Rule은 name과 fix 함수를 가짐
const fixPipeline = [
  {
    name: 'H1 헤딩 금지 (H2로 강제 변환)',
    fix: (content) => {
      const parts = content.split('---');
      if (parts.length >= 3) {
        const frontmatter = parts[0] + '---' + parts[1] + '---';
        const body = parts.slice(2).join('---');
        const newBody = body.replace(/^# (.*)$/gm, '## $1');
        return frontmatter + newBody;
      }
      return content.replace(/^# (.*)$/gm, '## $1');
    }
  },
  {
    name: '텅 빈 인용구 줄 제거 (헌법 제4조 준수)',
    fix: (content) => {
      // 빈 인용구(오직 ">" 또는 "> "만 있는 줄)를 삭제
      return content.replace(/^>[ \t]*$/gm, '');
    }
  },
  {
    name: '마크다운 표 코드블록 감싸기 해제',
    fix: (content) => {
      // ```markdown (또는 ```) 이 나오고 그 안에 표준 표 구분선(|---|)이 포함된 경우에만 백틱을 벗겨냄 (누더기 정규식 최적화)
      return content.replace(/```(?:markdown)?\n([\s\S]*?\|[-:\s]+\|[\s\S]*?)```/g, (match, tableContent) => {
        return tableContent.trim() + '\n';
      });
    }
  },
  {
    name: '마크다운 표 정렬행 오타 자동 교정',
    fix: (content) => {
      // |---|---|---|> 또는 | :--- | :--- |> 등의 오타를 |---|---| 로 교정
      return content.replace(/^(\|[\s\:\-\|]+)\|>[ \t]*$/gm, '$1|');
    }
  },
  {
    name: 'YAML Frontmatter 안전 래핑 (쌍따옴표)',
    fix: (content) => {
      const match = content.match(/^---\n([\s\S]*?)\n---/);
      if (!match) return content;
      
      let frontmatter = match[1];
      const summaryMatch = frontmatter.match(/summary:\s*(?:>-\s*)?([^\n]+(?:\n\s+[^\n]+)*)/);
      
      if (summaryMatch) {
        let originalSummaryLine = summaryMatch[0];
        let originalSummaryValue = summaryMatch[1];
        let cleanText = originalSummaryValue.replace(/["'\[\]]/g, '').trim();
        let newSummaryLine = `summary: "${cleanText}"`;
        
        if (originalSummaryLine !== newSummaryLine) {
           let newFrontmatter = frontmatter.replace(originalSummaryLine, newSummaryLine);
           return content.replace(frontmatter, newFrontmatter);
        }
      }
      return content;
    }
  },
  {
    name: 'AI 메타 메모 삭제',
    fix: (content) => content.replace(/\[(?:이미지 제안|관련 글 추천|이미지 삽입|관련 포스팅|추천 글).*?\]/g, '')
  },
  {
    name: '서술형 영업성 CTA 문장 삭제',
    fix: (content) => content.replace(/[^.!?\n]*?(?:보상스쿨에 문의|상담을 받아보|상담하시기 바랍|전화주세요|연락주세요|전문가와 상담하|상담을 통해|도움을 받으시)[^.!?\n]*?[.!?]/g, '')
  },
  {
    name: '종결어미 톤 교정',
    fix: (content) => {
      let c = content;
      c = c.replace(/하시겠습니까\?/g, '해야 합니다.');
      c = c.replace(/계십니까\?/g, '상황이신가요.');
      c = c.replace(/있습니까\?/g, '있으신가요.');
      c = c.replace(/십니까\?/g, '하신가요.');
      c = c.replace(/하실까요\?/g, '할 수 있습니다.');
      return c;
    }
  },
  {
    name: '제목 콜론 띄어쓰기 정규화',
    fix: (content) => {
      return content.split('\n').map(line => {
        if (line.startsWith('##')) {
          return line.replace(/([^ ])\s*:\s*([^ ])/g, '$1 : $2');
        }
        return line;
      }).join('\n');
    }
  },
  {
    name: '잔존 HTML div 태그 마크다운 정규화 (Author Box 대응)',
    fix: (content) => {
      // 낡은 div 태그 구조가 다시 나타날 경우를 대비한 보험성 파이프라인
      return content.replace(/<div[^>]*>[\s\S]*?(?:<strong>|<b>)[\s\S]*?(?:👨‍⚖️.*?|손해사정사.*?)<\/strong>[\s\S]*?<br>([\s\S]*?)<\/div>/ig, (match, text) => {
        let lines = text.trim().split('\n').filter(line => line.trim() !== '');
        return '> ### 👨‍⚖️ 보상스쿨 실무쟁점\n' + lines.map(line => '> ' + line.trim()).join('\n');
      });
    }
  }
];

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
    let originalContent = fs.readFileSync(fullPath, 'utf8');
    let content = originalContent;

    // 파이프라인 순차 적용
    fixPipeline.forEach(rule => {
      content = rule.fix(content);
    });

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      fixedCount++;
    }

    // 검증 로직 (파이프라인 통과 후에도 남아있는 치명적 에러)
    let errorsInFile = [];
    if (/\[(?:이미지 제안|관련 글 추천|이미지 삽입|관련 포스팅|추천 글).*?\]/g.test(content)) {
      errorsInFile.push('Unfixable AI memo placeholder remaining.');
    }

    // 범용적 ASCII 박스(단일/다중 컬럼 포함) 원천 차단: +---+ 또는 ┌───┐ 형태의 테두리 라인이 하나라도 존재하면 치명적 에러
    if (/^[ \t]*[\+┌][\-─=]{3,}[\+┐][ \t]*$/m.test(content)) {
      errorsInFile.push('ASCII Art Table or Box detected. Must use standard markdown table or blockquote.');
    }

    if (errorsInFile.length > 0) {
      hasErrors = true;
      console.error(`\n❌ Quality check failed in ${fileName}:`);
      errorsInFile.forEach((err) => console.error(`  - ${err}`));
    }
  });

  if (fixedCount > 0) {
    console.log(`🛠️ 파이프라인 자동 교정 완료 (적용 파일: ${fixedCount}개).`);
  }

  if (hasErrors) {
    console.error('\n🚨 치명적 렌더링 오류가 발견되었습니다. 위 파일을 수동으로 수정하세요.');
    process.exit(1);
  } else {
    console.log('✅ All blog posts passed quality checks (Auto-fixed & Verified).');
  }
}

checkQuality();
