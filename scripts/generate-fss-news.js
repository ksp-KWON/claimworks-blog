/**
 * generate-fss-news.js
 * 금감원 보도자료(소비자경보 등) 자동 수집 및 평가/업데이트 파이프라인
 */

'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');
const { getFssEvaluationPrompt } = require('../src/lib/prompt-rules.js');
const { callGemini } = require('./gemini-helper.js');

const DATA_FILE = path.join(__dirname, '../public/data/fss-consumer-data.json');
const BOARD_ID = 'B0000188'; // 금감원 보도자료 게시판

// ── 1. 금감원 게시판 스크래핑 ─────────────────────────────────────────────
function fetchFssBoard() {
  return new Promise((resolve, reject) => {
    const url = `https://www.fss.or.kr/fss/bbs/${BOARD_ID}/list.do?menuNo=200218`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const items = [];
        // 정규식으로 게시글 링크, 번호, 제목, 날짜 추출
        const rowRegex = /<td class="num">(\d+)<\/td>[\s\S]*?<a href="\.\/view\.do\?nttId=(\d+)[^>]*>([^<]+)<\/a>[\s\S]*?<td>([^<]+)<\/td>/g;
        let match;
        while ((match = rowRegex.exec(data)) !== null) {
          items.push({
            id: match[2].trim(),
            title: match[3].replace(/&middot;/g, '·').trim(),
            date: match[4].trim(),
            url: `https://www.fss.or.kr/fss/bbs/${BOARD_ID}/view.do?nttId=${match[2].trim()}&menuNo=200218`
          });
        }
        resolve(items);
      });
    }).on('error', reject);
  });
}

function fetchFssArticle(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const bodyMatch = data.match(/<div class="b-cont-box">([\s\S]*?)<\/div>/);
        if (bodyMatch) {
          // HTML 태그 제거
          let content = bodyMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          resolve(content.substring(0, 3000)); // AI 평가용으로 요약 부분만 발췌 (토큰 절약)
        } else {
          resolve('');
        }
      });
    }).on('error', reject);
  });
}

// ── 2. 메인 로직 ──────────────────────────────────────────────────────────
async function main() {
  console.log('=== 금감원 자동 업데이트 파이프라인 시작 ===');
  
  let existingData = [];
  if (fs.existsSync(DATA_FILE)) {
    existingData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  }
  const existingIds = new Set(existingData.map(d => d.id));

  const items = await fetchFssBoard();
  console.log(`[수집] 게시판 최신글 ${items.length}건 확인`);

  let newAdded = 0;

  // 최신글부터 순서대로 평가
  for (const item of items) {
    if (existingIds.has(item.id)) {
      continue; // 이미 처리된 글
    }

    console.log(`\n[검토] ${item.id} - ${item.title}`);
    const content = await fetchFssArticle(item.url);
    if (!content) {
      console.log('  -> 본문을 가져올 수 없습니다.');
      continue;
    }

    const prompt = getFssEvaluationPrompt(item.title, content);
    const schema = {
      type: 'OBJECT',
      properties: {
        thoughtProcess: { type: 'STRING', description: '생각의 사슬 서술' },
        decision: { type: 'STRING', enum: ['accept', 'reject'] },
        summary: { type: 'STRING' },
        comment: { type: 'STRING' },
        keywords: { type: 'ARRAY', items: { type: 'STRING' } }
      },
      required: ['thoughtProcess', 'decision']
    };

    try {
      const result = await callGemini(prompt, schema, 'flash');
      console.log(`  🧠 [AI 사고]: ${result.thoughtProcess}`);
      
      if (result.decision === 'accept') {
        console.log(`  ✅ [채택] ${item.title}`);
        existingData.unshift({
          id: item.id,
          title: item.title,
          date: item.date,
          url: item.url,
          summary: result.summary || '',
          comment: result.comment || '',
          keywords: result.keywords || []
        });
        newAdded++;
      } else {
        console.log(`  ❌ [기각] (블로그 성격 불일치)`);
      }
      
      // 구글 API Limit 방지
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.error(`  ⚠️ [오류] AI 평가 실패: ${err.message}`);
    }
  }

  if (newAdded > 0) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(existingData, null, 2), 'utf8');
    console.log(`\n🎉 업데이트 완료! 총 ${newAdded}건이 새로 등록되었습니다.`);
  } else {
    console.log('\n✅ 새로 업데이트할 적합한 글이 없습니다.');
  }
}

main().catch(console.error);
