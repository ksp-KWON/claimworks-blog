/**
 * fetch-precedent.js
 * 법제처 국가법령정보 공동활용 API를 통한 판례 수집 및 분석 시범 스크립트
 */

'use strict';
const fs = require('fs');
const path = require('path');

// ── 환경변수 로드 (.env.local) ──────────────────────────────────────────────
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)?\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = (m[2] ?? '').replace(/(^['"]|['"]$)/g, '').trim();
    }
  });
}

const LAW_API_KEY = process.env.LAW_API_KEY; // 법제처에서 발급받은 인증키

// XML에서 특정 태그 안의 내용을 추출하는 초간단 유틸 (라이브러리 설치 최소화 - 로딩 속도 최적화)
function getXmlTagContent(xml, tag) {
  const regex = new RegExp(`<${tag}>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*?))</${tag}>`);
  const match = xml.match(regex);
  return match ? (match[1] || match[2] || '').trim() : '';
}

// XML에서 특정 태그 목록 전체를 추출하는 유틸 (판례 일련번호 목록 추출용)
function getXmlTags(xml, tag) {
  const regex = new RegExp(`<${tag}>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*?))</${tag}>`, 'g');
  const results = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    results.push((match[1] || match[2] || '').trim());
  }
  return results;
}

// ── 1. 판례 검색 (목록 가져오기) ──────────────────────────────────────────────
async function searchPrecedents(query) {
  if (!LAW_API_KEY) {
    throw new Error('.env.local 파일에 LAW_API_KEY를 설정해 주세요.');
  }

  // 검색 결과 목록 조회 API URL (HTTPS 권장)
  const url = `https://www.law.go.kr/DRF/lawSearch.do?target=prec&type=XML&OC=${LAW_API_KEY}&search=2&query=${encodeURIComponent(query)}`;
  console.log(`[1] 판례 검색 중... (URL: ${url.replace(LAW_API_KEY, '***')})`);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`목록 조회 실패: HTTP ${res.status}`);
  
  const xml = await res.text();
  console.log('--- RAW XML ---');
  console.log(xml.slice(0, 800));
  console.log('---------------');
  
  // 판례정보일련번호 태그들 추출
  const ids = getXmlTags(xml, '판례정보일련번호');
  const titles = getXmlTags(xml, '사건명');
  const caseNos = getXmlTags(xml, '사건번호');

  const list = ids.map((id, index) => ({
    id,
    title: titles[index],
    caseNo: caseNos[index],
  }));

  console.log(`    검색 결과 ${list.length}개의 판례를 찾았습니다.`);
  return list;
}

// ── 2. 특정 판례 상세 본문 가져오기 ───────────────────────────────────────────
async function getPrecedentDetail(id) {
  // 판례 상세 본문 조회 API URL
  const url = `http://www.law.go.kr/DRF/lawService.do?target=prec&type=XML&OC=${LAW_API_KEY}&ID=${id}`;
  console.log(`[2] 상세 판례 데이터 조회 중... (판례 ID: ${id})`);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`상세 조회 실패: HTTP ${res.status}`);
  
  const xml = await res.text();

  return {
    id,
    caseName: getXmlTagContent(xml, '사건명'),
    caseNo: getXmlTagContent(xml, '사건번호'),
    judgmentDate: getXmlTagContent(xml, '선고일자'),
    courtName: getXmlTagContent(xml, '법원명'),
    judgmentSummary: getXmlTagContent(xml, '판결요지'),
    caseContent: getXmlTagContent(xml, '판례내용'),
  };
}

// ── 메인 실행 테스트 ────────────────────────────────────────────────────────
async function main() {
  if (!LAW_API_KEY) {
    console.log('\n[알림] 아직 법제처 API 키(LAW_API_KEY)가 등록되지 않았습니다.');
    console.log('가이드 문서에 적힌 단계에 따라 API 신청 후 .env.local 파일에 키를 입력하고 실행해 주세요!\n');
    return;
  }

  try {
    // 예시 키워드: '보험금' 관련 판례 검색
    const list = await searchPrecedents('보험금');
    if (list.length === 0) {
      console.log('검색된 판례가 없습니다.');
      return;
    }

    // 첫 번째 판례 상세정보 조회해보기
    const firstCase = list[0];
    const detail = await getPrecedentDetail(firstCase.id);

    console.log('\n=== [수집 완료 테스트 결과] ===');
    console.log(`법원/사건명: ${detail.courtName} - ${detail.caseName}`);
    console.log(`사건번호: ${detail.caseNo}`);
    console.log(`선고일자: ${detail.judgmentDate}`);
    console.log(`판결요지 (앞부분): ${detail.judgmentSummary.slice(0, 200)}...`);
    console.log('===============================\n');
    console.log('성공적으로 데이터를 가져왔습니다. 이제 이 텍스트를 제미나이에 넘겨 친절한 블로그 포스팅으로 전환할 수 있습니다.');
  } catch (err) {
    console.error(`수집 실패: ${err.message}`);
  }
}

main();
