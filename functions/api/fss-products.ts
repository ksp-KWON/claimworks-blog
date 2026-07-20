// Cloudflare Pages Function: /api/fss-products
// 대표님이 제공하신 금감원 인증키를 사용하여 금융상품통합비교공시 API를 실시간 호출하며,
// 오류 발생 시 자체 내장된 대체 데이터베이스로 자동 전환되는 '무장애(Error-Zero)' 하이브리드 API입니다.

export async function onRequest(context: any) {
  try {
    const { request } = context;
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'annuity'; // 'annuity' (연금저축) 또는 'deposit' (예금)

    const API_KEY = 'c610644d50a0105dbb158d26a6fb3834'; // 대표님께서 부여하신 금감원 인증키
    let fssUrl = '';

    if (type === 'deposit') {
      // 은행(020000) 정기예금 상품 비교 조회
      fssUrl = `https://finlife.fss.or.kr/finlifeapi/depositProductsSearch.json?auth=${API_KEY}&topFinGrpNo=020000&pageNo=1`;
    } else {
      // 보험사(050000) 연금저축 상품 비교 조회 (보상스쿨 보험업종 특화)
      fssUrl = `https://finlife.fss.or.kr/finlifeapi/annuitySavingProductsSearch.json?auth=${API_KEY}&topFinGrpNo=050000&pageNo=1`;
    }

    try {
      // 1. 금감원 실시간 공식 API 호출 (5초 타임아웃 제한 적용)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const fssResponse = await fetch(fssUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (fssResponse.ok) {
        const data: any = await fssResponse.json();
        
        // 금감원 API는 성공 시 err_code가 "000"입니다.
        if (data.result && data.result.err_code === '000') {
          const rawList = data.result.baseList || [];
          
          // 프론트엔드 맞춤형 표준 데이터 규격으로 매핑
          const formattedList = rawList.map((item: any) => ({
            kor_co_nm: item.kor_co_nm || '금융기관',
            fin_prdt_nm: item.fin_prdt_nm || '금융상품',
            join_way: item.join_way || '인터넷/지점',
            pnsn_recp_trm_nm: item.pnsn_recp_trm_nm || item.mtrt_int || '별도 고시', // 예금은 mtrt_int
            pnsn_entr_age_nm: item.pnsn_entr_age_nm || item.spcl_cnd || '제한 없음', // 예금은 spcl_cnd
            mon_pay_atm_nm: item.mon_pay_atm_nm || (data.result.optionList?.find((o: any) => o.fin_prdt_cd === item.fin_prdt_cd)?.intr_rate + '%') || '상세 보기 참조' // 예금은 금리 매핑
          }));

          return new Response(JSON.stringify({
            success: true,
            isRealTime: true,
            message: '금감원 공식 실시간 API 연동 성공',
            products: formattedList
          }), {
            headers: { 'Content-Type': 'application/json;charset=UTF-8', 'Access-Control-Allow-Origin': '*' }
          });
        } else {
          console.warn(`금감원 API 반환 에러: ${data.result?.err_msg || '알 수 없는 코드'}`);
        }
      }
    } catch (apiError: any) {
      console.error('금감원 실시간 API 호출 실패:', apiError.message);
    }

    // 2. [무장애 폴백] 실시간 API 실패 또는 인증키 에러 시, 로컬 고품질 데이터베이스(fallback)에서 반환
    const fallbackUrl = new URL('/data/fss-fallback-products.json', request.url);
    const fallbackResponse = await fetch(fallbackUrl.toString());
    
    if (!fallbackResponse.ok) {
      throw new Error('내부 대체 상품 데이터베이스를 불러오지 못했습니다.');
    }

    const fallbackData = await fallbackResponse.json();
    const fallbackList = fallbackData[type] || [];

    // 폴백 데이터를 표준 규격으로 매핑
    const formattedFallbackList = fallbackList.map((item: any) => ({
      kor_co_nm: item.kor_co_nm,
      fin_prdt_nm: item.fin_prdt_nm,
      join_way: item.join_way,
      pnsn_recp_trm_nm: item.pnsn_recp_trm_nm || item.mtrt_int || '별도 고시',
      pnsn_entr_age_nm: item.pnsn_entr_age_nm || item.spcl_cnd || '제한 없음',
      mon_pay_atm_nm: item.mon_pay_atm_nm || item.intr_rate || '상세 참조'
    }));

    return new Response(JSON.stringify({
      success: true,
      isRealTime: false,
      message: '금감원 API 점검 중 (안전한 보상스쿨 대체 데이터가 표시됩니다)',
      products: formattedFallbackList
    }), {
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json;charset=UTF-8', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
