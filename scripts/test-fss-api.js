const authKey = 'c610644d50a0105dbb158d26a6fb3834';
const url = `https://www.fss.or.kr/fss/kr/openApi/api/bodoInfo.jsp?apiType=json&startDate=2024-06-01&endDate=2024-06-20&authKey=${authKey}`;

fetch(url)
  .then(res => res.arrayBuffer())
  .then(buffer => {
    // EUC-KR 한글 디코더 적용
    const decoder = new TextDecoder('euc-kr');
    const text = decoder.decode(buffer);
    
    console.log("=== EUC-KR -> UTF-8 한글 복원 성공 ===");
    // 파싱 테스트
    const data = JSON.parse(text);
    const firstResult = data.reponse.result[0];
    
    console.log("1. 보도자료 제목:", firstResult.subject);
    console.log("2. 보도자료 요약 내용:\n", firstResult.contentKor);
    console.log("3. 첨부파일 다운로드 링크:", firstResult.atchfileUrl);
  })
  .catch(err => console.error("오류:", err));
