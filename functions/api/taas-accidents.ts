// Cloudflare Pages Function: /api/taas-accidents
export async function onRequest(context: any) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const sido = url.searchParams.get('sido') || '';
    const gugun = url.searchParams.get('gugun') || '';

    if (!sido || !gugun) {
      return new Response(JSON.stringify({ success: false, error: '시도 및 구군 파라미터가 누락되었습니다.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' }
      });
    }

    // 1. 행정구역 한글명 ➡️ 법정 코드 변환 딕셔너리
    const TAAS_SIDO_CODES: Record<string, string> = {
      '서울특별시': '11', '부산광역시': '26', '대구광역시': '27', '인천광역시': '28',
      '광주광역시': '29', '대전광역시': '30', '울산광역시': '31', '세종특별자치시': '36',
      '경기도': '41', '강원특별자치도': '42', '충청북도': '43', '충청남도': '44',
      '전북특별자치도': '45', '전라남도': '46', '경상북도': '47', '경상남도': '48',
      '제주특별자치도': '49', '강원도': '42', '전라북도': '45', '제주도': '49'
    };

    // 시도 코드별 구군 사전을 구성하여 객체 내 키 중복 선언을 방지합니다.
    const TAAS_GUGUN_CODES: Record<string, Record<string, string>> = {
      // 서울 (11)
      '11': {
        '종로구': '110', '중구': '140', '용산구': '170', '성동구': '200', '광진구': '215',
        '동대문구': '230', '중랑구': '260', '성북구': '290', '강북구': '305', '도봉구': '320',
        '노원구': '350', '은평구': '380', '서대문구': '410', '마포구': '440', '양천구': '470',
        '강서구': '500', '구로구': '530', '금천구': '545', '영등포구': '560', '동작구': '590',
        '관악구': '620', '서초구': '650', '강남구': '680', '송파구': '710', '강동구': '740'
      },
      // 부산 (26)
      '26': {
        '중구': '140', '서구': '140', '동구': '170', '영도구': '200', '부산진구': '230', '동래구': '260',
        '남구': '290', '북구': '320', '해운대구': '350', '사하구': '380', '금정구': '410',
        '강서구': '440', '연제구': '470', '수영구': '500', '사상구': '530', '기장군': '710'
      },
      // 대구 (27)
      '27': {
        '중구': '140', '동구': '170', '서구': '200', '남구': '220', '북구': '230', '수성구': '260', '달서구': '290', '달성군': '710', '군위군': '720'
      },
      // 인천 (28)
      '28': {
        '중구': '140', '동구': '160', '미추홀구': '177', '연수구': '185', '남동구': '200', '부평구': '237', '계양구': '245', '서구': '260', '강화군': '710', '옹진군': '720'
      },
      // 광주 (29)
      '29': {
        '동구': '110', '서구': '140', '남구': '150', '북구': '170', '광산구': '200'
      },
      // 대전 (30)
      '30': {
        '동구': '110', '중구': '140', '서구': '170', '유성구': '200', '대덕구': '230'
      },
      // 울산 (31)
      '31': {
        '중구': '110', '남구': '140', '동구': '170', '북구': '200', '울주군': '710'
      },
      // 세종 (36)
      '36': {
        '세종특별자치시': '110', '세종시': '110'
      },
      // 경기 (41)
      '41': {
        '수원시': '110', '수원시장안구': '111', '수원시권선구': '113', '수원시팔달구': '115', '수원시영통구': '117',
        '성남시': '130', '성남시수정구': '131', '성남시중원구': '133', '성남시분당구': '135',
        '의정부시': '150', '안양시': '170', '안양시만안구': '171', '안양시동안구': '173',
        '부천시': '190', '광명시': '210', '평택시': '220', '동두천시': '250',
        '안산시': '270', '안산시상록구': '271', '안산시단원구': '273',
        '고양시': '280', '고양시덕양구': '281', '고양시일산동구': '285', '고양시일산서구': '287',
        '과천시': '290', '구리시': '310', '남양주시': '360', '오산시': '370',
        '시흥시': '390', '군포시': '410', '의왕시': '430', '하남시': '450',
        '용인시': '460', '용인시처인구': '461', '용인시기흥구': '463', '용인시수지구': '465',
        '파주시': '480', '이천시': '500', '안성시': '550', '김포시': '570',
        '화성시': '590', '광주시': '610', '양주시': '630', '포천시': '650',
        '여주시': '670', '연천군': '800', '가평군': '820', '양평군': '830'
      },
      // 강원 (42)
      '42': {
        '춘천시': '110', '원주시': '130', '강릉시': '150', '동해시': '170', '태백시': '190',
        '속초시': '210', '삼척시': '230', '홍천군': '720', '횡성군': '730', '영월군': '750',
        '평창군': '760', '정선군': '770', '철원군': '780', '화천군': '790', '양구군': '800',
        '인제군': '810', '고성군': '820', '양양군': '830'
      },
      // 충북 (43)
      '43': {
        '청주시': '110', '청주시상당구': '111', '청주시서원구': '112', '청주시흥덕구': '113', '청주시청원구': '114',
        '충주시': '130', '제천시': '150', '보은군': '720', '옥천군': '730', '영동군': '740',
        '증평군': '745', '진천군': '750', '괴산군': '760', '음성군': '770', '단양군': '800'
      },
      // 충남 (44)
      '44': {
        '천안시': '130', '천안시동남구': '131', '천안시서북구': '133',
        '공주시': '150', '보령시': '180', '아산시': '200', '서산시': '210', '논산시': '230',
        '계룡시': '250', '당진시': '270', '금산군': '710', '부여군': '760', '서천군': '770',
        '청양군': '790', '홍성군': '800', '예산군': '810', '태안군': '825'
      },
      // 전북 (45)
      '45': {
        '전주시': '110', '전주시완산구': '111', '전주시덕진구': '113',
        '군산시': '130', '익산시': '140', '정읍시': '180', '남원시': '190', '김제시': '210',
        '완주군': '710', '진안군': '720', '무주군': '730', '장수군': '740', '임실군': '750',
        '순창군': '760', '고창군': '790', '부안군': '800'
      },
      // 전남 (46)
      '46': {
        '목포시': '110', '여수시': '130', '순천시': '150', '나주시': '200', '광양시': '230',
        '담양군': '710', '곡성군': '720', '구례군': '730', '고흥군': '770', '보성군': '780',
        '화순군': '790', '장흥군': '810', '강진군': '820', '해남군': '830', '영암군': '840',
        '무안군': '870', '함평군': '890', '영광군': '900', '장성군': '910', '완도군': '930',
        '진도군': '940', '신안군': '950'
      },
      // 경북 (47)
      '47': {
        '포항시': '110', '포항시남구': '111', '포항시북구': '113',
        '경주시': '130', '김천시': '150', '안동시': '170', '구미시': '190', '영주시': '210',
        '영천시': '230', '상주시': '250', '문경시': '280', '경산시': '290', '의성군': '730',
        '청송군': '750', '영양군': '760', '영덕군': '770', '청도군': '820', '고령군': '830',
        '성주군': '840', '칠곡군': '850', '예천군': '900', '봉화군': '920', '울진군': '930',
        '울릉군': '940'
      },
      // 경남 (48)
      '48': {
        '창원시': '120', '창원시의창구': '121', '창원시성산구': '123', '창원시마산합포구': '125', '창원시마산회원구': '127', '창원시진해구': '129',
        '진주시': '170', '통영시': '220', '사천시': '240', '김해시': '250', '밀양시': '270',
        '거제시': '310', '양산시': '330', '의령군': '720', '함안군': '730', '창녕군': '740',
        '고성군': '820', '남해군': '840', '하동군': '850', '산청군': '860', '함양군': '870',
        '거창군': '880', '합천군': '890'
      },
      // 제주 (49)
      '49': {
        '제주시': '110', '서귀포시': '130'
      }
    };

    const codeSido = TAAS_SIDO_CODES[sido];
    let codeGugun = '';

    if (codeSido && TAAS_GUGUN_CODES[codeSido]) {
      const sidoGuguns = TAAS_GUGUN_CODES[codeSido];
      codeGugun = sidoGuguns[gugun];

      // 부분 매칭 방어 (예: '수원시' 검색 시 '수원시' 또는 쪼개진 구 단위 매칭)
      if (!codeGugun) {
        const matchKey = Object.keys(sidoGuguns).find(k => gugun.includes(k) || k.includes(gugun));
        if (matchKey) {
          codeGugun = sidoGuguns[matchKey];
        }
      }
    }

    if (!codeSido || !codeGugun) {
      console.warn(`  ⚠️ 행정동 코드 매핑 실패: ${sido} ${gugun} -> 경기도 의정부시 대체`);
    }

    const finalSido = codeSido || '41';
    const finalGugun = codeGugun || '150';

    // 2. 도로교통공단 사고다발지역 OpenAPI 호출
    const API_KEY = env.PUBLIC_DATA_API_KEY;
    if (!API_KEY) {
      throw new Error('서버 인증키(PUBLIC_DATA_API_KEY)가 주입되지 않았습니다.');
    }

    const taasUrl = `https://apis.data.go.kr/B552061/frequentzoneLg/getRestFrequentzoneLg?serviceKey=${encodeURIComponent(API_KEY)}&searchYearCd=2024&siDo=${finalSido}&guGun=${finalGugun}&_type=json`;

    const taasRes = await fetch(taasUrl, { signal: AbortSignal.timeout(10000) });
    if (!taasRes.ok) {
      throw new Error(`도로교통공단 API 연결 실패 (HTTP ${taasRes.status})`);
    }

    const taasData: any = await taasRes.json();
    const items = taasData?.response?.body?.items?.item || [];
    const rawList = Array.isArray(items) ? items : [items];

    // 3. 도로교통공단 데이터 정제 가공
    const cleanedData = rawList.filter(Boolean).map((item: any, idx: number) => {
      const rawCenter = item.geom_json ? JSON.parse(item.geom_json) : null;
      let lat = 37.7381; // 기본값
      let lng = 127.0337; // 기본값

      if (rawCenter && rawCenter.coordinates) {
        const coords = rawCenter.coordinates;
        if (Array.isArray(coords[0])) {
          if (Array.isArray(coords[0][0])) {
            lng = coords[0][0][0];
            lat = coords[0][0][1];
          } else {
            lng = coords[0][0];
            lat = coords[0][1];
          }
        } else {
          lng = coords[0];
          lat = coords[1];
        }
      }

      if (lat < 30 || lat > 45) lat = 37.7381;
      if (lng < 120 || lng > 135) lng = 127.0337;

      return {
        id: `taas-${item.afFrequentzoneId || idx}`,
        locationName: item.spot_nm || `${sido} ${gugun} 다발구역`,
        occurCount: parseInt(item.occrrnc_cnt || '0', 10),
        casualtyCount: parseInt(item.caslt_cnt || '0', 10),
        deathCount: parseInt(item.dth_dnv_cnt || '0', 10),
        seriousCount: parseInt(item.se_dnv_cnt || '0', 10),
        slightCount: parseInt(item.spt_dnv_cnt || '0', 10),
        latitude: lat,
        longitude: lng
      };
    });

    const sortedData = cleanedData.sort((a, b) => b.occurCount - a.occurCount).slice(0, 5);

    return new Response(JSON.stringify(sortedData), {
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: any) {
    console.error(error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || '교통안전 API 처리 중 오류 발생' }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json;charset=UTF-8',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}
