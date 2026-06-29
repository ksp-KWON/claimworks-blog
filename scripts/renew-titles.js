/**
 * renew-titles.js
 * Google Search Console API 연동 기반 지능형 제목 리뉴얼 봇
 */

'use strict';
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { google } = require('googleapis');
const { callGemini } = require('./gemini-helper');
const { getRenewalPrompt } = require('../src/lib/prompt-rules.js');

const IMPRESSION_THRESHOLD = 30; // 최소 노출수 기준
const CTR_THRESHOLD = 0.03;      // 클릭률(CTR) 3% 미만 타겟팅

async function getSearchConsoleData(auth, siteUrl) {
  const searchconsole = google.searchconsole({ version: 'v1', auth });
  
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  const formatDate = (date) => date.toISOString().split('T')[0];
  
  console.log(`[1/4] Search Console API 요청 중... (${formatDate(thirtyDaysAgo)} ~ ${formatDate(today)})`);
  
  try {
    const response = await searchconsole.searchanalytics.query({
      siteUrl: siteUrl,
      requestBody: {
        startDate: formatDate(thirtyDaysAgo),
        endDate: formatDate(today),
        dimensions: ['page', 'query'],
        rowLimit: 5000,
      },
    });
    return response.data.rows || [];
  } catch (err) {
    throw new Error(`Search Console API 에러: ${err.message}`);
  }
}

function analyzeAndFilterData(rows) {
  console.log(`[2/4] 수집된 데이터 분석 중... (총 ${rows.length}개 쿼리 조합)`);
  const pageStats = {};

  // 페이지별로 노출수, 클릭수, 쿼리 정보 통합
  for (const row of rows) {
    const pageUrl = row.keys[0];
    const query = row.keys[1];
    
    // 블로그 포스트 URL만 타겟팅
    if (!pageUrl.includes('/blog/')) continue;
    
    if (!pageStats[pageUrl]) {
      pageStats[pageUrl] = {
        impressions: 0,
        clicks: 0,
        queries: []
      };
    }
    
    pageStats[pageUrl].impressions += row.impressions;
    pageStats[pageUrl].clicks += row.clicks;
    pageStats[pageUrl].queries.push({
      query: query,
      impressions: row.impressions,
      clicks: row.clicks
    });
  }

  const targetPages = [];

  for (const [url, stats] of Object.entries(pageStats)) {
    const ctr = stats.clicks / stats.impressions;
    
    // 타겟팅 조건: 노출은 잘 되는데(Impressions > Threshold), 클릭을 안 함(CTR < Threshold)
    if (stats.impressions >= IMPRESSION_THRESHOLD && ctr < CTR_THRESHOLD) {
      // 가장 노출이 많이 된 핵심 쿼리 1개 추출
      stats.queries.sort((a, b) => b.impressions - a.impressions);
      const topQuery = stats.queries[0].query;
      
      const slug = url.split('/').filter(Boolean).pop();
      targetPages.push({ url, slug, ctr, impressions: stats.impressions, topQuery });
    }
  }

  return targetPages;
}

async function renewTitleForPage(target) {
  const postsDir = path.join(process.cwd(), 'src', 'content', 'posts');
  const filePath = path.join(postsDir, `${target.slug}.md`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  [스킵] 파일을 찾을 수 없습니다: ${target.slug}.md`);
    return false;
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const parsed = matter(fileContent);
  const currentTitle = parsed.data.title;
  
  console.log(`\n  [타겟 포착] 슬러그: ${target.slug}`);
  console.log(`  - 노출: ${target.impressions}회 | CTR: ${(target.ctr * 100).toFixed(1)}%`);
  console.log(`  - 핵심 검색어(Query): "${target.topQuery}"`);
  console.log(`  - 기존 제목: ${currentTitle}`);
  
  const prompt = getRenewalPrompt(currentTitle, target.topQuery);
  const rawResponse = await callGemini(prompt);
  
  let aiData;
  try {
    // 마크다운 코드 블록 제거
    const jsonStr = rawResponse.replace(/```(?:json)?\s*([\s\S]*?)\s*```/ig, '$1').trim();
    aiData = JSON.parse(jsonStr);
  } catch (e) {
    console.log(`  [실패] AI 응답 파싱 에러: ${e.message}`);
    return false;
  }

  const { newTitle, faqQ, faqA } = aiData;
  
  if (!newTitle || newTitle === currentTitle) {
    console.log(`  [유지] AI가 새 제목 생성을 스킵했거나 동일합니다.`);
    return false;
  }
  
  console.log(`  ✨ [제목 갱신] ${newTitle}`);
  console.log(`  ✨ [FAQ 추가] Q: ${faqQ}`);
  
  // 1. 기존 파일 내용에서 title 부분 정규식 교체
  let updatedContent = fileContent.replace(
    /title:\s*['"]?(.*?)['"]?(\r?\n)/,
    `title: "${newTitle}"$2`
  );
  
  // 2. 파일 끝에 FAQ 덧붙이기(Append) - 기존 레이아웃 보존
  if (faqQ && faqA) {
    const faqBlock = `\n\n## 💡 자주 묻는 질문 (FAQ)\n### Q: ${faqQ}\nA: ${faqA}\n`;
    updatedContent += faqBlock;
  }
  
  fs.writeFileSync(filePath, updatedContent, 'utf8');
  return true;
}

async function main() {
  console.log(`=== 🤖 Search Console 기반 지능형 제목 리뉴얼 봇 구동 ===`);
  
  const gcpCreds = process.env.GCP_SERVICE_ACCOUNT;
  const siteUrl = process.env.GSC_SITE_URL;
  
  if (!gcpCreds || !siteUrl) {
    console.log(`[경고] GCP_SERVICE_ACCOUNT 또는 GSC_SITE_URL 환경변수가 없습니다.`);
    console.log(`로컬 환경이거나 서비스 계정 세팅 전이므로 리뉴얼 프로세스를 스킵합니다.`);
    process.exit(0);
  }
  
  let credentials;
  try {
    credentials = JSON.parse(gcpCreds);
  } catch(e) {
    console.error(`[에러] GCP_SERVICE_ACCOUNT 환경변수가 올바른 JSON 형식이 아닙니다.`);
    process.exit(1);
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  try {
    const rows = await getSearchConsoleData(auth, siteUrl);
    
    if (rows.length === 0) {
      console.log(`[안내] 수집된 Search Console 데이터가 없습니다. 프로세스를 종료합니다.`);
      return;
    }

    const targetPages = analyzeAndFilterData(rows);
    console.log(`[3/4] 리뉴얼 타겟 선정 완료: 총 ${targetPages.length}개 포스팅`);
    
    if (targetPages.length === 0) {
      console.log(`[완료] 클릭률이 저조한 타겟 포스팅이 없습니다. 훌륭한 상태입니다!`);
      return;
    }
    
    console.log(`[4/4] AI 기반 제목 리뉴얼 및 파일 업데이트 시작...`);
    let renewedCount = 0;
    
    for (const target of targetPages) {
      const success = await renewTitleForPage(target);
      if (success) {
        renewedCount++;
        // API 리밋 방지를 위한 5초 쿨다운
        await new Promise(r => setTimeout(r, 5000));
      }
    }
    
    console.log(`\n=== 프로세스 종료 ===`);
    console.log(`총 ${targetPages.length}개 타겟 중 ${renewedCount}개의 제목 리뉴얼이 완료되었습니다.`);
    
  } catch (error) {
    console.error(`치명적 오류 발생: ${error.message}`);
    process.exit(1);
  }
}

main();
