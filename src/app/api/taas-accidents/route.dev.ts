/**
 * 로컬 개발(npm run dev) 전용 API Route
 * ─────────────────────────────────────────────
 * 파일명: route.dev.ts  (확장자 .dev.ts)
 * next.config.ts의 pageExtensions 설정에 따라:
 *   - 개발 환경(NODE_ENV=development): .dev.ts 포함 → 이 파일 활성화
 *   - 프로덕션 빌드(npm run build): .dev.ts 제외 → 이 파일 완전 무시
 * 프로덕션에서는 /functions/api/taas-accidents.ts (Cloudflare Pages Function)이 작동합니다.
 */

import { NextResponse } from 'next/server';
import taasData from '../../../../functions/api/taas-standard-data.json';

export const dynamic = 'force-dynamic';

interface Coords { lat: number; lng: number; }
const BASE_COORDS = taasData.BASE_COORDS as Record<string, Coords>;
const TAAS_SIDO_CODES = taasData.TAAS_SIDO_CODES as Record<string, string>;
const TAAS_GUGUN_CODES = taasData.TAAS_GUGUN_CODES as Record<string, Record<string, string>>;

/** API 키 없거나 외부 API 장애 시 지역별 대체 데이터 생성 */
function getFallbackAccidents(sidoName: string, gugunName: string) {
  const coord = BASE_COORDS[sidoName] ?? { lat: 37.7381, lng: 127.0337 };
  const nameSeed = (sidoName + gugunName)
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const rng = (seed: number, offset: number) => {
    const x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x);
  };

  return [
    {
      id: 'fallback-1',
      locationName: `${gugunName} 주요 사거리 부근 (보행자 사고 다발)`,
      occurCount:   Math.floor(rng(nameSeed, 1) * 12) + 12,
      casualtyCount:Math.floor(rng(nameSeed, 2) * 15) + 15,
      deathCount:   Math.floor(rng(nameSeed, 3) * 2),
      seriousCount: Math.floor(rng(nameSeed, 4) * 6) + 4,
      slightCount:  Math.floor(rng(nameSeed, 5) * 8) + 6,
      latitude:  coord.lat + (rng(nameSeed, 6)  - 0.5) * 0.012,
      longitude: coord.lng + (rng(nameSeed, 7)  - 0.5) * 0.012,
    },
    {
      id: 'fallback-2',
      locationName: `${gugunName} 우회도로 교차로 (이륜차 충돌 다발)`,
      occurCount:   Math.floor(rng(nameSeed, 8)  * 8)  + 8,
      casualtyCount:Math.floor(rng(nameSeed, 9)  * 12) + 10,
      deathCount:   0,
      seriousCount: Math.floor(rng(nameSeed, 10) * 4)  + 2,
      slightCount:  Math.floor(rng(nameSeed, 11) * 8)  + 4,
      latitude:  coord.lat + (rng(nameSeed, 12) - 0.5) * 0.012,
      longitude: coord.lng + (rng(nameSeed, 13) - 0.5) * 0.012,
    },
    {
      id: 'fallback-3',
      locationName: `${gugunName} 어린이 보호구역 인근 (스쿨존 사고 다발)`,
      occurCount:   Math.floor(rng(nameSeed, 14) * 5) + 5,
      casualtyCount:Math.floor(rng(nameSeed, 15) * 8) + 6,
      deathCount:   0,
      seriousCount: Math.floor(rng(nameSeed, 16) * 3) + 1,
      slightCount:  Math.floor(rng(nameSeed, 17) * 5) + 3,
      latitude:  coord.lat + (rng(nameSeed, 18) - 0.5) * 0.012,
      longitude: coord.lng + (rng(nameSeed, 19) - 0.5) * 0.012,
    },
  ];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sido  = (searchParams.get('sido')  ?? '경기도').normalize('NFC');
  const gugun = (searchParams.get('gugun') ?? '의정부시').normalize('NFC');

  try {
    const codeSido = TAAS_SIDO_CODES[sido];
    let codeGugun = '';

    if (codeSido && TAAS_GUGUN_CODES[codeSido]) {
      const guguns = TAAS_GUGUN_CODES[codeSido];
      codeGugun = guguns[gugun] ?? '';
      if (!codeGugun) {
        const matchKey = Object.keys(guguns).find(k => gugun.includes(k) || k.includes(gugun));
        if (matchKey) codeGugun = guguns[matchKey];
      }
    }

    const API_KEY = process.env.PUBLIC_DATA_API_KEY;
    if (!API_KEY || API_KEY === '여기에_입력') {
      console.warn('[Local Dev] PUBLIC_DATA_API_KEY 없음 → fallback 데이터 반환');
      return NextResponse.json(getFallbackAccidents(sido, gugun));
    }

    const finalSido  = codeSido  || '41';
    const finalGugun = codeGugun || '150';
    const serviceKey = API_KEY.includes('%') ? API_KEY : encodeURIComponent(API_KEY);
    const apiUrl = `https://apis.data.go.kr/B552061/frequentzoneLg/getRestFrequentzoneLg?serviceKey=${serviceKey}&searchYearCd=2024&siDo=${finalSido}&guGun=${finalGugun}&_type=json`;

    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) throw new Error(`외부 API HTTP ${res.status}`);

    const text = await res.text();
    if (text.trim().startsWith('<')) throw new Error('공공 API 인증 오류');

    const json = JSON.parse(text);
    const items = json?.response?.body?.items?.item ?? [];
    const list: any[] = Array.isArray(items) ? items : [items];

    if (!list.length || !list[0]) {
      return NextResponse.json(getFallbackAccidents(sido, gugun));
    }

    const cityCoord = BASE_COORDS[sido] ?? { lat: 37.7381, lng: 127.0337 };
    const data = list.filter(Boolean).map((item: any, idx: number) => {
      let lat = cityCoord.lat, lng = cityCoord.lng;

      if (item.la_crd && item.lo_crd) {
        const v1 = parseFloat(item.la_crd), v2 = parseFloat(item.lo_crd);
        if (!isNaN(v1) && !isNaN(v2)) [lat, lng] = v1 > v2 ? [v2, v1] : [v1, v2];
      } else if (item.geom_json) {
        try {
          const geo = JSON.parse(item.geom_json)?.coordinates;
          if (geo) {
            const pt = Array.isArray(geo[0]) ? (Array.isArray(geo[0][0]) ? geo[0][0] : geo[0]) : geo;
            [lng, lat] = [pt[0], pt[1]];
          }
        } catch { /* ignore parse error */ }
      }

      if (lat < 30 || lat > 45) lat = cityCoord.lat;
      if (lng < 120 || lng > 135) lng = cityCoord.lng;

      return {
        id: `taas-${item.afFrequentzoneId || idx}`,
        locationName: item.spot_nm || `${sido} ${gugun} 다발구역`,
        occurCount:   parseInt(item.occrrnc_cnt || '0', 10),
        casualtyCount:parseInt(item.caslt_cnt   || '0', 10),
        deathCount:   parseInt(item.dth_dnv_cnt || '0', 10),
        seriousCount: parseInt(item.se_dnv_cnt  || '0', 10),
        slightCount:  parseInt(item.spt_dnv_cnt || '0', 10),
        latitude: lat,
        longitude: lng,
      };
    });

    return NextResponse.json(
      data.sort((a, b) => b.occurCount - a.occurCount).slice(0, 5)
    );
  } catch (err: any) {
    console.error('[Local Dev] TAAS 장애:', err?.message);
    return NextResponse.json(getFallbackAccidents(sido, gugun));
  }
}
