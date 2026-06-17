// scripts/test-law-api.js
// 법제처 API 연동 상태 및 공인 IP 검증용 진단 도구 (Node.js 24+ 내장 fetch 사용)

async function runDiagnostic() {
  console.log('=== 🔍 법제처 API 연동 진단 시작 ===\n');

  // 1. 내 컴퓨터의 현재 공인 IP 확인
  let myPublicIp = '';
  try {
    const ipRes = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipRes.json();
    myPublicIp = ipData.ip;
    console.log(`[1] 내 컴퓨터의 현재 공인 IP: ${myPublicIp}`);
    console.log(`    👉 이 주소(${myPublicIp})가 법제처 오픈API 관리자 화면 마이페이지에 '호출 IP'로 정확히 등록되어 있어야 합니다.`);
  } catch (err) {
    console.log('[-] 공인 IP 확인 실패:', err.message);
  }

  // 2. 법제처 API 호출 테스트 (인증키: ksp78)
  const OC = 'ksp78';
  const query = '보험';
  const testUrl = `https://www.law.go.kr/DRF/lawSearch.do?target=prec&type=XML&OC=${OC}&search=2&query=${encodeURIComponent(query)}`;
  
  console.log(`\n[2] 법제처 API 호출 시도... (인증키: ${OC})`);
  console.log(`    호출 URL: ${testUrl}`);

  try {
    const res = await fetch(testUrl);
    if (!res.ok) {
      console.log(`[-] API 서버 응답 실패: HTTP ${res.status}`);
      return;
    }

    const xml = await res.text();
    console.log('\n[3] 법제처 API 응답 결과 (처음 300자):');
    console.log('--------------------------------------------------');
    console.log(xml.slice(0, 300));
    console.log('--------------------------------------------------');

    if (xml.includes('사용자 정보 검증에 실패하였습니다')) {
      console.log('\n❌ [진단 결과] 인증 실패!');
      console.log(`   원인: 법제처 관리자 페이지에 등록된 IP와 현재 요청한 IP(${myPublicIp})가 일치하지 않습니다.`);
      console.log('   조치 방법: https://www.law.go.kr 오픈API 센터에 로그인하셔서 [인증키 수정]을 누르고');
      console.log(`            호출 IP 목록에 [ ${myPublicIp} ] 주소를 추가한 뒤 저장해 주세요.`);
      console.log('            (※ 등록 후 실제 반영되기까지 법제처 서버 사정에 따라 30분~1시간 정도 소요될 수 있습니다.)');
    } else if (xml.includes('판례일련번호') || xml.includes('사건명')) {
      console.log('\n✅ [진단 결과] 연동 성공!');
      console.log('   인증키와 IP 매칭이 정상적이며 데이터를 정상적으로 수신하고 있습니다.');
    } else {
      console.log('\n⚠️ [진단 결과] 특이 응답 수신');
      console.log('   인증 에러는 없으나 판례 결과가 비어있거나 다른 형식의 응답입니다. 법제처 서버 상태를 확인해 보세요.');
    }

  } catch (err) {
    console.log('[-] API 호출 중 네트워크 오류 발생:', err.message);
  }
}

runDiagnostic();
