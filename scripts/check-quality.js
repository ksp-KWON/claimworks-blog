/**
 * scripts/check-quality.js
 * 글로벌 마크다운(GFM) & W3C 시맨틱 웹 표준 CQF 품질 검증 엔진
 * 
 * [헌법 원칙: 표준 · 콤팩트 · 통합 · 공유]
 * - 자체 중복 정규식을 전면 폐지하고, 전사 단일 표준 엔진(markdown-standard.js)을 공유
 * - 빌드 파이프라인에서 전수 무결성 검증 및 초고속 동기화 수행
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { normalizePost } = require('../src/lib/markdown-standard.js');
const { BANNED_PHRASES, CORE_BANNED_KEYWORDS, getUniversalSkeleton } = require('../src/lib/prompt-rules.js');

const POSTS_DIR = path.join(process.cwd(), 'src/content/posts');

function normalizeFilename(filename) {
  const baseName = filename.replace(/\.md$/, '');
  // 구글 SEO 표준: 소문자 영문, 숫자, 하이픈만 허용
  if (/^[a-z0-9]+(-[a-z0-9]+)*$/.test(baseName)) {
    return filename;
  }
  // 비표준 파일명 소문자 케밥케이스로 정규화
  const clean = baseName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
  return `${clean || 'post'}.md`;
}

function checkTemplateSelfConsistency() {
  const skeleton = getUniversalSkeleton();
  const violations = BANNED_PHRASES.filter((phrase) => skeleton.includes(phrase));

  if (violations.length > 0) {
    console.error('❌ [CQF 비상] 템플릿 자기모순 발견: 금지 목록에 있는 표현이 뼈대 템플릿(getUniversalSkeleton)에 포함되어 있습니다.');
    violations.forEach((v) => console.error(`   - 위반 표현: "${v}"`));
    process.exit(1); // 빌드/배포 즉각 중단!
  }
  console.log('✅ [CQF 게이트] 템플릿-금지목록 자기모순 검사 통과 (무결 확인)');
}

const APP_DIR = path.join(process.cwd(), 'src/app');
const COMPONENTS_DIR = path.join(process.cwd(), 'src/components');

function getTargetFiles(dir, isComponents = false) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file === 'api' || file === 'admin' || file === 'node_modules') continue;
      results = results.concat(getTargetFiles(filePath, isComponents));
    } else if (file.endsWith('.tsx')) {
      if (isComponents || file === 'page.tsx') {
        results.push(filePath);
      }
    }
  }
  return results;
}

function checkUIAndStaticQuality() {
  const pageFiles = getTargetFiles(APP_DIR, false);
  const componentFiles = getTargetFiles(COMPONENTS_DIR, true);
  const allFiles = [...pageFiles, ...componentFiles];
  let violationCount = 0;

  for (const filePath of allFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const relativePath = path.relative(process.cwd(), filePath);
    let inBlockComment = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const trimmed = line.trim();

      // 다중 라인 블록 주석 스킵
      if (inBlockComment) {
        if (trimmed.includes('*/')) inBlockComment = false;
        continue;
      }
      if (trimmed.startsWith('/*')) {
        if (!trimmed.includes('*/')) inBlockComment = true;
        continue;
      }

      // 한 줄 주석 스킵
      if (trimmed.startsWith('//') || trimmed.startsWith('{/*')) continue;

      // CSS 레이아웃 스타일의 100% 속성은 정상 레이아웃이므로 필터링
      let testLine = line;
      testLine = testLine.replace(/width\s*[:=]\s*['"]?100%['"]?/g, '');
      testLine = testLine.replace(/height\s*[:=]\s*['"]?100%['"]?/g, '');
      testLine = testLine.replace(/max-width\s*[:=]\s*['"]?100%['"]?/g, '');

      // 인라인 주석(//) 뒤 내용 제거
      const commentIdx = testLine.indexOf('//');
      if (commentIdx >= 0) {
        testLine = testLine.slice(0, commentIdx);
      }

      const recordedWords = new Set();

      // 1) 헌법 BANNED_PHRASES 매칭
      for (const phrase of BANNED_PHRASES) {
        if (testLine.includes(phrase) && !recordedWords.has(phrase)) {
          console.error(`❌ [CQF 게이트] UI 컴포넌트/정적 페이지 금지 표현 적발: ${relativePath}:${i + 1} -> "${phrase}"`);
          console.error(`   내용: ${trimmed}`);
          violationCount++;
          recordedWords.add(phrase);
        }
      }

      // 2) UI 핵심 단어 단위 매칭 (CORE_BANNED_KEYWORDS - SSOT)
      for (const word of CORE_BANNED_KEYWORDS) {
        if (testLine.includes(word) && !recordedWords.has(word)) {
          console.error(`❌ [CQF 게이트] UI 컴포넌트/정적 페이지 금지 단어 적발: ${relativePath}:${i + 1} -> "${word}"`);
          console.error(`   내용: ${trimmed}`);
          violationCount++;
          recordedWords.add(word);
        }
      }
    }
  }

  if (violationCount > 0) {
    console.error(`❌ [CQF 비상] 총 ${violationCount}건의 금지 표현이 UI 컴포넌트 및 정적 페이지에서 적발되었습니다. 배포를 즉각 중단합니다.`);
    process.exit(1);
  }
  console.log(`✅ [CQF 게이트] 정적 페이지 및 UI 컴포넌트(총 ${allFiles.length}개) 금지어 전수 검사 통과 (무결 확인)`);
}

function main() {
  // 0. 프롬프트 헌법 템플릿과 금지 목록 간 자기모순 기계적 검증 (CI 게이트키퍼)
  checkTemplateSelfConsistency();

  // 1. 전사 정적 페이지 및 UI 컴포넌트 금지 목록 기계적 전수 검사
  checkUIAndStaticQuality();

  if (!fs.existsSync(POSTS_DIR)) return;
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md'));
  let modifiedCount = 0;

  files.forEach((f) => {
    let fullPath = path.join(POSTS_DIR, f);
    
    // 2. 파일명 구글 SEO 표준 검사
    const standardName = normalizeFilename(f);
    if (standardName !== f) {
      const newPath = path.join(POSTS_DIR, standardName);
      fs.renameSync(fullPath, newPath);
      fullPath = newPath;
      modifiedCount++;
      console.log(`  [SEO 파일명 교정] ${f} -> ${standardName}`);
    }

    // 3. 단일 표준 엔진(SSOT) 기반 본문 및 메타데이터 무결성 검증/교정
    const rawContent = fs.readFileSync(fullPath, 'utf8');
    const result = normalizePost(rawContent);

    if (result.isChanged) {
      fs.writeFileSync(fullPath, result.fullContent, 'utf8');
      modifiedCount++;
    }
  });

  if (modifiedCount > 0) {
    console.log(`🛠️ CQF 글로벌 표준 엔진 자동 교정 완료 (적용 파일: ${modifiedCount}개).`);
  }
  console.log('✅ All blog posts passed quality checks (Rock-Solid Verified).');
}

main();
