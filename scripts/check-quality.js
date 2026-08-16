const fs = require('fs');
const path = require('path');

const postsDirectory = path.join(process.cwd(), 'src/content/posts');

/**
 * ==============================================================================
 * [보상스쿨 CQF 품질 검증 & 자동 교정 엔진 (Compact & Unified Pipeline)]
 * 
 * 슬로건: 표준, 범용, 콤팩트, 통합, 공유, 공통
 * 
 * 아키텍처:
 * 1. Metadata Engine: Frontmatter 정규화 및 요약문 쌍따옴표 래핑
 * 2. Opening & Summary Engine: 서술형 오프닝 및 3대 핵심 요약 박스 100% 보장
 * 3. Sanitizer Engine: AI 메모, 상투적 더미 박스, CTA, 비표준 백틱 및 기호 잔재 제거
 * 4. CQF Hierarchy & Box Engine: 공문서 1:1 매핑 및 3단계 솔루션/체크리스트 박스 정규화
 * ==============================================================================
 */

// 1. 구식 서수 단어를 원문자로 매핑
const NUM_WORD_MAP = {
  '첫째': '①', '둘째': '②', '셋째': '③', '넷째': '④', '다섯째': '⑤',
  '여섯째': '⑥', '일곱째': '⑦', '여덟째': '⑧', '아홉째': '⑨', '열째': '⑩'
};

// 2. 문장이 서술형(설명형)인지 판별하는 콤팩트 헬퍼
function isDescriptiveText(text) {
  const trimmed = text.replace(/\*\*?/g, '').trim();
  if (/[.?!]$/.test(trimmed)) return true;
  if (/(니다|습니다|합니다|바랍니다|말합니다|시오|을|를|은|는|이|가|에|에게|에서|로|으로)[^\w가-힣]*$/.test(trimmed)) return true;
  if (/(함|됨|음)[^\w가-힣]*$/.test(trimmed)) return true;
  if (trimmed.length > 40) return true;
  return false;
}

// 3. 포스트 단위 통합 처리 파이프라인
function processPostContent(rawContent) {
  const parts = rawContent.split('---');
  if (parts.length < 3) return rawContent;

  let frontmatter = parts[1];
  let body = parts.slice(2).join('---').trim();

  // ----------------------------------------------------
  // Stage 1: Frontmatter 정규화
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
  // Stage 2: 오프닝 문단 및 핵심 요약 박스 100% 보장
  // ----------------------------------------------------
  const initialBlocks = body.split(/(?:\r?\n){2,}/);
  const firstBlock = (initialBlocks[0] || '').trim();
  const hasOpening = firstBlock.length > 0 && !firstBlock.startsWith('#') && !firstBlock.startsWith('>');

  if (!hasOpening) {
    const autoOpening = summaryText || `${titleText}에 대한 손해사정 실무 쟁점과 올바른 권리 구제 방안을 명확히 알아봅니다.`;
    body = autoOpening + '\n\n' + body;
  }

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
  }

  // ----------------------------------------------------
  // Stage 3: 본문 클리닝 (노이즈 및 비표준 잔재 제거)
  // ----------------------------------------------------
  // H1 강제 H2 변환
  body = body.replace(/^# (.*)$/gm, '## $1');
  
  // AI 메타 메모 삭제
  body = body.replace(/\[(?:이미지 제안|관련 글 추천|이미지 삽입|관련 포스팅|추천 글|관련 연관 글).*?\]/g, '');
  
  // 상투적 더미 실무쟁점 박스 제거
  body = body.replace(/>\s*###\s*💡\s*보상스쿨\s*실무쟁점\s*\r?\n(?:>\s*[^\n]*\r?\n)*?>\s*.*?(?:실제 보상 처리 경험과 법원 판례 해석|피보험자의 권리 보호와 올바른 보험금)[^\n]*\r?\n?/g, '');
  
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

  // ----------------------------------------------------
  // Stage 4: CQF 공문서 위계 & 3단계 솔루션 & 박스 엔진
  // ----------------------------------------------------
  // 3단계 맞춤형 솔루션 양식 통일
  body = body.replace(/^([ \t]*>+[ \t]*)?(?:#{1,6}[ \t]*)?(①|②|③|④)[ \t]*(?:\*\*?)?(?:[1-4]단계[ \t]*:?[ \t]*)?(.*?)(?:\*\*?)?[ \t]*:[ \t]*(.*)$/gm, (match, bq, marker, title, desc) => {
    return `${bq || ''}${marker} ${title.trim()}\n\n${bq || ''}${desc.trim()}`;
  });

  // 서수 단어(첫째, 둘째) -> 원문자 치환
  body = body.replace(/^([ \t]*>+[ \t]*)?(?:#{1,6}[ \t]*)?(?:\*\*?)?(첫째|둘째|셋째|넷째|다섯째|여섯째|일곱째|여덟째|아홉째|열째)[\s,.:\-]+(.*?)(?:\*\*?)?$/gm, (match, bq, word, rest) => {
    return `${bq || ''}${NUM_WORD_MAP[word]} ${rest}`;
  });

  // 단일 기호 라인들이 빈 줄을 두고 연속해서 나타나는 경우 문단 병합
  body = body.replace(/^((?:[ \t]*>+[ \t]*)?(?:#{1,6}[ \t]*)?(?:[1-9]+\.|[가-하]\.|[1-9]+\)|[가-하]\)|\([1-9]+\)|\([가-하]\)|[①-⑳]|[㉮-㉻])[ \t]+[^\n]*\r?\n)\r?\n(?=(?:[ \t]*>+[ \t]*)?(?:#{1,6}[ \t]*)?(?:[1-9]+\.|[가-하]\.|[1-9]+\)|[가-하]\)|\([1-9]+\)|\([가-하]\)|[①-⑳]|[㉮-㉻])[ \t]+)/gm, '$1');

  // 빈 헤딩 찌꺼기 제거
  body = body.replace(/^[ \t]*#{1,6}[ \t]*\r?\n/gm, '');

  // 인라인 기호 뭉침 강제 문단 분리
  body = body.replace(/(?<=[가-힣a-zA-Z0-9.?!>'"\],:;]) ([1-9]+\.|[가-하]\.|[1-9]+\)|[가-하]\)|\([1-9]+\)|\([가-하]\)|[①-⑳]|[㉮-㉻]) /g, '\n\n$1 ');

  // 핵심 요약 및 1분 자가진단 박스(Blockquote) 자동 변환
  const boxRegex = /(#{2,3}\s*(?:[가-하]\.\s*)?(?:💡\s*)?(?:핵심\s*요약|1분\s*자가진단(?:.*)?)\s*\r?\n+)([\s\S]*?)(?=\r?\n##|$)/g;
  body = body.replace(boxRegex, (match, heading, listBlock) => {
    const boxedList = listBlock.replace(/\s+$/, '').split(/\r?\n/).map(line => {
      if (line.trim().startsWith('>')) return line;
      if (line.trim() === '') return '>';
      return `> ${line}`;
    }).join('\n');
    return heading + boxedList + '\n\n';
  });

  // 블록 단위 공문서 기호 매핑 함수
  const processBlock = (block) => {
    const lines = block.split(/\r?\n/);
    let hasMarker = false;
    let anyDescriptive = false;

    const markerRegex = /^([ \t]*>+[ \t]*)?(?:#{1,6}[ \t]*)?((?:[1-9]+\.|[가-하]\.|[1-9]+\)|[가-하]\)|\([1-9]+\)|\([가-하]\)|[①-⑳]|[㉮-㉻]))[ \t]+(.*)$/;

    const parsedLines = lines.map(line => {
      const match = line.match(markerRegex);
      if (match) {
        hasMarker = true;
        const bq = match[1] || '';
        const marker = match[2];
        const text = match[3];
        if (isDescriptiveText(text)) anyDescriptive = true;
        return { isMarkerLine: true, bq, marker, text, original: line };
      }
      return { isMarkerLine: false, original: line };
    });

    if (!hasMarker) return block;

    const markerCount = parsedLines.filter(pl => pl.isMarkerLine).length;
    if (markerCount > 1) {
      anyDescriptive = true;
    }

    const mappedLines = parsedLines.map(pl => {
      if (!pl.isMarkerLine) return pl.original;

      if (anyDescriptive) {
        let escapedMarker = pl.marker;
        if (/^[1-9]+[.)]$/.test(pl.marker)) {
          escapedMarker = pl.marker.replace(/^([1-9]+)([.)])$/, '$1\\$2');
        }
        return `${pl.bq}${escapedMarker} ${pl.text}`;
      } else {
        let prefix = '';
        if (/^[1-9]+\.$/.test(pl.marker)) prefix = '## ';
        else if (/^[가-하]\.$/.test(pl.marker)) prefix = '### ';
        else if (/^[1-9]+\)$/.test(pl.marker)) prefix = '#### ';
        else if (/^[가-하]\)$/.test(pl.marker)) prefix = '##### ';
        else prefix = '###### ';
        return `${pl.bq}${prefix}${pl.marker} ${pl.text}`;
      }
    });

    return mappedLines.join('\n\n');
  };

  const blocks = body.split(/(?:\r?\n){2,}/);
  const processedBody = blocks.map(processBlock).join('\n\n').trim();

  return `---\n${frontmatter.trim()}\n---\n\n${processedBody}\n`;
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
    console.log(`🛠️ CQF 엔진 통합 교정 완료 (적용 파일: ${fixedCount}개).`);
  }

  if (hasErrors) {
    console.error('\n🚨 치명적 렌더링 오류가 발견되었습니다. 위 파일을 수동으로 수정하세요.');
    process.exit(1);
  } else {
    console.log('✅ All blog posts passed quality checks (Unified Engine Verified).');
  }
}

checkQuality();
