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
const { BANNED_PHRASES, getUniversalSkeleton } = require('../src/lib/prompt-rules.js');

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

function getPageFiles(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      if (file === 'api' || file === 'admin' || file === 'node_modules') continue;
      results = results.concat(getPageFiles(filePath));
    } else if (file === 'page.tsx') {
      results.push(filePath);
    }
  }
  return results;
}

function checkStaticPagesQuality() {
  const pageFiles = getPageFiles(APP_DIR);
  let violationCount = 0;

  for (const filePath of pageFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);

    for (const phrase of BANNED_PHRASES) {
      if (content.includes(phrase)) {
        console.error(`❌ [CQF 게이트] 정적 페이지 금지 표현 적발: ${relativePath} -> "${phrase}"`);
        violationCount++;
      }
    }
  }

  if (violationCount > 0) {
    console.error(`❌ [CQF 비상] 총 ${violationCount}건의 금지 표현이 정적 페이지 컴포넌트에서 적발되었습니다. 배포를 즉각 중단합니다.`);
    process.exit(1);
  }
  console.log(`✅ [CQF 게이트] 정적 페이지(${pageFiles.length}개) 금지 목록 전수 검사 통과 (무결 확인)`);
}

function main() {
  // 0. 프롬프트 헌법 템플릿과 금지 목록 간 자기모순 기계적 검증 (CI 게이트키퍼)
  checkTemplateSelfConsistency();

  // 1. 전사 정적 페이지 컴포넌트(src/app/**/page.tsx) 금지 목록 기계적 전수 검사
  checkStaticPagesQuality();

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
