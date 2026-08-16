const fs = require('fs');
const path = require('path');

const postsDirectory = path.join(process.cwd(), 'src/content/posts');

/**
 * ==============================================================================
 * [보상스쿨 CQF 품질 검증 & 자동 교정 엔진 (Rock-Solid & Non-Invasive)]
 * 
 * 슬로건: 표준, 범용, 콤팩트, 통합, 공유, 공통
 * 
 * 아키텍처:
 * 1. Metadata Engine: summary 쌍따옴표 안전 래핑
 * 2. Noise & Dummy Cleaner: 상투적 더미 멘트 박스, AI 메모, CTA, 비표준 백틱 삭제
 * 3. Opening & Summary Guard: 오프닝 문단 ➔ 핵심 요약 박스 ➔ 본문 대주제(## 1.) 흐름 보장
 * 4. 3-Step Solution Engine: ①, ②, ③ 제목(######)과 본문 설명 분리 렌더링
 * 5. List Heading Normalizer: 본문 내 나열형 소항목(1) 2) 3))의 부적절한 H태그 제거
 * ==============================================================================
 */

const NUM_WORD_MAP = {
  '첫째': '①', '둘째': '②', '셋째': '③', '넷째': '④', '다섯째': '⑤',
  '여섯째': '⑥', '일곱째': '⑦', '여덟째': '⑧', '아홉째': '⑨', '열째': '⑩'
};

function processPostContent(rawContent) {
  const parts = rawContent.split('---');
  if (parts.length < 3) return rawContent;

  let frontmatter = parts[1];
  let body = parts.slice(2).join('---').trim();

  // ----------------------------------------------------
  // 1. Frontmatter 정규화 (summary 따옴표 래핑)
  // ----------------------------------------------------
  const summaryMatch = frontmatter.match(/summary:\s*(?:>-\s*)?([^\n]+(?:\n\s+[^\n]+)*)/);
  let summaryText = '';
  if (summaryMatch) {
    const originalSummaryLine = summaryMatch[0];
    const originalSummaryValue = summaryMatch[1];
    summaryText = originalSummaryValue.replace(/\n\s+/g, ' ').replace(/["'\[\]]/g, '').trim();
    const newSummaryLine = `summary: "${summaryText}"`;
    if (originalSummaryLine !== newSummaryLine) {
      frontmatter = frontmatter.replace(originalSummaryLine, newSummaryLine);
    }
  }

  const titleMatch = frontmatter.match(/title:\s*["']?([^"'\n]+)/);
  const titleText = titleMatch ? titleMatch[1].replace(/["']/g, '').trim() : '';

  // ----------------------------------------------------
  // 2. 노이즈 및 상투적 더미 멘트 박스 삭제
  // ----------------------------------------------------
  // 상투적 더미 실무쟁점 박스 제거 ("본 칼럼은 손해사정 전문가의 실제 보상 처리 경험과...")
  body = body.replace(/>\s*###\s*💡\s*보상스쿨\s*실무쟁점\s*\r?\n(?:>\s*[^\n]*\r?\n)*?>\s*.*?(?:실제 보상 처리 경험과 법원 판례 해석|피보험자의 권리 보호와 올바른 보험금)[^\n]*\r?\n?/g, '');

  // AI 메타 메모 삭제
  body = body.replace(/\[(?:이미지 제안|관련 글 추천|이미지 삽입|관련 포스팅|추천 글|관련 연관 글).*?\]/g, '');

  // 서술형 영업성 CTA 문장 삭제
  body = body.replace(/[^.!?\n]*?(?:보상스쿨에 문의|상담을 받아보|상담하시기 바랍|전화주세요|연락주세요|전문가와 상담하|상담을 통해|도움을 받으시)[^.!?\n]*?[.!?]/g, '');

  // 빈 인용구 줄 제거
  body = body.replace(/^>[ \t]*$/gm, '');

  // 비코드 텍스트 박스 백틱 해제
  body = body.replace(/^```(?:markdown|text)?\s*\n([\s\S]*?)\n```\s*$/gm, (match, inner) => `\n${inner.trim()}\n`);

  // 자주 묻는 질문 FAQ 제목 표준화
  body = body.replace(/^##\s*(?:💡\s*)?자주\s*묻는\s*질문(?:\s*\(FAQ\))?(?:\s*TOP\s*\d+)?\s*$/gm, '## 💡 자주 묻는 질문 (FAQ)');

  // 마크다운 표 정렬행 오타 교정
  body = body.replace(/^(\|[\s\:\-\|]+)\|>[ \t]*$/gm, '$1|');

  // 종결어미 톤 교정
  body = body.replace(/하시겠습니까\?/g, '해야 합니다.')
             .replace(/계십니까\?/g, '상황이신가요.')
             .replace(/있습니까\?/g, '있으신가요.')
             .replace(/십니까\?/g, '하신가요.')
             .replace(/하실까요\?/g, '할 수 있습니다.');

  // 제목 콜론 띄어쓰기 정규화
  body = body.split('\n').map(line => {
    if (line.startsWith('##')) {
      return line.replace(/([^ ])\s*:\s*([^ ])/g, '$1 : $2');
    }
    return line;
  }).join('\n');

  // 잔존 HTML div 태그 정규화
  body = body.replace(/<div[^>]*>[\s\S]*?(?:<strong>|<b>)[\s\S]*?(?:👨‍⚖️.*?|손해사정사.*?)<\/strong>[\s\S]*?<br>([\s\S]*?)<\/div>/ig, (match, text) => {
    const lines = text.trim().split('\n').filter(l => l.trim() !== '');
    return '> ### 👨‍⚖️ 보상스쿨 실무쟁점\n' + lines.map(l => '> ' + l.trim()).join('\n');
  });

  // H1 강제 H2 변환
  body = body.replace(/^# (.*)$/gm, '## $1');

  // ----------------------------------------------------
  // 3. 3단계 맞춤형 솔루션 정규화 (①, ②, ③ 제목/본문 스플릿)
  // ----------------------------------------------------
  // "① **1단계 : 분석** : 내용" 또는 "① 분석 : 내용"을 "###### ① 분석\n\n내용"으로 분리
  body = body.replace(/^([ \t]*>+[ \t]*)?(?:#{1,6}[ \t]*)?(①|②|③|④)[ \t]*(?:\*\*?)?(?:[1-4]단계[ \t]*:?[ \t]*)?(.*?)(?:\*\*?)?[ \t]*:[ \t]*(.*)$/gm, (match, bq, marker, title, desc) => {
    return `###### ${marker} ${title.trim()}\n\n${desc.trim()}`;
  });

  // 서수 단어(첫째, 둘째) -> 원문자 치환
  body = body.replace(/^([ \t]*>+[ \t]*)?(?:#{1,6}[ \t]*)?(?:\*\*?)?(첫째|둘째|셋째|넷째|다섯째|여섯째|일곱째|여덟째|아홉째|열째)[\s,.:\-]+(.*?)(?:\*\*?)?$/gm, (match, bq, word, rest) => {
    return `${NUM_WORD_MAP[word]} ${rest}`;
  });

  // ----------------------------------------------------
  // 4. 나열형 소항목(1) 2) 3) 4)) 빈 헤딩 방지 (서술형 리스트 강등)
  // ----------------------------------------------------
  // 3개 이상 연속된 '#### 1) ', '#### 2) ' 형태의 나열형 소제목은 H태그를 벗겨 일반 리스트로 정규화
  body = body.replace(/^(?:#{1,6}\s+)?([1-9]+\))\s+(.*)$/gm, (match, marker, text) => {
    // 설명 문단 없이 단독으로 나열되는 항목은 일반 텍스트 기호로 렌더링
    return `${marker} ${text.trim()}`;
  });

  // 단독으로 작성된 '1. ' 대제목(H2 누락분)을 '## 1. '로 복원
  body = body.replace(/^([1-9]+\.\s+[^\n]+)$/gm, '## $1');

  // 단독으로 작성된 '가. ' 중제목(H3 누락분)을 '### 가. '로 복원
  body = body.replace(/^([가-하]\.\s+[^\n]+)$/gm, '### $1');

  // 중복 헤딩 샵(### ## 1.) 청소
  body = body.replace(/^#{2,6}\s+(##\s+.*)$/gm, '$1');
  body = body.replace(/^#{3,6}\s+(###\s+.*)$/gm, '$1');

  // ----------------------------------------------------
  // 5. 오프닝 문단 및 핵심 요약 100% 안전 보장
  // ----------------------------------------------------
  // 오프닝 문단이 헤딩으로 시작하는 경우 복구
  const blocks = body.split(/(?:\r?\n){2,}/);
  const firstBlock = (blocks[0] || '').trim();
  if (firstBlock.startsWith('#') || firstBlock.startsWith('>')) {
    const autoOpening = summaryText || `${titleText}에 대한 손해사정 실무 쟁점과 올바른 권리 구제 방안을 명확히 알아봅니다.`;
    body = autoOpening + '\n\n' + body;
  }

  // 핵심 요약 섹션이 없으면 오프닝 바로 뒤에 생성
  if (!body.includes('핵심 요약') && !body.includes('핵심요약')) {
    const currentBlocks = body.split(/(?:\r?\n){2,}/);
    const opening = currentBlocks[0];
    const rest = currentBlocks.slice(1).join('\n\n');

    let bullets = [];
    if (summaryText) {
      const sentences = summaryText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 5);
      sentences.slice(0, 3).forEach(s => bullets.push(`> - ${s.trim()}`));
    }
    if (bullets.length < 2) {
      bullets.push(`> - ${titleText} 관련 법원 판례 및 표준약관 해석의 핵심 쟁점을 분석합니다.`);
      bullets.push(`> - 보험사의 일방적인 면책 및 삭감 주장에 맞서 정당한 보상금을 산정하는 실무 기준을 제시합니다.`);
    }

    const summaryBlock = `## 💡 핵심 요약\n${bullets.join('\n')}`;
    body = `${opening}\n\n${summaryBlock}\n\n${rest}`;
  } else {
    // 핵심 요약 아래의 불릿 리스트만 안전하게 박스(>) 래핑
    body = body.replace(/(##\s*(?:💡\s*)?(?:핵심\s*요약|핵심요약)\s*\r?\n+)((?:[ \t]*>?[ \t]*[-*+].*\r?\n*)+)/g, (match, heading, listBlock) => {
      const lines = listBlock.trim().split(/\r?\n/).filter(l => l.trim() !== '');
      const boxedLines = lines.map(line => {
        const cleanLine = line.replace(/^[ \t]*>[ \t]*/, '').trim();
        return `> ${cleanLine}`;
      });
      return `${heading.trim()}\n${boxedLines.join('\n')}\n\n`;
    });
  }

  // 1분 자가진단 아래의 체크박스/불릿 리스트만 안전하게 박스(>) 래핑
  body = body.replace(/(##\s*(?:💡\s*)?1분\s*자가진단[^\n]*\r?\n+)((?:[ \t]*>?[ \t]*[-*+\[].*\r?\n*)+)/g, (match, heading, listBlock) => {
    const lines = listBlock.trim().split(/\r?\n/).filter(l => l.trim() !== '');
    const boxedLines = lines.map(line => {
      const cleanLine = line.replace(/^[ \t]*>[ \t]*/, '').trim();
      return `> ${cleanLine}`;
    });
    return `${heading.trim()}\n${boxedLines.join('\n')}\n\n`;
  });

  return `---\n${frontmatter.trim()}\n---\n\n${body.trim()}\n`;
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
    const originalContent = fs.readFileSync(fullPath, 'utf8');
    const content = processPostContent(originalContent);

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      fixedCount++;
    }

    // 검증 로직
    let errorsInFile = [];
    if (/\[(?:이미지 제안|관련 글 추천|이미지 삽입|관련 포스팅|추천 글|관련 연관 글).*?\]/g.test(content)) {
      errorsInFile.push('Unfixable AI memo placeholder remaining.');
    }

    if (/^##.*(?:용어\s*사전|핵심\s*보상\s*용어)/mi.test(content)) {
      errorsInFile.push('Glossary fallback section detected (Rule 4 violation). Must be inline.');
    }

    if (/^[ \t]*[\+┌][\-─=]{3,}[\+┐][ \t]*$/m.test(content)) {
      errorsInFile.push('ASCII Art Table or Box detected. Must use standard markdown table or blockquote.');
    }

    if (/(?:보상스쿨에 문의|상담을 받아보|상담하시기 바랍|전화주세요|연락주세요|전문가와 상담하|상담을 통해 도움을 받으시)/.test(content)) {
      errorsInFile.push('Descriptive CTA found (Rule 5 violation).');
    }

    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (fmMatch) {
      const sMatch = fmMatch[1].match(/summary:\s*(?:>-\s*)?([^\n]+(?:\n\s+[^\n]+)*)/);
      if (sMatch) {
        const summaryVal = sMatch[1];
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
    console.log(`🛠️ CQF 정밀 엔진 자동 교정 완료 (적용 파일: ${fixedCount}개).`);
  }

  if (hasErrors) {
    console.error('\n🚨 치명적 렌더링 오류가 발견되었습니다. 위 파일을 수동으로 수정하세요.');
    process.exit(1);
  } else {
    console.log('✅ All blog posts passed quality checks (Rock-Solid Verified).');
  }
}

checkQuality();
