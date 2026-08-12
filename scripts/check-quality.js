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
    name: 'FAQ 헤딩 표준 양식 자동 교정',
    fix: (content) => {
      // "## 자주 묻는 질문", "## 자주 묻는 질문(FAQ)", "## 💡 자주 묻는 질문" 등 비표준 양식을 표준형으로 통일
      return content.replace(/^##\s*(?:💡\s*)?자주\s*묻는\s*질문(?:\s*\(FAQ\))?(?:\s*TOP\s*\d+)?\s*$/gm, '## 💡 자주 묻는 질문 (FAQ)');
    }
  },
  {
    name: '무분별한 비코드 텍스트 박스 백틱 강제 해제 (헌법 제9조 확장)',
    fix: (content) => {
      // 표(|---|)뿐만 아니라 일반 리스트나 강조 박스 용도로 AI가 남용한 빈 백틱(```) 또는 ```markdown, ```text 를 강제로 벗겨냄
      // 단, 프로그래밍 언어가 명시된 진짜 코드블록(javascript, ts, diff, bash, json 등)은 보호함
      return content.replace(/^```(?:markdown|text)?\s*\n([\s\S]*?)\n```\s*$/gm, (match, innerContent) => {
        // 내부에 진짜 코드(예: 함수 정의 등)가 있는지 휴리스틱으로 방어할 수도 있으나, 
        // 본 블로그 콘텐츠 특성상 빈 백틱은 100% AI의 강조 텍스트박스 남용임.
        // 일반 텍스트로 자연스럽게 흐르도록 인용구(>) 마크다운으로 변환하거나 그대로 텍스트로 노출
        // 가독성을 위해 상단/하단 여백 추가
        return `\n${innerContent.trim()}\n`;
      });
    }
  },
  {
    name: '순차적 열거형 서술(첫째, 둘째...) 기호화 및 H4 변환',
    fix: (content) => {
      const numMap = { '첫째': '①', '둘째': '②', '셋째': '③', '넷째': '④', '다섯째': '⑤', '여섯째': '⑥', '일곱째': '⑦', '여덟째': '⑧', '아홉째': '⑨', '열째': '⑩' };
      // 문단 맨 앞에 "**첫째, OOO**", "*둘째 - OOO*" 등으로 볼드처리가 섞인 채 시작하는 줄까지 포괄적으로 탐지
      return content.replace(/^([ \t]*)(?:\*\*?)?(첫째|둘째|셋째|넷째|다섯째|여섯째|일곱째|여덟째|아홉째|열째)[\s,.:\-]+(.*?)(?:\*\*?)?$/gm, (match, space, word, rest) => {
        // 뒤쪽에 남아있을 수 있는 볼드체 기호 안전하게 한 번 더 제거
        const cleanRest = rest.replace(/\*\*?/g, '').trim();
        return `#### ${numMap[word]} ${cleanRest}`;
      });
    }
  },
  {
    name: '숫자 열거형 서술(1. **제목** : 내용) 기호화 및 H4 변환',
    fix: (content) => {
      const numMap = ['⓪', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'];
      // 패턴: 1. **제목** : 설명 또는 1. **제목 :** 설명 (AI가 즐겨 쓰는 설명형 리스트)
      return content.replace(/^([ \t]*)(\d+)\.[ \t]*(?:\*\*?)?([^:\n*]+)(?:\*\*?)?[ \t]*:[ \t]*(?:\*\*?)?(.*)$/gm, (match, space, numStr, title, desc) => {
        const num = parseInt(numStr, 10);
        const circleNum = (num > 0 && num <= 20) ? numMap[num] : numStr + '.';
        const cleanTitle = title.replace(/\*\*?/g, '').trim();
        const cleanDesc = desc.replace(/\*\*?/g, '').trim();
        // 헤딩과 본문 분리로 완벽한 가독성 확보
        return `#### ${circleNum} ${cleanTitle}\n\n${cleanDesc}\n`;
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
