// Cloudflare Pages Function: /api/taas-accidents
// 도로교통공단(TAAS) 교통사고 다발지역 실시간 API 연동
import taasData from './taas-standard-data.json';

// ─── 타입 정의 ────────────────────────────────────────────────────────────────

interface Coords { lat: number; lng: number; }

interface AccidentItem {
  id: string;
  locationName: string;
  occurCount: number;
  casualtyCount: number;
  deathCount: number;
  seriousCount: number;
  slightCount: number;
  latitude: number;
  longitude: number;
  isFallback: boolean; // true = 샘플 데이터, false = 실제 공공 데이터
}

// ─── 정적 데이터 로드 ─────────────────────────────────────────────────────────

const BASE_COORDS    = taasData.BASE_COORDS    as Record<string, Coords>;
const GUGUN_COORDS   = taasData.GUGUN_COORDS   as Record<string, Coords>;
const TAAS_SIDO_CODES  = taasData.TAAS_SIDO_CODES  as Record<string, string>;
const TAAS_GUGUN_CODES = taasData.TAAS_GUGUN_CODES as Record<string, Record<string, string>>;

// ─── 한국 영토 유효 좌표 범위 ─────────────────────────────────────────────────
// 위도(lat): 33.0 ~ 38.9  / 경도(lng): 124.0 ~ 132.0
const isValidKoreaCoord = (lat: number, lng: number): boolean =>
  isFinite(lat) && isFinite(lng) &&
  lat  >= 33.0 && lat  <= 38.9 &&
  lng >= 124.0 && lng <= 132.0;

// ─── 공통 JSON 응답 헬퍼 ──────────────────────────────────────────────────────

const jsonResponse = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      'Access-Control-Allow-Origin': '*',
    },
  });

// ─── API 키 미설정 / 통신 장애 시 샘플 데이터 생성기 ─────────────────────────
// 구군 중심 공식 좌표 기반, 재현 가능한 pseudo-random으로 핀포인트 분산

const getFallbackAccidents = (sidoName: string, gugunName: string): AccidentItem[] => {
  const coord = GUGUN_COORDS[gugunName] ?? BASE_COORDS[sidoName] ?? { lat: 36.5, lng: 127.7 };
  const seed  = (sidoName + gugunName).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rng   = (offset: number) => { const x = Math.sin(seed + offset) * 10000; return x - Math.floor(x); };

  return [
    {
      id: 'fallback-1',
      locationName: `${sidoName} ${gugunName} 주요 사거리 부근 (보행자 사고 다발)`,
      occurCount: Math.floor(rng(1) * 12) + 12,
      casualtyCount: Math.floor(rng(2) * 15) + 15,
      deathCount: Math.floor(rng(3) * 2),
      seriousCount: Math.floor(rng(4) * 6) + 4,
      slightCount: Math.floor(rng(5) * 8) + 6,
      latitude:  coord.lat + (rng(6)  - 0.5) * 0.015,
      longitude: coord.lng + (rng(7)  - 0.5) * 0.015,
      isFallback: true,
    },
    {
      id: 'fallback-2',
      locationName: `${sidoName} ${gugunName} 진입차선 우회도로 교차로 (이륜차 충돌 다발)`,
      occurCount: Math.floor(rng(8)  * 8)  + 8,
      casualtyCount: Math.floor(rng(9)  * 12) + 10,
      deathCount: 0,
      seriousCount: Math.floor(rng(10) * 4) + 2,
      slightCount: Math.floor(rng(11) * 8) + 4,
      latitude:  coord.lat + (rng(12) - 0.5) * 0.015,
      longitude: coord.lng + (rng(13) - 0.5) * 0.015,
      isFallback: true,
    },
    {
      id: 'fallback-3',
      locationName: `${sidoName} ${gugunName} 초등학교 어린이 보호구역 인근`,
      occurCount: Math.floor(rng(14) * 5) + 5,
      casualtyCount: Math.floor(rng(15) * 8) + 6,
      deathCount: 0,
      seriousCount: Math.floor(rng(16) * 3) + 1,
      slightCount: Math.floor(rng(17) * 5) + 3,
      latitude:  coord.lat + (rng(18) - 0.5) * 0.015,
      longitude: coord.lng + (rng(19) - 0.5) * 0.015,
      isFallback: true,
    },
  ];
};

// ─── 메인 핸들러 ──────────────────────────────────────────────────────────────

export async function onRequest(context: { request: Request; env: Record<string, string> }): Promise<Response> {
  const url  = new URL(context.request.url);
  const sido  = (url.searchParams.get('sido')  ?? '').normalize('NFC').trim();
  const gugun = (url.searchParams.get('gugun') ?? '').normalize('NFC').trim();

  if (!sido || !gugun) {
    return jsonResponse({ success: false, error: '시도 및 구군 파라미터가 누락되었습니다.' }, 400);
  }

  // 1. 지역 코드 매핑
  const codeSido = TAAS_SIDO_CODES[sido] ?? '';
  let   codeGugun = '';

  if (codeSido && TAAS_GUGUN_CODES[codeSido]) {
    const sidoGuguns = TAAS_GUGUN_CODES[codeSido];
    codeGugun = sidoGuguns[gugun] ?? '';

    // 완전 일치 실패 시 부분 일치 재시도
    if (!codeGugun) {
      const matchKey = Object.keys(sidoGuguns).find(k => gugun.includes(k) || k.includes(gugun));
      if (matchKey) codeGugun = sidoGuguns[matchKey];
    }
  }

  // 지역 코드 미발견 → 샘플 모드
  if (!codeSido || !codeGugun) {
    console.warn(`[TAAS] 지역 코드 미발견 (sido="${sido}", gugun="${gugun}") → 샘플 모드`);
    const fb1 = getFallbackAccidents(sido, gugun);
    return jsonResponse([...fb1, { _debug: { reason: 'CODE_NOT_FOUND', sido, gugun, codeSido, codeGugun } } as any]);
  }

  // 2. API 키 확인 → 미설정 시 샘플 모드
  const envKeys = Object.keys(context.env ?? {});
  const API_KEY = (context.env?.PUBLIC_DATA_API_KEY ?? '').toString();
  if (!API_KEY || API_KEY === '여기에_입력') {
    const fb2 = getFallbackAccidents(sido, gugun);
    return jsonResponse([...fb2, { _debug: { reason: 'NO_API_KEY', envKeys, hasEnv: !!context.env, keyLength: API_KEY.length } } as any]);
  }

  // 3. 실제 TAAS API 호출
  try {
    const serviceKey = API_KEY.includes('%') ? API_KEY : encodeURIComponent(API_KEY);
    const apiUrl = `https://apis.data.go.kr/B552061/frequentzoneLgrViolt/getRestFrequentzoneLgrViolt` +
      `?serviceKey=${serviceKey}&searchYearCd=2023&siDo=${codeSido}&guGun=${codeGugun}&numOfRows=10&pageNo=1&type=json`;

    const res = await fetch(apiUrl, {
      signal: AbortSignal.timeout(7000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const rawText = await res.text();

    // 인증 오류: XML 응답 반환됨
    if (rawText.trimStart().startsWith('<')) {
      const detail =
        rawText.match(/<returnAuthMsg>([^<]+)<\/returnAuthMsg>/)?.[1] ??
        rawText.match(/<returnErrMsg>([^<]+)<\/returnErrMsg>/)?.[1] ??
        rawText.match(/<errMsg>([^<]+)<\/errMsg>/)?.[1] ??
        '인증키 오류';
      throw new Error(`공공API 인증 실패: ${detail}`);
    }

    const parsed = JSON.parse(rawText);
    const items  = parsed?.response?.body?.items?.item ?? [];
    const rawList: Record<string, string>[] = Array.isArray(items) ? items : (items ? [items] : []);

    if (rawList.length === 0) {
      console.info(`[TAAS] 응답 데이터 0건 (sido=${codeSido}, gugun=${codeGugun}) → 샘플 모드`);
      return jsonResponse(getFallbackAccidents(sido, gugun));
    }

    // 시도 기본 좌표 (좌표 검증 실패 시 대체용)
    const cityCoord = BASE_COORDS[sido] ?? { lat: 36.5, lng: 127.7 };

    const cleanedData: AccidentItem[] = rawList.filter(Boolean).map((item, idx) => {
      // ✅ 공식 TAAS 필드 정의:
      //    la_crd = 위도(Latitude)  / lo_crd = 경도(Longitude)
      //    크기 비교 추측 방식을 제거하고 필드명 그대로 직접 사용
      let lat = parseFloat(item.la_crd ?? '');
      let lng = parseFloat(item.lo_crd ?? '');

      // la_crd / lo_crd 값이 없거나 비정상 → geom_json 보조 파싱 (GeoJSON 표준)
      if (!isValidKoreaCoord(lat, lng) && item.geom_json) {
        try {
          const geo    = JSON.parse(item.geom_json);
          const coords = geo?.coordinates;
          if (Array.isArray(coords)) {
            // GeoJSON 표준: coordinates = [경도, 위도]
            const pt = Array.isArray(coords[0])
              ? (Array.isArray(coords[0][0]) ? coords[0][0] : coords[0])
              : coords;
            lng = parseFloat(String(pt[0]));
            lat = parseFloat(String(pt[1]));
          }
        } catch {
          // geom_json 파싱 실패 무시
        }
      }

      // 최종 유효성 검증: 한국 영토 밖이면 시도 중심 좌표로 대체
      if (!isValidKoreaCoord(lat, lng)) {
        lat = cityCoord.lat;
        lng = cityCoord.lng;
      }

      return {
        id: `taas-${item.afFrequentzoneId ?? idx}`,
        locationName: item.spot_nm || `${sido} ${gugun} 다발구역 ${idx + 1}`,
        occurCount:   parseInt(item.occrrnc_cnt ?? '0', 10),
        casualtyCount: parseInt(item.caslt_cnt  ?? '0', 10),
        deathCount:   parseInt(item.dth_dnv_cnt ?? '0', 10),
        seriousCount: parseInt(item.se_dnv_cnt  ?? '0', 10),
        slightCount:  parseInt(item.spt_dnv_cnt ?? '0', 10),
        latitude:  lat,
        longitude: lng,
        isFallback: false, // 실제 공공 데이터
      };
    });

    // 사고 건수 내림차순 정렬, 상위 5건만 반환
    const result = cleanedData.sort((a, b) => b.occurCount - a.occurCount).slice(0, 5);
    return jsonResponse(result);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[TAAS] API 연동 오류 → 샘플 모드:', msg);
    const fb = getFallbackAccidents(sido, gugun);
    return jsonResponse([...fb, { _debug: { reason: 'API_FETCH_ERROR', error: msg, keyLength: API_KEY.length } } as any]);
  }
}
