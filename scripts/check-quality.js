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
    name: '공문서 체계 절대 매핑 및 형제 노드 동기화 엔진 (CQF 4원칙)',
    fix: (content) => {
      // 구식 "첫째, 둘째" 잔재를 먼저 원문자(①) 기호로 치환 (승격 아님)
      const numMap = { '첫째': '①', '둘째': '②', '셋째': '③', '넷째': '④', '다섯째': '⑤', '여섯째': '⑥', '일곱째': '⑦', '여덟째': '⑧', '아홉째': '⑨', '열째': '⑩' };
      let normalized = content.replace(/^([ \t]*>+[ \t]*)?(?:#{1,6}[ \t]*)?(?:\*\*?)?(첫째|둘째|셋째|넷째|다섯째|여섯째|일곱째|여덟째|아홉째|열째)[\s,.:\-]+(.*?)(?:\*\*?)?$/gm, (match, bq, word, rest) => {
        return `${bq || ''}${numMap[word]} ${rest}`;
      });

      const parts = normalized.split('---');
      if (parts.length < 3) return normalized;
      
      const frontmatter = parts[0] + '---' + parts[1] + '---';
      let body = parts.slice(2).join('---');

      // AI가 잘못 생성한 빈 헤딩(예: ##\n 또는 ###\n) 찌꺼기 제거
      body = body.replace(/^[ \t]*#{1,6}[ \t]*\r?\n/gm, '');

      // AI가 여러 기호를 한 줄에 몰아서 쓴 경우(예: 가. 블라블라 1) 어쩌고) 강제로 문단 분리(\n\n) 처리
      // 단축 기호 앞뒤에 공백이 있을 때만 분리
      body = body.replace(/ ([1-9]+\.|[가-하]\.|[1-9]+\)|[가-하]\)|\([1-9]+\)|\([가-하]\)|[①-⑳]|[㉮-㉻]) /g, '\n\n$1 ');

      const isDescriptive = (text) => {
        const trimmed = text.replace(/\*\*?/g, '').trim();
        // 1. 문장부호 종결
        if (/[.?!]$/.test(trimmed)) return true;
        // 2. 서술/연결 어미 및 조사 종결
        if (/(니다|습니다|합니다|바랍니다|말합니다|시오|을|를|은|는|이|가|에|에게|에서|로|으로)[^\w가-힣]*$/.test(trimmed)) return true;
        // 3. 행정체 명사형 종결
        if (/(함|됨|음)[^\w가-힣]*$/.test(trimmed)) return true;
        // 4. 모바일 UI 한계선 (40자 규칙)
        if (trimmed.length > 40) return true;
        return false;
      };

      const processBlock = (block) => {
        const lines = block.split(/\r?\n/);
        let hasMarker = false;
        let anyDescriptive = false;
        
        // 인용구(>), 헤딩(#), 공문서 기호 캡처
        const markerRegex = /^([ \t]*>+[ \t]*)?(?:#{1,6}[ \t]*)?((?:[1-9]+\.|[가-하]\.|[1-9]+\)|[가-하]\)|\([1-9]+\)|\([가-하]\)|[①-⑳]|[㉮-㉻]))[ \t]+(.*)$/;
        
        const parsedLines = lines.map(line => {
          const match = line.match(markerRegex);
          if (match) {
            hasMarker = true;
            const bq = match[1] || '';
            const marker = match[2];
            const text = match[3];
            const desc = isDescriptive(text);
            if (desc) anyDescriptive = true;
            return { isMarkerLine: true, bq, marker, text, original: line };
          }
          return { isMarkerLine: false, original: line };
        });

        if (!hasMarker) return block;

        const mappedLines = parsedLines.map(pl => {
          if (!pl.isMarkerLine) return pl.original;
          
          if (anyDescriptive) {
            // 서술형이 하나라도 있으면 모두 강등 (H태그 제거)
            return `${pl.bq}${pl.marker} ${pl.text}`;
          } else {
            // 서술형이 없으면 공문서 1:1 절대 매핑
            let prefix = '';
            if (/^[1-9]+\.$/.test(pl.marker)) prefix = '## ';
            else if (/^[가-하]\.$/.test(pl.marker)) prefix = '### ';
            else if (/^[1-9]+\)$/.test(pl.marker)) prefix = '#### ';
            else if (/^[가-하]\)$/.test(pl.marker)) prefix = '##### ';
            else if (/^\([1-9]+\)$/.test(pl.marker)) prefix = '###### ';
            // 하위 기호는 HTML 한계로 인해 H태그 미부여
            return `${pl.bq}${prefix}${pl.marker} ${pl.text}`;
          }
        });
        
        return mappedLines.join('\n\n');
      };

      const blocks = body.split(/(?:\r?\n){2,}/);
      // 블록 결합 시 앞뒤 공백(trim) 및 프론트매터 결합
      return frontmatter + '\n\n' + blocks.map(processBlock).join('\n\n').trim() + '\n';
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
    fix: (content) => content.replace(/\[(?:이미지 제안|관련 글 추천|이미지 삽입|관련 포스팅|추천 글|관련 연관 글).*?\]/g, '')
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
    if (/\[(?:이미지 제안|관련 글 추천|이미지 삽입|관련 포스팅|추천 글|관련 연관 글).*?\]/g.test(content)) {
      errorsInFile.push('Unfixable AI memo placeholder remaining.');
    }

    if (/^##.*(?:용어\s*사전|핵심\s*보상\s*용어)/mi.test(content)) {
      errorsInFile.push('Glossary fallback section detected (Rule 4 violation). Must be inline.');
    }

    // 범용적 ASCII 박스(단일/다중 컬럼 포함) 원천 차단: +---+ 또는 ┌───┐ 형태의 테두리 라인이 하나라도 존재하면 치명적 에러
    if (/^[ \t]*[\+┌][\-─=]{3,}[\+┐][ \t]*$/m.test(content)) {
      errorsInFile.push('ASCII Art Table or Box detected. Must use standard markdown table or blockquote.');
    }

    // 부적절하게 삽입된 CTA 검증 (파이프라인 누락분 방어)
    if (/(?:보상스쿨에 문의|상담을 받아보|상담하시기 바랍|전화주세요|연락주세요|전문가와 상담하|상담을 통해 도움을 받으시)/.test(content)) {
      errorsInFile.push('Descriptive CTA found (Rule 5 violation).');
    }

    // Meta description(summary) 대괄호/따옴표 중복 여부 검증
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (fmMatch) {
      const summaryMatch = fmMatch[1].match(/summary:\s*(?:>-\s*)?([^\n]+(?:\n\s+[^\n]+)*)/);
      if (summaryMatch) {
        const summaryVal = summaryMatch[1];
        // 파이프라인에서 이미 ""로 감쌌으므로, 내부 값에 다시 대괄호 [] 또는 추가 쌍따옴표가 있으면 중복
        if (/\[.*\]/.test(summaryVal) || (summaryVal.match(/"/g) || []).length > 2) {
          errorsInFile.push('Duplicate quotes or brackets in meta description (Rule 5 violation).');
        }
      }
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
